/*
 ************************************************************************************
 * Copyright (C) 2017-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, Backbone, _ */

enyo.kind({
  name: 'OBPOS.UI.ReceiptSelector',
  kind: 'OB.UI.ModalSelector',
  classes: 'modalSelector_receiptSelector u-popup-top-separation-medium',
  i18nHeader: 'OBPOS_OpenReceipt',
  events: {
    onChangeInitFilters: '',
    onOpenSelectedActive: '',
    onHideThisPopup: '',
    onShowPopup: '' // Do not remove this event will be used for other components or utility functions 
  },
  handlers: {
    onOpenSelected: 'openSelected',
    onActiveOpenSelectedBtn: 'activeOpenSelectedBtn'
  },
  body: {
    kind: 'OB.UI.ReceiptsList'
  },
  getFilterSelectorTableHeader: function () {
    return this.$.body.$.receiptsList.$.openreceiptslistitemprinter.$.theader.$.modalReceiptsScrollableHeader.$.filterSelector;
  },
  getAdvancedFilterBtn: function () {
    return this.$.body.$.receiptsList.$.openreceiptslistitemprinter.$.theader.$.modalReceiptsScrollableHeader.$.advancedFilterWindowButtonReceipts;
  },
  getAdvancedFilterDialog: function () {
    return 'OB_UI_ModalAdvancedFilterReceipts';
  },
  openSelected: function (inSender, inEvent) {
    OB.MobileApp.model.get('terminal').terminalType.ignoreRelatedreceipts = true;
    var selected = _.filter(this.$.body.$.receiptsList.receiptList.models, function (r) {
      return r.get('receiptSelected');
    });
    _.each(selected, function (receipt) {
      OB.UTIL.OrderSelectorUtils.checkOrderAndLoad(receipt, this.model.get('orderList'), this, undefined, true);
    }, this);
    this.doHideThisPopup();
  },
  activeOpenSelectedBtn: function (inSender, inEvent) {
    var selected = _.find(this.$.body.$.receiptsList.receiptList.models, function (r) {
      return r.get('receiptSelected');
    });
    this.waterfall('onOpenSelectedActive', {
      active: selected !== undefined
    });
  },
  executeOnShow: function () {
    if (!this.isInitialized()) {
      this.inherited(arguments);
      OB.MobileApp.model.get('terminal').terminalType.ignoreRelatedreceipts = false;
      var isMultiselect = this.args.multiselect === true;
      this.$.body.$.receiptsList.$.openreceiptslistitemprinter.multiselect = isMultiselect;
      this.$.body.$.receiptsList.$.openreceiptslistitemprinter.$.theader.$.modalReceiptsScrollableHeader.$.btnOpenSelected.setShowing(isMultiselect);
      if (this.args.advancedFilters) {
        var me = this;
        this.waterfall('onOpenSelectedActive', {
          active: false
        });
        setTimeout(function () {
          me.doChangeInitFilters({
            dialog: me.getAdvancedFilterDialog(),
            advanced: true,
            filters: me.args.advancedFilters.filters,
            orderby: me.args.advancedFilters.orderby,
            callback: function (result) {
              if (result) {
                me.$.body.$.receiptsList.searchAction(null, {
                  filters: result.filters,
                  orderby: result.orderby,
                  advanced: true
                });
              }
            }
          });
        }, 100);
      } else {
        this.getFilterSelectorTableHeader().clearFilter();
      }
    }
  }
});

