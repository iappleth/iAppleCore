/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.1  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html 
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License. 
 * The Original Code is Openbravo ERP. 
 * The Initial Developer of the Original Code is Openbravo SLU 
 * All portions are Copyright (C) 2013 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

OB = OB || {};

OB.ProductCharacteristics = {
  execute: function (params, view) {
    var i, selection = params.button.contextView.viewGrid.getSelectedRecords(),
        productId, messageBar = view.getView(params.adTabId).messageBar,
        callback, validationMessage, validationOK = true;

    callback = function (rpcResponse, data, rpcRequest) {
      this.view = view;
      isc.UpdateInvariantCharacteristicsPopup.create({
        productId: data.productId,
        characteristicList: data.productCharList,
        actionHandler: 'org.openbravo.client.application.event.UpdateInvariantCharacteristicsHandler',
        view: view
      }).show();
    };

    productId = selection[0].id;
    OB.RemoteCallManager.call(params.actionHandler, {
      productId: productId,
      action: params.action
    }, {}, callback);
  },

  updateInvariants: function (params, view) {
    params.actionHandler = 'org.openbravo.client.application.event.UpdateInvariantCharacteristicsHandler';
    params.adTabId = view.activeView.tabId;
    params.processId = 'A832A5DA28FB4BB391BDE883E928DFC5';
    params.action = 'INITIALIZE';
    OB.ProductCharacteristics.execute(params, view);
  }
};

isc.defineClass('UpdateInvariantCharacteristicsPopup', isc.OBPopup);

isc.UpdateInvariantCharacteristicsPopup.addProperties({
  width: 320,
  height: 200,
  title: 'Update Characteristics',
  canDragResize: false,
  showMinimizeButton: false,
  showMaximizeButton: false,
  productId: null,
  actionHandler: null,
  characteristicCombos: null,

  okButton: null,
  cancelButton: null,

  initWidget: function () {
    OB.TestRegistry.register('org.openbravo.client.application.UpdateInvariantCharacteristics.popup', this);
    var originalView = this.view,
        params = this.params,
        i;

    this.characteristicCombos = [];
    for (i = 0; i < this.characteristicList.length; i++) {
      this.characteristicCombos[i] = isc.DynamicForm.create({
        fields: [{
          id: this.characteristicList[i].id,
          name: this.characteristicList[i].name,
          title: this.characteristicList[i].name,
          valueMap: this.characteristicList[i].valueMap,
          defaultValue: this.characteristicList[i].selectedValue,
          height: 20,
          width: 255,
          required: true,
          type: '_id_17',
        }]
      });
    }

    this.okButton = isc.OBFormButton.create({
      title: OB.I18N.getLabel('OK'),
      popup: this,
      action: function () {
        var callback, action, updatedValues = {},
            i, characteristicCombo;

        callback = function (rpcResponse, data, rpcRequest) {
          rpcRequest.clientContext.popup.closeClick();
          rpcRequest.clientContext.popup.view.refresh(false, false);
          if (data.message) {
            rpcRequest.clientContext.popup.view.view.messageBar.setMessage(data.message.severity, null, data.message.text);
          }
        };

        for (i = 0; i < this.popup.items[0].members[0].members.length; i++) {
          characteristicCombo = this.popup.items[0].members[0].members[i];
          updatedValues[characteristicCombo.fields[0].id] = characteristicCombo.values[characteristicCombo.fields[0].name]
        }

        OB.RemoteCallManager.call(this.popup.actionHandler, {
          productId: this.popup.productId,
          updatedValues: updatedValues,
          action: 'UPDATE'
        }, {}, callback, {
          originalView: this.popup.view,
          popup: this.popup
        });
      }
    });

    OB.TestRegistry.register('org.openbravo.client.application.UpdateInvariantCharacteristics.popup.okButton', this.okButton);

    this.cancelButton = isc.OBFormButton.create({
      title: OB.I18N.getLabel('Cancel'),
      popup: this,
      action: function () {
        this.popup.closeClick();
      }
    });

    this.items = [
    isc.VLayout.create({
      defaultLayoutAlign: "center",
      align: "center",
      width: "100%",
      layoutMargin: 10,
      membersMargin: 6,
      members: [
      isc.VLayout.create({
        defaultLayoutAlign: "right",
        align: "right",
        layoutMargin: 30,
        membersMargin: 6,
        members: this.characteristicCombos
      }), isc.HLayout.create({
        defaultLayoutAlign: "center",
        align: "center",
        membersMargin: 10,
        members: [this.okButton, this.cancelButton]
      })]
    })];
    this.Super('initWidget', arguments);
  }

});