/*
 ************************************************************************************
 * Copyright (C) 2017-2018 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, Backbone, _ */

enyo.kind({
  name: 'OBPOS.UI.ReceiptSelector',
  kind: 'OB.UI.ModalSelector',
  topPosition: '70px',
  i18nHeader: 'OBPOS_OpenReceipt',
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
  executeOnShow: function () {
    if (!this.initialized) {
      this.inherited(arguments);
      this.getFilterSelectorTableHeader().clearFilter();
    }
  },
  init: function (model) {
    this.model = model;
  }
});

enyo.kind({
  kind: 'OB.UI.ListSelectorLine',
  name: 'OB.UI.ReceiptSelectorRenderLine',
  components: [{
    name: 'line',
    style: 'width: 100%',
    components: [{
      name: 'lineInfo',
      style: 'float: left; width: 100%; padding: 5px; ',
      components: [{
        style: 'padding-bottom: 3px',
        components: [{
          style: 'float: left; width: 100px;',
          name: 'date'
        }, {
          style: 'float: left; padding-left:5px;',
          name: 'documentNo'
        }, {
          style: 'float: right; padding-right:5px; width: 100px; text-align: right; font-weight: bold;',
          name: 'amount'
        }, {
          style: 'clear: both;'
        }]
      }, {
        components: [{
          style: 'float: left; width: 100px;',
          name: 'time'
        }, {
          style: 'float: left; padding-left:5px;',
          name: 'customer'
        }, {
          style: 'float: right; padding-right:5px; width: 100px; text-align: right; font-weight: bold;',
          name: 'orderType'
        }, {
          style: 'clear: both;'
        }]
      }]
    }]
  }],
  create: function () {
    var orderDate, orderTime, orderType, me = this;
    this.inherited(arguments);

    orderDate = new Date(OB.I18N.normalizeDate(this.model.get('creationDate')));
    orderType = OB.MobileApp.model.get('orderType').find(function (ot) {
      return ot.id === me.model.get('orderType');
    }).name;

    this.$.date.setContent(OB.I18N.formatDate(orderDate));
    this.$.documentNo.setContent(this.model.get('documentNo'));
    this.$.amount.setContent(OB.I18N.formatCurrency(this.model.get('totalamount')));
    this.$.time.setContent(OB.I18N.formatHour(orderDate));
    this.$.customer.setContent(this.model.get('businessPartnerName'));
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
    this.applyStyle('padding', '5px');

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
  classes: 'row-fluid',
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
    classes: 'span12',
    components: [{
      style: 'border-bottom: 1px solid #cccccc;',
      classes: 'row-fluid',
      components: [{
        name: 'containerOfReceiptsListItemPrinter'
      }, {
        name: 'renderLoading',
        style: 'border-bottom: 1px solid #cccccc; padding: 20px; text-align: center; font-weight: bold; font-size: 30px; color: #cccccc',
        showing: false,
        initComponents: function () {
          this.setContent(OB.I18N.getLabel('OBPOS_LblLoading'));
        }
      }]
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
      var i, message, tokens;

      function getProperty(property) {
        return this.filterModel.getProperties().find(function (prop) {
          return prop.name === property || prop.sortName === property;
        });
      }

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
                style: 'text-align: left; padding-left: 8px;'
              });
            } else {
              var property = getProperty(tokens[i]);
              if (property) {
                message.push({
                  content: OB.I18N.getLabel(property.caption),
                  style: 'text-align: left; padding-left: 8px;',
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

    function successCallback(data) {
      me.$.renderLoading.hide();
      if (data && data.length > 0) {
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
        successCallback(data);
      } else {
        errorCallback();
      }
    }, errorCallback);

  },
  init: function (model) {
    var me = this;
    this.model = model;
    this.receiptList = new Backbone.Collection();
    this.$[this.getNameOfReceiptsListItemPrinter()].setCollection(this.receiptList);
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
        process = new OB.DS.Process('org.openbravo.retail.posterminal.PaidReceipts');
    this.model = model;
    this.inherited(arguments);
    this.receiptList.on('click', function (model) {
      function loadOrder(model) {
        OB.UTIL.showLoading(true);
        process.exec({
          orderid: model.get('id')
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
      OB.MobileApp.model.orderList.checkForDuplicateReceipts(model, loadOrder, undefined, undefined, true);
      return true;
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
      scrollAreaMaxHeight: '350px',
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
      OB.UTIL.OrderSelectorUtils.checkOrderAndLoad(model, me.model.get('orderList'), me, undefined, 'orderSelector');
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.ModalReceiptsScrollableHeader',
  kind: 'OB.UI.ScrollableTableHeader',
  events: {
    onSearchAction: ''
  },
  components: [{
    style: 'padding: 10px;',
    kind: 'OB.UI.FilterSelectorTableHeader',
    name: 'filterSelector',
    filters: OB.Model.OrderFilter.getProperties()
  }, {
    style: 'padding: 10px;',
    components: [{
      style: 'display: table; width: 100%;',
      components: [{
        style: 'display: table-cell; text-align: center; ',
        components: [{
          kind: 'OBPOS.UI.AdvancedFilterWindowButtonReceipts'
        }]
      }]
    }]
  }],
  initComponents: function () {
    this.inherited(arguments);
    this.$.filterSelector.$.entityFilterText.skipAutoFilterPref = true;
  }
});

enyo.kind({
  name: 'OB.UI.ModalVerifiedReturnsScrollableHeader',
  kind: 'OB.UI.ScrollableTableHeader',
  events: {
    onSearchAction: ''
  },
  components: [{
    style: 'padding: 10px;',
    kind: 'OB.UI.FilterSelectorTableHeader',
    name: 'filterSelector',
    filters: OB.Model.VReturnsFilter.getProperties()
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
    this.setFilters(OB.Model.OrderFilter.getProperties());
  }
});

enyo.kind({
  kind: 'OB.UI.ModalAdvancedFilters',
  name: 'OB.UI.ModalAdvancedFilterVerifiedReturns',
  model: OB.Model.VReturnsFilter,
  initComponents: function () {
    this.inherited(arguments);
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