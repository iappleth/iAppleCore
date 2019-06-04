/*
 ************************************************************************************
 * Copyright (C) 2015 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, enyo, Backbone, _ */

enyo.kind({
  name: 'OB.OBPOSCashUp.UI.RenderCashMasterLine',
  classes: 'obObposCashupUiRenderCashMasterLine',
  components: [{
    classes: 'obObposCashupUiRenderCashMasterLine-container1 row-fluid',
    components: [{
      classes: 'obObposCashupUiRenderCashMasterLine-container1-container1 span12',
      components: [{
        classes: 'obObposCashupUiRenderCashMasterLine-container1-container1-container1',
        components: [{
          classes: 'obObposCashupUiRenderCashMasterLine-container1-container1-container1-slaveTerminalName',
          name: 'slaveTerminalName'
        }, {
          classes: 'obObposCashupUiRenderCashMasterLine-container1-container1-container1-slaveCashUpIsClosed',
          name: 'slaveCashUpIsClosed'
        }]
      }]
    }]
  }],
  create: function () {
    this.inherited(arguments);
    this.$.slaveTerminalName.setContent(this.model.get('name'));
    if (this.model.get('finish')) {
      this.$.slaveCashUpIsClosed.setContent(OB.I18N.getLabel('OBMOBC_LblYes'));
      this.$.slaveCashUpIsClosed.addClass('obObposCashupUiRenderCashMasterLine-container1-container1-container1-slaveCashUpIsClosed_finishOrNoTransaction');
    } else if ((!this.model.get('finish')) && (this.model.get('noOfTransactions') === 0)) {
      this.$.slaveCashUpIsClosed.setContent(OB.I18N.getLabel('OBPOS_LblNotNeeded'));
      this.$.slaveCashUpIsClosed.addClass('obObposCashupUiRenderCashMasterLine-container1-container1-container1-slaveCashUpIsClosed_finishOrNoTransaction');
    } else {
      this.$.slaveCashUpIsClosed.setContent(OB.I18N.getLabel('OBMOBC_LblNo'));
      this.$.slaveCashUpIsClosed.addClass('obObposCashupUiRenderCashMasterLine-container1-container1-container1-slaveCashUpIsClosed_noFinishNoTransaction');
    }
  }
});

