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
  name: 'OB.OBPOSPointOfSale.UI.customers.editcustomer',
  kind: 'OB.UI.Modal',
  classes: 'obObPosPointOfSaleUiCustomersEditCustomer',
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
  pressedButton: function() {
    this.pressedBtn = true;
    this.hide();
  },
  executeOnShow: function() {
    var me = this;
    me.pressedBtn = false;
    me.$.body.$.editcustomers_impl.setCustomer(this.args.businessPartner);
    var customerHeader = this.$.body.$.editcustomers_impl.$.bodyheader.$
      .editCustomerHeader;

    //Statistics data fetch
    if (
      OB.MobileApp.model.get('context') &&
      OB.MobileApp.model.get('context').organization && //
      (OB.MobileApp.model.get('context').organization.obposRecencytiming !==
        null || //
      OB.MobileApp.model.get('context').organization.obposFrecuencytiming !==
        null || //
      OB.MobileApp.model.get('context').organization.obposMonetarytiming !==
        null || //
        OB.MobileApp.model.get('context').organization.obposAvgbaskettiming !==
          null)
    ) {
      me.$.body.$.editcustomers_impl.$.statisticsLbl.setShowing(true);
    }

    var buttonContainer = customerHeader.$.buttonContainer;
    Object.keys(buttonContainer.$).forEach(function(key, index) {
      if (
        OB.OBPOSPointOfSale.UI.customers.EditCustomerHeader.prototype.customerHeaderButtons.find(
          function(headerButton) {
            return headerButton.name === key;
          }
        )
      ) {
        buttonContainer.$[key].customer = me.args.businessPartner;
        buttonContainer.$[key].navigationPath = me.args.navigationPath;
        buttonContainer.$[key].target = me.args.target;
        if (buttonContainer.$[key].permission) {
          buttonContainer.$[key].children[0].putDisabled(
            !OB.MobileApp.model.hasPermission(
              buttonContainer.$[key].permission,
              true
            )
          );
        }
      }
    });
    // Hide components depending on its displayLogic function
    _.each(this.$.body.$.editcustomers_impl.$.customerAttributes.$, function(
      attribute
    ) {
      if (attribute.name !== 'strategy') {
        if (
          attribute.coreElement.displayLogic &&
          !attribute.coreElement.displayLogic()
        ) {
          attribute.hide();
        }
      }
    });
    return true;
  },
  executeOnHide: function() {
    if (!this.pressedBtn) {
      this.doShowPopup({
        popup: this.args.navigationPath[this.args.navigationPath.length - 1],
        args: {
          target: this.args.target,
          navigationPath: OB.UTIL.BusinessPartnerSelector.cloneAndPop(
            this.args.navigationPath
          ),
          makeSearch: this.args.makeSearch
        }
      });
    }
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.customers.assigncustomertoticket',
  kind: 'OB.UI.Button',
  classes: 'obObPosPointOfSaleUiCustomersassignCustomerToTicket',
  events: {
    onChangeBusinessPartner: '',
    onPressedButton: ''
  },
  tap: function() {
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
  init: function(model) {
    this.model = model;
  },
  initComponents: function() {
    this.inherited(arguments);
    this.setContent(OB.I18N.getLabel('OBPOS_LblAssignToTicket'));
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.customers.managebpaddress',
  kind: 'OB.UI.Button',
  classes: 'obObPosPointOfSaleUiCustomersManageBPAddress',
  events: {
    onShowPopup: '',
    onPressedButton: ''
  },
  tap: function() {
    if (this.disabled) {
      return true;
    }
    this.doPressedButton();
    var me = this;
    OB.Dal.get(OB.Model.BusinessPartner, me.parent.customer.get('id'), function(
      bp
    ) {
      me.doShowPopup({
        popup: 'modalcustomeraddress',
        args: {
          target: 'order',
          businessPartner: bp,
          navigationPath: OB.UTIL.BusinessPartnerSelector.cloneAndPush(
            me.parent.navigationPath,
            'customerView'
          ),
          manageAddress: true
        }
      });
    });
  },
  putDisabled: function(status) {
    if (status === false) {
      this.setDisabled(false);
      return;
    }
    this.setDisabled(true);
  },
  init: function(model) {
    this.model = model;
  },
  initComponents: function() {
    this.inherited(arguments);
    this.setContent(OB.I18N.getLabel('OBPOS_BPAddress'));
  }
});

enyo.kind({
  kind: 'OB.UI.Button',
  name: 'OB.OBPOSPointOfSale.UI.customers.editbp',
  classes: 'obObPosPointOfSaleUiCustomersEditBP',
  events: {
    onShowPopup: '',
    onPressedButton: ''
  },
  setCustomer: function(customer) {
    this.customer = customer;
    if (
      !OB.MobileApp.model.hasPermission('OBPOS_retail.editCustomerButton', true)
    ) {
      this.setDisabled(true);
    } else {
      this.setDisabled(false);
    }
  },
  tap: function() {
    if (this.disabled === false) {
      var parent = this.parent;
      this.doPressedButton();
      this.doShowPopup({
        popup: 'customerCreateAndEdit',
        args: {
          businessPartner: parent.customer,
          target: parent.target,
          navigationPath: OB.UTIL.BusinessPartnerSelector.cloneAndPush(
            parent.navigationPath,
            'customerView'
          )
        }
      });
    }
  },
  putDisabled: function(status) {
    if (status === false) {
      this.setDisabled(false);
      return;
    }
    this.setDisabled(true);
  },
  init: function(model) {
    this.model = model;
  },
  initComponents: function() {
    this.inherited(arguments);
    this.setContent(OB.I18N.getLabel('OBPOS_LblEdit'));
  }
});

enyo.kind({
  kind: 'OB.UI.Button',
  name: 'OB.OBPOSPointOfSale.UI.customers.lastactivity',
  classes: 'obObPosPointOfSaleUiCustomersLastActivity',
  i18nLabel: 'OBPOS_Cus360LblLastActivity',
  events: {
    onShowPopup: '',
    onPressedButton: ''
  },
  tap: function() {
    if (this.disabled === false) {
      var parent = this.parent;
      this.doPressedButton();
      this.doShowPopup({
        popup: 'modalReceiptSelectorCustomerView',
        args: {
          multiselect: false,
          clean: true,
          target: parent.target,
          businessPartner: parent.customer,
          navigationPath: OB.UTIL.BusinessPartnerSelector.cloneAndPush(
            parent.navigationPath,
            'customerView'
          ),
          customHeaderContent:
            parent.customer.get('_identifier') +
            "'s " +
            OB.I18N.getLabel('OBPOS_Cus360LblLastActivity'),
          hideBusinessPartnerColumn: true
        }
      });
    }
  }
});

/*header of window body*/
enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.customers.EditCustomerHeader',
  classes: 'obObPosPointOfSaleUiCustomersEditCustomerHeader',
  customerHeaderButtons: [
    {
      name: 'editbp',
      permission: 'OBPOS_retail.editCustomerButton',
      classes: 'obObPosPointOfSaleUiCustomersEditCustomerHeader-editbp',
      components: [
        {
          kind: 'OB.OBPOSPointOfSale.UI.customers.editbp'
        }
      ]
    },
    {
      name: 'assigncustomertoticket',
      classes:
        'obObPosPointOfSaleUiCustomersEditCustomerHeader-assigncustomertoticket',
      components: [
        {
          kind: 'OB.OBPOSPointOfSale.UI.customers.assigncustomertoticket'
        }
      ]
    },
    {
      name: 'managebpaddress',
      classes:
        'obObPosPointOfSaleUiCustomersEditCustomerHeader-managebpaddress',
      permission: 'OBPOS_retail.editCustomerLocationButton',
      components: [
        {
          kind: 'OB.OBPOSPointOfSale.UI.customers.managebpaddress'
        }
      ]
    },
    {
      name: 'lastactivity',
      classes: 'obObPosPointOfSaleUiCustomersEditCustomerHeader-lastactivity',
      components: [
        {
          kind: 'OB.OBPOSPointOfSale.UI.customers.lastactivity'
        }
      ]
    }
  ],
  components: [
    {
      name: 'buttonContainer',
      classes: 'obObPosPointOfSaleUiCustomersEditCustomerHeader-buttonContainer'
    }
  ],
  initComponents: function() {
    this.inherited(arguments);
    var container = this.$.buttonContainer;
    this.customerHeaderButtons.forEach(function(button) {
      container.createComponent(button);
    });
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.customers.editcustomers_impl',
  kind: 'OB.OBPOSPointOfSale.UI.customers.edit_createcustomers',
  classes: 'obObPosPointOfSaleUiCustomersEditCustomersImpl',
  windowHeader: 'OB.OBPOSPointOfSale.UI.customers.EditCustomerHeader',
  newAttributes: [
    {
      kind: 'OB.UI.CustomerTextProperty',
      name: 'greeting',
      classes: 'obObPosPointOfSaleUiCustomersEditCustomersImpl-greeting',
      modelProperty: 'greetingName',
      i18nLabel: 'OBPOS_LblGreetings',
      readOnly: true,
      displayLogic: function() {
        return OB.MobileApp.model.hasPermission(
          'OBPOS_Cus360ShowGreetings',
          true
        );
      }
    },
    {
      kind: 'OB.UI.CustomerTextProperty',
      name: 'customerName',
      classes: 'obObPosPointOfSaleUiCustomersEditCustomersImpl-customerName',
      modelProperty: 'firstName',
      i18nLabel: 'OBPOS_LblName',
      readOnly: true
    },
    {
      kind: 'OB.UI.CustomerTextProperty',
      name: 'customerLastName',
      classes:
        'obObPosPointOfSaleUiCustomersEditCustomersImpl-customerLastName',
      modelProperty: 'lastName',
      i18nLabel: 'OBPOS_LblLastName',
      readOnly: true
    },
    {
      kind: 'OB.UI.CustomerTextProperty',
      name: 'customerBpCat',
      classes: 'obObPosPointOfSaleUiCustomersEditCustomersImpl-customerBpCat',
      modelProperty: 'businessPartnerCategory_name',
      i18nLabel: 'OBPOS_BPCategory',
      readOnly: true,
      displayLogic: function() {
        return OB.MobileApp.model.get('terminal').bp_showcategoryselector;
      }
    },
    {
      kind: 'OB.UI.CustomerTextProperty',
      name: 'customerTaxId',
      classes: 'obObPosPointOfSaleUiCustomersEditCustomersImpl-customerTaxId',
      modelProperty: 'taxID',
      i18nLabel: 'OBPOS_LblTaxId',
      readOnly: true,
      displayLogic: function() {
        return OB.MobileApp.model.get('terminal').bp_showtaxid;
      }
    },
    {
      kind: 'OB.UI.CustomerTextProperty',
      name: 'customerPhone',
      classes: 'obObPosPointOfSaleUiCustomersEditCustomersImpl-customerPhone',
      modelProperty: 'phone',
      i18nLabel: 'OBPOS_LblPhone',
      readOnly: true
    },
    {
      kind: 'OB.UI.CustomerTextProperty',
      name: 'alternativePhone',
      classes:
        'obObPosPointOfSaleUiCustomersEditCustomersImpl-alternativePhone',
      modelProperty: 'alternativePhone',
      i18nLabel: 'OBPOS_LblAlternativePhone',
      readOnly: true
    },
    {
      kind: 'OB.UI.CustomerTextProperty',
      name: 'customerEmail',
      classes: 'obObPosPointOfSaleUiCustomersEditCustomersImpl-customerEmail',
      modelProperty: 'email',
      i18nLabel: 'OBPOS_LblEmail',
      readOnly: true
    },
    {
      kind: 'OB.UI.CustomerTextProperty',
      name: 'birthPlace',
      classes: 'obObPosPointOfSaleUiCustomersEditCustomersImpl-birthPlace',
      modelProperty: 'birthPlace',
      i18nLabel: 'OBPOS_LblBirthplace',
      readOnly: true,
      displayLogic: function() {
        return OB.MobileApp.model.hasPermission(
          'OBPOS_Cus360ShowBirthplace',
          true
        );
      }
    },
    {
      kind: 'OB.UI.CustomerTextProperty',
      name: 'birthDay',
      classes: 'obObPosPointOfSaleUiCustomersEditCustomersImpl-birthDay',
      modelProperty: 'birthDay',
      i18nLabel: 'OBPOS_LblBirthdate',
      readOnly: true,
      displayLogic: function() {
        return OB.MobileApp.model.hasPermission(
          'OBPOS_Cus360ShowBirthdate',
          true
        );
      },
      loadValue: function(inSender, inEvent) {
        if (inEvent.customer !== undefined) {
          if (
            !OB.UTIL.isNullOrUndefined(
              inEvent.customer.get(this.modelProperty)
            ) &&
            inEvent.customer.get(this.modelProperty) !== ''
          ) {
            this.setValue(
              OB.I18N.formatDate(
                new Date(inEvent.customer.get(this.modelProperty))
              )
            );
          } else {
            this.setValue('');
          }
        } else {
          this.setValue('');
        }
      }
    },
    {
      kind: 'OB.UI.CustomerTextProperty',
      name: 'language',
      classes: 'obObPosPointOfSaleUiCustomersEditCustomersImpl-language',
      modelProperty: 'language_name',
      readOnly: true,
      i18nLabel: 'OBPOS_LblLanguage',
      displayLogic: function() {
        return OB.MobileApp.model.hasPermission(
          'OBPOS_Cus360ShowLanguage',
          true
        );
      }
    },
    {
      kind: 'OB.UI.CustomerTextProperty',
      name: 'availableCredit',
      classes: 'obObPosPointOfSaleUiCustomersEditCustomersImpl-availableCredit',
      modelProperty: 'availableCredit',
      i18nLabel: 'OBPOS_LblAvailableCredit',
      readOnly: true,
      displayLogic: function() {
        return OB.MobileApp.model.hasPermission(
          'OBPOS_Cus360ShowAvailableCredit',
          true
        );
      }
    },
    {
      kind: 'OB.UI.CustomerTextProperty',
      name: 'comments',
      classes: 'obObPosPointOfSaleUiCustomersEditCustomersImpl-comments',
      modelProperty: 'comments',
      i18nLabel: 'OBPOS_LblComments',
      readOnly: true,
      displayLogic: function() {
        return OB.MobileApp.model.hasPermission(
          'OBPOS_Cus360ShowComments',
          true
        );
      }
    },
    {
      kind: 'OB.UI.CustomerTextProperty',
      name: 'customerPriceList',
      classes:
        'obObPosPointOfSaleUiCustomersEditCustomersImpl-customerPriceList',
      modelProperty: 'priceList',
      i18nLabel: 'OBPOS_PriceList',
      readOnly: true,
      loadValue: function(inSender, inEvent) {
        if (inEvent.customer !== undefined) {
          if (inEvent.customer.get(this.modelProperty) !== undefined) {
            var me = this;
            OB.UTIL.getPriceListName(
              inEvent.customer.get(this.modelProperty),
              function(name) {
                me.setValue(name);
              }
            );
          }
        } else {
          this.setValue('');
        }
      },
      displayLogic: function() {
        return OB.MobileApp.model.hasPermission('EnableMultiPriceList', true);
      }
    },
    {
      kind: 'OB.UI.CustomerConsentCheckProperty',
      name: 'isCustomerConsent',
      classes:
        'obObPosPointOfSaleUiCustomersEditCustomersImpl-isCustomerConsent',
      modelProperty: 'isCustomerConsent',
      i18nLabel: 'OBPOS_CustomerConsent',
      readOnly: true
    },
    {
      kind: 'OB.UI.CustomerCheckCommercialAuth',
      name: 'commercialauth',
      classes: 'obObPosPointOfSaleUiCustomersEditCustomersImpl-commercialauth',
      modelProperty: 'commercialauth',
      i18nLabel: 'OBPOS_CommercialAuth',
      readOnly: true,
      displayLogic: function() {
        return OB.MobileApp.model.hasPermission(
          'OBPOS_Cus360ShowCommercialAuth',
          true
        );
      }
    },
    {
      kind: 'OB.UI.CustomerCheckComboProperty',
      name: 'contactpreferences',
      classes:
        'obObPosPointOfSaleUiCustomersEditCustomersImpl-contactpreferences',
      modelProperty: 'contactpreferences',
      i18nLabel: 'OBPOS_ContactPreferences',
      readOnly: true,
      setEditedProperties: function(oldBp, editedBp) {
        editedBp.set('viasms', oldBp.get('viasms'));
        editedBp.set('viaemail', oldBp.get('viaemail'));
      },
      displayLogic: function() {
        return OB.MobileApp.model.hasPermission(
          'OBPOS_Cus360ShowContactPreferences',
          true
        );
      }
    }
  ],
  statisticsAttributes: [
    {
      kind: 'OB.UI.CustomerStatisticsTextProperty',
      name: 'recency',
      classes: 'obObPosPointOfSaleUiCustomersEditCustomersImpl-recency',
      i18nLabel: 'OBPOS_LblRecency',
      readOnly: true,
      displayLogic: function() {
        return (
          OB.MobileApp.model.get('context') &&
          OB.MobileApp.model.get('context').organization &&
          OB.MobileApp.model.get('context').organization.obposRecencytiming !==
            null
        );
      }
    },
    {
      kind: 'OB.UI.CustomerStatisticsTextProperty',
      name: 'frequency',
      classes: 'obObPosPointOfSaleUiCustomersEditCustomersImpl-frequency',
      i18nLabel: 'OBPOS_LblFrequency',
      readOnly: true,
      displayLogic: function() {
        return (
          OB.MobileApp.model.get('context') &&
          OB.MobileApp.model.get('context').organization &&
          OB.MobileApp.model.get('context').organization
            .obposFrecuencytiming !== null
        );
      }
    },
    {
      kind: 'OB.UI.CustomerStatisticsTextProperty',
      name: 'monetaryValue',
      classes: 'obObPosPointOfSaleUiCustomersEditCustomersImpl-monetaryValue',
      i18nLabel: 'OBPOS_LblMonetaryVal',
      readOnly: true,
      displayLogic: function() {
        return (
          OB.MobileApp.model.get('context') &&
          OB.MobileApp.model.get('context').organization &&
          OB.MobileApp.model.get('context').organization.obposMonetarytiming !==
            null
        );
      }
    },
    {
      kind: 'OB.UI.CustomerStatisticsTextProperty',
      name: 'averageCart',
      classes: 'obObPosPointOfSaleUiCustomersEditCustomersImpl-averageCart',
      i18nLabel: 'OBPOS_LblAvgCart',
      readOnly: true,
      displayLogic: function() {
        return (
          OB.MobileApp.model.get('context') &&
          OB.MobileApp.model.get('context').organization &&
          OB.MobileApp.model.get('context').organization
            .obposAvgbaskettiming !== null
        );
      }
    }
  ]
});

