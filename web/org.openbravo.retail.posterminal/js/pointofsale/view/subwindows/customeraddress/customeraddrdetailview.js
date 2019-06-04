/*
 ************************************************************************************
 * Copyright (C) 2012-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 *
 * Contributed by Qualian Technologies Pvt. Ltd.
 ************************************************************************************
 */

/*global enyo*/

enyo.kind({
  kind: 'OB.UI.Modal',
  name: 'OB.OBPOSPointOfSale.UI.customeraddr.editcustomeraddr',
  classes: 'obObposPointOfSaleUiCustomerAddrEditCustomerAddr',
  i18nHeader: 'OBPOS_TitleViewCustomerAddress',
  events: {
    onShowPopup: ''
  },
  handlers: {
    onPressedButton: 'pressedButton'
  },
  body: {
    kind: 'OB.OBPOSPointOfSale.UI.customeraddr.editcustomers_impl',
    classes: 'obObposPointOfSaleUiCustomerAddrEditCustomerAddr-body-obObposPointOfSaleUiCustomerAddrEditCustomersImpl'
  },
  pressedButton: function () {
    this.pressedBtn = true;
    this.hide();
  },
  executeOnShow: function () {
    this.pressedBtn = false;
    this.$.body.$.editcustomers_impl.setCustomerAddr(this.args.businessPartner, this.args.bPLocation);
    var editCustomerHeader = this.$.body.$.editcustomers_impl.$.bodyheader.$.editCustomerHeader;


    editCustomerHeader.$.assigncustomeraddrtoticketmenu.setCustomerAddr(this.args.businessPartner, this.args.bPLocation, this.args.target);

    editCustomerHeader.$.editticketcustomeraddr.setCustomerAddr(this.args.businessPartner, this.args.bPLocation);
    editCustomerHeader.$.editticketcustomeraddr.navigationPath = this.args.navigationPath;
    editCustomerHeader.$.editticketcustomeraddr.target = this.args.target;

    editCustomerHeader.$.assigncustomeraddrtoticket.setCustomerAddr(this.args.businessPartner, this.args.bPLocation);
    editCustomerHeader.$.assigncustomeraddrtoticket.navigationPath = this.args.navigationPath;
    editCustomerHeader.$.assigncustomeraddrtoticket.target = this.args.target;

    editCustomerHeader.$.assigncustomeraddrtoticketinv.setCustomerAddr(this.args.businessPartner, this.args.bPLocation);
    editCustomerHeader.$.assigncustomeraddrtoticketinv.navigationPath = this.args.navigationPath;
    editCustomerHeader.$.assigncustomeraddrtoticketinv.target = this.args.target;

    editCustomerHeader.$.assigncustomeraddrtoticketship.setCustomerAddr(this.args.businessPartner, this.args.bPLocation);
    editCustomerHeader.$.assigncustomeraddrtoticketship.navigationPath = this.args.navigationPath;
    editCustomerHeader.$.assigncustomeraddrtoticketship.target = this.args.target;

    var invship = this.args.bPLocation.get('isBillTo') && this.args.bPLocation.get('isShipTo');
    editCustomerHeader.$.assigncustomeraddrtoticketmenu.setShowing(!this.args.bPLocation.get('onlyOneAddress') && invship);
    editCustomerHeader.$.assigncustomeraddrtoticket.setShowing(this.args.bPLocation.get('onlyOneAddress') && invship);
    editCustomerHeader.$.assigncustomeraddrtoticketinv.setShowing(!invship && this.args.bPLocation.get('isBillTo'));
    editCustomerHeader.$.assigncustomeraddrtoticketship.setShowing(!invship && this.args.bPLocation.get('isShipTo'));

    return true;
  },
  executeOnHide: function () {
    if (!this.pressedBtn) {
      this.doShowPopup({
        popup: this.args.navigationPath[this.args.navigationPath.length - 1],
        args: {
          businessPartner: this.args.businessPartner,
          target: this.args.target,
          navigationPath: OB.UTIL.BusinessPartnerSelector.cloneAndPop(this.args.navigationPath),
          makeSearch: this.args.makeSearch
        }
      });
    }
  }
});