enyo.kind({
  kind: 'OB.UI.ListSelectorLine',
  name: 'OB.UI.ReceiptSelectorRenderLine',
  events: {
    onActiveOpenSelectedBtn: ''
  },
  handlers: {
    onChangeCheck: 'changeCheck'
  },
  components: [{
    name: 'line',
    classes: 'obUiReceiptSelectorRenderLine',
    components: [{
      classes: 'btn-check-alt obUiReceiptSelectorRenderLine-iconCheck',
      name: 'iconCheck',
      showing: false
    }, {
      name: 'lineInfo',
      classes: 'obUiReceiptSelectorRenderLine-lineInfo lineInfo',
      components: [{
        classes: 'lineInfo-storeContainer storeContainer',
        components: [{
          name: 'store',
          classes: 'storeContainer-store store'
        }, {
          classes: 'u-clearBoth'
        }]
      }, {
        name: 'lineInfoContainerFirstRow',
        classes: 'lineInfoContainer lineInfo-lineInfoContainerFirstRow',
        components: [{
          classes: 'lineInfoContainer-Item1 lineInfoContainerFirstRow-date',
          name: 'date'
        }, {
          classes: 'lineInfoContainer-Item2 lineInfoContainerFirstRow-documentNo',
          name: 'documentNo'
        }, {
          classes: 'lineInfoContainer-Item3 lineInfoContainerFirstRow-amount',
          name: 'amount'
        }, {
          classes: 'u-clearBoth'
        }]
      }, {
        name: 'lineInfoContainerSecondRow',
        classes: 'lineInfoContainer lineInfo-lineInfoContainerSecondRow',
        components: [{
          classes: 'lineInfoContainer-Item1 lineInfoContainerSecondRow-time',
          name: 'time'
        }, {
          classes: 'lineInfoContainer-Item2 lineInfoContainerSecondRow-customer',
          name: 'customer'
        }, {
          classes: 'lineInfoContainer-Item3 lineInfoContainerSecondRow-ordertType',
          name: 'orderType'
        }, {
          classes: 'u-clearBoth'
        }]
      }]
    }]
  }],
  changeCheck: function (inSender, inEvent) {
    if (inEvent.id === this.model.get('id')) {
      if (this.model.get('receiptSelected')) {
        this.$.iconCheck.removeClass('btn-check active');
        this.$.iconCheck.addClass('btn-check-alt');
      } else {
        this.$.iconCheck.removeClass('btn-check-alt');
        this.$.iconCheck.addClass('btn-check active');
      }
      this.model.set('receiptSelected', !this.model.get('receiptSelected'), {
        silent: true
      });
      this.doActiveOpenSelectedBtn();
    }
  },
  canHidePopup: function () {
    return !this.model.get('multiselect');
  },
  create: function () {
    var orderDate, orderType, me = this;
    this.inherited(arguments);

    orderDate = new Date(OB.I18N.normalizeDate(this.model.get('creationDate')));
    orderType = OB.MobileApp.model.get('orderType').find(function (ot) {
      return ot.id === me.model.get('orderType');
    }).name;

    if (this.model.crossStoreInfo) {
      this.$.store.setContent(OB.UTIL.isCrossStoreReceipt(this.model) ? this.model.get('store') : OB.I18N.getLabel('OBPOS_LblThisStore') + ' (' + OB.MobileApp.model.get('terminal').organization$_identifier + ')');
    } else {
      this.$.store.setContent('');
    }

    this.$.date.setContent(OB.I18N.formatDate(orderDate));
    this.$.documentNo.setContent(this.model.get('documentNo'));
    this.$.amount.setContent(OB.I18N.formatCurrency(this.model.get('totalamount')));
    this.$.time.setContent(OB.I18N.formatHour(orderDate));
    this.$.customer.setContent(this.model.get('businessPartnerName'));
    if (me.model.get('iscancelled')) {
      this.$.orderType.setContent(OB.I18N.getLabel('OBPOS_Cancelled'));
      this.$.orderType.applyStyle('color', 'rgb(83, 83, 197)');
    } else {
      this.$.orderType.setContent(orderType);
      switch (this.model.get('orderType')) {
      case 'QT':
        this.$.orderType.applyStyle('color', 'rgb(248, 148, 29)');
        break;
      case 'LAY':
        this.$.orderType.applyStyle('color', 'lightblue');
        break;
      case 'RET':
        this.$.orderType.applyStyle('color', 'rgb(248, 148, 29)');
        break;
      default:
        this.$.orderType.applyStyle('color', 'rgb(108, 179, 63)');
        break;
      }
    }
    this.applyStyle('padding', '5px');
    if (this.model.get('multiselect')) {
      this.$.lineInfo.addClass('modal-order-selector-line-with-check');
      this.$.iconCheck.setShowing(true);
    }

    OB.UTIL.HookManager.executeHooks('OBPOS_RenderSelectorLine', {
      selectorLine: this
    }, function (args) {
      me.render();
    });
  }
});

