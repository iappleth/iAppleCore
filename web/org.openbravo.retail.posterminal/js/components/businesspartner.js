/*
 ************************************************************************************
 * Copyright (C) 2012-2016 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, Backbone, OB, _ */


enyo.kind({
  kind: 'OB.UI.SmallButton',
  name: 'OB.UI.BusinessPartner',
  classes: 'btnlink-gray',
  style: 'float: left; text-overflow:ellipsis; white-space: nowrap; overflow: hidden;',
  published: {
    order: null
  },
  events: {
    onShowPopup: ''
  },
  handlers: {
    onBPSelectionDisabled: 'buttonDisabled'
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
    var qty = 0;
    enyo.forEach(this.order.get('lines').models, function (l) {
      if (l.get('originalOrderLineId')) {
        qty = qty + 1;
        return;
      }
    });
    if (qty !== 0) {
      OB.UTIL.showWarning(OB.I18N.getLabel('OBPOS_Cannot_Change_BPartner'));
      return;
    }

    if (!this.disabled) {
      this.doShowPopup({
        popup: 'modalcustomer',
        args: {
          target: 'order'
        }
      });
    }
  },
  initComponents: function () {
    return this;
  },
  renderCustomer: function (newCustomer) {
    this.setContent(newCustomer);
  },
  orderChanged: function (oldValue) {
    if (this.order.get('bp')) {
      this.renderCustomer(this.order.get('bp').get('_identifier'));
    } else {
      this.renderCustomer('');
    }

    this.order.on('change:bp', function (model) {
      if (model.get('bp')) {
        if (OB.MobileApp.model.hasPermission('OBPOS_receipt.invoice')) {
          if (OB.MobileApp.model.hasPermission('OBPOS_retail.restricttaxidinvoice', true)) {
            if (!model.get('bp').get('taxID')) {
              if (OB.MobileApp.model.get('terminal').terminalType.generateInvoice) {
                OB.UTIL.showError(OB.I18N.getLabel('OBPOS_BP_No_Taxid'));
              } else {
                OB.UTIL.showWarning(OB.I18N.getLabel('OBPOS_BP_No_Taxid'));
              }
              model.set('generateInvoice', false);
            } else {
              model.set('generateInvoice', OB.MobileApp.model.get('terminal').terminalType.generateInvoice);
            }
          }
        } else {
          model.set('generateInvoice', false);
        }
        this.renderCustomer(model.get('bp').get('_identifier'));
      } else {
        this.renderCustomer('');
      }
    }, this);
  }
});

