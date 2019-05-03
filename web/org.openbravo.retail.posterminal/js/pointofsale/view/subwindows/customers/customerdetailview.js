/*
 ************************************************************************************
 * Copyright (C) 2012-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, enyo, _ */

enyo.kind({
  kind: 'OB.UI.Modal',
  name: 'OB.OBPOSPointOfSale.UI.customers.editcustomer',
  classes: 'receipt-customer-selector-editor',
  i18nHeader: 'OBPOS_TitleViewCustomer',
  handlers: {
    onPressedButton: 'pressedButton'
  },
  events: {
    onShowPopup: ''
  },
  body: {
    kind: 'OB.OBPOSPointOfSale.UI.customers.editcustomers_impl'
  },
  pressedButton: function () {
    this.pressedBtn = true;
    this.hide();
  },
  executeOnShow: function () {
    this.pressedBtn = false;
    this.$.body.$.editcustomers_impl.setCustomer(this.args.businessPartner);
    var customerHeader = this.$.body.$.editcustomers_impl.$.bodyheader.$.editCustomerHeader;
    var buttonContainer = customerHeader.$.buttonContainer;
    for (component in buttonContainer.$) {
      if (OB.OBPOSPointOfSale.UI.customers.EditCustomerHeader.prototype.customerHeaderButtons.find(function (headerButton) {
        return headerButton.name === component;
      })) {
        buttonContainer.$[component].customer = this.args.businessPartner;
        buttonContainer.$[component].navigationPath = this.args.navigationPath;
        buttonContainer.$[component].target = this.args.target;
        if (buttonContainer.$[component].permission) {
          buttonContainer.$[component].children[0].putDisabled(!OB.MobileApp.model.hasPermission(buttonContainer.$[component].permission, true));
        }
      }
    }
    //    buttonContainer.$.editbp.setCustomer(this.args.businessPartner);
    
    
    
    // Hide components depending on its displayLogic function
    _.each(this.$.body.$.editcustomers_impl.$.customerAttributes.$, function (attribute) {
      if (attribute.name !== 'strategy') {
        _.each(attribute.$.newAttribute.$, function (attrObject) {
          if (attrObject.displayLogic && !attrObject.displayLogic()) {
            this.hide();
          }
        }, attribute);
      }
    });
    return true;
  },
  executeOnHide: function () {
    if (!this.pressedBtn) {
      this.doShowPopup({
        popup: this.args.navigationPath[this.args.navigationPath.length - 1],
        args: {
          target: this.args.target,
          navigationPath: OB.UTIL.BusinessPartnerSelector.cloneAndPop(this.args.navigationPath),
          makeSearch: this.args.makeSearch
        }
      });
    }
  }
});

enyo.kind({
  kind: 'OB.UI.Button',
  name: 'OB.OBPOSPointOfSale.UI.customers.assigncustomertoticket',
  style: 'margin: 0px 0px 8px 5px;',
  classes: 'btnlink-yellow btnlink btnlink-small',
  events: {
    onChangeBusinessPartner: '',
    onPressedButton: ''
  },
  tap: function () {
    var orderBP = this.model.get('order').get('bp');
    var customer = this.parent.customer;
    if (customer.get('id') === orderBP.get('id')) {
      if (customer.get('locId') !== orderBP.get('locId')) {
        customer.set('locId', orderBP.get('locId'));
        customer.set('locName', orderBP.get('locName'));
        customer.set('postalCode', orderBP.get('postalCode'));
        customer.set('cityName', orderBP.get('cityName'));
        customer.set('countryName', orderBP.get('countryName'));
        customer.set('locationModel', orderBP.get('locationModel'));
      }
      if (customer.get('shipLocId') !== orderBP.get('shipLocId')) {
        customer.set('shipLocId', orderBP.get('shipLocId'));
        customer.set('shipLocName', orderBP.get('shipLocName'));
        customer.set('shipPostalCode', orderBP.get('shipPostalCode'));
        customer.set('shipCityName', orderBP.get('shipCityName'));
        customer.set('shipCountryName', orderBP.get('shipCountryName'));
      }
    }
    this.doChangeBusinessPartner({
      businessPartner: OB.UTIL.clone(customer),
      target: this.parent.target
    });
    this.doPressedButton();
  },
  init: function (model) {
    this.model = model;
  },
  initComponents: function () {
    this.inherited(arguments);
    this.setContent(OB.I18N.getLabel('OBPOS_LblAssignToTicket'));
  }
});

enyo.kind({
  kind: 'OB.UI.Button',
  name: 'OB.OBPOSPointOfSale.UI.customers.managebpaddress',
  style: 'margin: 0px 0px 8px 5px;',
  classes: 'btnlink-yellow btnlink btnlink-small',
  events: {
    onShowPopup: '',
    onPressedButton: ''
  },
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.doPressedButton();
    var me = this;
    OB.Dal.get(OB.Model.BusinessPartner, me.parent.customer.get('id'), function (bp) {
      me.doShowPopup({
        popup: 'modalcustomeraddress',
        args: {
          target: 'order',
          businessPartner: bp,
          navigationPath: OB.UTIL.BusinessPartnerSelector.cloneAndPush(me.parent.navigationPath, 'customerView'),
          manageAddress: true
        }
      });
    });
  },
  putDisabled: function (status) {
    if (status === false) {
      this.setDisabled(false);
      this.removeClass('disabled');
      this.disabled = false;
      return;
    }
    this.setDisabled(true);
    this.addClass('disabled');
    this.disabled = true;
  },
  init: function (model) {
    this.model = model;
  },
  initComponents: function () {
    this.inherited(arguments);
    this.setContent(OB.I18N.getLabel('OBPOS_BPAddress'));
  }
});

