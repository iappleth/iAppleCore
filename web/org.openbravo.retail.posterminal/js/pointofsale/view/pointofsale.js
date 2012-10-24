/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, enyo, $, confirm */

// Point of sale main window view
enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.PointOfSale',
  kind: 'OB.UI.WindowView',
  windowmodel: OB.OBPOSPointOfSale.Model.PointOfSale,
  tag: 'section',
  handlers: {
    onAddProduct: 'addProductToOrder',
    onCancelReceiptToInvoice: 'cancelReceiptToInvoice',
    onReceiptToInvoice: 'receiptToInvoice',
    onShowReturnText: 'showReturnText',
    onAddNewOrder: 'addNewOrder',
    onDeleteOrder: 'deleteCurrentOrder',
    onTabChange: 'tabChange',
    onDeleteLine: 'deleteLine',
    onEditLine: 'editLine',
    onExactPayment: 'exactPayment',
    onRemovePayment: 'removePayment',
    onChangeCurrentOrder: 'changeCurrentOrder',
    onChangeBusinessPartner: 'changeBusinessPartner',
    onPrintReceipt: 'printReceipt',
    onBackOffice: 'backOffice',
    onPaidReceipts: 'paidReceipts',
    onChangeSubWindow: 'changeSubWindow',
    onSetProperty: 'setProperty',
    onSetLineProperty: 'setLineProperty',
    onShowReceiptProperties: 'showModalReceiptProperties'
  },
  components: [{
    name: 'otherSubWindowsContainer',
    components: [{
      kind: 'OB.UI.ModalConfigurationRequiredForCreateCustomers'
    }, {
      kind: 'OB.OBPOSPointOfSale.UI.cas',
      name: 'customerAdvancedSearch'
    }, {
      kind: 'OB.OBPOSPointOfSale.customers.UI.newcustomer',
      name: 'customerCreateAndEdit'
    }, {
      kind: 'OB.OBPOSPointOfSale.customers.UI.editcustomer',
      name: 'customerView'
    }]
  }, {
    name: 'mainSubWindow',
    isMainSubWindow: true,
    components: [{
      kind: 'OB.UI.ModalDeleteReceipt'
    }, {
      kind: 'OB.UI.Modalnoteditableorder'
    }, {
      kind: 'OB.UI.ModalBusinessPartners'
    }, {
      kind: 'OB.UI.ModalPaidReceipts'
    }, {
      kind: 'OB.UI.ModalReceiptPropertiesImpl'
    }, {
      kind: 'OB.UI.ModalReceiptLinesPropertiesImpl'
    }, {
      classes: 'row',
      style: 'margin-bottom: 5px;',
      components: [{
        kind: 'OB.OBPOSPointOfSale.UI.LeftToolbarImpl'
      }, {
        kind: 'OB.OBPOSPointOfSale.UI.RightToolbarImpl',
        name: 'rightToolbar'
      }]
    }, {
      classes: 'row',
      components: [{
        kind: 'OB.OBPOSPointOfSale.UI.ReceiptView',
        name: 'receiptview'
      }, {
        classes: 'span6',
        components: [{
          kind: 'OB.OBPOSPointOfSale.UI.RightToolbarPane',
          name: 'toolbarpane'
        }, {
          kind: 'OB.OBPOSPointOfSale.UI.KeyboardOrder',
          name: 'keyboard'
        }]
      }]
    }]
  }],
  printReceipt: function () {

    if (OB.POS.modelterminal.hasPermission('OBPOS_print.receipt')) {
      var receipt = this.model.get('order');
      if (receipt.get("isPaid")) {
        receipt.trigger('print');
        return;
      }
      receipt.calculateTaxes(function () {
        receipt.trigger('print');
      });
    }
  },
  paidReceipts: function (inSender, inEvent) {
    $('#modalPaidReceipts').modal('show');
    return true;
  },
  backOffice: function (inSender, inEvent) {
    if (inEvent.url) {
      window.open(inEvent.url, '_blank');
    }
  },
  addNewOrder: function (inSender, inEvent) {
    this.model.get('orderList').addNewOrder();
    return true;
  },
  deleteCurrentOrder: function () {
    if (this.model.get('order').get('id')) {
      this.model.get('orderList').saveCurrent();
      OB.Dal.remove(this.model.get('orderList').current, null, null);
    }
    this.model.get('orderList').deleteCurrent();
    return true;
  },
  addProductToOrder: function (inSender, inEvent) {
    if (this.model.get('order').get('isEditable') === false) {
      $("#modalNotEditableOrder").modal("show");
      return true;
    }
    this.model.get('order').addProduct(inEvent.product);
    this.model.get('orderList').saveCurrent();
    return true;
  },
  changeBusinessPartner: function (inSender, inEvent) {
    if (this.model.get('order').get('isEditable') === false) {
      $("#modalNotEditableOrder").modal("show");
      return true;
    }
    this.model.get('order').setBPandBPLoc(inEvent.businessPartner, false, true);
    this.model.get('orderList').saveCurrent();
    return true;
  },
  receiptToInvoice: function () {
    if (this.model.get('order').get('isEditable') === false) {
      $("#modalNotEditableOrder").modal("show");
      return true;
    }
    this.model.get('order').setOrderInvoice();
    this.model.get('orderList').saveCurrent();
    return true;
  },
  showReturnText: function (inSender, inEvent) {
    if (this.model.get('order').get('isEditable') === false) {
      $("#modalNotEditableOrder").modal("show");
      return true;
    }
    this.model.get('order').setOrderTypeReturn();
    this.model.get('orderList').saveCurrent();
    return true;
  },
  cancelReceiptToInvoice: function (inSender, inEvent) {
    if (this.model.get('order').get('isEditable') === false) {
      $("#modalNotEditableOrder").modal("show");
      return true;
    }
    this.model.get('order').resetOrderInvoice();
    this.model.get('orderList').saveCurrent();
    return true;
  },
  tabChange: function (sender, event) {
    this.waterfall('onTabButtonTap', {
      tabPanel: event.tabPanel
    });
    this.waterfall('onChangeEditMode', {
      edit: event.edit
    });
    if (event.keyboard) {
      this.$.keyboard.showToolbar(event.keyboard);
    } else {
      this.$.keyboard.hide();
    }
  },
  deleteLine: function (sender, event) {
    if (this.model.get('order').get('isEditable') === false) {
      $("#modalNotEditableOrder").modal("show");
      return true;
    }
    var line = event.line,
        receipt = this.model.get('order');
    if (line && receipt) {
      receipt.deleteLine(line);
      receipt.trigger('scan');
    }
  },
  editLine: function (sender, event) {
    if (this.model.get('order').get('isEditable') === false) {
      $("#modalNotEditableOrder").modal("show");
      return true;
    }
    $("#receiptLinesPropertiesDialog").modal('show');
  },
  exactPayment: function (sender, event) {
    this.$.keyboard.execStatelessCommand('cashexact');
  },
  changeCurrentOrder: function (inSender, inEvent) {
    this.model.get('orderList').load(inEvent.newCurrentOrder);
    return true;
  },
  removePayment: function (sender, event) {
    if (this.model.get('paymentData') && !confirm(OB.I18N.getLabel('OBPOS_MsgConfirmRemovePayment'))) {
      return;
    }
    this.model.get('order').removePayment(event.payment);
  },
  changeSubWindow: function (sender, event) {
    this.model.get('subWindowManager').set('currentWindow', event.newWindow);
  },
  showModalReceiptProperties: function (inSender, inEvent) {
    $('#receiptPropertiesDialog').modal('show');
    return true;
  },
  setProperty: function (inSender, inEvent) {
    if (this.model.get('order').get('isEditable') === false) {
      $("#modalNotEditableOrder").modal("show");
      return true;
    }
    this.model.get('order').setProperty(inEvent.property, inEvent.value);
    this.model.get('orderList').saveCurrent();
    return true;
  },
  setLineProperty: function (inSender, inEvent) {
    if (this.model.get('order').get('isEditable') === false) {
      $("#modalNotEditableOrder").modal("show");
      return true;
    }
    var line = inEvent.line,
        receipt = this.model.get('order');
    if (line && receipt) {
      receipt.setLineProperty(line, inEvent.property, inEvent.value);
    }
    this.model.get('orderList').saveCurrent();
    return true;
  },
  init: function () {
    var receipt, receiptList;
    this.inherited(arguments);
    receipt = this.model.get('order');
    receiptList = this.model.get('orderList');
    this.model.get('subWindowManager').on('change:currentWindow', function (changedModel) {

      function restorePreviousState(swManager, changedModel) {
        swManager.set('currentWindow', changedModel.previousAttributes().currentWindow, {
          silent: true
        });
      }

      //TODO backbone route
      var showNewSubWindow = false;
      if (this.$[changedModel.get('currentWindow').name]) {
        if (!changedModel.get('currentWindow').params) {
          changedModel.get('currentWindow').params = {};
          //developers helps
          //console.log("Caller is not set. Caller has been set as main subwindow");
          changedModel.get('currentWindow').params.caller = 'mainSubWindow';
        }
        if (this.$[changedModel.get('currentWindow').name].mainBeforeSetShowing) {
          showNewSubWindow = this.$[changedModel.get('currentWindow').name].mainBeforeSetShowing(changedModel.get('currentWindow').params);
          if (showNewSubWindow) {
            this.$[changedModel.previousAttributes().currentWindow.name].setShowing(false);
            this.$[changedModel.get('currentWindow').name].setShowing(true);
          } else {
            restorePreviousState(this.model.get('subWindowManager'), changedModel);
          }
        } else {
          if (this.$[changedModel.get('currentWindow').name].isMainSubWindow) {
            this.$[changedModel.previousAttributes().currentWindow.name].setShowing(false);
            this.$[changedModel.get('currentWindow').name].setShowing(true);
          } else {
            //developers helps
            //console.log("Error! A subwindow must inherits from OB.UI.subwindow -> restore previous state");
            restorePreviousState(this.model.get('subWindowManager'), changedModel);
          }
        }
      } else {
        //developers helps
        //console.log("The subwindow to navigate doesn't exists -> restore previous state");
        restorePreviousState(this.model.get('subWindowManager'), changedModel);
      }
    }, this);
    this.$.receiptview.setOrder(receipt);
    this.$.receiptview.setOrderList(receiptList);
    this.$.toolbarpane.setModel(this.model);
    this.$.keyboard.setReceipt(receipt);
    this.$.rightToolbar.setReceipt(receipt);
  },
  initComponents: function () {
    this.inherited(arguments);
  }
});

OB.POS.registerWindow({
  windowClass: OB.OBPOSPointOfSale.UI.PointOfSale,
  route: 'retail.pointofsale',
  menuPosition: null,
  // Not to display it in the menu
  menuLabel: 'POS'
});
OB.POS.modelterminal.set('windowRegistered', true);
OB.POS.modelterminal.triggerReady();