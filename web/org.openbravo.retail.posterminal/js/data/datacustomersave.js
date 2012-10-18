/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global B,_*/

(function() {

  OB = window.OB || {};
  OB.DATA = window.OB.DATA || {};

  OB.DATA.CustomerSave = function(model) {
    this.context = model;
    this.customer = model.get('customer'),


    this.customer.on('customerSaved', function() {
      var me = this,
          customersList, customerId = this.customer.get('id'),
          isNew = false,
          bpToSave = new OB.Model.ChangedBusinessPartners(),
          customersListToChange;

      bpToSave.set('isbeingprocessed', 'N');
      if (customerId) {
        bpToSave.set('json', JSON.stringify(this.customer.serializeToJSON()));
        bpToSave.set('c_bpartner_id', this.customer.get('id'));
      } else {
        isNew = true;
      }

      //save that the customer is being processed by server
      OB.Dal.save(this.customer, function() {
        if (isNew) {
          bpToSave.set('json', JSON.stringify(me.customer.serializeToJSON()));
          bpToSave.set('c_bpartner_id', me.customer.get('id'));
        }
        if (OB.POS.modelterminal.get('connectedToERP')) {
          bpToSave.set('isbeingprocessed', 'Y');
        }
        OB.Dal.save(bpToSave, function() {
          bpToSave.set('json', me.customer.serializeToJSON());
          if (OB.POS.modelterminal.get('connectedToERP')) {
            var successCallback, errorCallback, List;
            successCallback = function() {
              OB.UTIL.showSuccess('Customer saved');
            };
            errorCallback = function() {
              OB.UTIL.showError('Error saving customer');
            };
            customersListToChange = new OB.Collection.ChangedBusinessPartnersList();
            customersListToChange.add(bpToSave);
            OB.UTIL.processCustomers(customersListToChange, successCallback, errorCallback);
          }
        }, function() {
          debugger;
        });
      }, function() {
        OB.UTIL.showError('Customer cannot be saved locally');
      });
    }, this);
  }
}());