/*
 ************************************************************************************
 * Copyright (C) 2012-2015 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 *
 * Contributed by Qualian Technologies Pvt. Ltd.
 ************************************************************************************
 */

/*global enyo, Backbone */

enyo.kind({
  kind: 'OB.UI.SmallButton',
  name: 'OB.UI.BPLocation',
  classes: 'btnlink-gray',
  style: 'float: right; text-overflow:ellipsis; white-space: nowrap; overflow: hidden;',
  published: {
    order: null
  },
  events: {
    onShowPopup: ''
  },
  handlers: {
    onBPLocSelectionDisabled: 'buttonDisabled'
  },
  buttonDisabled: function (inSender, inEvent) {
    this.isEnabled = !inEvent.status;
    this.setDisabled(inEvent.status);
    if (!this.isEnabled) {
      this.removeClass('btnlink');
      this.addClass('btnbp');
    } else {
      this.removeClass('btnbp');
      this.addClass('btnlink');
    }
  },
  tap: function () {
    if (!this.disabled) {
      this.doShowPopup({
        popup: 'modalcustomeraddress'
      });
    }
  },
  initComponents: function () {},
  renderBPLocation: function (newLocation) {
    this.setContent(newLocation);
  },
  orderChanged: function (oldValue) {
    if (this.order.get('bp')) {
      this.renderBPLocation(this.order.get('bp').get('locName'));
    } else {
      this.renderBPLocation('');
    }

    this.order.on('change:bp', function (model) {
      if (model.get('bp')) {
        this.renderBPLocation(model.get('bp').get('locName'));
      } else {
        this.renderBPLocation('');
      }
    }, this);
  }
});

enyo.kind({
  kind: 'OB.UI.Button',
  name: 'OB.UI.NewCustomerAddressWindowButton',
  events: {
    onChangeSubWindow: '',
    onHideThisPopup: ''
  },
  disabled: false,
  style: 'width: 170px; margin: 0px 5px 8px 19px;',
  classes: 'btnlink-yellow btnlink btnlink-small',
  i18nLabel: 'OBPOS_LblNewCustomerAddress',
  handlers: {
    onSetModel: 'setModel',
    onNewBPLocDisabled: 'doDisableNewBPLoc'
  },
  setModel: function (inSender, inEvent) {
    this.model = inEvent.model;
  },
  doDisableNewBPLoc: function (inSender, inEvent) {
    this.putDisabled(inEvent.status);
  },
  tap: function (model) {
    if (this.disabled) {
      return true;
    }
    this.doHideThisPopup();
    var me = this;

    function errorCallback(tx, error) {
      OB.error(tx);
      OB.error(error);
    }

    function successCallbackBPs(dataBps) {
      me.doChangeSubWindow({
        newWindow: {
          name: 'customerAddrCreateAndEdit',
          params: {
            navigateOnClose: 'mainSubWindow',
            businessPartner: dataBps
          }
        }
      });
    }
    OB.Dal.get(OB.Model.BusinessPartner, this.model.get('order').get('bp').get('id'), successCallbackBPs, errorCallback);
  },
  putDisabled: function (status) {
    if (status === false) {
      this.disabled = false;
      this.setDisabled(false);
      this.removeClass('disabled');
      return;
    } else {
      this.disabled = true;
      this.setDisabled(true);
      this.addClass('disabled');
    }
  }
});

