/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, Backbone, enyo */

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.ReceiptView',
  classes: 'span6',
  published: {
    order: null,
    orderList: null
  },
  components: [{
    style: 'overflow:auto; margin: 5px',
    components: [{
      style: 'position: relative;background-color: #ffffff; color: black;',
      components: [{
        kind: 'OB.UI.ReceiptsCounter',
        name: 'receiptcounter'
      }, {
        style: 'padding: 5px;',
        components: [{
          classes: 'row-fluid',
          components: [{
            classes: 'span12',
            components: [{
              style: 'padding: 5px 0px 10px 0px; border-bottom: 1px solid #cccccc;',
              components: [{
                kind: 'OB.UI.OrderDetails',
                name: 'orderdetails'
              }, {
                kind: 'OB.UI.BusinessPartner',
                name: 'bpbutton'
              }, {
                style: 'clear:both;'
              }]
            }]
          }]
        }, {
          classes: 'row-fluid',
          style: 'max-height: 536px; overflow: auto;',
          components: [{
            classes: 'span12',
            components: [{
              kind: 'OB.UI.OrderView',
              name: 'orderview'
            }]
          }]
        }]
      }]
    }]
  }],
  orderChanged: function(oldValue) {
    this.$.bpbutton.setOrder(this.order);
    this.$.orderdetails.setOrder(this.order);
    this.$.orderview.setOrder(this.order);
  },
  orderListChanged: function(oldValue) {
    this.$.receiptcounter.setOrderList(this.orderList);
  }
});