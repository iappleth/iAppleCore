/*
 ************************************************************************************
 * Copyright (C) 2012-2016 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, Backbone, _ */

(function () {

  var BusinessPartner = OB.Data.ExtensibleModel.extend({
    modelName: 'BusinessPartner',
    tableName: 'c_bpartner',
    entityName: 'BusinessPartner',
    source: 'org.openbravo.retail.posterminal.master.BusinessPartner',
    dataLimit: OB.Dal.DATALIMIT,
    remote: 'OBPOS_remote.customer',
    saveCustomer: function (silent) {
      var nameLength, newSk;

      if (!this.get("name")) {
        OB.UTIL.showWarning(OB.I18N.getLabel('OBPOS_BPartnerNameRequired'));
        return false;
      }

      if (!this.get('locName')) {
        OB.UTIL.showWarning(OB.I18N.getLabel('OBPOS_BPartnerAddressRequired'));
        return false;
      }

      if (!this.get("locId")) {
        this.set('locId', OB.UTIL.get_UUID());
      }

      if (!this.get("contactId")) {
        this.set('contactId', OB.UTIL.get_UUID());
      }

      if (!this.get('searchKey')) {
        nameLength = this.get('name').toString().length;
        newSk = this.get('name');
        if (nameLength > 30) {
          newSk = this.get('name').substring(0, 30);
        }
        this.set('searchKey', newSk);
      }

      this.set('_identifier', this.get('name'));

      this.trigger('customerSaved');
      //datacustomersave will catch this event and save this locally with changed = 'Y'
      //Then it will try to send to the backend
      return true;
    },
    loadById: function (CusId, userCallback) {
      //search data in local DB and load it to this
      var me = this;
      OB.Dal.get(OB.Model.BusinessPartner, CusId, function (customerCol) { //OB.Dal.get success
        if (!customerCol || customerCol.length === 0) {
          me.clearModelWith(null);
          userCallback(me);
        } else {
          OB.Dal.get(OB.Model.BPLocation, customerCol.get('locId'), function (location) { //OB.Dal.find success
            customerCol.set('locationModel', location);
            me.clearModelWith(customerCol);
            userCallback(me);
          });
        }
      });
    },
    loadByModel: function (cusToLoad) {
      //copy data from model to this
    },
    newCustomer: function () {
      //set values of new attrs in bp model
      //this values will be copied to the created one
      //in the next instruction
      this.trigger('beforeChangeCustomerForNewOne', this);
      this.clearModelWith(null);
    },
    clearModelWith: function (cusToLoad) {
      var me = this,
          undf;
      if (cusToLoad === null) {

        OB.UTIL.clone(new OB.Model.BusinessPartner(), this);

        this.set('paymentMethod', OB.MobileApp.model.get('terminal').defaultbp_paymentmethod);
        this.set('businessPartnerCategory', OB.MobileApp.model.get('terminal').defaultbp_bpcategory);
        this.set('businessPartnerCategory_name', OB.MobileApp.model.get('terminal').defaultbp_bpcategory_name);
        this.set('paymentTerms', OB.MobileApp.model.get('terminal').defaultbp_paymentterm);
        this.set('invoiceTerms', OB.MobileApp.model.get('terminal').defaultbp_invoiceterm);
        this.set('priceList', OB.MobileApp.model.get('pricelist').id);
        this.set('country', OB.MobileApp.model.get('terminal').defaultbp_bpcountry);
        this.set('countryName', OB.MobileApp.model.get('terminal').defaultbp_bpcountry_name);
        this.set('client', OB.MobileApp.model.get('terminal').client);
        this.set('organization', OB.MobileApp.model.get('terminal').defaultbp_bporg);
        this.set('creditLimit', OB.DEC.Zero);
        this.set('creditUsed', OB.DEC.Zero);
      } else {
        OB.UTIL.clone(cusToLoad, this);
      }
    },
    loadByJSON: function (obj) {
      var me = this,
          undf;
      _.each(_.keys(me.attributes), function (key) {
        if (obj[key] !== undf) {
          if (obj[key] === null) {
            me.set(key, null);
          } else {
            me.set(key, obj[key]);
          }
        }
      });
    },
    serializeToJSON: function () {
      return JSON.parse(JSON.stringify(this.toJSON()));
    }
  });

  BusinessPartner.addProperties([{
    name: 'id',
    column: 'c_bpartner_id',
    primaryKey: true,
    type: 'TEXT'
  }, {
    name: 'organization',
    column: 'ad_org_id',
    type: 'TEXT'
  }, {
    name: 'searchKey',
    column: 'value',
    filter: true,
    type: 'TEXT'
  }, {
    name: '_identifier',
    column: '_identifier',
    filter: true,
    type: 'NUMERIC'
  }, {
    name: 'name',
    column: 'name',
    type: 'TEXT'
  }, {
    name: 'firstName',
    column: 'first_name',
    type: 'TEXT'
  }, {
    name: 'lastName',
    column: 'last_name',
    type: 'TEXT'
  }, {
    name: 'description',
    column: 'description',
    type: 'TEXT'
  }, {
    name: 'taxID',
    column: 'taxID',
    filter: true,
    skipremote: true,
    type: 'TEXT'
  }, {
    name: 'taxCategory',
    column: 'so_bp_taxcategory_id',
    type: 'TEXT'
  }, {
    name: 'paymentMethod',
    column: 'FIN_Paymentmethod_ID',
    type: 'TEXT'
  }, {
    name: 'paymentTerms',
    column: 'c_paymentterm_id',
    type: 'TEXT'
  }, {
    name: 'priceList',
    column: 'm_pricelist_id',
    type: 'TEXT '
  }, {
    name: 'invoiceTerms',
    column: 'invoicerule',
    type: 'TEXT'
  }, {
    name: 'locId',
    column: 'c_bpartnerlocation_id',
    type: 'TEXT'
  }, {
    name: 'locName',
    column: 'c_bpartnerlocation_name',
    filter: true,
    skipremote: true,
    type: 'TEXT'
  }, {
    name: 'postalCode',
    column: 'postalCode',
    type: 'TEXT'
  }, {
    name: 'cityName',
    column: 'cityName',
    type: 'TEXT'
  }, {
    name: 'countryName',
    column: 'countryName',
    type: 'TEXT'
  }, {
    name: 'contactId',
    column: 'ad_user_id',
    type: 'TEXT'
  }, {
    name: 'phone',
    column: 'phone',
    filter: true,
    skipremote: true,
    type: 'TEXT'
  }, {
    name: 'email',
    column: 'email',
    filter: true,
    skipremote: true,
    type: 'TEXT'
  }, {
    name: 'businessPartnerCategory',
    column: 'c_bp_group_id',
    type: 'TEXT'
  }, {
    name: 'businessPartnerCategory_name',
    column: 'c_bp_group_name',
    type: 'TEXT'
  }, {
    name: 'creditLimit',
    column: 'creditLimit',
    type: 'NUMERIC'
  }, {
    name: 'creditUsed',
    column: 'creditUsed',
    type: 'NUMERIC'
  }, {
    name: 'taxExempt',
    column: 'taxExempt',
    type: 'TEXT'
  }, {
    name: 'customerBlocking',
    column: 'customerBlocking',
    type: 'TEXT'
  }, {
    name: 'salesOrderBlocking',
    column: 'salesOrderBlocking',
    type: 'TEXT'
  }, {
    name: 'priceIncludesTax',
    column: 'priceIncludesTax',
    type: 'TEXT'
  }, {
    name: 'priceListName',
    column: 'priceListName',
    type: 'TEXT'
  }]);

  BusinessPartner.addIndex([{
    name: 'bp_filter_idx',
    columns: [{
      name: '_filter',
      sort: 'desc'
    }]
  }, {
    name: 'bp_name_idx',
    columns: [{
      name: 'name',
      sort: 'desc'
    }]
  }]);

  OB.Data.Registry.registerModel(BusinessPartner);
}());