enyo.kind({
  kind: 'OB.UI.Button',
  name: 'OB.UI.SearchCustomerAddressWindowButton',
  style: 'width: 170px; margin: 0px 0px 8px 5px;',
  classes: 'btnlink-yellow btnlink btnlink-small',
  i18nLabel: 'OBPOS_LblEditAddress',
  disabled: false,
  handlers: {
    onSetModel: 'setModel',
    onNewBPLocDisabled: 'doDisableNewBPLoc'
  },
  doDisableNewBPLoc: function (inSender, inEvent) {
    this.putDisabled(inEvent.status);
  },
  setModel: function (inSender, inEvent) {
    this.model = inEvent.model;
  },
  events: {
    onHideThisPopup: ''
  },
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.doHideThisPopup();
    this.model.get('subWindowManager').set('currentWindow', {
      name: 'customerAddressSearch',
      params: {
        caller: 'mainSubWindow',
        bPartner: this.model.get('order').get('bp').get('id')
      }
    });
  },
  putDisabled: function (status) {
    if (status === false) {
      this.disabled = false;
      this.setDisabled(false);
      this.removeClass('disabled');
      return;
    } else {
      this.disabled = true;
      this.setDisabled(true);
      this.addClass('disabled');
    }
  },
  initComponents: function () {
    this.inherited(arguments);
    this.putDisabled(!OB.MobileApp.model.hasPermission('OBPOS_receipt.customers'));
  }
});

enyo.kind({
  name: 'OB.UI.ModalBpLocScrollableHeader',
  kind: 'OB.UI.ScrollableTableHeader',
  events: {
    onSearchAction: '',
    onClearAction: ''
  },
  handlers: {
    onSearchActionByKey: 'searchAction',
    onFiltered: 'searchAction'
  },
  components: [{
    style: 'padding: 10px;',
    components: [{
      style: 'display: table;',
      components: [{
        style: 'display: table-cell; width: 100%;',
        components: [{
          kind: 'OB.UI.SearchInputAutoFilter',
          name: 'bpsLocationSearchfilterText',
          style: 'width: 100%'
        }]
      }, {
        style: 'display: table-cell;',
        components: [{
          kind: 'OB.UI.SmallButton',
          classes: 'btnlink-gray btn-icon-small btn-icon-clear',
          style: 'width: 100px; margin: 0px 5px 8px 19px;',
          name: 'bpsLocationSearchClearButton',
          ontap: 'clearAction'
        }]
      }, {
        style: 'display: table-cell;',
        components: [{
          kind: 'OB.UI.SmallButton',
          classes: 'btnlink-yellow btn-icon-small btn-icon-search',
          style: 'width: 100px; margin: 0px 0px 8px 5px;',
          name: 'bpsLocationSearchButton',
          ontap: 'searchAction'
        }]
      }]
    }]
  }, {
    style: 'padding: 10px;',
    components: [{
      style: 'display: table;',
      components: [{
        style: 'display: table-cell;',
        components: [{
          kind: 'OB.UI.NewCustomerAddressWindowButton',
          name: 'newAction'
        }]
      }, {
        style: 'display: table-cell;',
        components: [{
          kind: 'OB.UI.SearchCustomerAddressWindowButton'
        }]
      }]
    }]
  }],
  clearAction: function () {
    this.$.bpsLocationSearchfilterText.setValue('');
    this.doSearchAction({
      locName: this.$.bpsLocationSearchfilterText.getValue()
    });
    return true;
  },
  searchAction: function () {
    this.doSearchAction({
      locName: this.$.bpsLocationSearchfilterText.getValue()
    });
    return true;
  }
});

/*items of collection*/
enyo.kind({
  name: 'OB.UI.ListBpsLocLine',
  kind: 'OB.UI.SelectButton',
  components: [{
    name: 'line',
    style: 'line-height: 30px;',
    components: [{
      name: 'identifier'
    }, {
      style: 'clear: both;'
    }]
  }],
  events: {
    onHideThisPopup: ''
  },
  tap: function () {
    this.inherited(arguments);
    this.doHideThisPopup();
  },
  create: function () {
    this.inherited(arguments);
    this.$.identifier.setContent(this.model.get('name'));
  }
});

