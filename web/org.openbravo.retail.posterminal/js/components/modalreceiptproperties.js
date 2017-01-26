/*
 ************************************************************************************
 * Copyright (C) 2013-2017 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, enyo, _ */

enyo.kind({
  name: 'OB.UI.ModalReceiptPropertiesImpl',
  kind: 'OB.UI.ModalReceiptProperties',
  handlers: {
    onCloseCancelSelector: 'closeCancelSelector',
    onUpdateFilterSelector: 'updateFilterSelector'
  },
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
  }, {
    kind: 'OB.UI.Customer',
    target: 'filterSelectorButton_receiptProperties',
    popup: 'receiptPropertiesDialog',
    name: 'customerbutton',
    i18nLabel: 'OBPOS_LblCustomer'
  }, {
    kind: 'OB.UI.ShipTo',
    target: 'filterSelectorButton_receiptProperties',
    popup: 'receiptPropertiesDialog',
    name: 'addressshipbutton',
    i18nLabel: 'OBPOS_LblShipAddr'
  }, {
    kind: 'OB.UI.BillTo',
    target: 'filterSelectorButton_receiptProperties',
    popup: 'receiptPropertiesDialog',
    name: 'addressbillbutton',
    i18nLabel: 'OBPOS_LblBillAddr'
  }],

  closeCancelSelector: function (inSender, inEvent) {
    if (inEvent.target === 'filterSelectorButton_receiptProperties') {
      this.show();
    }
  },
  updateFilterSelector: function (inSender, inEvent) {
    if (inEvent.selector.name === 'receiptProperties') {
      this.bubble('onChangeBusinessPartner', {
        businessPartner: inEvent.selector.businessPartner,
        target: 'order'
      });
      this.show();
    }
  },
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
    var me = this,
        criteria = {};
    this.setHeader(OB.I18N.getLabel('OBPOS_ReceiptPropertiesDialogTitle'));

    this.model = model.get('order');
    this.model.on('change', function () {
      var diff = this.model.changedAttributes(),
          att, bp = this.model.get('bp');
      for (att in diff) {
        if (diff.hasOwnProperty(att)) {
          this.loadValue(att);
        }
      }
      if (!_.isNull(bp) && diff.bp) {
        criteria.bpartner = bp.get('id');
        if (OB.MobileApp.model.hasPermission('OBPOS_remote.customer', true)) {
          var bPartnerId = {
            columns: ['bpartner'],
            operator: 'equals',
            value: bp.get('id'),
            isId: true
          };
          var remoteCriteria = [bPartnerId];
          criteria.remoteFilters = remoteCriteria;
        }
        OB.Dal.find(OB.Model.BPLocation, criteria, function (dataBps) {
          if (dataBps && dataBps.length === 1 && !_.isUndefined(me.$.bodyContent) && (dataBps.models[0].get('isBillTo') && dataBps.models[0].get('isShipTo'))) {
            me.$.bodyContent.$.attributes.$.line_addressshipbutton.hide();
            me.$.bodyContent.$.attributes.$.line_addressbillbutton.$.labelLine.setContent(OB.I18N.getLabel('OBPOS_LblAddress'));
          } else if (!_.isUndefined(me.$.bodyContent)) {
            me.$.bodyContent.$.attributes.$.line_addressshipbutton.show();
            me.$.bodyContent.$.attributes.$.line_addressbillbutton.$.labelLine.setContent(OB.I18N.getLabel('OBPOS_LblBillAddr'));
          }
        }, function (tx, error) {
          OB.UTIL.showError("OBDAL error: " + error);
        });
      }
    }, this);

    this.model.on('paymentAccepted', function () {
      this.resetProperties();
    }, this);
  }
});