enyo.kind({
  kind: 'onyx.MenuDecorator',
  name: 'OB.OBPOSPointOfSale.UI.customeraddr.assigncustomeraddrtoticketmenu',
  classes: 'obObposPointOfSaleUiCustomeraddrAssigncustomeraddrtoticketmenu',
  handlers: {
    onSelect: 'itemSelected'
  },
  events: {
    onPressedButton: '',
    onChangeBusinessPartner: ''
  },
  components: [{
    kind: 'OB.UI.Button',
    classes: 'obObposPointOfSaleUiCustomeraddrAssigncustomeraddrtoticketmenu-obUiButton',
    components: [{
      name: 'identifier',
      classes: 'obObposPointOfSaleUiCustomeraddrAssigncustomeraddrtoticketmenu-obUiButton-identifier'
    }, {
      classes: 'obObposPointOfSaleUiCustomeraddrAssigncustomeraddrtoticketmenu-obUiButton-element2'
    }, {
      classes: 'obObposPointOfSaleUiCustomeraddrAssigncustomeraddrtoticketmenu-obUiButton-element3 u-clearBoth'
    }]
  }, {
    kind: 'OB.UI.ListContextDynamicMenu',
    name: 'menu',
    classes: 'obObposPointOfSaleUiCustomeraddrAssigncustomeraddrtoticketmenu-menu'
  }],
  itemSelected: function (sender, event) {
    event.originator.selectItem(this.customerAddr);
    this.doPressedButton();
    return true;
  },
  setCustomerAddr: function (customer, customerAddr, target) {
    this.bPartner = customer;
    this.customerAddr = customerAddr;
    this.dialog = {
      menuSelected: false,
      target: target,
      component: this
    };
  },
  initComponents: function () {
    this.inherited(arguments);
    this.$.identifier.setContent(OB.I18N.getLabel('OBPOS_LblAssignAddressMenu'));

    var menuOptions = [];
    menuOptions.push({
      kind: 'OB.UI.BPLocAssignToReceiptContextMenuItem',
      classes: 'obObposPointOfSaleUiCustomeraddrAssigncustomeraddrtoticketmenu-menu-obUiBPLocAssignToReceiptContextMenuItem',
      permission: 'OBPOS_retail.assignToReceiptAddress'
    });
    menuOptions.push({
      kind: 'OB.UI.BPLocAssignToReceiptShippingContextMenuItem',
      classes: 'obObposPointOfSaleUiCustomeraddrAssigncustomeraddrtoticketmenu-menu-obUiBPLocAssignToReceiptShippingContextMenuItem',
      permission: 'OBPOS_retail.assignToReceiptShippingAddress'
    });
    menuOptions.push({
      kind: 'OB.UI.BPLocAssignToReceiptInvoicingContextMenuItem',
      classes: 'obObposPointOfSaleUiCustomeraddrAssigncustomeraddrtoticketmenu-menu-obUiBPLocAssignToReceiptInvoicingContextMenuItem',
      permission: 'OBPOS_retail.assignToReceiptInvoicingAddress'
    });
    this.$.menu.setItems(menuOptions);
  }
});

enyo.kind({
  kind: 'OB.UI.Button',
  name: 'OB.OBPOSPointOfSale.UI.customeraddr.AssignAddrButton',
  classes: 'obObposPointOfSaleUiCustomeraddrAssignAddrButton',
  handlers: {
    onAddressChanged: 'addressChanged'
  },
  events: {
    onPressedButton: '',
    onChangeBusinessPartner: ''
  },
  setCustomerAddr: function (customer, customerAddr) {
    this.customer = customer;
    this.customerAddr = customerAddr;
    this.model.attributes.customerAddr.set('loaded', OB.I18N.formatDateISO(new Date()));
  },
  init: function (model) {
    this.inherited(arguments);
    var me = this;
    this.model = model;
    this.model.get('customerAddr').on('customerAddrSaved', function () {
      me.waterfall('onAddressChanged', {
        address: this
      });
    });
  }
});

