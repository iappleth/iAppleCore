/*global define */

define(['builder', 'utilities',  'model/order', 'model/terminal'], function (B) {
  
  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};

  // Order list
  OB.COMP.BusinessPartner = function (context) {
  
    var me = this;
    this.context = context;
    
    this.renderTitle = function (receipt) {
      return B(
        {kind: B.KindJQuery('strong'), content: [                                                                                        
          OB.I18N.formatHour(receipt.get('date')) + ' - <9332> ', receipt.get('bp') ? receipt.get('bp').get('_identifier') : ''
        ]}            
      );
    };    
    
    this.bp = B({kind: B.KindJQuery('span')});      
    this.$ = this.bp.$;
    
    this.receipt =  context.get('modelorder');   
    this.receipt.on('clear change:bp', function () {
      this.bp.$.empty().append(this.renderTitle(this.receipt).$);
    }, this);
  };  
});    