/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

OB.Model.Discounts = {
  discountRules: {},
  executor: new OB.Model.DiscountsExecutor(),
  applyPromotions: function(receipt, line) {
    var alerts=[], bpId = receipt.get('bp').id, productId, criteria;
    if (line) {
      this.executor.addEvent(new Backbone.Model({receipt:receipt, line:line}), true);
    } else {
      receipt.get('lines').forEach(function(l){
    	this.applyPromotions(receipt, l);
      }, this);
    }
  },
  
  registerRule: function(name, rule) {
	this.discountRules[name] = rule;  
  },
  
  standardFilter: "WHERE date('now') BETWEEN DATEFROM AND COALESCE(date(DATETO), date('9999-12-31'))"
     +" AND((BPARTNER_SELECTION = 'Y'  "
 	 +" AND NOT EXISTS"
 	 +" (SELECT 1"
 	 +" FROM M_OFFER_BPARTNER"
 	 +" WHERE M_OFFER_ID = M_OFFER.M_OFFER_ID"
 	 +"   AND C_BPARTNER_ID = ?"
 	 +" ))"
 	 +" OR(BPARTNER_SELECTION = 'N'"
 	 +" AND EXISTS"
 	 +" (SELECT 1"
 	 +" FROM M_OFFER_BPARTNER"
 	 +" WHERE M_OFFER_ID = M_OFFER.M_OFFER_ID"
 	 +"   AND C_BPARTNER_ID = ?"
 	 +" )))"
 	 +" AND((BP_GROUP_SELECTION = 'Y'"
 	 +" AND NOT EXISTS"
 	 +" (SELECT 1"
 	 +" FROM C_BPARTNER B,"
 	 +"   M_OFFER_BP_GROUP OB"
 	 +" WHERE OB.M_OFFER_ID = M_OFFER.M_OFFER_ID"
 	 +"   AND B.C_BPARTNER_ID = ?"
 	 +"   AND OB.C_BP_GROUP_ID = B.C_BP_GROUP_ID"
 	 +" ))"
 	 +" OR(BP_GROUP_SELECTION = 'N'"
 	 +" AND EXISTS"
 	 +" (SELECT 1"
 	 +" FROM C_BPARTNER B,"
 	 +"   M_OFFER_BP_GROUP OB"
 	 +" WHERE OB.M_OFFER_ID = M_OFFER.M_OFFER_ID"
 	 +"   AND B.C_BPARTNER_ID = ?"
 	 +"   AND OB.C_BP_GROUP_ID = B.C_BP_GROUP_ID"
 	 +" )))"
 	 +" AND((PRODUCT_SELECTION = 'Y'"
 	 +" AND NOT EXISTS"
 	 +" (SELECT 1"
 	 +" FROM M_OFFER_PRODUCT"
 	 +" WHERE M_OFFER_ID = M_OFFER.M_OFFER_ID"
 	 +"   AND M_PRODUCT_ID = ?"
 	 +" ))"
 	 +" OR(PRODUCT_SELECTION = 'N'"
 	 +" AND EXISTS"
 	 +" (SELECT 1"
 	 +" FROM M_OFFER_PRODUCT"
 	 +" WHERE M_OFFER_ID = M_OFFER.M_OFFER_ID"
 	 +"   AND M_PRODUCT_ID = ?"
 	 +" )))"
 	 +" AND((PROD_CAT_SELECTION = 'Y'"
 	 +" AND NOT EXISTS"
 	 +" (SELECT 1"
 	 +" FROM M_PRODUCT P,"
 	 +"   M_OFFER_PROD_CAT OP"
 	 +" WHERE OP.M_OFFER_ID = M_OFFER.M_OFFER_ID"
 	 +"   AND P.M_PRODUCT_ID = ?"
 	 +"   AND OP.M_PRODUCT_CATEGORY_ID = P.M_PRODUCT_CATEGORY_ID"
 	 +" ))"
 	 +" OR(PROD_CAT_SELECTION = 'N'"
 	 +" AND EXISTS"
 	 +" (SELECT 1"
 	 +" FROM M_PRODUCT P,"
 	 +"   M_OFFER_PROD_CAT OP"
 	 +" WHERE OP.M_OFFER_ID = M_OFFER.M_OFFER_ID"
 	 +"   AND P.M_PRODUCT_ID = ?"
 	 +"   AND OP.M_PRODUCT_CATEGORY_ID = P.M_PRODUCT_CATEGORY_ID"
 	 +" )))"
};

