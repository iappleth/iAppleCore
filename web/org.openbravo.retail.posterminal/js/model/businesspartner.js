/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

//jslint
/*global Backbone, _ */


(function () {

  var BusinessPartner = Backbone.Model.extend({
    modelName: 'BusinessPartner',
    tableName: 'c_bpartner',
    entityName: 'BusinessPartner',
    source: 'org.openbravo.retail.posterminal.master.BusinessPartner',
    properties: [
     'id',
     'searchKey',
     'name',
     'description',
     'taxId',
     'taxCategory',
     'paymentMethod',
     'paymentTerms',
     'invoiceTerms',
     'locId',
     'locName',
     'postalcode',
     'city',
     'phone',
     'email',
     '_identifier',
     '_idx'
    ],
    propertyMap: {
     'id': 'c_bpartner_id',
     'searchKey': 'value',
     'name': 'name',
     'description': 'description',
     'taxId': 'taxID',
     'taxCategory': 'so_bp_taxcategory_id',
     'paymentMethod': 'FIN_Paymentmethod_ID',
     'paymentTerms': 'c_paymentterm_id',
     'invoiceTerms': 'invoicerule',
     'locId': 'c_bpartnerlocation_id',
     'locName': 'c_bpartnerlocation_name',
     'postalcode': 'postalcode',
     'city': 'city',
     'phone': 'phone',
     'email': 'email',
     '_identifier': '_identifier',
     '_idx': '_idx'
    },
    createStatement: 'CREATE TABLE IF NOT EXISTS c_bpartner (c_bpartner_id TEXT PRIMARY KEY , value TEXT , name TEXT , description TEXT , taxID TEXT , so_bp_taxcategory_id TEXT, FIN_Paymentmethod_ID TEXT, c_paymentterm_id TEXT, invoicerule TEXT, c_bpartnerlocation_id TEXT , c_bpartnerlocation_name TEXT , postalcode TEXT, city TEXT, phone TEXT, email TEXT, _identifier TEXT , _idx NUMERIC)',
    dropStatement: 'DROP TABLE IF EXISTS c_bpartner',
    insertStatement: 'INSERT INTO c_bpartner(c_bpartner_id, value, name, description, taxID, so_bp_taxcategory_id, FIN_Paymentmethod_ID, c_paymentterm_id, invoicerule, c_bpartnerlocation_id, c_bpartnerlocation_name, postalcode, city, phone, email, _identifier, _idx)  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    updateStatement: '',
    saveCustomer: function(silent) {
      var nameLength, newSk;

      if (!this.get("name")) {
        OB.UTIL.showWarning('Name is required for BPartner');
        return;
      }

      if (!this.get("locId")) {
        this.set('locId', OB.UTIL.get_UUID());
      }

      if (!this.get('searchKey')) {
        nameLength = this.get('name').length;
        newSk = this.get('name');
        if (length > 25) {
          newSk = this.get('name').substring(0, 25);
        }
        newSk = newSk + "_" + new Date().getFullYear() + "" + (new Date().getMonth() + 1) + "" + new Date().getDate() + "_" + new Date().getHours() + "" + new Date().getMinutes();
        this.set('searchKey', newSk);
      }

      this.set('_identifier', this.get('name'));

      this.trigger('customerSaved');
      //datacustomersave will catch this event and save this locally with changed = 'Y'
      //Then it will try to send to the backend
    },
    loadById: function(CusId, userCallback) {
      //search data in local DB and load it to this
      var me = this,
          criteria = {
          id: CusId
          };
      OB.Dal.find(OB.Model.BusinessPartner, criteria, function(customerCol) { //OB.Dal.find success
        var successCallback, errorCallback;
        if (!customerCol || customerCol.length === 0) {
          me.clearModelWith(null);
          userCallback(me);
        } else {
          me.clearModelWith(customerCol.at(0));
          userCallback(me);
        }
      });
    },
    loadByModel: function(cusToLoad) {
      //copy data from model to this
    },
    newCustomer: function() {
      this.clearModelWith(null);
    },
    clearModelWith: function(cusToLoad) {
      var me = this,
          undf;
      if (cusToLoad === null) {
        this.set('id', null);
        this.set('searchKey', null);
        this.set('name', null);
        this.set('description', null);
        this.set('taxId', null);
        this.set('taxCategory', null);
        this.set('paymentMethod', OB.POS.modelterminal.get('terminal').defaultbp_paymentmethod);
        this.set('businessPartnerCategory', OB.POS.modelterminal.get('terminal').defaultbp_bpcategory);
        this.set('paymentTerms', OB.POS.modelterminal.get('terminal').defaultbp_paymentterm);
        this.set('invoiceTerms', OB.POS.modelterminal.get('terminal').defaultbp_invoiceterm);
        this.set('locId', null);
        this.set('locName', null);
        this.set('_identifier', null);
        this.set('postalcode', null);
        this.set('city', null);
        this.set('phone', null);
        this.set('email', null);
      } else {
        _.each(_.keys(cusToLoad.attributes), function(key) {
          if (cusToLoad.get(key) !== undf) {
            if (cusToLoad.get(key) === null) {
              me.set(key, null);
            } else if (cusToLoad.get(key).at) {
              //collection
              me.get(key).reset();
              cusToLoad.get(key).forEach(function(elem) {
                me.get(key).add(elem);
              });
            } else {
              //property
              me.set(key, cusToLoad.get(key));
            }
          }
        });
      }
    },
    loadByJSON: function(obj) {
      var me = this,
          undf;
      _.each(_.keys(me.attributes), function(key) {
        if (obj[key] !== undf) {
          if (obj[key] === null) {
            me.set(key, null);
          } else {
            me.set(key, obj[key]);
          }
        }
      });
    },
    serializeToJSON: function() {
      return JSON.parse(JSON.stringify(this.toJSON()));
    }
  });

  var BusinessPartnerList = Backbone.Collection.extend({
    model: BusinessPartner
  });

  window.OB = window.OB || {};
  window.OB.Model = window.OB.Model || {};
  window.OB.Collection = window.OB.Collection || {};

  window.OB.Model.BusinessPartner = BusinessPartner;
  window.OB.Collection.BusinessPartnerList = BusinessPartnerList;
}());