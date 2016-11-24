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

/*global OB, enyo, _ */

enyo.kind({
  kind: 'OB.UI.Modal',
  name: 'OB.OBPOSPointOfSale.UI.customeraddr.newcustomeraddr',
  classes: 'receipt-customer-selector-editor',
  events: {
    onShowPopup: ''
  },
  handlers: {
    onCancelClose: 'cancelClose'
  },
  cancelClose: function (inSender, inEvent) {
    this.customerAddr = inEvent.customerAddr;
    this.hide();
    return true;
  },
  executeOnShow: function () {
    if (OB.MobileApp.model.get('terminal').defaultbp_paymentmethod !== null && OB.MobileApp.model.get('terminal').defaultbp_bpcategory !== null && OB.MobileApp.model.get('terminal').defaultbp_paymentterm !== null && OB.MobileApp.model.get('terminal').defaultbp_invoiceterm !== null && OB.MobileApp.model.get('terminal').defaultbp_bpcountry !== null && OB.MobileApp.model.get('terminal').defaultbp_bporg !== null) {
      this.$.body.$.edit_createcustomers_impl.setCustomerAddr(this.args.businessPartner, this.args.bPLocation);
      if (this.args.bPLocation) {
        this.$.header.setContent(OB.I18N.getLabel('OBPOS_TitleEditCustomerAddress'));
      } else {
        this.$.header.setContent(OB.I18N.getLabel('OBPOS_TitleNewCustomerAddress'));
      }
      //show
      return true;
    } else {
      this.doShowPopup({
        popup: 'modalConfigurationRequiredForCreateNewCustomers'
      });
      //not show
      return false;
    }
  },
  executeOnHide: function () {
    var navigationPath = this.customerAddr || !this.args.cancelNavigationPath ? this.args.navigationPath : this.args.cancelNavigationPath;
    this.doShowPopup({
      popup: navigationPath[navigationPath.length - 1],
      args: {
        businessPartner: this.args.businessPartner,
        bPLocation: this.customerAddr ? this.customerAddr : this.args.bPLocation,
        target: this.args.target,
        navigationPath: OB.UTIL.BusinessPartnerSelector.cloneAndPop(navigationPath),
        makeSearch: this.customerAddr !== undefined
      }
    });
  },
  body: {
    kind: 'OB.OBPOSPointOfSale.UI.customeraddr.edit_createcustomers_impl'
  }
});

//button of header of the body
enyo.kind({
  kind: 'OB.UI.Button',
  name: 'OB.OBPOSPointOfSale.UI.customeraddr.newcustomeraddrsave',
  style: 'width: 100px; margin: 0px 5px 8px 19px;',
  classes: 'btnlink-yellow btnlink btnlink-small',
  i18nLabel: 'OBPOS_LblSave',
  events: {
    onSaveCustomerAddr: ''
  },
  tap: function () {
    this.doSaveCustomerAddr();
  }
});

//Header of body
enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.customeraddr.subwindowNewCustomer_bodyheader',
  components: [{
    components: [{
      style: 'display: table; margin: 0 auto;',
      components: [{
        style: 'display: table-cell;',
        components: [{
          kind: 'OB.OBPOSPointOfSale.UI.customeraddr.newcustomeraddrsave'
        }]
      }, {
        style: 'display: table-cell;',
        components: [{
          kind: 'OB.OBPOSPointOfSale.UI.customeraddr.cancelEdit',
          name: 'addressEditCancel',
          handlers: {
            onSetCustomerAddr: 'setCustomerAddr'
          },
          setCustomerAddr: function (inSender, inEvent) {
            this.customer = inEvent.customer;
            this.customerAddr = inEvent.customerAddr;
          },
          tap: function () {
            this.bubble('onCancelClose');
          }
        }]
      }]
    }]
  }]
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.customeraddr.edit_createcustomers_impl',
  kind: 'OB.OBPOSPointOfSale.UI.customeraddr.edit_createcustomers',
  style: 'padding: 9px 15px;',
  windowHeader: 'OB.OBPOSPointOfSale.UI.customeraddr.subwindowNewCustomer_bodyheader',
  newAttributes: [{
    kind: 'OB.UI.CustomerAddrTextProperty',
    name: 'customerAddrCustomerName',
    modelProperty: 'customerName',
    i18nLabel: 'OBPOS_LblCustomer',
    readOnly: true
  }, {
    kind: 'OB.UI.CustomerAddrTextProperty',
    name: 'customerAddrName',
    modelProperty: 'name',
    i18nLabel: 'OBPOS_LblAddress',
    maxlength: 60,
    mandatory: true
  }, {
    kind: 'OB.UI.CustomerAddrTextProperty',
    name: 'customerAddrPostalCode',
    modelProperty: 'postalCode',
    i18nLabel: 'OBPOS_LblPostalCode',
    maxlength: 10
  }, {
    kind: 'OB.UI.CustomerAddrTextProperty',
    name: 'customerAddrCity',
    modelProperty: 'cityName',
    i18nLabel: 'OBPOS_LblCity',
    maxlength: 60
  }, {
    kind: 'OB.UI.CustomerAddrComboProperty',
    name: 'customerAddrCountry',
    modelProperty: 'countryId',
    modelPropertyText: 'countryName',
    collectionName: 'CountryList',
    i18nLabel: 'OBPOS_LblCountry',
    defaultValue: function () {
      return OB.MobileApp.model.get('terminal').defaultbp_bpcountry;
    },
    //Default value for new lines
    retrievedPropertyForValue: 'id',
    //property of the retrieved model to get the value of the combo item
    retrievedPropertyForText: '_identifier',
    //property of the retrieved model to get the text of the combo item
    //function to retrieve the data
    fetchDataFunction: function (args) {
      var me = this,
          criteria;
      criteria = {
        _orderByClause: '_identifier asc'
      };
      OB.Dal.find(OB.Model.Country, criteria, function (data, args) {
        //This function must be called when the data is ready
        me.dataReadyFunction(data, args);
      }, function (error) {
        OB.UTIL.showError(OB.I18N.getLabel('OBPOS_ErrorGettingCountries'));
        //This function must be called when the data is ready
        me.dataReadyFunction(null, args);
      }, args);
    }
  }, {
    kind: 'OB.UI.CustomerAddrCheckProperty',
    name: 'customerAddrShip',
    modelProperty: 'isShipTo',
    i18nLabel: 'OBPOS_LblShipAddr'
  }, {
    kind: 'OB.UI.CustomerAddrCheckProperty',
    name: 'customerAddrBill',
    modelProperty: 'isBillTo',
    i18nLabel: 'OBPOS_LblBillAddr'
  }]
});