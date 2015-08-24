/*
 ************************************************************************************
 * Copyright (C) 2012-2015 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, enyo, _, Backbone */


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
    onDiscountsMode: '',
    onSetMultiSelectionItems: ''
  },
  discountsMode: false,
  handlers: {
    onSetMultiSelected: 'setMultiSelected',
    onKeyboardOnDiscountsMode: 'keyboardOnDiscountsMode'
  },
  setMultiSelected: function (inSender, inEvent) {
    if (inEvent.models && inEvent.models.length > 0 && !(inEvent.models[0] instanceof OB.Model.OrderLine)) {
      return;
    }
    this.selectedModels = inEvent.models;
    this.selectedModelsSameQty = true;
    if (this.selectedModels.length > 1) {
      var i, qty = this.selectedModels[0].get('qty');
      for (i = 1; i < this.selectedModels.length; i++) {
        if (qty !== this.selectedModels[i].get('qty')) {
          this.selectedModelsSameQty = false;
          break;
        }
      }
    }
    this.$.minusBtn.waterfall('onDisableButton', {
      disabled: !this.selectedModelsSameQty
    });
    this.$.plusBtn.waterfall('onDisableButton', {
      disabled: !this.selectedModelsSameQty
    });
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
      if (this.prevdefaultcommand) {
        this.defaultcommand = this.prevdefaultcommand;
      }
      if (this.buttons['ticket:discount']) {
        this.buttons['ticket:discount'].removeClass('btnactive');
      }

      this.keyboardDisabled(inSender, {
        status: false
      });
    } else {
      this.discountsMode = true;
      this.prevdefaultcommand = this.defaultcommand;
      this.defaultcommand = 'ticket:discount';
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
      this.clearInput();
    }, this);
  },
  initComponents: function () {
    var me = this;

    var actionAddProduct = function (keyboard, value, linesNotToReturn, linesReturned) {
        if (!keyboard.line.get('notReturnThisLine')) {
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
            if ((_.isNaN(value) || value > 0) && keyboard.line.get('product').get('groupProduct') === false) {
              me.doShowPopup({
                popup: 'modalProductCannotBeGroup'
              });
              return true;
            }
            if (linesReturned === (me.selectedModels.length - linesNotToReturn)) {
              me.getReceipt().unset('notAllowCalculateGross');
            }
            me.doAddProduct({
              product: keyboard.line.get('product'),
              qty: value,
              options: {
                line: keyboard.line
              }
            });
            keyboard.receipt.trigger('scan');
          }
        } else {
          keyboard.line.unset('notReturnThisLine');
        }
        };

    var actionAddMultiProduct = function (keyboard, qty, linesNotToReturn) {
        if (me.selectedModelsSameQty) {
          keyboard.receipt.set('undo', null);
          keyboard.receipt.set('multipleUndo', true);
          var selection = [],
              linesReturned = 0;
          _.each(me.selectedModels, function (model) {
            selection.push(model);
            keyboard.line = model;
            if (!keyboard.line.get('notReturnThisLine')) {
              linesReturned++;
            }
            actionAddProduct(keyboard, qty, linesNotToReturn, linesReturned);
          });
          keyboard.receipt.set('multipleUndo', null);
          me.doSetMultiSelectionItems({
            selection: selection
          });
        }
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
          if (me.selectedModels.length > 1) {
            keyboard.receipt.deleteLines(me.selectedModels);
          } else {
            keyboard.receipt.deleteLine(keyboard.line);
          }
          keyboard.receipt.trigger('scan');
        }
        };

    this.addCommand('line:qty', {
      action: function (keyboard, txt) {
        var value = OB.I18N.parseNumber(txt),
            toadd;
        if (!keyboard.line) {
          return true;
        }
        if (value || value === 0) {
          keyboard.receipt.set('undo', null);
          keyboard.receipt.set('multipleUndo', true);
          var selection = [];
          _.each(me.selectedModels, function (model) {
            selection.push(model);
            keyboard.line = model;
            toadd = value - keyboard.line.get('qty');
            if (toadd !== 0) {
              if (value === 0) { // If final quantity will be 0 then request approval
                OB.UTIL.Approval.requestApproval(me.model, 'OBPOS_approval.deleteLine', function (approved, supervisor, approvalType) {
                  if (approved) {
                    actionAddProduct(keyboard, toadd);
                  }
                });
              } else {
                actionAddProduct(keyboard, toadd);
              }
            }
          });
          keyboard.receipt.set('multipleUndo', null);
          me.doSetMultiSelectionItems({
            selection: selection
          });
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
          OB.UTIL.Approval.requestApproval(
          me.model, 'OBPOS_approval.setPrice', function (approved, supervisor, approvalType) {
            if (approved) {
              var price = OB.I18N.parseNumber(txt);
              if (me.selectedModels.length > 1) {
                keyboard.receipt.set('undo', null);
                keyboard.receipt.set('multipleUndo', true);
                _.each(me.selectedModels, function (model) {
                  keyboard.receipt.setPrice(model, price);
                });
                keyboard.receipt.set('multipleUndo', null);
              } else {
                keyboard.receipt.setPrice(keyboard.line, price);
              }
              keyboard.receipt.calculateGross();
              keyboard.receipt.trigger('scan');
            }
          });
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
        if (OB.MobileApp.model.get('permissions')["OBPOS_retail.discountkeyboard"] === true || keyboard.line.getQty() < 0) {
          OB.UTIL.showWarning(OB.I18N.getLabel('OBMOBC_LineCanNotBeSelected'));
          return true;
        }
        keyboard.receipt.set('undo', null);
        keyboard.receipt.set('multipleUndo', true);
        var discount = OB.I18N.parseNumber(txt);
        _.each(me.selectedModels, function (model) {
          keyboard.receipt.trigger('discount', model, discount);
        });
        keyboard.receipt.set('multipleUndo', null);
      }
    });

    this.addCommand('screen:dto', {
      stateless: true,
      permission: 'OBPOS_order.discount',
      action: function (keyboard, txt) {
        if (keyboard.receipt.get('isEditable') === false) {
          me.doShowPopup({
            popup: 'modalNotEditableOrder'
          });
          return true;
        }
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
        var qty = 1,
            linesNotToReturn = 0;
        _.each(me.selectedModels, function (line) {
          if (line.get('product').get('productType') === 'S' && line.get('relatedLines')) {
            linesNotToReturn++;
          }
        });
        if ((!_.isNull(txt) || !_.isUndefined(txt)) && !_.isNaN(OB.I18N.parseNumber(txt))) {
          qty = OB.I18N.parseNumber(txt);
        }
        me.getReceipt().set('ignoreCalculateGross', true);
        me.getReceipt().set('notAllowCalculateGross', true);
        if (me.selectedModels.length > 1) {
          actionAddMultiProduct(keyboard, qty, linesNotToReturn);
        } else {
          keyboard.receipt.set('multipleUndo', null);
          actionAddProduct(keyboard, qty, linesNotToReturn, 1);
        }
      }
    });

    this.addCommand('-', {
      stateless: true,
      action: function (keyboard, txt) {
        var qty = 1,
            value, i, j, k, h, line, relatedLine, lineFromSelected, linesNotToReturn = 0;

        function actionAddProducts() {
          me.getReceipt().set('ignoreCalculateGross', true);
          me.getReceipt().set('notAllowCalculateGross', true);
          if (me.selectedModels.length > 1) {
            actionAddMultiProduct(keyboard, -qty, linesNotToReturn);
          } else {
            keyboard.receipt.set('multipleUndo', null);
            actionAddProduct(keyboard, -qty, linesNotToReturn, 1);
          }
        }
        if ((!_.isNull(txt) || !_.isUndefined(txt)) && !_.isNaN(OB.I18N.parseNumber(txt))) {
          qty = OB.I18N.parseNumber(txt);
        }
        if (!_.isUndefined(keyboard.line)) {
          value = keyboard.line.get('qty') - qty;
        }
        if (value === 0) { // If final quantity will be 0 then request approval
          OB.UTIL.Approval.requestApproval(me.model, 'OBPOS_approval.deleteLine', function (approved, supervisor, approvalType) {
            if (approved) {
              if (me.selectedModels.length > 1) {
                keyboard.receipt.deleteLines(me.selectedModels);
                keyboard.receipt.trigger('scan');
              } else {
                keyboard.receipt.set('multipleUndo', null);
                actionAddProduct(keyboard, -qty);
              }
            }
          });
        } else {
          var approvalNeeded = false,
              servicesToApprove = '',
              servicesList = [];
          if (value < 0) {
            for (i = 0; i < me.selectedModels.length; i++) {
              line = me.selectedModels[i];
              if (line.get('product').get('productType') === 'S' && !line.isReturnable()) {
                OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_UnreturnableProduct'), OB.I18N.getLabel('OBPOS_UnreturnableProductMessage', [line.get('product').get('_identifier')]));
                return;
              } else if (!approvalNeeded) {
                // A service with its related product selected doesn't need to be returned, because later it will be modified to returned status depending in the product status
                // In any other case it would require two approvals
                if (line.get('product').get('productType') === 'S') {
                  if (line.get('relatedLines')) {
                    for (j = 0; j < line.get('relatedLines').length; j++) {
                      relatedLine = line.get('relatedLines')[j];
                      for (k = 0; k < me.selectedModels.length; k++) {
                        lineFromSelected = me.selectedModels[k];
                        if (lineFromSelected.id === relatedLine.orderlineId) {
                          line.set('notReturnThisLine', true);
                          linesNotToReturn++;
                          servicesToApprove += '<br>· ' + line.get('product').get('_identifier');
                          servicesList.push(line.get('product'));
                          break;
                        }
                      }
                      if (k === me.selectedModels.length) {
                        OB.UTIL.showWarning(OB.I18N.getLabel('OBPOS_NotProductSelectedToReturn', [line.get('product').get('_identifier')]));
                        return;
                      }
                    }
                  } else {
                    servicesToApprove += '<br>· ' + line.get('product').get('_identifier');
                    servicesList.push(line.get('product'));
                  }
                  if (!approvalNeeded) {
                    approvalNeeded = true;
                  }
                }
              }
            }
            for (i = 0; i < me.getReceipt().get('lines').length; i++) { // Check if there is any not returnable related product to a selected line
              line = OB.MobileApp.model.receipt.get('lines').models[i];
              if (line.get('product').get('productType') === 'S' && !line.isReturnable()) {
                if (line.get('relatedLines')) {
                  for (j = 0; j < line.get('relatedLines').length; j++) {
                    relatedLine = line.get('relatedLines')[j];
                    for (k = 0; k < me.selectedModels.length; k++) {
                      lineFromSelected = me.selectedModels[k];
                      if (lineFromSelected.id === relatedLine.orderlineId) {
                        OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_UnreturnableRelatedService'), OB.I18N.getLabel('OBPOS_UnreturnableRelatedServiceMessage', [line.get('product').get('_identifier'), relatedLine.productName]));
                        return;
                      }
                    }
                  }
                }
              } else if (line.get('product').get('productType') === 'S' && line.isReturnable()) { // Ask for approval for non selected services, related to selected products
                if (line.get('relatedLines')) {
                  for (j = 0; j < line.get('relatedLines').length; j++) {
                    relatedLine = line.get('relatedLines')[j];
                    for (k = 0; k < me.selectedModels.length; k++) {
                      lineFromSelected = me.selectedModels[k];
                      if (lineFromSelected.id === relatedLine.orderlineId) {
                        for (h = 0; h < servicesList.length; h++) {
                          if (servicesList[h].id === line.get('product').id) {
                            break;
                          }
                        }
                        if (h === servicesList.length) {
                          servicesToApprove += '<br>· ' + line.get('product').get('_identifier');
                          servicesList.push(line.get('product'));
                          if (!approvalNeeded) {
                            approvalNeeded = true;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          if (approvalNeeded) {
            OB.UTIL.Approval.requestApproval(
            me.model, [{
              approval: 'OBPOS_approval.returnService',
              message: 'OBPOS_approval.returnService',
              params: [servicesToApprove]
            }], function (approved, supervisor, approvalType) {
              if (approved) {
                me.getReceipt().set('notApprove', true);
                actionAddProducts();
              } else {
                _.each(me.selectedModels, function (line) {
                  if (line.get('notReturnThisLine')) {
                    line.unset('notReturnThisLine');
                  }
                });
              }
            });
          } else {
            actionAddProducts();
          }
        }
      }
    });

    // add a command that will handle the DELETE keyboard key
    this.addCommand('line:delete', {
      stateless: true,
      action: function (keyboard) {
        OB.UTIL.Approval.requestApproval(me.model, 'OBPOS_approval.deleteLine', function (approved, supervisor, approvalType) {
          if (approved) {
            actionDeleteLine(keyboard);
          }
        });
      }
    });

    // calling super after setting keyboard properties
    this.inherited(arguments);

    this.addToolbarComponent('OB.OBPOSPointOfSale.UI.ToolbarPayment');
    this.addToolbar(OB.OBPOSPointOfSale.UI.ToolbarScan);
    this.addToolbar(OB.OBPOSPointOfSale.UI.ToolbarDiscounts);
  },


  init: function (model) {
    this.model = model;
    // Add the keypads for each payment method
    this.initCurrencyKeypads();

    _.each(this.keypads, function (keypadname) {
      this.addKeypad(keypadname);
    }, this);
  },
  initCurrencyKeypads: function () {
    var me = this;
    var currenciesManaged = {};

    _.each(OB.MobileApp.model.get('payments'), function (payment) {
      // Is cash method if is checked as iscash or is the legacy hardcoded cash method for euros.
      if ((payment.paymentMethod.iscash && payment.paymentMethod.showkeypad) && !currenciesManaged[payment.paymentMethod.currency]) {
        // register that is already built
        currenciesManaged[payment.paymentMethod.currency] = true;

        // Build the panel
        OB.Dal.find(OB.Model.CurrencyPanel, {
          'currency': payment.paymentMethod.currency,
          _orderByClause: 'line'
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

  errorCallback: function (tx, error) {
    OB.UTIL.showError("OBDAL error: " + error);
  },

  findProductByBarcode: function (code, callback) {
    OB.debug('BarcodeActionHandler - id: ' + code);
    this.searchProduct(code, callback);
  },

  searchProduct: function (code, callback) {
    var me = this,
        criteria = {
        uPCEAN: code
        };
    if (OB.MobileApp.model.hasPermission('OBPOS_highVolume.product', true)) {
      var uPCEAN = {
        columns: ['uPCEAN'],
        operator: 'equals',
        value: code
      };
      var hgVolCriteria = [uPCEAN];
      criteria.hgVolFilters = hgVolCriteria;
    }

    OB.Dal.find(OB.Model.Product, criteria, function (data) {
      me.searchProductCallback(data, code, callback);
    }, me.errorCallback, this);
  },

  searchProductCallback: function (data, code, callback) {
    this.successCallbackProducts(data, code, callback);
  },

  successCallbackProducts: function (dataProducts, code, callback) {
    if (dataProducts && dataProducts.length > 0) {
      OB.debug('productfound');
      callback(dataProducts.at(0));
    } else {
      // 'UPC/EAN code not found'
      OB.UTIL.showWarning(OB.I18N.getLabel('OBPOS_KbUPCEANCodeNotFound', [code]));
    }
  },

  addProductToReceipt: function (keyboard, product) {
    keyboard.doAddProduct({
      product: product
    });
    keyboard.receipt.trigger('scan');
  }
});