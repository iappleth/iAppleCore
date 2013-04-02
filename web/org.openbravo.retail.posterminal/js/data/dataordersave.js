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

  OB.DATA.OrderSave = function (model) {
    this.context = model;
    this.receipt = model.get('order');

    this.receipt.on('closed', function () {
      var me = this,
          docno = this.receipt.get('documentNo'),
          isLayaway = (this.receipt.get('orderType') === 2 || this.receipt.get('isLayaway')),
          json = this.receipt.serializeToJSON(),
          receiptId = this.receipt.get('id'),
          creationDate = new Date(),
          creationDateTransformed = new Date(creationDate.getUTCFullYear(), creationDate.getUTCMonth(), creationDate.getUTCDate(), creationDate.getUTCHours(), creationDate.getUTCMinutes(), creationDate.getUTCSeconds());

      if (this.receipt.get('isbeingprocessed') === 'Y') {
        //The receipt has already been sent, it should not be sent again
        return;
      }

      this.receipt.set('hasbeenpaid', 'Y');

      OB.UTIL.updateDocumentSequenceInDB(docno);

      delete this.receipt.attributes.json;
      this.receipt.set('timezoneOffset', creationDate.getTimezoneOffset());
      this.receipt.set('created', creationDate.getTime());
      this.receipt.set('json', JSON.stringify(this.receipt.toJSON()));

      // The order will not be processed if the navigator is offline
      if (OB.POS.modelterminal.get('connectedToERP')) {
        this.receipt.set('isbeingprocessed', 'Y');
      }

      OB.Dal.save(this.receipt, function () {
        if (OB.POS.modelterminal.get('connectedToERP')) {
          OB.Dal.get(OB.Model.Order, receiptId, function (receipt) {
            var successCallback, errorCallback, orderList;
            successCallback = function () {
              //In case the processed document is a quotation, we remove its id so it can be reactivated
              if (model.get('order') && model.get('order').get('isQuotation')) {
                model.get('order').set('oldId', model.get('order').get('id'));
                model.get('order').set('id', null);
                model.get('order').set('isbeingprocessed', 'N');
                OB.UTIL.showSuccess(OB.I18N.getLabel('OBPOS_QuotationSaved', [docno]));
              } else {
                if (isLayaway) {
                  OB.UTIL.showSuccess(OB.I18N.getLabel('OBPOS_MsgLayawaySaved', [docno]));
                } else {
                  OB.UTIL.showSuccess(OB.I18N.getLabel('OBPOS_MsgReceiptSaved', [docno]));
                }
              }
            };
            errorCallback = function () {
              OB.UTIL.showError(OB.I18N.getLabel('OBPOS_MsgReceiptNotSaved', [docno]));
            };
            orderList = new OB.Collection.OrderList();
            orderList.add(receipt);
            OB.UTIL.processOrders(model, orderList, successCallback, errorCallback);
          }, null);
        }
      }, function () {
        //We do nothing: we don't need to alert the user, as the order is still present in the database, so it will be resent as soon as the user logs in again
      });
    }, this);
  };
}());