/*scrollable table (body of modal)*/
enyo.kind({
  name: 'OB.UI.ListBpsLoc',
  classes: 'row-fluid',
  published: {
    bPartnerId: null
  },
  handlers: {
    onSearchAction: 'searchAction',
    onClearAction: 'clearAction'
  },
  events: {
    onChangeBusinessPartner: ''
  },
  components: [{
    classes: 'span12',
    components: [{
      style: 'border-bottom: 1px solid #cccccc;',
      classes: 'row-fluid',
      components: [{
        classes: 'span12',
        components: [{
          name: 'bpsloclistitemprinter',
          kind: 'OB.UI.ScrollableTable',
          scrollAreaMaxHeight: '400px',
          renderHeader: 'OB.UI.ModalBpLocScrollableHeader',
          renderLine: 'OB.UI.ListBpsLocLine',
          renderEmpty: 'OB.UI.RenderEmpty'
        }]
      }]
    }]
  }],
  clearAction: function (inSender, inEvent) {
    this.bpsList.reset();
    return true;
  },
  searchAction: function (inSender, inEvent) {
    var me = this,
        criteria = {},
        filter = inEvent.locName;

    function errorCallback(tx, error) {
      OB.UTIL.showError("OBDAL error: " + error);
    }

    function successCallbackBPsLoc(dataBps) {
      if (dataBps && dataBps.length > 0) {
        me.bpsList.reset(dataBps.models);
      } else {
        me.bpsList.reset();
      }
    }
    criteria.name = {
      operator: OB.Dal.CONTAINS,
      value: filter
    };
    criteria.bpartner = this.bPartnerId;
    if (OB.MobileApp.model.hasPermission('OBPOS_remote.customer', true)) {
      var filterIdentifier = {
        columns: ['_filter'],
        operator: 'startsWith',
        value: filter
      },
          bPartnerId = {
          columns: ['bpartner'],
          operator: 'equals',
          value: this.bPartnerId,
          isId: true
          };
      var remoteCriteria = [filterIdentifier, bPartnerId];
      criteria.remoteFilters = remoteCriteria;
    }
    OB.Dal.find(OB.Model.BPLocation, criteria, successCallbackBPsLoc, errorCallback);
    return true;
  },
  bpsList: null,
  init: function (model) {
    this.bpsList = new Backbone.Collection();
    this.$.bpsloclistitemprinter.setCollection(this.bpsList);
    this.bpsList.on('click', function (model) {
      var me = this;

      function errorCallback(tx, error) {
        OB.error(tx);
        OB.error(error);
      }

      function successCallbackBPs(dataBps) {
        dataBps.set('locationModel', model);
        dataBps.set('locId', model.get('id'));
        dataBps.set('locName', model.get('name'));
        dataBps.set('postalCode', model.get('postalCode'));
        dataBps.set('cityName', model.get('cityName'));
        dataBps.set('countryName', model.get('countryName'));
        me.doChangeBusinessPartner({
          businessPartner: dataBps
        });
      }
      OB.Dal.get(OB.Model.BusinessPartner, this.bPartnerId, successCallbackBPs, errorCallback);
    }, this);
  }
});

/*Modal definiton*/
enyo.kind({
  name: 'OB.UI.ModalBPLocation',
  topPosition: '125px',
  kind: 'OB.UI.Modal',
  executeOnShow: function () {
    this.$.body.$.listBpsLoc.setBPartnerId(this.model.get('order').get('bp').get('id'));
    this.$.body.$.listBpsLoc.$.bpsloclistitemprinter.$.theader.$.modalBpLocScrollableHeader.searchAction();
    this.$.body.$.listBpsLoc.$.bpsloclistitemprinter.$.theader.$.modalBpLocScrollableHeader.$.newAction.putDisabled(!OB.MobileApp.model.hasPermission('OBPOS_retail.editCustomers'));
    return true;
  },
  executeOnHide: function () {
    this.$.body.$.listBpsLoc.$.bpsloclistitemprinter.$.theader.$.modalBpLocScrollableHeader.$.bpsLocationSearchfilterText.setValue('');
  },
  i18nHeader: 'OBPOS_LblAssignCustomerAddress',
  body: {
    kind: 'OB.UI.ListBpsLoc'
  },
  init: function (model) {
    this.model = model;
    this.waterfall('onSetModel', {
      model: this.model
    });

  }
});