/*
 ************************************************************************************
 * Copyright (C) 2012-2015 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 *
 * Contributed by Qualian Technologies Pvt. Ltd.
 ************************************************************************************
 */

/*global OB */

(function () {

  OB.DATA = window.OB.DATA || {};

  OB.DATA.CustomerAddrSave = function (model) {
    this.context = model;
    this.customerAddr = model.get('customerAddr');
    this.customerAddr.on('customerAddrSaved', function () {
      var me = this,
          customerAddrList, customerAddrId = this.customerAddr.get('id'),
          isNew = false,
          bpLocToSave = new OB.Model.ChangedBPlocation(),
          customerAddrListToChange;

      bpLocToSave.set('isbeingprocessed', 'N');
      this.customerAddr.set('createdBy', OB.MobileApp.model.get('orgUserId'));
      bpLocToSave.set('createdBy', OB.MobileApp.model.get('orgUserId'));
      if (customerAddrId) {
        this.customerAddr.set('posTerminal', OB.MobileApp.model.get('terminal').id);
        bpLocToSave.set('json', JSON.stringify(this.customerAddr.serializeToJSON()));
        bpLocToSave.set('c_bpartner_location_id', this.customerAddr.get('id'));
      } else {
        isNew = true;
      }
      if (OB.MobileApp.model.hasPermission('OBPOS_remote.customer', true)) { //With high volume we only save adress we it is assigned to the order
        if (isNew) {
          me.customerAddr.set('posTerminal', OB.MobileApp.model.get('terminal').id);
          var uuid = OB.UTIL.get_UUID();
          me.customerAddr.set('id', uuid);
          me.customerAddr.id = uuid;
          bpLocToSave.set('json', JSON.stringify(me.customerAddr.serializeToJSON()));
          bpLocToSave.set('id', me.customerAddr.get('id'));
        }
        bpLocToSave.set('isbeingprocessed', 'Y');
        OB.Dal.save(bpLocToSave, function () {
          bpLocToSave.set('json', me.customerAddr.serializeToJSON());
          var successCallback, errorCallback, List;
          successCallback = function () {
            OB.UTIL.showSuccess(OB.I18N.getLabel('OBPOS_customerAddrSaved', [me.customerAddr.get('_identifier')]));
          };
          customerAddrListToChange = new OB.Collection.ChangedBPlocationList();
          customerAddrListToChange.add(bpLocToSave);
          OB.MobileApp.model.runSyncProcess(successCallback);
        }, function () {
          //error saving BP changes with changes in changedbusinesspartners
          OB.UTIL.showError(OB.I18N.getLabel('OBPOS_errorSavingCustomerAddrChn', [me.customerAddr.get('_identifier')]));
        }, isNew);
      } else {
        //save that the customer address is being processed by server
        OB.Dal.save(this.customerAddr, function () {
          // Update Default Address

          function errorCallback(tx, error) {
            OB.error(tx);
          }

          function successCallbackBPs(dataBps) {
            if (dataBps.length === 0) {
              OB.Dal.get(OB.Model.BusinessPartner, me.customerAddr.get('bpartner'), function success(dataBps) {
                dataBps.set('locId', me.customerAddr.get('id'));
                dataBps.set('locName', me.customerAddr.get('name'));
                OB.Dal.save(dataBps, function () {}, function (tx) {
                  OB.error(tx);
                });
              }, function error(tx) {
                OB.error(tx);
              });
            }
          }
          var criteria = {};
          criteria._whereClause = "where c_bpartner_id = '" + me.customerAddr.get('bpartner') + "' and c_bpartnerlocation_id > '" + me.customerAddr.get('id') + "'";
          criteria.params = [];
          OB.Dal.find(OB.Model.BusinessPartner, criteria, successCallbackBPs, errorCallback);

          if (isNew) {
            me.customerAddr.set('posTerminal', OB.MobileApp.model.get('terminal').id);
            bpLocToSave.set('json', JSON.stringify(me.customerAddr.serializeToJSON()));
            bpLocToSave.set('c_bpartner_location_id', me.customerAddr.get('id'));
          }
          bpLocToSave.set('isbeingprocessed', 'Y');
          OB.Dal.save(bpLocToSave, function () {
            bpLocToSave.set('json', me.customerAddr.serializeToJSON());
            var successCallback, errorCallback, List;
            successCallback = function () {
              OB.UTIL.showSuccess(OB.I18N.getLabel('OBPOS_customerAddrSaved', [me.customerAddr.get('_identifier')]));
            };
            customerAddrListToChange = new OB.Collection.ChangedBPlocationList();
            customerAddrListToChange.add(bpLocToSave);
            OB.MobileApp.model.runSyncProcess(successCallback);
          }, function () {
            //error saving BP changes with changes in changedbusinesspartners
            OB.UTIL.showError(OB.I18N.getLabel('OBPOS_errorSavingCustomerAddrChn', [me.customerAddr.get('_identifier')]));
          });
        }, function () {
          //error saving BP Location with new values in c_bpartner_location
          OB.error(arguments);
          OB.UTIL.showError(OB.I18N.getLabel('OBPOS_errorSavingCustomerAddrLocally', [me.customerAddr.get('_identifier')]));
        });
      }
    }, this);
  };
}());