enyo.kind({
  name: 'OB.UI.GenericReceiptsList',
  published: {
    filterModel: null,
    defaultFilters: null,
    nameOfReceiptsListItemPrinter: null
  },
  classes: 'genericBodyModalContainer row-fluid',
  handlers: {
    onClearFilterSelector: 'clearAction',
    onSearchAction: 'searchAction'
  },
  events: {
    onShowPopup: '',
    onChangePaidReceipt: '',
    onChangeCurrentOrder: '',
    onHideSelector: '',
    onShowSelector: ''
  },
  receiptList: null,
  components: [{
    classes: 'genericBodyModalContainer-container1',
    components: [{
      name: 'containerOfReceiptsListItemPrinter',
      classes: 'genericBodyModalContainer-container1-containerOfReceiptsListItemPrinter'
    }, {
      name: 'renderLoading',
      classes: 'listItemInformation genericBodyModalContainer-container1-renderLoading',
      showing: false,
      initComponents: function () {
        this.setContent(OB.I18N.getLabel('OBPOS_LblLoading'));
      }
    }]
  }],
  clearAction: function () {
    this.receiptList.reset();
    return true;
  },
  searchAction: function (inSender, inEvent) {
    var me = this;

    function errorCallback(tx, error) {
      if (!OB.MobileApp.model.get("connectedToERP")) {
        OB.UTIL.showConfirmation.display('Error', OB.I18N.getLabel('OBMOBC_MsgApplicationServerNotAvailable'));
        me.$.renderLoading.hide();
        return;
      }
      me.$.renderLoading.hide();
      me.receiptList.reset();
      me.$[me.getNameOfReceiptsListItemPrinter()].$.tempty.show();
      me.doHideSelector();
      var i, message, tokens, getProperty;

      getProperty = function (property) {
        return me.filterModel.getProperties().find(function (prop) {
          return prop.name === property || prop.sortName === property;
        });
      };

      // Generate a generic message if error is not defined
      if (OB.UTIL.isNullOrUndefined(error) || OB.UTIL.isNullOrUndefined(error.message)) {
        error = {
          message: OB.I18N.getLabel('OBMOBC_MsgApplicationServerNotAvailable')
        };
      }

      if (error.message.startsWith('###')) {
        tokens = error.message.split('###');
        message = [];
        for (i = 0; i < tokens.length; i++) {
          if (tokens[i] !== '') {
            if (tokens[i] === 'OBMOBC_FilteringNotAllowed' || tokens[i] === 'OBMOBC_SortingNotAllowed') {
              message.push({
                content: OB.I18N.getLabel(tokens[i]),
                classes: 'u-textalign-default',
                tag: 'li'
              });
            } else {
              var property = getProperty(tokens[i]);
              if (property) {
                message.push({
                  content: OB.I18N.getLabel(property.caption),
                  classes: 'u-textalign-default',
                  tag: 'li'
                });
              }
            }
          }
        }
      } else {
        message = error.message;
      }

      OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBMOBC_Error'), message, null, {
        onHideFunction: function () {
          me.doShowSelector();
        }
      });
    }

    function successCallback(data, criteria) {
      me.$.renderLoading.hide();
      me.actionPrePrint(data, criteria);
      if (data && data.length > 0) {
        if (me.$.openreceiptslistitemprinter && me.$.openreceiptslistitemprinter.multiselect) {
          _.each(data.models, function (m) {
            m.set('multiselect', true);
            m.set('receiptSelected', false);
          });
        }
        me.receiptList.reset(data.models);
        me.$[me.getNameOfReceiptsListItemPrinter()].$.tbody.show();
      } else {
        me.receiptList.reset();
        me.$[me.getNameOfReceiptsListItemPrinter()].$.tempty.show();
      }
    }
    this.$[this.getNameOfReceiptsListItemPrinter()].$.tempty.hide();
    this.$[this.getNameOfReceiptsListItemPrinter()].$.tbody.hide();
    this.$[this.getNameOfReceiptsListItemPrinter()].$.tlimit.hide();
    this.$.renderLoading.show();

    var criteria = {};

    if (inEvent.orderby) {
      criteria._orderByProperties = [{
        property: inEvent.orderby.sortName ? inEvent.orderby.sortName : inEvent.orderby.name,
        sorting: inEvent.orderby.direction
      }];
    } else if (inEvent.orderByClause) {
      criteria._orderByClause = inEvent.orderByClause;
    } else {
      criteria._orderByClause = 'orderDateFrom desc, documentNo desc';
    }

    criteria.forceRemote = true;

    if (OB.MobileApp.model.hasPermission("OBPOS_orderLimit", true)) {
      criteria._limit = OB.DEC.abs(OB.MobileApp.model.hasPermission("OBPOS_orderLimit", true));
    }

    criteria.remoteFilters = [];

    inEvent.filters.forEach(function (flt) {
      var fullFlt = _.find(me.filterModel.getProperties(), function (col) {
        return col.column === flt.column;
      });
      if (flt.value) {
        if (flt.hqlFilter) {
          criteria.remoteFilters.push({
            value: flt.hqlFilter,
            columns: [fullFlt.name],
            operator: OB.Dal.FILTER,
            params: [flt.value]
          });
        } else {
          criteria.remoteFilters.push({
            value: flt.value,
            columns: [fullFlt.name],
            operator: flt.operator || OB.Dal.STARTSWITH,
            isId: flt.column === 'orderType' || flt.isId
          });
        }
        if (flt.column === 'orderType' && flt.value === 'QT') {
          //When filtering by quotations, use the specific documentType filter
          criteria.remoteFilters.push({
            value: OB.MobileApp.model.get('terminal').terminalType.documentTypeForQuotations,
            columns: ['documentTypeId'],
            operator: '=',
            isId: true
          });
        }
      }
    });

    if (!OB.UTIL.isNullOrUndefined(this.defaultFilters)) {
      this.defaultFilters.forEach(function (flt) {
        criteria.remoteFilters.push(flt);
      });
    }

    OB.Dal.find(this.filterModel, criteria, function (data) {
      if (data) {
        successCallback(data, criteria);
      } else {
        errorCallback();
      }
    }, errorCallback);

  },
  init: function (model) {
    this.model = model;
    this.receiptList = new Backbone.Collection();
    this.$[this.getNameOfReceiptsListItemPrinter()].setCollection(this.receiptList);
  },
  actionPrePrint: function (data) {
    data.crossStoreInfo = false;
    if (data && data.length > 0) {
      _.each(data.models, function (model) {
        if (OB.UTIL.isCrossStoreReceipt(model)) {
          data.crossStoreInfo = true;
          return;
        }
      }, this);

      _.each(data.models, function (model) {
        model.crossStoreInfo = data.crossStoreInfo;
      }, this);
    }
  }
});