enyo.kind({
  kind: 'OB.OBPOSPointOfSale.UI.customeraddr.AssignAddrButton',
  name: 'OB.OBPOSPointOfSale.UI.customeraddr.assigncustomeraddrtoticket',
  classes: 'obObposPointOfSaleUiCustomeraddrAssigncustomeraddrtoticket',
  tap: function () {
    this.customer.set('locId', this.customerAddr.get('id'));
    this.customer.set('locName', this.customerAddr.get('name'));
    this.customer.set('shipLocId', this.customerAddr.get('id'));
    this.customer.set('shipLocName', this.customerAddr.get('name'));
    this.customer.set('postalCode', this.customerAddr.get('postalCode'));
    this.customer.set('cityName', this.customerAddr.get('cityName'));
    this.customer.set('locationModel', this.customerAddr);
    this.customer.set('countryName', this.customerAddr.get('countryName'));
    this.model.get('order').trigger('change:bp', this.model.get('order'));
    this.doChangeBusinessPartner({
      businessPartner: this.customer,
      target: 'order'
    });
    this.doPressedButton();
  },
  addressChanged: function (inSender, inEvent) {
    var customerAddr = inEvent.address;
    if (customerAddr.get('isBillTo') && customerAddr.get('isShipTo')) {
      this.show();
    } else {
      this.hide();
    }
  },
  initComponents: function () {
    this.inherited(arguments);
    this.setContent(OB.I18N.getLabel('OBPOS_LblAssignAddress'));
  }
});

enyo.kind({
  kind: 'OB.OBPOSPointOfSale.UI.customeraddr.AssignAddrButton',
  name: 'OB.OBPOSPointOfSale.UI.customeraddr.assigncustomeraddrtoticketship',
  classes: 'obObposPointOfSaleUiCustomeraddrAssigncustomeraddrtoticketship',
  tap: function () {
    this.customer.set('shipLocId', this.customerAddr.get('id'));
    this.customer.set('shipLocName', this.customerAddr.get('name'));
    this.customer.set('postalCode', this.customerAddr.get('postalCode'));
    this.customer.set('cityName', this.customerAddr.get('cityName'));
    this.customer.set('locationModel', this.customerAddr);
    this.customer.set('countryName', this.customerAddr.get('countryName'));
    this.customer.get('locations').push(this.customerAddr.clone());
    this.model.get('order').trigger('change:bp', this.model.get('order'));
    this.doChangeBusinessPartner({
      businessPartner: this.customer,
      target: 'order'
    });
    this.doPressedButton();
  },
  addressChanged: function (inSender, inEvent) {
    var customerAddr = inEvent.address;
    if (customerAddr.get('onlyOneAddress') && customerAddr.get('isBillTo') && customerAddr.get('isShipTo')) {
      this.hide();
    } else if (customerAddr.get('isShipTo')) {
      this.show();
    } else {
      this.hide();
    }
  },
  initComponents: function () {
    this.inherited(arguments);
    this.setContent(OB.I18N.getLabel('OBPOS_LblAssignShipAddress'));
  }
});

