/*
 ************************************************************************************
 * Copyright (C) 2017-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
/*global OB, enyo */
enyo.kind({
  kind: 'OB.UI.ModalAction',
  name: 'OB.UI.ModalProductAttributes',
  classes: 'obUiModalProductAttributes',
  i18nHeader: 'OBPOS_ProductAttributeValueDialogTitle',
  autoDismiss: false,
  bodyContent: {
    classes: 'obUiModalProductAttributes-bodyContent',
    components: [
      {
        initComponents: function() {
          this.setContent(
            OB.I18N.getLabel('OBPOS_ProductAttributeValueDialogTitleDesc')
          );
        }
      },
      {
        kind: 'enyo.Input',
        type: 'text',
        attributes: {
          //Allowed, it is not a style attribute
          maxlength: 190
        },
        name: 'valueAttribute',
        classes: 'obUiModalProductAttributes-bodyContent-valueAttribute',
        selectOnFocus: true,
        isFirstFocus: true
      }
    ]
  },
  bodyButtons: {
    classes: 'obUiModalProductAttributes-bodyButtons',
    components: [
      {
        kind: 'OB.UI.ModalDialogButton',
        classes:
          'obUiModalProductAttributes-bodyButtons-obUiModalDialogButton1',
        i18nContent: 'OBMOBC_LblOk',
        tap: function() {
          this.owner.owner.saveAction();
        }
      },
      {
        kind: 'OB.UI.ModalDialogButton',
        classes:
          'obUiModalProductAttributes-bodyButtons-obUiModalDialogButton2',
        i18nContent: 'OBPOS_LblClear',
        tap: function() {
          this.owner.owner.clearAction();
        }
      },
      {
        kind: 'OB.UI.ModalDialogButton',
        classes:
          'obUiModalProductAttributes-bodyButtons-obUiModalDialogButton3',
        i18nContent: 'OBMOBC_LblCancel',
        tap: function() {
          this.owner.owner.cancelAction();
        }
      }
    ]
  },
  /**
   * This method should be overriden to implement validation of attributes for specific cases
   */
  validAttribute: function(attribute) {
    return true;
  },
  saveAttribute: function(inSender, inEvent) {
    var inpAttributeValue = this.$.bodyContent.$.valueAttribute.getValue();
    inpAttributeValue = inpAttributeValue.replace(/\s+/, '');
    if (
      (this.validAttribute(inpAttributeValue) && inpAttributeValue) ||
      this.owner.model.get('order').get('orderType') === 2 ||
      this.owner.model.get('order').get('isLayaway')
    ) {
      this.args.callback(inpAttributeValue);
      this.hide();
    } else {
      OB.UTIL.showConfirmation.display(
        OB.I18N.getLabel('OBPOS_NoAttributeValue')
      );
    }
  },
  clearAction: function() {
    this.$.bodyContent.$.valueAttribute.setValue(null);
    return;
  },
  cancelAction: function() {
    if (this.args.callback) {
      this.args.callback(null, true);
    }
    this.hide();
    return;
  },
  saveAction: function() {
    this.saveAttribute();
    return;
  },
  executeOnHide: function() {
    this.$.bodyContent.$.valueAttribute.setValue(null);
  },
  executeOnShow: function() {
    if (this.args.options.attSetInstanceDesc) {
      this.$.bodyContent.$.valueAttribute.setValue(
        this.args.options.attSetInstanceDesc
      );
    } else if (this.args.options.attributeValue) {
      this.$.bodyContent.$.valueAttribute.setValue(
        this.args.options.attributeValue
      );
    }
    this.$.headerCloseButton.hide();
  },
  initComponents: function() {
    this.inherited(arguments);
  }
});
