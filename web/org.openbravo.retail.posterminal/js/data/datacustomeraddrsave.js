/*
 ************************************************************************************
 * Copyright (C) 2012-2016 Openbravo S.L.U.
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

    // trigger is from previous code, keeping it for backward compat
    this.customerAddr.on('customerAddrSaved', function () {
      OB.DATA.executeCustomerAddressSave(this.customerAddr);
    }, this);

    OB.DATA.executeCustomerAddressSave = function (customerAddr, callback) {
      var customerAddrList, customerAddrId = this.customerAddr.get('id'),
          isNew = false,
          bpLocToSave = new OB.Model.ChangedBPlocation(),
          customerAddrListToChange;

      bpLocToSave.set('isbeingprocessed', 'N');
      customerAddr.set('createdBy', OB.MobileApp.model.get('orgUserId'));
      bpLocToSave.set('createdBy', OB.MobileApp.model.get('orgUserId'));
      if (customerAddrId) {
        customerAddr.set('posTerminal', OB.MobileApp.model.get('terminal').id);
        var now = new Date();
        customerAddr.set('updated', OB.I18N.normalizeDate(now));
        customerAddr.set('timezoneOffset', now.getTimezoneOffset());
        customerAddr.set('loaded', OB.I18N.normalizeDate(new Date(customerAddr.get('loaded'))));
        bpLocToSave.set('json', JSON.stringify(customerAddr.serializeToJSON()));
        bpLocToSave.set('c_bpartner_location_id', customerAddr.get('id'));
      } else {
        isNew = true;
      }
      if (OB.MobileApp.model.hasPermission('OBPOS_remote.customer', true)) { //With high volume we only save adress we it is assigned to the order
        if (isNew) {
          customerAddr.set('posTerminal', OB.MobileApp.model.get('terminal').id);
          var uuid = OB.UTIL.get_UUID();
          customerAddr.set('id', uuid);
          customerAddr.id = uuid;
          bpLocToSave.set('json', JSON.stringify(customerAddr.serializeToJSON()));
          bpLocToSave.set('id', customerAddr.get('id'));
        }
        bpLocToSave.set('isbeingprocessed', 'Y');
        OB.Dal.save(bpLocToSave, function () {
          bpLocToSave.set('json', customerAddr.serializeToJSON());
          var successCallback, errorCallback, List;
          successCallback = function () {
            if (callback) {
              callback();
            }
            OB.UTIL.showSuccess(OB.I18N.getLabel('OBPOS_customerAddrSaved', [customerAddr.get('_identifier')]));
          };
          customerAddrListToChange = new OB.Collection.ChangedBPlocationList();
          customerAddrListToChange.add(bpLocToSave);
          OB.MobileApp.model.runSyncProcess(successCallback);
        }, function () {
          //error saving BP changes with changes in changedbusinesspartners
          OB.UTIL.showError(OB.I18N.getLabel('OBPOS_errorSavingCustomerAddrChn', [customerAddr.get('_identifier')]));
        }, isNew);
      } else {
        //save that the customer address is being processed by server
        customerAddr.set('loaded', OB.I18N.normalizeDate(new Date()));
        OB.Dal.save(customerAddr, function () {
          // Update Default Address

          function errorCallback(tx, error) {
            OB.error(tx);
          }

          function successCallbackBPs(dataBps) {
            if (dataBps.length === 0) {
              OB.Dal.get(OB.Model.BusinessPartner, customerAddr.get('bpartner'), function success(dataBps) {
                dataBps.set('locId', customerAddr.get('id'));
                dataBps.set('locName', customerAddr.get('name'));
                OB.Dal.save(dataBps, function () {}, function (tx) {
                  OB.error(tx);
                });
              }, function error(tx) {
                OB.error(tx);
              });
            }
          }
          var criteria = {};
          criteria._whereClause = "where c_bpartner_id = '" + customerAddr.get('bpartner') + "' and c_bpartnerlocation_id > '" + customerAddr.get('id') + "'";
          criteria.params = [];
          OB.Dal.find(OB.Model.BusinessPartner, criteria, successCallbackBPs, errorCallback);

          if (isNew) {
            customerAddr.set('posTerminal', OB.MobileApp.model.get('terminal').id);
            bpLocToSave.set('json', JSON.stringify(customerAddr.serializeToJSON()));
            bpLocToSave.set('c_bpartner_location_id', customerAddr.get('id'));
          }
          bpLocToSave.set('isbeingprocessed', 'Y');
          OB.Dal.save(bpLocToSave, function () {
            bpLocToSave.set('json', customerAddr.serializeToJSON());
            var successCallback, errorCallback, List;
            successCallback = function () {
              if (callback) {
                callback();
              }
              OB.UTIL.showSuccess(OB.I18N.getLabel('OBPOS_customerAddrSaved', [customerAddr.get('_identifier')]));
            };
            customerAddrListToChange = new OB.Collection.ChangedBPlocationList();
            customerAddrListToChange.add(bpLocToSave);
            OB.MobileApp.model.runSyncProcess(successCallback);
          }, function () {
            //error saving BP changes with changes in changedbusinesspartners
            OB.UTIL.showError(OB.I18N.getLabel('OBPOS_errorSavingCustomerAddrChn', [customerAddr.get('_identifier')]));
          });
        }, function () {
          //error saving BP Location with new values in c_bpartner_location
          OB.error(arguments);
          OB.UTIL.showError(OB.I18N.getLabel('OBPOS_errorSavingCustomerAddrLocally', [customerAddr.get('_identifier')]));
        });
      }
    };
  };
}());