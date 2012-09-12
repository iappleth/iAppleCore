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
  name: 'OB.UI.ModalPayment',
  kind: 'OB.UI.Modal',
  myId: 'modalp',
  header: '',
  maxheight: '600px',
  show: function(receipt, provider, key, name, paymentMethod, amount) {
    
    if (receipt.get('orderType') === 0) {
      this.$.divheader.setContent(OB.I18N.getLabel('OBPOS_LblModalPayment', [OB.I18N.formatCurrency(amount)]));
    } else if  (receipt.get('orderType') === 1) {
      this.$.divheader.setContent(OB.I18N.getLabel('OBPOS_LblModalReturn', [OB.I18N.formatCurrency(amount)]));
    } else {
      this.$.divheader.setContent('');
    }    
    
	  this.$.body.destroyComponents();
    this.$.body.createComponent({
      kind: provider,
      paymentMethod: paymentMethod,
      paymentType: name,
      paymentAmount: amount,
      key: key,
      receipt: receipt
    }).render();

    $('#modalp').modal('show');
  }
});