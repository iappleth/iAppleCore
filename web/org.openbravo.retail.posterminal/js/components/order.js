/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo */

enyo.kind({
  kind: 'OB.UI.SmallButton',
  name: 'OB.UI.BtnReceiptToInvoice',
  events: {
    onCancelReceiptToInvoice: ''
  },
  tag: 'button',
  style: 'width: 50px;',
  classes: 'btnlink-white btnlink-payment-clear btn-icon-small btn-icon-check',
  tap: function() {
    this.doCancelReceiptToInvoice();
  }
});

enyo.kind({
  name: 'btninvoice',
  showing: false,
  style: 'float: left; width: 50%;',
  components: [{
    kind: 'OB.UI.BtnReceiptToInvoice'
  }, {
    tag: 'span',
    content: ' '
  }, {
    tag: 'span',
    style: 'font-weight:bold; ',
    content: 'Invoice'
  }]
});

enyo.kind({
  name: 'OB.UI.OrderView',
  published: {
    order: null
  },
  components: [{
    kind: 'OB.UI.ScrollableTable',
    name: 'listOrderLines',
    scrollAreaMaxHeight: '432px',
    renderLine: 'OB.UI.RenderOrderLine',
    renderEmpty: 'OB.UI.RenderOrderLineEmpty',
    //defined on redenderorderline.js
    listStyle: 'edit'
  }, {
    tag: 'ul',
    classes: 'unstyled',
    components: [{
      tag: 'li',
      components: [{
        style: 'position: relative; padding: 10px;',
        components: [{
          style: 'float: left; width: 80%;',
          content: OB.I18N.getLabel('OBPOS_LblTotal')
        }, {
          name: 'totalgross',
          style: 'float: left; width: 20%; text-align:right; font-weight:bold;'
        }, {
          style: 'clear: both;'
        }]
      }]
    }, {
      tag: 'li',
      components: [{
        style: 'padding: 10px; border-top: 1px solid #cccccc; height: 40px;',
        components: [{
          kind: 'btninvoice',
          name: 'divbtninvoice',
          showing: false
        }, {
          name: 'divreturn',
          showing: false,
          style: 'float: right; width: 50%; text-align: right; font-weight:bold; font-size: 30px; color: #f8941d;',
          content: OB.I18N.getLabel('OBPOS_ToBeReturned')
        }, {
          style: 'clear: both;'
        }]
      }]
    }]
  }],
  renderTotal: function(newTotal) {
    this.$.totalgross.setContent(OB.I18N.formatCurrency(newTotal));
  },
  initComponents: function() {
    this.inherited(arguments);
  },
  orderChanged: function(oldValue) {
    this.renderTotal(this.order.getTotal());
    this.$.listOrderLines.setCollection(this.order.get('lines'));
    this.order.on('change:gross', function(model) {
      this.renderTotal(model.getTotal());
    }, this);
    this.order.on('change:orderType', function(model) {
      if (model.get('orderType') === 1) {
        this.$.divreturn.show();
      } else {
        this.$.divreturn.hide();
      }
    }, this);
    this.order.on('change:generateInvoice', function(model) {
      if (model.get('generateInvoice')) {
        this.$.divbtninvoice.show();
      } else {
        this.$.divbtninvoice.hide();
      }
    }, this);
  }
});