enyo.kind({
  kind: 'OB.UI.Button',
  name: 'OB.OBPOSPointOfSale.UI.customers.editbp',
  style: 'width: 100px; margin: 0px 5px 8px 19px;',
  classes: 'btnlink-orange btnlink btnlink-small',
  events: {
    onShowPopup: '',
    onPressedButton: ''
  },
  setCustomer: function (customer) {
    this.customer = customer;
    if (!OB.MobileApp.model.hasPermission('OBPOS_retail.editCustomerButton', true)) {
      this.disabled = true;
      this.setAttribute("disabled", "disabled");
    } else {
      this.disabled = false;
      this.setAttribute("disabled", null);
    }
  },
  tap: function () {
    if (this.disabled === false) {
      var parent = this.parent;
      this.doPressedButton();
      this.doShowPopup({
        popup: 'customerCreateAndEdit',
        args: {
          businessPartner: parent.customer,
          target: parent.target,
          navigationPath: OB.UTIL.BusinessPartnerSelector.cloneAndPush(parent.navigationPath, 'customerView')
        }
      });
    }
  },
  putDisabled: function (status) {
    if (status === false) {
      this.setDisabled(false);
      this.removeClass('disabled');
      this.disabled = false;
      return;
    }
    this.setDisabled(true);
    this.addClass('disabled');
    this.disabled = true;
  },
  init: function (model) {
    this.model = model;
  },
  initComponents: function () {
    this.setContent(OB.I18N.getLabel('OBPOS_LblEdit'));
  }
});

enyo.kind({
  kind: 'OB.UI.Button',
  name: 'OB.OBPOSPointOfSale.UI.customers.lastactivity',
  style: 'margin: 0px 0px 8px 5px;',
  classes: 'btnlink-yellow btnlink btnlink-small',
  events: {
    onShowPopup: '',
    onPressedButton: ''
  },
  tap: function () {
    if (this.disabled === false) {
      var parent = this.parent;
      this.doPressedButton();
      this.doShowPopup({
        popup: 'modalReceiptSelector',
        args: {
          multiselect: true,
          clean: true,
          target: parent.target,
          businessPartner: parent.customer,
          navigationPath: OB.UTIL.BusinessPartnerSelector.cloneAndPush(parent.navigationPath, 'customerView'),
          customHeaderContent: (parent.customer.get('_identifier') + "'s " + OB.I18N.getLabel('OBPOS_Cus360LblLastActivity')),
          hideBusinessPartnerColumn: true,
          advancedFilters: {
            orderby: null,
            filters: [{
              caption: parent.customer.get('_identifier'),
              column: 'businessPartner',
              isId: true,
              operator: '=',
              value: parent.customer.get('id')
            }]
          }
        }
      })
    }
  },
  init: function (model) {
    this.model = model;
  },
  initComponents: function () {
    this.inherited(arguments);
    this.setContent(OB.I18N.getLabel('OBPOS_Cus360LblLastActivity'));
  }
});

/*header of window body*/
enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.customers.EditCustomerHeader',
  customerHeaderButtons: [{
    name: 'editbp',
    permission: 'OBPOS_retail.editCustomerButton',
    style: 'display: table-cell;',
    components: [{
      kind: 'OB.OBPOSPointOfSale.UI.customers.editbp'
    }]
  }, {
    name: 'assigncustomertoticket',
    style: 'display: table-cell;',
    components: [{
      kind: 'OB.OBPOSPointOfSale.UI.customers.assigncustomertoticket'
    }]
  }, {
    name: 'managebpaddress',
    style: 'display: table-cell;',
    permission: 'OBPOS_retail.editCustomerLocationButton',
    components: [{
      kind: 'OB.OBPOSPointOfSale.UI.customers.managebpaddress'
    }]
  }, {
    name: 'lastactivity',
    style: 'display: table-cell;',
    components: [{
      kind: 'OB.OBPOSPointOfSale.UI.customers.lastactivity'
    }]
  }],
  components: [{
    style: 'display: table; margin: 0 auto;',
    name: 'buttonContainer'
  }],
  initComponents: function () {
    this.inherited(arguments);
    var container = this.$.buttonContainer;
    this.customerHeaderButtons.forEach(function (button) {
      container.createComponent(button);
    });
  }
});

