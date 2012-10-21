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
  name: 'OB.UI.ModalReceiptLinesProperties',
  kind: 'OB.UI.ModalAction',
  myId: 'receiptLinesPropertiesDialog',
  handlers: {
    onApplyChanges: 'applyChanges'
  },
  header: OB.I18N.getLabel('OBPOS_ReceiptPropertiesDialogTitle'),
  bodyContentClass: 'modal-dialog-content-receipt-properties',
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
  loadValue: function(mProperty) {
    this.waterfall('onLoadValue', {
      order: this.currentLine,
      modelProperty: mProperty
    });
  },
  applyChanges: function(sender, event) {
    $('#' + this.myId).modal('hide');
    this.waterfall('onApplyChange', {
      orderline: this.currentLine
    });
  },
  initComponents: function() {
    this.inherited(arguments);
    this.attributeContainer = this.$.bodyContent.$.attributes;
    enyo.forEach(this.newAttributes, function(natt) {
      this.$.bodyContent.$.attributes.createComponent({
        kind: 'OB.UI.PropertyEditLine',
        name: 'line_' + natt.name,
        newAttribute: natt
      });
    }, this);
  },
  init: function(model) {
    var att;
    this.model = model;
    this.model.get('order').get('lines').on('selected', function(lineSelected) {
      this.currentLine = lineSelected;
      if (lineSelected) {
        var diff = lineSelected.attributes;
        for (att in diff) {
          this.loadValue(att);
        }
      }
    }, this);
  }
});


enyo.kind({
  name: 'OB.UI.ModalReceiptLinesPropertiesImpl',
  kind: 'OB.UI.ModalReceiptLinesProperties',
  newAttributes: [{
    kind: 'OB.UI.renderTextProperty',
    name: 'receiptLineDescription',
    modelProperty: 'description',
    label: OB.I18N.getLabel('OBPOS_LblDescription')
  }]
});