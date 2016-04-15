/*
 ************************************************************************************
 * Copyright (C) 2014-2016 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, enyo, Backbone, _, $ */

OB.OBPOSCashUp = OB.OBPOSCashUp || {};
OB.OBPOSCashUp.Model = OB.OBPOSCashUp.Model || {};
OB.OBPOSCashUp.UI = OB.OBPOSCashUp.UI || {};

//Window model
OB.OBPOSCashUp.Model.CashUp = OB.Model.TerminalWindowModel.extend({
  initialStep: 1,
  finishButtonLabel: 'OBPOS_LblPostPrintClose',
  reportTitleLabel: 'OBPOS_LblStep4of4',
  models: [OB.Model.Order],
  defaults: {
    step: OB.DEC.Zero,
    allowedStep: OB.DEC.Zero,
    totalExpected: OB.DEC.Zero,
    totalCounted: OB.DEC.Zero,
    totalDifference: OB.DEC.Zero,
    pendingOrdersToProcess: false,
    otherInput: OB.DEC.Zero
  },
  cashupStepsDefinition: [{
    name: 'OB.CashUp.StepPendingOrders',
    loaded: false,
    active: true
  }, {
    name: 'OB.CashUp.Master',
    loaded: true,
    active: false
  }, {
    name: 'OB.CashUp.CashPayments',
    loaded: false,
    active: true
  }, {
    name: 'OB.CashUp.PaymentMethods',
    loaded: false,
    active: true
  }, {
    name: 'OB.CashUp.CashToKeep',
    loaded: true,
    active: true
  }, {
    name: 'OB.CashUp.PostPrintAndClose',
    loaded: true,
    active: true
  }],
  init: function () {
    OB.error("This init method should never be called for this model. Call initModels and loadModels instead");
    this.initModels(function () {});
    this.loadModels(function () {});
  },
  initModels: function (initModelsCallback) {
    var synchId1 = OB.UTIL.SynchronizationHelper.busyUntilFinishes('cashup-model.init1');
    //Check for orders which are being processed in this moment.
    //cancel -> back to point of sale
    //Ok -> Continue closing without these orders
    var undf, me = this,
        terminalSlave = !OB.POS.modelterminal.get('terminal').ismaster && OB.POS.modelterminal.get('terminal').isslave,
        newstep, expected = 0,
        startings = [],
        cashUpReport, tempList = new Backbone.Collection(),
        activePaymentsList = [],
        finish, synch1 = false,
        synch2 = false,
        synch3 = false;

    this.cashupStepsDefinition[this.stepIndex('OB.CashUp.Master')].active = OB.POS.modelterminal.get('terminal').ismaster;
    this.cashupStepsDefinition[this.stepIndex('OB.CashUp.StepPendingOrders')].loaded = false;
    this.cashupStepsDefinition[this.stepIndex('OB.CashUp.CashPayments')].loaded = false;
    this.cashupStepsDefinition[this.stepIndex('OB.CashUp.PaymentMethods')].loaded = false;
    this.set('loadFinished', false);

    //steps
    this.set('step', this.initialStep);
    this.set('substep', 0);

    // Create steps instances
    this.cashupsteps = [];
    _.each(this.cashupStepsDefinition, function (s) {
      newstep = enyo.createFromKind(s.name);
      newstep.model = this;
      this.cashupsteps.push(newstep);
    }, this);

    this.set('orderlist', new OB.Collection.OrderList());
    this.set('paymentList', new Backbone.Collection());
    OB.Dal.find(OB.Model.CashUp, {
      'isprocessed': 'N'
    }, function (cashUp) {
      OB.Dal.find(OB.Model.PaymentMethodCashUp, {
        'cashup_id': cashUp.at(0).get('id'),
        '_orderByClause': 'name asc'
      }, function (payMthds) { //OB.Dal.find success
        // Get list of active payments
        _.each(OB.MobileApp.model.get('payments'), function (payment) {
          if (payment.payment.active === true) {
            activePaymentsList.push(payment);
          }
        });
        _.each(activePaymentsList, function (payment, index) {
          expected = 0;
          var auxPay = payMthds.filter(function (payMthd) {
            return payMthd.get('paymentmethod_id') === payment.payment.id;
          })[0];
          if (!auxPay) { //We cannot find this payment in local database, it must be a new payment method, we skip it.
            return;
          }

          // Not add shared payment to slave terminal
          if (!terminalSlave || !OB.MobileApp.model.paymentnames[payment.payment.searchKey].paymentMethod.isshared) {
            auxPay.set('_id', payment.payment.searchKey);
            auxPay.set('isocode', payment.isocode);
            auxPay.set('paymentMethod', payment.paymentMethod);
            auxPay.set('id', payment.payment.id);
            if (auxPay.get('totalDeposits') === null) {
              auxPay.set('totalDeposits', 0);
            }
            if (auxPay.get('totalDrops') === null) {
              auxPay.set('totalDrops', 0);
            }
            var cStartingCash = auxPay.get('startingCash');
            var cTotalReturns = auxPay.get('totalReturns');
            var cTotalSales = auxPay.get('totalSales');
            var cTotalDeposits = OB.DEC.sub(auxPay.get('totalDeposits'), OB.DEC.abs(auxPay.get('totalDrops')));
            expected = OB.DEC.add(OB.DEC.add(cStartingCash, OB.DEC.sub(cTotalSales, cTotalReturns)), cTotalDeposits);
            var fromCurrencyId = auxPay.get('paymentMethod').currency;
            auxPay.set('expected', OB.UTIL.currency.toDefaultCurrency(fromCurrencyId, expected));
            auxPay.set('foreignExpected', expected);
            var paymentShared = (OB.POS.modelterminal.get('terminal').ismaster || OB.POS.modelterminal.get('terminal').isslave) && OB.MobileApp.model.paymentnames[payment.payment.searchKey].paymentMethod.isshared;
            if (paymentShared) {
              auxPay.set('name', auxPay.get('name') + (paymentShared ? OB.I18N.getLabel('OBPOS_LblPaymentMethodShared') : ""));
            }
            tempList.add(auxPay);
          }

          if (index === activePaymentsList.length - 1) {
            if (terminalSlave && tempList.length === 0) {
              // Desactivate all steps 
              me.cashupStepsDefinition[me.stepIndex('OB.CashUp.PaymentMethods')].active = false;
            }
            me.get('paymentList').reset(tempList.models);
            // Active/Desactive CashPayments and CashToKeep tabs
            var i, cashPayments = false,
                cashToKeep = false,
                paymentsIndex = me.stepIndex('OB.CashUp.CashPayments'),
                toKeepIndex = me.stepIndex('OB.CashUp.CashToKeep');
            for (i = 0; i < tempList.length; i++) {
              if (me.cashupsteps[paymentsIndex].isSubstepAvailable(me, i)) {
                cashPayments = true;
              }
              if (me.cashupsteps[toKeepIndex].isSubstepAvailable(me, i)) {
                cashToKeep = true;
              }
            }
            me.cashupStepsDefinition[paymentsIndex].active = cashPayments;
            me.cashupStepsDefinition[toKeepIndex].active = cashToKeep;
            me.set('totalExpected', _.reduce(me.get('paymentList').models, function (total, model) {
              return OB.DEC.add(total, model.get('expected'));
            }, 0));
            me.set('totalDifference', OB.DEC.sub(me.get('totalDifference'), me.get('totalExpected')));
            me.setIgnoreStep3();
          }
        }, this);
        me.cashupStepsDefinition[me.stepIndex('OB.CashUp.CashPayments')].loaded = true;
        me.cashupStepsDefinition[me.stepIndex('OB.CashUp.PaymentMethods')].loaded = true;
        synch1 = true;
        finish();
        OB.UTIL.SynchronizationHelper.finished(synchId1, 'cashup-model.init1');
      }, function () {
        OB.UTIL.SynchronizationHelper.finished(synchId1, 'cashup-model.init1');
      });
    }, this);

    var synchId2 = OB.UTIL.SynchronizationHelper.busyUntilFinishes('cashup-model.init2');
    this.set('cashUpReport', new Backbone.Collection());
    OB.Dal.find(OB.Model.CashUp, {
      'isprocessed': 'N'
    }, function (cashUp) {
      cashUpReport = cashUp.at(0);

      initModelsCallback();

      cashUpReport.set('deposits', []);
      cashUpReport.set('drops', []);
      OB.Dal.find(OB.Model.CashManagement, {
        'cashup_id': cashUpReport.get('id'),
        'type': 'deposit'
      }, function (cashMgmts) {
        _.forEach(cashMgmts.models, function (cashMgmt) {
          cashMgmt.set('searchKey', 'cashMgmtDeposit' + (_.filter(OB.MobileApp.model.get('payments'), function (pay) {
            return pay.payment.id === cashMgmt.get('paymentMethodId');
          }))[0].payment.searchKey.replace('_', '') + cashMgmt.get('amount'));
        });
        cashUpReport.set('deposits', cashMgmts.models);
        cashUpReport.set('totalDeposits', _.reduce(cashMgmts.models, function (accum, trx) {
          return OB.DEC.add(accum, trx.get('origAmount'));
        }, 0));
      }, this);
      OB.Dal.find(OB.Model.CashManagement, {
        'cashup_id': cashUpReport.get('id'),
        'type': 'drop'
      }, function (cashMgmts) {
        _.forEach(cashMgmts.models, function (cashMgmt) {
          cashMgmt.set('searchKey', 'cashMgmtDrop' + (_.filter(OB.MobileApp.model.get('payments'), function (pay) {
            return pay.payment.id === cashMgmt.get('paymentMethodId');
          }))[0].payment.searchKey.replace('_', '') + cashMgmt.get('amount'));
        });
        cashUpReport.set('drops', cashMgmts.models);
        cashUpReport.set('totalDrops', _.reduce(cashMgmts.models, function (accum, trx) {
          return OB.DEC.add(accum, trx.get('origAmount'));
        }, 0));
      }, this);
      OB.Dal.find(OB.Model.TaxCashUp, {
        'cashup_id': cashUpReport.get('id'),
        'orderType': {
          operator: '!=',
          value: '1'
        },
        '_orderByClause': 'name asc'
      }, function (taxcashups) {
        cashUpReport.set('salesTaxes', taxcashups.models);
      }, this);

      OB.Dal.find(OB.Model.TaxCashUp, {
        'cashup_id': cashUpReport.get('id'),
        'orderType': '1',
        '_orderByClause': 'name asc'
      }, function (taxcashups) {
        cashUpReport.set('returnsTaxes', taxcashups.models);
      }, this);

      OB.Dal.find(OB.Model.PaymentMethodCashUp, {
        'cashup_id': cashUpReport.get('id'),
        '_orderByClause': 'name asc'
      }, function (payMthds) { //OB.Dal.find success
        cashUpReport.set('totalStartings', _.reduce(payMthds.models, function (accum, trx) {
          if (OB.MobileApp.model.paymentnames[trx.get('searchKey')]) {
            // Not accumulate shared payments on slave terminal
            if (terminalSlave && OB.MobileApp.model.paymentnames[trx.get('searchKey')].paymentMethod.isshared) {
              return accum;
            }
            var fromCurrencyId = OB.MobileApp.model.paymentnames[trx.get('searchKey')].paymentMethod.currency;
            var cStartingCash = OB.UTIL.currency.toDefaultCurrency(fromCurrencyId, trx.get('startingCash'));
            return OB.DEC.add(accum, cStartingCash);
          } else {
            return 0;
          }
        }, 0));

        cashUpReport.set('totalDeposits', _.reduce(payMthds.models, function (accum, trx) {
          if (OB.MobileApp.model.paymentnames[trx.get('searchKey')]) {
            // Not accumulate shared payments on slave terminal
            if (terminalSlave && OB.MobileApp.model.paymentnames[trx.get('searchKey')].paymentMethod.isshared) {
              return accum;
            }
            var fromCurrencyId = OB.MobileApp.model.paymentnames[trx.get('searchKey')].paymentMethod.currency;
            var cTotalDeposits = OB.UTIL.currency.toDefaultCurrency(fromCurrencyId, OB.DEC.add(trx.get('totalDeposits'), trx.get('totalSales')));
            return OB.DEC.add(accum, cTotalDeposits);
          } else {
            return 0;
          }
        }, 0));

        cashUpReport.set('totalDrops', _.reduce(payMthds.models, function (accum, trx) {
          if (OB.MobileApp.model.paymentnames[trx.get('searchKey')]) {
            // Not accumulate shared payments on slave terminal
            if (terminalSlave && OB.MobileApp.model.paymentnames[trx.get('searchKey')].paymentMethod.isshared) {
              return accum;
            }
            var fromCurrencyId = OB.MobileApp.model.paymentnames[trx.get('searchKey')].paymentMethod.currency;
            var cTotalDrops = OB.UTIL.currency.toDefaultCurrency(fromCurrencyId, OB.DEC.add(trx.get('totalDrops'), trx.get('totalReturns')));
            return OB.DEC.add(accum, cTotalDrops);
          } else {
            return 0;
          }
        }, 0));

        _.each(payMthds.models, function (p) {
          var auxPay = OB.MobileApp.model.get('payments').filter(function (pay) {
            return pay.payment.id === p.get('paymentmethod_id');
          })[0];
          if (!auxPay) { //We cannot find this payment in local database, it must be a new payment method, we skip it.
            return;
          }
          // Not add shared payment to slave terminal
          if (terminalSlave && OB.MobileApp.model.paymentnames[auxPay.payment.searchKey].paymentMethod.isshared) {
            return;
          }

          var fromCurrencyId = auxPay.paymentMethod.currency,
              paymentShared = (OB.POS.modelterminal.get('terminal').ismaster || OB.POS.modelterminal.get('terminal').isslave) && OB.MobileApp.model.paymentnames[auxPay.payment.searchKey].paymentMethod.isshared,
              paymentSharedStr = paymentShared ? OB.I18N.getLabel('OBPOS_LblPaymentMethodShared') : "";
          cashUpReport.get('deposits').push(new Backbone.Model({
            searchKey: p.get('searchKey'),
            origAmount: OB.UTIL.currency.toDefaultCurrency(fromCurrencyId, OB.DEC.add(p.get('totalDeposits'), p.get('totalSales'))),
            amount: OB.DEC.add(0, OB.DEC.add(p.get('totalDeposits'), p.get('totalSales'))),
            description: p.get('name') + paymentSharedStr,
            currency: fromCurrencyId,
            isocode: auxPay.isocode,
            rate: p.get('rate')
          }));
          cashUpReport.get('drops').push(new Backbone.Model({
            searchKey: p.get('searchKey'),
            origAmount: OB.UTIL.currency.toDefaultCurrency(fromCurrencyId, OB.DEC.add(p.get('totalDrops'), p.get('totalReturns'))),
            amount: OB.DEC.add(0, OB.DEC.add(p.get('totalDrops'), p.get('totalReturns'))),
            description: p.get('name') + paymentSharedStr,
            currency: fromCurrencyId,
            isocode: auxPay.isocode,
            rate: p.get('rate')
          }));
          startings.push(new Backbone.Model({
            searchKey: p.get('searchKey'),
            origAmount: OB.UTIL.currency.toDefaultCurrency(fromCurrencyId, p.get('startingCash')),
            amount: OB.DEC.add(0, p.get('startingCash')),
            description: OB.I18N.getLabel('OBPOS_LblStarting') + ' ' + p.get('name') + paymentSharedStr,
            currency: fromCurrencyId,
            isocode: auxPay.isocode,
            rate: p.get('rate'),
            paymentId: p.get('paymentmethod_id')
          }));
        }, this);
        cashUpReport.set('startings', startings);
        //FIXME: We are not sure if other finds are done.
        OB.UTIL.HookManager.executeHooks('OBPOS_EditCashupReport', {
          cashUpReport: cashUpReport
        }, function (args) {
          me.get('cashUpReport').add(args.cashUpReport);
          synch2 = true;
          finish();
          OB.UTIL.SynchronizationHelper.finished(synchId2, 'cashup-model.init2');
        });
      }, this);
    }, this);

    this.get('paymentList').on('change:counted', function (mod) {
      mod.set('difference', OB.DEC.sub(mod.get('counted'), OB.Utilities.Number.roundJSNumber(mod.get('expected'), 2)));
      if (mod.get('foreignCounted') !== null && mod.get('foreignCounted') !== undf && mod.get('foreignExpected') !== null && mod.get('foreignExpected') !== undf) {
        mod.set('foreignDifference', OB.DEC.sub(mod.get('foreignCounted'), OB.Utilities.Number.roundJSNumber(mod.get('foreignExpected'), 2)));
      }
      this.set('totalCounted', _.reduce(this.get('paymentList').models, function (total, model) {
        return model.get('counted') ? OB.DEC.add(total, model.get('counted')) : total;
      }, 0), 0);
      if (mod.get('counted') === OB.DEC.Zero) {
        this.trigger('change:totalCounted');
      }
    }, this);

    OB.Dal.find(OB.Model.Order, {
      hasbeenpaid: 'N',
      'session': OB.MobileApp.model.get('session')
    }, function (pendingOrderList, me) {
      var emptyOrders;
      // Detect empty orders and remove them from here
      emptyOrders = _.filter(pendingOrderList.models, function (pendingorder) {
        if (pendingorder && pendingorder.get('lines') && pendingorder.get('lines').length === 0) {
          return true;
        }
        // Detect Layaway orders
        if (pendingorder && pendingorder.get('isLayaway') === true) {
          return true;
        }
      });

      _.each(emptyOrders, function (orderToRemove) {
        pendingOrderList.remove(orderToRemove);
      });

      me.get('orderlist').reset(pendingOrderList.models);
      var indexStepPendingOrders = me.stepIndex('OB.CashUp.StepPendingOrders');
      me.cashupStepsDefinition[indexStepPendingOrders].active = pendingOrderList.length > 0;
      me.cashupStepsDefinition[indexStepPendingOrders].loaded = true;
      synch3 = true;
      finish();
    }, function (tx, error) {
      OB.UTIL.showError("OBDAL error: " + error);
    }, this);

    this.printCashUp = new OB.OBPOSCashUp.Print.CashUp();

    finish = function () {
      if (synch1 && synch2 && synch3) {
        me.finishLoad();
      }
    };
  },
  loadModels: function (loadModelsCallback) {
    loadModelsCallback();
  },
  finishLoad: function () {
    var finish = true;
    _.each(this.cashupStepsDefinition, function (step) {
      if (!step.loaded) {
        finish = false;
      }
    });
    if (finish && !this.get('loadFinished')) {
      this.set('step', this.getFirstStep());
      this.set('substep', 0);
      this.set('loadFinished', true);
    }
  },
  // Count real step
  stepCount: function () {
    var count = 0;
    _.each(this.cashupStepsDefinition, function (step) {
      if (step.active) {
        count++;
      }
    });
    return count;
  },
  // Get step index
  stepIndex: function (defName) {
    var index = -1;
    _.each(this.cashupStepsDefinition, function (step, indx) {
      if (step.name === defName) {
        index = indx;
      }
    });
    return index;
  },
  // Real step number
  stepNumber: function (defName) {
    var index = this.stepIndex(defName);
    var i, count = 0;
    for (i = 0; i <= index; i++) {
      if (this.cashupStepsDefinition[i].active) {
        count++;
      }
    }
    return count;
  },
  // Get first step available (step from 1..N)
  getFirstStep: function () {
    var i;
    for (i = 0; i < this.cashupStepsDefinition.length; i++) {
      if (this.cashupStepsDefinition[i].active) {
        return i + 1;
      }
    }
    return null;
  },
  // Next step (step from 1..N)
  getNextStep: function () {
    var i;
    for (i = this.get('step'); i < this.cashupStepsDefinition.length; i++) {
      if (this.cashupStepsDefinition[i].active) {
        return i + 1;
      }
    }
    return null;
  },
  // Previous (step from 1..N)
  getPreviousStep: function () {
    var i;
    for (i = this.get('step') - 2; i >= 0; i--) {
      if (this.cashupStepsDefinition[i].active) {
        return i + 1;
      }
    }
    return 0;
  },
  //Previous next
  allowNext: function () {
    return this.get('step') > 0 ? this.cashupsteps[this.get('step') - 1].allowNext() : false;
  },
  allowPrevious: function () {
    return this.get('step') > this.getFirstStep();
  },
  setIgnoreStep3: function () {
    var result = null;
    _.each(this.get('paymentList').models, function (model) {
      if (model.get('paymentMethod').automatemovementtoother === false) {
        model.set('qtyToKeep', 0);
        if (result !== false) {
          result = true;
        }
      } else {
        //fix -> break
        result = false;
        return false;
      }
    }, this);
    this.set('ignoreStep3', result);
  },
  showStep: function (leftpanel$) {
    var currentstep = this.get('step') - 1;
    var i;
    var stepcomponent;

    for (i = 0; i < this.cashupsteps.length; i++) {
      stepcomponent = this.cashupsteps[i].getStepComponent(leftpanel$);
      stepcomponent.setShowing(i === currentstep);
      if (i === currentstep) {
        stepcomponent.displayStep(this);
      }
    }
  },
  getStepToolbar: function () {
    var currentstep = this.get('step') - 1;
    return this.cashupsteps[currentstep].getToolbarName();
  },
  nextButtonI18NLabel: function () {
    var currentstep = this.get('step') - 1;
    if (this.cashupsteps[currentstep].nextFinishButton()) {
      return this.finishButtonLabel;
    } else {
      return 'OBPOS_LblNextStep';
    }
  },
  isFinishedWizard: function (step) {
    // Adjust step to array index
    var postPrintAndClose = this.stepIndex('OB.CashUp.PostPrintAndClose');
    if (this.cashupStepsDefinition[postPrintAndClose].active) {
      return step === (postPrintAndClose + 2);
    }
    return false;
  },
  getSubstepsLength: function (step) {
    return this.cashupsteps[step - 1].getSubstepsLength(this);
  },
  isSubstepAvailable: function (step, substep) {
    return this.cashupsteps[step - 1].isSubstepAvailable(this, substep);
  },
  verifyStep: function (leftpanel$, callback) {
    var currentstep = this.get('step') - 1;
    var stepcomponent = this.cashupsteps[currentstep].getStepComponent(leftpanel$);
    if (stepcomponent.verifyStep) {
      return stepcomponent.verifyStep(this, callback);
    } else {
      callback();
    }
  },
  isPaymentMethodListVisible: function () {
    // Adjust step to array index
    return (this.get('step') - 1) === this.stepIndex('OB.CashUp.CashPayments');
  },
  // Step 2: logic, expected vs counted
  countAll: function () {
    this.get('paymentList').each(function (model) {
      model.set('foreignCounted', OB.DEC.add(0, model.get('foreignExpected')));
      model.set('counted', OB.DEC.add(0, model.get('expected')));
    });
  },

  //step 3
  validateCashKeep: function (qty) {
    var unfd, result = {
      result: false,
      message: ''
    };
    if (qty !== unfd && qty !== null && $.isNumeric(qty)) {
      if (this.get('paymentList').at(this.get('substep')).get('foreignCounted') >= qty) {
        result.result = true;
        result.message = '';
      } else {
        result.result = false;
        result.message = OB.I18N.getLabel('OBPOS_MsgMoreThanCounted');
      }
    } else {
      result.result = false;
      result.message = 'Not valid number to keep';
    }
    if (!result.result) {
      this.get('paymentList').at(this.get('substep')).set('qtyToKeep', null);
    }
    return result;
  },

  //Step 4
  getCountCashSummary: function () {
    var countCashSummary, counter, enumConcepts, enumSecondConcepts, enumSummarys, i, undf, model, value = OB.DEC.Zero,
        second = OB.DEC.Zero;
    countCashSummary = {
      expectedSummary: [],
      countedSummary: [],
      differenceSummary: [],
      qtyToKeepSummary: [],
      qtyToDepoSummary: [],
      totalCounted: this.get('totalCounted'),
      totalExpected: this.get('totalExpected'),
      totalDifference: this.get('totalDifference'),
      totalQtyToKeep: _.reduce(this.get('paymentList').models, function (total, model) {
        if (model.get('qtyToKeep')) {
          var cQtyToKeep = OB.UTIL.currency.toDefaultCurrency(model.get('paymentMethod').currency, model.get('qtyToKeep'));
          return OB.DEC.add(total, cQtyToKeep);
        } else {
          return total;
        }
      }, 0),
      totalQtyToDepo: _.reduce(this.get('paymentList').models, function (total, model) {
        if (model.get('qtyToKeep') !== null && model.get('qtyToKeep') !== undf && model.get('foreignCounted') !== null && model.get('foreignCounted') !== undf) {
          var qtyToDepo = OB.DEC.sub(model.get('foreignCounted'), model.get('qtyToKeep'));
          var cQtyToDepo = OB.UTIL.currency.toDefaultCurrency(model.get('paymentMethod').currency, qtyToDepo);
          return OB.DEC.add(total, cQtyToDepo);
        } else {
          return total;
        }
      }, 0)
    };
    //First we fix the qty to keep for non-automated payment methods
    _.each(this.get('paymentList').models, function (model) {
      if (OB.UTIL.isNullOrUndefined(model.get('qtyToKeep'))) {
        model.set('qtyToKeep', model.get('counted'));
      }
    });

    enumSummarys = ['expectedSummary', 'countedSummary', 'differenceSummary', 'qtyToKeepSummary', 'qtyToDepoSummary'];
    enumConcepts = ['expected', 'counted', 'difference', 'qtyToKeep', 'foreignCounted'];
    enumSecondConcepts = ['foreignExpected', 'foreignCounted', 'foreignDifference', 'qtyToKeep', 'qtyToKeep'];
    var sortedPays = _.sortBy(this.get('paymentList').models, function (p) {
      return p.get('name');
    });
    for (counter = 0; counter < 5; counter++) {
      for (i = 0; i < sortedPays.length; i++) {
        model = sortedPays[i];
        if (!model.get(enumConcepts[counter])) {
          countCashSummary[enumSummarys[counter]].push(new Backbone.Model({
            searchKey: model.get('searchKey'),
            name: model.get('name'),
            value: 0,
            second: 0,
            isocode: ''
          }));
        } else {
          var fromCurrencyId = model.get('paymentMethod').currency;
          switch (enumSummarys[counter]) {
          case 'qtyToKeepSummary':
            if (model.get(enumSecondConcepts[counter]) !== null && model.get(enumSecondConcepts[counter]) !== undf) {
              value = OB.UTIL.currency.toDefaultCurrency(fromCurrencyId, model.get(enumConcepts[counter]));
              second = model.get(enumSecondConcepts[counter]);
            }
            break;
          case 'qtyToDepoSummary':
            if (model.get(enumSecondConcepts[counter]) !== null && model.get(enumSecondConcepts[counter]) !== undf && model.get('rate') !== '1') {
              second = OB.DEC.sub(model.get(enumConcepts[counter]), model.get(enumSecondConcepts[counter]));
            } else {
              second = OB.DEC.Zero;
            }
            if (model.get(enumSecondConcepts[counter]) !== null && model.get(enumSecondConcepts[counter]) !== undf) {
              var baseAmount = OB.DEC.sub(model.get(enumConcepts[counter]), model.get(enumSecondConcepts[counter]));
              value = OB.UTIL.currency.toDefaultCurrency(fromCurrencyId, baseAmount);
            } else {
              value = OB.DEC.Zero;
            }

            break;
          default:
            value = model.get(enumConcepts[counter]);
            second = model.get(enumSecondConcepts[counter]);
          }
          countCashSummary[enumSummarys[counter]].push(new Backbone.Model({
            searchKey: model.get('searchKey'),
            name: model.get('name'),
            value: value,
            second: second,
            isocode: model.get('isocode')
          }));
        }
      }
    }
    return countCashSummary;
  },
  additionalProperties: [],
  propertyFunctions: [],
  processAndFinishCashUp: function () {
    var synchId = OB.UTIL.SynchronizationHelper.busyUntilFinishes('processAndFinishCashUp');
    OB.UTIL.showLoading(true);
    var currentMe = this;
    OB.Dal.find(OB.Model.CashUp, {
      'isprocessed': 'N'
    }, function (cashUp) {
      OB.UTIL.composeCashupInfo(cashUp, currentMe, function (me) {
        var i, paymentMethodInfo, objToSend = JSON.parse(cashUp.at(0).get('objToSend'));
        var now = new Date();
        objToSend.cashUpDate = OB.I18N.normalizeDate(now);
        objToSend.timezoneOffset = now.getTimezoneOffset();
        for (i = 0; i < me.additionalProperties.length; i++) {
          objToSend[me.additionalProperties[i]] = me.propertyFunctions[i](OB.POS.modelterminal.get('terminal').id, cashUp.at(0));
        }
        var cashCloseArray = [];
        objToSend.cashCloseInfo = cashCloseArray;
        _.each(me.get('paymentList').models, function (curModel) {
          var cashCloseInfo = {
            expected: 0,
            difference: 0,
            paymentTypeId: 0,
            paymentMethod: {}
          };
          // Set cashclose info
          cashCloseInfo.id = OB.UTIL.get_UUID();
          cashCloseInfo.paymentTypeId = curModel.get('id');
          cashCloseInfo.difference = curModel.get('difference');
          cashCloseInfo.foreignDifference = curModel.get('foreignDifference');
          cashCloseInfo.expected = curModel.get('expected');
          cashCloseInfo.foreignExpected = curModel.get('foreignExpected');
          paymentMethodInfo = curModel.get('paymentMethod');
          paymentMethodInfo.amountToKeep = curModel.get('qtyToKeep');
          cashCloseInfo.paymentMethod = paymentMethodInfo;
          objToSend.cashCloseInfo.push(cashCloseInfo);
        }, me);
        objToSend.approvals = me.get('approvals');
        var cashMgmtIds = [];
        objToSend.cashMgmtIds = cashMgmtIds;
        OB.Dal.find(OB.Model.CashManagement, {
          'cashup_id': cashUp.at(0).get('id')
        }, function (cashMgmts) {
          _.each(cashMgmts.models, function (cashMgmt) {
            objToSend.cashMgmtIds.push(cashMgmt.get('id'));

          });
          cashUp.at(0).set('userId', OB.MobileApp.model.get('context').user.id);
          objToSend.userId = OB.MobileApp.model.get('context').user.id;
          objToSend.isprocessed = 'Y';
          cashUp.at(0).set('objToSend', JSON.stringify(objToSend));
          cashUp.at(0).set('isprocessed', 'Y');

          OB.Dal.save(cashUp.at(0), function () {
            var callbackFinishedSuccess = function () {
                OB.UTIL.showLoading(true);
                me.set('finished', true);
                if (OB.MobileApp.model.hasPermission('OBPOS_print.cashup')) {
                  me.printCashUp.print(me.get('cashUpReport').at(0), me.getCountCashSummary(), true);
                }
                };
            var callbackFunc = function () {
                OB.UTIL.SynchronizationHelper.finished(synchId, 'processAndFinishCashUp');
                OB.MobileApp.model.runSyncProcess(function () {
                  callbackFinishedSuccess();
                }, function () {
                  callbackFinishedSuccess();
                });
                };
            callbackFunc();
          }, null);
        }, null, this);
      });
    });
  }
});

