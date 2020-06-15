/*
 ************************************************************************************
 * Copyright (C) 2012-2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, _ */

(function() {
  OB.DATA = window.OB.DATA || {};

  OB.DATA.CustomerSave = function(model) {
    this.context = model;
    this.customer = model.get('customer');

    // trigger is from previous code, keeping it for backward compat
    this.customer.on(
      'customerSaved',
      function() {
        OB.DATA.executeCustomerSave(this.customer);
      },
      this
    );

    OB.DATA.executeCustomerSave = async function(customer, callback) {
      let customerId = customer.get('id'),
        isNew = false,
        finalCallback;
      finalCallback = function(result) {
        if (callback) {
          callback(result);
        }
      };
      const finalActions = function(result) {
        OB.MobileApp.model.runSyncProcess(
          function() {
            finalCallback(result);
          },
          function() {
            finalCallback(false);
          }
        );
      };
      function sleep(x) {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve();
          }, x);
        });
      }

      customer.set('createdBy', OB.MobileApp.model.get('orgUserId'));
      customer.set('posTerminal', OB.MobileApp.model.get('terminal').id);
      if (customerId) {
        var now = new Date();
        customer.set('timezoneOffset', now.getTimezoneOffset());
        if (OB.UTIL.isNullOrUndefined(customer.get('loaded'))) {
          customer.set('loaded', OB.I18N.normalizeDate(new Date()));
        } else {
          customer.set(
            'loaded',
            OB.I18N.normalizeDate(new Date(customer.get('loaded')))
          );
        }
      } else {
        isNew = true;
        var shipping,
          billing,
          locations = [],
          uuid = OB.UTIL.get_UUID();
        customer.set('id', uuid);
        customer.id = uuid;
        billing = new OB.Model.BPLocation();
        billing.set('id', customer.get('locId'));
        billing.set('bpartner', customer.get('id'));
        billing.set('name', customer.get('locName'));
        billing.set('postalCode', customer.get('postalCode'));
        billing.set('cityName', customer.get('cityName'));
        billing.set('_identifier', customer.get('locName'));
        billing.set('countryName', customer.get('countryName'));
        billing.set('countryId', customer.get('countryId'));
        billing.set('regionId', customer.get('regionId'));
        billing.set('regionName', customer.get('regionName'));
        billing.set('posTerminal', OB.MobileApp.model.get('terminal').id);

        if (customer.get('useSameAddrForShipAndInv')) {
          billing.set('isBillTo', true);
          billing.set('isShipTo', true);
          shipping = billing;
          locations.push(billing);
        } else {
          billing.set('isBillTo', true);
          billing.set('isShipTo', false);
          shipping = new OB.Model.BPLocation();
          shipping.set('id', customer.get('shipLocId'));
          shipping.set('bpartner', customer.get('id'));
          shipping.set('name', customer.get('shipLocName'));
          shipping.set('postalCode', customer.get('shipPostalCode'));
          shipping.set('cityName', customer.get('shipCityName'));
          shipping.set('_identifier', customer.get('shipLocName'));
          shipping.set('countryName', customer.get('shipCountryName'));
          shipping.set('countryId', customer.get('shipCountryId'));
          shipping.set('regionId', customer.get('shipRegionId'));
          shipping.set('regionName', customer.get('shipRegionName'));
          shipping.set('isBillTo', false);
          shipping.set('isShipTo', true);
          shipping.set('posTerminal', OB.MobileApp.model.get('terminal').id);

          locations.push(billing);
          locations.push(shipping);
        }
        customer.set('locations', locations);
        customer.setBPLocations(shipping, billing, shipping);
      }

      // if the bp is already used in one of the orders then update locally also
      let updateLocally =
        !OB.MobileApp.model.hasPermission('OBPOS_remote.customer', true) ||
        (!isNew &&
          OB.MobileApp.model.orderList &&
          _.filter(OB.MobileApp.model.orderList.models, function(order) {
            return order.get('bp').get('id') === customerId;
          }).length > 0);

      //save that the customer is being processed by server
      if (updateLocally) {
        customer.set('loaded', OB.I18N.normalizeDate(new Date()));
      }
      try {
        await OB.App.State.Global.synchronizeBusinessPartner(
          customer.attributes
        );
        await sleep(100);
        if (isNew) {
          // Saving Customer Address locally
          await OB.App.State.Global.synchronizeBusinessPartnerLocation(
            billing.attributes
          );
          //check if shipping address is different
          if (customer.get('locId') !== customer.get('shipLocId')) {
            await OB.App.State.Global.synchronizeBusinessPartnerLocation(
              shipping.attributes
            );
          }
        }
        OB.UTIL.HookManager.executeHooks(
          'OBPOS_PostCustomerSave',
          {
            customer: customer
          },
          function(args) {
            // update each order also so that new name is shown and the bp
            // in the order is the same as what got saved
            if (OB.MobileApp.model.orderList) {
              for (const order of OB.MobileApp.model.orderList.models) {
                if (order.get('bp').get('id') === customerId) {
                  var clonedBP = new OB.Model.BusinessPartner();
                  OB.UTIL.clone(customer, clonedBP);
                  var bp = order.get('bp');
                  if (order.get('bp').get('locId') !== customer.get('locId')) {
                    // if the order has a different address but same BP than the bp
                    // then copy over the address data
                    clonedBP.set('locId', bp.get('locId'));
                    clonedBP.set('locName', bp.get('locName'));
                    clonedBP.set('postalCode', bp.get('postalCode'));
                    clonedBP.set('cityName', bp.get('cityName'));
                    clonedBP.set('countryName', bp.get('countryName'));
                    clonedBP.set('locationModel', bp.get('locationModel'));
                  }
                  if (
                    order.get('bp').get('shipLocId') !==
                    customer.get('shipLocId')
                  ) {
                    clonedBP.set('shipLocId', bp.get('shipLocId'));
                    clonedBP.set('shipLocName', bp.get('shipLocName'));
                    clonedBP.set('shipPostalCode', bp.get('shipPostalCode'));
                    clonedBP.set('shipCityName', bp.get('shipCityName'));
                    clonedBP.set('shipCountryName', bp.get('shipCountryName'));
                  }
                  order.set('bp', clonedBP);
                  order.save();
                  if (
                    OB.MobileApp.model.orderList.modelorder &&
                    OB.MobileApp.model.orderList.modelorder.get('id') ===
                      order.get('id')
                  ) {
                    OB.MobileApp.model.orderList.modelorder.set('isNew', false);
                    OB.MobileApp.model.orderList.modelorder.setBPandBPLoc(
                      clonedBP,
                      false,
                      true
                    );
                  }
                }
              }
            }
          }
        );
        OB.UTIL.showSuccess(
          OB.I18N.getLabel('OBPOS_customerSaved', [customer.get('_identifier')])
        );
        finalActions(true);
      } catch (error) {
        //error saving BP changes with changes in changedbusinesspartners
        OB.UTIL.showError(
          OB.I18N.getLabel('OBPOS_errorSavingCustomerChanges', [
            customer.get('_identifier')
          ])
        );
        finalActions(false);
      }
    };
  };
})();
