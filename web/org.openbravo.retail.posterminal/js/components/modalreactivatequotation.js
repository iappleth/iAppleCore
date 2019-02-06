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
  name: 'OB.OBPOSPointOfSale.UI.Modals.btnModalReactivateQuotationCancel',
  i18nContent: 'OBMOBC_LblCancel',
  tap: function () {
    this.doHideThisPopup();
  }
});
enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.OBPOSPointOfSale.UI.Modals.btnModalReactivateQuotationAccept',
  i18nContent: 'OBMOBC_LblOk',
  events: {
    onReactivateQuotation: ''
  },
  tap: function () {
    this.doReactivateQuotation();
    this.doHideThisPopup();
  }
});


enyo.kind({
  kind: 'OB.UI.ModalAction',
  name: 'OB.UI.ModalReactivateQuotation',
  myId: 'modalReactivateQuotation',
  bodyContent: {
    i18nContent: 'OBPOS_ReactivateQuotationMessage'
  },
  i18nHeader: 'OBPOS_ReactivateQuotation',
  bodyButtons: {
    components: [{
      kind: 'OB.OBPOSPointOfSale.UI.Modals.btnModalReactivateQuotationAccept'
    }, {
      kind: 'OB.OBPOSPointOfSale.UI.Modals.btnModalReactivateQuotationCancel'
    }]
  }
});