/*header of scrollable table*/
enyo.kind({
  kind: 'OB.UI.Button',
  name: 'OB.UI.NewCustomerWindowButton',
  events: {
    onChangeSubWindow: '',
    onHideThisPopup: ''
  },
  disabled: false,
  style: 'width: 170px; margin: 0px 5px 8px 19px;',
  classes: 'btnlink-yellow btnlink btnlink-small',
  i18nLabel: 'OBPOS_LblNewCustomer',
  handlers: {
    onSetModel: 'setModel',
    onNewBPDisabled: 'doDisableNewBP'
  },
  setModel: function (inSender, inEvent) {
    this.model = inEvent.model;
  },
  doDisableNewBP: function (inSender, inEvent) {
    this.putDisabled(inEvent.status);
  },
  tap: function (model) {
    if (this.disabled) {
      return true;
    }
    this.doHideThisPopup();
    this.doChangeSubWindow({
      newWindow: {
        name: 'customerCreateAndEdit',
        params: {
          navigateOnClose: 'mainSubWindow'
        }
      }
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
  }
});

enyo.kind({
  kind: 'OB.UI.Button',
  name: 'OB.UI.AdvancedFilterWindowButton',
  style: 'margin: 0px 0px 8px 5px;',
  classes: 'btnlink-yellow btnlink btnlink-small',
  i18nLabel: 'OBPOS_LblAdvancedFilter',
  disabled: false,
  handlers: {
    onNewBPDisabled: 'doDisableNewBP'
  },
  doDisableNewBP: function (inSender, inEvent) {
    this.putDisabled(inEvent.status);
  },
  events: {
    onShowPopup: '',
    onFiltered: ''
  },
  tap: function () {
    if (this.disabled) {
      return true;
    }
    var me = this;
    this.doShowPopup({
      popup: 'modalAdvancedFilterBP',
      args: {
        callback: function (result) {
          if (result) {
            me.doFiltered({
              filters: result.filters,
              orderby: result.orderby,
              advanced: true
            });
          }
        }
      }
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
  initComponents: function () {
    this.inherited(arguments);
    this.putDisabled(!OB.MobileApp.model.hasPermission('OBPOS_retail.customer_advanced_filters', true));
  }
});

enyo.kind({
  name: 'OB.UI.ModalBpScrollableHeader',
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
          style: 'width: 100%;',
          name: 'advancedFilterInfo',
          showing: false,
          initComponents: function () {
            this.setContent(OB.I18N.getLabel('OBPOS_AdvancedFiltersApplied'));
          }
        }, {
          style: 'width: 100%;',
          name: 'filterInputs',
          components: [{
            style: 'display: table-cell; width: 40%;',
            name: 'customerFilterColumnContainer',
            components: [{
              kind: 'OB.UI.List',
              name: 'customerFilterColumn',
              classes: 'combo',
              style: 'width: 95%',
              handlers: {
                onchange: 'changeColumn'
              },
              renderLine: enyo.kind({
                kind: 'enyo.Option',
                initComponents: function () {
                  this.inherited(arguments);
                  this.setValue(this.model.get('id'));
                  this.setContent(this.model.get('name'));
                }
              }),
              renderEmpty: 'enyo.Control',
              changeColumn: function () {
                this.owner.doClearAction();
              },
              initComponents: function () {
                var columns = [];
                _.each(OB.Model.BPartnerFilter.getProperties(), function (prop) {
                  if (prop.filter) {
                    columns.push({
                      id: prop.column,
                      name: OB.I18N.getLabel(prop.caption)
                    });
                  }
                });
                this.setCollection(new Backbone.Collection());
                this.getCollection().reset(columns);
              }
            }]
          }, {
            style: 'display: table-cell; width: 60%;',
            name: 'customerSearchContainer',
            components: [{
              kind: 'OB.UI.SearchInputAutoFilter',
              name: 'customerFilterText',
              style: 'width: 100%'
            }]
          }]
        }]
      }, {
        style: 'display: table-cell;',
        components: [{
          kind: 'OB.UI.SmallButton',
          classes: 'btnlink-yellow btn-icon-small btn-icon-search',
          style: 'width: 40px; margin: 0px 5px 8px 19px;',
          ontap: 'searchAction'
        }]
      }, {
        style: 'display: table-cell;',
        components: [{
          kind: 'OB.UI.SmallButton',
          name: 'customerSearchBtn',
          classes: 'btnlink-yellow btn-icon-small btn-icon-search',
          style: 'width: 40px; margin: 0px 0px 8px 5px;',
          ontap: 'searchAction',
          putDisabled: function (status) {
            if (status === false) {
              this.setDisabled(false);
              this.removeClass('disabled');
              this.disabled = false;
              return;
            } else {
              this.setDisabled(true);
              this.addClass('disabled');
              this.disabled = true;
            }
          }
        }]
      }]
    }]
  }, {
    style: 'padding: 10px;',
    showing: true,
    handlers: {
      onSetShow: 'setShow'
    },
    setShow: function (inSender, inEvent) {
      this.setShowing(inEvent.visibility);
    },
    components: [{
      style: 'display: table;',
      components: [{
        style: 'display: table-cell;',
        components: [{
          kind: 'OB.UI.NewCustomerWindowButton',
          name: 'newAction'
        }]
      }, {
        style: 'display: table-cell;',
        components: [{
          kind: 'OB.UI.AdvancedFilterWindowButton'
        }]
      }]
    }]
  }],
  clearAction: function () {
    this.$.customerFilterText.setValue('');
    this.doClearAction();
  },
  searchAction: function (inSender, inEvent) {
    if (!inEvent.filters) {
      inEvent.filters = [{
        column: this.$.customerFilterColumn.getValue(),
        text: this.$.customerFilterText.getValue()
      }];
      inEvent.advanced = false;
    }
    this.doSearchAction({
      filters: inEvent.filters,
      orderby: inEvent.orderby,
      advanced: inEvent.advanced
    });
    return true;
  }
});

