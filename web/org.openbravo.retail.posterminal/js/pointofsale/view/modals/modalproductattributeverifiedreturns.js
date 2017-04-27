/*
 ************************************************************************************
 * Copyright (C) 2013-2017 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
/*global OB, moment, enyo */
enyo.kind({
  kind: 'OB.UI.ModalAction',
  name: 'OB.UI.ModalProductAttributeVerifiedReturns',
  i18nHeader: 'OBPOS_ModalProductAttributeVerifiedReturnsTitle',
  style: 'width: 700px;',
  autoDismiss: false,
  bodyContent: {
    name: 'verifiedReturns'
  },
  bodyButtons: {
    components: [{
      kind: 'OB.UI.ModalDialogButton',
      i18nContent: 'OBMOBC_LblOk',
      isDefaultAction: true,
      tap: function () {
        this.owner.owner.validateAction();
      }
    }, {
      kind: 'OB.UI.ModalDialogButton',
      i18nContent: 'OBPOS_LblClear',
      tap: function () {
        this.owner.owner.clearAction();
      }
    }, {
      kind: 'OB.UI.ModalDialogButton',
      i18nContent: 'OBMOBC_LblCancel',
      tap: function () {
        this.owner.owner.cancelAction();
      }
    }]
  },
  clearAction: function () {
    var me = this,
        i, line = me.args.line;
    for (i = 0; i < line.length; i++) {
      me.$.bodyContent.$.verifiedReturns.$['valueAttribute' + i].setValue(null);
    }
    this.validateAttributeWithOrderlines();
    return;
  },
  cancelAction: function () {
    this.hide();
    return;
  },
  validateAction: function () {
    var me = this;
    me.args.returnLinesPopup.callbackExecutor();
    this.hide();
    return;
  },
  validateAttributeWithOrderlines: function (inSender, inEvent) {
    var me = this,
        line = me.args.line,
        notValidAttribute = false,
        orderlineAttribute, orderlineProduct, inputlineProduct, inputlineAttribute, i;
    for (i = 0; i < line.length; i++) {
      orderlineProduct = line[i].id;
      orderlineAttribute = line[i].attributeValue;
      inputlineProduct = me.$.bodyContent.$.verifiedReturns.$['productId' + i].getContent();
      inputlineAttribute = me.$.bodyContent.$.verifiedReturns.$['valueAttribute' + i].getValue();
      if (inputlineAttribute) {
        if ((orderlineAttribute !== inputlineAttribute) && (orderlineProduct === inputlineProduct)) {
          notValidAttribute = true;
          me.$.bodyContent.$.verifiedReturns.$['valueAttribute' + i].addStyles('background-color: red');
        } else {
          me.$.bodyContent.$.verifiedReturns.$['valueAttribute' + i].addStyles('background-color: #6cb33f');
        }
      }
    }
    if (notValidAttribute === false) {
      me.$.bodyButtons.$.modalDialogButton.setDisabled(true);
    }
    return true;
  },
  executeOnShow: function () {
    var me = this,
        line = me.args.line,
        i;
    me.$.bodyContent.$.verifiedReturns.destroyComponents();
    me.$.bodyContent.$.verifiedReturns.createComponent({
      initComponents: function () {
        this.setContent(OB.I18N.getLabel('OBPOS_ProductAttributeValueVerifiedReturnsDesc'));
      }
    });
    for (i = 0; i < line.length; i++) {
      me.$.bodyContent.$.verifiedReturns.createComponent({
        components: [{
          name: 'productName' + i,
          type: 'text',
          classes: 'span4',
          style: 'line-height: 35px; font-size: 17px;text-align: left;width: 275px; padding-top: 10px;padding-left: 5px;font-weight: bold'
        }, {
          kind: 'enyo.Input',
          type: 'text',
          maxlength: '70',
          classes: 'span4',
          style: 'line-height: 35px; font-size: 17px;text-align: center;width: 400px; padding-top: 10px;',
          name: 'valueAttribute' + i,
          isFirstFocus: true,
          handlers: {
            onblur: 'validateAttributeWithOrderlines'
          },
          placeholder: 'Enter attribute value'
        }, {
          name: 'productId' + i,
          type: 'hidden'
        }]
      });
      me.$.bodyContent.$.verifiedReturns.$['productId' + i].setContent(line[i].id);
      me.$.bodyContent.$.verifiedReturns.$['productName' + i].setContent(line[i].name);
      me.$.bodyContent.$.verifiedReturns.$['productId' + i].hide();
      me.$.bodyButtons.$.modalDialogButton.setDisabled(true);
    }
    me.$.bodyContent.$.verifiedReturns.render();
  }
});

OB.UI.WindowView.registerPopup('OB.OBPOSPointOfSale.UI.PointOfSale', {
  kind: 'OB.UI.ModalProductAttributeVerifiedReturns',
  name: 'OB.UI.ModalProductAttributeVerifiedReturns'
});