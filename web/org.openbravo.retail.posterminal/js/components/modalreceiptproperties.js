/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, Backbone, $ */

enyo.kind({
  name: 'OB.UI.ModalReceiptProperties',
  kind: 'OB.UI.ModalAction',
  handlers: {
    onApplyChanges: 'applyChanges'
  },
  header: OB.I18N.getLabel('OBPOS_ReceiptPropertiesDialogTitle'),
  bodyContent: {
    kind: 'Scroller',
    maxHeight: '225px',
    style: 'background-color: #ffffff;',
    thumb: true,
    horizontal: 'hidden',
    components: [{
      name: 'attributes'
    }]
  },
  bodyButtons: {
    components: [{
      kind: 'OB.UI.ReceiptPropertiesDialogApply'
    }, {
      kind: 'OB.UI.ReceiptPropertiesDialogCancel'
    }]
  },
  loadValue: function (mProperty) {
    this.waterfall('onLoadValue', {
      order: this.model.get('order'),
      modelProperty: mProperty
    });
  },
  applyChanges: function (inSender, inEvent) {
    this.waterfall('onApplyChange', {});
    return true;
  },
  initComponents: function () {
    this.inherited(arguments);
    this.attributeContainer = this.$.bodyContent.$.attributes;
    enyo.forEach(this.newAttributes, function (natt) {
      this.$.bodyContent.$.attributes.createComponent({
        kind: 'OB.UI.PropertyEditLine',
        name: 'line_' + natt.name,
        newAttribute: natt
      });
    }, this);
  },
  init: function (model) {
    this.model = model;
    this.model.get('order').bind('change', function () {
      var diff = this.model.get('order').changedAttributes(),
          att;
      for (att in diff) {
        if (diff.hasOwnProperty(att)) {
          this.loadValue(att);
        }
      }
    }, this);
  }
});


enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.UI.ReceiptPropertiesDialogApply',
  content: OB.I18N.getLabel('OBPOS_LblApply'),
  isDefaultAction: true,
  events: {
    onApplyChanges: ''
  },
  tap: function () {
    if (this.doApplyChanges()) {
      this.doHideThisPopup();
    }
  }
});

enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.UI.ReceiptPropertiesDialogCancel',
  content: OB.I18N.getLabel('OBPOS_LblCancel'),
  tap: function () {
    this.doHideThisPopup();
  }
});

enyo.kind({
  name: 'OB.UI.PropertyEditLine',
  components: [{
    style: 'border: 1px solid #F0F0F0; background-color: #E2E2E2; color: black; width: 150px; height: 40px; float: left; text-align: right;',
    components: [{
      name: 'labelLine',
      style: 'padding: 5px 8px 0px 0px; font-size: 15px;',
      content: ''
    }]
  }, {
    style: 'border: 1px solid #F0F0F0; float: left;',
    components: [{
      name: 'newAttribute',
      classes: 'modal-dialog-receipt-properties-text'
    }]
  }, {
    style: 'clear: both'
  }],
  initComponents: function () {
    this.inherited(arguments);
    this.propertycomponent = this.$.newAttribute.createComponent(this.newAttribute);
    this.$.labelLine.content = this.newAttribute.label;
  }
});

enyo.kind({
  name: 'OB.UI.renderTextProperty',
  kind: 'enyo.Input',
  type: 'text',
  classes: 'input',
  style: 'width: 392px;',
  handlers: {
    onLoadValue: 'loadValue',
    onApplyChange: 'applyChange'
  },
  events: {
    onSetProperty: '',
    onSetLineProperty: ''
  },
  loadValue: function (inSender, inEvent) {
    if (this.modelProperty === inEvent.modelProperty) {
      if (inEvent.order.get(this.modelProperty)) {
        this.setValue(inEvent.order.get(this.modelProperty));
      } else {
        this.setValue('');
      }
    }
  },
  applyChange: function (inSender, inEvent) {
    return this.applyValue(inEvent.orderline);
  },
  applyValue: function (orderline) {
    if (orderline) {
      this.doSetLineProperty({
        line: orderline,
        property: this.modelProperty,
        value: this.getValue()
      });
    } else {
      this.doSetProperty({
        property: this.modelProperty,
        value: this.getValue()
      });
    }
    return true;
  },
  initComponents: function () {
    if (this.readOnly) {
      this.setAttribute('readonly', 'readonly');
    }
  }
});

enyo.kind({
  name: 'OB.UI.renderBooleanProperty',
  kind: 'OB.UI.CheckboxButton',
  classes: 'modal-dialog-btn-check',
  handlers: {
    onLoadValue: 'loadValue',
    onApplyChange: 'applyChange',
    onLoadContent: 'loadContent'
  },
  events: {
    onSetProperty: '',
    onSetLineProperty: ''
  },
  loadValue: function (inSender, inEvent) {
    var i, splitResult, contentProperty, contentInModel;
    if (this.modelProperty === inEvent.modelProperty) {
      if (inEvent.order.get(this.modelProperty) !== undefined) {
        this.checked = inEvent.order.get(this.modelProperty);
      }

      if (this.checked) {
        this.addClass('active');
      } else {
        this.removeClass('active');
      }
    }

    if (this.modelContent !== undefined && this.modelContent !== "") {
      splitResult = this.modelContent.split(':');
      if (splitResult.length > 0) {
        contentProperty = splitResult[0];

        if (contentProperty === inEvent.modelProperty) {
          contentInModel = inEvent.order;
          for (i = 0; i < splitResult.length; i++) {
            contentInModel = contentInModel.get(splitResult[i]);
          }

          if (contentInModel !== undefined) {
            this.content = contentInModel;
          }
        }
      }
    }

  },
  applyChange: function (inSender, inEvent) {
    if (inEvent.orderline) {
      this.doSetLineProperty({
        line: inEvent.orderline,
        property: this.modelProperty,
        value: this.checked
      });
    } else {
      this.doSetProperty({
        property: this.modelProperty,
        value: this.checked
      });
    }
  },
  rendered: function () {
    this.inherited(arguments);
    if (this.readOnly) {
      this.setAttribute('disabled', 'disabled');
    }
  }
});

enyo.kind({
  name: 'OB.UI.ModalReceiptPropertiesImpl',
  kind: 'OB.UI.ModalReceiptProperties',
  newAttributes: [{
    kind: 'OB.UI.renderTextProperty',
    name: 'receiptDescription',
    modelProperty: 'description',
    label: OB.I18N.getLabel('OBPOS_LblDescription')
  }, {
    kind: 'OB.UI.renderBooleanProperty',
    name: 'printBox',
    checked: true,
    classes: 'modal-dialog-btn-check active',
    modelProperty: 'print',
    label: OB.I18N.getLabel('OBPOS_Lbl_RP_Print')
  }
/*, {
    kind: 'OB.UI.renderBooleanProperty',
    name: 'emailBox',
    modelContent: 'bp:email',
    modelProperty: 'sendEmail',
    label: OB.I18N.getLabel('OBPOS_LblEmail')
  }*/
  ,
  {
    kind: 'OB.UI.renderBooleanProperty',
    name: 'invoiceBox',
    modelProperty: 'generateInvoice',
    label: OB.I18N.getLabel('OBPOS_ToInvoice'),
    readOnly: true
  }, {
    kind: 'OB.UI.renderBooleanProperty',
    name: 'returnBox',
    modelProperty: 'orderType',
    label: OB.I18N.getLabel('OBPOS_ToBeReturned'),
    readOnly: true
  }]
});