enyo.kind({
  kind: 'OB.UI.ListContextMenuItem',
  name: 'OB.UI.BPDetailsContextMenuItem',
  i18NLabel: 'OBPOS_BPViewDetails',
  selectItem: function (bpartner) {
    bpartner.set('ignoreSetBP', true, {
      silent: true
    });
    OB.Dal.get(OB.Model.BusinessPartner, bpartner.get('bpartnerId'), function (bp) {
      OB.MobileApp.view.$.containerWindow.getRoot().model.attributes.subWindowManager.set('currentWindow', {
        name: 'customerView',
        params: {
          businessPartner: bp,
          navigateOnClose: 'mainSubWindow'
        }
      });
    });
    return true;
  },
  create: function () {
    this.inherited(arguments);
    this.setContent(OB.I18N.getLabel(this.i18NLabel));
  }
});

enyo.kind({
  kind: 'OB.UI.ListContextMenuItem',
  name: 'OB.UI.BPEditContextMenuItem',
  i18NLabel: 'OBPOS_BPEdit',
  selectItem: function (bpartner) {
    bpartner.set('ignoreSetBP', true, {
      silent: true
    });
    OB.Dal.get(OB.Model.BusinessPartner, bpartner.get('bpartnerId'), function (bp) {
      OB.MobileApp.view.$.containerWindow.getRoot().model.attributes.subWindowManager.set('currentWindow', {
        name: 'customerCreateAndEdit',
        params: {
          businessPartner: bp,
          navigateOnClose: 'mainSubWindow'
        }
      });
    });
    return true;
  },
  create: function () {
    this.inherited(arguments);
    this.setContent(OB.I18N.getLabel(this.i18NLabel));
  }
});

enyo.kind({
  kind: 'OB.UI.ListContextMenu',
  name: 'OB.UI.BusinessPartnerContextMenu',
  initComponents: function () {
    this.inherited(arguments);
    var menuOptions = [],
        extraOptions = OB.MobileApp.model.get('extraBPContextMenuOptions') || [];

    menuOptions.push({
      kind: 'OB.UI.BPDetailsContextMenuItem',
      permission: 'OBPOS_receipt.customers'
    }, {
      kind: 'OB.UI.BPEditContextMenuItem',
      permission: 'OBPOS_retail.editCustomers'
    });

    menuOptions = menuOptions.concat(extraOptions);
    this.$.menu.setItems(menuOptions);
  }
});

