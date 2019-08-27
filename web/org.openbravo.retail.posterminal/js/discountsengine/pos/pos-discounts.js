/*
 ************************************************************************************
 * Copyright (C) 2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
/*global OB */

(function() {
  OB.Discounts = OB.Discounts || {};
  OB.Discounts.Pos = {
    local: true,

    calculateLocal: function(ticket) {
      if (!OB.Discounts.Pos.ruleImpls) {
        throw 'Local discount cache is not yet initialized, execute: OB.Discounts.Pos.initCache()';
      }
      return OB.Discounts.applyDiscounts(ticket, OB.Discounts.Pos.ruleImpls);
    },

    calculateRemote: function(ticket) {
      ticket = JSON.stringify(ticket);
      fetch('../../discount', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: ticket
      })
        .then(response => response.json())
        .then(disc => OB.info(disc));
    },

    applyDiscounts: function(ticket, result) {
      ticket.get('lines').forEach(line => {
        const discountInfoForLine =
            result.lines[line.get('id')] &&
            result.lines[line.get('id')].discounts,
          excludedFromEnginePromotions = line.get('promotions')
            ? line.get('promotions').filter(promo => {
                return !promo.calculatedOnDiscountEngine;
              })
            : [];
        if (!discountInfoForLine) {
          //No discounts for this line, we keep existing discounts if they exist, and move to the next
          line.set('promotions', excludedFromEnginePromotions);
          return;
        }

        // Set a property to indicate these promotions has been calculated with the discount engine
        discountInfoForLine.promotions.forEach(promotion => {
          promotion.calculatedOnDiscountEngine = true;
        });

        // Concatenate new promotions and excluded promotions in line
        line.set('promotions', [
          ...excludedFromEnginePromotions,
          ...discountInfoForLine.promotions
        ]);
        return;
      });
    },

    translateTicket: function(receipt) {
      let newTicket = {};
      newTicket.businessPartner = {};
      newTicket.businessPartner.id = receipt.get('bp').id;
      newTicket.businessPartner._identifier = receipt.get('bp')._identifier;
      newTicket.id = receipt.get('id');
      newTicket.date = receipt.get('orderDate');
      newTicket.discountsFromUser = {};
      newTicket.lines = [];
      receipt.get('lines').forEach(line => {
        let newLine = {},
          discountedLinePrice = 0;
        if (line.get('promotions')) {
          line.get('promotions').forEach(promo => {
            if (!promo.calculatedOnDiscountEngine) {
              discountedLinePrice += promo.amt;
            }
          });
        }

        newLine.id = line.get('id');
        newLine.product = line.get('product').toJSON();
        newLine.qty = line.get('qty');
        newLine.price = line.get('price') - discountedLinePrice;
        newTicket.lines.push(newLine);
      });
      if (receipt.get('coupons')) {
        newTicket.discountsFromUser.coupons = receipt
          .get('coupons')
          .map(coupon => coupon.offerid);
      }
      if (receipt.get('orderManualPromotions')) {
        let bytotalManualPromotions = [];
        let orderManualPromotions = receipt.get('orderManualPromotions').models;
        orderManualPromotions.forEach(bytotalManualPromotion => {
          let rule = new Backbone.Model(
              bytotalManualPromotion.get('discountRule')
            ),
            bytotalManualPromotionObj = {};
          for (let key in rule.attributes) {
            bytotalManualPromotionObj[key] = rule.attributes[key];
          }
          bytotalManualPromotionObj.discountInstance =
            bytotalManualPromotion.discountInstance;

          // Override some configuration from manualPromotions
          if (bytotalManualPromotionObj.disctTotalamountdisc) {
            bytotalManualPromotionObj.disctTotalamountdisc = bytotalManualPromotion.get(
              'rule'
            ).userAmt;
          } else if (bytotalManualPromotionObj.disctTotalpercdisc) {
            bytotalManualPromotionObj.disctTotalpercdisc = bytotalManualPromotion.get(
              'rule'
            ).userAmt;
          }
          bytotalManualPromotionObj.products = [];
          bytotalManualPromotionObj.includedProducts = 'Y';
          bytotalManualPromotionObj.productCategories = [];
          bytotalManualPromotionObj.includedProductCategories = 'Y';
          bytotalManualPromotionObj.productCharacteristics = [];
          bytotalManualPromotionObj.includedCharacteristics = 'Y';
          bytotalManualPromotionObj.allweekdays = true;

          bytotalManualPromotions.push(bytotalManualPromotionObj);
        });
        newTicket.discountsFromUser.bytotalManualPromotions = bytotalManualPromotions;
      }
      if (receipt.get('manualPromotionsAddedToTicket')) {
        let manualPromotions = [];
        receipt
          .get('manualPromotionsAddedToTicket')
          .forEach(manualPromotion => {
            let rule = new Backbone.Model(manualPromotion.rule);
            let manualPromotionObj = {};
            for (let key in rule.attributes) {
              manualPromotionObj[key] = rule.attributes[key];
            }
            manualPromotionObj.linesToApply = manualPromotion.applicableLines;
            manualPromotionObj.discountInstance =
              manualPromotion.discountInstance;

            // Override some configuration from manualPromotions
            if (manualPromotionObj.obdiscAmt) {
              manualPromotionObj.obdiscAmt = manualPromotion.userAmt;
            } else if (manualPromotionObj.obdiscPercentage) {
              manualPromotionObj.obdiscPercentage = manualPromotion.userAmt;
            } else if (manualPromotionObj.obdiscLineFinalgross) {
              manualPromotionObj.obdiscLineFinalgross = manualPromotion.userAmt;
            }
            manualPromotionObj.products = [];
            manualPromotionObj.includedProducts = 'Y';
            manualPromotionObj.productCategories = [];
            manualPromotionObj.includedProductCategories = 'Y';
            manualPromotionObj.productCharacteristics = [];
            manualPromotionObj.includedCharacteristics = 'Y';
            manualPromotionObj.allweekdays = true;

            manualPromotions.push(manualPromotionObj);
          });
        newTicket.discountsFromUser.manualPromotions = manualPromotions;
      }
      return newTicket;
    },

    calculateDiscounts(receipt, callback) {
      const ticketForEngine = OB.Discounts.Pos.translateTicket(receipt);
      let result;
      if (OB.Discounts.Pos.local) {
        result = OB.Discounts.Pos.calculateLocal(ticketForEngine);
        OB.Discounts.Pos.applyDiscounts(receipt, result);
        callback();
      } else {
        result = OB.Discounts.Pos.calculateRemote(receipt, callback);
      }
    },

    computeDiscountsQuery(basicParams) {
      let params = [
        basicParams.businessPartner,
        basicParams.businessPartner,
        basicParams.businessPartner,
        basicParams.businessPartner,
        basicParams.businessPartner,
        basicParams.businessPartner,
        OB.MobileApp.model.get('pricelist').id,
        OB.MobileApp.model.get('pricelist').id,
        OB.MobileApp.model.get('context').role.id,
        OB.MobileApp.model.get('context').role.id
      ];
      let discountsFilter =
        'SELECT M_OFFER_ID FROM M_OFFER WHERE ( 1=1 ' +
        //BusinessPartner, BPCategory, BPSet filter
        " AND((BPARTNER_SELECTION = 'Y'" +
        ' AND NOT EXISTS' +
        ' (SELECT 1' + //
        ' FROM M_OFFER_BPARTNER' + //
        ' WHERE M_OFFER_ID = M_OFFER.M_OFFER_ID' + //
        '   AND C_BPARTNER_ID = ?' +
        ' ))' + //
        " OR(BPARTNER_SELECTION = 'N'" + //
        ' AND EXISTS' + //
        ' (SELECT 1' + //
        ' FROM M_OFFER_BPARTNER' + //
        ' WHERE M_OFFER_ID = M_OFFER.M_OFFER_ID' + //
        '   AND C_BPARTNER_ID = ?' + //
        ' )))' + //
        " AND((BP_SET_SELECTION = 'Y'" + //
        ' AND NOT EXISTS' + //
        ' (SELECT 1' + //
        ' FROM M_OFFER_BP_SET OBPS, C_BP_SET_LINE BPL' + //
        ' WHERE OBPS.C_BP_SET_ID = BPL.C_BP_SET_ID' + //
        '   AND OBPS.M_OFFER_ID = M_OFFER.M_OFFER_ID' + //
        "   AND BPL.C_BPARTNER_ID = ? AND datetime('now') BETWEEN COALESCE(datetime(BPL.STARTDATE), datetime('2000-12-31T00:00:00')) AND COALESCE(datetime(BPL.ENDDATE), datetime('9999-12-31T23:59:59'))" + //
        ' ))' + //
        " OR(BP_SET_SELECTION = 'N'" + //
        ' AND EXISTS' + //
        ' (SELECT 1' + //
        ' FROM M_OFFER_BP_SET OBPS, C_BP_SET_LINE BPL' + //
        ' WHERE OBPS.C_BP_SET_ID = BPL.C_BP_SET_ID' + //
        '   AND OBPS.M_OFFER_ID = M_OFFER.M_OFFER_ID' + //
        "   AND BPL.C_BPARTNER_ID = ? AND datetime('now') BETWEEN COALESCE(datetime(BPL.STARTDATE), datetime('2000-12-31T00:00:00')) AND COALESCE(datetime(BPL.ENDDATE), datetime('9999-12-31T23:59:59'))" + //
        ' )))' + //
        " AND((BP_GROUP_SELECTION = 'Y'" + //
        ' AND NOT EXISTS' + //
        ' (SELECT 1' + //
        ' FROM C_BPARTNER B,' + //
        '   M_OFFER_BP_GROUP OB' + //
        ' WHERE OB.M_OFFER_ID = M_OFFER.M_OFFER_ID' + //
        '   AND B.C_BPARTNER_ID = ?' + //
        '   AND OB.C_BP_GROUP_ID = B.C_BP_GROUP_ID' + //
        ' ))' + //
        " OR(BP_GROUP_SELECTION = 'N'" + //
        ' AND EXISTS' + //
        ' (SELECT 1' + //
        ' FROM C_BPARTNER B,' + //
        '   M_OFFER_BP_GROUP OB' + //
        ' WHERE OB.M_OFFER_ID = M_OFFER.M_OFFER_ID' + //
        '   AND B.C_BPARTNER_ID = ?' + //
        '   AND OB.C_BP_GROUP_ID = B.C_BP_GROUP_ID' + //
        ' )))' + //
        //Pricelist filter
        " AND ((pricelist_selection = 'Y' AND NOT EXISTS" + //
        '   (SELECT 1 FROM m_offer_pricelist opl WHERE m_offer.m_offer_id = opl.m_offer_id AND opl.m_pricelist_id = ? ))' + //
        " OR (pricelist_selection = 'N' AND EXISTS" + //
        '   (SELECT 1 FROM m_offer_pricelist opl WHERE m_offer.m_offer_id = opl.m_offer_id AND opl.m_pricelist_id = ? )))' +
        //Do not include manual promotions
        ' AND M_OFFER_TYPE_ID NOT IN (' +
        OB.Model.Discounts.getManualPromotions() +
        ')' + //
        //Role filter
        " AND ((EM_OBDISC_ROLE_SELECTION = 'Y' AND NOT EXISTS (SELECT 1 FROM OBDISC_OFFER_ROLE WHERE M_OFFER_ID = M_OFFER.M_OFFER_ID " +
        " AND AD_ROLE_ID = ?)) OR (EM_OBDISC_ROLE_SELECTION = 'N' " + //
        ' AND EXISTS (SELECT 1 FROM OBDISC_OFFER_ROLE WHERE M_OFFER_ID = M_OFFER.M_OFFER_ID ' +
        ' AND AD_ROLE_ID = ?)))' + //
        ') ORDER BY PRIORITY, M_OFFER_ID';

      const discountsObj = {
        params: params,
        queryFilter: discountsFilter
      };
      return discountsObj;
    },

    translateRule: function(rule) {
      rule.set('discountPercentage', rule.get('discount'));
    },

    initCache: function(basicParams, callback) {
      if (OB.Discounts.Pos.isCalculatingCache) {
        return callback();
      }
      OB.Discounts.Pos.isCalculatingCache = true;
      const execution = OB.UTIL.ProcessController.start(
        'discountCacheInitialization'
      );
      OB.Discounts.Pos.ruleImpls = [];
      let discountsQueryObject = OB.Discounts.Pos.computeDiscountsQuery(
        basicParams
      );
      let discountsQuery =
        'SELECT * FROM M_OFFER WHERE M_OFFER_ID IN (' +
        discountsQueryObject.queryFilter +
        ')';
      OB.Dal.query(
        OB.Model.Discount,
        discountsQuery,
        discountsQueryObject.params,
        rules => {
          const finishCallback = function() {
            OB.UTIL.ProcessController.finish(
              'discountCacheInitialization',
              execution
            );
            callback();
            delete OB.Discounts.Pos.isCalculatingCache;
          };

          rules.forEach(rule => OB.Discounts.Pos.translateRule(rule));

          rules.forEach(rule => {
            var r = JSON.parse(JSON.stringify(rule));
            OB.Discounts.Pos.ruleImpls.push(r);
          });
          let baseFilter =
            '  WHERE M_OFFER.M_OFFER_ID IN (' +
            discountsQueryObject.queryFilter +
            ') ORDER BY PRIORITY, M_OFFER.M_OFFER_ID';

          let productFilterQuery =
            'SELECT * FROM M_OFFER_PRODUCT INNER JOIN M_OFFER ON M_OFFER_PRODUCT.M_OFFER_ID = M_OFFER.M_OFFER_ID' +
            baseFilter;
          OB.Dal.query(
            OB.Model.DiscountFilterProduct,
            productFilterQuery,
            discountsQueryObject.params,
            products => {
              let prodGroups = products.groupBy(prod =>
                prod.get('priceAdjustment')
              );
              OB.Discounts.Pos.ruleImpls.forEach(rule => {
                rule.products = [];
                if (prodGroups[rule.id]) {
                  prodGroups[rule.id].forEach(discProd => {
                    const objDiscProd = discProd.toJSON();
                    objDiscProd.product = { id: discProd.get('product') };
                    rule.products.push(objDiscProd);
                  });
                }
              });

              let productCatQuery =
                'SELECT * FROM M_OFFER_PROD_CAT INNER JOIN M_OFFER ON M_OFFER_PROD_CAT.M_OFFER_ID = M_OFFER.M_OFFER_ID' +
                baseFilter;
              OB.Dal.query(
                OB.Model.DiscountFilterProductCategory,
                productCatQuery,
                discountsQueryObject.params,
                productCategories => {
                  let catGroups = productCategories.groupBy(prod =>
                    prod.get('priceAdjustment')
                  );
                  OB.Discounts.Pos.ruleImpls.forEach(rule => {
                    rule.productCategories = [];
                    if (catGroups[rule.id]) {
                      catGroups[rule.id].forEach(discCat => {
                        const objDiscCat = discCat.toJSON();
                        objDiscCat.productCategory = {
                          id: discCat.get('productCategory')
                        };
                        rule.productCategories.push(objDiscCat);
                      });
                    }
                  });

                  let producCharQuery =
                    'SELECT * FROM M_OFFER_CHARACTERISTIC INNER JOIN M_OFFER ON M_OFFER_CHARACTERISTIC.M_OFFER_ID = M_OFFER.M_OFFER_ID' +
                    baseFilter;
                  OB.Dal.query(
                    OB.Model.DiscountFilterCharacteristic,
                    producCharQuery,
                    discountsQueryObject.params,
                    productCharacteristics => {
                      let charGroups = productCharacteristics.groupBy(prod =>
                        prod.get('offer')
                      );
                      OB.Discounts.Pos.ruleImpls.forEach(rule => {
                        rule.productCharacteristics = [];
                        if (charGroups[rule.id]) {
                          charGroups[rule.id].forEach(discChar => {
                            const objDiscChar = discChar.toJSON();
                            rule.productCharacteristics.push(objDiscChar);
                          });
                        }
                      });

                      OB.UTIL.HookManager.executeHooks(
                        'OBPOS_DiscountsCacheInitialization',
                        {
                          discounts: OB.Discounts.Pos.ruleImpls,
                          baseFilter,
                          params: discountsQueryObject.params
                        },
                        function(args) {
                          finishCallback();
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  };
})();
