/*
 ************************************************************************************
 * Copyright (C) 2013-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, enyo, Backbone, _, $ */

enyo.kind({
  name: 'OB.UI.OrderMultiSelect',
  kind: 'Image',
  src: '../org.openbravo.retail.posterminal/img/iconPinSelected.svg',
  sizing: "cover",
  width: 28,
  height: 28,
  style: 'float: right; cursor: pointer; margin-top: 8px; width: 27px; height: 27px;',
  showing: false,
  events: {
    onToggleSelection: ''
  },
  published: {
    disabled: false
  },
  tap: function () {
    this.doToggleSelection({
      multiselection: false
    });
  }
});

enyo.kind({
  name: 'OB.UI.OrderSingleSelect',
  kind: 'Image',
  src: '../org.openbravo.retail.posterminal/img/iconPinUnselected.svg',
  sizing: "cover",
  width: 28,
  height: 28,
  style: 'float: right; cursor: pointer; margin-top: 8px; width: 27px; height: 27px;',
  events: {
    onToggleSelection: ''
  },
  published: {
    disabled: false
  },
  tap: function () {
    this.doToggleSelection({
      multiselection: true
    });
  }
});

enyo.kind({
  kind: 'OB.UI.SmallButton',
  name: 'OB.UI.OrderMultiSelectAll',
  i18nContent: 'OBPOS_lblSelectAll',
  classes: 'btnlink-orange',
  style: 'float: right; margin-top: 6px;',
  showing: false,
  events: {
    onMultiSelectAll: ''
  },
  published: {
    disabled: false
  },
  tap: function () {
    this.doMultiSelectAll();
  }
});