/*items of collection*/
enyo.kind({
  name: 'OB.UI.ListBpsLine',
  kind: 'OB.UI.listItemButton',
  components: [{
    name: 'line',
    style: 'line-height: 23px; width: 100%',
    components: [{
      name: 'textInfo',
      style: 'float: left; ',
      components: [{
        style: 'display: inline-block;',
        name: 'identifier'
      }, {
        style: 'display: inline-block; color: #888888; padding-left:5px;',
        name: 'filter'
      }, {
        style: 'display: inline-block; font-weight: bold; color: red; padding-left:5px;',
        name: 'onHold'
      }, {
        style: 'clear: both;'
      }]
    }, {
      kind: 'OB.UI.BusinessPartnerContextMenu',
      name: 'btnContextMenu',
      style: 'float: right'
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
    this.$.identifier.setContent(this.model.get('_identifier'));
    this.$.filter.setContent(this.model.get('filter'));
    if (this.model.get('customerBlocking') && this.model.get('salesOrderBlocking')) {
      this.$.onHold.setContent('(' + OB.I18N.getLabel('OBPOS_OnHold') + ')');
    }
    var bPartner = this.owner.owner.owner.bPartner;
    if (bPartner && bPartner.get('id') === this.model.get('id')) {
      this.applyStyle('background-color', '#fbf6d1');
    }
    // Context menu
    if (this.$.btnContextMenu.$.menu.itemsCount === 0) {
      this.$.btnContextMenu.hide();
    } else {
      this.$.btnContextMenu.setModel(this.model);
    }
  }
});

/*scrollable table (body of modal)*/
enyo.kind({
  name: 'OB.UI.ListBps',
  classes: 'row-fluid',
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
          name: 'stBPAssignToReceipt',
          kind: 'OB.UI.ScrollableTable',
          scrollAreaMaxHeight: '350px',
          renderHeader: 'OB.UI.ModalBpScrollableHeader',
          renderLine: 'OB.UI.ListBpsLine',
          renderEmpty: 'OB.UI.RenderEmpty'
        }, {
          name: 'renderLoading',
          style: 'border-bottom: 1px solid #cccccc; padding: 20px; text-align: center; font-weight: bold; font-size: 30px; color: #cccccc',
          showing: false,
          initComponents: function () {
            this.setContent(OB.I18N.getLabel('OBPOS_LblLoading'));
          }
        }]
      }]
    }]
  }],
  clearAction: function (inSender, inEvent) {
    this.bpsList.reset();
    this.$.stBPAssignToReceipt.$.theader.$.modalBpScrollableHeader.$.advancedFilterInfo.setShowing(false);
    this.$.stBPAssignToReceipt.$.theader.$.modalBpScrollableHeader.$.filterInputs.setShowing(true);
    return true;
  },
  searchAction: function (inSender, inEvent) {
    var me = this;

    if (OB.MobileApp.model.hasPermission('OBPOS_retail.editCustomers')) {
      this.$.stBPAssignToReceipt.$.theader.$.modalBpScrollableHeader.$.newAction.setDisabled(false);
    }

    this.$.stBPAssignToReceipt.$.theader.$.modalBpScrollableHeader.$.advancedFilterInfo.setShowing(inEvent.advanced);
    this.$.stBPAssignToReceipt.$.theader.$.modalBpScrollableHeader.$.filterInputs.setShowing(!inEvent.advanced);
    this.$.stBPAssignToReceipt.$.theader.$.modalBpScrollableHeader.$.customerSearchBtn.putDisabled(inEvent.advanced);
    this.$.stBPAssignToReceipt.$.tempty.hide();
    this.$.stBPAssignToReceipt.$.tbody.hide();
    this.$.stBPAssignToReceipt.$.tlimit.hide();
    this.$.renderLoading.show();

    function hasLocationInFilter() {
      return _.some(inEvent.filters, function (flt) {
        var column = _.find(OB.Model.BPartnerFilter.getProperties(), function (col) {
          return col.column === flt.column;
        });
        return column && column.location;
      });
    }

    function errorCallback(tx, error) {
      OB.UTIL.showError("OBDAL error: " + error);
    }

    function successCallbackBPs(dataBps) {
      me.$.renderLoading.hide();
      if (dataBps && dataBps.length > 0) {
        _.each(dataBps.models, function (bp) {
          var filter = '';
          if (hasLocationInFilter() || !OB.MobileApp.model.hasPermission('OBPOS_remote.customer', true)) {
            filter = ' / ' + bp.get('locName');
          }
          _.each(inEvent.filters, function (flt, index) {
            if (flt.column !== 'bp.name' && flt.column !== 'loc.name') {
              var column = _.find(OB.Model.BPartnerFilter.getProperties(), function (col) {
                return col.column === flt.column;
              });
              if (column) {
                filter += ' / ' + (bp.get(column.name) ? bp.get(column.name) : '');
              }
            }
          });
          bp.set('_identifier', bp.get('bpName'));
          bp.set('filter', filter);
        });
        me.bpsList.reset(dataBps.models);
        me.$.stBPAssignToReceipt.$.tbody.show();
      } else {
        me.bpsList.reset();
        me.$.stBPAssignToReceipt.$.tempty.show();
      }
    }

    if (OB.MobileApp.model.hasPermission('OBPOS_remote.customer', true)) {
      var criteria = {
        _orderByClause: ''
      };
      criteria.remoteFilters = [];
      _.each(inEvent.filters, function (flt) {
        var column = _.find(OB.Model.BPartnerFilter.getProperties(), function (col) {
          return col.column === flt.column;
        });
        if (column) {
          criteria.remoteFilters.push({
            columns: [column.name],
            operator: OB.Dal.CONTAINS,
            value: OB.UTIL.unAccent(flt.text),
            location: column.location
          });
        }
      });
      if (OB.MobileApp.model.hasPermission('OBPOS_customerLimit', true)) {
        criteria._limit = OB.DEC.abs(OB.MobileApp.model.hasPermission('OBPOS_customerLimit', true));
      }
      OB.Dal.find(OB.Model.BPartnerFilter, criteria, successCallbackBPs, errorCallback, this);
    } else {
      var index = 0,
          params = [],
          select = 'select ',
          orderby = ' order by ' + (inEvent.advanced && inEvent.orderby ? inEvent.orderby.column + ' ' + inEvent.orderby.direction : 'bp.name');

      _.each(OB.Model.BPartnerFilter.getProperties(), function (prop) {
        if (prop.column !== '_filter' && prop.column !== '_idx' && prop.column !== '_identifier') {
          if (index !== 0) {
            select += ', ';
          }
          if (prop.column === 'id') {
            select += (location ? 'loc.c_bpartner_location_id' : 'bp.c_bpartner_id') + ' as ' + prop.name;
          } else {
            if (!location && prop.location) {
              select += "'' as " + prop.name;
            } else {
              select += prop.column + ' as ' + prop.name;
            }
          }
          index++;
        }
      });
      select += ' from c_bpartner bp left join c_bpartner_location loc on bp.c_bpartner_id = loc.c_bpartner_id ';

      if (inEvent.advanced) {
        if (inEvent.filters.length > 0) {
          select += 'where ';
          _.each(inEvent.filters, function (flt, index) {
            if (index !== 0) {
              select += ' and ';
            }
            select += flt.column + ' like ? ';
            params.push('%' + OB.UTIL.unAccent(flt.text) + '%');
            if (!inEvent.advanced && flt.orderby) {
              orderby = ' order by ' + flt.column;
            }
          });
        }
      } else if (inEvent.filters.length > 0) {
        select += 'where bp._filter like ? or loc._filter like ?';
        var text = OB.UTIL.unAccent(inEvent.filters[0].text);
        params.push('%' + text + '%');
        params.push('%' + text + '%');
      }
      OB.Dal.query(OB.Model.BPartnerFilter, select + orderby, params, successCallbackBPs, errorCallback, null, null, OB.Model.BPartnerFilter.prototype.dataLimit);
    }

    return true;
  },
  bpsList: null,
  init: function (model) {
    this.bpsList = new Backbone.Collection();
    this.$.stBPAssignToReceipt.setCollection(this.bpsList);
    this.bpsList.on('click', function (model) {
      if (model.get('customerBlocking') && model.get('salesOrderBlocking')) {
        OB.UTIL.showError(OB.I18N.getLabel('OBPOS_BPartnerOnHold', [model.get('_identifier')]));
      } else if (!model.get('ignoreSetBP')) {
        var me = this;
        OB.Dal.get(OB.Model.BusinessPartner, model.get('bpartnerId'), function (bp) {
          me.doChangeBusinessPartner({
            businessPartner: bp,
            target: me.owner.owner.args.target
          });
        });
      }
    }, this);
  }
});

