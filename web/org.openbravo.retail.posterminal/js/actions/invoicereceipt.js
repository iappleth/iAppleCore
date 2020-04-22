/*
 ************************************************************************************
 * Copyright (C) 2019-2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB*/

(function() {
  OB.MobileApp.actionsRegistry.register(
    new OB.Actions.CommandAction({
      window: 'retail.pointofsale',
      name: 'invoiceReceipt',
      permission: 'OBPOS_receipt.invoice',
      properties: {
        i18nContent: 'OBPOS_LblInvoice'
      },
      isActive: function(view) {
        var receipt = view.model.get('order');

        return (
          receipt &&
          !receipt.get('isQuotation') &&
          !receipt.get('fullInvoice') &&
          (receipt.getInvoiceTerms() === 'I' ||
            receipt.getInvoiceTerms() === 'D' ||
            receipt.getInvoiceTerms() === 'O')
        );
      },
      command: function(view) {
        const receipt = view.model.get('order');
        if (receipt.checkFullInvoice(true)) {
          view.receiptToInvoice();
        } else {
          view.cancelReceiptToInvoice();
        }
      }
    })
  );
})();
