/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, _, $ */

enyo.kind({
  kind: 'OB.UI.Subwindow',
  name: 'OB.OBPOSPointOfSale.UI.customers.newcustomer',
  events: {
    onShowPopup: ''
  },
  beforeSetShowing: function (params) {
    if (OB.POS.modelterminal.get('terminal').defaultbp_paymentmethod !== null && OB.POS.modelterminal.get('terminal').defaultbp_bpcategory !== null && OB.POS.modelterminal.get('terminal').defaultbp_paymentterm !== null && OB.POS.modelterminal.get('terminal').defaultbp_invoiceterm !== null && OB.POS.modelterminal.get('terminal').defaultbp_bpcountry !== null && OB.POS.modelterminal.get('terminal').defaultbp_bporg !== null) {

      this.waterfall('onSetCustomer', {
        customer: params.businessPartner
      });
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
  defaultNavigateOnClose: 'customerView',
  header: {
    kind: 'OB.UI.SubwindowHeader',
    headermessage: OB.I18N.getLabel('OBPOS_TitleEditNewCustomer'),
    handlers: {
      onSetCustomer: 'setCustomer'
    },
    setCustomer: function (inSender, inEvent) {
      this.customer = inEvent.customer;
    },
    onTapCloseButton: function () {
      var subWindow = this.subWindow;
      if (subWindow.caller === 'mainSubWindow') {
        subWindow.doChangeSubWindow({
          newWindow: {
            name: subWindow.caller
          }
        });
      } else {
        subWindow.doChangeSubWindow({
          newWindow: {
            name: subWindow.caller,
            params: {
              navigateOnClose: 'customerAdvancedSearch',
              businessPartner: this.headerContainer.customer
            }
          }
        });
      }
    }
  },
  body: {
    kind: 'OB.OBPOSPointOfSale.UI.customers.edit_createcustomers_impl'
  }
});

//button of header of the body
enyo.kind({
  kind: 'OB.UI.Button',
  name: 'OB.OBPOSPointOfSale.UI.customers.newcustomersave',
  style: 'width: 100px; margin: 0px 5px 8px 19px;',
  classes: 'btnlink btnlink-small',
  content: OB.I18N.getLabel('OBPOS_LblSave'),
  events: {
    onSaveCustomer: ''
  },
  tap: function () {
    this.doSaveCustomer();
  }
});


//Header of body
enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.customers.subwindowNewCustomer_bodyheader',
  components: [{
    style: 'padding: 10px 500px 10px 500px;',
    components: [{
      style: 'display: table;',
      components: [{
        style: 'display: table-cell;',
        components: [{
          kind: 'OB.OBPOSPointOfSale.UI.customers.newcustomersave'
        }]
      }, {
        style: 'display: table-cell;',
        components: [{
          kind: 'OB.OBPOSPointOfSale.UI.customers.cancelEdit',
          handlers: {
            onSetCustomer: 'setCustomer'
          },
          setCustomer: function (inSender, inEvent) {
            this.customer = inEvent.customer;
          },
          tap: function () {
            var subWindow = this.subWindow;
            if (subWindow.caller === 'mainSubWindow') {
              subWindow.doChangeSubWindow({
                newWindow: {
                  name: subWindow.caller
                }
              });
            } else {
              subWindow.doChangeSubWindow({
                newWindow: {
                  name: subWindow.caller,
                  params: {
                    navigateOnClose: 'customerAdvancedSearch',
                    businessPartner: this.customer
                  }
                }
              });
            }
          }
        }]
      }]
    }]
  }]
});


enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.customers.edit_createcustomers_impl',
  kind: 'OB.OBPOSPointOfSale.UI.customers.edit_createcustomers',
  style: 'padding: 9px 15px;',
  windowHeader: 'OB.OBPOSPointOfSale.UI.customers.subwindowNewCustomer_bodyheader',
  newAttributes: [{
    kind: 'OB.UI.CustomerTextProperty',
    name: 'customerName',
    modelProperty: 'name',
    isFirstFocus: true,
    label: OB.I18N.getLabel('OBPOS_LblName')
  }, {
    kind: 'OB.UI.CustomerComboProperty',
    name: 'customerCategory',
    modelProperty: 'businessPartnerCategory',
    //Required: property where the selected value will be get and where the value will be saved
    modelPropertyText: 'businessPartnerCategory_name',
    //optional: When saving, the property which will store the selected text
    collection: new OB.Collection.BPCategoryList(),
    defaultValue: OB.POS.modelterminal.get('terminal').defaultbp_bpcategory,
    //Default value for new lines
    retrievedPropertyForValue: 'id',
    //property of the retrieved model to get the value of the combo item
    retrievedPropertyForText: '_identifier',
    //property of the retrieved model to get the text of the combo item
    //function to retrieve the data
    fetchDataFunction: function (args) {
      var me = this;
      OB.Dal.find(OB.Model.BPCategory, null, function (data, args) {
        //This function must be called when the data is ready
        me.dataReadyFunction(data, args);
      }, function (error) {
        OB.UTIL.showError(OB.I18N.getLabel('OBPOS_ErrorGettingBPCategories'));
        //This function must be called when the data is ready
        me.dataReadyFunction(null, args);
      }, args);
    },
    label: OB.I18N.getLabel('OBPOS_BPCategory'),
    displayLogic: OB.POS.modelterminal.get('terminal').bp_showcategoryselector
  }, {
    kind: 'OB.UI.CustomerTextProperty',
    name: 'customerTaxId',
    modelProperty: 'taxID',
    label: OB.I18N.getLabel('OBPOS_LblTaxId'),
    displayLogic: OB.POS.modelterminal.get('terminal').bp_showtaxid
  }, {
    kind: 'OB.UI.CustomerTextProperty',
    name: 'customerLocName',
    modelProperty: 'locName',
    label: OB.I18N.getLabel('OBPOS_LblAddress')
  }, {
    kind: 'OB.UI.CustomerTextProperty',
    name: 'customerPostalCode',
    modelProperty: 'postalCode',
    label: OB.I18N.getLabel('OBPOS_LblPostalCode')
  }, {
    kind: 'OB.UI.CustomerTextProperty',
    name: 'customerCity',
    modelProperty: 'cityName',
    label: OB.I18N.getLabel('OBPOS_LblCity')
  }, {
    kind: 'OB.UI.CustomerTextProperty',
    name: 'customerPhone',
    modelProperty: 'phone',
    label: OB.I18N.getLabel('OBPOS_LblPhone')
  }, {
    kind: 'OB.UI.CustomerTextProperty',
    name: 'customerEmail',
    modelProperty: 'email',
    label: OB.I18N.getLabel('OBPOS_LblEmail')
  }]
});