/*Modal definition*/
enyo.kind({
  name: 'OB.UI.ModalBusinessPartners',
  topPosition: '100px',
  kind: 'OB.UI.Modal',
  executeOnShow: function () {
    if (_.isUndefined(this.args.visibilityButtons)) {
      this.args.visibilityButtons = true;
    }
    this.waterfall('onSetShow', {
      visibility: this.args.visibilityButtons
    });
    this.bubble('onSetBusinessPartnerTarget', {
      target: this.args.target
    });
    this.$.body.$.listBps.$.stBPAssignToReceipt.$.theader.$.modalBpScrollableHeader.$.newAction.putDisabled(!OB.MobileApp.model.hasPermission('OBPOS_retail.editCustomers'));
    if (!OB.MobileApp.model.hasPermission('OBPOS_remote.customer', true)) {
      this.$.body.$.listBps.$.stBPAssignToReceipt.$.theader.$.modalBpScrollableHeader.$.customerFilterColumnContainer.setStyle('display: none');
      this.$.body.$.listBps.$.stBPAssignToReceipt.$.theader.$.modalBpScrollableHeader.$.customerSearchContainer.setStyle('display: table-cell; width: 425px;');
    }
    if (OB.MobileApp.model.hasPermission('OBPOS_retail.disableNewBPButton', true)) {
      this.$.body.$.listBps.$.stBPAssignToReceipt.$.theader.$.modalBpScrollableHeader.$.newAction.setDisabled(true);
    }
    if (this.args.businessPartner) {
      this.$.body.$.listBps.$.stBPAssignToReceipt.$.theader.$.modalBpScrollableHeader.searchAction();
      this.$.body.$.listBps.$.stBPAssignToReceipt.bPartner = this.args.businessPartner;
    } else {
      this.$.body.$.listBps.$.stBPAssignToReceipt.bPartner = null;
    }
    return true;
  },

  executeOnHide: function () {
    this.$.body.$.listBps.$.stBPAssignToReceipt.$.theader.$.modalBpScrollableHeader.clearAction();
  },
  i18nHeader: 'OBPOS_LblAssignCustomer',
  body: {
    kind: 'OB.UI.ListBps'
  },
  init: function (model) {
    this.model = model;
    this.waterfall('onSetModel', {
      model: this.model
    });
  }
});