enyo.kind({
  kind: 'OB.OBPOSPointOfSale.UI.customeraddr.AssignAddrButton',
  name: 'OB.OBPOSPointOfSale.UI.customeraddr.assigncustomeraddrtoticketinv',
  classes: 'obObposPointOfSaleUiCustomeraddrAssigncustomeraddrtoticketinv',
  tap: function () {
    this.customer.set('locId', this.customerAddr.get('id'));
    this.customer.set('locName', this.customerAddr.get('name'));
    this.customer.set('postalCode', this.customerAddr.get('postalCode'));
    this.customer.set('cityName', this.customerAddr.get('cityName'));
    this.customer.set('locationModel', this.customerAddr);
    this.customer.set('countryName', this.customerAddr.get('countryName'));
    this.model.get('order').trigger('change:bp', this.model.get('order'));
    this.doChangeBusinessPartner({
      businessPartner: this.customer,
      target: 'order'
    });
    this.doPressedButton();
  },
  addressChanged: function (inSender, inEvent) {
    var customerAddr = inEvent.address;
    if (customerAddr.get('onlyOneAddress') && customerAddr.get('isBillTo') && customerAddr.get('isShipTo')) {
      this.hide();
    } else if (customerAddr.get('isBillTo')) {
      this.show();
    } else {
      this.hide();
    }
  },
  initComponents: function () {
    this.inherited(arguments);
    this.setContent(OB.I18N.getLabel('OBPOS_LblAssignBillAddress'));
  }
});

enyo.kind({
  kind: 'OB.UI.Button',
  name: 'OB.OBPOSPointOfSale.UI.customeraddr.editticketcustomeraddr',
  classes: 'obObposPointOfSaleUiCustomeraddrEditticketcustomeraddr',
  events: {
    onShowPopup: '',
    onPressedButton: ''
  },
  setCustomerAddr: function (customer, customerAddr) {
    this.customer = customer;
    this.customerAddr = customerAddr;
    if (!OB.MobileApp.model.hasPermission('OBPOS_retail.editCustomerLocationButton', true)) {
      this.disabled = true;
      this.setAttribute("disabled", "disabled");
    } else {
      this.disabled = false;
      this.setAttribute("disabled", null);
    }
  },
  tap: function () {
    if (this.disabled === false) {
      this.doPressedButton();
      this.doShowPopup({
        popup: 'customerAddrCreateAndEdit',
        args: {
          businessPartner: this.customer,
          bPLocation: this.customerAddr,
          navigationPath: OB.UTIL.BusinessPartnerSelector.cloneAndPush(this.navigationPath, 'customerAddressView'),
          target: this.target
        }
      });
    }
  },
  init: function (model) {
    this.model = model;
  },
  initComponents: function () {
    this.setContent(OB.I18N.getLabel('OBPOS_LblEdit'));
  }
});

/*header of window body*/
enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.customeraddr.EditCustomerHeader',
  classes: 'obObposPointOfSaleUiCustomeraddrEditCustomerHeader',
  components: [{
    classes: 'obObposPointOfSaleUiCustomeraddrEditCustomerHeader-container1',
    components: [{
      classes: 'obObposPointOfSaleUiCustomeraddrEditCustomerHeader-container1-container1',
      components: [{
        kind: 'OB.OBPOSPointOfSale.UI.customeraddr.editticketcustomeraddr',
        classes: 'obObposPointOfSaleUiCustomeraddrEditCustomerHeader-container1-container1-obObposPointOfSaleUiCustomeraddrEditticketcustomeraddr'
      }]
    }, {
      classes: 'obObposPointOfSaleUiCustomeraddrEditCustomerHeader-container1-container2',
      components: [{
        kind: 'OB.OBPOSPointOfSale.UI.customeraddr.assigncustomeraddrtoticketmenu',
        classes: 'obObposPointOfSaleUiCustomeraddrEditCustomerHeader-container1-container2-obObposPointOfSaleUiCustomeraddrAssigncustomeraddrtoticketmenu'
      }]
    }, {
      classes: 'obObposPointOfSaleUiCustomeraddrEditCustomerHeader-container1-container3',
      components: [{
        kind: 'OB.OBPOSPointOfSale.UI.customeraddr.assigncustomeraddrtoticketship',
        classes: 'obObposPointOfSaleUiCustomeraddrEditCustomerHeader-container1-container3-obObposPointOfSaleUiCustomeraddrAssigncustomeraddrtoticketship'
      }]
    }, {
      classes: 'obObposPointOfSaleUiCustomeraddrEditCustomerHeader-container1-container4',
      components: [{
        kind: 'OB.OBPOSPointOfSale.UI.customeraddr.assigncustomeraddrtoticketinv',
        classes: 'obObposPointOfSaleUiCustomeraddrEditCustomerHeader-container1-container4-obObposPointOfSaleUiCustomeraddrAssigncustomeraddrtoticketinv'
      }]
    }, {
      classes: 'obObposPointOfSaleUiCustomeraddrEditCustomerHeader-container1-container5',
      components: [{
        kind: 'OB.OBPOSPointOfSale.UI.customeraddr.assigncustomeraddrtoticket',
        classes: 'obObposPointOfSaleUiCustomeraddrEditCustomerHeader-container1-container5-obObposPointOfSaleUiCustomeraddrAssigncustomeraddrtoticket'
      }]
    }]
  }]
});

