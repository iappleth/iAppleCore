/*
 ************************************************************************************
 * Copyright (C) 2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, Backbone, _ */

enyo.kind({
  name: 'OBPOS.UI.CrossStoreSelector',
  kind: 'OB.UI.ModalSelector',
  classes: 'obpos-modal-store-selector',
  topPosition: '70px',
  i18nHeader: 'OBPOS_SelectStore',
  body: {
    kind: 'OBPOS.UI.CrossStoreList'
  },
  productId: null,
  productUOM: null,
  executeOnShow: function () {
    if (!this.initialized) {
      this.inherited(arguments);
      this.getFilterSelectorTableHeader().clearFilter();
      this.productId = this.args.productId;
      this.productUOM = this.args.productUOM;
      this.$.body.$.crossStoreList.callback = this.args.callback;
      this.$.body.$.crossStoreList.searchAction(null, {
        filters: []
      });
    }
  },
  executeOnHide: function () {
    this.inherited(arguments);
    OB.MobileApp.view.scanningFocus(true);
  },
  getFilterSelectorTableHeader: function () {
    return this.$.body.$.crossStoreList.$.csStoreSelector.$.theader.$.modalCrossStoreProductScrollableHeader.$.filterSelector;
  },
  getAdvancedFilterBtn: function () {
    return this.$.body.$.crossStoreList.$.csStoreSelector.$.theader.$.modalCrossStoreProductScrollableHeader.$.buttonAdvancedFilter;
  },
  getAdvancedFilterDialog: function () {
    return 'modalAdvancedFilterSelectStore';
  }
});


enyo.kind({
  name: 'OBPOS.UI.ModalCrossStoreProductScrollableHeader',
  kind: 'OB.UI.ScrollableTableHeader',
  components: [{
    classes: 'obpos-filter-selector',
    kind: 'OB.UI.FilterSelectorTableHeader',
    name: 'filterSelector',
    filters: OB.Model.CrossStoreFilter.getProperties()
  }, {
    style: 'padding: 10px;',
    components: [{
      style: 'display: table; width: 100%;',
      components: [{
        style: 'display: table-cell; text-align: center; ',
        components: [{
          kind: 'OB.UI.ButtonAdvancedFilter',
          dialog: 'modalAdvancedFilterSelectStore'
        }]
      }]
    }]
  }]
});

enyo.kind({
  kind: 'OB.UI.ModalAdvancedFilters',
  name: 'OB.UI.ModalAdvancedFilterSelectStore',
  model: OB.Model.CrossStoreFilter,
  initComponents: function () {
    this.inherited(arguments);
    this.setFilters(OB.Model.CrossStoreFilter.getProperties());
  }
});

/* Scrollable table (body of modal) */
enyo.kind({
  name: 'OBPOS.UI.CrossStoreList',
  classes: 'row-fluid',
  handlers: {
    onClearFilterSelector: 'searchAction',
    onSearchAction: 'searchAction'
  },
  events: {
    onHideSelector: '',
    onShowSelector: ''
  },
  callback: null,
  components: [{
    classes: 'span12',
    components: [{
      classes: 'row-fluid obpos-list-store',
      components: [{
        classes: 'span12',
        components: [{
          name: 'csStoreSelector',
          kind: 'OB.UI.ScrollableTable',
          scrollAreaMaxHeight: '420px',
          renderHeader: 'OBPOS.UI.ModalCrossStoreProductScrollableHeader',
          renderLine: 'OBPOS.UI.CrossStoreLine',
          renderEmpty: 'OB.UI.RenderEmpty'
        }, {
          name: 'renderLoading',
          classes: 'obpos-list-orders obpos-list-orders-renderloading',
          showing: false,
          initComponents: function () {
            this.setContent(OB.I18N.getLabel('OBPOS_LblLoading'));
          }
        }]
      }]
    }]
  }],
  searchAction: function (inSender, inEvent) {
    var me = this,
        remoteFilters = [],
        params = {},
        currentDate = new Date();
    if (OB.MobileApp.model.hasPermission('OBPOS_EnableMultiPriceList', false)) {
      params.currentPriceList = OB.MobileApp.model.receipt.get('bp').get('priceList');
    }
    params.remoteModel = true;
    params.terminalTime = currentDate;
    params.terminalTimeOffset = {
      value: currentDate.getTimezoneOffset(),
      type: 'long'
    };

    function successCallBack(result) {
      var data = [],
          productPrices = [],
          currentPrice, i = 0;
      if (result && !result.exception) {
        _.each(result, function (r) {
          if (r.orgId) {
            data.push(r);
          }

          if (OB.MobileApp.model.hasPermission('EnableMultiPriceList', true) && r.multiPriceListId) {
            productPrices.push({
              price: r.multiPrice,
              priceListId: r.multiPriceListId
            });
            if (r.multiPriceListId === OB.MobileApp.model.receipt.get('bp').get('priceList')) {
              currentPrice = productPrices[productPrices.length - 1];
            }
          }
        });
        if (OB.MobileApp.model.hasPermission('EnableMultiPriceList', true)) {
          while (i < data.length) {
            if (OB.UTIL.isNullOrUndefined(data[i].standardPrice) && OB.UTIL.isNullOrUndefined(currentPrice)) {
              data.splice(i, 1);
            } else {
              data[i].productPrices = productPrices;
              data[i].currentPrice = currentPrice;
              i++;
            }
          }
        }
        me.$.csStoreSelector.collection.reset(data);
        me.$.renderLoading.hide();
      } else {
        OB.UTIL.showError(OB.I18N.getLabel(result.exception.message));
        me.$.csStoreSelector.collection.reset();
        me.$.renderLoading.hide();
        me.$.csStoreSelector.$.tempty.show();
      }
    }

    function errorCallback(tx, error) {
      OB.UTIL.showError(error);
    }

    if (OB.UTIL.isCrossStoreEnabled() && this.owner.owner.productId) {
      _.each(inEvent.filters, function (flt) {

        var column = _.find(OB.Model.CrossStoreFilter.getProperties(), function (col) {
          return col.column === flt.column;
        });
        if (flt.value && column) {
          remoteFilters.push({
            columns: [column.name],
            value: flt.value,
            operator: flt.operator || OB.Dal.STARTSWITH
          });
        }
      });

      var process = new OB.DS.Process(OB.Model.CrossStoreFilter.prototype.source);

      process.exec({
        _limit: OB.Model.CrossStoreFilter.prototype.dataLimit,
        remoteFilters: remoteFilters,
        product: this.owner.owner.productId,
        parameters: params
      }, successCallBack, errorCallback);
    }
  },

  productsList: null,

  init: function (model) {
    this.productsList = new Backbone.Collection();
    this.$.csStoreSelector.setCollection(this.productsList);
  }
});