/* Advanced Filter Modal definition */
enyo.kind({
  kind: 'OB.UI.SmallButton',
  name: 'OB.UI.AdvancedFilterBPClear',
  classes: 'btnlink-gray btnlink btnlink-small',
  events: {
    onClearAll: ''
  },
  tap: function () {
    this.doClearAll();
  },
  initComponents: function () {
    this.setContent(OB.I18N.getLabel('OBPOS_ClearAll'));
  }
});

enyo.kind({
  kind: 'OB.UI.SmallButton',
  name: 'OB.UI.AdvancedFilterBPApply',
  classes: 'btnlink-yellow btnlink btnlink-small',
  events: {
    onApplyFilters: ''
  },
  tap: function () {
    this.doApplyFilters();
  },
  isDefaultAction: true,
  initComponents: function () {
    this.setContent(OB.I18N.getLabel('OBPOS_applyFilters'));
  }
});

enyo.kind({
  name: 'OB.UI.AdvancedFilterBPTable',
  kind: 'Scroller',
  maxHeight: '400px',
  style: 'width: 100%; background-color: #fff; overflow: auto',

  initComponents: function () {
    this.inherited(arguments);
    this.filters = [];
  },

  setSortNone: function () {
    _.each(this.filters, function (flt) {
      var button = flt.owner.$['order' + flt.filter.name],
          buttonClasses = button.getClassAttribute().split(' ');
      button.removeClass(buttonClasses[buttonClasses.length - 1]);
      button.addClass('iconSortNone');
    });
  },

  addFilter: function (filter) {
    var filterLine = this.createComponent({
      filter: filter,
      style: 'width: 100%; clear:both; background-color: #fff; height: 32px; padding-top: 2px; overflow: hidden;',
      components: [{
        style: 'float: left; width: 30%;  background-color: #e2e2e2; height: 25px; padding-top: 6px; padding-right: 5px; text-align: right;font-size: 16px; color: black',
        name: 'label' + filter.name,
        content: OB.I18N.getLabel(filter.caption)
      }, {
        style: 'float: left; width: 65%; text-align: left; padding-left: 5px;',
        components: [{
          kind: 'enyo.Input',
          type: 'text',
          classes: 'input',
          name: 'input' + filter.name,
          style: 'float: left; width: 78%; padding: 0px;'
        }, {
          kind: 'OB.UI.SmallButton',
          name: 'order' + filter.name,
          classes: 'btnlink-white iconSortNone',
          style: 'float: left; margin-top: 1px',
          tap: function () {
            var buttonClasses = this.getClassAttribute().split(' '),
                buttonClass = buttonClasses[buttonClasses.length - 1];
            this.owner.setSortNone();
            this.addClass(buttonClass === 'iconSortAsc' ? 'iconSortDesc' : 'iconSortAsc');
          }
        }]
      }]
    });
    filterLine.render();
    this.filters.push(filterLine);
  },

  clearAll: function () {
    _.each(this.filters, function (flt) {
      flt.owner.$['input' + flt.filter.name].setValue('');
    });
  },

  applyFilters: function () {
    var result = {
      filters: [],
      orderby: null
    };
    _.each(this.filters, function (flt) {
      var text = flt.owner.$['input' + flt.filter.name].getValue(),
          orderClasses = flt.owner.$['order' + flt.filter.name].getClassAttribute().split(' '),
          orderClass = orderClasses[orderClasses.length - 1];
      text = text ? text.trim() : '';
      if (text) {
        result.filters.push({
          column: flt.filter.column,
          text: text
        });
      }
      if (orderClass !== 'iconSortNone') {
        result.orderby = {
          name: flt.filter.name,
          column: flt.filter.column,
          direction: orderClass === 'iconSortAsc' ? 'asc' : 'desc'
        };
      }
    });
    return result;
  }

});

