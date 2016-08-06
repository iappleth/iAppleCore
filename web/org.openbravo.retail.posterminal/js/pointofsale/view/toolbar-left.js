/*
 ************************************************************************************
 * Copyright (C) 2013-2015 Openbravo S.L.U.
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
    onLeftToolbarDisabled: 'disabledButton',
    calculatingReceipt: 'disableButton',
    calculatedReceipt: 'enableButton'
  },
  disableButton: function () {
    if (!this.model.get('leftColumnViewManager').isMultiOrder()) {
      this.isEnabled = false;
      this.setDisabled(true);
    }
  },
  enableButton: function () {
    if (!this.model.get('leftColumnViewManager').isMultiOrder()) {
      if (OB.UTIL.isNullOrUndefined(OB.MobileApp.model.get('serviceSearchMode')) || !OB.MobileApp.model.get('serviceSearchMode')) {
        this.isEnabled = true;
        this.setDisabled(false);
      }
    }
  },
  disabledButton: function (inSender, inEvent) {
    this.isEnabled = inEvent.disableButtonNew || !inEvent.status;
    this.setDisabled(inEvent.disableButtonNew || inEvent.status);
    if (!this.isEnabled) {
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
    OB.UTIL.HookManager.executeHooks('OBPOS_PreCreateNewReceipt', {
      model: this.model,
      context: this
    }, function (args) {
      if (!args.cancelOperation) {
        var i;
        if (me.model.get('leftColumnViewManager').isMultiOrder()) {
          me.model.deleteMultiOrderList();
          me.model.get('multiOrders').resetValues();
          me.model.get('leftColumnViewManager').setOrderMode();
        } else {
          if (OB.MobileApp.model.get('permissions')['OBPOS_print.suspended'] && this.model.get('order').get('lines').length !== 0) {
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
    onDeleteOrder: ''
  },
  handlers: {
    onLeftToolbarDisabled: 'disabledButton',
    calculatingReceipt: 'disableButton',
    calculatedReceipt: 'enableButton'
  },
  disableButton: function () {
    this.isEnabled = false;
    this.setDisabled(true);
  },
  enableButton: function () {
    if (OB.UTIL.isNullOrUndefined(OB.MobileApp.model.get('serviceSearchMode')) || !OB.MobileApp.model.get('serviceSearchMode')) {
      this.isEnabled = true;
      this.setDisabled(false);
    }
  },
  disabledButton: function (inSender, inEvent) {
    this.isEnabled = !inEvent.status;
    this.setDisabled(inEvent.status);
    if (!this.isEnabled) {
      this.removeClass('btn-icon-delete');
    } else {
      this.addClass('btn-icon-delete');
    }
  },
  updateDisabled: function (isDisabled) {
    this.isEnabled = !isDisabled;
    this.setDisabled(isDisabled);
    if (!this.isEnabled) {
      this.removeClass('btn-icon-delete');
    } else {
      this.addClass('btn-icon-delete');
    }
  },
  tap: function () {
    var i, me = this;

    if (me.model.get('leftColumnViewManager').isMultiOrder()) {
      me.model.deleteMultiOrderList();
      me.model.get('multiOrders').resetValues();
      me.model.get('leftColumnViewManager').setOrderMode();
      return true;
    }
    // deletion without warning is allowed if the ticket has been processed
    if (me.hasClass('paidticket')) {
      me.doDeleteOrder();
    } else {
      if (OB.MobileApp.model.hasPermission('OBPOS_approval.removereceipts', true)) {
        //Show the pop up to delete or not
        me.doShowPopup({
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
      if (this.model.get('order').get('isPaid') || this.model.get('order').get('isLayaway') || (this.model.get('order').get('isQuotation') && this.model.get('order').get('hasbeenpaid') === 'Y')) {
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
    this.model.get('order').on('change:isPaid change:isQuotation change:isLayaway change:hasbeenpaid', function (changedModel) {
      if (changedModel.get('isPaid') || changedModel.get('isLayaway') || (changedModel.get('isQuotation') && changedModel.get('hasbeenpaid') === 'Y')) {
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
    onRightToolbarDisabled: 'disabledButton',
    synchronizing: 'disableButton',
    synchronized: 'enableButton'
  },
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
    var requirements, me = this;

    function requirementsAreMet(model) {
      // This function is in charge of managing all the requirements of the pay button to be enabled and disabled
      // Any attribute or parameter used to change the state of the button MUST be managed here
      requirements = {
        isSynchronized: undefined,
        isModel: undefined,
        isReceipt: undefined,
        receiptId: undefined,
        receiptDocno: undefined,
        isReceiptDocnoLengthGreaterThanThree: undefined,
        isReceiptBp: undefined,
        receiptBpId: undefined,
        isReceiptLines: undefined,
        isReceiptLinesLengthGreaterThanZero: undefined,
        isReceiptHasbeenpaidEqualToN: undefined,
        isToolbarEnabled: undefined,
        isDisabledRequest: undefined
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
      requirements.isSynchronized = OB.UTIL.SynchronizationHelper.isSynchronized();
      if (!requirements.isSynchronized) {
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
      if (OB.UTIL.isNullOrUndefined(requirements.receiptBpId) || !requirements.isReceiptDocnoLengthGreaterThanThree || !requirements.isReceiptLinesLengthGreaterThanZero || !requirements.isReceiptHasbeenpaidEqualToN) {
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
      this.$.totalPrinter.addStyles('color: white!important;');
    } else {
      newIsDisabledState = true;
      if (discountEdit) {
        this.$.totalPrinter.hide();
      } else if (OB.MobileApp.model.get('serviceSearchMode')) {
        this.$.totalPrinter.addStyles('color: black!important;');
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
  },
  events: {
    onTabChange: '',
    onClearUserInput: '',
    onShowPopup: ''
  },
  showPaymentTab: function () {
    var synchId = OB.UTIL.SynchronizationHelper.busyUntilFinishes('showPaymentTab');
    var receipt = this.model.get('order'),
        me = this;
    if (receipt.get('isQuotation')) {
      if (receipt.get('hasbeenpaid') !== 'Y') {
        receipt.set('isEditable', false);
        receipt.prepareToSend(function () {
          receipt.trigger('closed', {
            callback: function () {
              //In case the processed document is a quotation, we remove its id so it can be reactivated
              if (receipt.get('isQuotation')) {
                if (!(receipt.get('oldId') && receipt.get('oldId').length > 0)) {
                  receipt.set('oldId', receipt.get('id'));
                }
                receipt.set('isbeingprocessed', 'N');
              }
              if (OB.MobileApp.model.get('permissions')['OBPOS_print.quotation']) {
                receipt.trigger('print');
              }
              receipt.trigger('scan');
              OB.MobileApp.model.orderList.synchronizeCurrentOrder();
            }
          });
        });
      } else {
        receipt.prepareToSend(function () {
          receipt.trigger('scan');
          OB.UTIL.showError(OB.I18N.getLabel('OBPOS_QuotationClosed'));
        });
      }
      OB.UTIL.SynchronizationHelper.finished(synchId, 'showPaymentTab');
      return;
    }
    if (this.model.get('order').get('isEditable') === false && !this.model.get('order').get('isLayaway')) {
      OB.UTIL.SynchronizationHelper.finished(synchId, 'showPaymentTab');
      return true;
    }
    if (this.model.get('order').get('orderType') === 3) {
      me.doTabChange({
        tabPanel: me.tabPanel,
        keyboard: 'toolbarpayment',
        edit: false
      });
    }
    OB.MobileApp.view.scanningFocus(false);
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
    OB.UTIL.SynchronizationHelper.finished(synchId, 'showPaymentTab');
  },
  tap: function () {
    var me = this,
        criteria = {};
    if (this.disabled === false) {
      if (this.model.get('order').get('orderType') === 3) {
        this.showPaymentTab();
        return;
      }
      var synchId = OB.UTIL.SynchronizationHelper.busyUntilFinishes('toolbarButtonTabTap');
      this.model.on('approvalChecked', function (event) {
        this.model.off('approvalChecked');
        if (event.approved) {
          this.showPaymentTab();
        }
      }, this);

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
        if (data && data.length > 0) {
          me.model.get('order').trigger('showProductList', null, 'final', function () {
            me.model.completePayment();
            me.doClearUserInput();
          });
        } else {
          me.model.completePayment(this);
          me.doClearUserInput();
        }
        OB.UTIL.SynchronizationHelper.finished(synchId, 'toolbarButtonTabTap');
      }, function (trx, error) {
        me.model.completePayment(this);
        me.doClearUserInput();
        OB.UTIL.SynchronizationHelper.finished(synchId, 'toolbarButtonTabTap');
      });
    }
  },
  attributes: {
    style: 'text-align: center; font-size: 30px;'
  },
  components: [{
    style: 'font-weight: bold; margin: 0px 5px 0px 0px;',
    kind: 'OB.UI.Total',
    name: 'totalPrinter'
  }],
  getLabel: function () {
    return this.$.totalPrinter.getContent();
  },
  initComponents: function () {
    this.inherited(arguments);
    this.removeClass('btnlink-gray');
  },
  renderTotal: function (inSender, inEvent) {
    this.$.totalPrinter.renderTotal(inEvent.newTotal);
    this.disabledChanged(false);
  },
  init: function (model) {
    this.model = model;
    this.model.get('order').on('change:isEditable change:isLayaway', function (newValue) {
      if (newValue) {
        if (newValue.get('isEditable') === false && !newValue.get('isLayaway')) {
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
  menuEntries: [],
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
      kind: 'OB.UI.MenuReturn'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuVoidLayaway'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuReceiptLayaway'
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
      kind: 'OB.UI.MenuCustomers'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuPaidReceipts'
    });
    this.menuEntries.push({
      kind: 'OB.UI.MenuQuotations'
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
      kind: 'OB.UI.MenuQuotation'
    });

    this.menuEntries.push({
      kind: 'OB.UI.MenuLayaways'
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

    //remove duplicates
    this.menuEntries = _.uniq(this.menuEntries, false, function (p) {
      return p.kind + p.name;
    });

    this.inherited(arguments);
  }
});