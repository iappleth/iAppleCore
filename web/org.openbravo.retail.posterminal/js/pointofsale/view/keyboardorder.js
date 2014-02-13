/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, $,  _, Backbone */


enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.KeyboardOrder',
  kind: 'OB.UI.Keyboard',
  keypads: [],
  published: {
    receipt: null
  },
  events: {
    onShowPopup: '',
    onAddProduct: '',
    onSetDiscountQty: '',
    onDiscountsMode: ''
  },
  discountsMode: false,
  handlers: {
    onKeyboardOnDiscountsMode: 'keyboardOnDiscountsMode'
  },

  keyboardOnDiscountsMode: function (inSender, inEvent) {
    if (inEvent.status) {
      this.showSidepad('ticketDiscountsToolbar');
    } else {
      this.showSidepad('sideenabled');
    }
    if (!inEvent.status) {
      //exit from discounts
      this.discountsMode = false;
      if (this.buttons['ticket:discount']) {
        this.buttons['ticket:discount'].removeClass('btnactive');
      }

      this.keyboardDisabled(inSender, {
        status: false
      });
    } else {
      this.discountsMode = true;
      if (inEvent.writable) {
        //enable keyboard
        this.keyboardDisabled(inSender, {
          status: false
        });
        //button as active
        if (this.buttons['ticket:discount']) {
          this.buttons['ticket:discount'].addClass('btnactive');
        }
      } else {
        if (this.buttons['ticket:discount']) {
          this.buttons['ticket:discount'].removeClass('btnactive');
        }

        this.keyboardDisabled(inSender, {
          status: true
        });
        return true;
      }
    }
  },
  sideBarEnabled: true,

  receiptChanged: function () {
    this.$.toolbarcontainer.$.toolbarPayment.setReceipt(this.receipt);

    this.line = null;

    this.receipt.get('lines').on('selected', function (line) {
      this.line = line;
      this.clear();
    }, this);
  },
  initComponents: function () {
    var me = this;

    var actionAddProduct = function (keyboard, value) {
        OB.MobileApp.model.hookManager.executeHooks('OBPOS_preChangeQtyFromKeyboard', {
          keyboard: keyboard,
          context: me,
          value: value
        }, function (args) {
          if (args.cancelOperation) {
            return;
          }

          if (args.keyboard.receipt.get('isEditable') === false) {
            args.context.doShowPopup({
              popup: 'modalNotEditableOrder'
            });
            return true;
          }
          if (args.keyboard.line && args.keyboard.line.get('product').get('isEditableQty') === false) {
            args.context.doShowPopup({
              popup: 'modalNotEditableLine'
            });
            return true;
          }
          if (args.keyboard.line) {
            args.context.doAddProduct({
              product: args.keyboard.line.get('product'),
              qty: args.value,
              options: {
                line: args.keyboard.line
              }
            });
            args.keyboard.receipt.trigger('scan');
          }
        });
        };

    var actionRemoveProduct = function (keyboard, value) {
        if (keyboard.receipt.get('isEditable') === false) {
          me.doShowPopup({
            popup: 'modalNotEditableOrder'
          });
          return true;
        }
        if (keyboard.line && keyboard.line.get('product').get('isEditableQty') === false) {
          me.doShowPopup({
            popup: 'modalNotEditableLine'
          });
          return true;
        }
        if (keyboard.line) {
          keyboard.receipt.removeUnit(keyboard.line, value);
          keyboard.receipt.trigger('scan');
        }
        };

    // action bindable to a command that completely deletes a product from the order list
    var actionDeleteLine = function (keyboard) {
        if (keyboard.receipt.get('isEditable') === false) {
          me.doShowPopup({
            popup: 'modalNotEditableOrder'
          });
          return true;
        }
        if (keyboard.line && keyboard.line.get('product').get('isEditableQty') === false) {
          me.doShowPopup({
            popup: 'modalNotEditableLine'
          });
          return true;
        }
        if (keyboard.line) {
          keyboard.receipt.deleteLine(keyboard.line);
          keyboard.receipt.trigger('scan');
        }
        };

    this.addCommand('line:qty', {
      action: function (keyboard, txt) {
        var value = OB.I18N.parseNumber(txt);
        if (!keyboard.line) {
          return true;
        }
        if (value || value === 0) {
          value = value - keyboard.line.get('qty');
          if (value > 0) {
            actionAddProduct(keyboard, value);
          } else if (value < 0) {
            actionAddProduct(keyboard, value);
          }
        }
      }
    });

    this.addCommand('line:price', {
      permission: 'OBPOS_order.changePrice',
      action: function (keyboard, txt) {
        if (keyboard.receipt.get('isEditable') === false) {
          me.doShowPopup({
            popup: 'modalNotEditableOrder'
          });
          return true;
        }
        if (!keyboard.line) {
          return true;
        }
        if (keyboard.line.get('product').get('isEditablePrice') === false) {
          me.doShowPopup({
            popup: 'modalNotEditableLine'
          });
          return true;
        }
        if (keyboard.line) {
          keyboard.receipt.setPrice(keyboard.line, OB.I18N.parseNumber(txt));
          keyboard.receipt.trigger('scan');
        }
      }
    });

    this.addCommand('line:dto', {
      permission: 'OBPOS_order.discount',
      action: function (keyboard, txt) {
        if (keyboard.receipt.get('isEditable') === false) {
          me.doShowPopup({
            popup: 'modalNotEditableOrder'
          });
          return true;
        }
        if (keyboard.line) {
          keyboard.receipt.trigger('discount', keyboard.line, OB.I18N.parseNumber(txt));
        }
      }
    });

    this.addCommand('screen:dto', {
      stateless: true,
      permission: 'OBPOS_order.discount',
      action: function (keyboard, txt) {
        me.doDiscountsMode({
          tabPanel: 'edit',
          keyboard: 'toolbardiscounts',
          edit: false,
          options: {
            discounts: true
          }
        });
      }
    });

    //To be used in the discounts side bar
    this.addCommand('ticket:discount', {
      permission: 'OBPOS_retail.advDiscounts',
      action: function (keyboard, txt) {
        if (keyboard.discountsMode) {
          me.doSetDiscountQty({
            qty: OB.I18N.parseNumber(txt)
          });
          return true;
        }
      }
    });

    this.addCommand('code', new OB.UI.BarcodeActionHandler());

    this.addCommand('+', {
      stateless: true,
      action: function (keyboard, txt) {
        var qty = 1;
        if ((!_.isNull(txt) || !_.isUndefined(txt)) && !_.isNaN(OB.I18N.parseNumber(txt))) {
          qty = OB.I18N.parseNumber(txt);
        }
        actionAddProduct(keyboard, qty);
      }
    });
    this.addCommand('-', {
      stateless: true,
      action: function (keyboard, txt) {
        var qty = 1;
        if ((!_.isNull(txt) || !_.isUndefined(txt)) && !_.isNaN(OB.I18N.parseNumber(txt))) {
          qty = OB.I18N.parseNumber(txt);
        }
        actionAddProduct(keyboard, -qty);
      }
    });
    // add a command that will handle the DELETE keyboard key
    this.addCommand('line:delete', {
      stateless: true,
      action: function (keyboard) {
        actionDeleteLine(keyboard);
      }
    });

    // calling super after setting keyboard properties
    this.inherited(arguments);


    this.addToolbarComponent('OB.OBPOSPointOfSale.UI.ToolbarPayment');
    this.addToolbar(OB.OBPOSPointOfSale.UI.ToolbarScan);
    this.addToolbar(OB.OBPOSPointOfSale.UI.ToolbarDiscounts);
  },

  init: function () {
    // Add the keypads for each payment method
    this.initCurrencyKeypads();

    _.each(this.keypads, function (keypadname) {
      this.addKeypad(keypadname);
    }, this);
  },
  initCurrencyKeypads: function () {
    var me = this;
    var currenciesManaged = {};

    _.each(OB.POS.modelterminal.get('payments'), function (payment) {
      // Is cash method if is checked as iscash or is the legacy hardcoded cash method for euros.
      if ((payment.paymentMethod.iscash || (payment.payment.searchKey === 'OBPOS_payment.cash' && payment.paymentMethod.currency === '102')) && !currenciesManaged[payment.paymentMethod.currency]) {
        // register that is already built
        currenciesManaged[payment.paymentMethod.currency] = true;

        // Build the panel
        OB.Dal.find(OB.Model.CurrencyPanel, {
          'currency': payment.paymentMethod.currency
        }, function (datacurrency) {
          if (datacurrency.length > 0) {
            me.buildCoinsAndNotesPanel(payment, payment.symbol, datacurrency);
          } else if (payment.payment.searchKey === 'OBPOS_payment.cash' && payment.paymentMethod.currency === '102') {
            // Add the legacy keypad if is the legacy hardcoded cash method for euros.
            me.addKeypad('OB.UI.KeypadCoinsLegacy');
          }
        }, function (tx, error) {
          OB.UTIL.showError("OBDAL error: " + error);
        });
      }
    }, this);
  },

  buildCoinsAndNotesButton: function (paymentkey, coin) {
    if (coin) {
      return {
        kind: 'OB.UI.PaymentButton',
        paymenttype: paymentkey,
        amount: coin.get('amount'),
        background: coin.get('backcolor') || '#f3bc9e',
        bordercolor: coin.get('bordercolor') || coin.get('backcolor') || '#f3bc9e'
      };
    } else {
      return {
        kind: 'OB.UI.ButtonKey',
        classButton: 'btnkeyboard-num',
        label: '',
        command: 'dummy'
      };
    }
  },

  buildCoinsAndNotesPanel: function (payment, symbol, datacurrency) {

    enyo.kind({
      name: 'OB.UI.Keypad' + payment.payment.searchKey,
      label: _.template('<%= symbol %>,<%= symbol %>,<%= symbol %>,...', {
        symbol: symbol
      }),
      padName: 'Coins-' + payment.paymentMethod.currency,
      padPayment: payment.payment.searchKey,
      components: [{
        classes: 'row-fluid',
        components: [{
          classes: 'span4',
          components: [{
            kind: 'OB.UI.ButtonKey',
            classButton: 'btnkeyboard-num',
            label: '/',
            command: '/'
          }]
        }, {
          classes: 'span4',
          components: [{
            kind: 'OB.UI.ButtonKey',
            classButton: 'btnkeyboard-num',
            label: '*',
            command: '*'
          }]
        }, {
          classes: 'span4',
          components: [{
            kind: 'OB.UI.ButtonKey',
            classButton: 'btnkeyboard-num',
            label: '%',
            command: '%'
          }]
        }]
      }, {
        classes: 'row-fluid',
        components: [{
          classes: 'span4',
          components: [this.buildCoinsAndNotesButton(payment.payment.searchKey, datacurrency.at(9))]
        }, {
          classes: 'span4',
          components: [this.buildCoinsAndNotesButton(payment.payment.searchKey, datacurrency.at(10))]
        }, {
          classes: 'span4',
          components: [this.buildCoinsAndNotesButton(payment.payment.searchKey, datacurrency.at(11))]
        }]
      }, {
        classes: 'row-fluid',
        components: [{
          classes: 'span4',
          components: [this.buildCoinsAndNotesButton(payment.payment.searchKey, datacurrency.at(6))]
        }, {
          classes: 'span4',
          components: [this.buildCoinsAndNotesButton(payment.payment.searchKey, datacurrency.at(7))]
        }, {
          classes: 'span4',
          components: [this.buildCoinsAndNotesButton(payment.payment.searchKey, datacurrency.at(8))]
        }]
      }, {
        classes: 'row-fluid',
        components: [{
          classes: 'span4',
          components: [this.buildCoinsAndNotesButton(payment.payment.searchKey, datacurrency.at(3))]
        }, {
          classes: 'span4',
          components: [this.buildCoinsAndNotesButton(payment.payment.searchKey, datacurrency.at(4))]
        }, {
          classes: 'span4',
          components: [this.buildCoinsAndNotesButton(payment.payment.searchKey, datacurrency.at(5))]
        }]
      }, {
        classes: 'row-fluid',
        components: [{
          classes: 'span4',
          components: [this.buildCoinsAndNotesButton(payment.payment.searchKey, datacurrency.at(0))]
        }, {
          classes: 'span4',
          components: [this.buildCoinsAndNotesButton(payment.payment.searchKey, datacurrency.at(1))]
        }, {
          classes: 'span4',
          components: [this.buildCoinsAndNotesButton(payment.payment.searchKey, datacurrency.at(2))]
        }]
      }]
    });
    this.addKeypad('OB.UI.Keypad' + payment.payment.searchKey);
  }
});

enyo.kind({
  // Overwrite this component to customize the BarcodeActionHandler
  name: 'OB.UI.BarcodeActionHandler',
  kind: 'OB.UI.AbstractBarcodeActionHandler',
  findProductByBarcode: function (txt, callback) {
    var criteria;

    function errorCallback(tx, error) {
      OB.UTIL.showError("OBDAL error: " + error);
    }

    function successCallbackProducts(dataProducts) {
      if (dataProducts && dataProducts.length > 0) {
        callback(new Backbone.Model(dataProducts.at(0)));
      } else {
        // 'UPC/EAN code not found'
        OB.UTIL.showWarning(OB.I18N.getLabel('OBPOS_KbUPCEANCodeNotFound', [txt]));
      }
    }
    criteria = {
      '_whereClause': 'WHERE upper(upc) = "' + txt + '"'
    };
    OB.Dal.find(OB.Model.Product, criteria, successCallbackProducts, errorCallback);
  },

  addProductToReceipt: function (keyboard, product) {
    keyboard.doAddProduct({
      product: product
    });
    keyboard.receipt.trigger('scan');
  }
});