/*
 ************************************************************************************
 * Copyright (C) 2015-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global Backbone, _, enyo */

enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.OBPOSPointOfSale.UI.Modals.btnModalRejectQuotationCancel',
  classes: 'obObposPointOfSaleUiModalsBtnModalRejectQuotationCancel',
  i18nContent: 'OBMOBC_LblCancel',
  tap: function() {
    this.doHideThisPopup();
  }
});
enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.OBPOSPointOfSale.UI.Modals.btnModalRejectQuotationAccept',
  classes: 'obObposPointOfSaleUiModalsBtnModalRejectQuotationAccept',
  i18nContent: 'OBMOBC_LblOk',
  events: {
    onRejectQuotationDone: ''
  },
  tap: function() {
    this.doRejectQuotationDone();
    this.doHideThisPopup();
  }
});
enyo.kind({
  kind: 'OB.UI.List',
  name: 'OB.UI.ModalRejectQuotationRejectReason',
  classes: 'obUiModalRejectQuotationRejectReason',
  renderLine: enyo.kind({
    kind: 'enyo.Option',
    classes: 'obUiModalRejectQuotationRejectReason-renderLine-enyoOption',
    initComponents: function() {
      this.inherited(arguments);
      this.setValue(this.model.get('id'));
      this.setContent(this.model.get('_identifier'));
    }
  }),
  renderEmpty: 'enyo.Control',
  initComponents: function() {
    this.setCollection(new Backbone.Collection());
  }
});

enyo.kind({
  kind: 'OB.UI.ModalAction',
  name: 'OB.UI.ModalRejectQuotation',
  classes: 'obUiModalRejectQuotation',
  myId: 'modalRejectQuotation',
  bodyContent: {
    classes: 'obUiModalRejectQuotation-bodyContent',
    components: [
      {
        name: 'labelRejectReason',
        classes: 'obUiModalRejectQuotation-bodyContent-labelRejectReason'
      },
      {
        classes: 'obUiModalRejectQuotation-bodyContent-rejectReason',
        kind: 'OB.UI.ModalRejectQuotationRejectReason',
        name: 'rejectReason'
      }
    ]
  },
  i18nHeader: 'OBPOS_RejectQuotation',
  bodyButtons: {
    classes: 'obUiModalRejectQuotation-bodyButtons',
    components: [
      {
        kind: 'OB.OBPOSPointOfSale.UI.Modals.btnModalRejectQuotationAccept',
        classes:
          'obUiModalRejectQuotation-bodyButtons-obObposPointOfSaleUiModalsBtnModalRejectQuotationAccept'
      },
      {
        kind: 'OB.OBPOSPointOfSale.UI.Modals.btnModalRejectQuotationCancel',
        classes:
          'obUiModalRejectQuotation-bodyButtons-obObposPointOfSaleUiModalsBtnModalRejectQuotationCancel'
      }
    ]
  },
  events: {
    onRejectQuotation: ''
  },
  handlers: {
    onRejectQuotationDone: 'doRejectQuotationDone'
  },
  doRejectQuotationDone: function() {
    this.doRejectQuotation({
      rejectReason: this.$.bodyContent.$.rejectReason.getValue()
    });
  },
  initComponents: function() {
    this.inherited(arguments);
    this.$.bodyContent.$.labelRejectReason.setContent(
      OB.I18N.getLabel('OBPOS_lblRejectReason')
    );
    var rejectReasonCollection = [];
    _.each(OB.MobileApp.model.get('rejectReasons'), function(reason) {
      rejectReasonCollection.push(
        new Backbone.Model({
          id: reason.id,
          _identifier: reason._identifier
        })
      );
    });
    this.$.bodyContent.$.rejectReason
      .getCollection()
      .reset(rejectReasonCollection);
  }
});