enyo.kind({
  kind: 'OB.OBPOSPointOfSale.UI.customeraddr.edit_createcustomers',
  name: 'OB.OBPOSPointOfSale.UI.customeraddr.editcustomers_impl',
  classes: 'obObposPointOfSaleUiCustomeraddrEditcustomersImpl',
  windowHeader: 'OB.OBPOSPointOfSale.UI.customeraddr.EditCustomerHeader',
  newAttributes: [{
    kind: 'OB.UI.CustomerAddrTextProperty',
    name: 'customerAddrCustomerName',
    classes: 'obObposPointOfSaleUiCustomeraddrEditcustomersImpl-newAttributes-customerAddrCustomerName',
    modelProperty: 'customerName',
    i18nLabel: 'OBPOS_LblCustomer',
    readOnly: true
  }, {
    kind: 'OB.UI.CustomerAddrTextProperty',
    name: 'customerAddrName',
    classes: 'obObposPointOfSaleUiCustomeraddrEditcustomersImpl-newAttributes-customerAddrName',
    modelProperty: 'name',
    i18nLabel: 'OBPOS_LblAddress',
    readOnly: true
  }, {
    kind: 'OB.UI.CustomerAddrTextProperty',
    name: 'customerAddrPostalCode',
    classes: 'obObposPointOfSaleUiCustomeraddrEditcustomersImpl-newAttributes-customerAddrPostalCode',
    modelProperty: 'postalCode',
    i18nLabel: 'OBPOS_LblPostalCode',
    readOnly: true
  }, {
    kind: 'OB.UI.CustomerAddrTextProperty',
    name: 'customerAddrCity',
    classes: 'obObposPointOfSaleUiCustomeraddrEditcustomersImpl-newAttributes-customerAddrCity',
    modelProperty: 'cityName',
    i18nLabel: 'OBPOS_LblCity',
    readOnly: true
  }, {
    kind: 'OB.UI.CustomerAddrTextProperty',
    name: 'customerAddrCountry',
    classes: 'obObposPointOfSaleUiCustomeraddrEditcustomersImpl-newAttributes-customerAddrCountry',
    modelProperty: 'countryName',
    i18nLabel: 'OBPOS_LblCountry',
    readOnly: true
  }, {
    kind: 'OB.UI.CustomerAddrCheckProperty',
    name: 'customerAddrShip',
    classes: 'obObposPointOfSaleUiCustomeraddrEditcustomersImpl-newAttributes-customerAddrShip',
    modelProperty: 'isShipTo',
    i18nLabel: 'OBPOS_LblShipAddr',
    readOnly: true
  }, {
    kind: 'OB.UI.CustomerAddrCheckProperty',
    name: 'customerAddrBill',
    classes: 'obObposPointOfSaleUiCustomeraddrEditcustomersImpl-newAttributes-customerAddrBill',
    modelProperty: 'isBillTo',
    i18nLabel: 'OBPOS_LblBillAddr',
    readOnly: true
  }]
});