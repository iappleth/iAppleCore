/*
 ************************************************************************************
 * Copyright (C) 2018 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, _, Backbone */

(function () {

  OB.UTIL.OrderSelectorUtils = {};

  OB.UTIL.OrderSelectorUtils.addToListOfReceipts = function (model, orderList, context, originServer, fromSelector) {
    if (OB.UTIL.isNullOrUndefined(this.listOfReceipts)) {
      this.listOfReceipts = [];
    }
    if (!OB.UTIL.isNullOrUndefined(model)) {
      var receipt = {
        model: model,
        orderList: orderList,
        context: context,
        originServer: originServer,
        fromSelector: fromSelector
      };
      this.listOfReceipts.push(receipt);
    }
  };

  OB.UTIL.OrderSelectorUtils.checkOrderAndLoad = function (model, orderList, context, originServer, fromSelector) {
    var me = this,
        synchId, continueAfterPaidReceipt, checkListCallback, errorCallback, orderLoaded, loadOrder, loadOrders, loadOrdersProcess, recursiveCallback, recursiveIdx, currentModel, currentOrderList, currentContext, currentOriginServer, currentFromSelector;

    checkListCallback = function () {
      if (me.listOfReceipts && me.listOfReceipts.length > 0) {
        var currentReceipt = me.listOfReceipts.shift();
        loadOrdersProcess(currentReceipt.model, currentReceipt.orderList, currentReceipt.context, currentReceipt.originServer, currentReceipt.fromSelector);
      } else {
        me.loadingReceipt = false;
      }
    };

    errorCallback = function (unsetLoading, msg, msgInPopup) {
      OB.UTIL.SynchronizationHelper.finished(synchId, 'clickSearch');
      if (unsetLoading) {
        OB.UTIL.showLoading(false);
      }
      if (msg) {
        if (msgInPopup) {
          OB.UTIL.showConfirmation.display('', msg);
        } else {
          OB.UTIL.showError(msg);
        }
      }
      recursiveCallback = undefined;
      recursiveIdx = undefined;
      checkListCallback();
    };

    continueAfterPaidReceipt = function (order) {
      var loadNextOrder = function () {
          if (recursiveCallback) {
            recursiveCallback(recursiveIdx + 1);
          } else {
            OB.UTIL.SynchronizationHelper.finished(synchId, 'clickSearch');
            checkListCallback();
          }
          };

      if (order.get('isLayaway')) {
        order.calculateReceipt(function () {
          loadNextOrder();
        });
      } else {
        order.calculateGrossAndSave(false, function () {
          loadNextOrder();
        });
      }
    };

    orderLoaded = function (data) {
      if (data && data.length === 1) {
        if (currentContext.model.get('leftColumnViewManager').isMultiOrder()) {
          if (currentContext.model.get('multiorders')) {
            currentContext.model.get('multiorders').resetValues();
          }
          currentContext.model.get('leftColumnViewManager').setOrderMode();
        }
        OB.UTIL.HookManager.executeHooks('OBRETUR_ReturnFromOrig', {
          order: data[0],
          context: currentContext,
          params: {}
        }, function (args) {
          if (!args.cancelOperation) {
            currentOrderList.newPaidReceipt(data[0], function (newOrder) {
              currentOrderList.addPaidReceipt(newOrder, continueAfterPaidReceipt);
            });
          }
        });
      } else {
        errorCallback(true, OB.I18N.getLabel('OBPOS_MsgErrorDropDep'));
      }
    };

    loadOrder = function (order) {
      var process = new OB.DS.Process('org.openbravo.retail.posterminal.PaidReceipts');
      OB.UTIL.showLoading(true);
      process.exec({
        orderid: order.get('id'),
        originServer: currentOriginServer
      }, function (data) {
        if (data && data.exception) {
          errorCallback(true, data.exception.message, true);
        } else {
          orderLoaded(data);
        }
      }, function (error) {
        errorCallback(true);
      }, true, 5000);
    };

    loadOrders = function (models) {
      var popupBody = [OB.I18N.getLabel('OBPOS_OpenRelatedReceiptsBody')],
          symbol = OB.MobileApp.model.get('terminal').symbol,
          symbolAtRight = OB.MobileApp.model.get('terminal').currencySymbolAtTheRight,
          i, model;
      for (i = 1; i < models.length; i++) {
        model = models[i];
        popupBody.push(OB.I18N.getLabel('OBMOBC_Character')[1] + ' ' + model.get('documentNo') + '  -  ' + OB.I18N.formatDate(new Date(model.get('orderDate'))) + '  -  ' + OB.I18N.formatCurrencyWithSymbol(model.get('amount'), symbol, symbolAtRight));
      }
      OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_OpenRelatedReceiptsTitle'), popupBody, [{
        label: OB.I18N.getLabel('OBPOS_LblOk'),
        isConfirmButton: true,
        action: function () {
          var process = new OB.DS.Process('org.openbravo.retail.posterminal.process.OpenRelatedReceipts');
          OB.UTIL.showLoading(true);
          process.exec({
            orders: models,
            originServer: currentOriginServer
          }, function (data) {
            if (data && data.exception) {
              errorCallback(true, data.exception.message, true);
            } else if (data && data.length > 0) {
              var loadOrder;
              loadOrder = function (idx) {
                if (idx === data.length) {
                  recursiveCallback = undefined;
                  recursiveIdx = undefined;
                  OB.UTIL.SynchronizationHelper.finished(synchId, 'clickSearch');
                  checkListCallback();
                } else {
                  var order = data[idx];
                  recursiveIdx = idx;
                  orderLoaded([order]);
                }
              };
              recursiveCallback = loadOrder;
              loadOrder(0);
            } else {
              errorCallback(true, OB.I18N.getLabel('OBPOS_MsgErrorDropDep'));
            }
          }, function (error) {
            errorCallback(true);
          }, true, 5000);
        }
      }, {
        label: OB.I18N.getLabel('OBMOBC_LblCancel'),
        isConfirmButton: false,
        action: function () {
          loadOrder(models[0]);
        }
      }], {
        onHideFunction: function (popup) {
          loadOrder(models[0]);
        },
        autoDismiss: true
      });
    };

    loadOrdersProcess = function (model, orderList, context, originServer, fromSelector) {
      currentModel = model;
      currentOrderList = orderList;
      currentContext = context;
      currentOriginServer = originServer;
      currentFromSelector = fromSelector;
      synchId = OB.UTIL.SynchronizationHelper.busyUntilFinishes('clickSearch');
      orderList.checkForDuplicateReceipts(model, function (order) {
        if (OB.MobileApp.model.get('terminal').terminalType.openrelatedreceipts && model.get('businessPartner') !== OB.MobileApp.model.get('terminal').businessPartner) {
          var process = new OB.DS.Process('org.openbravo.retail.posterminal.process.SearchRelatedReceipts');
          process.exec({
            orderId: order.get('id'),
            bp: order.get('businessPartner'),
            originServer: originServer
          }, function (data) {
            if (data && data.exception) {
              errorCallback(true, data.exception.message, true);
            } else {
              if (data.length > 0) {
                var models = [currentModel],
                    checkForDuplicateReceipt, newOrder, newModel;
                checkForDuplicateReceipt = function (idx) {
                  if (idx === data.length) {
                    if (models.length === 1) {
                      // If there's only one model, it means that the related orders are already loaded (in this or in other session)
                      // Only the required order is loaded and is not asked to open the related receipts
                      loadOrder(models[0]);
                    } else {
                      loadOrders(models);
                    }
                  } else {
                    newOrder = data[idx];
                    newModel = new Backbone.Model(newOrder);
                    currentOrderList.checkForDuplicateReceipts(newModel, function (checkedOrder) {
                      models.push(checkedOrder);
                      checkForDuplicateReceipt(idx + 1);
                    }, function () {
                      checkForDuplicateReceipt(idx + 1);
                    });
                  }
                };
                checkForDuplicateReceipt(0);
              } else {
                loadOrder(order);
              }
            }
          }, function (error) {
            errorCallback(true);
          });
        } else {
          loadOrder(order);
        }
      }, function () {
        OB.UTIL.SynchronizationHelper.finished(synchId, 'clickSearch');
        checkListCallback();
      }, fromSelector);
    };

    if (me.loadingReceipt) {
      OB.UTIL.OrderSelectorUtils.addToListOfReceipts(model, orderList, context, originServer, fromSelector);
      return;
    }
    me.loadingReceipt = true;
    loadOrdersProcess(model, orderList, context, originServer, fromSelector);
  };

}());