enyo.kind({
  kind: 'OB.UI.Modal',
  name: 'OB.UI.ModalAdvancedFilterBP',
  topPosition: '125px',
  i18nHeader: 'OBPOS_LblAdvancedFilters',
  style: 'width: 400px',
  events: {
    onHideThisPopup: ''
  },
  handlers: {
    onClearAll: 'clearAll',
    onApplyFilters: 'applyFilters'
  },
  body: {
    components: [{
      style: 'height: 32px; color: black; font-size: 16px;',
      components: [{
        style: 'width: 50%; float: left; ',
        components: [{
          style: 'float: right; ',
          kind: 'OB.UI.AdvancedFilterBPClear',
          name: 'btnClear'
        }]
      }, {
        style: 'width: 50%; float: left;',
        components: [{
          kind: 'OB.UI.AdvancedFilterBPApply',
          name: 'btnApply'
        }]
      }]
    }, {
      style: 'height: 15px;'
    }, {
      kind: 'OB.UI.AdvancedFilterBPTable',
      name: 'filters'
    }]
  },

  clearAll: function () {
    this.$.body.$.filters.clearAll();
  },

  applyFilters: function () {
    this.filtersToApply = this.$.body.$.filters.applyFilters();
    this.doHideThisPopup();
  },

  initComponents: function () {
    this.inherited(arguments);
    _.each(OB.Model.BPartnerFilter.getProperties(), function (prop) {
      if (prop.filter) {
        this.$.body.$.filters.addFilter(prop);
      }
    }, this);
  },

  executeOnShow: function () {
    this.filtersToApply = null;
    return true;
  },

  executeOnHide: function () {
    if (this.args.callback) {
      this.args.callback(this.filtersToApply);
    }
  }

});