/*global define */

define(['builder', 'utilities', 'model/order', 'model/terminal', 'components/table'], function (B) {
  
  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};

  // Order list
  OB.COMP.OrderView = function (context) {
  
    // Set Model
    this.receipt =  context.modelorder;
    var lines = this.receipt.get('lines');
    
    this.receipt.on('change:net', function() {
      this.totalnet.text(this.receipt.printTotal());   
    }, this);    

    this.component = B(
      {kind: B.KindJQuery('div'), content: [                                                
        {kind: OB.COMP.TableView, id: 'tableview', attr: {
          style: 'edit',
          collection: lines,
          renderEmpty: function () {
            return (
              {kind: B.KindJQuery('div'), attr: {'style': 'border-bottom: 1px solid #cccccc; padding: 20px; text-align: center; font-weight:bold; font-size: 150%; color: #cccccc'}, content: [
                 OB.I18N.getLabel('OBPOS_ReceiptNew')
              ]}
            );          
          }
        }},
        {kind: B.KindJQuery('ul'), attr: {'class': 'unstyled'}, content: [                                                                                        
          {kind: B.KindJQuery('li'), content: [                                                                                        
            {kind: B.KindJQuery('div'), attr: {style: 'position: relative; padding: 10px; border-bottom: 1px solid #cccccc;'}, content: [
              {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 80%; color:  #888888'}, content: [ 
                OB.I18N.getLabel('OBPOS_ReceiptTaxes')
              ]},                                                                                                                                                                           
              {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 20%; text-align:right;'}, content: [                                                                                        
                OB.I18N.formatCurrency(0)
              ]},
              {kind: B.KindJQuery('div'), attr: {style: 'clear: both;'}}                                                                                     
            ]}
          ]},
          {kind: B.KindJQuery('li'), content: [                                                                                        
            {kind: B.KindJQuery('div'), attr: {style: 'position: relative; padding: 10px;'}, content: [
              {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 80%'}, content: [ 
                OB.I18N.getLabel('OBPOS_ReceiptTotal')
              ]},                                                                                                                                                                           
              {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 20%; text-align:right;'}, content: [                                                                                        
                {kind: B.KindJQuery('strong'), id: 'totalnet'}                                                                                     
              ]},
              {kind: B.KindJQuery('div'), attr: {style: 'clear: both;'}}                   
            ]}
          ]}               
        ]} 
      ]}                                                               
    );
    this.$el = this.component.$el;
    this.totalnet = this.component.context.totalnet.$el;
    this.tableview = this.component.context.tableview;       
    this.tableview.renderLine = OB.COMP.SelectButton.extend({
      render: function() {
        this.$el.append(B(
          this.model.get('productidentifier')                                                                
        ).$el);
        return this;
      }
    });    
      
    // Initial total display...
    this.totalnet.text(this.receipt.printTotal());   
    
  };
  
  OB.COMP.OrderView.prototype.attr = function (attrs) {
    this.tableview.renderLine = attrs.renderLine || this.tableview.renderLine;      
  };  
});    