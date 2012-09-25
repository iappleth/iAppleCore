OB.Model.Discounts = {
  discountRules: {},
  
  applyPromotions: function(receipt, line) {
    var alerts=[], bpId = receipt.get('bp').id, productId, criteria;
    if (line) {
      productId = line.get('product').id;
      line.set('promotions',null, {silent:true});
      line.set('discountedLinePrice', null,{silent:true});
      line.set('promotionCandidates', null,{silent:true});
      
      // check which are the promotions to be applied
      criteria = {
        '_whereClause': this.standardFilter,
        params: [bpId, bpId, bpId, bpId, productId, productId, productId, productId]
      };
      OB.Dal.find(OB.Model.Discount, criteria, function(d) { //OB.Dal.find success
        console.log('ds', d);
        d.forEach(function(disc) {
          var rule = OB.Model.Discounts.discountRules[disc.get('discountType')], ds;
          if (rule){ 
        	  ds = rule(disc, receipt, line);
        	  if (ds && ds.alerts) {
        		  alerts = alerts.concat(ds.alerts);
        	  }
          } else {
             console.warn('No POS implementation for discount '+disc.get('discountType'));
          }
        });
        receipt.calculateGross();
        if (alerts && alerts[0]) {
      	  OB.UTIL.showAlert.display(alerts[0]);
        }
      }, function() {});


    } else {
      receipt.get('lines').forEach(function(l){
    	  this.applyPromotions(receipt, l);
      }, this);
    }
    
  },
  
  registerRule: function(name, implementation) {
	this.discountRules[name] = implementation;  
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

