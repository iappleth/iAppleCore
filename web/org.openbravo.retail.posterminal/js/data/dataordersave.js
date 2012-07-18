/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global B,_*/

(function () {

  OB = window.OB || {};
  OB.DATA = window.OB.DATA || {};

  OB.DATA.OrderSave = function (context) {
    this._id = 'logicOrderSave';
    this.context = context;
    this.receipt = context.modelorder;

    this.receipt.on('closed', function () {
      var me = this,
          docno = this.receipt.get('documentNo'),
          json = this.receipt.serializeToJSON(),
          receiptId = this.receipt.get('id');

      this.receipt.set('hasbeenpaid', 'Y');

      delete this.receipt.attributes.json;
      this.receipt.set('json', JSON.stringify(this.receipt.toJSON()));

      // The order will not be processed if the navigator is offline
      if (OB.POS.modelterminal.get('connectedToERP')) {
        this.receipt.set('isbeingprocessed', 'Y');
      }

      OB.Dal.save(this.receipt, function () {
        if (OB.POS.modelterminal.get('connectedToERP')) {
          OB.Dal.get(OB.Model.Order, receiptId, function (receipt) {
            var successCallback, errorCallback, orderList;
            successCallback = function() {
              OB.UTIL.showSuccess(OB.I18N.getLabel('OBPOS_MsgReceiptSaved', [docno]));
            };
            errorCallback = function() {
              OB.UTIL.showError(OB.I18N.getLabel('OBPOS_MsgReceiptNotSaved', [docno]));
            };
            orderList = new OB.Collection.OrderList();
            orderList.add(receipt);
            OB.UTIL.processOrders(context, orderList, successCallback, errorCallback);
          }, null);
        }
      }, function () {
        OB.UTIL.showError(OB.I18N.getLabel('OBPOS_MsgReceiptNotSaved', [docno]));
      });
    }, this);
  };
}());