OB.OBPOSCashUp.Model.CashUpPartial = OB.OBPOSCashUp.Model.CashUp.extend({
  initialStep: 6,
  finishButtonLabel: 'OBPOS_LblPrintClose',
  reportTitleLabel: 'OBPOS_LblPartialCashUpTitle',
  getCountCashSummary: function () {
    var countCashSummary, counter, enumConcepts, enumSecondConcepts, enumSummarys, i, undf, model, value = OB.DEC.Zero,
        second = OB.DEC.Zero;
    countCashSummary = {
      expectedSummary: [],
      countedSummary: [],
      differenceSummary: [],
      qtyToKeepSummary: [],
      qtyToDepoSummary: [],
      totalCounted: this.get('totalCounted'),
      totalExpected: this.get('totalExpected'),
      totalDifference: this.get('totalDifference'),
      totalQtyToKeep: OB.DEC.Zero,
      totalQtyToDepo: OB.DEC.Zero,
      isPartialCashup: true
    };
    //First we fix the qty to keep for non-automated payment methods
    _.each(this.get('paymentList').models, function (model) {
      if (OB.UTIL.isNullOrUndefined(model.get('qtyToKeep'))) {
        model.set('qtyToKeep', model.get('counted'));
      }
    });

    enumSummarys = ['expectedSummary', 'countedSummary', 'differenceSummary', 'qtyToKeepSummary', 'qtyToDepoSummary'];
    enumConcepts = ['expected', 'counted', 'difference', 'qtyToKeep', 'foreignCounted'];
    enumSecondConcepts = ['foreignExpected', 'foreignCounted', 'foreignDifference', 'qtyToKeep', 'qtyToKeep'];
    var sortedPays = _.sortBy(this.get('paymentList').models, function (p) {
      return p.get('name');
    });
    for (counter = 0; counter < 5; counter++) {
      for (i = 0; i < sortedPays.length; i++) {
        model = sortedPays[i];
        if (!model.get(enumConcepts[counter])) {
          countCashSummary[enumSummarys[counter]].push(new Backbone.Model({
            searchKey: model.get('searchKey'),
            name: model.get('name'),
            value: 0,
            second: 0,
            isocode: ''
          }));
        } else {
          switch (enumSummarys[counter]) {
          case 'qtyToKeepSummary':
            if (model.get(enumSecondConcepts[counter]) !== null && model.get(enumSecondConcepts[counter]) !== undf) {
              value = OB.DEC.Zero;
              second = OB.DEC.Zero;
            }
            break;
          case 'qtyToDepoSummary':
            if (model.get(enumSecondConcepts[counter]) !== null && model.get(enumSecondConcepts[counter]) !== undf && model.get('rate') !== '1') {
              second = OB.DEC.Zero;
            }
            if (model.get(enumSecondConcepts[counter]) !== null && model.get(enumSecondConcepts[counter]) !== undf) {
              value = OB.DEC.Zero;
            }
            break;
          default:
            value = model.get(enumConcepts[counter]);
            second = model.get(enumSecondConcepts[counter]);
          }
          countCashSummary[enumSummarys[counter]].push(new Backbone.Model({
            searchKey: model.get('searchKey'),
            name: model.get('name'),
            value: value,
            second: second,
            isocode: model.get('isocode')
          }));
        }
      }
    }
    return countCashSummary;
  },
  processAndFinishCashUp: function () {
    if (OB.MobileApp.model.hasPermission('OBPOS_print.cashup')) {
      this.printCashUp.print(this.get('cashUpReport').at(0), this.getCountCashSummary(), false);
    }
    this.set('finished', true);
  },
  allowPrevious: function () {
    return false;
  },
  finishLoad: function () {
    var finish = true;
    _.each(this.cashupStepsDefinition, function (step) {
      if (!step.loaded) {
        finish = false;
      }
    });
    if (finish && !this.get('loadFinished')) {
      this.set('loadFinished', true);
    }
  }
});