enyo.kind({
  kind: 'OB.OBPOSPointOfSale.UI.customers.edit_createcustomers',
  name: 'OB.OBPOSPointOfSale.UI.customers.editcustomers_impl',
  style: 'padding: 9px 15px;',
  windowHeader: 'OB.OBPOSPointOfSale.UI.customers.EditCustomerHeader',
  newAttributes: [{
    kind: 'OB.UI.CustomerTextProperty',
    name: 'customerName',
    modelProperty: 'firstName',
    i18nLabel: 'OBPOS_LblName',
    readOnly: true
  }, {
    kind: 'OB.UI.CustomerTextProperty',
    name: 'customerLastName',
    modelProperty: 'lastName',
    i18nLabel: 'OBPOS_LblLastName',
    readOnly: true
  }, {
    kind: 'OB.UI.CustomerTextProperty',
    name: 'customerBpCat',
    modelProperty: 'businessPartnerCategory_name',
    i18nLabel: 'OBPOS_BPCategory',
    readOnly: true,
    displayLogic: function () {
      return OB.MobileApp.model.get('terminal').bp_showcategoryselector;
    }
  }, {
    kind: 'OB.UI.CustomerTextProperty',
    name: 'customerTaxId',
    modelProperty: 'taxID',
    i18nLabel: 'OBPOS_LblTaxId',
    readOnly: true,
    displayLogic: function () {
      return OB.MobileApp.model.get('terminal').bp_showtaxid;
    }
  }, {
    kind: 'OB.UI.CustomerTextProperty',
    name: 'customerPhone',
    modelProperty: 'phone',
    i18nLabel: 'OBPOS_LblPhone',
    readOnly: true
  }, {
    kind: 'OB.UI.CustomerTextProperty',
    name: 'alternativePhone',
    modelProperty: 'alternativePhone',
    i18nLabel: 'OBPOS_LblAlternativePhone',
    readOnly: true
  }, {
    kind: 'OB.UI.CustomerTextProperty',
    name: 'customerEmail',
    modelProperty: 'email',
    i18nLabel: 'OBPOS_LblEmail',
    readOnly: true
  }, {
    kind: 'OB.UI.CustomerConsentCheckProperty',
    name: 'isCustomerConsent',
    modelProperty: 'isCustomerConsent',
    i18nLabel: 'OBPOS_CustomerConsent',
    readOnly: true
  }, {
    kind: 'OB.UI.CustomerTextProperty',
    name: 'language',
    modelProperty: 'language_name',
    readOnly: true,
    i18nLabel: 'OBPOS_LblLanguage',
    displayLogic: function () {
      return OB.MobileApp.model.hasPermission('OBPOS_Cus360ShowLanguage', true);
    }
  }, {
    kind: 'OB.UI.CustomerTextProperty',
    name: 'comments',
    modelProperty: 'comments',
    i18nLabel: 'OBPOS_LblComments',
    readOnly: true,
    displayLogic: function () {
      return OB.MobileApp.model.hasPermission('OBPOS_Cus360ShowComments', true);
    }
  }, {
    kind: 'OB.UI.CustomerTextProperty',
    name: 'availableCredit',
    modelProperty: 'availableCredit',
    i18nLabel: 'OBPOS_LblAvailableCredit',
    readOnly: true,
    displayLogic: function () {
      return OB.MobileApp.model.hasPermission('OBPOS_Cus360ShowAvailableCredit', true);
    }
  }, {
    kind: 'OB.UI.CustomerTextProperty',
    name: 'birthPlace',
    modelProperty: 'birthPlace',
    i18nLabel: 'OBPOS_LblBirthplace',
    readOnly: true,
    displayLogic: function () {
      return OB.MobileApp.model.hasPermission('OBPOS_ShowBusinessPartnerBirthInfo', true);
    }
  }, {
    kind: 'OB.UI.CustomerTextProperty',
    name: 'birthDay',
    modelProperty: 'birthDay',
    i18nLabel: 'OBPOS_LblBirthdate',
    readOnly: true,
    displayLogic: function () {
      return OB.MobileApp.model.hasPermission('OBPOS_ShowBusinessPartnerBirthInfo', true);
    },
    loadValue: function (inSender, inEvent) {
      if (inEvent.customer !== undefined) {
        if (!OB.UTIL.isNullOrUndefined(inEvent.customer.get(this.modelProperty)) && inEvent.customer.get(this.modelProperty) !== '') {
          this.setValue(OB.I18N.formatDate(new Date(inEvent.customer.get(this.modelProperty))));
        } else {
          this.setValue('');
        }
      } else {
        this.setValue('');
      }
    }
  }, {
    kind: 'OB.UI.CustomerTextProperty',
    name: 'customerPriceList',
    modelProperty: 'priceList',
    i18nLabel: 'OBPOS_PriceList',
    readOnly: true,
    loadValue: function (inSender, inEvent) {
      if (inEvent.customer !== undefined) {
        if (inEvent.customer.get(this.modelProperty) !== undefined) {
          var me = this;
          OB.UTIL.getPriceListName(inEvent.customer.get(this.modelProperty), function (name) {
            me.setValue(name);
          });
        }
      } else {
        this.setValue('');
      }
    },
    displayLogic: function () {
      return OB.MobileApp.model.hasPermission('EnableMultiPriceList', true);
    }
  }]
});