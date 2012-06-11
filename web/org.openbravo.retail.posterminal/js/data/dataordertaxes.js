/*global define,_ */

define(['utilities', 'arithmetic', 'i18n'], function () {

  OB = window.OB || {};
  OB.DATA = window.OB.DATA || {};

  OB.DATA.OrderTaxes = function(context) {
    this._id = 'logicOrderTaxes';
    
    this.receipt.calculateTaxes = function (callback) {
       var me = this,
           bpTaxCategory = this.get('bp').get('taxCategory'),
           lines = this.get('lines'),
           len = lines.length,
           db = OB.DATA.OfflineDB,
           sql = 'select * from c_tax where c_taxcategory_id = ? and c_bp_taxcategory_id ' + (bpTaxCategory === null ? ' is null ' : ' = ? ') + ' order by idx',
           taxes = {},
           totalnet = OB.DEC.Zero;

       db.readTransaction(function (tx) {
         _.each(lines.models, function (element, index, list) {
           var product = element.get('product'),
               params = [product.get('product').taxCategory];
  
           if(bpTaxCategory !== null) {
             params.push(bpTaxCategory);
           }
  
           tx.executeSql(sql, params, function (tr, result) {
             var taxRate, rate, taxAmt, net, pricenet, amount, taxId;
  
             if(result.rows.length < 1) {
               window.console.error('No applicable tax found for product: ' + product.get('product').id);
               return;
             }
  
             taxRate = result.rows.item(0);
             rate = OB.DEC.div(taxRate.rate, 100);
             pricenet = OB.DEC.div(element.get('price'), OB.DEC.add(1, rate));
             net = OB.DEC.div(element.get('gross'), OB.DEC.add(1, rate));
             amount = OB.DEC.sub(element.get('gross'), net);
             taxId = taxRate.c_tax_id;
  
             element.set('taxId', taxId);
             element.set('taxAmount', amount);
             element.set('net', net);
             element.set('pricenet', pricenet);
             totalnet = OB.DEC.add(totalnet, net);
  
             if(taxes[taxId]) {
               taxes[taxId].net = OB.DEC.add(taxes[taxId].net, net);
               taxes[taxId].amount = OB.DEC.add(taxes[taxId].amount, amount);
             } else {
               taxes[taxId] = {};
               taxes[taxId].name = taxRate.name;
               taxes[taxId].rate = rate;
               taxes[taxId].net = net;
               taxes[taxId].amount = amount;
             }
           }, function(tr, err) {
             window.console.error(arguments);
           });
         });
         
         
       }, function () {}, function () {
         me.set('taxes', taxes);
         me.set('net', totalnet);
         if (callback) {
           callback();
         }
       });      
    };
  };
});
