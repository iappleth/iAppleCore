/*
 ************************************************************************************
 * Copyright (C) 2014-2015 Openbravo S.L.U.
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
  cashupstepsdefinition: ['OB.CashUp.StepPendingOrders', 'OB.CashUp.CashPayments', 'OB.CashUp.PaymentMethods', 'OB.CashUp.CashToKeep', 'OB.CashUp.PostPrintAndClose'],
  init: function () {
    var synchId = OB.UTIL.SynchronizationHelper.busyUntilFinishes('cashup-model.init');
    //Check for orders which are being processed in this moment.
    //cancel -> back to point of sale
    //Ok -> Continue closing without these orders
    var undf, me = this,
        newstep, expected = 0,
        totalStartings = 0,
        startings = [],
        cashUpReport, tempList = new Backbone.Collection(),
        activePaymentsList = [];

    //steps
    this.set('step', this.initialStep);
    this.set('substep', 0);

    // Create steps instances
    this.cashupsteps = [];
    _.each(this.cashupstepsdefinition, function (s) {
      newstep = enyo.createFromKind(s);
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
        OB.UTIL.SynchronizationHelper.finished(synchId, 'cashup-model.init');
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
          tempList.add(auxPay);

          if (index === activePaymentsList.length - 1) {
            me.get('paymentList').reset(tempList.models);
            me.set('totalExpected', _.reduce(me.get('paymentList').models, function (total, model) {
              return OB.DEC.add(total, model.get('expected'));
            }, 0));
            me.set('totalDifference', OB.DEC.sub(me.get('totalDifference'), me.get('totalExpected')));
            me.setIgnoreStep3();
          }
        }, this);
      }, function () {
        OB.UTIL.SynchronizationHelper.finished(synchId, 'cashup-model.init');
      });
    }, this);

    this.set('cashUpReport', new Backbone.Collection());
    OB.Dal.find(OB.Model.CashUp, {
      'isprocessed': 'N'
    }, function (cashUp) {
      cashUpReport = cashUp.at(0);
      cashUpReport.set('deposits', []);
      cashUpReport.set('drops', []);

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
            var fromCurrencyId = OB.MobileApp.model.paymentnames[trx.get('searchKey')].paymentMethod.currency;
            var cStartingCash = OB.UTIL.currency.toDefaultCurrency(fromCurrencyId, trx.get('startingCash'));
            return OB.DEC.add(accum, cStartingCash);
          } else {
            return 0;
          }
        }, 0));

        cashUpReport.set('totalDeposits', _.reduce(payMthds.models, function (accum, trx) {
          if (OB.MobileApp.model.paymentnames[trx.get('searchKey')]) {
            var fromCurrencyId = OB.MobileApp.model.paymentnames[trx.get('searchKey')].paymentMethod.currency;
            var cTotalDeposits = OB.UTIL.currency.toDefaultCurrency(fromCurrencyId, OB.DEC.add(trx.get('totalDeposits'), trx.get('totalSales')));
            return OB.DEC.add(accum, cTotalDeposits);
          } else {
            return 0;
          }
        }, 0));

        cashUpReport.set('totalDrops', _.reduce(payMthds.models, function (accum, trx) {
          if (OB.MobileApp.model.paymentnames[trx.get('searchKey')]) {
            var fromCurrencyId = OB.MobileApp.model.paymentnames[trx.get('searchKey')].paymentMethod.currency;
            var cTotalDrops = OB.UTIL.currency.toDefaultCurrency(fromCurrencyId, OB.DEC.add(trx.get('totalDrops'), trx.get('totalReturns')));
            return OB.DEC.add(accum, cTotalDrops);
          } else {
            return 0;
          }
        }, 0));

        _.each(payMthds.models, function (p, index) {
          var auxPay = OB.MobileApp.model.get('payments').filter(function (pay) {
            return pay.payment.id === p.get('paymentmethod_id');
          })[0];
          if (!auxPay) { //We cannot find this payment in local database, it must be a new payment method, we skip it.
            return;
          }

          var fromCurrencyId = auxPay.paymentMethod.currency;
          cashUpReport.get('deposits').push(new Backbone.Model({
            searchKey: p.get('searchKey'),
            origAmount: OB.UTIL.currency.toDefaultCurrency(fromCurrencyId, OB.DEC.add(p.get('totalDeposits'), p.get('totalSales'))),
            amount: OB.DEC.add(0, OB.DEC.add(p.get('totalDeposits'), p.get('totalSales'))),
            description: p.get('name'),
            isocode: auxPay.isocode,
            rate: p.get('rate')
          }));
          cashUpReport.get('drops').push(new Backbone.Model({
            searchKey: p.get('searchKey'),
            origAmount: OB.UTIL.currency.toDefaultCurrency(fromCurrencyId, OB.DEC.add(p.get('totalDrops'), p.get('totalReturns'))),
            amount: OB.DEC.add(0, OB.DEC.add(p.get('totalDrops'), p.get('totalReturns'))),
            description: p.get('name'),
            isocode: auxPay.isocode,
            rate: p.get('rate')
          }));
          startings.push(new Backbone.Model({
            searchKey: p.get('searchKey'),
            origAmount: OB.UTIL.currency.toDefaultCurrency(fromCurrencyId, p.get('startingCash')),
            amount: OB.DEC.add(0, p.get('startingCash')),
            description: 'Starting ' + p.get('name'),
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
        });
      }, this);
    }, this);

    this.get('paymentList').on('change:counted', function (mod) {
      mod.set('difference', OB.DEC.sub(mod.get('counted'), mod.get('expected')));
      if (mod.get('foreignCounted') !== null && mod.get('foreignCounted') !== undf && mod.get('foreignExpected') !== null && mod.get('foreignExpected') !== undf) {
        mod.set('foreignDifference', OB.DEC.sub(mod.get('foreignCounted'), mod.get('foreignExpected')));
      }
      this.set('totalCounted', _.reduce(this.get('paymentList').models, function (total, model) {
        return model.get('counted') ? OB.DEC.add(total, model.get('counted')) : total;
      }, 0), 0);
      if (mod.get('counted') === OB.DEC.Zero) {
        this.trigger('change:totalCounted');
      }
    }, this);

    OB.Dal.find(OB.Model.Order, {
      hasbeenpaid: 'N'
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

      // Recalculate total properly for all  pendingorders.
      pendingOrderList.each(function (pendingorder) {
        OB.DATA.OrderTaxes(pendingorder);
        pendingorder.calculateGross();
      });

      me.get('orderlist').reset(pendingOrderList.models);
    }, function (tx, error) {
      OB.UTIL.showError("OBDAL error: " + error);
    }, this);

    this.printCashUp = new OB.OBPOSCashUp.Print.CashUp();
  },
  //Previous next
  allowNext: function () {
    return this.cashupsteps[this.get('step') - 1].allowNext();
  },
  allowPrevious: function () {
    return this.get('step') > this.initialStep;
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
    return step > this.cashupsteps.length;
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
    return this.get('step') === 2;
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
        objToSend.cashUpDate = me.get('cashUpReport').at(0).get('time');
        objToSend.currentDate = OB.I18N.formatDate(new Date());
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
            var callbackFunc = function () {
                OB.UTIL.initCashUp(function () {
                  OB.MobileApp.model.runSyncProcess();
                  OB.UTIL.SynchronizationHelper.finished(synchId, 'processAndFinishCashUp');
                  OB.UTIL.calculateCurrentCash();
                  OB.UTIL.showLoading(false);
                  me.set("finished", true);
                }, function () {
                  OB.MobileApp.model.runSyncProcess();
                  OB.UTIL.showLoading(false);
                  me.set("finishedWrongly", true);
                  OB.UTIL.SynchronizationHelper.finished(synchId, 'processAndFinishCashUp');
                }, true);
                };
            if (OB.MobileApp.model.hasPermission('OBPOS_print.cashup')) {
              me.printCashUp.print(me.get('cashUpReport').at(0), me.getCountCashSummary(), true);
            }
            callbackFunc();
          }, null);
        }, null, this);
      });
    });
  }
});

OB.OBPOSCashUp.Model.CashUpPartial = OB.OBPOSCashUp.Model.CashUp.extend({
  initialStep: 5,
  finishButtonLabel: 'OBPOS_LblPrintClose',
  reportTitleLabel: 'OBPOS_LblPartialCashUpTitle',
  processAndFinishCashUp: function () {
    if (OB.MobileApp.model.hasPermission('OBPOS_print.cashup')) {
      this.printCashUp.print(this.get('cashUpReport').at(0), this.getCountCashSummary(), false);
    }
    this.set('finished', true);
  }
});