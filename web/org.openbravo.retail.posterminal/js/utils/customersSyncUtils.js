/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global B,_*/

(function () {

  OB = window.OB || {};
  OB.UTILS = window.OB.UTILS || {};

  OB.UTIL.processCustomerClass = 'org.openbravo.retail.posterminal.CustomerLoader';

  OB.UTIL.processCustomers = function (changedCustomers, successCallback, errorCallback) {
    var customersToJson = [];
    changedCustomers.each(function (customer) {
      customersToJson.push(customer.get('json'));
    });
    this.proc = new OB.DS.Process(OB.UTIL.processCustomerClass);
    this.proc.exec({
      terminalId: OB.MobileApp.model.get('terminal').id,
      customer: customersToJson
    }, function (data, message) {
      if (data && data.exception) {
        // The server response is an Error! -> Orders have not been processed
        if (errorCallback) {
          errorCallback();
        }
      } else {
        // Customers have been processed, delete them from the queue
        OB.Dal.removeAll(OB.Model.ChangedBusinessPartners, null, function () {
          successCallback();
        }, function (tx, err) {
          OB.UTIL.showError(OB.I18N.getLabel('OBPOS_errorRemovingLocallyProcessedCustomer'));
        });
      }
    }, null, null, 4000);
  };
}());