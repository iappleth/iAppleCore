/*global define, Backbone */

define(['builder', 'utilities',  'model/order', 'model/terminal'], function (B) {
  
  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};

  OB.COMP.ReceiptsCounter = Backbone.View.extend({
    tagName: 'div',
    attributes: {'style': 'position: absolute; top:0px; right: 0px;'},   
    initialize: function () {
     
      this.component = B(
        {kind: B.KindJQuery('a'), attr: {
        'class': 'btnlink btnlink-gray', 
        'style': 'position: relative; overflow: hidden; margin:0px; padding:0px; height:50px; width: 50px;', 
        'href': '#modalreceipts', 'data-toggle': 'modal'}, content: [     
          {kind: B.KindJQuery('div'), attr: {
          'style': 'position: absolute; top: -35px; right:-35px; background: #404040; height:70px; width: 70px; -webkit-transform: rotate(45deg); -moz-transform: rotate(45deg); -ms-transform: rotate(45deg); -transform: rotate(45deg);'  // sqrt(2) * 50
          }},                                                          
          {kind: B.KindJQuery('div'), id:'counter', attr:{
          'style': 'position: absolute; top: 0px; right:0px; padding-top: 5px; padding-right: 10px; font-weight: bold; color: white;'
          }}
        ]}          
      );
      this.$el.append(this.component.$el);      
      this.$counter = this.component.context.counter.$el;
      
      this.receiptlist = this.options.modelorderlist; 
      this.receiptlist.on('reset add remove', function () {
        if (this.receiptlist.length > 1) {
          this.$el.show();
          this.$counter.text((this.receiptlist.length - 1));
        } else {
          this.$el.hide();
          this.$counter.html('&nbsp;');
        }
        
      }, this);      
    }
  });
});   