enyo.kind({
  name: 'OB.UI.ReceiptsForVerifiedReturnsList',
  kind: 'OB.UI.GenericReceiptsList',
  initComponents: function () {
    this.inherited(arguments);
    this.setFilterModel(OB.Model.VReturnsFilter);
    this.setNameOfReceiptsListItemPrinter('verifiedReturnsReceiptsListItemPrinter');
    this.$.containerOfReceiptsListItemPrinter.createComponent({
      name: 'verifiedReturnsReceiptsListItemPrinter',
      kind: 'OB.UI.ScrollableTable',
      scrollAreaMaxHeight: '350px',
      renderHeader: null,
      renderLine: 'OB.UI.ReceiptSelectorRenderLine',
      renderEmpty: 'OB.UI.RenderEmpty'
    }, {
      // needed to fix the owner so it is not containerOfReceiptsListItemPrinter but ReceiptsForVerifiedReturnsList
      // so can be accessed navigating from the parent through the components
      owner: this
    });
    this.$[this.getNameOfReceiptsListItemPrinter()].renderHeader = 'OB.UI.ModalVerifiedReturnsScrollableHeader';
  },
  init: function (model) {
    var me = this,
        process = new OB.DS.Process('org.openbravo.retail.posterminal.PaidReceipts'),
        receiptOrganization = null;
    this.model = model;
    this.inherited(arguments);
    this.receiptList.on('click', function (model) {
      function loadOrder(model) {
        OB.UTIL.showLoading(true);
        process.exec({
          orderid: model.get('id'),
          crossStore: OB.UTIL.isCrossStoreReceipt(model) ? model.get('organization') : null
        }, function (data) {
          if (data && data[0]) {
            if (me.model.get('leftColumnViewManager').isMultiOrder()) {
              if (me.model.get('multiorders')) {
                me.model.get('multiorders').resetValues();
              }
              me.model.get('leftColumnViewManager').setOrderMode();
            }
            if (data[0].recordInImportEntry) {
              OB.UTIL.showLoading(false);
              OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBMOBC_Error'), OB.I18N.getLabel('OBPOS_ReceiptNotSynced', [data[0].documentNo]));
            } else {
              OB.UTIL.HookManager.executeHooks('OBRETUR_ReturnFromOrig', {
                order: data[0],
                context: me,
                params: me.parent.parent.params
              }, function (args) {
                if (!args.cancelOperation) {
                  me.model.get('orderList').newPaidReceipt(data[0], function (order) {
                    me.doChangePaidReceipt({
                      newPaidReceipt: order
                    });

                  });
                }
              });
            }
          } else {
            OB.UTIL.showError(OB.I18N.getLabel('OBMOBC_Error'));
          }
        });
        return true;
      }
      receiptOrganization = OB.MobileApp.model.orderList.current.has('originalOrganization') ? 'originalOrganization' : 'organization';
      if (OB.MobileApp.model.orderList.current.get(receiptOrganization) !== model.get('organization') && OB.MobileApp.model.orderList.current.get('lines').length > 0) {
        OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_LblCrossStoreReturn'), OB.I18N.getLabel('OBPOS_SameStoreReceipt'), [{
          label: OB.I18N.getLabel('OBMOBC_LblOk')
        }]);
      } else if (model.crossStoreInfo && OB.UTIL.isCrossStoreReceipt(model)) {
        OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_LblCrossStoreReturn'), OB.I18N.getLabel('OBPOS_LblCrossStoreMessage', [model.get('documentNo'), model.get('store')]), [{
          label: OB.I18N.getLabel('OBMOBC_Continue'),
          isConfirmButton: true,
          action: function () {
            OB.MobileApp.model.orderList.checkForDuplicateReceipts(model, loadOrder, undefined, undefined, true);
            return true;
          }
        }, {
          label: OB.I18N.getLabel('OBMOBC_LblCancel'),
          action: function () {
            OB.POS.navigate('retail.pointofsale');
          }
        }]);
      } else {
        if (OB.MobileApp.model.orderList.current.get(receiptOrganization) !== model.get('organization') && OB.MobileApp.model.orderList.current.get('lines').length === 0) {
          OB.MobileApp.model.orderList.current.deleteOrder();
        }
        OB.MobileApp.model.orderList.checkForDuplicateReceipts(model, loadOrder, undefined, undefined, true);
        return true;
      }
    }, this);

    this.setDefaultFilters([{
      value: 'verifiedReturns',
      columns: ['orderType']
    }]);
  }
});