enyo.kind({
  name: 'OB.OBPOSCashUp.UI.CashMaster',
  classes: 'obObposCahupUiCashMaster',
  published: {
    paymentToKeep: null
  },
  components: [{
    classes: 'obObposCahupUiCashMaster-container1',
    components: [{
      classes: 'obObposCahupUiCashMaster-container1-container1',
      components: [{
        classes: 'obObposCahupUiCashMaster-container1-container1-container1',
        components: [{
          classes: 'obObposCahupUiCashMaster-container1-container1-container1-container1 row-fluid',
          components: [{
            classes: 'obObposCahupUiCashMaster-container1-container1-container1-container1-container1 span12',
            components: [{
              name: 'stepsheader',
              classes: 'obObposCahupUiCashMaster-container1-container1-container1-container1-container1-stepsheader',
              renderHeader: function (step, count) {
                this.setContent(OB.I18N.getLabel('OBPOS_LblStepNumber', [step, count]) + " " + OB.I18N.getLabel('OBPOS_LblStepMaster') + OB.OBPOSCashUp.UI.CashUp.getTitleExtensions());
              }
            }]
          }]
        }, {
          classes: 'obObposCahupUiCashMaster-container1-container1-container1-container2',
          components: [{
            classes: 'obObposCahupUiCashMaster-container1-container1-container1-container2-container1',
            components: [{
              classes: 'obObposCahupUiCashMaster-container1-container1-container1-container2-container1-container1 row-fluid',
              components: [{
                classes: 'obObposCahupUiCashMaster-container1-container1-container1-container2-container1-container1-container1 span12',
                components: [{
                  classes: 'obObposCahupUiCashMaster-container1-container1-container1-container2-container1-container1-container1-container1',
                  components: [{
                    classes: 'obObposCahupUiCashMaster-container1-container1-container1-container2-container1-container1-container1-container1-element1',
                    initComponents: function () {
                      this.setContent(OB.I18N.getLabel('OBPOS_LblTerminal'));
                    }
                  }, {
                    classes: 'obObposCahupUiCashMaster-container1-container1-container1-container2-container1-container1-container1-container1-element2',
                    initComponents: function () {
                      this.setContent(OB.I18N.getLabel('OBPOS_LblCashupSlaveClosed'));
                    }
                  }]
                }]
              }]
            }, {
              name: 'slaveList',
              kind: 'OB.UI.Table',
              classes: 'obObposCahupUiCashMaster-container1-container1-container1-container2-container1-slaveList',
              renderLine: 'OB.OBPOSCashUp.UI.RenderCashMasterLine',
              renderEmpty: 'OB.UI.RenderEmpty',
              listStyle: 'list'
            }]
          }]
        }]
      }]
    }]
  }],

  displayStep: function (model) {

    function processCashCloseMaster(callback) {
      new OB.DS.Process('org.openbravo.retail.posterminal.ProcessCashCloseMaster').exec({
        masterterminal: OB.POS.modelterminal.get('terminal').id,
        cashUpId: OB.POS.modelterminal.get('terminal').cashUpId
      }, function (data) {
        if (data && data.exception) {
          // Error handler 
          OB.log('error', data.exception.message);
          OB.UTIL.showConfirmation.display(
          OB.I18N.getLabel('OBPOS_CashMgmtError'), OB.I18N.getLabel('OBPOS_ErrorServerGeneric') + data.exception.message, [{
            label: OB.I18N.getLabel('OBPOS_LblRetry'),
            action: function () {
              processCashCloseMaster(callback);
            }
          }], {
            autoDismiss: false,
            onHideFunction: function () {
              OB.POS.navigate('retail.pointofsale');
            }
          });
        } else {
          callback(data);
        }
      });
    }

    // this function is invoked when displayed.   
    var me = this;
    this.$.stepsheader.renderHeader(model.stepNumber('OB.CashUp.Master'), model.stepCount());
    if (!model.get('slavesCashupCompleted')) {
      processCashCloseMaster(function (data) {
        var col = new Backbone.Collection();
        col.add(data.terminals);
        me.$.slaveList.setCollection(col);
        if (data.finishAll) {
          me.updateCashUpModel(model, data.payments);
        }
        model.set('slavesCashupCompleted', data.finishAll);
      });
    }
  },

  updateCashUpModel: function (model, payments, updateCallback) {
    var cashUpReport = model.get('cashUpReport').at(0);
    _.each(payments, function (payment) {
      // Update share payments
      _.each(model.get('paymentList').models, function (item) {
        if (item.get('searchKey') === payment.searchKey) {
          item.set('startingCash', OB.DEC.add(item.get('startingCash'), payment.startingCash));
          item.set('totalDeposits', OB.DEC.add(item.get('totalDeposits'), payment.totalDeposits));
          item.set('totalDrops', OB.DEC.add(item.get('totalDrops'), payment.totalDrops));
          item.set('totalReturns', OB.DEC.add(item.get('totalReturns'), payment.totalReturns));
          item.set('totalSales', OB.DEC.add(item.get('totalSales'), payment.totalSales));
          var cTotalDeposits = OB.DEC.sub(item.get('totalDeposits'), OB.DEC.abs(item.get('totalDrops'))),
              expected = OB.DEC.add(OB.DEC.add(item.get('startingCash'), OB.DEC.sub(item.get('totalSales'), OB.DEC.abs(item.get('totalReturns')))), cTotalDeposits);
          var fromCurrencyId = item.get('paymentMethod').currency;
          item.set('expected', OB.UTIL.currency.toDefaultCurrency(fromCurrencyId, expected));
          item.set('foreignExpected', expected);
        }
      });
      // Update CashUpReport with shared payments
      _.each(cashUpReport.get('deposits'), function (item) {
        if (item.get('searchKey') === payment.searchKey) {
          var sum = OB.DEC.add(OB.DEC.add(item.get('amount'), payment.totalDeposits), payment.totalSales);
          item.set('origAmount', OB.UTIL.currency.toDefaultCurrency(item.get('currency'), sum));
          item.set('amount', sum);
        }
      });
      _.each(cashUpReport.get('drops'), function (item) {
        if (item.get('searchKey') === payment.searchKey) {
          var sum = OB.DEC.add(OB.DEC.add(item.get('amount'), payment.totalDrops), payment.totalReturns);
          item.set('origAmount', OB.UTIL.currency.toDefaultCurrency(item.get('currency'), sum));
          item.set('amount', sum);
        }
      });
      _.each(cashUpReport.get('startings'), function (item) {
        if (item.get('searchKey') === payment.searchKey) {
          var sum = OB.DEC.add(item.get('amount'), payment.startingCash);
          item.set('origAmount', OB.UTIL.currency.toDefaultCurrency(item.get('currency'), sum));
          item.set('amount', sum);
        }
      });
    });
    // Update CashUpReport totals
    cashUpReport.set('totalDeposits', _.reduce(cashUpReport.get('deposits'), function (accum, trx) {
      return OB.DEC.add(accum, trx.get("origAmount"));
    }, 0));
    cashUpReport.set('totalDrops', _.reduce(cashUpReport.get('drops'), function (accum, trx) {
      return OB.DEC.add(accum, trx.get("origAmount"));
    }, 0));
    cashUpReport.set('totalStartings', _.reduce(cashUpReport.get('startings'), function (accum, trx) {
      return OB.DEC.add(accum, trx.get("origAmount"));
    }, 0));
    // Update totalExpected and totalDifference
    model.set('totalExpected', _.reduce(model.get('paymentList').models, function (total, model) {
      return OB.DEC.add(total, model.get('expected'));
    }, 0));
    model.set('totalDifference', OB.DEC.sub(model.get('totalDifference'), model.get('totalExpected')));
    if (updateCallback !== undefined) {
      updateCallback();
    }
  }

});