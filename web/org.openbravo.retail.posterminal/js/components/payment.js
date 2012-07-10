/*global Backbone */

(function () {

  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};
  
  var DoneButton = OB.COMP.RegularButton.extend({
    'label': OB.I18N.getLabel('OBPOS_LblDone'),
    'clickEvent': function() {
      var parent = this.options.parent;
      parent.receipt.calculateTaxes(function () {
        parent.receipt.trigger('closed');
        parent.modelorderlist.deleteCurrent();
      });
    }                    
  });
  
  var RemovePayment = Backbone.View.extend({
    tag: 'a',
    attributes: {'href': '#'},    
    contentView: [{tag: 'i', attributes: {'class': 'icon-remove icon-white'}}],
    initialize: function () {
      OB.UTIL.initContentView(this);
      var parent = this.options.parent;
      this.$el.click(function(e) {
        e.preventDefault();
        parent.options.parent.options.parent.receipt.removePayment(parent.options.model);
      });  
    }
  });
   
  var RenderPaymentLine = OB.COMP.SelectPanel.extend({
    contentView : [
        {tag: 'div', attributes: {'style': 'color:white;'}, content: [
          {tag: 'div', id: 'divname', attributes: {style: 'float: left; width: 40%'}},
          {tag: 'div', id: 'divamount', attributes: {style: 'float: left; width: 40%; text-align:right;'}},
          {tag: 'div', attributes: {style: 'float: left; width: 20%; text-align:right;'}, content: [
            {view: RemovePayment}
          ]},
          {tag: 'div', attributes: {style: 'clear: both;'}}
        ]}                                          
    ],
    render: function () {
      this.divname.text(OB.POS.modelterminal.getPaymentName(this.model.get('kind')));
      this.divamount.text(this.model.printAmount());
      return this;
    }
  });

  OB.COMP.Payment = Backbone.View.extend({
    tag: 'div',
    contentView: [
                  
          {tag: 'div', attributes: {'style': 'background-color: #363636; color: white; height: 200px; margin: 5px; padding: 5px'}, content: [
            {tag: 'div', attributes: {'class': 'row-fluid'}, content: [
              {tag: 'div', attributes: {'class': 'span12'}, content: [
              ]}
            ]},
            {tag: 'div', attributes: {'class': 'row-fluid'}, content: [
              {tag: 'div', attributes: {'class': 'span7'}, content: [
                {tag: 'div', attributes: {'style': 'padding: 10px 0px 0px 10px;'}, content: [
                  {tag: 'span', id: 'totalpending', attributes: {style: 'font-size: 24px; font-weight: bold;'}},
                  {tag: 'span', id: 'totalpendinglbl', content: [OB.I18N.getLabel('OBPOS_PaymentsRemaining')]},
                  {tag: 'span', id: 'change', attributes: {style: 'font-size: 24px; font-weight: bold;'}},
                  {tag: 'span', id: 'changelbl', content: [OB.I18N.getLabel('OBPOS_PaymentsChange')]},
                  {tag: 'span', id: 'overpayment', attributes: {style: 'font-size: 24px; font-weight: bold;'}},
                  {tag: 'span', id: 'overpaymentlbl', content: [OB.I18N.getLabel('OBPOS_PaymentsOverpayment')]}
                ]},
                {tag: 'div', attributes: {style: 'overflow:auto; width: 100%;'}, content: [
                  {tag: 'div', attributes: {'style': 'padding: 5px'}, content: [
                    {tag: 'div', attributes: {'style': 'margin: 2px 0px 0px 0px; border-bottom: 1px solid #cccccc;'}, content: [
                    ]},
                    {id: 'tableview', view: OB.UI.TableView.extend({
                      renderEmpty: Backbone.View.extend({
                        tagName: 'div',
                        attributes: {'style': 'height: 36px'}
                      }),                      
                      renderLine: RenderPaymentLine
                    })}
                  ]}
                ]}
              ]},
              {tag: 'div', attributes: {'class': 'span5'}, content: [
                {tag: 'div', attributes: {'style': 'float: right;'}, id: 'doneaction', content: [
                  {view: DoneButton}
                ]}
              ]}
            ]},

            {tag: 'div', attributes: {'class': 'row-fluid'}, content: [
              {tag: 'div', attributes: {'class': 'span12'}, content: [
                {tag: 'div', id: 'coinscontainer', content: [
                ]}
              ]}
            ]}

          ]}
                  
                  ],
    paymentButtons : [],
    initialize : function () {
      
      OB.UTIL.initContentView(this);
      
      var i, max;
      var me = this;

      this.modelorderlist = this.options.modelorderlist;
      this.receipt = this.options.modelorder;
      var payments = this.receipt.get('payments');
      var lines = this.receipt.get('lines');
      
      this.tableview.registerCollection(payments);

      this.receipt.on('change:payment change:change change:gross', function() {
        this.updatePending();
      }, this);

//      this.component = B(
//        {kind: B.KindJQuery('div'), content: [
//          {kind: B.KindJQuery('div'), attr: {'style': 'background-color: #363636; color: white; height: 200px; margin: 5px; padding: 5px'}, content: [
//            {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
//              {kind: B.KindJQuery('div'), attr: {'class': 'span12'}, content: [
//
//              ]}
//            ]},
//            {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
//              {kind: B.KindJQuery('div'), attr: {'class': 'span7'}, content: [
//                {kind: B.KindJQuery('div'), attr: {'style': 'padding: 10px 0px 0px 10px;'}, content: [
//                  {kind: B.KindJQuery('span'), id: 'totalpending', attr: {style: 'font-size: 24px; font-weight: bold;'}},
//                  {kind: B.KindJQuery('span'), id: 'totalpendinglbl', content: [OB.I18N.getLabel('OBPOS_PaymentsRemaining')]},
//                  {kind: B.KindJQuery('span'), id: 'change', attr: {style: 'font-size: 24px; font-weight: bold;'}},
//                  {kind: B.KindJQuery('span'), id: 'changelbl', content: [OB.I18N.getLabel('OBPOS_PaymentsChange')]},
//                  {kind: B.KindJQuery('span'), id: 'overpayment', attr: {style: 'font-size: 24px; font-weight: bold;'}},
//                  {kind: B.KindJQuery('span'), id: 'overpaymentlbl', content: [OB.I18N.getLabel('OBPOS_PaymentsOverpayment')]}
//                ]},
//                {kind: B.KindJQuery('div'), attr: {style: 'overflow:auto; width: 100%;'}, content: [
//                  {kind: B.KindJQuery('div'), attr: {'style': 'padding: 5px'}, content: [
//                    {kind: B.KindJQuery('div'), attr: {'style': 'margin: 2px 0px 0px 0px; border-bottom: 1px solid #cccccc;'}, content: [
//                    ]},
//                    {kind: OB.UI.TableView, attr: {
//                      collection: payments,
//                      renderEmpty: Backbone.View.extend({
//                        tagName: 'div',
//                        attributes: {'style': 'height: 36px'}
//                      }),                      
//                      renderLine: OB.COMP.SelectPanel.extend({
//                        render: function () {
//                          var model = this.model;
//                          this.$el.append(B(
//                            {kind: B.KindJQuery('div'), attr: {'style': 'color:white; '}, content: [
//                              {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 40%'}, content: [
//                                 OB.POS.modelterminal.getPaymentName(this.model.get('kind'))
//                              ]},
//                              {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 40%; text-align:right;'}, content: [
//                                this.model.printAmount()
//                              ]},
//                              {kind: B.KindJQuery('div'), attr: {style: 'float: left; width: 20%; text-align:right;'}, content: [
//                                {kind: B.KindJQuery('a'), attr: {'href': '#'}, content: [
//                                  {kind: B.KindJQuery('i'), attr: {'class': 'icon-remove icon-white'}}
//                                ], init: function () {
//                                  this.$el.click(function(e) {
//                                    e.preventDefault();
//                                    me.receipt.removePayment(model);
//                                  });
//                                }}
//                              ]},
//                              {kind: B.KindJQuery('div'), attr: {style: 'clear: both;'}}
//                            ]}
//                          ).$el);
//                          return this;
//                        }
//                      })
//                    }}
//                  ]}
//                ]}
//              ]},
//              {kind: B.KindJQuery('div'), attr: {'class': 'span5'}, content: [
//                {kind: B.KindJQuery('div'), attr: {'style': 'float: right;'}, id: 'doneaction', content: [
//                  {kind: OB.COMP.RegularButton, attr: { 'label': OB.I18N.getLabel('OBPOS_LblDone'),
//                    'clickEvent': function() {
//                      me.receipt.calculateTaxes(function () {
//                        me.receipt.trigger('closed');
//                        me.modelorderlist.deleteCurrent();
//                      });
//                    }
//                  }}
//                ]}
//              ]}
//            ]},
//
//            {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
//              {kind: B.KindJQuery('div'), attr: {'class': 'span12'}, content: [
//                {kind: B.KindJQuery('div'), id: 'coinscontainer', content: [
//                ]}
//              ]}
//            ]}
//
//          ]}
//        ]}
//      );
//      this.setElement(this.component.$el);
//      this.totalpending = this.component.context.totalpending.$el;
//      this.totalpendinglbl = this.component.context.totalpendinglbl.$el;
//      this.change = this.component.context.change.$el;
//      this.changelbl = this.component.context.changelbl.$el;
//      this.overpayment = this.component.context.overpayment.$el;
//      this.overpaymentlbl = this.component.context.overpaymentlbl.$el;
//      this.doneaction = this.component.context.doneaction.$el;
//      this.coinscontainer = this.component.context.coinscontainer.$el;
      this.updatePending();

      for (i = 0, max = this.paymentButtons.length; i < max; i++) {
        this.addButton(this.paymentButtons[i]);
      }
    },
    addButton : function (btn) {
      var btninst = new btn(this.options);
      if (btninst.render) {
        btninst = btninst.render();
      }
      this.coinscontainer.append(btninst.$el);
    },
    updatePending : function () {
      var paymentstatus = this.receipt.getPaymentStatus();
      if (paymentstatus.change) {
        this.change.text(paymentstatus.change);
        this.change.show();
        this.changelbl.show();
      } else {
        this.change.hide();
        this.changelbl.hide();
      }
      if (paymentstatus.overpayment) {
        this.overpayment.text(paymentstatus.overpayment);
        this.overpayment.show();
        this.overpaymentlbl.show();
      } else {
        this.overpayment.hide();
        this.overpaymentlbl.hide();
      }
      if (paymentstatus.done) {
        this.totalpending.hide();
        this.totalpendinglbl.hide();        
        this.coinscontainer.hide();
        this.doneaction.show();
      } else {
        this.totalpending.text(paymentstatus.pending);
        this.totalpending.show();
        this.totalpendinglbl.show();
        this.doneaction.hide();
        this.coinscontainer.show();
      }
    }

  });
}());