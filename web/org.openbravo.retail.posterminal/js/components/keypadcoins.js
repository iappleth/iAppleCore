/*
 ************************************************************************************
 * Copyright (C) 2013 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, enyo */

enyo.kind({
  name: 'OB.UI.KeypadCoinsLegacy',
  padName: 'Coins-102',
  padPayment: 'OBPOS_payment.cash',
  components: [{
    classes: 'row-fluid',
    components: [{
      classes: 'span4',
      components: [{
        kind: 'OB.UI.ButtonKey',
        name: 'OBKEY_legacy_A1',
        classButton: 'btnkeyboard-num',
        label: '/',
        command: '/'
      }]
    }, {
      classes: 'span4',
      components: [{
        kind: 'OB.UI.ButtonKey',
        classButton: 'btnkeyboard-num',
        name: 'OBKEY_legacy_B1',
        label: '*',
        command: '*'
      }]
    }, {
      classes: 'span4',
      components: [{
        kind: 'OB.UI.ButtonKey',
        classButton: 'btnkeyboard-num',
        name: 'OBKEY_legacy_C1',
        label: '%',
        command: '%'
      }]
    }]
  }, {
    classes: 'row-fluid',
    components: [{
      classes: 'span4',
      components: [{
        kind: 'OB.UI.PaymentButton',
        paymenttype: 'OBPOS_payment.cash',
        name: 'OBKEY_OBPOS_payment.cash_A2',
        amount: 10,
        background: '#e9b7c3'
      }]
    }, {
      classes: 'span4',
      components: [{
        kind: 'OB.UI.PaymentButton',
        paymenttype: 'OBPOS_payment.cash',
        name: 'OBKEY_OBPOS_payment.cash_B2',
        amount: 20,
        background: '#bac3de'
      }]
    }, {
      classes: 'span4',
      components: [{
        kind: 'OB.UI.PaymentButton',
        paymenttype: 'OBPOS_payment.cash',
        name: 'OBKEY_OBPOS_payment.cash_C2',
        amount: 50,
        background: '#f9bb92'
      }]
    }]
  }, {
    classes: 'row-fluid',
    components: [{
      classes: 'span4',
      components: [{
        kind: 'OB.UI.PaymentButton',
        paymenttype: 'OBPOS_payment.cash',
        name: 'OBKEY_OBPOS_payment.cash_A3',
        amount: 1,
        background: '#e4e0e3',
        bordercolor: '#f9e487'
      }]
    }, {
      classes: 'span4',
      components: [{
        kind: 'OB.UI.PaymentButton',
        paymenttype: 'OBPOS_payment.cash',
        name: 'OBKEY_OBPOS_payment.cash_B3',
        amount: 2,
        background: '#f9e487',
        bordercolor: '#e4e0e3'
      }]
    }, {
      classes: 'span4',
      components: [{
        kind: 'OB.UI.PaymentButton',
        paymenttype: 'OBPOS_payment.cash',
        name: 'OBKEY_OBPOS_payment.cash_C3',
        amount: 5,
        background: '#bccdc5'
      }]
    }]
  }, {
    classes: 'row-fluid',
    components: [{
      classes: 'span4',
      components: [{
        kind: 'OB.UI.PaymentButton',
        paymenttype: 'OBPOS_payment.cash',
        name: 'OBKEY_OBPOS_payment.cash_A4',
        amount: 0.10,
        background: '#f9e487'
      }]
    }, {
      classes: 'span4',
      components: [{
        kind: 'OB.UI.PaymentButton',
        paymenttype: 'OBPOS_payment.cash',
        name: 'OBKEY_OBPOS_payment.cash_B4',
        amount: 0.20,
        background: '#f9e487'
      }]
    }, {
      classes: 'span4',
      components: [{
        kind: 'OB.UI.PaymentButton',
        paymenttype: 'OBPOS_payment.cash',
        name: 'OBKEY_OBPOS_payment.cash_C4',
        amount: 0.50,
        background: '#f9e487'
      }]
    }]
  }, {
    classes: 'row-fluid',
    components: [{
      classes: 'span4',
      components: [{
        kind: 'OB.UI.PaymentButton',
        paymenttype: 'OBPOS_payment.cash',
        name: 'OBKEY_OBPOS_payment.cash_A5',
        amount: 0.01,
        background: '#f3bc9e'
      }]
    }, {
      classes: 'span4',
      components: [{
        kind: 'OB.UI.PaymentButton',
        paymenttype: 'OBPOS_payment.cash',
        name: 'OBKEY_OBPOS_payment.cash_B5',
        amount: 0.02,
        background: '#f3bc9e'
      }]
    }, {
      classes: 'span4',
      components: [{
        kind: 'OB.UI.PaymentButton',
        name: 'OBKEY_OBPOS_payment.cash_C5',
        paymenttype: 'OBPOS_payment.cash',
        amount: 0.05,
        background: '#f3bc9e'
      }]
    }]
  }],
  initComponents: function () {
    this.inherited(arguments);
    this.label = OB.I18N.getLabel('OBPOS_KeypadCoins');
  }
});

