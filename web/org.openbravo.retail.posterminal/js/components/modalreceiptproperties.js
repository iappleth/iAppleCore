/*
 ************************************************************************************
 * Copyright (C) 2013-2016 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, enyo */

enyo.kind({
  name: 'OB.UI.ModalReceiptPropertiesImpl',
  kind: 'OB.UI.ModalReceiptProperties',
  newAttributes: [{
    kind: 'OB.UI.renderTextProperty',
    name: 'receiptDescription',
    modelProperty: 'description',
    i18nLabel: 'OBPOS_LblDescription',
    maxLength: 255
  }, {
    kind: 'OB.UI.renderBooleanProperty',
    name: 'printBox',
    checked: true,
    classes: 'modal-dialog-btn-check active',
    modelProperty: 'print',
    i18nLabel: 'OBPOS_Lbl_RP_Print'
  }, {
    kind: 'OB.UI.renderComboProperty',
    name: 'salesRepresentativeBox',
    modelProperty: 'salesRepresentative',
    i18nLabel: 'OBPOS_SalesRepresentative',
    permission: 'OBPOS_salesRepresentative.receipt',
    permissionOption: 'OBPOS_SR.comboOrModal',
    retrievedPropertyForValue: 'id',
    retrievedPropertyForText: '_identifier',
    init: function (model) {
      this.collection = new OB.Collection.SalesRepresentativeList();
      this.model = model;
      this.doLoadValueNeeded = true;
      if (!OB.MobileApp.model.hasPermission(this.permission)) {
        this.doLoadValueNeeded = false;
        this.parent.parent.parent.hide();
      } else {
        if (OB.MobileApp.model.hasPermission(this.permissionOption, true)) {
          this.doLoadValueNeeded = false;
          this.parent.parent.parent.hide();
        }
      }
    },

    // override to not load things upfront when not needed
    loadValue: function () {
      if (this.doLoadValueNeeded) {
        // call the super implementation in the prototype directly
        OB.UI.renderComboProperty.prototype.loadValue.apply(this, arguments);
      }
    },

    fetchDataFunction: function (args) {
      var me = this,
          actualUser;

      OB.Dal.find(OB.Model.SalesRepresentative, null, function (data) {
        if (me.destroyed) {
          return;
        }
        if (data.length > 0) {
          data.unshift({
            id: null,
            _identifier: null
          });
          me.dataReadyFunction(data, args);
        } else {
          actualUser = new OB.Model.SalesRepresentative();
          actualUser.set('_identifier', me.model.get('order').get('salesRepresentative$_identifier'));
          actualUser.set('id', me.model.get('order').get('salesRepresentative'));
          data.models = [actualUser];
          me.dataReadyFunction(data, args);
        }

      }, function () {
        OB.UTIL.showError(OB.I18N.getLabel('OBPOS_ErrorGettingSalesRepresentative'));
        me.dataReadyFunction(null, args);
      }, args);
    }
  }, {
    kind: 'OB.UI.SalesRepresentative',
    name: 'salesrepresentativebutton',
    i18nLabel: 'OBPOS_SalesRepresentative',
    permission: 'OBPOS_salesRepresentative.receipt',
    permissionOption: 'OBPOS_SR.comboOrModal'
  }],

  resetProperties: function () {
    var p, att;
    // reset all properties
    for (p in this.newAttributes) {
      if (this.newAttributes.hasOwnProperty(p)) {
        att = this.$.bodyContent.$.attributes.$['line_' + this.newAttributes[p].name].$.newAttribute.$[this.newAttributes[p].name];
        if (att && att.setValue) {
          att.setValue('');
        }
      }
    }
  },

  init: function (model) {
    this.setHeader(OB.I18N.getLabel('OBPOS_ReceiptPropertiesDialogTitle'));

    this.model = model.get('order');
    this.model.on('change', function () {
      var diff = this.model.changedAttributes(),
          att;
      for (att in diff) {
        if (diff.hasOwnProperty(att)) {
          this.loadValue(att);
        }
      }
    }, this);

    this.model.on('paymentAccepted', function () {
      this.resetProperties();
    }, this);
  }
});