/* items of collection */
enyo.kind({
  name: 'OBPOS.UI.CrossStoreLine',
  kind: 'OB.UI.listItemButton',
  classes: 'obpos-listitembutton',
  tap: function () {
    if (this.owner.owner.owner.owner.callback && !(event && event.cancel)) {
      var data = {
        orgId: this.model.get('orgId'),
        orgName: this.model.get('orgName'),
        warehouseid: this.model.get('warehouseId'),
        warehousename: this.model.get('warehouseName'),
        stock: this.model.get('stock'),
        currentPrice: this.model.has('currentPrice') ? this.model.get('currentPrice') : {
          priceListId: this.model.get('standardPriceListId'),
          price: this.model.get('standardPrice')
        },
        productPrices: this.model.has('productPrices') ? this.model.get('productPrices') : null,
        documentType: this.model.get('documentTypeId'),
        quotationDocumentType: this.model.get('quotationDocumentTypeId')
      };
      this.owner.owner.owner.owner.callback(data);
      this.owner.owner.owner.owner.owner.owner.hide();
    }
  },
  components: [{
    classes: 'obpos-store-information',
    name: 'iconStore',
    tap: function () {
      if (event) {
        event.cancel = true;
      }
      this.bubble('onShowPopup', {
        popup: 'OBPOS_storeInformation',
        args: {
          context: this,
          orgId: this.owner.model.get('orgId'),
          orgName: this.owner.model.get('orgName')
        }
      });
    }
  }, {
    classes: 'obpos-row-store-name',
    name: 'storeName'
  }, {
    classes: 'obpos-row-store-standard-price',
    name: 'standarPrice'
  }, {
    classes: 'obpos-row-store-current-price',
    name: 'currentPrice'
  }, {
    classes: 'obpos-row-store-stock',
    name: 'stock'
  }, {
    classes: '.changedialog-properties-end'
  }],
  create: function () {
    this.inherited(arguments);
    this.$.storeName.setContent(this.model.get('orgId') === OB.MobileApp.model.get('terminal').organization ? OB.I18N.getLabel('OBPOS_LblThisStore', [OB.MobileApp.model.get('terminal').organization$_identifier]) : this.model.get('orgName'));
    this.$.standarPrice.setContent(this.model.has('standardPrice') ? OB.I18N.formatCurrency(this.model.get('standardPrice')) : '');
    this.$.currentPrice.setContent(this.model.has('currentPrice') && this.model.get('standardPriceListId') !== this.model.get('currentPrice').priceListId ? OB.I18N.formatCurrency(this.model.get('currentPrice').price) : '');
    this.$.stock.setContent(this.model.get('stock') + ' ' + this.owner.owner.owner.owner.owner.owner.productUOM);
  }
});