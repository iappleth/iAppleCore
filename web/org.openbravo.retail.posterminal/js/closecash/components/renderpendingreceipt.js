/*global B, $ */

(function () {

  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};

  OB.COMP.RenderPendingReceipt =  OB.COMP.CustomView.extend({
    me: null,
    render: function() {
      this.$el.append(B(
        {kind: B.KindJQuery('div'), attr:{'style': 'display: table-row; height: 42px;'}, content: [
          {kind: B.KindJQuery('div'), attr: {style: 'display: table-cell; vertical-align: middle; padding: 2px 5px 2px 5px; border-bottom: 1px solid #cccccc; width: 10%;'}, content: [
             OB.I18N.formatHour(this.model.get('orderDate'))
          ]},
          {kind: B.KindJQuery('div'), attr: {style: 'display: table-cell; vertical-align: middle; padding: 2px 5px 2px 5px; border-bottom: 1px solid #cccccc; width: 20%;'}, content: [
            this.model.get('documentNo')
          ]},
          {kind: B.KindJQuery('div'), attr: {style: 'display: table-cell; vertical-align: middle; padding: 2px 5px 2px 5px; border-bottom: 1px solid #cccccc; width: 39%;'}, content: [
            this.model.get('bp').get('_identifier')
          ]},
          {kind: B.KindJQuery('div'), attr: {style: 'display: table-cell; vertical-align: middle; padding: 2px 5px 2px 5px; border-bottom: 1px solid #cccccc; width: 15%; text-align:right;'}, content: [
            {kind: B.KindJQuery('strong'), content: [
               this.model.printGross()
            ]}
          ]},
          {kind: B.KindJQuery('div'), attr: {style: 'display: table-cell; vertical-align: middle; padding: 2px 5px 2px 5px; border-bottom: 1px solid #cccccc; width: 15%;'}, content: [
             {kind: OB.COMP.ButtonVoid.extend({order: this.model, me: this.me})}
           ]},
          {kind: B.KindJQuery('div'), attr: {style: 'clear: both;'}}
        ]}
      ).$el);
      return this;
    }
  });
}());