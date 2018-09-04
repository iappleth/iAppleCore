/*
 ************************************************************************************
 * Copyright (C) 2013-2018 Openbravo S.L.U.
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
  classes: 'row-fluid span12',
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
  style: 'border-bottom: 1px solid #cccccc;',
  components: [{
    name: 'receiptLabels'
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

  changeOrderTypeDocumentNo: function (model) {
    if (model.get('orderType') === 1) {
      this.addStyles('width: 50%; color: #f8941d;');
      if (model.get('isPaid') !== true) {
        this.setContent(OB.I18N.getLabel('OBPOS_ToBeReturned'));
        this.show();
      }
    } else if (model.get('orderType') === 2 && !model.get('replacedorder')) {
      this.addStyles('width: 60%; color: lightblue;');
      this.setContent(OB.I18N.getLabel('OBPOS_ToBeLaidaway'));
      this.show();
      //We have to ensure that there is not another handler showing this div
    } else if (model.get('orderType') === 2 && model.get('replacedorder')) {
      this.addStyles('width: 90%; color: #5353C5; line-height:30px');
      this.setContent(OB.I18N.getLabel('OBPOS_CancelAndReplaceOf', [model.get('replacedorder_documentNo')]));
      this.show();
      //We have to ensure that there is not another handler showing this div
    } else if (model.get('orderType') === 3) {
      this.addStyles('width: 60%; color: lightblue;');
      if (model.get('cancelLayaway')) {
        this.setContent(OB.I18N.getLabel('OBPOS_CancelLayaway'));
      } else {
        this.setContent(OB.I18N.getLabel('OBPOS_VoidLayaway'));
      }
      this.show();
      //We have to ensure that there is not another handler showing this div
    } else if (model.get('isLayaway')) {
      this.addStyles('width: 50%; color: lightblue;');
      this.setContent(OB.I18N.getLabel('OBPOS_LblLayaway'));
      this.show();
      //We have to ensure that there is not another handler showing this div
    } else if (this.content === OB.I18N.getLabel('OBPOS_ToBeReturned') || this.content === OB.I18N.getLabel('OBPOS_ToBeLaidaway') || this.content === OB.I18N.getLabel('OBPOS_VoidLayaway') || this.content === OB.I18N.getLabel('OBPOS_CancelLayaway') || (this.content.indexOf(OB.I18N.getLabel('OBPOS_CancelReplace')) !== -1 && !model.get('replacedorder'))) {
      this.hide();
    }
  },

  changeIsQuotation: function (model) {
    if (model.get('isQuotation')) {
      this.addStyles('width: 100%; color: #f8941d;');
      if (model.get('hasbeenpaid') === 'Y') {
        this.setContent(OB.I18N.getLabel('OBPOS_QuotationUnderEvaluation'));
      } else {
        this.setContent(OB.I18N.getLabel('OBPOS_QuotationDraft'));
      }
      this.show();
    } else {
      // We have to ensure that there is not another handler showing this div
      if (this.content === OB.I18N.getLabel('OBPOS_QuotationUnderEvaluation') || this.content === OB.I18N.getLabel('OBPOS_QuotationDraft')) {
        this.hide();
      }
    }
  },

  changeHasbeenpaid: function (model) {
    if (model.get('isQuotation') && model.get('hasbeenpaid') === 'Y' && !model.get('obposIsDeleted') && this.content && (this.content === OB.I18N.getLabel('OBPOS_QuotationNew') || this.content === OB.I18N.getLabel('OBPOS_QuotationDraft'))) {
      this.setContent(OB.I18N.getLabel('OBPOS_QuotationUnderEvaluation'));
    } else if (model.get('isQuotation') && model.get('hasbeenpaid') === 'N' && !model.get('isLayaway')) {
      this.setContent(OB.I18N.getLabel('OBPOS_QuotationDraft'));
    }
  },

  changeIsPaidPaidOnCreditIsQuotationDocumentNoPaidPartiallyOnCredit: function (model) {
    if (model.get('isPaid') === true && !model.get('isQuotation')) {
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
      //We have to ensure that there is not another handler showing this div
    } else if (this.content === OB.I18N.getLabel('OBPOS_paid') || this.content === OB.I18N.getLabel('OBPOS_paidReturn') || this.content === OB.I18N.getLabel('OBPOS_paidOnCredit') || this.content === OB.I18N.getLabel('OBPOS_paidPartiallyOnCredit', [OB.I18N.formatCurrency(model.get('creditAmount'))]) || (this.content.indexOf(OB.I18N.getLabel('OBPOS_CancelReplace')) !== -1 && !model.get('replacedorder')) || this.content === OB.I18N.getLabel('OBPOS_Cancelled')) {
      this.hide();
    }
  },

  changeIsLayaway: function (model) {
    if (model.get('isLayaway') === true) {
      this.addStyles('width: 50%; color: lightblue;');
      this.setContent(OB.I18N.getLabel('OBPOS_LblLayaway'));
      this.show();
      //We have to ensure that there is not another handler showing this div
    } else if (this.content === OB.I18N.getLabel('OBPOS_LblLayaway')) {
      this.hide();
    }
  },

  changeReplacedorder: function (model) {
    if (model.get('replacedorder')) {
      this.addStyles('width: 90%; color: #5353C5; line-height:30px');
      this.setContent(OB.I18N.getLabel('OBPOS_CancelAndReplaceOf', [model.get('replacedorder_documentNo')]));
      this.show();
    } else if (model.get('orderType') === 2) {
      this.addStyles('width: 60%; color: lightblue;');
      this.setContent(OB.I18N.getLabel('OBPOS_ToBeLaidaway'));
      this.show();
    } else if (this.content.indexOf(OB.I18N.getLabel('OBPOS_CancelReplace')) !== -1) {
      this.hide();
    }
  }

});

enyo.kind({
  name: 'OB.UI.OrderView',
  published: {
    order: null
  },
  events: {
    onReceiptLineSelected: ''
  },
  handlers: {
    onCheckBoxBehaviorForTicketLine: 'checkBoxBehavior',
    onAllTicketLinesChecked: 'allTicketLinesChecked',
    onToggleSelectionTable: 'toggleSelectionTable',
    onMultiSelectAllTable: 'multiSelectAllTable',
    onTableMultiSelectedItems: 'tableMultiSelectedItems'
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
    if (OB.MobileApp.model.get('terminal').terminalType.showtaxbreakdown) {
      var taxList = new Backbone.Collection();
      var taxes = this.order.get('taxes');
      var empty = true,
          prop;

      for (prop in taxes) {
        if (taxes.hasOwnProperty(prop) && (taxes[prop].net !== 0 || taxes[prop].amount !== 0)) {
          taxList.add(new OB.Model.TaxLine(taxes[prop]));
          empty = false;
        }
      }
      if (empty) {
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
    this.order.on('change:iscancelled', function () {
      this.order.get('lines').trigger('reset');
    }, this);
    this.order.on('change:cancelLayaway change:voidLayaway', function (model) {
      if (model.get('cancelLayaway') || model.get('voidLayaway')) {
        this.$.listPaymentLines.hide();
        this.$.paymentBreakdown.hide();
      }
    }, this);
    this.order.on('change:gross change:net', function (model) {
      if (model.get('orderType') !== 3) {
        this.$.totalReceiptLine.renderTotal(model.getTotal());
        this.$.totalTaxLine.renderTax(OB.DEC.sub(model.getTotal(), model.getNet()));
      }
    }, this);
    this.order.on('paintTaxes', function () {
      if (this.order.get('orderType') !== 3) {
        this.setTaxes();
      }
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
    this.order.on('change:orderType change:documentNo', function (model) {
      this.$.divText.changeOrderTypeDocumentNo(model);
    }, this);
    this.order.on('change:generateInvoice', function (model) {
      if (model.get('generateInvoice')) {
        this.$.divbtninvoice.show();
      } else {
        this.$.divbtninvoice.hide();
      }
    }, this);
    this.order.on('change:isQuotation', function (model) {
      this.$.divText.changeIsQuotation(model);
      if (model.get('isQuotation')) {
        this.$.listOrderLines.children[4].children[0].setContent(OB.I18N.getLabel('OBPOS_QuotationNew'));
      } else {
        this.$.listOrderLines.children[4].children[0].setContent(OB.I18N.getLabel('OBPOS_ReceiptNew'));
      }
    }, this);
    this.order.on('change:hasbeenpaid', function (model) {
      this.$.divText.changeHasbeenpaid(model);
    }, this);
    this.order.on('change:isPaid change:paidOnCredit change:isQuotation change:documentNo change:paidPartiallyOnCredit change:iscancelled', function (model) {
      this.$.divText.changeIsPaidPaidOnCreditIsQuotationDocumentNoPaidPartiallyOnCredit(model);
      if (model.get('isPaid') === true && !model.get('isQuotation')) {
        this.$.listPaymentLines.show();
        this.$.paymentBreakdown.show();
        //We have to ensure that there is not another handler showing this div
      } else if (this.$.divText.content === OB.I18N.getLabel('OBPOS_paid') || this.$.divText.content === OB.I18N.getLabel('OBPOS_paidReturn') || this.$.divText.content === OB.I18N.getLabel('OBPOS_paidOnCredit') || this.$.divText.content === OB.I18N.getLabel('OBPOS_paidPartiallyOnCredit', [OB.I18N.formatCurrency(model.get('creditAmount'))]) || (this.$.divText.content.indexOf(OB.I18N.getLabel('OBPOS_CancelReplace')) !== -1 && !model.get('replacedorder')) || this.$.divText.content === OB.I18N.getLabel('OBPOS_Cancelled')) {
        this.$.listPaymentLines.hide();
        this.$.paymentBreakdown.hide();
      }
    }, this);
    this.order.on('change:isLayaway', function (model) {
      this.$.divText.changeIsLayaway(model);
      if (model.get('isLayaway') === true) {
        this.$.listPaymentLines.show();
        this.$.paymentBreakdown.show();
        //We have to ensure that there is not another handler showing this div
      } else if (this.$.divText.content === OB.I18N.getLabel('OBPOS_LblLayaway')) {
        this.$.listPaymentLines.hide();
        this.$.paymentBreakdown.hide();
      }
    }, this);
    this.order.on('change:replacedorder', function (model) {
      this.$.divText.changeReplacedorder(model);
      if (model.get('replacedorder')) {
        this.$.listPaymentLines.show();
        this.$.paymentBreakdown.show();
      } else if (model.get('orderType') === 2) {
        this.$.listPaymentLines.hide();
        this.$.paymentBreakdown.hide();
      } else if (this.$.divText.content.indexOf(OB.I18N.getLabel('OBPOS_CancelReplace')) !== -1) {
        this.$.listPaymentLines.hide();
        this.$.paymentBreakdown.hide();
      }
    }, this);

    // Change Document No based on return lines
    this.order.get('lines').on('add change:qty change:relatedLines updateRelations', function () {
      if (this.order.get('isEditable') && !this.order.get('isModified') && !this.order.get('isLayaway') && !this.order.get('isQuotation') && !this.order.get('doCancelAndReplace')) {
        var negativeLinesLength = _.filter(this.order.get('lines').models, function (line) {
          return line.get('qty') < 0;
        }).length;
        if (negativeLinesLength > 0 && negativeLinesLength === this.order.get('lines').models.length) {
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

      if (!this.order.get('hasServices') || this.updating || this.order.get('preventServicesUpdate')) {
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
        me.order.get('lines').trigger('updateServicePrices');
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
    this.order.on('change:net change:gross updateServicePrices', function () {
      var me = this,
          handleError;

      handleError = function (line, message) {
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
      };

      if (!this.order.get('hasServices') || this.updating || this.order.get('preventServicesUpdate') || (this.order.get('isQuotation') && this.order.get('hasbeenpaid') === 'Y')) {
        return;
      }

      this.order.get('lines').forEach(function (line) {
        var prod = line.get('product'),
            amountBeforeDiscounts = 0,
            amountAfterDiscounts = 0,
            rangeAmountBeforeDiscounts = 0,
            rangeAmountAfterDiscounts = 0,
            relatedQuantity = 0;
        if (prod.get('productType') === 'S' && prod.get('isPriceRuleBased') && !line.get('originalOrderLineId') && !line.get('obposIsDeleted')) {
          var criteria = {};
          line.get('relatedLines').forEach(function (rl) {
            var l = me.order.get('lines').get(rl.orderlineId);
            if (l) {
              relatedQuantity += l.get('qty');
            } else {
              relatedQuantity += rl.qty;
            }
            if (me.order.get('priceIncludesTax')) {
              if (l) {
                amountBeforeDiscounts += Math.abs(l.get('gross'));
                amountAfterDiscounts += Math.abs(l.get('gross') - _.reduce(l.get('promotions'), function (memo, promo) {
                  return memo + promo.amt;
                }, 0));
                if (prod.get('quantityRule') === 'PP') {
                  rangeAmountBeforeDiscounts += Math.abs(OB.DEC.div(l.get('gross'), l.get('qty')));
                  rangeAmountAfterDiscounts += Math.abs(OB.DEC.div(l.get('gross') - _.reduce(l.get('promotions'), function (memo, promo) {
                    return memo + promo.amt;
                  }, 0), l.get('qty')));
                }
              } else {
                amountBeforeDiscounts += Math.abs(rl.gross);
                amountAfterDiscounts += Math.abs(rl.gross - _.reduce(rl.promotions, function (memo, promo) {
                  return memo + promo.amt;
                }, 0));
                if (prod.get('quantityRule') === 'PP') {
                  rangeAmountBeforeDiscounts += Math.abs(OB.DEC.div(rl.gross, rl.qty));
                  rangeAmountAfterDiscounts += Math.abs(OB.DEC.div(rl.gross - _.reduce(rl.promotions, function (memo, promo) {
                    return memo + promo.amt;
                  }, 0), rl.qty));
                }
              }
            } else {
              if (l) {
                amountBeforeDiscounts += Math.abs(l.get('net'));
                amountAfterDiscounts += Math.abs(l.get('net') - _.reduce(l.get('promotions'), function (memo, promo) {
                  return memo + promo.amt;
                }, 0));
                if (prod.get('quantityRule') === 'PP') {
                  rangeAmountBeforeDiscounts += Math.abs(OB.DEC.div(l.get('net'), l.get('qty')));
                  rangeAmountAfterDiscounts += Math.abs(OB.DEC.div(l.get('net') - _.reduce(l.get('promotions'), function (memo, promo) {
                    return memo + promo.amt;
                  }, 0), l.get('qty')));
                }
              } else {
                amountBeforeDiscounts += Math.abs(rl.net);
                amountAfterDiscounts += Math.abs(rl.net - _.reduce(rl.promotions, function (memo, promo) {
                  return memo + promo.amt;
                }, 0));
                if (prod.get('quantityRule') === 'PP') {
                  rangeAmountBeforeDiscounts += Math.abs(OB.DEC.div(rl.net, rl.qty));
                  rangeAmountAfterDiscounts += Math.abs(OB.DEC.div(rl.net - _.reduce(rl.promotions, function (memo, promo) {
                    return memo + promo.amt;
                  }, 0), rl.qty));
                }
              }
            }
          });
          if (prod.get('quantityRule') === 'UQ') {
            rangeAmountBeforeDiscounts = amountBeforeDiscounts;
            rangeAmountAfterDiscounts = amountAfterDiscounts;
          }
          if (OB.MobileApp.model.hasPermission('OBPOS_remote.product', true)) {
            criteria.remoteFilters = [];
            criteria.remoteFilters.push({
              columns: ['product'],
              operator: 'equals',
              value: line.get('product').get('id'),
              isId: true
            });
            criteria.remoteFilters.push({
              columns: [],
              operator: 'filter',
              value: 'ServicePriceRuleVersion_DateFilter',
              params: []
              //TODO: _limit -1
            });
          } else {
            criteria._whereClause = "where product = '" + line.get('product').get('id') + "' and validFromDate <= date('now')";
            criteria._orderByClause = 'validFromDate desc';
            criteria._limit = 1;
          }
          OB.Dal.find(OB.Model.ServicePriceRuleVersion, criteria, function (sprvs) {
            var priceruleVersion;
            if (sprvs && sprvs.length > 0) {
              priceruleVersion = sprvs.at(0);
              if (line) {
                line.set('priceruleVersion', priceruleVersion);
              }
              OB.Dal.get(OB.Model.ServicePriceRule, priceruleVersion.get('servicePriceRule'), function (spr) {
                if (spr.get('ruletype') === 'P') {
                  var amount, newprice, oldprice = line.get('priceList');
                  if (spr.get('afterdiscounts')) {
                    amount = amountAfterDiscounts * spr.get('percentage') / 100;
                  } else {
                    amount = amountBeforeDiscounts * spr.get('percentage') / 100;
                  }
                  if (!line.get('groupService')) {
                    amount = amount / relatedQuantity;
                  }
                  newprice = OB.Utilities.Number.roundJSNumber(oldprice + amount / line.get('qty'), 2);
                  me.order.setPrice(line, newprice, {
                    setUndo: false
                  });
                } else { //ruletype = 'R'
                  var rangeCriteria = {};
                  if (OB.MobileApp.model.hasPermission('OBPOS_remote.product', true)) {
                    rangeCriteria.remoteFilters = [];
                    rangeCriteria.remoteFilters.push({
                      columns: ['servicepricerule'],
                      operator: 'equals',
                      value: spr.get('id'),
                      isId: true
                    });
                    rangeCriteria.remoteFilters.push({
                      columns: [],
                      operator: 'filter',
                      value: 'ServicePriceRuleRange_AmountFilter',
                      params: [spr.get('afterdiscounts') ? rangeAmountAfterDiscounts : rangeAmountBeforeDiscounts]
                    });
                  } else {
                    rangeCriteria._whereClause = "where servicepricerule = '" + spr.get('id') + "' and (( amountUpTo >= " + (spr.get('afterdiscounts') ? rangeAmountAfterDiscounts : rangeAmountBeforeDiscounts) + ") or (amountUpTo is null))";
                    rangeCriteria._orderByClause = 'amountUpTo is null, amountUpTo';
                    rangeCriteria._limit = 1;
                  }
                  OB.Dal.find(OB.Model.ServicePriceRuleRange, rangeCriteria, function (sppr) {
                    var range, priceCriteria = {};
                    if (sppr && sppr.length > 0) {
                      range = sppr.at(0);
                      if (range.get('ruleType') === 'P') {
                        var amount, newprice, oldprice = line.get('priceList');
                        if (range.get('afterdiscounts')) {
                          amount = amountAfterDiscounts * range.get('percentage') / 100;
                        } else {
                          amount = amountBeforeDiscounts * range.get('percentage') / 100;
                        }
                        if (!line.get('groupService')) {
                          amount = amount / relatedQuantity;
                        }
                        newprice = OB.Utilities.Number.roundJSNumber(oldprice + amount / line.get('qty'), 2);
                        me.order.setPrice(line, newprice, {
                          setUndo: false
                        });
                      } else { //ruleType = 'F'
                        if (OB.MobileApp.model.hasPermission('OBPOS_remote.product', true)) {
                          priceCriteria.remoteFilters = [];
                          priceCriteria.remoteFilters.push({
                            columns: ['product'],
                            operator: 'equals',
                            value: prod.get('id'),
                            isId: true
                          });
                          priceCriteria.remoteFilters.push({
                            columns: ['priceList'],
                            operator: 'equals',
                            value: range.get('priceList'),
                            isId: true
                          });
                        } else {
                          priceCriteria.product = prod.get('id');
                          priceCriteria.priceList = range.get('priceList');
                        }
                        OB.Dal.find(OB.Model.ServicePriceRuleRangePrices, priceCriteria, function (price) {
                          var oldprice = line.get('priceList'),
                              newprice;
                          if (price && price.length > 0) {
                            newprice = OB.Utilities.Number.roundJSNumber(oldprice + price.at(0).get('listPrice'), 2);
                            me.order.setPrice(line, newprice, {
                              setUndo: false
                            });
                          } else {
                            handleError(line, 'OBPOS_ErrorPriceRuleRangePriceNotFound');
                          }
                        }, function () {
                          handleError(line, 'OBPOS_ErrorGettingPriceRuleRangePrice');
                        });
                      }
                    } else {
                      handleError(line, 'OBPOS_ErrorPriceRuleRangeNotFound');
                    }
                  }, function () {
                    handleError(line, 'OBPOS_ErrorGettingPriceRuleRange');
                  });
                }
              }, function () {
                handleError(line, 'OBPOS_ErrorGettingPriceRule');
              });
            } else {
              handleError(line, 'OBPOS_ErrorPriceRuleVersionNotFound');
            }
          }, function () {
            handleError(line, 'OBPOS_ErrorGettingPriceRuleVersion');
          });
        }
      });
    }, this);
    this.order.on('change:selectedPayment', function (model) {
      OB.UTIL.HookManager.executeHooks('OBPOS_PaymentSelected', {
        order: this.order,
        paymentSelected: OB.MobileApp.model.paymentnames[model.get('selectedPayment')]
      });
    }, this);
    this.order.on('calculatedReceipt', function () {
      var removedServices = [],
          servicesToBeDeleted = [];
      _.each(this.attributes.lines.models, function (line) {
        var totalAmountSelected = 0,
            minimumSelected = Infinity,
            maximumSelected = 0;
        if (line.has('relatedLines') && line.get('relatedLines').length > 0) {
          _.each(line.get('relatedLines'), function (relatedLine) {
            _.each(this.attributes.lines.models, function (line2) {
              if ((line2.id === relatedLine.orderlineId) && line2.get('qty') > 0) {
                var discountAmount = _.reduce(line2.get('promotions'), function (memo, promo) {
                  return memo + promo.amt;
                }, 0),
                    currentLinePrice = (line2.get('gross') - discountAmount) / line2.get('qty');
                totalAmountSelected += line2.get('gross') - discountAmount;
                if (currentLinePrice < minimumSelected) {
                  minimumSelected = currentLinePrice;
                }
                if (currentLinePrice > maximumSelected) {
                  maximumSelected = currentLinePrice;
                }
              }
            }, this);
          }, this);
        }
        if (((!line.has('deliveredQuantity') || line.get('deliveredQuantity') <= 0) && line.has('priceruleVersion') && line.get('priceruleVersion').maximum === undefined && line.get('priceruleVersion').minimum === undefined && ((line.get('product').get('quantityRule') === 'UQ' && ((line.get('priceruleVersion').has('maximum') && totalAmountSelected > line.get('priceruleVersion').get('maximum')) || (line.get('priceruleVersion').has('minimum') && totalAmountSelected < line.get('priceruleVersion').get('minimum')))) || (line.get('product').get('quantityRule') === 'PP' && ((line.get('priceruleVersion').has('maximum') && maximumSelected > line.get('priceruleVersion').get('maximum')) || (line.get('priceruleVersion').has('minimum') && minimumSelected < line.get('priceruleVersion').get('minimum'))))))) {
          servicesToBeDeleted.push(line);
        }
      }, this);
      removedServices.push(OB.I18N.getLabel('OBPOS_ServiceRemoved'));
      _.each(servicesToBeDeleted, function (line) {
        this.deleteLinesFromOrder([line]);
        removedServices.push(line.get('product').get('_identifier'));
      }, this);
      if (removedServices.length > 1) {
        OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_ServiceRemovedHeader'), removedServices);
      }
    }, this.order);
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
      this.total = _.reduce(this.orderList.models, function (memo, order) {
        return memo + ((!_.isUndefined(order.get('amountToLayaway')) && !_.isNull(order.get('amountToLayaway'))) ? order.get('amountToLayaway') : order.getPending());
      }, 0);
      this.multiOrders.set('total', this.total);
      this.$.totalMultiReceiptLine.renderTotal(this.total);
      this.listMultiOrders.reset(this.orderList.models);
      if (model.get('leftColumnViewManager').isMultiOrder()) {
        this.doChangeTotal({
          newTotal: this.total
        });
      }
      this.$.totalMultiReceiptLine.renderQty(this.orderList.length);
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