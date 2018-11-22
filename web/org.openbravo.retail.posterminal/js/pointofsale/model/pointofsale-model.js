/*
 ************************************************************************************
 * Copyright (C) 2012-2018 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, Backbone, enyo, _, BigDecimal, localStorage */

OB.OBPOSPointOfSale = OB.OBPOSPointOfSale || {};
OB.OBPOSPointOfSale.Model = OB.OBPOSPointOfSale.Model || {};
OB.OBPOSPointOfSale.UI = OB.OBPOSPointOfSale.UI || {};

//Window model
OB.OBPOSPointOfSale.Model.PointOfSale = OB.Model.TerminalWindowModel.extend({
  models: [{
    generatedModel: true,
    modelName: 'TaxRate'
  }, {
    generatedModel: true,
    modelName: 'TaxZone'
  },
  OB.Model.Product, OB.Model.ProductCategory, OB.Model.ProductCategoryTree, OB.Model.PriceList, OB.Model.ProductPrice, OB.Model.OfferPriceList, OB.Model.ServiceProduct, OB.Model.ServiceProductCategory, OB.Model.ServicePriceRule, OB.Model.ServicePriceRuleRange, OB.Model.ServicePriceRuleRangePrices, OB.Model.ServicePriceRuleVersion, OB.Model.BusinessPartner, OB.Model.BPCategory, OB.Model.BPLocation, OB.Model.Order, OB.Model.DocumentSequence, OB.Model.ChangedBusinessPartners, OB.Model.ChangedBPlocation, OB.Model.ProductBOM, OB.Model.TaxCategoryBOM, OB.Model.CancelLayaway,
  {
    generatedModel: true,
    modelName: 'Discount'
  }, {
    generatedModel: true,
    modelName: 'DiscountFilterBusinessPartner'
  }, {
    generatedModel: true,
    modelName: 'DiscountFilterBusinessPartnerGroup'
  }, {
    generatedModel: true,
    modelName: 'DiscountFilterProduct'
  }, {
    generatedModel: true,
    modelName: 'DiscountFilterProductCategory'
  }, {
    generatedModel: true,
    modelName: 'DiscountFilterRole'
  }, {
    generatedModel: true,
    modelName: 'DiscountFilterCharacteristic'
  },
  OB.Model.CurrencyPanel, OB.Model.SalesRepresentative, OB.Model.Brand, OB.Model.ProductCharacteristicValue, OB.Model.CharacteristicValue, OB.Model.Characteristic, OB.Model.ReturnReason, OB.Model.CashUp, OB.Model.OfflinePrinter, OB.Model.PaymentMethodCashUp, OB.Model.TaxCashUp, OB.Model.Country],

  loadUnpaidOrders: function (loadUnpaidOrdersCallback) {
    // Shows a modal window with the orders pending to be paid
    var orderlist = this.get('orderList'),
        model = this,
        criteria = {
        'hasbeenpaid': 'N'
        };
    OB.Dal.find(OB.Model.Order, criteria, function (ordersNotPaid) { //OB.Dal.find success
      var currentOrder = {},
          loadOrderStr;

      // Getting Max Document No, Quotation No from Unpaid orders
      var maxDocumentNo = 0,
          maxQuotationNo = 0,
          maxReturnNo = 0;
      _.each(ordersNotPaid.models, function (order) {
        if (order) {
          if (order.get('documentnoSuffix') > maxDocumentNo) {
            maxDocumentNo = order.get('documentnoSuffix');
          }
          if (order.get('quotationnoSuffix') > maxQuotationNo) {
            maxQuotationNo = order.get('quotationnoSuffix');
          }
          if (order.get('returnnoSuffix') > maxReturnNo) {
            maxReturnNo = order.get('returnnoSuffix');
          }
        }
      });

      // Setting the Max Document No, Quotation No to their respective Threshold
      if (maxDocumentNo > 0 && OB.MobileApp.model.documentnoThreshold < maxDocumentNo) {
        OB.MobileApp.model.documentnoThreshold = maxDocumentNo;
      }
      if (maxQuotationNo > 0 && OB.MobileApp.model.quotationnoThreshold < maxQuotationNo) {
        OB.MobileApp.model.quotationnoThreshold = maxQuotationNo;
      }
      if (maxReturnNo > 0 && OB.MobileApp.model.returnnoThreshold < maxReturnNo) {
        OB.MobileApp.model.returnnoThreshold = maxReturnNo;
      }

      // Removing Orders which are created in other users session 
      var outOfSessionOrder = _.filter(ordersNotPaid.models, function (order) {
        if (order && order.get('session') !== OB.MobileApp.model.get('session')) {
          return true;
        }
      });
      _.each(outOfSessionOrder, function (orderToRemove) {
        ordersNotPaid.remove(orderToRemove);
      });

      //removing Orders lines without mandatory fields filled
      OB.UTIL.HookManager.executeHooks('OBPOS_CheckReceiptMandatoryFields', {
        orders: ordersNotPaid.models
      }, function (args) {
        _.each(args.removeOrderList, function (orderToRemove) {
          ordersNotPaid.remove(orderToRemove);
        });
      });

      OB.UTIL.HookManager.executeHooks('OBPOS_PreLoadUnpaidOrdersHook', {
        ordersNotPaid: ordersNotPaid,
        model: model
      }, function (args) {
        OB.MobileApp.model.on('window:ready', function () {
          OB.MobileApp.model.off('window:ready', null, model);
          if (!args.ordersNotPaid || args.ordersNotPaid.length === 0) {
            // If there are no pending orders,
            //  add an initial empty order
            orderlist.addFirstOrder();
          } else {
            // The order object is stored in the json property of the row fetched from the database
            orderlist.reset(args.ordersNotPaid.models);
            // At this point it is sure that there exists at least one order
            // Function to continue of there is some error
            currentOrder = args.ordersNotPaid.models[0];
            orderlist.load(currentOrder);
            loadOrderStr = OB.I18N.getLabel('OBPOS_Order') + currentOrder.get('documentNo') + OB.I18N.getLabel('OBPOS_Loaded');
            OB.UTIL.showAlert.display(loadOrderStr, OB.I18N.getLabel('OBPOS_Info'));
          }
        }, model);
        loadUnpaidOrdersCallback();
      });
    }, function () { //OB.Dal.find error
      OB.MobileApp.model.on('window:ready', function () {
        OB.MobileApp.model.off('window:ready', null, model);
        // If there is an error fetching the pending orders,
        // add an initial empty order
        orderlist.addFirstOrder();
      }, model);
      loadUnpaidOrdersCallback();
    });
  },

  loadCheckedMultiorders: function () {
    // Shows a modal window with the orders pending to be paid
    var checkedMultiOrders, multiOrders = this.get('multiOrders'),
        multiOrderList = multiOrders.get('multiOrdersList'),
        me = this,
        criteria = {
        'hasbeenpaid': 'N',
        'session': OB.MobileApp.model.get('session')
        };
    OB.Dal.find(OB.Model.Order, criteria, function (possibleMultiOrder) { //OB.Dal.find success
      if (possibleMultiOrder && possibleMultiOrder.length > 0) {
        checkedMultiOrders = _.compact(possibleMultiOrder.map(function (e) {
          if (e.get('checked')) {
            return e;
          }
        }));

        multiOrderList.reset(checkedMultiOrders);

        // MultiOrder payments
        var payments = JSON.parse(OB.UTIL.localStorage.getItem('multiOrdersPayment'));
        _.each(payments, function (payment) {
          multiOrders.addPayment(new OB.Model.PaymentLine(payment));
        });
      } else if (me.isValidMultiOrderState()) {
        multiOrders.resetValues();
        me.get('leftColumnViewManager').setOrderMode();
      }
    }, function () {
      // If there is an error fetching the checked orders of multiorders,
      //OB.Dal.find error
    });
  },
  isValidMultiOrderState: function () {
    if (this.get('leftColumnViewManager') && this.get('multiOrders')) {
      return this.get('leftColumnViewManager').isMultiOrder() && this.get('multiOrders').hasDataInList();
    }
    return false;
  },
  getPending: function () {
    if (this.get('leftColumnViewManager').isOrder()) {
      return this.get('order').getPending();
    } else {
      return this.get('multiOrders').getPending();
    }
  },
  getChange: function () {
    if (this.get('leftColumnViewManager').isOrder()) {
      return this.get('order').getChange();
    } else {
      return this.get('multiOrders').getChange();
    }
  },
  getTotal: function () {
    if (this.get('leftColumnViewManager').isOrder()) {
      return this.get('order').getTotal();
    } else {
      return this.get('multiOrders').getTotal();
    }
  },
  getPrepaymentAmount: function () {
    if (this.get('leftColumnViewManager').isOrder()) {
      return this.get('order').get('obposPrepaymentamt');
    } else {
      return this.get('multiOrders').get('obposPrepaymentamt');
    }
  },
  getPayment: function () {
    if (this.get('leftColumnViewManager').isOrder()) {
      return this.get('order').getPayment();
    } else {
      return this.get('multiOrders').getPayment();
    }
  },
  addPayment: function (payment, callback) {
    var modelToIncludePayment;

    if (this.get('leftColumnViewManager').isOrder()) {
      modelToIncludePayment = this.get('order');
    } else {
      modelToIncludePayment = this.get('multiOrders');
    }

    modelToIncludePayment.addPayment(payment, callback);
  },
  deleteMultiOrderList: function () {
    var i;

    var checkIsPrepaymentExit = function (paymentList) {
        var hasnoPrepaymentPayment;
        if (paymentList.length > 0) {
          hasnoPrepaymentPayment = _.find(paymentList.models, function (item) {
            if (!item.get('isPrePayment')) {
              return item;
            }
          });
        }
        return (_.isUndefined(hasnoPrepaymentPayment));
        };

    for (i = 0; this.get('multiOrders').get('multiOrdersList').length > i; i++) {
      if (!this.get('multiOrders').get('multiOrdersList').at(i).get('isLayaway')) { //if it is not true, it means that this is either a new order or a newly generated layaway (not a loaded layaway)
        this.get('multiOrders').get('multiOrdersList').at(i).unset('amountToLayaway');
        continue;
      }
      this.get('orderList').current = this.get('multiOrders').get('multiOrdersList').at(i);
      if (checkIsPrepaymentExit(this.get('orderList').current.get('payments'))) {
        this.get('orderList').deleteCurrent();
        if (!_.isNull(this.get('multiOrders').get('multiOrdersList').at(i).id)) {
          this.get('orderList').deleteCurrentFromDatabase(this.get('multiOrders').get('multiOrdersList').at(i));
        }
      } else {
        OB.UTIL.showConfirmation.display('', OB.I18N.getLabel('OBPOS_RemoveReceiptWithPayment'));
      }
    }
  },
  init: function () {
    OB.error("This init method should never be called for this model. Call initModels and loadModels instead");
    this.initModels(function () {});
    this.loadModels(function () {});
  },
  initModels: function (callback) {
    var me = this;

    // create and expose the receipt
    var receipt = new OB.Model.Order();
    // fire events if the receipt model is the target of the OB.UTIL.clone method
    receipt.triggerEventsIfTargetOfSourceWhenCloning = function () {
      return true;
    };
    OB.MobileApp.model.receipt = receipt;

    // create the multiOrders and expose it
    var multiOrders = new OB.Model.MultiOrders();
    OB.MobileApp.model.multiOrders = multiOrders;
    // create the orderList and expose it
    var orderList = new OB.Collection.OrderList(receipt);
    OB.MobileApp.model.orderList = orderList;
    var auxReceiptList = [];

    // changing this initialization order may break the loading
    this.set('order', receipt);
    this.set('orderList', orderList);
    this.set('customer', new OB.Model.BusinessPartner());
    this.set('customerAddr', new OB.Model.BPLocation());
    this.set('multiOrders', multiOrders);
    OB.DATA.CustomerSave(this);
    OB.DATA.CustomerAddrSave(this);
    OB.DATA.OrderDiscount(receipt);
    OB.DATA.OrderSave(this);
    OB.DATA.OrderTaxes(receipt);

    this.printLine = new OB.OBPOSPointOfSale.Print.ReceiptLine(receipt);

    var ViewManager = Backbone.Model.extend({
      defaults: {
        currentWindow: {
          name: 'mainSubWindow',
          params: []
        }
      },
      initialize: function () {}
    });

    var LeftColumnViewManager = Backbone.Model.extend({
      defaults: {
        currentView: {}
      },
      initialize: function () {
        this.on('change:currentView', function (changedModel) {
          OB.UTIL.localStorage.setItem('leftColumnCurrentView', JSON.stringify(changedModel.get('currentView')));
          this.trigger(changedModel.get('currentView').name);
          OB.MobileApp.model.set('isMultiOrderState', changedModel.get('currentView').name === 'order' ? false : true);
        }, this);
      },
      setOrderMode: function (parameters) {
        this.set('currentView', {
          name: 'order',
          params: parameters
        });
        OB.UTIL.localStorage.setItem('leftColumnCurrentView', JSON.stringify(this.get('currentView')));
      },
      isOrder: function () {
        if (this.get('currentView').name === 'order') {
          return true;
        }
        return false;
      },
      setMultiOrderMode: function (parameters) {
        this.set('currentView', {
          name: 'multiorder',
          params: parameters
        });
      },
      isMultiOrder: function () {
        if (this.get('currentView').name === 'multiorder') {
          return true;
        }
        return false;
      }
    });

    this.set('leftColumnViewManager', new LeftColumnViewManager());
    this.set('subWindowManager', new ViewManager());

    OB.MobileApp.model.runSyncProcess(function () {
      OB.RR.RequestRouter.sendAllMessages();
      me.loadCheckedMultiorders();
    }, function () {
      OB.RR.RequestRouter.sendAllMessages();
      me.loadCheckedMultiorders();
    });

    this.checkOpenDrawer = function () {
      if (me.openDrawer) {
        OB.POS.hwserver.openDrawer({
          openFirst: true,
          receipt: me.get('leftColumnViewManager').isMultiOrder() ? me.get('multiOrders') : receipt
        }, OB.MobileApp.model.get('permissions').OBPOS_timeAllowedDrawerSales);
      }
    };

    var isSlowDevice = OB.UTIL.localStorage.getItem('benchmarkScore') && parseInt(OB.UTIL.localStorage.getItem('benchmarkScore'), 10) < 1000;

    // If the device is too slow and the preference allows it, or the terminal type is configured, a block screen is shown if the calculation of the receipt is taking more than 1 sec
    if ((OB.MobileApp.model.get('terminal') && OB.MobileApp.model.get('terminal').terminalType && OB.MobileApp.model.get('terminal').terminalType.processingblockscreen) || (isSlowDevice && OB.MobileApp.model.hasPermission('OBPOS_processingBlockScreenOnSlowDevices', true))) {
      receipt.on('calculatingReceipt', function () {
        enyo.$.scrim2.show();
        setTimeout(function () {
          if (receipt.calculatingReceipt === true) {
            OB.UTIL.showProcessing(true, OB.I18N.getLabel('OBPOS_receiptProcessing'));
          }
        }, 1000);
      });

      receipt.on('calculatedReceipt', function () {
        enyo.$.scrim2.hide();
        OB.UTIL.showProcessing(false);
      });
    }

    receipt.on('checkOpenDrawer', function () {
      me.checkOpenDrawer();
    });

    this.get('multiOrders').on('checkOpenDrawer', function () {
      me.checkOpenDrawer();
    });

    receipt.on('paymentAccepted', function () {
      OB.UTIL.TicketCloseUtils.paymentAccepted(receipt, orderList, function () {
        if (OB.MobileApp.view.openedPopup === null) {
          enyo.$.scrim.hide();
        }
      });
    }, this);

    receipt.on('paymentDone', function (openDrawer) {
      receipt.trigger('disableDoneButton');
      if (receipt.get('paymentDone')) {
        return true;
      }
      receipt.set('paymentDone', true);

      function callbackPaymentAccepted(allowedOpenDrawer) {
        if (allowedOpenDrawer) {
          me.openDrawer = openDrawer;
        }
        receipt.trigger('paymentAccepted');
      }

      function callbackOverpaymentExist(callback) {
        var symbol = OB.MobileApp.model.get('terminal').symbol;
        var symbolAtRight = OB.MobileApp.model.get('terminal').currencySymbolAtTheRight;
        var amount = receipt.getPaymentStatus().overpayment;
        var scrimShowing = enyo.$.scrim.showing;
        OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_OverpaymentWarningTitle'), OB.I18N.getLabel('OBPOS_OverpaymentWarningBody', [OB.I18N.formatCurrencyWithSymbol(amount, symbol, symbolAtRight)]), [{
          label: OB.I18N.getLabel('OBMOBC_LblOk'),
          isConfirmButton: true,
          scrimShowing: scrimShowing,
          action: function () {
            me.openDrawer = openDrawer;
            callback(true);
          }
        }, {
          label: OB.I18N.getLabel('OBMOBC_LblCancel'),
          action: function () {
            receipt.trigger('paymentCancel');
            callback(false);
          }
        }]);
      }

      function callbackPaymentAmountDistinctThanReceipt() {
        OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_PaymentAmountDistinctThanReceiptAmountTitle'), OB.I18N.getLabel('OBPOS_PaymentAmountDistinctThanReceiptAmountBody'), [{
          label: OB.I18N.getLabel('OBMOBC_LblOk'),
          isConfirmButton: true,
          action: function () {
            callback(true);
          }
        }, {
          label: OB.I18N.getLabel('OBMOBC_LblCancel'),
          action: function () {
            receipt.trigger('paymentCancel');
            callback(false);
          }
        }]);
      }

      function callbackErrorCancelAndReplace(errorMessage) {
        OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBMOBC_Error'), errorMessage);
        receipt.trigger('paymentCancel');
      }

      function callbackErrorCancelAndReplaceOffline() {
        OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBMOBC_Error'), OB.I18N.getLabel('OBMOBC_OfflineWindowRequiresOnline'));
        receipt.trigger('paymentCancel');
      }

      function callbackErrorOrderCancelled() {
        OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBMOBC_Error'), OB.I18N.getLabel('OBPOS_OrderReplacedError'));
        receipt.trigger('paymentCancel');
      }

      OB.UTIL.TicketCloseUtils.paymentDone(receipt, callbackPaymentAccepted, callbackOverpaymentExist, callbackPaymentAmountDistinctThanReceipt, callbackErrorCancelAndReplace, callbackErrorCancelAndReplaceOffline, callbackErrorOrderCancelled);
    }, this);

    this.get('multiOrders').on('paymentAccepted', function () {
      var multiorders = this.get('multiOrders');

      var ordersLength = multiorders.get('multiOrdersList').length;
      var auxRcpt, auxP;

      OB.UTIL.showLoading(true);

      //clone multiorders
      multiorders.set('frozenMultiOrdersList', new Backbone.Collection());
      multiorders.get('multiOrdersList').forEach(function (rcpt) {
        auxRcpt = new OB.Model.Order();
        OB.UTIL.clone(rcpt, auxRcpt);
        multiorders.get('frozenMultiOrdersList').add(auxRcpt);
      });

      //clone multiorders
      multiorders.set('frozenPayments', new Backbone.Collection());
      multiorders.get('payments').forEach(function (p) {
        auxP = new OB.Model.PaymentLine();
        OB.UTIL.clone(p, auxP);
        multiorders.get('frozenPayments').add(auxP);
      });

      function prepareToSendCallback(callback) {
        return function (order) {
          var auxReceipt = new OB.Model.Order();
          OB.UTIL.clone(order, auxReceipt);

          if (order.get('orderType') !== 2 && order.get('orderType') !== 3) {
            var negativeLines = _.filter(order.get('lines').models, function (line) {
              return line.get('qty') < 0;
            }).length;
            if (negativeLines === order.get('lines').models.length) {
              order.setOrderType('OBPOS_receipt.return', OB.DEC.One, {
                applyPromotions: false,
                saveOrder: false
              });
            } else {
              order.setOrderType('', OB.DEC.Zero, {
                applyPromotions: false,
                saveOrder: false
              });
            }
          }
          order.set('orderDate', new Date());
          if (callback instanceof Function) {
            callback();
          }
        };
      }

      function updateAmountToLayaway(order, amount) {
        var amountToLayaway = order.get('amountToLayaway');
        if (!OB.UTIL.isNullOrUndefined(amountToLayaway)) {
          order.set('amountToLayaway', OB.DEC.sub(amountToLayaway, amount));
        }
      }

      var setPaymentsToReceipts;
      setPaymentsToReceipts = function (orderList, paymentList, changePayments, orderListIndex, paymentListIndex, considerPrepaymentAmount, callback) {
        if (orderListIndex >= orderList.length || paymentListIndex >= paymentList.length) {
          if (paymentListIndex < paymentList.length && considerPrepaymentAmount) {
            setPaymentsToReceipts(orderList, paymentList, changePayments, 0, paymentListIndex, false, callback);
          } else if (callback instanceof Function) {
            // Finished
            callback();
          }
          return;
        }

        var order = orderList.at(orderListIndex),
            payment = paymentList.at(paymentListIndex),
            paymentLine;

        function addPaymentLine(paymentLine, payment, addPaymentCallback) {
          OB.UTIL.HookManager.executeHooks('OBPOS_MultiOrderAddPaymentLine', {
            paymentLine: paymentLine,
            origPayment: payment
          }, function (args) {
            order.addPayment(args.paymentLine, function () {
              updateAmountToLayaway(order, args.paymentLine.get('origAmount'));
              if (addPaymentCallback instanceof Function) {
                addPaymentCallback();
              }
            });
          });
        }

        if (orderListIndex === orderList.length - 1 && !considerPrepaymentAmount) {
          // Transfer everything
          order.set('changePayments', changePayments);
          if (paymentListIndex < paymentList.length) {
            if (OB.DEC.compare(payment.get('origAmount')) !== 0) {
              // Pending payments to add
              paymentLine = new OB.Model.PaymentLine();
              OB.UTIL.clone(payment, paymentLine);
              paymentLine.set('forceAddPayment', true);

              payment.set('origAmount', OB.DEC.Zero);
              payment.set('amount', OB.DEC.Zero);
              addPaymentLine(paymentLine, payment, function () {
                setPaymentsToReceipts(orderList, paymentList, changePayments, orderListIndex, paymentListIndex + 1, considerPrepaymentAmount, callback);
              });
            } else {
              setPaymentsToReceipts(orderList, paymentList, changePayments, orderListIndex, paymentListIndex + 1, considerPrepaymentAmount, callback);
            }
          } else {
            // No more payments to add, finish the process
            order.prepareToSend(prepareToSendCallback(function () {
              if (callback instanceof Function) {
                // Process finished
                callback();
              }
            }));
          }
        } else {
          var amountToPay;
          if (!OB.UTIL.isNullOrUndefined(order.get('amountToLayaway'))) {
            amountToPay = order.get('amountToLayaway');
          } else if (considerPrepaymentAmount) {
            amountToPay = OB.DEC.sub(order.get('obposPrepaymentamt') ? order.get('obposPrepaymentamt') : order.get('gross'), order.get('payment'));
          } else {
            amountToPay = OB.DEC.sub(order.get('gross'), order.get('payment'));
          }
          if (OB.DEC.compare(amountToPay) > 0) {
            var paymentMethod = OB.MobileApp.model.paymentnames[payment.get('kind')];
            paymentLine = new OB.Model.PaymentLine();
            OB.UTIL.clone(payment, paymentLine);

            if (payment.get('origAmount') <= amountToPay) {
              // Use all the remaining payment amount for this receipt
              payment.set('origAmount', OB.DEC.Zero);
              payment.set('amount', OB.DEC.Zero);
              addPaymentLine(paymentLine, payment, function () {
                setPaymentsToReceipts(orderList, paymentList, changePayments, orderListIndex, paymentListIndex + 1, considerPrepaymentAmount, callback);
              });
            } else {
              // Get part of the payment and go with the next order
              var amountToPayForeign = OB.DEC.mul(amountToPay, paymentMethod.mulrate, paymentMethod.obposPosprecision);
              payment.set('origAmount', OB.DEC.sub(payment.get('origAmount'), amountToPay));
              payment.set('amount', OB.DEC.sub(payment.get('amount'), amountToPayForeign));

              paymentLine.set('origAmount', amountToPay);
              paymentLine.set('amount', amountToPayForeign);

              addPaymentLine(paymentLine, payment, function () {
                order.prepareToSend(prepareToSendCallback(function () {
                  setPaymentsToReceipts(orderList, paymentList, changePayments, orderListIndex + 1, paymentListIndex, considerPrepaymentAmount, callback);
                }));
              });
            }
          } else {
            // This order is already paid, go to the next order
            order.prepareToSend(prepareToSendCallback(function () {
              setPaymentsToReceipts(orderList, paymentList, changePayments, orderListIndex + 1, paymentListIndex, considerPrepaymentAmount, callback);
            }));
          }
        }
      };

      OB.UTIL.HookManager.executeHooks('OBPOS_MultiOrders_PreSetPaymentsToReceipt', {
        multiOrderList: multiorders.get('multiOrdersList'),
        payments: multiorders.get('payments')
      }, function (args) {
        setPaymentsToReceipts(args.multiOrderList, args.payments, multiorders.get('changePayments'), OB.DEC.Zero, OB.DEC.Zero, true, function () {
          multiorders.set('change', OB.DEC.Zero);
          multiorders.trigger('closed');
        });
      });
    }, this);

    this.get('multiOrders').on('paymentDone', function (openDrawer) {
      this.get('multiOrders').trigger('disableDoneButton');
      var me = this,
          paymentstatus = this.get('multiOrders'),
          overpayment = OB.DEC.sub(paymentstatus.get('payment'), paymentstatus.get('total')),
          orders = paymentstatus.get('multiOrdersList'),
          triggerPaymentAccepted, triggerPaymentAcceptedImpl;

      if (paymentstatus.get('paymentDone')) {
        return true;
      }
      paymentstatus.set('paymentDone', true);

      triggerPaymentAccepted = function (orders, index) {
        if (index === orders.length) {
          if (OB.MobileApp.model.hasPermission('OBMOBC_SynchronizedMode', true)) {
            OB.MobileApp.model.setSynchronizedCheckpoint(triggerPaymentAcceptedImpl);
          } else {
            triggerPaymentAcceptedImpl();
          }
        } else {
          OB.UTIL.HookManager.executeHooks('OBPOS_PostPaymentDone', {
            receipt: orders.at(index)
          }, function (args) {
            if (args && args.cancellation && args.cancellation === true) {
              me.get('multiOrders').trigger('paymentCancel');
              return;
            }
            triggerPaymentAccepted(orders, index + 1);
          });
        }
      };

      triggerPaymentAcceptedImpl = function () {
        me.get('multiOrders').trigger('paymentAccepted');
      };

      if (overpayment > 0) {
        var symbol = OB.MobileApp.model.get('terminal').symbol,
            symbolAtRight = OB.MobileApp.model.get('terminal').currencySymbolAtTheRight;
        var scrimShowing = enyo.$.scrim.showing;
        OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_OverpaymentWarningTitle'), OB.I18N.getLabel('OBPOS_OverpaymentWarningBody', [OB.I18N.formatCurrencyWithSymbol(overpayment, symbol, symbolAtRight)]), [{
          label: OB.I18N.getLabel('OBMOBC_LblOk'),
          isConfirmButton: true,
          scrimShowing: scrimShowing,
          action: function () {
            me.openDrawer = openDrawer;
            triggerPaymentAccepted(orders, 0);
          }
        }, {
          label: OB.I18N.getLabel('OBMOBC_LblCancel'),
          action: function () {
            paymentstatus.trigger('paymentCancel');
          }
        }]);
      } else {
        me.openDrawer = openDrawer;
        triggerPaymentAccepted(orders, 0);
      }
    }, this);

    // Listening events that cause a discount recalculation
    receipt.get('lines').on('add change:qty change:price', function (line) {
      if (!receipt.get('isEditable')) {
        return;
      }
      //When we do not want to launch promotions process (Not apply or remove discounts)
      if (receipt.get('cloningReceipt') || receipt.get('skipApplyPromotions') || line.get('skipApplyPromotions')) {
        return;
      }
      // Calculate the receipt
      receipt.calculateReceipt(null, line);
    }, this);

    receipt.get('lines').on('remove', function () {
      if (!receipt.get('isEditable') || receipt.get('deleting')) {
        return;
      }
      // Calculate the receipt
      receipt.calculateReceipt();
    });

    receipt.on('change:bp', function () {
      if (!receipt.get('isEditable') || receipt.get('lines').length === 0) {
        return;
      }
      receipt.get('lines').forEach(function (l) {
        l.unset('noDiscountCandidates', {
          silent: true
        });
      });
      if (!OB.MobileApp.model.hasPermission('EnableMultiPriceList', true)) {
        // Calculate the receipt only if it's not multipricelist
        receipt.calculateReceipt();
      }
    }, this);

    receipt.on('voidLayaway', function () {
      var execution = OB.UTIL.ProcessController.start('voidLayaway'),
          process = new OB.DS.Process('org.openbravo.retail.posterminal.ProcessVoidLayaway'),
          auxReceipt = new OB.Model.Order(),
          receiptForPrinting = new OB.Model.Order();

      function finishVoidLayaway() {
        OB.UTIL.ProcessController.finish('voidLayaway', execution);
        if (OB.MobileApp.view.openedPopup === null) {
          enyo.$.scrim.hide();
        }
      }

      function revertCashupReport(callback) {
        OB.UTIL.clone(receipt, auxReceipt);
        auxReceipt.set('isLayaway', false);
        auxReceipt.set('orderType', 2);
        OB.UTIL.cashUpReport(auxReceipt, function () {
          if (callback instanceof Function) {
            callback();
          }
        });
      }

      function updateCashup() {
        auxReceipt.set('timezoneOffset', new Date().getTimezoneOffset());
        auxReceipt.set('gross', OB.DEC.Zero);
        auxReceipt.set('isVoided', true);
        auxReceipt.set('orderType', 3);
        auxReceipt.prepareToSend(function () {
          OB.Dal.transaction(function (tx) {
            OB.UTIL.cashUpReport(auxReceipt, function (cashUp) {
              auxReceipt.set('cashUpReportInformation', JSON.parse(cashUp.models[0].get('objToSend')));
              OB.UTIL.HookManager.executeHooks('OBPOS_PreSyncReceipt', {
                receipt: receipt,
                model: me,
                tx: tx
              }, function (args) {
                auxReceipt.set('json', JSON.stringify(receipt.serializeToJSON()));
                process.exec({
                  messageId: OB.UTIL.get_UUID(),
                  data: [{
                    id: auxReceipt.get('id'),
                    order: auxReceipt
                  }]
                }, function (data) {
                  if (data && data.exception) {
                    revertCashupReport(function () {
                      if (data.exception.message) {
                        OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBMOBC_Error'), data.exception.message);
                      } else {
                        OB.UTIL.showError(OB.I18N.getLabel('OBPOS_MsgErrorVoidLayaway'));
                      }
                      finishVoidLayaway();
                    });
                  } else {
                    auxReceipt.trigger(OB.MobileApp.model.get('terminal').defaultwebpostab);
                    OB.Dal.remove(receipt, null, function (tx, err) {
                      OB.UTIL.showError(err);
                    });
                    OB.UTIL.clone(auxReceipt, receiptForPrinting);
                    auxReceipt.trigger('print', receiptForPrinting);
                    orderList.deleteCurrent();
                    receipt.trigger('change:gross', receipt);
                    OB.UTIL.showSuccess(OB.I18N.getLabel('OBPOS_MsgSuccessVoidLayaway'));
                    finishVoidLayaway();
                  }
                }, function () {
                  revertCashupReport(function () {
                    OB.UTIL.showError(OB.I18N.getLabel('OBPOS_OfflineWindowRequiresOnline'));
                    finishVoidLayaway();
                  });
                });
              }, tx);
            }, tx);
          });
        });
      }

      enyo.$.scrim.show();
      OB.UTIL.clone(receipt, auxReceipt);
      auxReceipt.set('voidLayaway', true);
      if (OB.MobileApp.model.hasPermission('OBMOBC_SynchronizedMode', true)) {
        OB.UTIL.rebuildCashupFromServer(function () {
          auxReceipt.set('obposAppCashup', OB.MobileApp.model.get('terminal').cashUpId);
          updateCashup();
        });
      } else {
        updateCashup();
      }
    }, this);

    receipt.on('cancelLayaway', function () {
      var finishCancelLayaway = function () {
          var processCancelLayaway, process = new OB.DS.Process('org.openbravo.retail.posterminal.process.IsOrderCancelled'),
              execution = OB.UTIL.ProcessController.start('cancelLayaway');

          enyo.$.scrim.show();
          processCancelLayaway = function () {
            var cloneOrderForNew = new OB.Model.Order();
            var cloneOrderForPrinting = new OB.Model.Order();

            receipt.prepareToSend(function () {
              OB.UTIL.HookManager.executeHooks('OBPOS_FinishCancelLayaway', {
                context: me,
                model: me,
                receipt: receipt
              }, function (args) {
                OB.UTIL.HookManager.executeHooks('OBPOS_PreSyncReceipt', {
                  receipt: receipt,
                  model: me
                }, function (args) {
                  OB.Dal.transaction(function (tx) {
                    if (receipt.isNegative()) {
                      receipt.get('payments').forEach(function (payment) {
                        payment.set('amount', OB.DEC.mul(payment.get('amount'), -1));
                        payment.set('origAmount', OB.DEC.mul(payment.get('origAmount'), -1));
                        payment.set('paid', OB.DEC.mul(payment.get('paid'), -1));
                      });
                    }
                    receipt.adjustPrices();
                    OB.UTIL.cashUpReport(receipt, function (cashUp) {
                      var cancelLayawayModel = new OB.Model.CancelLayaway(),
                          cancelLayawayObj;

                      receipt.set('cashUpReportInformation', JSON.parse(cashUp.models[0].get('objToSend')));
                      receipt.set('created', (new Date()).getTime());
                      receipt.set('json', JSON.stringify(receipt.serializeToJSON()));

                      OB.UTIL.clone(receipt, cloneOrderForNew);
                      OB.UTIL.clone(receipt, cloneOrderForPrinting);

                      cancelLayawayObj = receipt.serializeToJSON();
                      cancelLayawayModel.set('json', JSON.stringify(cancelLayawayObj));
                      OB.Dal.getInTransaction(tx, OB.Model.Order, receipt.id, function (model) {
                        OB.Dal.removeInTransaction(tx, model);
                      });
                      OB.Dal.saveInTransaction(tx, cancelLayawayModel);
                    }, tx);
                  }, function () {
                    //transaction error callback
                    OB.error("[cancellayaway] The transaction failed to be commited. LayawayId: " + receipt.get('id'));
                    OB.UTIL.ProcessController.finish('cancelLayaway', execution);
                  }, function () {
                    //transaction success callback
                    OB.info("[cancellayaway] Transaction success. LayawayId: " + receipt.get('id'));

                    function cancelAndNew() {
                      if (OB.MobileApp.model.hasPermission('OBPOS_cancelLayawayAndNew', true)) {
                        OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_cancelLayawayAndNewHeader'), OB.I18N.getLabel('OBPOS_cancelLayawayAndNewBody'), [{
                          label: OB.I18N.getLabel('OBPOS_LblOk'),
                          action: function () {
                            orderList.addNewOrder();
                            var linesMap = {},
                                order = orderList.modelorder,
                                addRelatedLines, addLineToTicket;

                            var finalCallback = function () {
                                order.unset('preventServicesUpdate');
                                order.get('lines').trigger('updateRelations');
                                };

                            addRelatedLines = function (index) {
                              if (index === order.get('lines').length) {
                                finalCallback();
                                return;
                              }
                              var line = order.get('lines').at(index),
                                  oldLine = linesMap[line.id];
                              if (oldLine.get('relatedLines')) {
                                line.set('relatedLines', []);
                                _.each(oldLine.get('relatedLines'), function (relatedLine) {
                                  var newRelatedLine = _.clone(relatedLine);
                                  // If the service is not a deferred service, the related line, documentNo
                                  // and orderId must be updated. If it is, is must be marked as deferred
                                  if (!newRelatedLine.otherTicket) {
                                    var i, keys = _.keys(linesMap);
                                    newRelatedLine.orderDocumentNo = order.get('documentNo');
                                    newRelatedLine.orderId = order.id;
                                    for (i = 0; i < keys.length; i++) {
                                      var key = keys[i];
                                      if (newRelatedLine.orderlineId === linesMap[key].id) {
                                        newRelatedLine.orderlineId = key;
                                        break;
                                      }
                                    }
                                  }
                                  line.get('relatedLines').push(newRelatedLine);
                                });
                              }
                              // Hook to allow any needed relation from an external module
                              OB.UTIL.HookManager.executeHooks('OBPOS_CancelAndNewAddLineRelation', {
                                order: order,
                                cloneOrderForNew: cloneOrderForNew,
                                line: line,
                                oldLine: oldLine,
                                linesMap: linesMap
                              }, function (args) {
                                addRelatedLines(index + 1);
                              });
                            };

                            addLineToTicket = function (idx) {
                              if (idx === cloneOrderForNew.get('lines').length) {
                                addRelatedLines(0);
                              } else {
                                var line = cloneOrderForNew.get('lines').at(idx);
                                order.addProduct(line.get('product'), -line.get('qty'), {
                                  isSilentAddProduct: true
                                }, undefined, function (success, orderline) {
                                  if (success) {
                                    linesMap[order.get('lines').at(order.get('lines').length - 1).id] = line;
                                  }
                                  addLineToTicket(idx + 1);
                                });
                              }
                            };

                            if (cloneOrderForNew.get('isLayaway')) {
                              OB.MobileApp.view.$.containerWindow.getRoot().showDivText(null, {
                                permission: null,
                                orderType: 2
                              });
                            }
                            order.set('bp', cloneOrderForNew.get('bp'));
                            addLineToTicket(0);
                          }
                        }, {
                          label: OB.I18N.getLabel('OBPOS_Cancel')
                        }]);
                      }
                    }

                    function syncProcessCallback() {
                      OB.UTIL.showSuccess(OB.I18N.getLabel('OBPOS_MsgSuccessCancelLayaway', [receipt.get('canceledorder').get('documentNo')]));
                      orderList.deleteCurrent();
                      enyo.$.scrim.hide();
                      OB.UTIL.calculateCurrentCash();
                      OB.UTIL.ProcessController.finish('cancelLayaway', execution);
                      receipt.trigger('print', cloneOrderForPrinting, {
                        callback: cancelAndNew,
                        forceCallback: true
                      });
                    }

                    OB.MobileApp.model.runSyncProcess(function () {
                      OB.UTIL.ProcessController.finish('cancelLayaway', execution);
                      syncProcessCallback();
                    }, function () {
                      if (OB.MobileApp.model.hasPermission('OBMOBC_SynchronizedMode', true)) {
                        OB.Dal.get(OB.Model.Order, receipt.get('id'), function (loadedReceipt) {
                          receipt.clearWith(loadedReceipt);
                          //We need to restore the payment tab, as that's what the user should see if synchronization fails
                          OB.MobileApp.view.waterfall('onTabChange', {
                            tabPanel: 'payment',
                            keyboard: 'toolbarpayment',
                            edit: false
                          });
                          receipt.set('hasbeenpaid', 'N');
                          receipt.trigger('updatePending');
                          OB.Dal.save(receipt, function () {
                            OB.UTIL.calculateCurrentCash();
                          }, null, false);
                        });
                      } else {
                        syncProcessCallback();
                      }
                    });
                  });
                });
              });
            });
          };

          process.exec({
            orderId: receipt.get('canceledorder').id,
            documentNo: receipt.get('canceledorder').get('documentNo')
          }, function (data) {
            if (data && data.exception) {
              if (data.exception.message) {
                OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBMOBC_Error'), data.exception.message);
                OB.UTIL.ProcessController.finish('cancelLayaway', execution);
                return;
              }
              OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBMOBC_Error'), OB.I18N.getLabel('OBMOBC_OfflineWindowRequiresOnline'));
              OB.UTIL.ProcessController.finish('cancelLayaway', execution);
              return;
            } else if (data && data.orderCancelled) {
              OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBMOBC_Error'), OB.I18N.getLabel('OBPOS_LayawayCancelledError'));
              OB.UTIL.ProcessController.finish('cancelLayaway', execution);
              return;
            } else {
              if (OB.MobileApp.model.hasPermission('OBMOBC_SynchronizedMode', true)) {
                OB.UTIL.rebuildCashupFromServer(function () {
                  receipt.set('obposAppCashup', OB.MobileApp.model.get('terminal').cashUpId);
                  OB.MobileApp.model.setSynchronizedCheckpoint(function () {
                    processCancelLayaway();
                  });
                });
              } else {
                processCancelLayaway();
              }
            }
          }, function () {
            OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBMOBC_Error'), OB.I18N.getLabel('OBMOBC_OfflineWindowRequiresOnline'));
            OB.UTIL.ProcessController.finish('cancelLayaway', execution);
            OB.error(arguments);
          });
          };

      if (receipt.overpaymentExists()) {
        var symbol = OB.MobileApp.model.get('terminal').symbol;
        var symbolAtRight = OB.MobileApp.model.get('terminal').currencySymbolAtTheRight;
        var amount = receipt.getPaymentStatus().overpayment;
        var scrimShowing = enyo.$.scrim.showing;
        OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_OverpaymentWarningTitle'), OB.I18N.getLabel('OBPOS_OverpaymentWarningBody', [OB.I18N.formatCurrencyWithSymbol(amount, symbol, symbolAtRight)]), [{
          label: OB.I18N.getLabel('OBMOBC_LblOk'),
          isConfirmButton: true,
          scrimShowing: scrimShowing,
          action: function () {
            finishCancelLayaway();
          }
        }, {
          label: OB.I18N.getLabel('OBMOBC_LblCancel')
        }]);
      } else {
        finishCancelLayaway();
      }
    }, this);

    callback();
  },

  loadModels: function (loadModelsCallback) {
    var me = this;

    this.set('filter', []);
    this.set('brandFilter', []);

    function searchCurrentBP(callback) {
      var errorCallback = function () {
          OB.error(OB.I18N.getLabel('OBPOS_BPInfoErrorTitle') + '. Message: ' + OB.I18N.getLabel('OBPOS_BPInfoErrorMessage'));
          OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_BPInfoErrorTitle'), OB.I18N.getLabel('OBPOS_BPInfoErrorMessage'), [{
            label: OB.I18N.getLabel('OBPOS_Reload')
          }], {
            onShowFunction: function (popup) {
              popup.$.headerCloseButton.hide();
              OB.UTIL.localStorage.removeItem('POSLastTotalRefresh');
              OB.UTIL.localStorage.removeItem('POSLastIncRefresh');
            },
            onHideFunction: function () {
              OB.UTIL.localStorage.removeItem('POSLastTotalRefresh');
              OB.UTIL.localStorage.removeItem('POSLastIncRefresh');
              window.location.reload();
            },
            autoDismiss: false
          });
          };

      function successCallbackBPs(dataBps) {
        if (dataBps) {
          var partnerAddressId = OB.MobileApp.model.get('terminal').partnerAddress;
          dataBps.loadBPLocations(null, null, function (shipping, billing, locations) {
            var defaultAddress = _.find(locations, function (loc) {
              return loc.id === partnerAddressId;
            });
            if (defaultAddress) {
              if (defaultAddress.get('isShipTo')) {
                shipping = defaultAddress;
              }
              if (defaultAddress.get('isBillTo')) {
                billing = defaultAddress;
              }
            }
            dataBps.setBPLocations(shipping, billing, true);
            dataBps.set('locations', locations);
            OB.MobileApp.model.set('businessPartner', dataBps);
            OB.Dal.save(dataBps, function () {}, function () {
              OB.error(arguments);
            });
            me.loadUnpaidOrders(function () {
              me.printReceipt = new OB.OBPOSPointOfSale.Print.Receipt(me);
              // Now, get the hardware manager status
              OB.POS.hwserver.status(function (data) {
                if (data && data.exception) {
                  OB.UTIL.showError(data.exception.message);
                  callback();
                } else {
                  // Save hardware manager information
                  if (data && data.version) {
                    // Max database string size: 10
                    var hwmVersion = data.version.length > 10 ? data.version.substring(0, 9) : data.version;
                    OB.UTIL.localStorage.setItem('hardwareManagerVersion', hwmVersion);
                  }
                  if (data && data.revision) {
                    // Max database string size: 15
                    var hwmRevision = data.revision.length > 15 ? data.version.substring(0, 14) : data.revision;
                    OB.UTIL.localStorage.setItem('hardwareManagerRevision', hwmRevision);
                  }
                  if (data && data.javaInfo) {
                    // Max database string size: 300
                    var hwmJavaInfo = data.javaInfo.length > 300 ? data.javaInfo.substring(0, 296).concat('...') : data.javaInfo;
                    OB.UTIL.localStorage.setItem('hardwareManagerJavaInfo', data.javaInfo);
                  }
                  // Now that templates has been initialized, print welcome message
                  OB.POS.hwserver.print(me.printReceipt.templatewelcome, {}, function (data) {
                    if (data && data.exception) {
                      OB.UTIL.showError(OB.I18N.getLabel('OBPOS_MsgHardwareServerNotAvailable'));
                      callback();
                    } else {
                      callback();
                    }
                  }, OB.DS.HWServer.DISPLAY);
                }
              });
            });
          });
        }
      }
      var checkBPInLocal = function () {
          OB.Dal.get(OB.Model.BusinessPartner, OB.MobileApp.model.get('businesspartner'), successCallbackBPs, errorCallback, errorCallback, null, true);
          };
      OB.Dal.get(OB.Model.BusinessPartner, OB.MobileApp.model.get('businesspartner'), successCallbackBPs, checkBPInLocal, errorCallback);
    }

    //Because in terminal we've the BP id and we want to have the BP model.
    //In this moment we can ensure data is already loaded in the local database
    searchCurrentBP(loadModelsCallback);
  },

  /**
   * This method is invoked before paying a ticket, it is intended to do global
   * modifications in the ticket with OBPOS_PrePaymentHook hook, after this hook
   * execution checkPaymentApproval is invoked
   * OBPOS_PrePaymentApproval can be used to ensure certain order within the
   * same hook
   */
  completePayment: function (caller) {
    var me = this;
    OB.UTIL.HookManager.executeHooks('OBPOS_PrePaymentHook', {
      context: this,
      caller: caller
    }, function (args) {
      if (args && args.cancellation) {
        return;
      }
      OB.UTIL.HookManager.executeHooks('OBPOS_PrePaymentApproval', {
        context: me,
        caller: caller
      }, function () {
        me.on('approvalChecked', function (event) {
          me.off('approvalChecked');
          if (event.approved) {
            me.trigger('showPaymentTab');
          }
        }, this);
        me.checkPaymentApproval(caller);
      });
    });
  },

  /**
   * Hooks for OBPOS_CheckPaymentApproval can modify args.approved to check if
   * payment is approved. In case value is true the process will continue, if not
   * it is aborted
   */
  checkPaymentApproval: function (caller) {
    var me = this;
    OB.UTIL.HookManager.executeHooks('OBPOS_CheckPaymentApproval', {
      approvals: [],
      context: this,
      caller: caller
    }, function (args) {
      var negativeLines = _.filter(me.get('order').get('lines').models, function (line) {
        return line.get('qty') < 0;
      }).length;
      if (negativeLines > 0 && !OB.MobileApp.model.get('permissions')['OBPOS_approval.returns']) {
        args.approvals.push('OBPOS_approval.returns');
      }
      if (args.approvals.length > 0) {
        OB.UTIL.Approval.requestApproval(
        me, args.approvals, function (approved) {
          if (approved) {
            me.trigger('approvalChecked', {
              approved: (args.approved !== undefined) ? args.approved : true
            });
          }
        });
      } else {
        me.trigger('approvalChecked', {
          approved: (args.approved !== undefined) ? args.approved : true
        });
      }
    });
  },

  /**
   * Approval final stage. Where approvalChecked event is triggered, with approved
   * property set to true or false regarding if approval was finally granted. In
   * case of granted approval, the approval is added to the order so it can be saved
   * in backend for audit purposes.
   */
  approvedRequest: function (approved, supervisor, approvalType, callback) {
    var newApprovals, approvals, approval, i, date, callbackFunc, hasPermission = false,
        saveApproval, executeHook, request, me = this;

    saveApproval = function (order, silent) {
      date = new Date().getTime();
      newApprovals = [];

      approvals = order.get('approvals') || [];
      if (!Array.isArray(approvalType)) {
        approvalType = [approvalType];
      }

      _.each(approvals, function (appr) {
        var results;
        results = _.find(approvalType, function (apprType) {
          return apprType === appr.approvalType;
        });

        if (_.isUndefined(results)) {
          newApprovals.push(appr);
        }

      });

      for (i = 0; i < approvalType.length; i++) {
        approval = {
          approvalType: approvalType[i],
          userContact: supervisor.get('id'),
          created: (new Date()).getTime()
        };
        newApprovals.push(approval);
      }
      order.set('approvals', newApprovals, {
        silent: silent
      });
    };

    callbackFunc = function () {
      if (enyo.isFunction(callback)) {
        callback(approved, supervisor, approvalType);
      }
    };

    executeHook = function (approvalType, finalCallback) {
      OB.UTIL.HookManager.executeHooks('OBPOS_PostRequestApproval_' + approvalType, {
        approved: approved,
        supervisor: supervisor,
        approvalType: approvalType,
        callbackApproval: callback,
        context: me
      }, function (args) {
        finalCallback(args);
      });
    };

    request = function (args) {
      if (_.isArray(approvalType)) {
        hasPermission = _.every(approvalType, function (a) {
          return OB.MobileApp.model.hasPermission(a, true);
        });
      } else if (!OB.UTIL.isNullOrUndefined(approvalType)) {
        hasPermission = OB.MobileApp.model.hasPermission(approvalType, true);
      } else {
        callbackFunc();
        return;
      }
      if (hasPermission) {
        callbackFunc();
        return;
      }

      if (approved) {
        if (me.get('leftColumnViewManager').isOrder()) {
          saveApproval(me.get('order'));
        } else {
          me.get('multiOrders').get('multiOrdersList').forEach(function (order) {
            saveApproval(order, true);
          });
        }
      }

      me.trigger('approvalChecked', {
        approved: approved
      });
      callbackFunc();
    };

    if (_.isArray(approvalType)) {
      var afterExecuteHook = _.after(approvalType.length, function (args) {
        request(args);
      });
      _.each(approvalType, function (type) {
        executeHook(type.approval, function (args) {
          afterExecuteHook(args);
        });
      });
    } else {
      executeHook(approvalType, function (args) {
        request(args);
      });
    }
  }
});