enyo.kind({
  name: 'OB.UI.ReceiptsList',
  kind: 'OB.UI.GenericReceiptsList',
  initComponents: function () {
    this.inherited(arguments);
    this.setFilterModel(OB.Model.OrderFilter);
    this.setNameOfReceiptsListItemPrinter('openreceiptslistitemprinter');
    this.$.containerOfReceiptsListItemPrinter.createComponent({
      name: 'openreceiptslistitemprinter',
      kind: 'OB.UI.ScrollableTable',
      scrollAreaClasses: 'scrollArea scrollArea_vertical openreceiptslistitemprinter',
      renderHeader: null,
      renderLine: 'OB.UI.ReceiptSelectorRenderLine',
      renderEmpty: 'OB.UI.RenderEmpty'
    }, {
      // needed to fix the owner so it is not containerOfReceiptsListItemPrinter but ReceiptsList
      // so can be accessed navigating from the parent through the components
      owner: this
    });
    this.$[this.getNameOfReceiptsListItemPrinter()].renderHeader = 'OB.UI.ModalReceiptsScrollableHeader';
  },
  init: function (model) {
    var me = this;
    this.model = model;
    this.inherited(arguments);
    this.receiptList.on('click', function (model) {
      if (!this.$.openreceiptslistitemprinter.multiselect) {
        if (model.crossStoreInfo && OB.UTIL.isCrossStoreReceipt(model)) {
          OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_LblCrossStorePayment'), OB.I18N.getLabel('OBPOS_LblCrossStoreMessage', [model.get('documentNo'), model.get('store')]) + ". " + OB.I18N.getLabel('OBPOS_LblCrossStoreDelivery'), [{
            label: OB.I18N.getLabel('OBMOBC_Continue'),
            isConfirmButton: true,
            action: function () {
              OB.UTIL.OrderSelectorUtils.checkOrderAndLoad(model, me.model.get('orderList'), me, undefined, 'orderSelector');
            }
          }, {
            label: OB.I18N.getLabel('OBMOBC_LblCancel')
          }]);
        } else {
          OB.UTIL.OrderSelectorUtils.checkOrderAndLoad(model, me.model.get('orderList'), me, undefined, 'orderSelector');
        }
      } else {
        me.waterfall('onChangeCheck', {
          id: model.get('id')
        });
      }
    }, this);
  }
});

