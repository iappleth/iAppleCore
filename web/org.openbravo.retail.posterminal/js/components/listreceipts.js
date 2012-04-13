/*global define */

define(['builder', 'utilities', 'i18n', 'model/order', 'model/terminal'], function (B) {
  
  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};

  OB.COMP.ListReceipts = function (context) {
    var me = this;
    
    this.id = 'ListReceipts';

    this.receipt = context.get('modelorder');
    this.receiptlist = context.get('modelorderlist');
 
    this.receiptsview = B(
      {kind: OB.COMP.TableView, attr: {
        collection: this.receiptlist,
        renderEmpty: function () {
          return B(
            {kind: B.KindJQuery('div'), attr: {'style': 'border-bottom: 1px solid #cccccc; padding: 20px; text-align: center; font-weight:bold; font-size: 150%; color: #cccccc'}, content: [
              OB.I18N.getLabel('OBPOS_SearchNoResults')
            ]}
          );        
        },
        renderLine: function (model) {
          return B(
            {kind: B.KindJQuery('a'), attr: {'href': '#', 'class': 'btnselect'}, content: [                                                                                                                                                                        
              {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 80%;'}, content: [ 
                OB.I18N.formatHour(model.get('date')) + ' - <9332> ', model.get('bp') ? model.get('bp').get('_identifier') : ''
              ]},                                                                                      
              {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 20%; text-align:right;'}, content: [ 
                {kind: B.KindJQuery('strong'), content: [ 
                   model.printNet()                                                                                                                             
                ]}                                                                                                                                                                                                                                 
              ]},              
              {kind: B.KindJQuery('div'), attr: {style: 'clear: both;'}}                                                                                     
            ]}
          );
        }
      }}
    );

    this.receiptlist.on('click', function (model, index) {
      this.receiptlist.load(model);
    }, this);
   
    
    this.$ = OB.UTIL.EL(
      {tag: 'div', content: [
        {tag: 'div', attr: {'style': 'background-color: white; color: black; height: 500px; margin: 5px; padding: 5px'}, content: [
          {tag: 'div', attr: {'class': 'row-fluid', 'style':  'border-bottom: 1px solid #cccccc;'}, content: [  
          ]},
          {tag: 'div', attr: {'class': 'row-fluid'}, content: [
            {tag: 'div', attr: {'class': 'span12', 'style': 'height: 500px; overflow: auto;'}, content: [    
             
              {tag: 'div', attr: {'class': 'row-fluid'}, content: [
                {tag: 'div', attr: {'class': 'span12'}, content: [    
                  {tag: 'div', content: [ 
                    this.receiptsview.$
                  ]}                   
                ]}                   
              ]}                                                             
            ]}                                                                   
          ]}                      
        ]}        
      ]}
    );
  };
  
}); 