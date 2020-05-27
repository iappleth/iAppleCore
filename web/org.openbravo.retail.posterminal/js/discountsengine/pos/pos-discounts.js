/*
 ************************************************************************************
 * Copyright (C) 2019-2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
/*global OB */

(function() {
  OB.Discounts = OB.Discounts || {};
  OB.Discounts.Pos = OB.Discounts.Pos || {};

  OB.Discounts.Pos.local = true;

  const calculateLocal = (ticket, rules) => {
    return OB.Discounts.applyDiscounts(ticket, rules, OB.Discounts.Pos.bpSets);
  };

  const calculateRemote = ticket => {
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
  };

  function getExternalBusinessPartnerCategory(externalBusinessPartner) {
    const extbpint = OB.MobileApp.model.get('externalBpIntegration');
    if (!extbpint || !externalBusinessPartner) {
      return null;
    }
    return extbpint.properties
      .filter(p => p.categoryKey)
      .sort(
        (a, b) =>
          (a.categoryKeySequenceNumber || 0) -
          (b.categoryKeySequenceNumber || 0)
      )
      .reduce((key, p) => key + externalBusinessPartner[p.apiKey], '');
  }

  const applyDiscounts = (ticket, result) => {
    ticket.get('lines').forEach(line => {
      const discountInfoForLine =
          result.lines[line.get('id')] &&
          result.lines[line.get('id')].discounts.promotions,
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

      // Concatenate new promotions and excluded promotions in line
      line.set('promotions', [
        ...excludedFromEnginePromotions,
        ...discountInfoForLine
      ]);
      return;
    });
  };

  const transformNewEngineManualPromotions = (
    ticket,
    ticketManualPromos,
    result
  ) => {
    ticket.get('lines').forEach(line => {
      const discountInfoForLine =
        result.lines[line.get('id')] &&
        result.lines[line.get('id')].discounts.promotions;
      if (!discountInfoForLine || discountInfoForLine.length === 0) {
        return;
      }
      // Create new instances of original definitions for manual promotions
      discountInfoForLine.forEach(promotion => {
        if (promotion.manual) {
          let promotionRuleId = promotion.ruleId,
            promotionDiscountInstance = promotion.discountinstance,
            promotionNoOrder = promotion.noOrder,
            promotionSplitAmt = promotion.splitAmt;

          let discountInstance = ticketManualPromos.find(ticketManualPromo => {
            return (
              ticketManualPromo.ruleId === promotionRuleId &&
              ticketManualPromo.discountinstance ===
                promotionDiscountInstance &&
              ticketManualPromo.noOrder === promotionNoOrder &&
              ticketManualPromo.splitAmt === promotionSplitAmt
            );
          });

          let newPromoInstance = {};

          for (let key in discountInstance) {
            newPromoInstance[key] = discountInstance[key];
          }

          for (let key in promotion) {
            newPromoInstance[key] = promotion[key];
          }

          delete newPromoInstance.linesToApply;

          for (let key in newPromoInstance) {
            promotion[key] = newPromoInstance[key];
          }
        }
        promotion.calculatedOnDiscountEngine = true;
        promotion.obdiscQtyoffer = promotion.qtyOffer;
        promotion.displayedTotalAmount = promotion.amt;
        promotion.fullAmt = promotion.amt;
        promotion.actualAmt = promotion.amt;
      });
    });
  };

  const translateTicket = receipt => {
    let newTicket = {};
    newTicket.businessPartner = {};
    newTicket.businessPartner.id = receipt.get('bp').id;
    newTicket.businessPartner.businessPartnerCategory = receipt
      .get('bp')
      .get('businessPartnerCategory');
    newTicket.externalBusinessPartnerCategory = getExternalBusinessPartnerCategory(
      receipt.get('externalBusinessPartner')
    );
    newTicket.businessPartner._identifier = receipt.get('bp')._identifier;
    if (OB.MobileApp.model.hasPermission('EnableMultiPriceList', true)) {
      newTicket.pricelist = receipt.get('bp').get('priceList');
    } else {
      newTicket.pricelist = OB.MobileApp.model.get('pricelist').id;
    }
    newTicket.id = receipt.get('id');
    newTicket.date = receipt.get('orderDate');
    newTicket.discountsFromUser = {};
    newTicket.lines = [];
    receipt.get('lines').forEach(line => {
      let newLine = {};

      newLine.id = line.get('id');
      newLine.product = line.get('product').toJSON();
      newLine.qty = line.get('qty');
      newLine.price = line.get('price');
      newLine.promotions = [];
      newTicket.lines.push(newLine);
    });
    if (receipt.get('discountsFromUser')) {
      newTicket.discountsFromUser = {
        ...receipt.get('discountsFromUser')
      };
    }
    return newTicket;
  };

  OB.Discounts.Pos.calculateDiscounts = (receipt, callback) => {
    const ticketForEngine = translateTicket(receipt);
    let result;
    if (OB.Discounts.Pos.local) {
      if (!OB.Discounts.Pos.ruleImpls) {
        throw 'Local discount cache is not yet initialized, execute: OB.Discounts.Pos.initCache()';
      }
      // This hook cannot be asynchronous
      OB.UTIL.HookManager.executeHooks(
        'OBPOS_PreApplyNewDiscountEngine',
        {
          receipt: receipt,
          rules: [...OB.Discounts.Pos.ruleImpls]
        },
        args => {
          result = calculateLocal(ticketForEngine, args.rules);
          transformNewEngineManualPromotions(
            receipt,
            ticketForEngine.discountsFromUser.manualPromotions,
            result
          );
          applyDiscounts(receipt, result);
          callback();
        }
      );
    } else {
      result = calculateRemote(receipt, callback);
    }
  };

  /**
   * Retrieves the list of manual promotions
   * @return {string[]} An array containg the manual promotions
   */
  OB.Discounts.Pos.getManualPromotions = () => {
    return Object.keys(OB.Model.Discounts.discountRules);
  };

  /**
   * Reads discount masterdata models from database and creates different caches to use them:
   *   OB.Discounts.Pos.manualRuleImpls: array with manual discounts and promotions including children filters, filtered by current role and sorted by name.
   *   OB.Discounts.Pos.ruleImpls: array with not manual discounts and promotions including children filters, filtered by current role and sorted by priority and id (null priorities first).
   *   OB.Discounts.Pos.bpSets: array with business partner sets.
   * It also runs OBPOS_DiscountsCacheInitialization hook.
   * Discount masterdata models should be read from database only here. Wherever discount data is needed, any of these caches should be used.
   */
  OB.Discounts.Pos.initCache = async callback => {
    if (OB.Discounts.Pos.isCalculatingCache) {
      return callback();
    }
    OB.Discounts.Pos.isCalculatingCache = true;
    const execution = OB.UTIL.ProcessController.start(
      'discountCacheInitialization'
    );

    const data = await OB.Discounts.Pos.loadData();
    Object.assign(OB.Discounts.Pos, data);

    OB.UTIL.HookManager.executeHooks(
      'OBPOS_DiscountsCacheInitialization',
      {
        discounts: OB.Discounts.Pos.ruleImpls
      },
      function(args) {
        OB.UTIL.ProcessController.finish(
          'discountCacheInitialization',
          execution
        );
        callback();
        delete OB.Discounts.Pos.isCalculatingCache;
      }
    );
  };
})();
