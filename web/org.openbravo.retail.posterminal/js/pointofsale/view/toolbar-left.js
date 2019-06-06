/*
 ************************************************************************************
 * Copyright (C) 2013-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, enyo, _ */

/*left toolbar*/
enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.LeftToolbarButton',
  tag: 'li',
  classes: 'span4',
  components: [{
    name: 'theButton',
    attributes: {
      style: 'margin: 0px 5px 0px 5px;'
    }
  }],
  initComponents: function () {
    this.inherited(arguments);
    this.$.theButton.createComponent(this.button);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.LeftToolbar',
  classes: 'span3',
  components: [{
    tag: 'ul',
    classes: 'unstyled nav-pos row-fluid',
    name: 'toolbar'
  }],
  initComponents: function () {
    this.inherited(arguments);
    enyo.forEach(this.buttons, function (btn) {
      this.$.toolbar.createComponent({
        kind: 'OB.OBPOSPointOfSale.UI.LeftToolbarButton',
        button: btn
      });
    }, this);
  }
});

enyo.kind({
  name: 'OB.UI.ButtonNew',
  kind: 'OB.UI.ToolbarButton',
  icon: 'btn-icon btn-icon-new',
  events: {
    onAddNewOrder: ''
  },
  handlers: {
    onLeftToolbarDisabled: 'disabledButton'
  },
  processesToListen: ['calculateReceipt', 'addProduct', 'servicePriceCalculation'],
  disabled: false,
  isLocked: false,
  lastDisabledStatus: false,
  disableButton: function () {
    this.isLocked = true;
    this.setDisabledIfSynchronized();
  },
  enableButton: function () {
    this.isLocked = false;
    this.setDisabledIfSynchronized();
  },
  setDisabled: function (value) {
    this.lastDisabledStatus = value;
    this.setDisabledIfSynchronized();
  },
  setDisabledIfSynchronized: function () {
    var value = this.lastDisabledStatus || this.isLocked || false;
    if (this.isLocked) {
      value = true;
    }
    if (OB.UTIL.ProcessController.getProcessesInExecByOBj(this).length > 0 && !value) {
      return true;
    }
    this.disabled = value;
    this.setAttribute('disabled', value);
  },
  disabledButton: function (inSender, inEvent) {
    this.updateDisabled(inEvent.disableButtonNew || inEvent.status);
  },
  updateDisabled: function (isDisabled) {
    this.setDisabled(isDisabled);
    if (isDisabled) {
      this.removeClass('btn-icon-new');
    } else {
      this.addClass('btn-icon-new');
    }
  },
  init: function (model) {
    this.model = model;
  },
  tap: function () {
    var me = this;
    if (this.disabled) {
      return true;
    }
    OB.UTIL.HookManager.executeHooks('OBPOS_PreCreateNewReceipt', {
      model: this.model,
      context: this
    }, function (args) {
      if (!args.cancelOperation) {
        if (me.model.get('leftColumnViewManager').isMultiOrder()) {
          me.model.deleteMultiOrderList();
          me.model.get('multiOrders').resetValues();
          me.model.get('leftColumnViewManager').setOrderMode();
        } else {
          if (OB.MobileApp.model.get('permissions')['OBPOS_print.suspended'] && me.model.get('order').get('lines').length !== 0) {
            me.model.get('order').trigger('print');
          }
        }
        me.doAddNewOrder();
        OB.UTIL.HookManager.executeHooks('OBPOS_PostAddNewReceipt', {
          model: me.model,
          context: me
        }, function () {
          //Nothing to do
        });
        return true;
      }
    });
  }
});

