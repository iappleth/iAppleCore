/*
 ************************************************************************************
 * Copyright (C) 2013-2018 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, _, enyo, Promise */

(function () {

  OB.DATA = window.OB.DATA || {};

  OB.DATA.OrderSave = function (model) {
    this.context = model;
    this.receipt = model.get('order');
    this.ordersToSend = OB.DEC.Zero;
    this.hasInvLayaways = false;

    // starting receipt verifications
    this.receipt.on('closed', function () {
      // is important to write all the errors with the same and unique header to find the records in the database
      var errorHeader = "Receipt verification error";
      var eventParams = 'closed';

      // protect the application against verification exceptions
      try {

        // 3. verify that the sum of the net of each line + taxes equals the gross
        var totalTaxes = OB.DEC.Zero;
        _.each(this.get('taxes'), function (tax) {
          totalTaxes = OB.DEC.add(totalTaxes, tax.amount);
        }, this);
        var gross = this.get('gross');
        var accum = totalTaxes;
        var linesGross = 0;
        var isFieldUndefined = false;
        _.each(this.get('lines').models, function (line) {
          var fieldValue = line.get('discountedNet');
          if (!fieldValue) {
            isFieldUndefined = true;
            return;
          }
          accum = OB.DEC.add(accum, fieldValue);
          linesGross = OB.DEC.add(linesGross, line.get('lineGrossAmount'));
        });
        var difference = OB.DEC.sub(gross, accum);
        var grossDifference = OB.DEC.sub(gross, linesGross);

        if (!isFieldUndefined && difference !== 0) {
          OB.error(enyo.format("%s: The sum of the net of each line plus taxes does not equal the gross: '%s', gross: %s, difference: %s", errorHeader, eventParams, gross, difference));
        }
        // 3.1 verify that the sum of the gross of each line equals the gross
        if (grossDifference !== 0 && this.get('priceIncludesTax')) {
          OB.error(enyo.format("%s: The sum of the gross of each line does not equal the gross: '%s', gross: %s, difference: %s", errorHeader, eventParams, gross, grossDifference));
        }

        // 4. verify that a cashupId is available
        var cashupId = OB.MobileApp.model.get('terminal').cashUpId;
        if (!cashupId) {
          OB.error("The receipt has been closed with empty cashUpId (current value: " + cashupId + ")");
        }

        // 5. verify that the net is a valid amount
        _.each(this.get('lines').models, function (line) {
          if (OB.UTIL.isNullOrUndefined(line.get('net')) || line.get('net') === '') {
            OB.error("The receipt has been closed with an empty 'net' amount in a line (value: " + line.get('net') + ")");
          }
        });

      } catch (e) {
        // do nothing, we do not want to generate another error
      }
    });

    var restoreReceiptOnError = function (eventParams, receipt) {
        var frozenReceipt = new OB.Model.Order();
        OB.UTIL.clone(receipt, frozenReceipt);
        if (OB.MobileApp.model.hasPermission('OBMOBC_SynchronizedMode', true)) {
          // rollback other changes
          OB.Dal.get(OB.Model.Order, receipt.get('id'), function (loadedReceipt) {
            receipt.clearWith(loadedReceipt);
            //We need to restore the payment tab, as that's what the user should see if synchronization fails
            OB.MobileApp.view.waterfall('onTabChange', {
              tabPanel: 'payment',
              keyboard: 'toolbarpayment',
              edit: false
            });
            receipt.set('hasbeenpaid', 'N');
            frozenReceipt.set('hasbeenpaid', 'N');
            OB.Dal.save(receipt, function () {
              OB.UTIL.calculateCurrentCash();

              if (eventParams && eventParams.callback) {
                eventParams.callback({
                  frozenReceipt: frozenReceipt,
                  isCancelled: true
                });
                receipt.setIsCalculateReceiptLockState(false);
                receipt.setIsCalculateGrossLockState(false);
                receipt.trigger('paymentCancel');
              }
            }, null, false);
          });
        } else if (eventParams && eventParams.callback) {
          eventParams.callback({
            frozenReceipt: frozenReceipt,
            isCancelled: false
          });
        }


        };

    // finished receipt verifications
    var mainReceiptCloseFunction = function (eventParams, context) {
        context.receipt = model.get('order');

        if (context.receipt.get('isbeingprocessed') === 'Y') {

          // clean up some synched data as this method is called in synchronized mode also
          OB.MobileApp.model.resetCheckpointData();
          //The receipt has already been sent, it should not be sent again
          return;
        }

        OB.info('Ticket closed: ', context.receipt.get('json'), "caller: " + OB.UTIL.getStackTrace('Backbone.Events.trigger', true));

        var orderDate = new Date();
        var normalizedCreationDate = OB.I18N.normalizeDate(context.receipt.get('creationDate'));
        var creationDate;
        var frozenReceipt = new OB.Model.Order();
        if (normalizedCreationDate === null) {
          creationDate = new Date();
          normalizedCreationDate = OB.I18N.normalizeDate(creationDate);
        } else {
          creationDate = new Date(normalizedCreationDate);
        }

        OB.trace('Executing pre order save hook.');

        OB.UTIL.HookManager.executeHooks('OBPOS_PreOrderSave', {
          context: context,
          model: model,
          receipt: model.get('order')
        }, function (args) {
          var receipt = args.context.receipt;
          if (args && args.cancellation && args.cancellation === true) {
            args.context.receipt.set('isbeingprocessed', 'N');
            args.context.receipt.set('hasbeenpaid', 'N');
            args.context.receipt.trigger('paymentCancel');
            if (eventParams && eventParams.callback) {
              eventParams.callback({
                frozenReceipt: receipt,
                isCancelled: true,
                skipCallback: args.skipCallback
              });
            }
            args.context.receipt.setIsCalculateReceiptLockState(false);
            args.context.receipt.setIsCalculateGrossLockState(false);
            return true;
          }

          receipt.trigger('checkOpenDrawer');

          if (OB.UTIL.RfidController.isRfidConfigured()) {
            OB.UTIL.RfidController.processRemainingCodes(receipt);
            OB.UTIL.RfidController.updateEpcBuffers();
          }

          OB.trace('Execution of pre order save hook OK.');
          delete receipt.attributes.json;
          receipt.set('creationDate', normalizedCreationDate);
          receipt.set('timezoneOffset', creationDate.getTimezoneOffset());
          receipt.set('created', creationDate.getTime());
          receipt.set('obposCreatedabsolute', OB.I18N.formatDateISO(creationDate));
          receipt.set('orderDate', orderDate);
          receipt.set('movementDate', OB.I18N.normalizeDate(new Date()));
          receipt.set('accountingDate', OB.I18N.normalizeDate(new Date()));
          receipt.set('undo', null);
          receipt.set('multipleUndo', null);

          receipt.set('paymentMethodKind', null);
          if (receipt.get('payments').length === 1 && (receipt.get('orderType') === 0 || receipt.get('orderType') === 1 || (receipt.get('orderType') === 2 && receipt.getPayment() >= receipt.getTotal())) && !receipt.get('isQuotation') && !receipt.get('paidOnCredit')) {
            var payment = receipt.get('payments').models[0];
            receipt.set('paymentMethodKind', payment.get('kind'));
          }

          // multiterminal support
          // be sure that the active terminal is the one set as the order proprietary
          receipt.set('posTerminal', OB.MobileApp.model.get('terminal').id);
          receipt.set('posTerminal' + OB.Constants.FIELDSEPARATOR + OB.Constants.IDENTIFIER, OB.MobileApp.model.get('terminal')._identifier);

          receipt.get("approvals").forEach(function (approval) {
            if (typeof (approval.approvalType) === 'object') {
              approval.approvalMessage = OB.I18N.getLabel(approval.approvalType.message, approval.approvalType.params);
              approval.approvalType = approval.approvalType.approval;
            }
          });

          receipt.set('obposAppCashup', OB.MobileApp.model.get('terminal').cashUpId);
          // convert returns
          if (receipt.getGross() < 0 || !_.isUndefined(receipt.get('paidInNegativeStatusAmt'))) {
            var paymentTotalAmt = OB.DEC.Zero;
            _.forEach(receipt.get('payments').models, function (item) {
              if (!item.get('isPrePayment') && !item.get('reversedPaymentId') && !receipt.get('isPaid')) {
                item.set('amount', -item.get('amount'));
                if (item.get('amountRounded')) {
                  item.set('amountRounded', -item.get('amountRounded'));
                }
                item.set('origAmount', -item.get('origAmount'));
                if (item.get('origAmountRounded')) {
                  item.set('origAmountRounded', -item.get('origAmountRounded'));
                }
                item.set('paid', -item.get('paid'));
              }
              paymentTotalAmt = OB.DEC.add(paymentTotalAmt, item.get('origAmount'));
            });
            if (!_.isUndefined(receipt.get('paidInNegativeStatusAmt'))) {
              receipt.set('payment', paymentTotalAmt);
            }
          }

          var successCallback = function () {

              // success transaction...
              OB.info("[receipt.closed] Transaction success. ReceiptId: " + receipt.get('id'));

              function serverMessageForQuotation(receipt) {
                var isLayaway = (receipt.get('orderType') === 2 || receipt.get('isLayaway'));
                var currentDocNo = receipt.get('documentNo');
                if (receipt && receipt.get('isQuotation')) {
                  OB.UTIL.showSuccess(OB.I18N.getLabel('OBPOS_QuotationSaved', [currentDocNo]));
                } else {
                  if (isLayaway) {
                    OB.UTIL.showSuccess(OB.I18N.getLabel('OBPOS_MsgLayawaySaved', [currentDocNo]));
                  } else {
                    OB.UTIL.showSuccess(OB.I18N.getLabel('OBPOS_MsgReceiptSaved', [currentDocNo]));
                  }
                }

                OB.trace('Order successfully removed.');
              }

              var synErrorCallback = function () {
                  restoreReceiptOnError(eventParams, receipt);
                  };


              // create a clone of the receipt to be used when executing the final callback
              if (OB.UTIL.HookManager.get('OBPOS_PostSyncReceipt')) {
                if (!OB.MobileApp.model.hasPermission('OBMOBC_SynchronizedMode', true) && eventParams && eventParams.callback) {
                  eventParams.callback({
                    frozenReceipt: frozenReceipt,
                    isCancelled: false
                  });
                }
                // create a clone of the receipt to be used within the hook
                var receiptForPostSyncReceipt = new OB.Model.Order();
                OB.UTIL.clone(receipt, receiptForPostSyncReceipt);
                //If there are elements in the hook, we are forced to execute the callback only after the synchronization process
                //has been executed, to prevent race conditions with the callback processes (printing and deleting the receipt)
                OB.trace('Execution Sync process.');

                OB.MobileApp.model.runSyncProcess(function () {
                  var successStep = function () {
                      OB.UTIL.HookManager.executeHooks('OBPOS_PostSyncReceipt', {
                        receipt: receiptForPostSyncReceipt,
                        syncSuccess: true
                      }, function () {
                        serverMessageForQuotation(receipt);
                        if (eventParams && eventParams.callback) {
                          eventParams.callback({
                            frozenReceipt: frozenReceipt,
                            isCancelled: false
                          });
                        }
                      });
                      };

                  // in synchronized mode do the doc sequence update in the success
                  if (OB.MobileApp.model.hasPermission('OBMOBC_SynchronizedMode', true)) {
                    OB.UTIL.calculateCurrentCash();
                    OB.Dal.transaction(function (tx) {
                      OB.MobileApp.model.updateDocumentSequenceWhenOrderSaved(receipt.get('documentnoSuffix'), receipt.get('quotationnoSuffix'), receipt.get('returnnoSuffix'), function () {
                        OB.trace('Saving receipt.');
                        OB.Dal.saveInTransaction(tx, receipt, function () {
                          // the trigger is fired on the receipt object, as there is only 1 that is being updated
                          receipt.trigger('integrityOk'); // Is important for module print last receipt. This module listen trigger.   
                          successStep();
                        });
                      }, tx);
                    });
                  } else {
                    serverMessageForQuotation(frozenReceipt);
                    OB.debug("Ticket closed: runSyncProcess executed");
                  }
                }, function () {
                  OB.UTIL.HookManager.executeHooks('OBPOS_PostSyncReceipt', {
                    receipt: receiptForPostSyncReceipt,
                    syncSuccess: false
                  }, synErrorCallback);
                });
              } else {
                OB.trace('Execution Sync process.');
                //If there are no elements in the hook, we can execute the callback asynchronusly with the synchronization process
                // for non-sync do it here, for sync do it in the success callback of runsyncprocess
                if (!OB.MobileApp.model.hasPermission('OBMOBC_SynchronizedMode', true) && eventParams && eventParams.callback) {
                  eventParams.callback({
                    frozenReceipt: frozenReceipt,
                    isCancelled: false
                  });
                }
                OB.MobileApp.model.runSyncProcess(function () {
                  // in synchronized mode do the doc sequence update in the success and navigate back
                  if (OB.MobileApp.model.hasPermission('OBMOBC_SynchronizedMode', true)) {
                    OB.UTIL.calculateCurrentCash();
                    OB.Dal.transaction(function (tx) {
                      OB.MobileApp.model.updateDocumentSequenceWhenOrderSaved(receipt.get('documentnoSuffix'), receipt.get('quotationnoSuffix'), receipt.get('returnnoSuffix'), function () {
                        OB.trace('Saving receipt.');
                        OB.Dal.saveInTransaction(tx, receipt, function () {
                          // the trigger is fired on the receipt object, as there is only 1 that is being updated
                          receipt.trigger('integrityOk'); // Is important for module print last receipt. This module listen trigger.   
                          if (eventParams && eventParams.callback) {
                            eventParams.callback({
                              frozenReceipt: frozenReceipt,
                              isCancelled: false
                            });
                          }
                        });
                      }, tx);
                    });
                  }

                  serverMessageForQuotation(frozenReceipt);
                  OB.debug("Ticket closed: runSyncProcess executed");
                }, synErrorCallback);
              }
              };

          var executePreSyncReceipt = function () {
              OB.UTIL.HookManager.executeHooks('OBPOS_PreSyncReceipt', {
                receipt: receipt,
                model: model
              }, function (args) {
                receipt.set('json', JSON.stringify(receipt.serializeToJSON()));
                receipt.set('hasbeenpaid', 'Y');
                // Important: at this point, the receipt is considered final. Nothing must alter it
                // when all the properties of the receipt have been set, keep a copy
                OB.UTIL.clone(receipt, frozenReceipt);
                OB.Dal.save(receipt, function () {
                  successCallback();
                  if (!OB.MobileApp.model.hasPermission('OBMOBC_SynchronizedMode', true)) {
                    // the trigger is fired on the receipt object, as there is only 1 that is being updated
                    receipt.trigger('integrityOk'); // Is important for module print last receipt. This module listen trigger.  
                  }
                });
              });
              };

          OB.info("[receipt.closed] Starting transaction. ReceiptId: " + receipt.get('id'));
          OB.Dal.transaction(function (tx) {
            OB.trace('Calculationg cashup information.');
            OB.UTIL.cashUpReport(receipt, function (cashUp) {
              receipt.set('cashUpReportInformation', JSON.parse(cashUp.models[0].get('objToSend')));
              receipt.set('json', JSON.stringify(receipt.serializeToJSON()));
              OB.UTIL.setScanningFocus(true);
              if (OB.MobileApp.model.hasPermission('OBMOBC_SynchronizedMode', true)) {
                OB.Dal.saveInTransaction(tx, receipt, function () {
                  executePreSyncReceipt();
                });
              } else {
                OB.UTIL.calculateCurrentCash(null, tx);
                OB.MobileApp.model.updateDocumentSequenceWhenOrderSaved(receipt.get('documentnoSuffix'), receipt.get('quotationnoSuffix'), receipt.get('returnnoSuffix'), function () {
                  OB.trace('Saving receipt.');
                  OB.Dal.saveInTransaction(tx, receipt, function () {
                    executePreSyncReceipt();
                  });
                }, tx);
              }
            }, tx);
          }, function () {
            // the transaction failed
            OB.UTIL.showError("[receipt.closed] The transaction failed to be commited. ReceiptId: " + receipt.get('id'));
            // rollback other changes
            receipt.set('hasbeenpaid', 'N');
            frozenReceipt.set('hasbeenpaid', 'N');
          }, null);
        });
        };

    this.receipt.on('closed', function (eventParams) {
      var context = this;
      if (OB.MobileApp.model.hasPermission('OBMOBC_SynchronizedMode', true)) {
        OB.UTIL.rebuildCashupFromServer(function () {
          OB.UTIL.showLoading(false);
          mainReceiptCloseFunction(eventParams, context);
        }, function () {
          OB.MobileApp.model.resetCheckpointData();
          restoreReceiptOnError(eventParams, model.get('order'));
        });
      } else {
        mainReceiptCloseFunction(eventParams, context);
      }
    }, this);

    var restoreMultiOrder = function (callback) {
        // recalculate after an error also
        model.get('multiOrders').get('payments').forEach(function (p) {
          var itemP = _.find(model.get('multiOrders').get('frozenPayments').models, function (fp) {
            return p.get('id') === fp.get('id');
          }, this);
          p.set('origAmount', itemP.get('origAmount'));
        });
        model.get('multiOrders').trigger('paymentCancel');
        model.get('multiOrders').get('multiOrdersList').reset(model.get('multiOrders').get('frozenMultiOrdersList').models);
        var promises = [];
        _.each(model.get('multiOrders').get('multiOrdersList').models, function (rcpt) {
          promises.push(new Promise(function (resolve, reject) {
            rcpt.set('isbeingprocessed', 'N');
            rcpt.set('hasbeenpaid', 'N');
            _.each(model.get('orderList').models, function (mdl) {
              if (mdl.get('id') === rcpt.get('id')) {
                mdl.set('isbeingprocessed', 'N');
                mdl.set('hasbeenpaid', 'N');
                mdl.set('payment', rcpt.get('payment'));
                mdl.set('payments', rcpt.get('payments'));
                return true;
              }
            }, this);
            OB.Dal.save(rcpt, function () {
              resolve();
            }, function () {
              reject();
            }, false);
          }));
        });
        Promise.all(promises).then(function () {
          OB.UTIL.calculateCurrentCash();
          if (callback instanceof Function) {
            callback(false);
          }
        });

        if (OB.MobileApp.model.showSynchronizedDialog) {
          OB.MobileApp.model.hideSynchronizingDialog();
        }
        OB.UTIL.showLoading(false);
        };

    var saveAndSyncMultiOrder = function (me, closedReceipts, syncCallback) {
        var recursiveSaveFn, currentReceipt;
        recursiveSaveFn = function (receiptIndex) {
          if (receiptIndex < closedReceipts.length) {
            currentReceipt = closedReceipts[receiptIndex];
            OB.info('Multiorders ticket closed', currentReceipt.get('json'), "caller: " + OB.UTIL.getStackTrace('Backbone.Events.trigger', true));
            if (!_.isUndefined(currentReceipt)) {
              me.receipt = currentReceipt;
            }
            var creationDate, receiptId = me.receipt.get('id'),
                normalizedCreationDate = OB.I18N.normalizeDate(currentReceipt.get('creationDate'));
            if (normalizedCreationDate === null) {
              creationDate = new Date();
              normalizedCreationDate = OB.I18N.normalizeDate(creationDate);
            } else {
              creationDate = new Date(normalizedCreationDate);
            }
            currentReceipt.set('creationDate', normalizedCreationDate);
            currentReceipt.set('movementDate', OB.I18N.normalizeDate(new Date()));
            currentReceipt.set('accountingDate', OB.I18N.normalizeDate(new Date()));

            delete currentReceipt.attributes.json;
            currentReceipt.set('timezoneOffset', creationDate.getTimezoneOffset());
            currentReceipt.set('created', creationDate.getTime());
            currentReceipt.set('obposCreatedabsolute', OB.I18N.formatDateISO(creationDate)); // Absolute date in ISO format
            currentReceipt.set('obposAppCashup', OB.MobileApp.model.get('terminal').cashUpId);
            // multiterminal support
            // be sure that the active terminal is the one set as the order proprietary
            currentReceipt.set('posTerminal', OB.MobileApp.model.get('terminal').id);
            currentReceipt.set('posTerminal' + OB.Constants.FIELDSEPARATOR + OB.Constants.IDENTIFIER, OB.MobileApp.model.get('terminal')._identifier);
            me.context.get('multiOrders').trigger('integrityOk', currentReceipt);

            OB.UTIL.calculateCurrentCash();
            OB.UTIL.cashUpReport(currentReceipt, function (cashUp) {
              currentReceipt.set('cashUpReportInformation', JSON.parse(cashUp.models[0].get('objToSend')));
              OB.UTIL.HookManager.executeHooks('OBPOS_PreSyncReceipt', {
                receipt: currentReceipt,
                model: model,
                isMultiOrder: true
              }, function (args) {
                currentReceipt.set('json', JSON.stringify(currentReceipt.serializeToJSON()));
                OB.UTIL.setScanningFocus(true);
                currentReceipt.set('hasbeenpaid', 'Y');
                OB.Dal.save(currentReceipt, function () {
                  OB.Dal.get(OB.Model.Order, receiptId, function (savedReceipt) {
                    if (!_.isUndefined(savedReceipt.get('amountToLayaway')) && !_.isNull(savedReceipt.get('amountToLayaway')) && savedReceipt.get('generateInvoice')) {
                      me.hasInvLayaways = true;
                    }
                    recursiveSaveFn(receiptIndex + 1);
                  }, null);
                }, function () {
                  recursiveSaveFn(receiptIndex + 1);
                });
              });
            });
          } else {
            OB.MobileApp.model.runSyncProcess(function () {
              OB.UTIL.calculateCurrentCash();
              _.each(model.get('multiOrders').get('multiOrdersList').models, function (theReceipt) {
                me.context.get('multiOrders').trigger('print', theReceipt, {
                  offline: true
                });
                me.context.get('multiOrders').trigger('integrityOk', theReceipt);
                OB.MobileApp.model.updateDocumentSequenceWhenOrderSaved(theReceipt.get('documentnoSuffix'), theReceipt.get('quotationnoSuffix'), theReceipt.get('returnnoSuffix'));
                me.context.get('orderList').current = theReceipt;
                me.context.get('orderList').deleteCurrent();
              });

              //this logic executed when all orders are ready to be sent
              if (syncCallback instanceof Function) {
                syncCallback();
              }

              OB.UTIL.HookManager.executeHooks('OBPOS_PostSyncMultiReceipt', {
                receipts: model.get('multiOrders').get('multiOrdersList').models,
                syncSuccess: true
              }, function (args) {
                model.get('multiOrders').resetValues();
                me.context.get('leftColumnViewManager').setOrderMode();
                OB.UTIL.showLoading(false);
                enyo.$.scrim.hide();

                if (me.hasInvLayaways) {
                  OB.UTIL.showWarning(OB.I18N.getLabel('OBPOS_noInvoiceIfLayaway'));
                  me.hasInvLayaways = false;
                }
                OB.UTIL.showSuccess(OB.I18N.getLabel('OBPOS_MsgAllReceiptSaved'));
                model.get('multiOrders').trigger('checkOpenDrawer');
              });
            }, function () {
              if (syncCallback instanceof Function) {
                syncCallback();
              }
              OB.UTIL.HookManager.executeHooks('OBPOS_PostSyncMultiReceipt', {
                receipts: model.get('multiOrders').get('multiOrdersList').models,
                syncSuccess: false
              }, function (args) {
                OB.UTIL.showError(OB.I18N.getLabel('OBPOS_MsgAllReceiptNotSaved'));
              });
            });
          }
        };
        recursiveSaveFn(0);
        };

    this.context.get('multiOrders').on('closed', function (receipt, closedCallback) {
      var me = this;
      OB.Dal.find(OB.Model.Order, {}, function (orderList) {
        var multiOrderList = me.context.get('multiOrders').get('multiOrdersList').models,
            closedReceipts = [],
            validateMultiOrder, completeMultiOrder;

        _.forEach(orderList.models, function (sortedOrder) {
          _.forEach(multiOrderList, function (multiOrder) {
            if (multiOrder.get('id') === sortedOrder.get('id')) {
              closedReceipts.push(multiOrder);
            }
          });
        });

        completeMultiOrder = _.after(closedReceipts.length, function () {
          saveAndSyncMultiOrder(me, closedReceipts, function () {
            if (closedCallback instanceof Function) {
              closedCallback();
            }
          });
        });
        validateMultiOrder = function () {
          _.each(closedReceipts, function (receipt) {
            OB.UTIL.HookManager.executeHooks('OBPOS_PreOrderSave', {
              context: me,
              model: model,
              receipt: receipt
            }, function (args) {
              OB.trace('Execution of pre order save hook OK.');
              if (args && args.cancellation && args.cancellation === true) {
                restoreMultiOrder(function () {
                  if (closedCallback instanceof Function) {
                    closedCallback(false);
                  }
                });
                return true;
              }
              completeMultiOrder();
            });
          });
        };

        if (OB.MobileApp.model.hasPermission('OBMOBC_SynchronizedMode', true)) {
          OB.UTIL.rebuildCashupFromServer(function () {
            OB.UTIL.showLoading(false);
            validateMultiOrder();
          }, function () {
            restoreMultiOrder();
          });
        } else {
          validateMultiOrder();
        }
      });
    }, this);
  };
}());