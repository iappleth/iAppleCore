/*global define,_*/

define(['utilities', 'datasource'], function () {
  
  OB = window.OB || {};
  OB.DATA = window.OB.DATA || {};
  
  OB.DATA.Base = {
    inithandler: function (init) { 
       if (init) {
         init.call(this);
       }
       // load datasource
       this.ds.load(this.loadparams);
    },
    attr: function (attr, value) {
    },
    append: function (child) {
    }   
  };
  
  OB.DATA.BPs = function (context) {
    this.id = 'DataBPs';
    this.context = context;
    this.ds = new OB.DS.DataSource(new OB.DS.Query(
      'from BusinessPartner where customer = true and $readableCriteria'));
    this.loadparams = {};     
  };
  _.extend(OB.DATA.BPs.prototype, OB.DATA.Base);  
  
  OB.DATA.PriceList = function (context, id) {
    this.id = 'DataPriceList';
    this.context = context;    
    this.ds = new OB.DS.DataSource(new OB.DS.Query(
      'select ppl as pricelist, plv as pricelistversion ' +
      'from PricingPriceList as ppl, PricingPriceListVersion as plv ' + 
      'where ppl.organization.id = :org and ppl.salesPriceList = true  and ppl.$readableCriteria and ppl.id = plv.priceList.id  and ' + 
      'plv.validFromDate = (select max(pplv.validFromDate) from PricingPriceListVersion as pplv where pplv.priceList.id = ppl.id)'));
    this.loadparams = {'org': OB.POS.modelterminal.get('terminal').organization };     
  };
  _.extend(OB.DATA.PriceList.prototype, OB.DATA.Base);
  
  OB.DATA.ProductPrice = function (context, id) {
    this.id = 'DataProductPrice';
    this.context = context;    
    this.ds = new OB.DS.DataSource(new OB.DS.Query(
      'from PricingProductPrice where priceListVersion in ' + 
      '(select plv.id from PricingPriceList as ppl, PricingPriceListVersion as plv ' + 
      'where ppl.organization.id = :org and ppl.salesPriceList = true  and ppl.$readableCriteria and ppl.id = plv.priceList.id  and ' + 
      'plv.validFromDate = (select max(pplv.validFromDate) from PricingPriceListVersion as pplv where pplv.priceList.id = ppl.id))'));
    this.loadparams = {'org': OB.POS.modelterminal.get('terminal').organization };     
  };
  _.extend(OB.DATA.ProductPrice.prototype, OB.DATA.Base);
  
  OB.DATA.Product = function (context, id) {
    this.id = 'DataProduct';
    this.context = context;    
    this.ds = new OB.DS.DataSource(new OB.DS.Query(
      'select p as product, img.bindaryData as img ' + 
      'from Product p left outer join p.image img ' + 
      'where p.$readableCriteria and p.obposCatalog = true order by p.obposLine, p.name'));
    this.loadparams = {}; 
  };
  _.extend(OB.DATA.Product.prototype, OB.DATA.Base);
  
  OB.DATA.Category = function (context, id) {
    this.id = 'DataCategory';
    this.context = context;    
    this.ds = new OB.DS.DataSource(new OB.DS.Query(
        'select c as category, img.bindaryData as img ' + 
        'from ProductCategory as c left outer join c.obposImage img ' +
        'where c.$readableCriteria and c.oBPOSIsCatalog = true ' +
        'order by c.oBPOSPOSLine, c.name'));
    this.loadparams = {};     
  };
  _.extend(OB.DATA.Category.prototype, OB.DATA.Base);
 
    
});