enyo.kind({
  name: 'OB.UI.ButtonDelete',
  kind: 'OB.UI.ToolbarButton',
  icon: 'btn-icon btn-icon-delete',
  events: {
    onShowPopup: '',
    onDeleteOrder: '',
    onRemoveMultiOrders: ''
  },
  handlers: {
    onLeftToolbarDisabled: 'disabledButton'
  },
  processesToListen: ['calculateReceipt', 'addProduct', 'tapTotalButton', 'completeQuotation', 'servicePriceCalculation'],
  disabled: false,
  isLocked: false,
  lastDisabledStatus: false,
  disableButton: function () {
    this.isLocked = true;
    this.setDisabledIfSynchronized();
  },
  enableButton: function () {
    this.isLocked = false;
    this.setDisabledIfSynchronized();
  },
  setDisabled: function (value) {
    this.lastDisabledStatus = value;
    this.setDisabledIfSynchronized();
  },
  setDisabledIfSynchronized: function () {
    var value = this.lastDisabledStatus || this.isLocked || false;
    if (this.isLocked) {
      value = true;
    }
    if (OB.UTIL.ProcessController.getProcessesInExecByOBj(this).length > 0 && !value) {
      return true;
    }
    this.disabled = value;
    this.setAttribute('disabled', value);
  },
  disabledButton: function (inSender, inEvent) {
    this.updateDisabled(inEvent.status);
  },
  updateDisabled: function (isDisabled) {
    this.setDisabled(isDisabled);
    if (isDisabled) {
      this.removeClass('btn-icon-delete');
    } else {
      this.addClass('btn-icon-delete');
    }
  },
  tap: function () {
    var me = this,
        isMultiOrders = this.model.isValidMultiOrderState();

    if (this.disabled) {
      return true;
    }

    if (isMultiOrders) {
      this.doRemoveMultiOrders();
      return true;
    }

    // validate payments
    if (this.model.get('order').checkOrderPayment()) {
      this.setDisabled(false);
      return false;
    }

    // Set current organization to receipt
    this.model.get('order').set('organization', OB.MobileApp.model.get('terminal').organization);

    // deletion without warning is allowed if the ticket has been processed
    if (this.hasClass('paidticket')) {
      this.doDeleteOrder();
    } else {
      if (OB.MobileApp.model.hasPermission('OBPOS_approval.removereceipts', true)) {
        //Show the pop up to delete or not
        this.doShowPopup({
          popup: 'modalConfirmReceiptDelete'
        });
      } else {
        OB.UTIL.Approval.requestApproval(
        this.model, 'OBPOS_approval.removereceipts', function (approved) {
          if (approved) {
            //Delete the order without the popup
            me.doDeleteOrder({
              notSavedOrder: true
            });
          }
        });
      }
    }
  },
  init: function (model) {
    this.model = model;
    this.model.get('leftColumnViewManager').on('multiorder', function () {
      this.addClass('paidticket');
      return true;
    }, this);
    this.model.get('leftColumnViewManager').on('order', function () {
      this.removeClass('paidticket');
      if (this.model.get('order').get('isPaid') || this.model.get('order').get('isLayaway') || (this.model.get('order').get('isQuotation') && this.model.get('order').get('hasbeenpaid') === 'Y') || this.model.get('order').get('isModified')) {
        this.addClass('paidticket');
      }
      this.bubble('onChangeTotal', {
        newTotal: this.model.get('order').getTotal()
      });
    }, this);

    //    this.model.get('multiOrders').on('change:isMultiOrders', function (model) {
    //      if (model.get('isMultiOrders')) {
    //        this.addClass('paidticket');
    //      } else {
    //        this.removeClass('paidticket');
    //      }
    //      return true;
    //    }, this);
    this.model.get('order').on('change:isPaid change:isQuotation change:isLayaway change:hasbeenpaid change:isModified', function (changedModel) {
      if (changedModel.get('isPaid') || changedModel.get('isLayaway') || (changedModel.get('isQuotation') && changedModel.get('hasbeenpaid') === 'Y') || changedModel.get('isModified')) {
        this.addClass('paidticket');
        return;
      }
      this.removeClass('paidticket');
    }, this);
    this.model.get('order').on('showDiscount', function (model) {
      this.updateDisabled(true);
    }, this);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.ButtonTabPayment',
  kind: 'OB.UI.ToolbarButtonTab',
  tabPanel: 'payment',
  handlers: {
    onChangedTotal: 'renderTotal',
    onRightToolbarDisabled: 'disabledButton'
  },
  processesToListen: ['calculateReceipt', 'completeQuotation', 'clearWith', 'addProduct', 'servicePriceCalculation'],
  isEnabled: true,
  disabledButton: function (inSender, inEvent) {
    if (inEvent.exceptionPanel === this.tabPanel) {
      return true;
    }
    this.isEnabled = !inEvent.status;
    this.disabledChanged(inEvent.status);
  },
  disableButton: function () {
    this.disabledChanged(true);
  },
  enableButton: function () {
    this.disabledChanged(false);
  },
  disabledChanged: function (isDisabled) {
    // logic decide if the button will be allowed to be enabled
    // the decision to enable the button is made based on several requirements that must be met
    var requirements, me = this,
        hasBeenPaid;
    if (OB.UTIL.ProcessController.getProcessesInExecByOBj(this).length > 0 && !isDisabled) {
      return true;
    }

    function requirementsAreMet(model) {
      // This function is in charge of managing all the requirements of the pay button to be enabled and disabled
      // Any attribute or parameter used to change the state of the button MUST be managed here
      requirements = {
        isModel: undefined,
        isReceipt: undefined,
        isMultiOrder: undefined,
        receiptId: undefined,
        receiptDocno: undefined,
        isReceiptDocnoLengthGreaterThanThree: undefined,
        isReceiptBp: undefined,
        receiptBpId: undefined,
        isReceiptLines: undefined,
        isReceiptLinesLengthGreaterThanZero: undefined,
        isReceiptHasbeenpaidEqualToN: undefined,
        isToolbarEnabled: undefined,
        isDisabledRequest: undefined,
        isLocallyGeneratedPayments: undefined
      };

      // If any requirement is not met, return false
      // Checks are grouped as objects are known to exist
      requirements.isDisabledRequest = isDisabled;
      if (requirements.isDisabledRequest) {
        return false;
      }
      requirements.isToolbarEnabled = me.isEnabled;
      if (!requirements.isToolbarEnabled) {
        return false;
      }
      requirements.isModel = !OB.UTIL.isNullOrUndefined(model);
      if (!requirements.isModel) {
        return false;
      }
      var receipt = model.get('order');
      requirements.isReceipt = !OB.UTIL.isNullOrUndefined(receipt);
      if (!requirements.isReceipt) {
        return false;
      }
      requirements.isMultiOrder = model.get('leftColumnViewManager').isMultiOrder();
      if (requirements.isMultiOrder) {
        return false;
      }
      requirements.receiptId = receipt.get('id');
      requirements.receiptDocno = receipt.get('documentNo');
      requirements.isReceiptBp = !OB.UTIL.isNullOrUndefined(receipt.get('bp'));
      requirements.isReceiptLines = !OB.UTIL.isNullOrUndefined(receipt.get('lines'));
      if (OB.UTIL.isNullOrUndefined(requirements.receiptId) || OB.UTIL.isNullOrUndefined(requirements.receiptDocno) || !requirements.isReceiptBp || !requirements.isReceiptLines) {
        return false;
      }
      requirements.receiptBpId = receipt.get('bp').get('id');
      requirements.isReceiptDocnoLengthGreaterThanThree = receipt.get('documentNo').length > 3;
      requirements.isReceiptLinesLengthGreaterThanZero = receipt.get('lines').length > 0;
      requirements.isReceiptHasbeenpaidEqualToN = receipt.get('hasbeenpaid') === 'N';
      hasBeenPaid = receipt.get('isPaid') && ((receipt.isNegative() && receipt.getPrePaymentQty() <= receipt.getTotal()) || (!receipt.isNegative() && receipt.getPrePaymentQty() >= receipt.getTotal()));
      requirements.isLocallyGeneratedPayments = !OB.UTIL.isNullOrUndefined(receipt.get('payments').find(function (payment) {
        return !payment.get('isPrePayment');
      }));
      if (OB.UTIL.isNullOrUndefined(requirements.receiptBpId) || !requirements.isReceiptDocnoLengthGreaterThanThree || (!requirements.isReceiptLinesLengthGreaterThanZero && !requirements.isLocallyGeneratedPayments) || !requirements.isReceiptHasbeenpaidEqualToN) {
        return false;
      }
      // All requirements are met
      return true;
    }
    var newIsDisabledState;
    var discountEdit = this.owner.owner.owner.owner.owner.owner.$.rightPanel.$.toolbarpane ? this.owner.owner.owner.owner.owner.owner.$.rightPanel.$.toolbarpane.$.edit.$.editTabContent.$.discountsEdit.showing : false;
    if (requirementsAreMet(this.model)) {
      newIsDisabledState = false;
      this.$.totalPrinter.show();
      if (!hasBeenPaid) {
        this.$.totalPrinter.removeClass('blackcolor');
        this.$.totalPrinter.addClass('whitecolor');
      }
    } else {
      newIsDisabledState = true;
      if (discountEdit) {
        this.$.totalPrinter.hide();
      } else if (OB.MobileApp.model.get('serviceSearchMode')) {
        this.$.totalPrinter.removeClass('whitecolor');
        this.$.totalPrinter.addClass('blackcolor');
      }
    }

    OB.UTIL.Debug.execute(function () {
      if (!requirements) {
        throw "The 'requirementsAreMet' function must have been called before this point";
      }
    });

    // Log the status and requirements of the pay button state
    // This log is used to keep control on the requests to enable and disable the button, and to have a quick
    // view of which requirements haven't been met if the button is disabled.
    // The enabling/disabling flow MUST go through this point to ensure that all requests are logged
    var msg = enyo.format("Pay button is %s", (newIsDisabledState ? 'disabled' : 'enabled'));
    if (newIsDisabledState === true && requirements.isReceiptLinesLengthGreaterThanZero && requirements.isReceiptHasbeenpaidEqualToN) {
      msg += " and should be enabled";
      OB.error(msg, requirements);
      OB.UTIL.Debug.execute(function () {
        throw msg;
      });
    } else {
      OB.debug(msg, requirements); // tweak this log level if the previous line is not enough
    }

    this.disabled = newIsDisabledState; // for getDisabled() to return the correct value
    this.setAttribute('disabled', newIsDisabledState); // to effectively turn the button enabled or disabled
    if (hasBeenPaid && !newIsDisabledState) {
      this.$.totalPrinter.removeClass('whitecolor');
      this.addClass('btnlink-gray');
    } else {
      this.removeClass('btnlink-gray');
    }
  },
  events: {
    onTabChange: '',
    onClearUserInput: '',
    onShowPopup: ''
  },
  showPaymentTab: function () {
    var receipt = this.model.get('order'),
        me = this;
    if (receipt.get('isQuotation')) {
      var execution = OB.UTIL.ProcessController.start('completeQuotation');
      if (receipt.get('hasbeenpaid') !== 'Y') {
        receipt.set('isEditable', false);
        var cbk = function () {
            receipt.prepareToSend(function () {
              receipt.trigger('closed', {
                callback: function (args) {
                  //In case the processed document is a quotation, we remove its id so it can be reactivated
                  if (args && !args.isCancelled) {
                    if (receipt.get('isQuotation')) {
                      if (!(receipt.get('oldId') && receipt.get('oldId').length > 0)) {
                        receipt.set('oldId', receipt.get('id'));
                      }
                      receipt.set('isbeingprocessed', 'N');
                    }
                    if (OB.MobileApp.model.get('permissions')['OBPOS_print.quotation']) {
                      receipt.trigger('print');
                    }
                  }
                  receipt.trigger('scan');
                  OB.UTIL.ProcessController.finish('completeQuotation', execution);
                  OB.MobileApp.model.orderList.synchronizeCurrentOrder();
                }
              });
            });
            };
        if (OB.MobileApp.model.hasPermission('OBMOBC_SynchronizedMode', true)) {
          OB.MobileApp.model.setSynchronizedCheckpoint(function () {
            cbk();
          });
        } else {
          cbk();
        }
      } else {
        receipt.prepareToSend(function () {
          receipt.trigger('scan');
          OB.UTIL.ProcessController.finish('completeQuotation', execution);
          OB.UTIL.showError(OB.I18N.getLabel('OBPOS_QuotationClosed'));
        });
      }
      return;
    }
    if (!this.model.get('order').get('isEditable') && !this.model.get('order').get('isLayaway') && !this.model.get('order').get('isPaid') && this.model.get('order').get('orderType') !== 3) {
      return true;
    }
    receipt.trigger('updatePending', true);
    if (this.model.get('order').get('orderType') === 3) {
      me.doTabChange({
        tabPanel: me.tabPanel,
        keyboard: 'toolbarpayment',
        edit: false
      });
    }
    if (this.model.get('leftColumnViewManager').isMultiOrder()) {
      this.model.get('multiOrders').trigger('displayTotal');
    } else {
      receipt.trigger('displayTotal');
    }

    me.doTabChange({
      tabPanel: me.tabPanel,
      keyboard: 'toolbarpayment',
      edit: false
    });
    me.bubble('onShowColumn', {
      colNum: 1
    });

    OB.MobileApp.view.scanningFocus(true);
    if (OB.UTIL.RfidController.isRfidConfigured()) {
      OB.UTIL.RfidController.disconnectRFIDDevice();
    }
  },
  tap: function () {
    var me = this,
        criteria = {},
        paymentModels = OB.MobileApp.model.get('payments');
    if (this.disabled === false) {
      var receipt = me.model.get('order'),
          receiptLines = receipt.get('lines').models,
          i;
      if (receipt.get('isQuotation') && receipt.get('bp').id === OB.MobileApp.model.get('terminal').businessPartner && !OB.MobileApp.model.get('terminal').quotation_anonymouscustomer) {
        OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBMOBC_Error'), OB.I18N.getLabel('OBPOS_quotationsOrdersWithAnonimousCust'));
        return;
      }
      if (!OB.MobileApp.model.get('isMultiOrderState') && receipt.isNegative()) {
        var hasNoRefundablePayment = _.filter(paymentModels, function (payment) {
          return !payment.paymentMethod.refundable;
        }).length === paymentModels.length;
        if (hasNoRefundablePayment && !OB.MobileApp.model.get('terminal').allowpayoncredit) {
          OB.UTIL.showConfirmation.display('', OB.I18N.getLabel('OBPOS_LblNoRefundablePayments'), [{
            label: OB.I18N.getLabel('OBMOBC_LblOk')
          }]);
          return;
        }
      }

      for (i = 1; i < receipt.get('lines').models.length; i++) {
        if (receiptLines[0].get('organization').id !== receiptLines[i].get('organization').id) {
          OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBMOBC_Error'), OB.I18N.getLabel('OBPOS_ReceiptLinesSameStore'));
          return;
        }
      }

      if (receiptLines.length > 0) {
        if (!receiptLines[0].get('isVerifiedReturn')) {
          if (OB.UTIL.isCrossStoreReceipt(receipt) && !OB.UTIL.isCrossStoreLine(receiptLines[0])) {
            receipt.set('warehouse', OB.MobileApp.model.get('warehouses')[0].warehouseid);
            receipt.set('priceList', OB.MobileApp.model.get('pricelist'));
          }
          receipt.set('organization', receiptLines[0].get('organization').id);
        }
        if (OB.UTIL.isCrossStoreReceipt(receipt)) {
          receipt.set('warehouse', receiptLines[0].get('warehouse').id);
          if (receiptLines[0].get('product').get('currentPrice')) {
            receipt.set('priceList', receiptLines[0].get('product').get('currentPrice').priceListId);
          }
          if (receiptLines[0].has('documentType')) {
            receipt.set('documentType', receiptLines[0].get('documentType'));
          }
        }
      }

      if (receipt.get('orderType') === 3) {
        this.showPaymentTab();
        return;
      }
      OB.UTIL.StockUtils.checkOrderLinesStock([receipt], function (hasStock) {
        if (hasStock) {
          me.model.on('showPaymentTab', function (event) {
            me.model.get('order').getPrepaymentAmount(function () {
              me.model.off('showPaymentTab');
              me.showPaymentTab();
            }, true);
          });

          if (OB.MobileApp.model.hasPermission('OBPOS_remote.product', true)) {
            criteria.remoteFilters = [];
            criteria.remoteFilters.push({
              columns: [],
              operator: OB.Dal.FILTER,
              value: 'Final_Services',
              params: []
            });
            criteria.remoteFilters.push({
              columns: ['ispack'],
              operator: 'equals',
              value: false,
              fieldType: 'forceString'
            });
          } else {
            criteria.productType = 'S';
            criteria.proposalType = 'FMA';
          }
          OB.Dal.find(OB.Model.Product, criteria, function (data) {
            if (data && data.length > 0 && !receipt.get('isPaid') && !receipt.get('isLayaway')) {
              receipt.trigger('showProductList', null, 'final', function () {
                me.model.completePayment();
                me.doClearUserInput();
              });
            } else {
              me.model.completePayment(me);
              me.doClearUserInput();
            }
          }, function (trx, error) {
            me.model.completePayment(me);
            me.doClearUserInput();
          });
        }
      });
    }
  },
  attributes: {
    style: 'text-align: center; font-size: 30px;'
  },
  components: [{
    kind: 'OB.UI.FitText',
    name: 'totalButtonDiv',
    minFontSize: 15,
    maxFontSize: 30,
    maxHeight: 57,
    classes: 'buttonText',
    style: 'font-weight: bold; display: initial;',
    components: [{
      tag: 'span',
      name: 'totalPrinter',
      renderTotal: function (total) {
        this.setContent(OB.I18N.formatCurrency(total));
        //It needs an small asynch to be rendered and then we can adaptFontSize
        setTimeout(function (me) {
          me.parent.rendered();
        }, 0, this);
      }
    }]
  }],
  getLabel: function () {
    return this.$.totalPrinter.getContent();
  },
  initComponents: function () {
    this.inherited(arguments);
    this.removeClass('btnlink-gray');
  },
  destroyComponents: function () {
    this.inherited(arguments);
  },
  renderTotal: function (inSender, inEvent) {
    this.$.totalPrinter.renderTotal(inEvent.newTotal);
    this.disabledChanged(false);
  },
  init: function (model) {
    this.model = model;
    this.model.get('order').on('change:isEditable change:isLayaway change:orderType', function (newValue) {
      if (newValue) {
        if (!newValue.get('isEditable') && !newValue.get('isLayaway') && !newValue.get('isPaid') && newValue.get('orderType') !== 3) {
          this.tabPanel = null;
          this.disabledChanged(true);
          return;
        }
      }
      this.tabPanel = 'payment';
      this.disabledChanged(false);
    }, this);
    this.model.get('order').on('change:id', function () {
      this.disabledChanged(false);
    }, this);
    // the button state must be set only once, in the initialization
    this.setDisabled(true);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.LeftToolbarImpl',
  kind: 'OB.UI.MultiColumn.Toolbar',
  menuEntries: [{
    kind: 'OB.UI.MenuDisableEnableRFIDReader'
  }, {
    kind: 'OB.UI.MenuSeparator',
    name: 'sep0',
    init: function (model) {
      if (!OB.MobileApp.model.get('terminal').terminalType.useRfid || !OB.POS.hwserver.url) {
        this.hide();
      }
    }
  }],
  buttons: [{
    kind: 'OB.UI.ButtonNew',
    span: 3
  }, {
    kind: 'OB.UI.ButtonDelete',
    span: 3
  }, {
    kind: 'OB.OBPOSPointOfSale.UI.ButtonTabPayment',
    name: 'btnTotalToPay',
    span: 6
  }],
  initComponents: function () {
    // set up the POS menu
    //Menu entries is used for modularity. cannot be initialized
    //this.menuEntries = [];
    this.menuEntries.push({
      kind: 'OB.UI.MenuReceiptSelector'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuReturn'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuVoidLayaway'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuReceiptLayaway'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuCancelLayaway'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuProperties'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuInvoice'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuPrint'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuLayaway'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuCancelAndReplace'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuCustomers'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuOpenDrawer'
    });
    // TODO: what is this for?!!
    // this.menuEntries = this.menuEntries.concat(this.externalEntries);
    this.menuEntries.push({
      kind: 'OB.UI.MenuSeparator',
      name: 'sep1'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuDiscounts'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuSeparator',
      name: 'sep2'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuReactivateQuotation'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuRejectQuotation'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuCreateOrderFromQuotation'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuCreateQuotationFromOrder'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuQuotation'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuMultiOrders'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuSeparator',
      name: 'sep3'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuBackOffice'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuSelectPrinter'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuSelectPDFPrinter'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuForceIncrementalRefresh'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuTestPrinter'
    });

    //remove duplicates
    this.menuEntries = _.uniq(this.menuEntries, false, function (p) {
      return p.kind + p.name;
    });
    this.inherited(arguments);
  }
});