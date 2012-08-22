/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, $ */

enyo.kind({
  kind: 'OB.UI.ModalAction',
  name: 'OB.OBPOSCashUp.UI.modalFinished',
  header: OB.I18N.getLabel('OBPOS_LblGoodjob'),
  bodyContent: {
    content: OB.I18N.getLabel('OBPOS_FinishCloseDialog')
  },
  bodyButtons: {
    tag: 'div',
    components: [{
      //OK button
      kind: 'OB.UI.Button',
      classes: 'btnlink btnlink-gray modal-dialog-content-button',
      content: OB.I18N.getLabel('OBPOS_LblOk'),
      tap: function() {
        $('#' + this.parent.parent.parent.parent.parent.getId()).modal('hide');
        OB.POS.navigate('retail.pointofsale');
      }
    }]
  }
});

enyo.kind({
  kind: 'OB.UI.ModalAction',
  name: 'OB.OBPOSCashUp.UI.modalPendingToProcess',
  header: OB.I18N.getLabel('OBPOS_LblReceiptsToProcess'),
  bodyContent: {
    content: OB.I18N.getLabel('OBPOS_MsgReceiptsProcess')
  },
  bodyButtons: {
    tag: 'div',
    components: [{
      kind: 'OB.UI.Button',
      classes: 'btnlink btnlink-gray modal-dialog-content-button',
      content: OB.I18N.getLabel('OBPOS_LblOk'),
      tap: function() {
        //continue with orders which have been paid.
        $('#' + this.parent.parent.parent.parent.parent.getId()).modal('hide');
      }
    }, {
      kind: 'OB.UI.Button',
      classes: 'btnlink btnlink-gray modal-dialog-content-button',
      content: OB.I18N.getLabel('OBPOS_LblCancel'),
      tap: function() {
        $('#' + this.parent.parent.parent.parent.parent.getId()).modal('hide');
        OB.POS.navigate('retail.pointofsale');
      }
    }]
  }
});