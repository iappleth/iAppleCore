/*
 ************************************************************************************
 * Copyright (C) 2012-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo */

enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.OBPOSPointOfSale.UI.Modals.btnModalCreateOrderCancel',
  classes: 'obObposPointOfSaleUiModalsBtnModalCreateOrderCancel',
  i18nContent: 'OBMOBC_LblCancel',
  tap: function() {
    this.doHideThisPopup();
  }
});
enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.OBPOSPointOfSale.UI.Modals.btnModalCreateOrderAccept',
  classes: 'obObposPointOfSaleUiModalsbtnModalCreateOrderAccept',
  i18nContent: 'OBPOS_CreateOrderFromQuotation',
  events: {
    onCreateOrderFromQuotation: ''
  },
  tap: function() {
    var checked = !this.owner.$.updateprices.checked;
    this.doHideThisPopup();
    this.parent.parent.parent.theQuotation.createOrderFromQuotation(checked);
  }
});

enyo.kind({
  name: 'OB.UI.updateprices',
  kind: 'OB.UI.CheckboxButton',
  classes: 'obUiUpdateprices',
  checked: false,
  init: function() {
    this.checked = !OB.MobileApp.model.get('permissions')[
      'OBPOS_quotation.defaultNotFirm'
    ];
    this.addRemoveClass('obUiUpdateprices_active', this.checked);

    this.setDisabled(
      !OB.MobileApp.model.hasPermission('OBPOS_quotation.editableFirmCheck')
    );
  }
});

enyo.kind({
  kind: 'OB.UI.Modal',
  name: 'OB.UI.ModalCreateOrderFromQuotation',
  classes: 'obUiModalCreateOrderFromQuotation',
  myId: 'modalCreateOrderFromQuotation',
  i18nBody: 'OBPOS_QuotationUpdatePricesText',
  footer: {
    classes: 'obUiModalCreateOrderFromQuotation-footer',
    components: [
      {
        classes: 'obUiModalCreateOrderFromQuotation-footer-element1'
      },
      {
        classes: 'obUiModalCreateOrderFromQuotation-footer-container2',
        components: [
          {
            kind: 'OB.UI.updateprices',
            classes:
              'obUiModalCreateOrderFromQuotation-footer-container2-obUiupdateprices',
            myId: 'updatePricesCheck'
          }
        ]
      },
      {
        classes: 'obUiModalCreateOrderFromQuotation-footer-element3',
        initComponents: function() {
          this.setContent(OB.I18N.getLabel('OBPOS_QuotationUpdatePrices'));
        }
      },
      {
        classes: 'obUiModalCreateOrderFromQuotation-footer-element4 u-clearBoth'
      },
      {
        kind: 'OB.OBPOSPointOfSale.UI.Modals.btnModalCreateOrderAccept',
        classes:
          'obUiModalCreateOrderFromQuotation-footer-obObposPointOfSaleUiModalsbtnModalCreateOrderAccept'
      },
      {
        kind: 'OB.OBPOSPointOfSale.UI.Modals.btnModalCreateOrderCancel',
        classes:
          'obUiModalCreateOrderFromQuotation-footer-obObposPointOfSaleUiModalsbtnModalCreateOrderCancel'
      }
    ]
  },
  init: function(model) {
    this.model = model;
    var receipt = this.model.get('order');
    this.theQuotation = receipt;
  }
});
