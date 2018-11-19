/*
 ************************************************************************************
 * Copyright (C) 2012-2018 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, enyo, _ */

enyo.kind({
  name: 'OB.UI.MenuReturn',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.return',
  events: {
    onShowDivText: '',
    onRearrangeEditButtonBar: ''
  },
  i18nLabel: 'OBPOS_LblReturn',
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments); // Manual dropdown menu closure
    this.model.get('order').setDocumentNo(true, false);
    this.doShowDivText({
      permission: this.permission,
      orderType: 1
    });
    if (OB.MobileApp.model.get('lastPaneShown') === 'payment') {
      this.model.get('order').trigger('scan');
    }
    this.doRearrangeEditButtonBar();
  },
  displayLogic: function () {
    var negativeLines = _.filter(this.model.get('order').get('lines').models, function (line) {
      return line.get('qty') < 0;
    }).length;
    if (!this.model.get('order').get('isQuotation')) {
      this.show();
    } else {
      this.hide();
      return;
    }
    if (negativeLines > 0) {
      this.hide();
      return;
    }
    if (this.model.get('order').get('isEditable') === false || this.model.get('order').get('orderType') === 2) {
      this.hide();
      return;
    }
    if (!_.find(OB.MobileApp.model.get('payments'), function (payment) {
      return payment.paymentMethod.refundable;
    })) {
      this.hide();
      return;
    }
    this.adjustVisibilityBasedOnPermissions();
  },
  init: function (model) {
    this.model = model;
    var receipt = model.get('order');
    receipt.on('change:isEditable change:isQuotation change:gross change:orderType change:replacedorder', function (changedModel) {
      this.displayLogic();
    }, this);
    this.model.get('leftColumnViewManager').on('change:currentView', function (changedModel) {
      if (changedModel.isOrder()) {
        this.displayLogic();
        return;
      }
      if (changedModel.isMultiOrder()) {
        this.setShowing(false);
        return;
      }
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuVoidLayaway',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.voidLayaway',
  events: {
    onShowDivText: '',
    onTabChange: ''
  },
  i18nLabel: 'OBPOS_VoidLayaway',
  tap: function () {
    var me = this;
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments); // Manual dropdown menu closure
    this.model.get('order').checkNotProcessedPayments(function () {
      OB.UTIL.HookManager.executeHooks('OBPOS_PreVoidLayaway', {
        context: me
      }, function (args) {
        if (args && args.cancelOperation) {
          return;
        }
        var order = me.model.get('order');
        OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_VoidLayawayLbl'), OB.I18N.getLabel('OBPOS_VoidLayawayConfirmation'), [{
          label: OB.I18N.getLabel('OBMOBC_LblOk'),
          isConfirmButton: true,
          action: function () {
            order.set('voidLayaway', true);
            order.trigger('voidLayaway');
          }
        }, {
          label: OB.I18N.getLabel('OBMOBC_LblCancel')
        }]);
      });
    });
  },
  displayLogic: function () {
    var me = this,
        i;
    this.hideVoidLayaway = [];

    this.show();
    this.adjustVisibilityBasedOnPermissions();
    if (this.model.get('order').get('isLayaway') && this.model.get('order').get('payments').length === 0) {
      OB.UTIL.HookManager.executeHooks('OBPOS_PreDisplayVoidLayaway', {
        context: this
      }, function (args) {
        for (i = 0; i < me.hideVoidLayaway.length; i++) {
          if (me.hideVoidLayaway[i]) {
            me.hide();
            break;
          }
        }
      });
    } else {
      this.hide();
    }
  },
  init: function (model) {
    this.model = model;
    var receipt = model.get('order');
    this.setShowing(false);
    receipt.on('change:isLayaway change:receiptLines change:orderType', function (model) {
      this.displayLogic();
    }, this);

    this.model.get('leftColumnViewManager').on('change:currentView', function (changedModel) {
      if (changedModel.isOrder()) {
        this.displayLogic();
        return;
      }
      if (changedModel.isMultiOrder()) {
        this.setShowing(false);
        return;
      }
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuReceiptLayaway',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.receiptLayaway',
  events: {
    onShowDivText: '',
    onRearrangeEditButtonBar: ''
  },
  i18nLabel: 'OBPOS_LblReceiptLayaway',
  tap: function () {
    var receiptAllowed = true;
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments); // Manual dropdown menu closure
    // check if this order has been voided previously
    if (this.model.get('order').get('orderType') === 3) {
      return;
    }

    var errorsConvertingLayawayToReceipt = [];

    if (!this.model.get('order').checkAllAttributesHasValue()) {
      errorsConvertingLayawayToReceipt.push('OBPOS_AllAttributesNeedValue');
    }

    enyo.forEach(this.model.get('order').get('payments').models, function (curPayment) {
      errorsConvertingLayawayToReceipt.push('OBPOS_LayawayHasPayment');
      return;
    }, this);

    if (errorsConvertingLayawayToReceipt.length === 0) {
      this.doShowDivText({
        permission: this.permission,
        orderType: 0
      });
    } else {
      errorsConvertingLayawayToReceipt.forEach(function (error) {
        OB.UTIL.showWarning(OB.I18N.getLabel(error));
      });
    }
    this.doRearrangeEditButtonBar();
  },
  displayLogic: function () {
    if (this.model.get('order').get('orderType') === 2) {
      this.show();
      this.adjustVisibilityBasedOnPermissions();
    } else {
      this.hide();
    }
  },
  init: function (model) {
    this.model = model;
    var receipt = model.get('order');
    this.setShowing(false);
    receipt.on('change:orderType', function (model) {
      this.displayLogic();
    }, this);
    receipt.on('change:isLayaway', function (model) {
      this.displayLogic();
    }, this);

    this.model.get('leftColumnViewManager').on('change:currentView', function (changedModel) {
      if (changedModel.isOrder()) {
        this.displayLogic();
        return;
      }
      if (changedModel.isMultiOrder()) {
        this.setShowing(false);
        return;
      }
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuCancelLayaway',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.cancelLayaway',
  events: {
    onShowDivText: '',
    onTabChange: ''
  },
  i18nLabel: 'OBPOS_CancelLayaway',
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments); // Manual dropdown menu closure
    if (this.model.get('order').get('iscancelled')) {
      OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_AlreadyCancelledHeader'), OB.I18N.getLabel('OBPOS_AlreadyCancelled'));
      return;
    }
    if (this.model.get('order').get('isFullyDelivered')) {
      OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_FullyDeliveredHeader'), OB.I18N.getLabel('OBPOS_FullyDelivered'));
      return;
    }
    var negativeLines = _.find(this.model.get('order').get('lines').models, function (line) {
      return line.get('qty') < 0;
    });
    if (negativeLines) {
      OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_cannotCancelLayawayHeader'), OB.I18N.getLabel('OBPOS_cancelLayawayWithNegativeLines'));
      return;
    }

    this.model.get('order').cancelLayaway(this);
  },
  displayLogic: function () {
    var me = this,
        isPaidReceipt, isLayaway, isReturn, haspayments, receiptLines, receipt;

    receipt = this.model.get('order');

    isPaidReceipt = receipt.get('isPaid') && !receipt.get('isQuotation');
    isReturn = receipt.get('orderType') === 1 || receipt.get('documentType') === OB.MobileApp.model.get('terminal').terminalType.documentTypeForReturns || receipt.get('documentType') === 'VBS RFC Order';
    receiptLines = receipt.get('receiptLines');

    // Function to know the delivered status of the current order

    function delivered() {
      var shipqty = OB.DEC.Zero;
      var qty = OB.DEC.Zero;
      _.each(receipt.get('lines').models, function (line) {
        qty += line.get('qty');
      });
      if (receiptLines) {
        _.each(receiptLines, function (line) {
          _.each(line.shipmentlines, function (shipline) {
            shipqty += shipline.qty;
          });
        });
      } else {
        return 'udf';
      }
      if (shipqty === qty) { //totally delivered
        return 'TD';
      }
      if (shipqty === 0) { //no deliveries
        return 'ND';
      }
      return 'DN';
    }

    function hasPayments() {
      if (me.model.get('orderList').current && me.model.get('orderList').current.get('payments').length && _.find(me.model.get('orderList').current.get('payments').models, function (payment) {
        return payment.get('isPrePayment');
      })) {
        return true;
      }
      return false;
    }

    if (!isReturn && delivered() !== 'TD' && (isPaidReceipt || (receipt.get('isLayaway') && (!OB.MobileApp.model.hasPermission('OBPOS_payments.cancelLayaway', true) || hasPayments())))) {
      this.show();
      this.adjustVisibilityBasedOnPermissions();
    } else {
      this.hide();
    }
  },
  updateLabel: function (model) {
    if (model.get('isPaid') && this.$.lbl.getContent() === OB.I18N.getLabel('OBPOS_CancelLayaway')) {
      this.$.lbl.setContent(OB.I18N.getLabel('OBPOS_CancelOrder'));
    } else if (model.get('isLayaway') && this.$.lbl.getContent() === OB.I18N.getLabel('OBPOS_CancelOrder')) {
      this.$.lbl.setContent(OB.I18N.getLabel('OBPOS_CancelLayaway'));
    }
  },
  init: function (model) {
    this.model = model;
    var receipt = model.get('order'),
        me = this;

    receipt.on('change:isLayaway change:isPaid change:orderType change:documentType', function (model) {
      this.updateLabel(model);
      this.displayLogic();
    }, this);

    this.model.get('leftColumnViewManager').on('change:currentView', function (changedModel) {
      if (changedModel.isOrder()) {
        this.displayLogic(changedModel);
        return;
      }
      if (changedModel.isMultiOrder()) {
        this.hide();
        return;
      }
    }, this);

    this.displayLogic();
  }
});

enyo.kind({
  name: 'OB.UI.MenuLayaway',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.layawayReceipt',
  events: {
    onShowDivText: '',
    onRearrangeEditButtonBar: ''
  },
  i18nLabel: 'OBPOS_LblLayawayReceipt',
  tap: function () {
    var negativeLines, deliveredLines, me = this;
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments); // Manual dropdown menu closure
    if (OB.UTIL.isNullOrUndefined(this.model.get('order').get('bp'))) {
      OB.UTIL.showError(OB.I18N.getLabel('OBPOS_layawaysOrderWithNotBP'));
      return true;
    }
    if (!OB.MobileApp.model.hasPermission('OBPOS_AllowLayawaysNegativeLines', true)) {
      negativeLines = _.find(this.model.get('order').get('lines').models, function (line) {
        return line.get('qty') < 0;
      });
      if (negativeLines) {
        OB.UTIL.showWarning(OB.I18N.getLabel('OBPOS_layawaysOrdersWithReturnsNotAllowed'));
        return true;
      }
    }
    if (this.model.get('order').get('doCancelAndReplace')) {
      deliveredLines = _.find(this.model.get('order').get('lines').models, function (line) {
        return line.get('deliveredQuantity') && OB.DEC.compare(line.get('deliveredQuantity')) === 1;
      });
      if (deliveredLines) {
        OB.UTIL.showWarning(OB.I18N.getLabel('OBPOS_LayawaysOrdersWithDeliveries'));
        return true;
      }
    }
    OB.UTIL.HookManager.executeHooks('OBPOS_LayawayReceipt', {
      context: me
    }, function (args) {
      if (args && args.cancelOperation && args.cancelOperation === true) {
        return;
      }
      me.doShowDivText({
        permission: me.permission,
        orderType: 2
      });
      me.doRearrangeEditButtonBar();
    });
  },
  updateVisibility: function (isVisible) {
    if (!OB.MobileApp.model.hasPermission(this.permission)) {
      this.hide();
      return;
    }
    if (!isVisible) {
      this.hide();
      return;
    }
    this.show();
  },
  init: function (model) {
    this.model = model;
    var receipt = model.get('order'),
        me = this;
    receipt.on('change:isEditable change:isQuotation change:orderType', function (model) {
      if (!model.get('isEditable') || model.get('isQuotation') || (model.get('orderType') === 1 && !OB.MobileApp.model.hasPermission('OBPOS_AllowLayawaysNegativeLines', true)) || model.get('orderType') === 2) {
        me.updateVisibility(false);
      } else {
        me.updateVisibility(true);
      }
    }, this);
    this.model.get('leftColumnViewManager').on('change:currentView', function (changedModel) {
      if (changedModel.isOrder()) {
        if (model.get('order').get('isEditable') && !this.model.get('order').get('isQuotation')) {
          me.updateVisibility(true);
        } else {
          me.updateVisibility(false);
        }
        return;
      }
      if (changedModel.isMultiOrder()) {
        me.updateVisibility(false);
      }
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuProperties',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.properties',
  events: {
    onShowReceiptProperties: ''
  },
  i18nLabel: 'OBPOS_LblProperties',
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments); // Manual dropdown menu closure
    this.doShowReceiptProperties();
  },
  init: function (model) {
    this.model = model;
    this.model.get('leftColumnViewManager').on('change:currentView', function (changedModel) {
      if (changedModel.isOrder()) {
        if (model.get('order').get('isEditable')) {
          this.setDisabled(false);
          this.adjustVisibilityBasedOnPermissions();
        } else {
          this.setDisabled(true);
        }
        return;
      }
      if (changedModel.isMultiOrder()) {
        this.setDisabled(true);
      }
    }, this);
    this.model.get('order').on('change:isEditable', function (newValue) {
      if (newValue) {
        if (newValue.get('isEditable') === false) {
          this.setShowing(false);
          return;
        }
      }
      this.setShowing(true);
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuInvoice',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.invoice',
  events: {
    onReceiptToInvoice: '',
    onCancelReceiptToInvoice: ''
  },
  i18nLabel: 'OBPOS_LblInvoice',
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments); // Manual dropdown menu closure
    this.taxIdValidation(this.model.get('order'));
  },
  taxIdValidation: function (model) {
    if (!OB.MobileApp.model.hasPermission('OBPOS_receipt.invoice')) {
      this.doCancelReceiptToInvoice();
    } else if (OB.MobileApp.model.hasPermission('OBPOS_retail.restricttaxidinvoice', true) && !model.get('bp').get('taxID')) {
      if (OB.MobileApp.model.get('terminal').terminalType.generateInvoice) {
        OB.UTIL.showError(OB.I18N.getLabel('OBPOS_BP_No_Taxid'));
      } else {
        OB.UTIL.showWarning(OB.I18N.getLabel('OBPOS_BP_No_Taxid'));
      }
      this.doCancelReceiptToInvoice();
    } else {
      this.doReceiptToInvoice();
    }

  },
  updateVisibility: function (isVisible) {
    if (!OB.MobileApp.model.hasPermission(this.permission)) {
      this.hide();
      return;
    }
    if (!isVisible) {
      this.hide();
      return;
    }
    this.show();
  },
  init: function (model) {
    this.model = model;
    var receipt = model.get('order'),
        me = this;
    receipt.on('change:generateInvoice change:bp change:isQuotation', function (model) {
      if (!model.get('isQuotation') && !model.get('generateInvoice') && model.get('bp').get('invoiceTerms') === 'I') {
        this.updateVisibility(true);
      } else {
        this.updateVisibility(false);
      }
    }, this);
    receipt.on('change:bp', function (model) {
      // if the receip is cloning, then the called to taxIdValidation is not done because this function does a save
      if (model.get('generateInvoice') && !model.get('cloningReceipt')) {
        me.taxIdValidation(model);
      }
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuOpenDrawer',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_retail.opendrawerfrommenu',
  i18nLabel: 'OBPOS_LblOpenDrawer',
  updateVisibility: function () {
    if (!OB.MobileApp.model.get('hasPaymentsForCashup')) {
      this.hide();
    }
  },
  init: function (model) {
    this.model = model;
    this.updateVisibility();
  },
  tap: function () {
    var me = this;
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments);
    OB.UTIL.Approval.requestApproval(
    me.model, 'OBPOS_approval.opendrawer.menu', function (approved, supervisor, approvalType) {
      if (approved) {
        OB.POS.hwserver.openDrawer({
          openFirst: true
        }, OB.MobileApp.model.get('permissions').OBPOS_timeAllowedDrawerSales);
      }
    });
  }
});

enyo.kind({
  name: 'OB.UI.MenuCustomers',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.customers',
  events: {
    onShowPopup: ''
  },
  i18nLabel: 'OBPOS_LblCustomers',
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments); // Manual dropdown menu closure
    this.doShowPopup({
      popup: 'modalcustomer',
      args: {
        target: 'order'
      }
    });
  },
  init: function (model) {
    this.model = model;
    model.get('leftColumnViewManager').on('order', function () {
      this.setDisabled(false);
      this.adjustVisibilityBasedOnPermissions();
    }, this);

    model.get('leftColumnViewManager').on('multiorder', function () {
      this.setDisabled(true);
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuPrint',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_print.receipt',
  events: {
    onPrintReceipt: ''
  },
  i18nLabel: 'OBPOS_LblPrintReceipt',
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments); // Manual dropdown menu closure
    if (OB.MobileApp.model.hasPermission(this.permission)) {
      this.doPrintReceipt();
    }
  }
});

enyo.kind({
  name: 'OB.UI.MenuQuotation',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.quotation',
  events: {
    onCreateQuotation: ''
  },
  i18nLabel: 'OBPOS_CreateQuotation',
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments); // Manual dropdown menu closure
    if (OB.MobileApp.model.get('terminal').terminalType.documentTypeForQuotations) {
      if (OB.MobileApp.model.hasPermission(this.permission)) {
        if (this.model.get('leftColumnViewManager').isMultiOrder()) {
          if (this.model.get('multiorders')) {
            this.model.get('multiorders').resetValues();
          }
          this.model.get('leftColumnViewManager').setOrderMode();
        }
        this.doCreateQuotation();
      }
    } else {
      OB.UTIL.showError(OB.I18N.getLabel('OBPOS_QuotationNoDocType'));
    }
  },
  updateVisibility: function (model) {
    if (!model.get('isQuotation')) {
      this.show();
      this.adjustVisibilityBasedOnPermissions();
    }
  },
  init: function (model) {
    var receipt = model.get('order');
    this.model = model;
    receipt.on('change:isQuotation', function (model) {
      this.updateVisibility(model);
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuDiscounts',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_retail.advDiscounts',
  events: {
    onDiscountsMode: ''
  },
  //TODO
  i18nLabel: 'OBPOS_LblReceiptDiscounts',
  tap: function () {
    if (!this.disabled) {
      this.inherited(arguments); // Manual dropdown menu closure
      this.doDiscountsMode({
        tabPanel: 'edit',
        keyboard: 'toolbardiscounts',
        edit: false,
        options: {
          discounts: true
        }
      });
    }
  },
  updateVisibility: function () {
    var me = this;
    if (this.model.get('leftColumnViewManager').isMultiOrder()) {
      me.setDisabled(true);
      return;
    }

    if (this.receipt.get('isEditable') === false) {
      me.setDisabled(true);
      return;
    }

    OB.UTIL.isDisableDiscount(this.receipt, function (disable) {
      me.setDisabled(disable);
    });

    me.adjustVisibilityBasedOnPermissions();
  },
  init: function (model) {
    var me = this;
    this.model = model;
    this.receipt = model.get('order');
    //set disabled until ticket has lines
    me.setDisabled(true);
    if (!OB.MobileApp.model.hasPermission(this.permission)) {
      //no permissions, never will be enabled
      return;
    }

    model.get('leftColumnViewManager').on('order', function () {
      this.updateVisibility();
    }, this);

    model.get('leftColumnViewManager').on('multiorder', function () {
      me.setDisabled(true);
    }, this);

    this.receipt.on('change', function () {
      this.updateVisibility();
    }, this);

    this.receipt.get('lines').on('all', function () {
      this.updateVisibility();
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuCreateOrderFromQuotation',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.createorderfromquotation',
  events: {
    onShowPopup: ''
  },
  i18nLabel: 'OBPOS_CreateOrderFromQuotation',
  tap: function () {
    if (this.disabled) {
      return true;
    }
    if (OB.MobileApp.model.hasPermission(this.permission)) {
      this.inherited(arguments); // Manual dropdown menu closure
      this.doShowPopup({
        popup: 'modalCreateOrderFromQuotation'
      });
    }
  },
  updateVisibility: function (model) {
    if (OB.MobileApp.model.hasPermission(this.permission) && model.get('isQuotation') && model.get('hasbeenpaid') === 'Y') {
      this.show();
    } else {
      this.hide();
    }
  },
  init: function (model) {
    var receipt = model.get('order'),
        me = this;
    me.hide();

    model.get('leftColumnViewManager').on('order', function () {
      this.updateVisibility(receipt);
      this.adjustVisibilityBasedOnPermissions();
    }, this);

    model.get('leftColumnViewManager').on('multiorder', function () {
      me.hide();
    }, this);

    receipt.on('change:isQuotation', function (model) {
      this.updateVisibility(model);
    }, this);
    receipt.on('change:hasbeenpaid', function (model) {
      this.updateVisibility(model);
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuCreateQuotationFromOrder',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.createquotationfromorder',
  i18nLabel: 'OBPOS_CreateQuotationFromOrder',
  events: {
    onTabChange: ''
  },
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments); // Manual dropdown menu closure
    if (this.receipt.get('payments').length) {
      OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBMOBC_Error'), OB.I18N.getLabel('OBPOS_ExistingPayments'));
      return;
    }
    if (_.find(this.receipt.get('lines').models, function (line) {
      return OB.DEC.compare(line.get('qty')) === -1;
    })) {
      OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBMOBC_Error'), OB.I18N.getLabel('OBPOS_NegativeLinesQuotation'));
      return;
    }
    this.receipt.createQuotationFromOrder();
  },
  updateVisibility: function (model) {
    if (OB.MobileApp.model.hasPermission(this.permission) && !model.get('isQuotation') && model.get('isEditable') && (model.get('orderType') === 0 || model.get('orderType') === 2)) {
      this.show();
    } else {
      this.hide();
    }
  },
  updateLabel: function (model) {
    if (model.get('orderType') === 0 && this.$.lbl.getContent() === OB.I18N.getLabel('OBPOS_CreateQuotationFromLayaway')) {
      this.$.lbl.setContent(OB.I18N.getLabel('OBPOS_CreateQuotationFromOrder'));
    } else if (model.get('orderType') === 2 && this.$.lbl.getContent() === OB.I18N.getLabel('OBPOS_CreateQuotationFromOrder')) {
      this.$.lbl.setContent(OB.I18N.getLabel('OBPOS_CreateQuotationFromLayaway'));
    }
  },
  init: function (model) {
    this.receipt = model.get('order');

    this.updateVisibility(this.receipt);
    this.updateLabel(this.receipt);

    this.receipt.on('change:isQuotation change:isEditable change:orderType', function (model) {
      this.updateVisibility(model);
    }, this);

    this.receipt.on('change:orderType', function (model) {
      this.updateLabel(model);
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuReactivateQuotation',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.reactivatequotation',
  events: {
    onShowReactivateQuotation: ''
  },
  i18nLabel: 'OBPOS_ReactivateQuotation',
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments); // Manual dropdown menu closure
    if (OB.MobileApp.model.hasPermission(this.permission)) {
      this.doShowReactivateQuotation();
    }
  },
  updateVisibility: function (model) {
    if (OB.MobileApp.model.hasPermission(this.permission) && model.get('isQuotation') && model.get('hasbeenpaid') === 'Y') {
      this.show();
    } else {
      this.hide();
    }
  },
  init: function (model) {
    var receipt = model.get('order'),
        me = this;
    me.hide();

    model.get('leftColumnViewManager').on('order', function () {
      this.updateVisibility(receipt);
      this.adjustVisibilityBasedOnPermissions();
    }, this);

    model.get('leftColumnViewManager').on('multiorder', function () {
      me.hide();
    }, this);

    receipt.on('change:isQuotation', function (model) {
      this.updateVisibility(model);
    }, this);
    receipt.on('change:hasbeenpaid', function (model) {
      this.updateVisibility(model);
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuRejectQuotation',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_quotation.rejections',
  events: {
    onShowRejectQuotation: ''
  },
  i18nLabel: 'OBPOS_RejectQuotation',
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments); // Manual dropdown menu closure
    if (OB.MobileApp.model.hasPermission(this.permission, true)) {
      this.doShowRejectQuotation();
    }
  },
  updateVisibility: function (model) {
    if (OB.MobileApp.model.hasPermission(this.permission, true) && model.get('isQuotation') && model.get('hasbeenpaid') === 'Y') {
      this.show();
    } else {
      this.hide();
    }
  },
  init: function (model) {
    var receipt = model.get('order'),
        me = this;
    me.hide();

    model.get('leftColumnViewManager').on('order', function () {
      this.updateVisibility(receipt);
      this.adjustVisibilityBasedOnPermissions();
    }, this);

    model.get('leftColumnViewManager').on('multiorder', function () {
      me.hide();
    }, this);

    receipt.on('change:isQuotation', function (model) {
      this.updateVisibility(model);
    }, this);
    receipt.on('change:hasbeenpaid', function (model) {
      this.updateVisibility(model);
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.MenuReceiptSelector',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_retail.menuReceiptSelector',
  events: {
    onShowPopup: ''
  },
  i18nLabel: 'OBPOS_OpenReceipt',
  tap: function () {
    var me = this;
    var connectedCallback = function () {
        if (OB.MobileApp.model.hasPermission(me.permission)) {
          me.doShowPopup({
            popup: 'modalReceiptSelector'
          });
        }
        };
    var notConnectedCallback = function () {
        OB.UTIL.showError(OB.I18N.getLabel('OBPOS_OfflineWindowRequiresOnline'));
        return;
        };
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments); // Manual dropdown menu closure
    if (!OB.MobileApp.model.get('connectedToERP')) {
      OB.UTIL.checkOffLineConnectivity(500, connectedCallback, notConnectedCallback);
    } else {
      connectedCallback();
    }
  }
});

enyo.kind({
  name: 'OB.UI.MenuMultiOrders',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_retail.multiorders',
  events: {
    onMultiOrders: ''
  },
  i18nLabel: 'OBPOS_LblPayOpenTickets',
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments); // Manual dropdown menu closure
    if (!OB.MobileApp.model.get('connectedToERP')) {
      OB.UTIL.showError(OB.I18N.getLabel('OBPOS_OfflineWindowRequiresOnline'));
      return;
    }
    if (OB.MobileApp.model.hasPermission(this.permission)) {
      this.model.get('orderList').saveCurrent();
      this.doMultiOrders();
    }
  },
  updateVisibility: function () {
    if (OB.MobileApp.model.get('payments').length <= 0) {
      this.hide();
    }
  },
  init: function (model) {
    this.model = model;
    this.updateVisibility();
  }
});

enyo.kind({
  name: 'OB.UI.MenuBackOffice',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_retail.backoffice',
  url: '../..',
  events: {
    onBackOffice: ''
  },
  i18nLabel: 'OBPOS_LblOpenbravoWorkspace',
  tap: function () {
    var useURL = this.url;
    if (this.disabled) {
      return true;
    }

    // use the central server url
    _.each(OB.RR.RequestRouter.servers.models, function (server) {
      if (server.get('mainServer') && server.get('address')) {
        useURL = server.get('address');
      }
    });

    this.inherited(arguments); // Manual dropdown menu closure
    if (OB.MobileApp.model.hasPermission(this.permission)) {
      this.doBackOffice({
        url: useURL
      });
    }
  }
});

enyo.kind({
  name: 'OB.UI.MenuDisableEnableRFIDReader',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_retail.disableEnableRFIDReader',
  i18nLabel: 'OBPOS_RFID',
  classes: 'menu-switch',
  handlers: {
    onPointOfSaleLoad: 'pointOfSaleLoad'
  },
  components: [{
    name: 'lbl',
    allowHtml: true,
    style: 'padding: 12px 5px 12px 15px;'
  }],
  tap: function () {
    this.inherited(arguments);
    if (this.disabled) {
      return true;
    }
    this.setDisabled(true);
    if (OB.MobileApp.model.hasPermission(this.permission)) {
      if (OB.UTIL.RfidController.get('isRFIDEnabled')) {
        OB.UTIL.RfidController.set('reconnectOnScanningFocus', false);
        OB.UTIL.RfidController.disconnectRFIDDevice();
        if (OB.UTIL.RfidController.get('rfidTimeout')) {
          clearTimeout(OB.UTIL.RfidController.get('rfidTimeout'));
        }
      } else {
        OB.UTIL.RfidController.set('reconnectOnScanningFocus', true);
        OB.UTIL.RfidController.connectRFIDDevice();
        if (OB.POS.modelterminal.get('terminal').terminalType.rfidTimeout) {
          if (OB.UTIL.RfidController.get('rfidTimeout')) {
            clearTimeout(OB.UTIL.RfidController.get('rfidTimeout'));
          }
          OB.UTIL.RfidController.set('rfidTimeout', setTimeout(function () {
            OB.UTIL.RfidController.unset('rfidTimeout');
            OB.UTIL.RfidController.set('reconnectOnScanningFocus', false);
            OB.UTIL.RfidController.disconnectRFIDDevice();
          }, OB.POS.modelterminal.get('terminal').terminalType.rfidTimeout * 1000 * 60));
        }
      }
    }
  },
  init: function (model) {
    if (!OB.UTIL.RfidController.isRfidConfigured()) {
      this.hide();
    }
    OB.UTIL.RfidController.on('change:connected change:connectionLost', function (model) {
      if (OB.UTIL.RfidController.get('connectionLost')) {
        this.removeClass('btn-icon-switchon');
        this.removeClass('btn-icon-switchoff');
        this.addClass('btn-icon-switchoffline');
        this.setDisabled(true);
      } else {
        this.removeClass('btn-icon-switchoffline');
        if (OB.UTIL.RfidController.get('isRFIDEnabled') && OB.UTIL.RfidController.get('connected')) {
          this.addClass('btn-icon-switchon');
          this.removeClass('btn-icon-switchoff');
        } else {
          OB.UTIL.RfidController.disconnectRFIDDevice();
          this.removeClass('btn-icon-switchon');
          this.addClass('btn-icon-switchoff');
        }
        this.setDisabled(false);
      }
    }, this);
  },
  pointOfSaleLoad: function (inSender, inEvent) {
    if (OB.UTIL.RfidController.isRfidConfigured()) {
      var protocol = OB.POS.hwserver.url.split('/')[0];
      if (window.location.protocol === protocol) {
        if (OB.UTIL.RfidController.get('connectionLost') || !OB.UTIL.RfidController.get('connected')) {
          this.addClass('btn-icon-switchoffline');
          return;
        } else {
          this.removeClass('btn-icon-switchoffline');
        }
        if (!OB.UTIL.RfidController.get('isRFIDEnabled') || !OB.UTIL.RfidController.get('reconnectOnScanningFocus')) {
          this.addClass('btn-icon-switchoff');
          this.removeClass('btn-icon-switchon');
        } else {
          this.addClass('btn-icon-switchon');
          this.removeClass('btn-icon-switchoffline');
        }
      } else {
        this.hide();
        OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_POSHWMProtocolMismatch'));
      }
    }
  }
});


enyo.kind({
  name: 'OB.UI.MenuSelectPrinter',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_retail.selectprinter',
  events: {
    onModalSelectPrinters: ''
  },
  i18nLabel: 'OBPOS_MenuSelectPrinter',
  init: function (model) {
    this.displayLogic();
  },
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments); // Manual dropdown menu closure
    if (OB.MobileApp.model.hasPermission(this.permission)) {
      this.doModalSelectPrinters();
    }
  },
  displayLogic: function () {
    if (_.any(OB.POS.modelterminal.get('hardwareURL'), function (printer) {
      return printer.hasReceiptPrinter;
    })) {
      this.show();
    } else {
      this.hide();
    }
  }
});

enyo.kind({
  name: 'OB.UI.MenuSelectPDFPrinter',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_retail.selectprinter',
  events: {
    onModalSelectPDFPrinters: ''
  },
  i18nLabel: 'OBPOS_MenuSelectPDFPrinter',
  init: function (model) {
    this.displayLogic();
  },
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments); // Manual dropdown menu closure
    if (OB.MobileApp.model.hasPermission(this.permission)) {
      this.doModalSelectPDFPrinters();
    }
  },
  displayLogic: function () {
    if (_.any(OB.POS.modelterminal.get('hardwareURL'), function (printer) {
      return printer.hasPDFPrinter;
    })) {
      this.show();
    } else {
      this.hide();
    }
  }
});

enyo.kind({
  name: 'OB.UI.MenuCancelAndReplace',
  kind: 'OB.UI.MenuAction',
  permission: 'OBPOS_receipt.cancelreplace',
  i18nLabel: 'OBPOS_CancelReplace',
  events: {
    onRearrangeEditButtonBar: ''
  },
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments); // Manual dropdown menu closure
    this.model.get('order').verifyCancelAndReplace(this);
  },
  updateVisibility: function () {
    var isPaidReceipt, isLayaway, isReturn, haspayments, receiptLines, receipt;

    receipt = this.model.get('order');

    isPaidReceipt = receipt.get('isPaid') === true && !receipt.get('isQuotation');
    isLayaway = receipt.get('isLayaway');
    isReturn = receipt.get('orderType') === 1 || receipt.get('documentType') === OB.MobileApp.model.get('terminal').terminalType.documentTypeForReturns || receipt.get('documentType') === 'VBS RFC Order';
    haspayments = receipt.get('payments').length > 0;
    receiptLines = OB.MobileApp.model.receipt.get('receiptLines');

    function delivered() {
      var shipqty = OB.DEC.Zero;
      var qty = OB.DEC.Zero;
      _.each(receipt.get('lines').models, function (line) {
        qty += line.get('qty');
      });
      if (receiptLines) {
        _.each(receiptLines, function (line) {
          _.each(line.shipmentlines, function (shipline) {
            shipqty += shipline.qty;
          });
        });
      } else {
        return 'udf';
      }
      if (shipqty === qty) { //totally delivered
        return 'TD';
      }
      if (shipqty === 0) { //no deliveries
        return 'ND';
      }
      return 'DN';
    }
    if (isPaidReceipt || isLayaway) {
      var deliveredresult = delivered();
      if (isPaidReceipt && !OB.MobileApp.model.hasPermission('OBPOS_receipt.CancelReplacePaidOrders', true) && deliveredresult === 'TD') {
        this.hide();
      } else if (!OB.MobileApp.model.hasPermission('OBPOS_receipt.CancelReplaceLayaways', true) && deliveredresult === 'ND' && !haspayments) {
        this.hide();
      } else if (!OB.MobileApp.model.hasPermission('OBPOS_receipt.CancelAndReplaceOrdersWithDeliveries', true) && (deliveredresult === 'TD' || deliveredresult === 'DN')) {
        this.hide();
      } else if (OB.MobileApp.model.hasPermission('OBPOS_payments.hideCancelAndReplace', true) && !haspayments) {
        this.hide();
      } else {
        this.show();
      }
    } else {
      this.hide();
    }

    if (isReturn) {
      this.hide();
    }

    this.adjustVisibilityBasedOnPermissions();
  },
  init: function (model) {
    var receipt = model.get('order'),
        me = this;

    this.model = model;

    this.model.get('leftColumnViewManager').on('order', function () {
      this.updateVisibility();
      this.adjustVisibilityBasedOnPermissions();
    }, this);

    this.model.get('leftColumnViewManager').on('multiorder', function () {
      me.hide();
    }, this);

    receipt.on('change:isLayaway change:isPaid change:isQuotation change:replacedorder change:orderType change:receiptLines', function () {
      this.updateVisibility();
    }, this);

    this.updateVisibility();
  }
});

enyo.kind({
  name: 'OB.UI.MenuForceIncrementalRefresh',
  kind: 'OB.UI.MenuAction',
  permission: 'OBMOBC_NotAutoLoadIncrementalAtLogin',
  i18nLabel: 'OBPOS_MenuForceIncrementalRefreshLabel',
  init: function (model) {
    this.displayLogic();
  },
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.inherited(arguments); // Manual dropdown menu closure
    if (OB.MobileApp.model.hasPermission(this.permission, true)) {
      OB.UTIL.localStorage.setItem('POSForceIncrementalRefresh', true);
      window.location.reload();
    }
  },
  displayLogic: function () {
    if (OB.MobileApp.model.hasPermission(this.permission, true)) {
      this.show();
    } else {
      this.hide();
    }
  }
});