enyo.kind({
  kind: 'OB.UI.SmallButton',
  name: 'OBPOS.UI.ButtonReceiptSelectorOpenSelected',
  style: 'width: 170px; margin: 0px 9px 8px 0px;',
  classes: 'btnlink-green btnlink btnlink-small',
  i18nLabel: 'OBPOS_OpenReceiptBtnOpenSelected',
  events: {
    onOpenSelected: ''
  },
  handlers: {
    onOpenSelectedActive: 'openSelectedActive'
  },
  openSelectedActive: function (inSender, inEvent) {
    this.setDisabled(!inEvent.active);
  },
  tap: function () {
    this.doOpenSelected();
  }
});

enyo.kind({
  name: 'OB.UI.ModalReceiptsScrollableHeader',
  kind: 'OB.UI.ScrollableTableHeader',
  filterModel: OB.Model.OrderFilter,
  events: {
    onSearchAction: ''
  },
  components: [{
    style: 'padding: 10px;',
    kind: 'OB.UI.FilterSelectorTableHeader',
    name: 'filterSelector'
  }, {
    style: 'padding: 10px;',
    components: [{
      style: 'display: table; width: 100%;',
      components: [{
        style: 'display: table-cell; text-align: center; ',
        components: [{
          kind: 'OBPOS.UI.AdvancedFilterWindowButtonReceipts'
        }, {
          kind: 'OBPOS.UI.ButtonReceiptSelectorOpenSelected',
          name: 'btnOpenSelected'
        }]
      }]
    }]
  }],
  initComponents: function () {
    this.filters = this.filterModel.getFilterPropertiesWithSelectorPreference();
    this.inherited(arguments);
    this.$.filterSelector.$.entityFilterText.skipAutoFilterPref = true;
  }
});

enyo.kind({
  name: 'OB.UI.ModalVerifiedReturnsScrollableHeader',
  kind: 'OB.UI.ScrollableTableHeader',
  filterModel: OB.Model.VReturnsFilter,
  events: {
    onSearchAction: ''
  },
  components: [{
    style: 'padding: 10px;',
    kind: 'OB.UI.FilterSelectorTableHeader',
    name: 'filterSelector'
  }, {
    style: 'padding: 10px;',
    components: [{
      style: 'display: table; width: 100%;',
      components: [{
        style: 'display: table-cell; text-align: center; ',
        components: [{
          kind: 'OBPOS.UI.AdvancedFilterWindowButtonVerifiedReturns'
        }]
      }]
    }]
  }],
  initComponents: function () {
    this.filters = this.filterModel.getFilterPropertiesWithSelectorPreference();
    this.inherited(arguments);
    this.$.filterSelector.$.entityFilterText.skipAutoFilterPref = true;
  }
});

enyo.kind({
  kind: 'OB.UI.ModalAdvancedFilters',
  name: 'OB.UI.ModalAdvancedFilterReceipts',
  model: OB.Model.OrderFilter,
  initComponents: function () {
    this.inherited(arguments);
    OB.UTIL.hideStoreFilter(OB.Model.OrderFilter.getProperties());
    this.setFilters(OB.Model.OrderFilter.getProperties());
  }
});

enyo.kind({
  kind: 'OB.UI.ModalAdvancedFilters',
  name: 'OB.UI.ModalAdvancedFilterVerifiedReturns',
  model: OB.Model.VReturnsFilter,
  initComponents: function () {
    this.inherited(arguments);
    OB.UTIL.hideStoreFilter(OB.Model.VReturnsFilter.getProperties());
    this.setFilters(OB.Model.VReturnsFilter.getProperties());
  }
});

enyo.kind({
  kind: 'OB.UI.ButtonAdvancedFilter',
  name: 'OBPOS.UI.AdvancedFilterWindowButtonReceipts',
  dialog: 'OB_UI_ModalAdvancedFilterReceipts'
});

enyo.kind({
  kind: 'OB.UI.ButtonAdvancedFilter',
  name: 'OBPOS.UI.AdvancedFilterWindowButtonVerifiedReturns',
  dialog: 'modalAdvancedFilterVerifiedReturns'
});