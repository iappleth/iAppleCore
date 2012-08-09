/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global window, B, Backbone */

enyo.kind({
  name: 'OB.OBPOSCashUp.UI.RenderPendingReceiptLine',
  components: [{
    classes: 'display: table-row; height: 42px;',
      components: [{
        name: 'orderDate',
        style: 'display: table-cell; vertical-align: middle; padding: 2px 5px 2px 5px; border-bottom: 1px solid #cccccc; width: 10%;'
      }, {
        name: 'documentNo',
        style: 'display: table-cell; vertical-align: middle; padding: 2px 5px 2px 5px; border-bottom: 1px solid #cccccc; width: 20%;'
      }, {
        name: 'bp',
        style: 'display: table-cell; vertical-align: middle; padding: 2px 5px 2px 5px; border-bottom: 1px solid #cccccc; width: 39%;'
      }, {
        tag: 'strong',
        components: [{
          name: 'printGross',
          style: 'display: table-cell; vertical-align: middle; padding: 2px 5px 2px 5px; border-bottom: 1px solid #cccccc; width: 15%;  text-align:right;'
        }]
      }]
  }],
  create: function () {
    this.inherited(arguments);
  }
});

enyo.kind({
  name: 'OB.OBPOSCashUp.UI.ListPendingReceipts',
  components: [ {
    classes: 'tab-pane',
    components: [ {
      style: 'overflow:auto; height: 500px; margin: 5px',
      components: [ {
        style: 'background-color: #ffffff; color: black; padding: 5px;',
        components: [ {
          classes: 'row-fluid',
          components: [ {
            classes: 'span12',
            components: [ {
              style: 'padding: 10px; border-bottom: 1px solid #cccccc; text-align:center;',
              content: OB.I18N.getLabel('OBPOS_LblStep1of4')
            }]
          }]
        },
        {
          classes: 'row-fluid',
          components: [{
            style: 'span12',
            components: [{
              classes: 'row-fluid',
                components: [ {
                  name: 'pendingReceiptList',
                  kind: 'OB.UI.Table',
                  renderLine: 'OB.OBPOSCashUp.UI.RenderPendingReceiptLine',
                  renderEmpty: 'OB.UI.RenderEmpty',
                  listStyle: 'list'
                }]
            }]
          }]
        }]
      }]
    }]
  }],
  create: function () {
    this.inherited(arguments);
  },
  init: function () {
    //FIXME: Temporal solution
    this.$.pendingReceiptList.setCollection(new Backbone.Collection());
  }
});


//(function () {
//
//  OB = window.OB || {};
//  OB.COMP = window.OB.COMP || {};
//  var me = this;
//  OB.COMP.PendingReceipts = OB.COMP.CustomView.extend({
//  _id: 'pendingreceipts',
//   createView: function () {
//      return (
//        {kind: B.KindJQuery('div'), attr: {'id': 'pendingreceipts', 'class': 'tab-pane'}, content: [
//          {kind: B.KindJQuery('div'), attr: {'style': 'overflow:auto; height: 500px; margin: 5px'}, content: [
//            {kind: B.KindJQuery('div'), attr: {'style': 'background-color: #ffffff; color: black; padding: 5px;'}, content: [
//              {kind: B.KindJQuery('div'), attr: {'class': 'row-fluid'}, content: [
//                {kind: B.KindJQuery('div'), attr: {'class': 'span12'}, content: [
//                  {kind: B.KindJQuery('div'), attr: {'style': 'padding: 10px; border-bottom: 1px solid #cccccc; text-align:center;'}, content: [
//
//                     OB.I18N.getLabel('OBPOS_LblStep1of4')
//
//                  ]}
//                ]}
//              ]},
//              {kind: B.KindJQuery('div')},
//              {kind: OB.COMP.ListPendingReceipts}
//            ]}
//          ]}
//        ]}
//      );
//    }
//  });
//
//}());