enyo.kind({
  name: 'OBPOS.UI.ReceiptSelectorCustomerView',
  kind: 'OBPOS.UI.ReceiptSelector',
  classes: 'obposUiReceiptSelectorCustomerView',
  executeOnShow: function() {
    if (!this.initialized || (this.args && _.keys(this.args).length > 0)) {
      this.selectorHide = false;
      this.initialized = true;
      this.initializedArgs = this.args;
      var column = _.find(
        OB.Model.OrderFilter.getProperties(),
        function(prop) {
          return prop.name === 'businessPartner';
        },
        this
      );
      var bp = this.args.businessPartner;
      if (!OB.UTIL.isNullOrUndefined(bp)) {
        column.preset.id = bp.get('id');
        column.preset.name = bp.get('_identifier');
      } else {
        column.preset.id = '';
        column.preset.name = '';
      }
      this.initSelector();
      var filterSelector = this.getFilterSelectorTableHeader();
      var id = _.find(
        OB.Model.OrderFilter.getProperties(),
        function(prop) {
          return prop.name === 'id';
        },
        this
      );
      filterSelector.fixedColumn = id;
      filterSelector.searchAction();
      filterSelector.fixedColumn = '';
    }
    var isMultiselect = this.args.multiselect === true;
    this.$.body.$.receiptsList.$.openreceiptslistitemprinter.multiselect = isMultiselect;
    this.$.body.$.receiptsList.$.openreceiptslistitemprinter.$.theader.$.modalReceiptsScrollableHeader.$.btnOpenSelected.setShowing(
      isMultiselect
    );
    if (this.args.customHeaderContent) {
      this.$.header.setContent(this.args.customHeaderContent);
    } else {
      this.$.header.setContent(OB.I18N.getLabel('OBPOS_OpenReceipt'));
    }
    this.$.body.$.receiptsList.$.openreceiptslistitemprinter.hideBusinessPartnerColumn = this.args.hideBusinessPartnerColumn;
  },
  executeOnHide: function() {
    if (
      !this.pressedBtn &&
      this.args.navigationPath &&
      this.args.navigationPath.length > 0
    ) {
      var column = _.find(
        OB.Model.OrderFilter.getProperties(),
        function(prop) {
          return prop.name === 'businessPartner';
        },
        this
      );
      column.preset.id = '';
      column.preset.name = '';
      this.doShowPopup({
        popup: this.args.navigationPath[this.args.navigationPath.length - 1],
        args: {
          businessPartner: this.args.businessPartner,
          target: this.args.target,
          navigationPath: OB.UTIL.BusinessPartnerSelector.cloneAndPop(
            this.args.navigationPath
          )
        }
      });
    }
  }
});