enyo.kind({
  name: 'OB.UI.PaymentButton',
  style: 'margin: 5px;',
  components: [{
    kind: 'OB.UI.Button',
    classes: 'btnkeyboard',
    name: 'btn'
  }],
  background: '#6cb33f',
  initComponents: function () {
    var btn;
    this.inherited(arguments);

    btn = this.$.btn;
    btn.setContent(this.label || OB.I18N.formatCoins(this.amount));
    btn.applyStyle('background-color', this.background);
    btn.applyStyle('border', '10px solid ' + (this.bordercolor || this.background));
  },
  tap: function () {
    if (OB.MobileApp.model.hasPermission(this.paymenttype)) {
      var me = this,
          myWindowModel = this.owner.owner.owner.owner.owner.owner.model;
      //FIXME: TOO MANY OWNERS
      var i, max, p, receipt = myWindowModel.get('order'),
          multiOrders = myWindowModel.get('multiOrders'),
          openDrawer = false,
          isCash = false,
          allowOpenDrawer = false,
          printtwice = false;
      for (i = 0, max = OB.MobileApp.model.get('payments').length; i < max; i++) {
        p = OB.MobileApp.model.get('payments')[i];
        if (p.payment.searchKey === me.paymenttype) {
          if (p.paymentMethod.openDrawer) {
            openDrawer = p.paymentMethod.openDrawer;
          }
          if (p.paymentMethod.iscash) {
            isCash = p.paymentMethod.iscash;
          }
          if (p.paymentMethod.allowopendrawer) {
            allowOpenDrawer = p.paymentMethod.allowopendrawer;
          }
          if (p.paymentMethod.printtwice) {
            printtwice = p.paymentMethod.printtwice;
          }
          break;
        }
      }
      // Calculate total amount to pay with selected PaymentMethod  
      var amountToPay = me.amount;
      var receiptToPay = myWindowModel.isValidMultiOrderState() ? multiOrders : receipt;
      if (receiptToPay.get("payments").length > 0) {
        receiptToPay.get("payments").each(function (item) {
          if (item.get("kind") === me.paymenttype) {
            amountToPay += item.get("amount");
          }
        });
      }
      // Check Max. Limit Amount
      var paymentMethod = OB.POS.terminal.terminal.paymentnames[this.paymenttype];
      if (paymentMethod.paymentMethod.maxLimitAmount && amountToPay > paymentMethod.paymentMethod.maxLimitAmount) {
        // Show error and abort payment
        this.bubble('onMaxLimitAmountError', {
          show: true,
          maxLimitAmount: paymentMethod.paymentMethod.maxLimitAmount,
          currency: paymentMethod.symbol,
          symbolAtRight: paymentMethod.currencySymbolAtTheRight
        });
      } else {
        // Hide error and process payment
        this.bubble('onMaxLimitAmountError', {
          show: false,
          maxLimitAmount: 0,
          currency: '',
          symbolAtRight: true
        });
        myWindowModel.addPayment(new OB.Model.PaymentLine({
          kind: me.paymenttype,
          name: OB.MobileApp.model.getPaymentName(me.paymenttype),
          amount: OB.DEC.number(me.amount),
          rate: p.rate,
          mulrate: p.mulrate,
          isocode: p.isocode,
          isCash: isCash,
          allowOpenDrawer: allowOpenDrawer,
          openDrawer: openDrawer,
          printtwice: printtwice
        }));
      }
    }
  }
});