enyo.kind({
  name: 'OB.UI.OrderHeader',
  classes: 'obUiOrderHeader',
  published: {
    order: null
  },
  events: {
    onToggleSelectionMode: '',
    onTableMultiSelectAll: ''
  },
  handlers: {
    onShowMultiSelected: 'showMultiSelected',
    onToggleSelection: 'toggleSelection',
    onMultiSelectAll: 'multiSelectAll'
  },
  newLabelComponents: [{
    kind: 'OB.UI.OrderDetails',
    name: 'orderdetails'
  }, {
    kind: 'OB.UI.OrderMultiSelect',
    name: 'btnMultiSelection'
  }, {
    kind: 'OB.UI.OrderMultiSelectAll',
    name: 'btnMultiSelectAll'
  }, {
    kind: 'OB.UI.OrderSingleSelect',
    name: 'btnSingleSelection'
  }, {
    style: 'clear: both;'
  }],
  newButtonComponents: [{
    kind: 'OB.UI.BusinessPartnerSelector',
    name: 'bpbutton'
  }, {
    name: 'separator',
    classes: 'customer-buttons-separator'
  }, {
    kind: 'OB.UI.BPLocation',
    name: 'bplocbutton'
  }, {
    kind: 'OB.UI.BPLocationShip',
    name: 'bplocshipbutton'
  }],
  components: [{
    name: 'receiptLabels'
  }, {
    kind: 'OB.UI.ActionButtonArea',
    name: 'obpos_pointofsale-receipttoolbar1',
    abaIdentifier: 'obpos_pointofsale-receipttoolbar1',
    classes: 'obpos_pointofsale-receipttoolbar1'
  }, {
    name: 'receiptButtons',
    style: 'clear: both; ',
    classes: 'standardFlexContainer'
  }],
  resizeHandler: function () {
    this.inherited(arguments);
    this.setOrderDetailWidth(this.showPin, this.showSelectAll);
  },
  orderChanged: function (oldValue) {
    _.each(this.$.receiptLabels.$, function (comp) {
      if (comp.setOrder) {
        comp.setOrder(this.order);
      }
    }, this);
    _.each(this.$.receiptButtons.$, function (comp) {
      if (comp.setOrder) {
        comp.setOrder(this.order);
      }
    }, this);
  },
  setOrderDetailWidth: function (pin, selectAll) {
    this.showPin = pin;
    this.showSelectAll = selectAll;
    var w = $("#" + this.$.receiptLabels.id).width() - 25;
    if (pin) {
      w = w - $("#" + this.$.receiptLabels.$.btnSingleSelection.id).width() - 20;
    }
    if (selectAll) {
      w = w - $("#" + this.$.receiptLabels.$.btnMultiSelectAll.id).width() - 20;
    }
    $("#" + this.$.receiptLabels.$.orderdetails.id).width(w + 'px');
  },
  showMultiSelected: function (inSender, inEvent) {
    if (inEvent.show) {
      this.$.receiptLabels.$.btnSingleSelection.setShowing(true);
    } else {
      this.$.receiptLabels.$.btnSingleSelection.setShowing(false);
    }
    this.$.receiptLabels.$.btnMultiSelection.setShowing(false);
    this.$.receiptLabels.$.btnMultiSelectAll.setShowing(false);
    this.setOrderDetailWidth(inEvent.show, false);
    this.doToggleSelectionMode({
      multiselection: false
    });
  },
  toggleSelection: function (inSender, inEvent) {
    if (inEvent.multiselection) {
      this.$.receiptLabels.$.btnSingleSelection.setShowing(false);
      this.$.receiptLabels.$.btnMultiSelection.setShowing(true);
      this.$.receiptLabels.$.btnMultiSelectAll.setShowing(true);
    } else {
      this.$.receiptLabels.$.btnSingleSelection.setShowing(true);
      this.$.receiptLabels.$.btnMultiSelection.setShowing(false);
      this.$.receiptLabels.$.btnMultiSelectAll.setShowing(false);
    }
    this.setOrderDetailWidth(true, inEvent.multiselection);
    this.doToggleSelectionMode(inEvent);
  },
  multiSelectAll: function (inSender, inEvent) {
    this.doTableMultiSelectAll();
  },
  initComponents: function () {
    this.inherited(arguments);
    this.showPin = false;
    this.showSelectAll = false;
    enyo.forEach(this.newLabelComponents, function (comp) {
      this.$.receiptLabels.createComponent(comp);
    }, this);
    enyo.forEach(this.newButtonComponents, function (comp) {
      this.$.receiptButtons.createComponent(comp);
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.OrderFooter',
  classes: 'row-fluid span12',
  published: {
    order: null
  },
  style: 'border-bottom: 1px solid #cccccc;',
  newComponents: [],
  orderChanged: function () {
    _.each(this.$, function (comp) {
      if (comp.setOrder) {
        comp.setOrder(this.order);
      }
    }, this);
  },
  initComponents: function () {
    this.inherited(arguments);
    enyo.forEach(this.newComponents, function (comp) {
      this.createComponent(comp);
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.TotalMultiReceiptLine',
  style: 'position: relative; padding: 10px;',
  components: [{
    name: 'lblTotal',
    style: 'float: left; width: 40%;'
  }, {
    name: 'totalqty',
    style: 'float: left; width: 20%; text-align:right; font-weight:bold;'
  }, {
    name: 'totalgross',
    style: 'float: left; width: 40%; text-align:right; font-weight:bold;'
  }, {
    style: 'clear: both;'
  }],
  renderTotal: function (newTotal) {
    this.$.totalgross.setContent(OB.I18N.formatCurrency(newTotal));
  },
  renderQty: function (newQty) {
    this.$.totalqty.setContent(newQty);
  },
  initComponents: function () {
    this.inherited(arguments);
    this.$.lblTotal.setContent(OB.I18N.getLabel('OBPOS_LblTotal'));
  }
});
enyo.kind({
  name: 'OB.UI.TotalReceiptLine',
  handlers: {
    onCheckBoxBehaviorForTicketLine: 'checkBoxForTicketLines'
  },
  style: 'position: relative; padding: 10px; height: 35px',
  components: [{
    name: 'lblTotal',
    classes: 'order-total-label'
  }, {
    kind: 'OB.UI.FitText',
    classes: 'order-total-qty fitText',
    components: [{
      tag: 'span',
      name: 'totalqty'
    }]
  }, {
    kind: 'OB.UI.FitText',
    classes: 'order-total-gross fitText',
    components: [{
      tag: 'span',
      name: 'totalgross'
    }]
  }, {
    style: 'clear: both;'
  }],
  renderTotal: function (newTotal) {
    if (newTotal !== this.$.totalgross.getContent()) {
      this.$.totalgross.setContent(OB.I18N.formatCurrency(newTotal));
      OB.UTIL.HookManager.executeHooks('OBPOS_UpdateTotalReceiptLine', {
        totalline: this
      });
    }
  },
  renderQty: function (newQty) {
    this.$.totalqty.setContent(newQty);
  },
  checkBoxForTicketLines: function (inSender, inEvent) {
    if (inEvent.status) {
      this.$.lblTotal.hasNode().style.width = '48%';
      this.$.totalqty.hasNode().style.width = '16%';
      this.$.totalgross.hasNode().style.width = '36%';
    } else {
      this.$.lblTotal.hasNode().style.width = '40%';
      this.$.totalqty.hasNode().style.width = '20%';
      this.$.totalgross.hasNode().style.width = '40%';
    }
  },
  initComponents: function () {
    this.inherited(arguments);
    this.$.lblTotal.setContent(OB.I18N.getLabel('OBPOS_LblTotal'));
    OB.UTIL.HookManager.executeHooks('OBPOS_RenderTotalReceiptLine', {
      totalline: this
    });
  }
});

enyo.kind({
  name: 'OB.UI.TotalTaxLine',
  style: 'position: relative; padding: 10px;',
  components: [{
    name: 'lblTotalTax',
    style: 'float: left; width: 40%;'
  }, {
    name: 'totalbase',
    style: 'float: left; width: 20%; text-align:right; font-weight:bold;'
  }, {
    name: 'totaltax',
    style: 'float: left; width: 60%; text-align:right; font-weight:bold;'
  }, {
    style: 'clear: both;'
  }],
  renderTax: function (newTax) {
    this.$.totaltax.setContent(OB.I18N.formatCurrency(newTax));
  },
  initComponents: function () {
    this.inherited(arguments);
    this.$.lblTotalTax.setContent(OB.I18N.getLabel('OBPOS_LblTotalTax'));
  }
});

enyo.kind({
  name: 'OB.UI.TaxBreakdown',
  style: 'position: relative; padding: 10px;',
  components: [{
    name: 'lblTotalTaxBreakdown',
    style: 'float: left; width: 40%;'
  }, {
    style: 'clear: both;'
  }],
  initComponents: function () {
    this.inherited(arguments);
    this.$.lblTotalTaxBreakdown.setContent(OB.I18N.getLabel('OBPOS_LblTaxBreakdown'));
  }
});

enyo.kind({
  kind: 'OB.UI.SmallButton',
  name: 'OB.UI.BtnReceiptToInvoice',
  events: {
    onCancelReceiptToInvoice: ''
  },
  style: 'width: 40px;',
  classes: 'btnlink-white btnlink-payment-clear btn-icon-small btn-icon-check',
  tap: function () {
    this.doCancelReceiptToInvoice();
  }
});

enyo.kind({
  name: 'btninvoice',
  showing: false,
  style: 'float: left; width: 40%;',
  components: [{
    kind: 'OB.UI.BtnReceiptToInvoice'
  }, {
    tag: 'span',
    content: ' '
  }, {
    tag: 'span',
    name: 'lblInvoiceReceipt',
    style: 'font-weight:bold; '
  }],
  initComponents: function () {
    this.inherited(arguments);
    this.$.lblInvoiceReceipt.setContent(OB.I18N.getLabel('OBPOS_LblInvoiceReceipt'));
  }
});

enyo.kind({
  name: 'OB.UI.OrderViewDivText',
  style: 'float: right; text-align: right; font-weight:bold; font-size: 30px; line-height: 30px;',
  showing: false,
  content: '',

  changeHasbeenpaid: function (model) {
    if (model.get('isQuotation') && model.get('hasbeenpaid') === 'Y' && !model.get('obposIsDeleted') && this.content && (this.content === OB.I18N.getLabel('OBPOS_QuotationNew') || this.content === OB.I18N.getLabel('OBPOS_QuotationDraft'))) {
      this.setContent(OB.I18N.getLabel('OBPOS_QuotationUnderEvaluation'));
    } else if (model.get('isQuotation') && model.get('hasbeenpaid') === 'N' && !model.get('isLayaway')) {
      this.setContent(OB.I18N.getLabel('OBPOS_QuotationDraft'));
    }
  },

  setQuotationLabel: function (model) {
    this.addStyles('width: 100%; color: #f8941d;');
    if (model.get('hasbeenpaid') === 'Y') {
      this.setContent(OB.I18N.getLabel('OBPOS_QuotationUnderEvaluation'));
    } else {
      this.setContent(OB.I18N.getLabel('OBPOS_QuotationDraft'));
    }
    this.show();
  },

  setPaidLabel: function (model) {
    this.addStyles('width: 50%; color: #f8941d;');
    if (model.get('iscancelled')) {
      this.setContent(OB.I18N.getLabel('OBPOS_Cancelled'));
    } else if (model.get('paidOnCredit')) {
      if (model.get('paidPartiallyOnCredit')) {
        this.setContent(OB.I18N.getLabel('OBPOS_paidPartiallyOnCredit', [OB.I18N.formatCurrency(model.get('creditAmount'))]));
      } else {
        this.setContent(OB.I18N.getLabel('OBPOS_paidOnCredit'));
      }
    } else if (model.get('documentType') === OB.MobileApp.model.get('terminal').terminalType.documentTypeForReturns) {
      this.setContent(OB.I18N.getLabel('OBPOS_paidReturn'));
    } else {
      this.setContent(OB.I18N.getLabel('OBPOS_paid'));
    }
    this.show();
  },

  setLayawayLabel: function (model) {
    this.addStyles('width: 50%; color: lightblue;');
    if (model.get('iscancelled')) {
      this.setContent(OB.I18N.getLabel('OBPOS_Cancelled'));
    } else {
      this.setContent(OB.I18N.getLabel('OBPOS_LblLayaway'));
    }
    this.show();
  },

  setCancelAndReplaceLabel: function (model) {
    if (model.get('orderType') === 2) {
      this.addStyles('width: 90%; color: lightblue; line-height:30px');
      this.setContent(OB.I18N.getLabel('OBPOS_ToBeLaidaway') + ': ' + OB.I18N.getLabel('OBPOS_CancelAndReplaceOf', [model.get('replacedorder_documentNo')]));
    } else {
      this.addStyles('width: 90%; color: #5353C5; line-height:30px');
      this.setContent(OB.I18N.getLabel('OBPOS_CancelAndReplaceOf', [model.get('replacedorder_documentNo')]));
    }
    this.show();
  },

  setCancelLayawayLabel: function (model) {
    if (model.get('fromLayaway')) {
      this.addStyles('width: 60%; color: lightblue;');
      this.setContent(OB.I18N.getLabel('OBPOS_CancelLayaway'));
    } else {
      this.addStyles('width: 60%; color: #5353C5;');
      this.setContent(OB.I18N.getLabel('OBPOS_CancelOrder'));
    }
    this.show();
  },

  setToBeReturnedLabel: function (model) {
    this.addStyles('width: 50%; color: #f8941d;');
    this.setContent(OB.I18N.getLabel('OBPOS_ToBeReturned'));
    this.show();
  },

  setToBeLaidawayLabel: function (model) {
    this.addStyles('width: 60%; color: lightblue;');
    this.setContent(OB.I18N.getLabel('OBPOS_ToBeLaidaway'));
    this.show();
  }
});

enyo.kind({
  name: 'OB.UI.OrderView',
  published: {
    order: null
  },
  events: {
    onReceiptLineSelected: '',
    onRenderPaymentLine: ''
  },
  handlers: {
    onCheckBoxBehaviorForTicketLine: 'checkBoxBehavior',
    onAllTicketLinesChecked: 'allTicketLinesChecked',
    onToggleSelectionTable: 'toggleSelectionTable',
    onMultiSelectAllTable: 'multiSelectAllTable',
    onTableMultiSelectedItems: 'tableMultiSelectedItems'
  },
  processesToListen: ['calculateReceipt'],
  processStarted: function () {},
  processFinished: function (process, execution, processesInExec) {
    var removedServices = [],
        servicesToBeDeleted = [];
    removedServices.push(OB.I18N.getLabel('OBPOS_ServiceRemoved'));
    _.each(OB.MobileApp.model.receipt.get('lines').models, function (line) {
      var trancheValues = [],
          totalAmountSelected = 0,
          minimumSelected = Infinity,
          maximumSelected = 0,
          uniqueQuantityServiceToBeDeleted, asPerProductServiceToBeDeleted;

      if (line.get('obposIsDeleted')) {
        return;
      }

      if (line.has('relatedLines') && line.get('relatedLines').length > 0) {
        _.each(line.get('relatedLines'), function (line2) {
          if (!line2.deferred && !line.get('originalOrderLineId')) {
            line2 = OB.MobileApp.model.receipt.attributes.lines.get(line2.orderlineId).attributes;
          }
          trancheValues = OB.UI.SearchServicesFilter.prototype.calculateTranche(line2, trancheValues);
        }, this);
        totalAmountSelected = trancheValues[0];
        minimumSelected = trancheValues[1];
        maximumSelected = trancheValues[2];
        uniqueQuantityServiceToBeDeleted = line.get('product').get('quantityRule') === 'UQ' && ((line.has('serviceTrancheMaximum') && totalAmountSelected > line.get('serviceTrancheMaximum')) || (line.has('serviceTrancheMinimum') && totalAmountSelected < line.get('serviceTrancheMinimum')));
        asPerProductServiceToBeDeleted = line.get('product').get('quantityRule') === 'PP' && ((line.has('serviceTrancheMaximum') && maximumSelected > line.get('serviceTrancheMaximum')) || (line.has('serviceTrancheMinimum') && minimumSelected < line.get('serviceTrancheMinimum')));
        if ((!line.has('deliveredQuantity') || line.get('deliveredQuantity') <= 0) && (uniqueQuantityServiceToBeDeleted || asPerProductServiceToBeDeleted)) {
          servicesToBeDeleted.push(line);
          removedServices.push(line.get('product').get('_identifier'));
        }
      }
    }, this);
    if (servicesToBeDeleted.length > 0) {
      OB.MobileApp.model.receipt.deleteLinesFromOrder(servicesToBeDeleted);
      OB.MobileApp.model.receipt.set('undo', null);
      OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_ServiceRemovedHeader'), removedServices);
    }

  },
  components: [{
    kind: 'OB.UI.ScrollableTable',
    name: 'listOrderLines',
    columns: ['product', 'quantity', 'price', 'gross'],
    scrollWhenSelected: true,
    renderLine: 'OB.UI.RenderOrderLine',
    renderEmpty: 'OB.UI.RenderOrderLineEmpty',
    //defined on redenderorderline.js
    listStyle: 'edit',
    isSelectableLine: function (model) {
      if (!OB.UTIL.isNullOrUndefined(model) && !OB.UTIL.isNullOrUndefined(model.attributes) && !model.attributes.isEditable) {
        return false;
      }
      return true;
    }
  }, {
    tag: 'ul',
    classes: 'unstyled',
    components: [{
      tag: 'li',
      components: [{
        kind: 'OB.UI.TotalTaxLine',
        name: 'totalTaxLine'
      }, {
        kind: 'OB.UI.TotalReceiptLine',
        name: 'totalReceiptLine'
      }]
    }, {
      tag: 'li',
      components: [{
        name: 'injectedFooter'
      }, {
        style: 'padding: 10px; border-top: 1px solid #cccccc; min-height: 40px;',
        components: [{
          kind: 'btninvoice',
          name: 'divbtninvoice',
          showing: false
        }, {
          kind: 'OB.UI.OrderViewDivText',
          name: 'divText'
        }, {
          style: 'clear: both;'
        }]
      }]
    }, {
      tag: 'li',
      components: [{
        name: 'taxBreakdownDiv',
        style: 'padding: 10px; border-top: 1px solid #cccccc; height: 40px;',
        components: [{
          kind: 'OB.UI.TaxBreakdown',
          name: 'taxBreakdown'
        }]
      }]
    }, {
      kind: 'OB.UI.ScrollableTable',
      name: 'listTaxLines',
      scrollAreaMaxHeight: '250px',
      renderLine: 'OB.UI.RenderTaxLine',
      renderEmpty: 'OB.UI.RenderTaxLineEmpty',
      //defined on redenderorderline.js
      listStyle: 'nonselectablelist',
      columns: ['tax', 'base', 'totaltax']
    }, {
      tag: 'li',
      components: [{
        name: 'paymentBreakdown',
        style: 'padding: 10px; height: 40px;',
        showing: false,
        components: [{
          style: 'position: relative; padding: 10px;',
          components: [{
            name: 'lblTotalPayment',
            style: 'float: left; width: 40%;'
          }, {
            style: 'clear: both;'
          }]
        }]
      }]
    }, {
      kind: 'OB.UI.ScrollableTable',
      style: 'border-bottom: 1px solid #cccccc;',
      name: 'listPaymentLines',
      showing: false,
      scrollAreaMaxHeight: '250px',
      renderLine: 'OB.UI.RenderPaymentLine',
      renderEmpty: 'OB.UI.RenderPaymentLineEmpty',
      //defined on redenderorderline.js
      listStyle: 'nonselectablelist'
    }]
  }],
  initComponents: function () {
    this.inherited(arguments);
    var scrollMax = 250;
    if (!OB.MobileApp.model.get('terminal').terminalType.showtaxbreakdown) {
      scrollMax = scrollMax + 143;
    }
    this.$.listOrderLines.scrollAreaMaxHeight = scrollMax + 'px';
    this.$.lblTotalPayment.setContent(OB.I18N.getLabel('OBPOS_LblPaymentBreakdown'));

    // Inject the footer components
    var prop;
    for (prop in OB.POS.ORDERFOOTER) {
      if (OB.POS.ORDERFOOTER.hasOwnProperty(prop)) {
        this.$.injectedFooter.createComponent({
          kind: OB.POS.ORDERFOOTER[prop],
          name: prop
        }).render();
      }
    }
    OB.UTIL.ProcessController.subscribe(this.processesToListen, this);
  },
  destroyComponents: function () {
    this.inherited(arguments);
    OB.UTIL.ProcessController.unSubscribe(this.processesToListen, this);
  },
  checkBoxBehavior: function (inSender, inEvent) {
    if (inEvent.status) {
      this.$.listOrderLines.setListStyle('checkboxlist');
    } else {
      this.$.listOrderLines.setListStyle('edit');
    }
  },
  allTicketLinesChecked: function (inSender, inEvent) {
    if (inEvent.status) {
      this.order.get('lines').trigger('checkAll');
    } else {
      this.order.get('lines').trigger('unCheckAll');
    }
  },
  setTaxes: function () {
    if (OB.UTIL.isNullOrUndefined(OB.MobileApp.model.get('terminal'))) {
      return;
    }
    if (OB.MobileApp.model.get('terminal').terminalType.showtaxbreakdown) {
      var prop, taxList = new Backbone.Collection(),
          taxes = this.order.get('taxes');

      if (_.filter(this.order.get('lines').models, function (line) {
        return !line.get('obposIsDeleted');
      }).length > 0) {
        for (prop in taxes) {
          if (taxes.hasOwnProperty(prop)) {
            taxList.add(new OB.Model.TaxLine(taxes[prop]));
          }
        }
      }
      if (taxList.length === 0) {
        this.$.taxBreakdown.hide();
      } else {
        this.$.taxBreakdown.show();
      }

      taxList.models = _.sortBy(taxList.models, function (taxLine) {
        return taxLine.get('name');
      });

      this.$.listTaxLines.setCollection(taxList);
    } else {
      this.$.taxBreakdownDiv.hide();
    }
  },
  toggleSelectionTable: function (inSender, inEvent) {
    this.$.listOrderLines.setSelectionMode(inEvent.multiselection ? 'multiple' : 'single');
  },
  multiSelectAllTable: function () {
    this.$.listOrderLines.selectAll();
    this.doReceiptLineSelected();
  },
  tableMultiSelectedItems: function (inSender, inEvent) {
    this.$.listOrderLines.setSelectedModels(inEvent.selection);
  },
  orderChanged: function (oldValue) {
    var me = this;
    this.$.totalReceiptLine.renderTotal(this.order.getTotal());
    this.$.totalReceiptLine.renderQty(this.order.getQty());
    this.$.totalTaxLine.renderTax(OB.DEC.sub(this.order.getTotal(), this.order.getNet()));
    this.$.listOrderLines.setCollection(this.order.get('lines'));
    this.$.listPaymentLines.setCollection(this.order.get('payments'));
    this.setTaxes();
    this.order.on('change:isNegative', function (model) {
      if (model.get('doCancelAndReplace')) {
        // Render the payments because it's possible that the amount must be shown with another
        // sign (depends on the gross and the isNegative properties)
        this.$.listPaymentLines.waterfall('onRenderPaymentLine');
      }
    }, this);
    this.order.on('change:gross change:net', function (model) {
      this.$.totalReceiptLine.renderTotal(model.getTotal());
      this.$.totalTaxLine.renderTax(OB.DEC.sub(model.getTotal(), model.getNet()));
    }, this);
    this.order.on('paintTaxes', function () {
      this.setTaxes();
    }, this);
    this.order.on('change:priceIncludesTax ', function (model) {
      if (this.order.get('priceIncludesTax')) {
        this.$.totalTaxLine.hide();
      } else {
        this.$.totalTaxLine.show();
      }
    }, this);
    this.order.on('change:qty', function (model) {
      this.$.totalReceiptLine.renderQty(model.getQty());
    }, this);
    this.order.on('change:generateInvoice', function (model) {
      if (model.get('generateInvoice')) {
        this.$.divbtninvoice.show();
      } else {
        this.$.divbtninvoice.hide();
      }
    }, this);
    this.order.on('change:hasbeenpaid', function (model) {
      this.$.divText.changeHasbeenpaid(model);
    }, this);
    this.order.on('change:isPaid change:isLayaway change:isQuotation change:documentNo change:orderType change:doCancelAndReplace change:cancelLayaway change:replacedorder_documentNo change:paidOnCredit change:paidPartiallyOnCredit change:fromLayaway change:documentType change:iscancelled', function (model) {
      // Unified the logic to show/hide the 'divText', the 'listPaymentLines' and the 'paymentBreakdown' panels
      if (model.get('doCancelAndReplace')) {
        // Set the label for C&R
        this.$.divText.setCancelAndReplaceLabel(model);
      } else if (model.get('cancelLayaway')) {
        // Set the label for CL
        this.$.divText.setCancelLayawayLabel(model);
      } else if (model.get('isQuotation')) {
        // Set the label for quotations
        this.$.divText.setQuotationLabel(model);
      } else if (model.get('isLayaway')) {
        // Set the label for layaways
        this.$.divText.setLayawayLabel(model);
      } else if (model.get('isPaid')) {
        // Set the label for paid receipts (also on credit and canceled)
        this.$.divText.setPaidLabel(model);
      } else {
        if (model.get('orderType') === 1) {
          // Set the label for draft returns
          this.$.divText.setToBeReturnedLabel(model);
        } else if (model.get('orderType') === 2) {
          // Set the label for draft layaways
          this.$.divText.setToBeLaidawayLabel(model);
        } else {
          this.$.divText.hide();
        }
      }

      // Set the 'New receipt'/'New quotation' labels when converting to a quotation or receipt
      if (!_.isUndefined(model.changed.isQuotation)) {
        if (model.get('isQuotation')) {
          this.$.listOrderLines.children[4].children[0].setContent(OB.I18N.getLabel('OBPOS_QuotationNew'));
        } else {
          this.$.listOrderLines.children[4].children[0].setContent(OB.I18N.getLabel('OBPOS_ReceiptNew'));
        }
      }

      // Show the payment list only in synchronized tickets and in C&R
      if (model.get('isLayaway') || model.get('isPaid') || model.get('doCancelAndReplace')) {
        this.$.listPaymentLines.show();
        this.$.paymentBreakdown.show();
      } else {
        this.$.listPaymentLines.hide();
        this.$.paymentBreakdown.hide();
      }
    }, this);
    // Change Document No based on return lines
    this.order.get('lines').on('add change:qty change:relatedLines updateRelations', function () {
      if (this.order.get('isEditable') && !this.order.get('isModified') && !this.order.get('isLayaway') && !this.order.get('isQuotation') && !this.order.get('doCancelAndReplace') && !this.order.get('cancelLayaway')) {
        var negativeLinesLength = _.filter(this.order.get('lines').models, function (line) {
          return line.get('qty') < 0;
        }).length;
        if ((negativeLinesLength > 0 && negativeLinesLength === this.order.get('lines').models.length) || (negativeLinesLength > 0 && OB.MobileApp.model.get('permissions').OBPOS_SalesWithOneLineNegativeAsReturns)) {
          //isReturn
          this.order.setDocumentNo(true, false);
        } else {
          //isOrder
          this.order.setDocumentNo(false, true);
        }
      }
    }, this);

    this.order.get('lines').on('add change:qty change:relatedLines updateRelations', function () {
      var approvalNeeded = false,
          linesToRemove = [],
          servicesToApprove = '',
          line, k, oldUndo = this.order.get('undo');

      if (!this.order.get('hasServices') || this.updating || this.order.get('preventServicesUpdate') || !this.order.get('isEditable')) {
        return;
      }
      this.updating = true;

      function getServiceLines(service) {
        var serviceLines;
        if (service.get('groupService')) {
          serviceLines = _.filter(me.order.get('lines').models, function (l) {
            return (l.get('product').get('id') === service.get('product').get('id')) && !l.get('originalOrderLineId');
          });
        }
        serviceLines = [service];
        return serviceLines;
      }

      function filterLines(newRelatedLines, lines) {
        return _.filter(newRelatedLines, function (rl) {
          return _.indexOf(_.pluck(lines, 'id'), rl.orderlineId) !== -1;
        });
      }

      function getSiblingServicesLines(productId, orderlineId) {
        var serviceLines = _.filter(me.order.get('lines').models, function (l) {
          return l.has('relatedLines') && l.get('relatedLines').length > 0 && !l.get('originalOrderLineId') //
          && l.get('product').id === productId && l.get('relatedLines')[0].orderlineId === orderlineId;
        });
        return serviceLines;
      }

      function adjustNotGroupedServices(line, qty) {
        if (line.get('product').get('quantityRule') === 'PP' && !line.get('groupService')) {
          var qtyService = OB.DEC.abs(qty),
              qtyLineServ = qty > 0 ? 1 : -1;

          // Split/Remove services lines
          var siblingServicesLines = getSiblingServicesLines(line.get('product').id, line.get('relatedLines')[0].orderlineId);
          if (!me.order.get('deleting') && siblingServicesLines.length < qtyService) {
            var i, p, newLine;
            for (i = 0; i < qtyService - siblingServicesLines.length; i++) {
              p = line.get('product').clone();
              p.set('groupProduct', false);
              newLine = me.order.createLine(p, qtyLineServ);
              newLine.set('relatedLines', siblingServicesLines[0].get('relatedLines'));
              newLine.set('groupService', false);
            }
          } else if (siblingServicesLines.length > qtyService) {
            linesToRemove = OB.UTIL.mergeArrays(linesToRemove, _.initial(siblingServicesLines, qtyService));
          }

          return qtyLineServ;
        }
        return qty;
      }

      if (!this.order.get('notApprove')) {
        // First check if there is any service modified to negative quantity amount in order to know if approval will be required
        var prod, i, j, l, newqtyplus, newqtyminus, serviceLines, positiveLines, negativeLines, newRelatedLines;
        for (k = 0; k < this.order.get('lines').length; k++) {
          line = this.order.get('lines').models[k];
          prod = line.get('product');
          newqtyplus = 0;
          newqtyminus = 0;
          serviceLines = [];
          positiveLines = [];
          negativeLines = [];
          newRelatedLines = [];

          if (line.has('relatedLines') && line.get('relatedLines').length > 0 && !line.get('originalOrderLineId')) {

            serviceLines = getServiceLines(line);

            for (i = 0; i < serviceLines.length; i++) {
              newRelatedLines = OB.UTIL.mergeArrays(newRelatedLines, (serviceLines[i].get('relatedLines') || []));
            }
            for (j = 0; j < newRelatedLines.length; j++) {
              l = me.order.get('lines').get(newRelatedLines[j].orderlineId);
              if (l && l.get('qty') > 0) {
                newqtyplus += l.get('qty');
                positiveLines.push(l);
              } else if (l && l.get('qty') < 0) {
                newqtyminus += l.get('qty');
                negativeLines.push(l);
              }
            }

            if (prod.get('quantityRule') === 'UQ') {
              newqtyplus = (newqtyplus ? 1 : 0);
              newqtyminus = (newqtyminus ? -1 : 0);
            }

            for (i = 0; i < serviceLines.length; i++) {
              l = serviceLines[i];
              if (l.get('qty') > 0 && serviceLines.length === 1 && newqtyminus) {
                if (!l.get('product').get('returnable')) { // Cannot add not returnable service to a negative product
                  me.order.get('lines').remove(l);
                  OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_UnreturnableProduct'), OB.I18N.getLabel('OBPOS_UnreturnableProductMessage', [l.get('product').get('_identifier')]));
                  this.updating = false;
                  return;
                }
                if (!approvalNeeded) {
                  approvalNeeded = true;
                }
                servicesToApprove += '<br>' + OB.I18N.getLabel('OBMOBC_Character')[1] + ' ' + line.get('product').get('_identifier');
              }
            }
          }
        }
      }

      function fixServiceOrderLines(approved) {
        linesToRemove = [];
        me.order.get('lines').forEach(function (line) {
          var prod = line.get('product'),
              newLine, i, j, l, rlp, rln, deferredLines, deferredQty, notDeferredRelatedLines, positiveLine, newqtyplus = 0,
              newqtyminus = 0,
              serviceLines = [],
              positiveLines = [],
              negativeLines = [],
              newRelatedLines = [];

          if (line.has('relatedLines') && line.get('relatedLines').length > 0 && !line.get('originalOrderLineId')) {

            serviceLines = getServiceLines(line);

            for (i = 0; i < serviceLines.length; i++) {
              newRelatedLines = OB.UTIL.mergeArrays(newRelatedLines, (serviceLines[i].get('relatedLines') || []));
            }
            for (j = 0; j < newRelatedLines.length; j++) {
              l = me.order.get('lines').get(newRelatedLines[j].orderlineId);
              if (l && l.get('qty') > 0) {
                newqtyplus += l.get('qty');
                positiveLines.push(l);
              } else if (l && l.get('qty') < 0) {
                newqtyminus += l.get('qty');
                negativeLines.push(l);
              }
            }
            rlp = filterLines(newRelatedLines, positiveLines);

            rln = filterLines(newRelatedLines, negativeLines);

            if (prod.get('quantityRule') === 'UQ') {
              newqtyplus = (newqtyplus ? 1 : 0);
              newqtyminus = (newqtyminus ? -1 : 0);
            }

            serviceLines.forEach(function (l) {
              if (l.get('qty') > 0) {
                if (serviceLines.length === 1 && newqtyminus && newqtyplus) {
                  deferredLines = l.get('relatedLines').filter(function getDeferredServices(relatedLine) {
                    return relatedLine.deferred === true;
                  });
                  if (deferredLines) {
                    deferredQty = 0;
                    if (line.get('product').get('quantityRule') === 'PP') {
                      _.each(deferredLines, function (deferredLine) {
                        deferredQty += deferredLine.qty;
                      });
                    }
                    rlp = OB.UTIL.mergeArrays(rlp, (deferredLines || []));
                    newqtyplus += deferredQty;
                  }
                  newLine = me.order.createLine(prod, newqtyminus);
                  newLine.set('relatedLines', rln);
                  newLine.set('groupService', newLine.get('product').get('groupProduct'));
                  l.set('relatedLines', rlp);
                  l.set('qty', newqtyplus);
                } else if (serviceLines.length === 1 && newqtyminus) {
                  if (approved) {
                    deferredLines = l.get('relatedLines').filter(function getDeferredServices(relatedLine) {
                      return relatedLine.deferred === true;
                    });
                    if (deferredLines.length) {
                      deferredQty = 0;
                      if (line.get('product').get('quantityRule') === 'PP') {
                        _.each(deferredLines, function (deferredLine) {
                          deferredQty += deferredLine.qty;
                        });
                      } else {
                        deferredQty = 1;
                      }
                      newLine = me.order.createLine(prod, deferredQty);
                      newLine.set('relatedLines', deferredLines);
                      newLine.set('qty', deferredQty);
                    }
                    l.set('relatedLines', rln);
                    newqtyminus = adjustNotGroupedServices(l, newqtyminus, linesToRemove);
                    l.set('qty', newqtyminus);
                  } else {
                    linesToRemove.push(l);
                  }
                } else if (newqtyplus && !me.positiveLineUpdated) {
                  me.positiveLineUpdated = true;
                  deferredLines = l.get('relatedLines').filter(function getDeferredServices(relatedLine) {
                    return relatedLine.deferred === true;
                  });
                  rlp = OB.UTIL.mergeArrays(rlp, (deferredLines || []));
                  l.set('relatedLines', rlp);
                  if (line.get('product').get('quantityRule') === 'PP') {
                    if (line.get('groupService')) {
                      _.each(deferredLines, function (deferredLine) {
                        newqtyplus += deferredLine.qty;
                      });
                    } else {
                      newqtyplus = adjustNotGroupedServices(line, newqtyplus, linesToRemove);
                    }
                  }
                  l.set('qty', newqtyplus);
                } else if (newqtyplus && newqtyminus && me.positiveLineUpdated) {
                  newLine = me.order.createLine(prod, newqtyminus);
                  newLine.set('relatedLines', rln);
                  newLine.set('groupService', newLine.get('product').get('groupProduct'));
                  me.order.get('lines').remove(l);
                } else {
                  deferredLines = l.get('relatedLines').filter(function getDeferredServices(relatedLine) {
                    return relatedLine.deferred === true;
                  });
                  if (!deferredLines.length) {
                    me.order.get('lines').remove(l);
                  } else {
                    deferredQty = 0;
                    if (line.get('product').get('quantityRule') === 'PP' && line.get('product').get('groupProduct')) {
                      _.each(deferredLines, function (deferredLine) {
                        deferredQty += deferredLine.qty;
                      });
                    } else {
                      deferredQty = 1;
                    }
                    l.set('relatedLines', deferredLines);
                    l.set('qty', deferredQty);
                  }
                }
              } else {
                if (serviceLines.length === 1 && newqtyminus && newqtyplus) {
                  newLine = me.order.createLine(prod, newqtyplus);
                  newLine.set('relatedLines', rlp);
                  l.set('relatedLines', rln);
                  l.set('qty', newqtyminus);
                } else if (serviceLines.length === 1 && newqtyplus) {
                  l.set('relatedLines', rlp);
                  newqtyplus = adjustNotGroupedServices(l, newqtyplus, linesToRemove);
                  l.set('qty', newqtyplus);
                } else if (newqtyminus && !me.negativeLineUpdated) {
                  me.negativeLineUpdated = true;
                  l.set('relatedLines', rln);
                  newqtyminus = adjustNotGroupedServices(l, newqtyminus, linesToRemove);
                  l.set('qty', newqtyminus);
                } else if (newqtyplus && newqtyminus && me.negativeLineUpdated) {
                  positiveLine = me.order.get('lines').filter(function getLine(currentLine) {
                    return currentLine.get('product').id === l.get('product').id && currentLine.get('qty') > 0;
                  });
                  if (positiveLine) {
                    deferredLines = l.get('relatedLines').filter(function getDeferredServices(relatedLine) {
                      return relatedLine.deferred === true;
                    });
                    rlp = OB.UTIL.mergeArrays(rlp, (deferredLines || []));
                    positiveLine.set('relatedLines', rlp);
                    positiveLine.set('qty', newqtyplus);
                  } else {
                    newLine = me.order.createLine(prod, newqtyplus);
                    newLine.set('relatedLines', rlp);
                  }
                  me.order.get('lines').remove(l);
                } else {
                  deferredLines = l.get('relatedLines').filter(function getDeferredServices(relatedLine) {
                    return relatedLine.deferred === true;
                  });
                  if (!deferredLines.length && !l.get('obposIsDeleted')) {
                    me.order.get('lines').remove(l);
                  }
                }
              }
            });
            me.positiveLineUpdated = false;
            me.negativeLineUpdated = false;

            notDeferredRelatedLines = line.get('relatedLines').filter(function getNotDeferredLines(rl) {
              if (OB.UTIL.isNullOrUndefined(rl.deferred)) {
                return false;
              }
              return !rl.deferred;
            });
            if (!line.get('groupService') && notDeferredRelatedLines.length > 1) {
              notDeferredRelatedLines.forEach(function (rl) {
                newLine = me.order.createLine(prod, me.order.get('lines').get(rl.orderlineId).get('qty'));
                newLine.set('relatedLines', [rl]);
                newLine.set('groupService', false);
              });
              me.order.get('lines').remove(line);
            }
          }
        });
        linesToRemove.forEach(function (l) {
          me.order.get('lines').remove(l);
          OB.UTIL.showWarning(OB.I18N.getLabel('OBPOS_DeletedService', [l.get('product').get('_identifier')]));
        });
        me.order.setUndo('FixOrderLines', oldUndo);
        me.updating = false;
        me.order.trigger('updateServicePrices');
      }

      if (approvalNeeded) {
        OB.UTIL.Approval.requestApproval(
        OB.MobileApp.view.$.containerWindow.getRoot().model, [{
          approval: 'OBPOS_approval.returnService',
          message: 'OBPOS_approval.returnService',
          params: [servicesToApprove]
        }], function (approved, supervisor, approvalType) {
          if (approved) {
            fixServiceOrderLines(true);
          } else {
            fixServiceOrderLines(false);
          }
        });
      } else {
        fixServiceOrderLines(true);
      }
    }, this);
    this.order.on('calculatedReceipt updateServicePrices', function () {
      var me = this,
          setPriceCallback, changePriceCallback, handleError, serviceLines, i;

      if (!this.order.get('hasServices') || this.updating || this.order.get('preventServicesUpdate') || !this.order.get('isEditable') || (this.order.get('isQuotation') && this.order.get('hasbeenpaid') === 'Y') || OB.UTIL.ProcessController.isProcessActive('calculateReceipt')) {
        return;
      }

      setPriceCallback = function (line, newprice, priceChanged) {
        OB.UTIL.HookManager.executeHooks('OBPOS_ServicePriceRules_PreSetPriceToLine', {
          newprice: newprice,
          line: line,
          priceChanged: priceChanged
        }, function (args) {
          if (args.newprice !== line.get('price')) {
            me.order.setPrice(args.line, args.newprice, {
              setUndo: false
            });
          }
        });
      };

      changePriceCallback = function (line, newprice) {
        setPriceCallback(line, newprice, true);
      };

      handleError = function (line, message) {
        if (OB.MobileApp.view.openedPopup === null) {
          OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_ErrorGettingServicePrice'), OB.I18N.getLabel(message, [line.get('product').get('_identifier')]), [{
            label: OB.I18N.getLabel('OBMOBC_LblOk'),
            isConfirmButton: true
          }], {
            onHideFunction: function () {
              me.order.get('lines').remove(line);
              me.order.set('undo', null);
              me.$.totalReceiptLine.renderQty();
            }
          });
        }
      };

      serviceLines = this.order.get('lines').filter(function (l) {
        return l.get('product').get('productType') === 'S';
      });

      for (i = 0; i < serviceLines.length; i++) {
        var line = serviceLines[i];
        if (line.get('product').get('isPriceRuleBased')) {
          OB.UTIL.getCalculatedPriceForService(line, line.get('product'), line.get('relatedLines'), line.get('qty'), changePriceCallback, handleError);
        } else {
          setPriceCallback(line, line.get('price'), false);
        }
      }
    }, this);
    this.order.on('change:selectedPayment', function (model) {
      OB.UTIL.HookManager.executeHooks('OBPOS_PaymentSelected', {
        order: this.order,
        paymentSelected: OB.MobileApp.model.paymentnames[model.get('selectedPayment')]
      });
    }, this);
  }
});
enyo.kind({
  name: 'OB.UI.MultiOrderView',
  published: {
    order: null
  },
  events: {
    onChangeTotal: ''
  },
  components: [{
    kind: 'OB.UI.ScrollableTable',
    name: 'listMultiOrderLines',
    scrollAreaMaxHeight: '450px',
    renderLine: 'OB.UI.RenderMultiOrdersLine',
    renderEmpty: 'OB.UI.RenderMultiOrdersLineEmpty',
    //defined on redenderorderline.js
    listStyle: 'edit'
  }, {
    tag: 'ul',
    classes: 'unstyled',
    components: [{
      tag: 'li',
      components: [{
        kind: 'OB.UI.TotalMultiReceiptLine',
        name: 'totalMultiReceiptLine'
      }]
    }, {
      tag: 'li',
      components: [{
        style: 'padding: 10px; border-top: 1px solid #cccccc; height: 40px;',
        components: [{
          kind: 'btninvoice',
          name: 'multiOrder_btninvoice',
          showing: false
        }, {
          style: 'clear: both;'
        }]
      }]
    }]
  }],
  listMultiOrders: null,
  init: function (model) {
    this.multiOrders = model.get('multiOrders');
    this.orderList = this.multiOrders.get('multiOrdersList');
    this.orderListPayment = this.multiOrders.get('payments');

    this.total = 0;
    this.listMultiOrders = new Backbone.Collection();
    this.$.listMultiOrderLines.setCollection(this.listMultiOrders);

    this.multiOrders.on('change:additionalInfo', function (changedModel) {
      this.$.multiOrder_btninvoice.setShowing(changedModel.get('additionalInfo') === 'I');
    }, this);
    this.multiOrders.on('change:total', function (model) {
      this.doChangeTotal({
        newTotal: model.get('total')
      });
    }, this);
    this.orderList.on('reset add remove amountToLayaway', function () {
      var total = OB.DEC.Zero,
          prepayment = OB.DEC.Zero,
          prepaymentLimit = OB.DEC.Zero,
          existingPayment = OB.DEC.Zero,
          amountToLayaway = OB.DEC.Zero;
      _.each(this.orderList.models, function (order) {
        if (OB.UTIL.isNullOrUndefined(order.get('amountToLayaway'))) {
          total = OB.DEC.add(total, order.getPending());
        } else {
          total = OB.DEC.add(total, order.get('amountToLayaway'));
          amountToLayaway = OB.DEC.add(amountToLayaway, order.get('amountToLayaway'));
        }
        prepayment = OB.DEC.add(prepayment, order.get('obposPrepaymentamt'));
        if (order.get('amountToLayaway') && order.get('amountToLayaway') < order.getGross()) {
          prepaymentLimit = OB.DEC.add(prepaymentLimit, order.get('obposPrepaymentlaylimitamt'));
        } else {
          prepaymentLimit = OB.DEC.add(prepaymentLimit, order.get('obposPrepaymentlimitamt'));
        }
        existingPayment = OB.DEC.add(existingPayment, order.get('payment'));
      });
      this.total = total;
      this.prepayment = prepayment;
      this.prepaymentLimit = prepaymentLimit;
      this.amountToLayaway = amountToLayaway;
      this.existingPayment = existingPayment;
      this.multiOrders.set('total', this.total);
      this.multiOrders.set('obposPrepaymentamt', this.prepayment);
      this.multiOrders.set('obposPrepaymentlimitamt', this.prepaymentLimit);
      this.multiOrders.set('amountToLayaway', this.amountToLayaway);
      this.multiOrders.set('existingPayment', this.existingPayment);
      this.$.totalMultiReceiptLine.renderTotal(this.total);
      this.listMultiOrders.reset(this.orderList.models);
      if (model.get('leftColumnViewManager').isMultiOrder()) {
        this.doChangeTotal({
          newTotal: this.total
        });
      }
      this.$.totalMultiReceiptLine.renderQty(this.orderList.length);
    }, this);
    this.multiOrders.on('change:selectedPayment', function (model) {
      OB.UTIL.HookManager.executeHooks('OBPOS_PayOpenTicketsPaymentSelected', {
        order: OB.MobileApp.view.$.containerWindow.getRoot().model.get('multiOrders'),
        paymentSelected: OB.MobileApp.model.paymentnames[model.get('selectedPayment')]
      });
    }, this);
    this.orderListPayment.on('add remove', function () {
      OB.UTIL.localStorage.setItem('multiOrdersPayment', JSON.stringify(this.multiOrders.get('payments').toJSON()));
    }, this);
  },
  initComponents: function () {
    this.inherited(arguments);
  },
  destroyComponents: function () {
    this.inherited(arguments);
    if (this.multiOrders) {
      this.multiOrders.off('change:additionalInfo', null, this);
      this.multiOrders.off('change:total', null, this);
    }
    if (this.orderList) {
      this.orderList.off('reset add remove amountToLayaway', null, this);
    }
    if (this.orderListPayment) {
      this.orderListPayment.off('add remove', null, this);
    }
  }
});