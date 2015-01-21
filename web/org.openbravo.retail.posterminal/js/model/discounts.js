/*
 ************************************************************************************
 * Copyright (C) 2012-2014 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, Backbone, _ */

(function () {
  // Because of problems with module dependencies, it is possible this object to already
  // be defined with some rules.
  var alreadyDefinedRules = (OB && OB.Model && OB.Model.Discounts && OB.Model.Discounts.discountRules) || {},
      onLoadActions = (OB && OB.Model && OB.Model.Discounts && OB.Model.Discounts.onLoadActions) || [],
      i;

  OB.Model.Discounts = {
    discountRules: alreadyDefinedRules,
    executor: new OB.Model.DiscountsExecutor(),
    preventApplyPromotions: false,
    applyPromotionsTimeout: {},
    applyPromotions: function (receipt, line) {
      // if the discount algorithm already started, stop pending computations...
      this.executor.removeGroup('discounts');
      // ... and start over
      this.applyPromotionsLat(receipt, line);
    },
    applyPromotionsLat: function (receipt, line) {
      var me = this,
          grossCalculated = false;
      if (receipt.get('skipApplyPromotions') || this.preventApplyPromotions) {
        return;
      }

      if (OB.MobileApp.model.hasPermission('OBPOS_discount.newFlow', true)) {
        var auxReceipt = new OB.Model.Order(),
            auxLine, hasPromotions, oldLines, oldLines2, actualLines, auxReceipt2, isFirstExecution = true;
        auxReceipt.clearWith(receipt);
        auxReceipt.groupLinesByProduct();
        me.auxReceiptInExecution = auxReceipt;
        auxReceipt.on('discountsApplied', function () {
          // to avoid several calls to applyPromotions, only will be applied the changes to original receipt for the last call done to applyPromotion
          // so if the auxReceipt is distinct of the last auxReceipt created (last call) then nothing is done
          if (me.auxReceiptInExecution !== auxReceipt) {
            return;
          }

          var continueApplyPromotions = true;

          // replace the promotions with applyNext that they were applied previously
          auxReceipt.removePromotionsCascadeApplied();

          // check if the order lines have changed in the last execution of applyPromotions
          // if they didn't changed, then stop
          if (!OB.UTIL.isNullOrUndefined(oldLines) && oldLines.size() > 0) {
            isFirstExecution = false;
            oldLines2 = new Backbone.Collection();
            oldLines.forEach(function (ol) {
              oldLines2.push(ol);
            });

            oldLines2.forEach(function (ol) {
              for (i = 0; i < auxReceipt.get('lines').size(); i++) {
                if (auxReceipt.isSimilarLine(ol, auxReceipt.get('lines').at(i))) {
                  oldLines.remove(ol);
                  break;
                }
              }
            });

            if (oldLines.length === 0) {
              continueApplyPromotions = false;
            }
          } else if (!OB.UTIL.isNullOrUndefined(oldLines) && oldLines.size() === 0 && !isFirstExecution) {
            continueApplyPromotions = false;
          }

          if (continueApplyPromotions) {
            receipt.fillPromotionsWith(auxReceipt, isFirstExecution);
            if (auxReceipt.hasPromotions()) {
              auxReceipt.removeQtyOffer();
              auxReceipt.removeLinesWithoutPromotions();
              if (auxReceipt.get('lines').length > 0) {
                oldLines = new Backbone.Collection();
                auxReceipt.get('lines').forEach(function (l) {
                  oldLines.push(l.clone());
                });
                me.applyPromotionsImp(auxReceipt, undefined, true);
              } else {
                receipt.trigger('applyPromotionsFinished');
                if (!grossCalculated) {
                  receipt.calculateGross();
                  grossCalculated = true;
                }
              }
            } else {
              receipt.trigger('applyPromotionsFinished');
              if (!grossCalculated) {
                receipt.calculateGross();
                grossCalculated = true;
              }
            }

          } else {
            receipt.trigger('applyPromotionsFinished');
            if (!grossCalculated) {
              receipt.calculateGross();
              grossCalculated = true;
            }
          }
        });

        if (line) {
          auxLine = _.filter(auxReceipt.get('lines').models, function (l) {
            if (l !== line && l.get('product').id === line.get('product').id && l.get('price') === line.get('price') && l.get('qty') === line.get('qty')) {
              return l;
            }
          });
        }

        // if preventApplyPromotions then the promotions will not be deleted, because they will not be recalculated
        if (!this.preventApplyPromotions) {
          var manualPromotions;
          _.each(auxReceipt.get('lines').models, function (line) {
            manualPromotions = _.filter(line.get('promotions'), function (p) {
              return p.manual === true;
            }) || [];

            line.set('promotions', []);
            line.set('promotionCandidates', []);
            _.forEach(manualPromotions, function (promo) {
              var promotion = {
                rule: new Backbone.Model(promo),

                definition: {
                  userAmt: promo.userAmt,
                  applyNext: promo.applyNext,
                  lastApplied: promo.lastApplied
                },
                alreadyCalculated: true // to prevent loops
              };
              OB.Model.Discounts.addManualPromotion(auxReceipt, [line], promotion);
            });

          });

          _.each(receipt.get('lines').models, function (line) {
            line.set('promotions', []);
            line.set('promotionCandidates', []);
          });
        }
        this.applyPromotionsImp(auxReceipt, null, true);
      } else {
        this.applyPromotionsImp(receipt, line, false);
      }
    },

    applyPromotionsImp: function (receipt, line, skipSave) {
      var lines;
      if (this.preventApplyPromotions) {
        return;
      }

      if (receipt && (!receipt.get('isEditable') || (!OB.UTIL.isNullOrUndefined(receipt.get('isNewReceipt')) && receipt.get('isNewReceipt')))) {
        return;
      }

      if (line) {
        this.executor.addEvent(new Backbone.Model({
          id: line.cid,
          groupId: 'discounts',
          receipt: receipt,
          line: line,
          skipSave: skipSave
        }), true);
      } else {
        lines = _.sortBy(receipt.get('lines').models, function (lo) {
          return -lo.getQty();
        });
        if (lines.length === 0) {
          // Removing last line, recalculate total
          receipt.calculateGross();
        } else {
          lines.forEach(function (l) {
            // with new flow discounts -> skipSave =true
            // in other case -> false
            this.applyPromotionsImp(receipt, l, OB.MobileApp.model.hasPermission('OBPOS_discount.newFlow', true));
          }, this);
        }
      }
    },

    addManualPromotion: function (receipt, lines, promotion) {
      var rule = OB.Model.Discounts.discountRules[promotion.rule.get ? promotion.rule.get('discountType') : promotion.rule.discountType];
      if (!rule || !rule.addManual) {
        OB.warn('No manual implemetation for rule ' + promotion.discountType);
        return;
      }

      lines.forEach(function (line) {
        if (line.get('promotions')) {
          line.get('promotions').forEach(function (promotion) {
            promotion.lastApplied = undefined;
          });
        }
        rule.addManual(receipt, line, promotion);
      });

      if (!promotion.alreadyCalculated) {
        // Recalculate all promotions again
        OB.Model.Discounts.applyPromotions(receipt);
      }
    },

    /**
     * Gets the list of manual promotions. If asArray param is true, it is returned
     * as an array, other case, as a comma separated string to be used in sql statements
     */
    getManualPromotions: function (asList) {
      var p, promos = [],
          promosSql = '';
      for (p in this.discountRules) {
        if (this.discountRules.hasOwnProperty(p)) {
          if (this.discountRules[p].addManual) {
            promos.push(p);
          }
        }
      }

      if (asList) {
        return promos;
      } else {
        // generate sql
        for (p = 0; p < promos.length; p++) {
          if (promosSql !== '') {
            promosSql += ', ';
          }
          promosSql += "'" + promos[p] + "'";
        }
        return promosSql;
      }
    },

    registerRule: function (name, rule) {
      this.discountRules[name] = rule;
    },

    standardFilter: "WHERE date('now') BETWEEN DATEFROM AND COALESCE(date(DATETO), date('9999-12-31'))" //
    + " AND((BPARTNER_SELECTION = 'Y'" //
    + " AND NOT EXISTS" //
    + " (SELECT 1" //
    + " FROM M_OFFER_BPARTNER" //
    + " WHERE M_OFFER_ID = M_OFFER.M_OFFER_ID" //
    + "   AND C_BPARTNER_ID = ?" //
    + " ))" //
    + " OR(BPARTNER_SELECTION = 'N'" //
    + " AND EXISTS" //
    + " (SELECT 1" //
    + " FROM M_OFFER_BPARTNER" //
    + " WHERE M_OFFER_ID = M_OFFER.M_OFFER_ID" //
    + "   AND C_BPARTNER_ID = ?" //
    + " )))" //
    + " AND((BP_GROUP_SELECTION = 'Y'" //
    + " AND NOT EXISTS" //
    + " (SELECT 1" //
    + " FROM C_BPARTNER B," //
    + "   M_OFFER_BP_GROUP OB" //
    + " WHERE OB.M_OFFER_ID = M_OFFER.M_OFFER_ID" //
    + "   AND B.C_BPARTNER_ID = ?" //
    + "   AND OB.C_BP_GROUP_ID = B.C_BP_GROUP_ID" //
    + " ))" //
    + " OR(BP_GROUP_SELECTION = 'N'" //
    + " AND EXISTS" //
    + " (SELECT 1" //
    + " FROM C_BPARTNER B," //
    + "   M_OFFER_BP_GROUP OB" //
    + " WHERE OB.M_OFFER_ID = M_OFFER.M_OFFER_ID" //
    + "   AND B.C_BPARTNER_ID = ?" //
    + "   AND OB.C_BP_GROUP_ID = B.C_BP_GROUP_ID" //
    + " )))" //
    + " AND((PRODUCT_SELECTION = 'Y'" //
    + " AND NOT EXISTS" //
    + " (SELECT 1" //
    + " FROM M_OFFER_PRODUCT" //
    + " WHERE M_OFFER_ID = M_OFFER.M_OFFER_ID" //
    + "   AND M_PRODUCT_ID = ?" //
    + " ))" //
    + " OR(PRODUCT_SELECTION = 'N'" //
    + " AND EXISTS" //
    + " (SELECT 1" //
    + " FROM M_OFFER_PRODUCT" //
    + " WHERE M_OFFER_ID = M_OFFER.M_OFFER_ID" //
    + "   AND M_PRODUCT_ID = ?" //
    + " )))" //
    + " AND((PROD_CAT_SELECTION = 'Y'" //
    + " AND NOT EXISTS" //
    + " (SELECT 1" //
    + " FROM M_PRODUCT P," //
    + "   M_OFFER_PROD_CAT OP" //
    + " WHERE OP.M_OFFER_ID = M_OFFER.M_OFFER_ID" //
    + "   AND P.M_PRODUCT_ID = ?" //
    + "   AND OP.M_PRODUCT_CATEGORY_ID = P.M_PRODUCT_CATEGORY_ID" //
    + " ))" //
    + " OR(PROD_CAT_SELECTION = 'N'" //
    + " AND EXISTS" //
    + " (SELECT 1" //
    + " FROM M_PRODUCT P," //
    + "   M_OFFER_PROD_CAT OP" //
    + " WHERE OP.M_OFFER_ID = M_OFFER.M_OFFER_ID" //
    + "   AND P.M_PRODUCT_ID = ?" //
    + "   AND OP.M_PRODUCT_CATEGORY_ID = P.M_PRODUCT_CATEGORY_ID" //
    + " ))) " //
    + " AND ((CHARACTERISTICS_SELECTION = 'Y'" + " AND NOT EXISTS" + " (SELECT 1" + "  FROM M_OFFER_CHARACTERISTIC C, M_PRODUCT_CH_VALUE V" + "  WHERE C.M_OFFER_ID = M_OFFER.M_OFFER_ID" + "    AND V.M_PRODUCT_ID = ?" + "    AND V.M_CH_VALUE_ID = C.M_CH_VALUE_ID" + " ))" + " OR(CHARACTERISTICS_SELECTION = 'N'" + " AND EXISTS" + " (SELECT 1" + "  FROM M_OFFER_CHARACTERISTIC C, M_PRODUCT_CH_VALUE V" + "  WHERE C.M_OFFER_ID = M_OFFER.M_OFFER_ID" + "    AND V.M_PRODUCT_ID = ?" + "    AND V.M_CH_VALUE_ID = C.M_CH_VALUE_ID" + " ))" + " )",

    additionalFilters: [],
    //extensible to add additional filters
    computeStandardFilter: function (receipt) {
      var filter = OB.Model.Discounts.standardFilter;
      var i, additionalFilter;
      for (i = 0; i < OB.Model.Discounts.additionalFilters.length; i++) {
        additionalFilter = OB.Model.Discounts.additionalFilters[i];
        if (additionalFilter.generateFilter) {
          //generateFilter: must be a  non-empty string starting with the word AND with also a starting space
          filter += additionalFilter.generateFilter(receipt);
        }
      }
      return filter;
    }
  };

  // Price Adjustment
  OB.Model.Discounts.registerRule('5D4BAF6BB86D4D2C9ED3D5A6FC051579', {
    async: false,
    implementation: function (discountRule, receipt, line) {
      var linePrice, discountedLinePrice, qty = line.get('qty'),
          minQty = discountRule.get('minQuantity'),
          maxQty = discountRule.get('maxQuantity');

      if ((minQty && qty < minQty) || (maxQty && qty > maxQty)) {
        return;
      }

      linePrice = line.get('discountedLinePrice') || line.get('price');
      if (discountRule.get('fixedPrice') || discountRule.get('fixedPrice') === 0) {
        discountedLinePrice = discountRule.get('fixedPrice');
      } else {
        discountedLinePrice = (linePrice - discountRule.get('discountAmount')) * (1 - discountRule.get('discount') / 100);
      }
      discountRule.set('qtyOffer', qty);
      receipt.addPromotion(line, discountRule, {
        amt: OB.DEC.toNumber((linePrice - (new BigDecimal(String(discountedLinePrice)))) * qty)
      });
      line.set('discountedLinePrice', discountedLinePrice);
    }
  });


  // Because of dependency models cannot be directly registered in promotions module
  if (OB && OB.Model && OB.Model.Discounts && OB.Model.Discounts.extraModels) {
    for (i = 0; i < OB.Model.Discounts.extraModels.length; i++) {
      OB.Data.Registry.registerModel(OB.Model.Discounts.extraModels[i]);
    }
  }

  for (i = 0; i < onLoadActions.length; i++) {
    if (onLoadActions[i].execute) {
      onLoadActions[i].execute();
    }
  }
}());