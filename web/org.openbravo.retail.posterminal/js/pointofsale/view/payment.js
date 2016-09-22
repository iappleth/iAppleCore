/*
 ************************************************************************************
 * Copyright (C) 2013-2016 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, enyo, _ */

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.Payment',
  published: {
    receipt: null
  },
  events: {
    onShowPopup: '',
    onPaymentActionPay: ''
  },
  handlers: {
    onButtonStatusChanged: 'buttonStatusChanged',
    onMaxLimitAmountError: 'maxLimitAmountError',
    onButtonPaymentChanged: 'paymentChanged',
    onClearPaymentMethodSelect: 'clearPaymentMethodSelect',
    ontap: 'dispalyErrorLabels',
    onmouseover: 'pauseAnimation',
    onmouseout: 'resumeAnimation'
  },
  getSelectedPayment: function () {
    if (this.receipt && this.receipt.get('selectedPayment')) {
      return this.receipt.get('selectedPayment');
    }
    return null;
  },
  setTotalPending: function (pending, mulrate, symbol, currencySymbolAtTheRight, inSender, inEvent) {
    this.$.totalpending.setContent(OB.I18N.formatCurrencyWithSymbol(OB.DEC.mul(pending, mulrate), symbol, currencySymbolAtTheRight));
  },
  clearPaymentMethodSelect: function (inSender, inEvent) {
    this.$.paymentMethodSelect.setContent('');
  },
  buttonStatusChanged: function (inSender, inEvent) {
    this.$.paymentMethodSelect.setContent('');
    if (inEvent.value.status && inEvent.value.status.indexOf('paymentMethodCategory.showitems.') === 0) {
      this.doShowPopup({
        popup: 'modalPaymentsSelect',
        args: {
          idCategory: inEvent.value.status.substring(inEvent.value.status.lastIndexOf('.') + 1)
        }
      });
    } else {
      var payment, change, pending, isMultiOrders, paymentstatus;
      payment = inEvent.value.payment || OB.MobileApp.model.paymentnames[OB.MobileApp.model.get('paymentcash')];
      if (_.isUndefined(payment)) {
        return true;
      }
      // Clear limit amount error when click on PaymentMethod button
      if (OB.POS.terminal.terminal.paymentnames[inEvent.value.status]) {
        this.bubble('onMaxLimitAmountError', {
          show: false,
          maxLimitAmount: 0,
          currency: '',
          symbolAtRight: true
        });
      }
      isMultiOrders = this.model.isValidMultiOrderState();
      change = this.model.getChange();
      pending = this.model.getPending();
      if (!isMultiOrders) {
        if (!_.isNull(this.receipt)) {
          this.receipt.set('selectedPayment', payment.payment.searchKey);
          paymentstatus = this.receipt.getPaymentStatus();
        }
      } else {
        this.model.get('multiOrders').set('selectedPayment', payment.payment.searchKey);
        paymentstatus = this.model.get('multiOrders').getPaymentStatus();
      }

      if (!_.isNull(change) && change) {
        this.$.change.setContent(OB.I18N.formatCurrencyWithSymbol(OB.DEC.mul(change, payment.mulrate), payment.symbol, payment.currencySymbolAtTheRight));
        OB.MobileApp.model.set('changeReceipt', OB.I18N.formatCurrencyWithSymbol(OB.DEC.mul(change, payment.mulrate), payment.symbol, payment.currencySymbolAtTheRight));
      } else if (!_.isNull(pending) && pending) {
        this.setTotalPending(pending, payment.mulrate, payment.symbol, payment.currencySymbolAtTheRight, inSender, inEvent);
      }
      if (paymentstatus && inEvent.value.status !== "" && !this.receipt.isCalculateReceiptLocked && !this.receipt.isCalculateGrossLocked) {
        this.checkValidPayments(paymentstatus, payment);
      }
      if (inEvent.value.amount) {
        this.doPaymentActionPay({
          amount: inEvent.value.amount,
          key: payment.payment.searchKey,
          name: payment.payment._identifier,
          paymentMethod: payment.paymentMethod,
          rate: payment.rate,
          mulrate: payment.mulrate,
          isocode: payment.isocode,
          options: inEvent.value.options
        });
      }
    }
  },
  paymentChanged: function (inSender, inEvent) {
    if (!inEvent.amount) {
      this.$.paymentMethodSelect.setContent(OB.I18N.getLabel('OBPOS_PaymentsSelectedMethod', [inEvent.payment.payment._identifier]));
    }
  },
  maxLimitAmountError: function (inSender, inEvent) {
    var maxHeight;
    if (inEvent.show) {
      this.$.errorMaxlimitamount.setContent(OB.I18N.getLabel('OBPOS_PaymentMaxLimitAmount', [OB.I18N.formatCurrencyWithSymbol(inEvent.maxLimitAmount, inEvent.currency, inEvent.symbolAtRight)]));
      this.$.errorMaxlimitamount.show();
    } else {
      this.$.errorMaxlimitamount.setContent('');
      this.$.errorMaxlimitamount.hide();
    }
    this.alignErrorMessages();
  },
  components: [{
    style: 'background-color: #363636; color: white; height: 200px; margin: 5px; padding: 5px; position: relative;',
    components: [{
      classes: 'row-fluid',
      components: [{
        classes: 'span12'
      }]
    }, {
      classes: 'row-fluid',
      components: [{
        classes: 'span9',
        components: [{
          style: 'padding: 10px 0px 0px 10px; height: 28px;',
          components: [{
            tag: 'span',
            name: 'totalpending',
            style: 'font-size: 24px; font-weight: bold;'
          }, {
            tag: 'span',
            name: 'totalpendinglbl'
          }, {
            tag: 'span',
            name: 'change',
            style: 'font-size: 24px; font-weight: bold;'
          }, {
            tag: 'span',
            name: 'changelbl'
          }, {
            tag: 'span',
            name: 'overpayment',
            style: 'font-size: 24px; font-weight: bold;'
          }, {
            tag: 'span',
            name: 'overpaymentlbl'
          }, {
            tag: 'span',
            name: 'exactlbl'
          }, {
            tag: 'span',
            name: 'donezerolbl'
          }]
        }, {
          components: [{
            style: 'padding: 5px',
            components: [{
              style: 'margin: 2px 0px 0px 0px; border-bottom: 1px solid #cccccc;'
            }, {
              kind: 'OB.UI.ScrollableTable',
              scrollAreaMaxHeight: '115px',
              style: 'height: 115px',
              name: 'payments',
              renderEmpty: enyo.kind({
                style: 'height: 36px'
              }),
              renderLine: 'OB.OBPOSPointOfSale.UI.RenderPaymentLine'
            }, {
              kind: 'OB.UI.ScrollableTable',
              scrollAreaMaxHeight: '115px',
              style: 'height: 115px',
              name: 'multiPayments',
              showing: false,
              renderEmpty: enyo.kind({
                style: 'height: 36px'
              }),
              renderLine: 'OB.OBPOSPointOfSale.UI.RenderPaymentLine'
            }, {
              style: 'position: absolute; bottom: 20px; height: 20px; font-weight: bold; color:DodgerBlue;',
              name: 'extrainfo'
            }, {
              style: 'overflow: hidden; height: 30px; margin-top: 3px; color: #ff0000; padding: 5px; position: relative;',
              name: 'errorLabelArea',
              components: [{
                name: 'noenoughchangelbl',
                showing: false,
                type: 'error'
              }, {
                name: 'overpaymentnotavailable',
                showing: false,
                type: 'error'
              }, {
                name: 'overpaymentexceedlimit',
                showing: false,
                type: 'error'
              }, {
                name: 'onlycashpaymentmethod',
                showing: false,
                type: 'error'
              }, {
                name: 'errorMaxlimitamount',
                showing: false,
                type: 'error'
              }]

            }]
          }]
        }]
      }, {
        classes: 'span3',
        components: [{
          name: 'donebutton',
          kind: 'OB.OBPOSPointOfSale.UI.DoneButton'
        }, {
          name: 'exactbutton',
          kind: 'OB.OBPOSPointOfSale.UI.ExactButton'
        }, {
          name: 'creditsalesaction',
          kind: 'OB.OBPOSPointOfSale.UI.CreditButton'
        }, {
          name: 'layawayaction',
          kind: 'OB.OBPOSPointOfSale.UI.LayawayButton'
        }]
      }]
    }, {
      classes: 'span12',
      components: [{
        name: 'paymentMethodSelect',
        style: 'color: orange; padding-left: 1em'
      }]
    }]
  }],

  receiptChanged: function () {
    var me = this;
    this.$.payments.setCollection(this.receipt.get('payments'));
    this.$.multiPayments.setCollection(this.model.get('multiOrders').get('payments'));
    this.receipt.on('change:payment change:change calculategross change:bp change:gross', function () {
      if (this.receipt.isCalculateReceiptLocked || this.receipt.isCalculateGrossLocked) {
        //We are processing the receipt, we cannot update pending yet
        return;
      }
      this.updatePending();
    }, this);
    this.model.get('leftColumnViewManager').on('change:currentView', function () {
      if (!this.model.get('leftColumnViewManager').isMultiOrder()) {
        this.updatePending();
      } else {
        this.updatePendingMultiOrders();
      }
    }, this);
    this.updatePending();
    if (this.model.get('leftColumnViewManager').isMultiOrder()) {
      this.updatePendingMultiOrders();
    }
    this.receipt.on('change:orderType change:isLayaway change:payment', function (model) {
      if (this.model.get('leftColumnViewManager').isMultiOrder()) {
        this.updateCreditSalesAction();
        this.$.layawayaction.hide();
        return;
      }
      var payment = OB.MobileApp.model.paymentnames[OB.MobileApp.model.get('paymentcash')];
      if ((model.get('orderType') === 2 || (model.get('isLayaway'))) && model.get('orderType') !== 3 && !model.getPaymentStatus().done) {
        this.$.layawayaction.setContent(OB.I18N.getLabel('OBPOS_LblLayaway'));
        this.$.layawayaction.show();
      } else if (model.get('orderType') === 3) {
        this.$.layawayaction.hide();
      } else {
        this.$.layawayaction.hide();
      }
      this.updateCreditSalesAction();
    }, this);
    this.$.extrainfo.setContent('');
    this.receipt.on('extrainfo', function (info) {
      this.$.extrainfo.setContent(info || '');
    }, this);
  },

  updateCreditSalesAction: function () {

    // The terminal allows to pay on credit
    var visible = OB.MobileApp.model.get('terminal').allowpayoncredit;
    // And is a loaded layaway or a regular order (no new layaway and no voided layaway)
    // this.receipt.get('orderType') === 2 --> New layaway 
    // this.receipt.get('orderType') === 3 --> Voided layaway 
    // this.receipt.get('isLayaway') --> Loaded layaway    
    visible = visible && ((this.receipt.get('isLayaway') || this.receipt.get('orderType') !== 2) && this.receipt.get('orderType') !== 3);
    // And receipt has not been paid
    visible = visible && !this.receipt.getPaymentStatus().done;
    // And Business Partner exists and is elegible to sell on credit.
    visible = visible && this.receipt.get('bp') && (this.receipt.get('bp').get('creditLimit') > 0 || this.receipt.get('bp').get('creditUsed') < 0 || this.receipt.getGross() < 0);

    if (visible) {
      this.$.creditsalesaction.show();
    } else {
      this.$.creditsalesaction.hide();
    }
  },

  updatePending: function () {
    if (this.model.get('leftColumnViewManager').isMultiOrder()) {
      return true;
    }
    var paymentstatus = this.receipt.getPaymentStatus();
    var symbol = '',
        rate = OB.DEC.One,
        symbolAtRight = true,
        isCashType = true;

    if (_.isEmpty(OB.MobileApp.model.paymentnames)) {
      symbol = OB.MobileApp.model.get('terminal').symbol;
      symbolAtRight = OB.MobileApp.model.get('terminal').currencySymbolAtTheRight;
    }
    if (!_.isUndefined(this.receipt) && !_.isUndefined(OB.MobileApp.model.paymentnames[this.receipt.get('selectedPayment')])) {
      symbol = OB.MobileApp.model.paymentnames[this.receipt.get('selectedPayment')].symbol;
      rate = OB.MobileApp.model.paymentnames[this.receipt.get('selectedPayment')].mulrate;
      symbolAtRight = OB.MobileApp.model.paymentnames[this.receipt.get('selectedPayment')].currencySymbolAtTheRight;
      isCashType = OB.MobileApp.model.paymentnames[this.receipt.get('selectedPayment')].paymentMethod.iscash;
    }
    this.checkValidPayments(paymentstatus, OB.MobileApp.model.paymentnames[this.receipt.get('selectedPayment') || OB.MobileApp.model.get('paymentcash')]);
    if (paymentstatus.change) {
      this.$.change.setContent(OB.I18N.formatCurrencyWithSymbol(OB.DEC.mul(this.receipt.getChange(), rate), symbol, symbolAtRight));
      OB.MobileApp.model.set('changeReceipt', OB.I18N.formatCurrencyWithSymbol(OB.DEC.mul(this.receipt.getChange(), rate), symbol, symbolAtRight));
      this.$.change.show();
      this.$.changelbl.show();
    } else {
      this.$.change.hide();
      this.$.changelbl.hide();
    }
    if (paymentstatus.overpayment) {
      this.$.overpayment.setContent(OB.I18N.formatCurrencyWithSymbol(paymentstatus.overpayment, symbol, symbolAtRight));
      this.$.overpayment.show();
      this.$.overpaymentlbl.show();
    } else {
      this.$.overpayment.hide();
      this.$.overpaymentlbl.hide();
    }

    if (paymentstatus.done) {
      this.$.totalpending.hide();
      this.$.totalpendinglbl.hide();
      if (!_.isEmpty(OB.MobileApp.model.paymentnames)) {
        this.$.donebutton.show();
      }
      this.updateCreditSalesAction();
      this.$.layawayaction.hide();
    } else {
      this.setTotalPending(this.receipt.getPending(), rate, symbol, symbolAtRight);
      this.$.totalpending.show();
      //      if (this.receipt.get('orderType') === 1 || this.receipt.get('orderType') === 3) {
      if (paymentstatus.isNegative || this.receipt.get('orderType') === 3) {
        this.$.totalpendinglbl.setContent(OB.I18N.getLabel('OBPOS_ReturnRemaining'));
      } else {
        this.$.totalpendinglbl.setContent(OB.I18N.getLabel('OBPOS_PaymentsRemaining'));
      }
      this.$.totalpendinglbl.show();
      this.$.donebutton.hide();
      if (this.$.donebutton.drawerpreference) {
        this.$.donebutton.setContent(OB.I18N.getLabel('OBPOS_LblOpen'));
        this.$.donebutton.drawerOpened = false;
      }
    }

    if (paymentstatus.done || this.receipt.getGross() === 0) {
      this.$.exactbutton.hide();
      this.$.layawayaction.hide();
    } else {
      if (!_.isEmpty(OB.MobileApp.model.paymentnames)) {
        this.$.exactbutton.show();
      }
      if (this.receipt.get('orderType') === 2 || (this.receipt.get('isLayaway') && this.receipt.get('orderType') !== 3)) {
        this.$.layawayaction.show();
      } else if (this.receipt.get('orderType') === 3) {
        this.$.layawayaction.hide();
      }
    }
    if (paymentstatus.done && !paymentstatus.change && !paymentstatus.overpayment) {
      if (this.receipt.getGross() === 0) {
        this.$.exactlbl.hide();
        this.$.donezerolbl.show();
      } else {
        this.$.donezerolbl.hide();
        //        if (this.receipt.get('orderType') === 1 || this.receipt.get('orderType') === 3) {
        if (paymentstatus.isNegative || this.receipt.get('orderType') === 3) {
          this.$.exactlbl.setContent(OB.I18N.getLabel('OBPOS_ReturnExact'));
        } else {
          this.$.exactlbl.setContent(OB.I18N.getLabel('OBPOS_PaymentsExact'));
        }
        this.$.exactlbl.show();
      }
    } else {
      this.$.exactlbl.hide();
      this.$.donezerolbl.hide();
    }

    this.updateCreditSalesAction();
  },
  updatePendingMultiOrders: function () {
    var paymentstatus = this.model.get('multiOrders');
    var symbol = '',
        symbolAtRight = true,
        rate = OB.DEC.One,
        isCashType = true,
        selectedPayment;
    this.$.layawayaction.hide();
    if (_.isEmpty(OB.MobileApp.model.paymentnames)) {
      symbol = OB.MobileApp.model.get('terminal').symbol;
      symbolAtRight = OB.MobileApp.model.get('terminal').currencySymbolAtTheRight;
    }
    if (paymentstatus.get('selectedPayment')) {
      selectedPayment = OB.MobileApp.model.paymentnames[paymentstatus.get('selectedPayment')];
    } else {
      selectedPayment = OB.MobileApp.model.paymentnames[OB.MobileApp.model.get('paymentcash')];
    }
    if (!_.isUndefined(selectedPayment)) {
      symbol = selectedPayment.symbol;
      rate = selectedPayment.mulrate;
      symbolAtRight = selectedPayment.currencySymbolAtTheRight;
      isCashType = selectedPayment.paymentMethod.iscash;
    }
    this.checkValidPayments(paymentstatus.getPaymentStatus(), selectedPayment);
    if (paymentstatus.get('change')) {
      this.$.change.setContent(OB.I18N.formatCurrencyWithSymbol(OB.DEC.mul(paymentstatus.get('change'), rate), symbol, symbolAtRight));
      OB.MobileApp.model.set('changeReceipt', OB.I18N.formatCurrencyWithSymbol(OB.DEC.mul(paymentstatus.get('change'), rate), symbol, symbolAtRight));
      this.$.change.show();
      this.$.changelbl.show();
    } else {
      this.$.change.hide();
      this.$.changelbl.hide();
    }
    //overpayment
    if (OB.DEC.compare(OB.DEC.sub(paymentstatus.get('payment'), paymentstatus.get('total'))) > 0) {
      this.$.overpayment.setContent(OB.I18N.formatCurrency(OB.DEC.sub(paymentstatus.get('payment'), paymentstatus.get('total'))));
      this.$.overpayment.show();
      this.$.overpaymentlbl.show();
    } else {
      this.$.overpayment.hide();
      this.$.overpaymentlbl.hide();
    }

    if (paymentstatus.get('multiOrdersList').length > 0 && OB.DEC.compare(paymentstatus.get('total')) >= 0 && OB.DEC.compare(OB.DEC.sub(paymentstatus.get('payment'), paymentstatus.get('total'))) >= 0) {
      this.$.totalpending.hide();
      this.$.totalpendinglbl.hide();
      if (!_.isEmpty(OB.MobileApp.model.paymentnames)) {
        this.$.donebutton.show();
      }
      this.updateCreditSalesAction();
      //            this.$.layawayaction.hide();
    } else {
      this.setTotalPending(OB.DEC.sub(paymentstatus.get('total'), paymentstatus.get('payment')), rate, symbol, symbolAtRight);
      this.$.totalpending.show();
      this.$.totalpendinglbl.show();
      this.$.donebutton.hide();
      if (this.$.donebutton.drawerpreference) {
        this.$.donebutton.setContent(OB.I18N.getLabel('OBPOS_LblOpen'));
        this.$.donebutton.drawerOpened = false;
      }
    }

    this.updateCreditSalesAction();
    this.$.layawayaction.hide();
    if (paymentstatus.get('multiOrdersList').length > 0 && OB.DEC.compare(paymentstatus.get('total')) >= 0 && (OB.DEC.compare(OB.DEC.sub(paymentstatus.get('payment'), paymentstatus.get('total'))) >= 0 || paymentstatus.get('total') === 0)) {
      this.$.exactbutton.hide();
    } else {
      if (!_.isEmpty(OB.MobileApp.model.paymentnames)) {
        this.$.exactbutton.show();
      }
    }
    if (paymentstatus.get('multiOrdersList').length > 0 && OB.DEC.compare(paymentstatus.get('total')) >= 0 && OB.DEC.compare(OB.DEC.sub(paymentstatus.get('payment'), paymentstatus.get('total'))) >= 0 && !paymentstatus.get('change') && OB.DEC.compare(OB.DEC.sub(paymentstatus.get('payment'), paymentstatus.get('total'))) <= 0) {
      if (paymentstatus.get('total') === 0) {
        this.$.exactlbl.hide();
        this.$.donezerolbl.show();
      } else {
        this.$.donezerolbl.hide();
        this.$.exactlbl.setContent(OB.I18N.getLabel('OBPOS_PaymentsExact'));
        this.$.exactlbl.show();
      }
    } else {
      this.$.exactlbl.hide();
      this.$.donezerolbl.hide();
    }
  },

  checkEnoughCashAvailable: function (paymentstatus, selectedPayment, scope, callback) {
    var requiredCash, hasEnoughCash, hasAllEnoughCash = true;
    // Check slave cash 
    this.checkSlaveCashAvailable(selectedPayment, this, function (currentCash) {
      if (OB.UTIL.isNullOrUndefined(selectedPayment) || !selectedPayment.paymentMethod.iscash) {
        requiredCash = OB.DEC.Zero;
      } else if (!_.isUndefined(paymentstatus) && paymentstatus.isNegative) {
        requiredCash = paymentstatus.pendingAmt;
        paymentstatus.payments.each(function (payment) {
          var paymentmethod;
          if (payment.get('kind') === selectedPayment.payment.searchKey) {
            requiredCash = OB.DEC.add(requiredCash, payment.get('origAmount'));
          } else {
            paymentmethod = OB.POS.terminal.terminal.paymentnames[payment.get('kind')];
            if (paymentmethod && payment.get('amount') > paymentmethod.currentCash && payment.get('isCash')) {
              hasAllEnoughCash = false;
            }
          }
        });
      } else if (!_.isUndefined(paymentstatus)) {
        requiredCash = paymentstatus.changeAmt;
      }

      if (!_.isUndefined(requiredCash) && requiredCash === 0) {
        hasEnoughCash = true;
      } else if (!_.isUndefined(requiredCash)) {
        hasEnoughCash = OB.DEC.compare(OB.DEC.sub(currentCash, requiredCash)) >= 0;
      }

      if (hasEnoughCash && hasAllEnoughCash) {
        return callback.call(scope, true);
      } else {
        return callback.call(scope, false); // check failed.
      }
    });
  },

  checkValidCashOverpayment: function (paymentstatus, selectedPayment) {
    var currentCash = OB.DEC.Zero,
        requiredCash;

    if (OB.UTIL.isNullOrUndefined(selectedPayment) || OB.UTIL.isNullOrUndefined(selectedPayment.paymentMethod.overpaymentLimit)) {
      return true;
    }

    requiredCash = paymentstatus.changeAmt;
    if (requiredCash !== 0) {
      if (selectedPayment.paymentMethod.overpaymentLimit === 0 && selectedPayment.paymentMethod.overpaymentLimit < requiredCash) {
        this.$.overpaymentnotavailable.show();
        return false;
      } else if (selectedPayment.paymentMethod.overpaymentLimit < requiredCash) {
        this.$.overpaymentexceedlimit.show();
        return false;
      } else {
        return true;
      }
    } else if (requiredCash === 0) {
      return true;
    }
    return true;
  },

  checkValidPaymentMethod: function (paymentstatus, payment) {
    var change = this.model.getChange();
    var check = true;
    var currentcash = payment.currentCash;
    var cashIsPresent = false;
    var alternativeCashPayment;
    var alternativePaymentInfo;
    if (change && change > 0) {
      if (!payment.paymentMethod.iscash) {
        if (paymentstatus.payments.size() > 1) {
          alternativeCashPayment = _.find(paymentstatus.payments.models, function (item) {
            if (item.get('isCash')) {
              return item;
            }
          });
          if (alternativeCashPayment) {
            alternativePaymentInfo = _.find(OB.MobileApp.model.get('payments'), function (defPayment) {
              if (defPayment.payment.searchKey === alternativeCashPayment.get('kind')) {
                return defPayment;
              }
            });
          }
          if (!alternativeCashPayment) {
            check = false;
            this.$.onlycashpaymentmethod.show();
          } else if (alternativePaymentInfo && alternativePaymentInfo.currentCash < change) {
            check = false;
            this.$.noenoughchangelbl.show();
          }
        } else {
          check = false;
          this.$.onlycashpaymentmethod.show();
        }
      } else {
        if (currentcash < change) {
          check = false;
          this.$.noenoughchangelbl.show();
        }
      }
    }
    return check;
  },

  checkValidPayments: function (paymentstatus, selectedPayment) {
    var resultOK, me = this;

    if (!selectedPayment) {
      return;
    }
    // Hide all error labels. Error labels are shown by check... functions
    if (_.isNull(paymentstatus.overpayment)) {
      this.$.overpaymentnotavailable.hide();
      this.$.overpaymentexceedlimit.hide();
    }
    this.$.noenoughchangelbl.hide();
    this.$.onlycashpaymentmethod.hide();

    // Do the checkins
    this.receipt.stopAddingPayments = !_.isEmpty(this.getShowingErrorMessages());
    resultOK = !selectedPayment.paymentMethod.iscash || paymentstatus.changeAmt > 0 ? this.checkValidCashOverpayment(paymentstatus, selectedPayment) : undefined;
    if (resultOK || _.isUndefined(resultOK)) {
      if (!_.isNull(paymentstatus.change) || (paymentstatus.isNegative && !_.isNull(paymentstatus.pending))) {
        resultOK = this.checkEnoughCashAvailable(paymentstatus, selectedPayment, this, function (success) {
          var lsuccess = success;
          if (lsuccess) {
            lsuccess = this.checkValidPaymentMethod(paymentstatus, selectedPayment);
          } else {
            this.$.noenoughchangelbl.show();
            this.$.donebutton.setLocalDisabled(true);
            this.$.exactbutton.setLocalDisabled(true);
          }
          me.receipt.stopAddingPayments = !_.isEmpty(me.getShowingErrorMessages());
          this.setStatusButtons(lsuccess);
        });
      } else if (!this.receipt.stopAddingPayments) {
        this.$.donebutton.setLocalDisabled(false);
        this.$.exactbutton.setLocalDisabled(false);
      }

    } else {
      me.receipt.stopAddingPayments = !_.isEmpty(me.getShowingErrorMessages());
      // Finally set status of buttons
      this.setStatusButtons(resultOK);
    }
    this.alignErrorMessages();
  },
  alignErrorMessages: function () {
    if (OB.MobileApp.view.currentWindow === 'retail.pointofsale' && typeof (this.$.errorLabelArea) !== 'undefined') {
      var me = this,
          delay = 1500;
      this.errorLabels = this.pushErrorMessagesToArray();
      this.showingCount = this.getShowingMessagesCount(this.errorLabels);
      clearInterval(this.maxAnimateErrorInterval);
      // 2 interval Max ,Min defined here
      // Min Interval Fuction Get Exexuted Based On the Max Interval 
      // Paramaters ,It will Reset After Every Max Interval 
      // In Order To Behave Like Animation Of The Text Error Messages 
      // To Fit into the Payment Area Where Error Messages To Be Shown 
      if (this.showingCount > 1) {
        me.animateErrorMessages();
        this.maxAnimateErrorInterval = setInterval(function () {
          clearInterval(this.animateErrorInterval);
          me.animateErrorMessages();
        }, delay + 1700 * this.showingCount);
      }
    }

  },
  animateErrorMessages: function () {
    if (OB.MobileApp.view.currentWindow === 'retail.pointofsale' && typeof (this.$.errorLabelArea) !== 'undefined') {
      clearInterval(this.animateErrorInterval);
      var me = this,
          marginTop = 0,
          resizediStyle = '',
          initialTop = 0,
          defaultStyle = 'position: absolute; bottom: 0px; height: 20px; color: #ff0000;';
      this.errorLabels = this.pushErrorMessagesToArray();
      this.showingCount = this.getShowingMessagesCount(this.errorLabels);
      this.firstShowingObject = this.getFirstShowingObject(this.errorLabels);
      if (this.firstShowingObject && this.showingCount > 1) {
        this.animateErrorInterval = setInterval(function () {
          marginTop = marginTop - 2;
          this.marginTop = marginTop;
          resizediStyle = 'margin-top: ' + marginTop + 'px';
          me.firstShowingObject.addStyles(resizediStyle);
        }, 100);
      }
      if (this.showingCount === 1) {
        defaultStyle = 'margin-top: ' + initialTop + 'px';
        this.firstShowingObject.addStyles(defaultStyle);
      }
    }
  },
  pushErrorMessagesToArray: function () {
    var errorLabelArray = [];
    errorLabelArray.push(this.$.noenoughchangelbl);
    errorLabelArray.push(this.$.overpaymentnotavailable);
    errorLabelArray.push(this.$.overpaymentexceedlimit);
    errorLabelArray.push(this.$.onlycashpaymentmethod);
    errorLabelArray.push(this.$.errorMaxlimitamount);
    return errorLabelArray;
  },
  getFirstShowingObject: function (errorLabelArray) {
    var showingObj = '',
        i;
    for (i = 0; i < errorLabelArray.length; i++) {
      var arrayContent = errorLabelArray[i];
      if (arrayContent.showing) {
        showingObj = arrayContent;
        break;
      }
    }
    return showingObj;
  },
  getShowingMessagesCount: function (errorLabelArray) {
    var count = 0,
        i;
    for (i = 0; i < errorLabelArray.length; i++) {
      var arrayContent = errorLabelArray[i];
      if (arrayContent.showing) {
        count = count + 1;
      }
    }
    return count;
  },
  resumeAnimation: function (inSender, inEvent) {
    if (inEvent.originator.type === 'error') {
      this.alignErrorMessages();
    }

  },
  pauseAnimation: function (inSender, inEvent) {
    if (inEvent.originator.type === 'error') {
      clearInterval(this.maxAnimateErrorInterval);
      clearInterval(this.animateErrorInterval);
      inEvent.originator.addStyles(this.marginTop);
    }

  },
  dispalyErrorLabels: function (inSender, inEvent) {
    if (inEvent.originator.type === 'error') {
      var message = this.getShowingErrorMessages();
      OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBMOBC_Error'), message);
      this.alignErrorMessages(false);
    }
  },
  getShowingErrorMessages: function () {
    var msgToReturn = '';
    var count = 0,
        i;
    if (this.errorLabels) {
      for (i = 0; i < this.errorLabels.length; i++) {
        var arrayContent = this.errorLabels[i];
        if (arrayContent.showing) {
          count = count + 1;
          msgToReturn = msgToReturn + '\n' + count + ')' + arrayContent.content;
        }
      }
    }
    return msgToReturn;
  },

  setStatusButtons: function (resultOK) {
    if (resultOK) {
      this.$.donebutton.setLocalDisabled(false);
      this.$.exactbutton.setLocalDisabled(false);
    } else {
      if (this.$.overpaymentnotavailable.showing || this.$.overpaymentexceedlimit.showing) {
        this.$.noenoughchangelbl.hide();
      } else {
        this.$.noenoughchangelbl.show();
      }
      this.$.donebutton.setLocalDisabled(true);
      this.$.exactbutton.setLocalDisabled(true);
    }
  },

  checkSlaveCashAvailable: function (selectedPayment, scope, callback) {

    function processCashMgmtMaster(cashMgntCallback) {
      new OB.DS.Process('org.openbravo.retail.posterminal.ProcessCashMgmtMaster').exec({
        cashUpId: OB.POS.modelterminal.get('terminal').cashUpId,
        terminalSlave: OB.POS.modelterminal.get('terminal').isslave
      }, function (data) {
        if (data && data.exception) {
          // Error handler 
          OB.log('error', data.exception.message);
          OB.UTIL.showConfirmation.display(
          OB.I18N.getLabel('OBPOS_CashMgmtError'), OB.I18N.getLabel('OBPOS_ErrorServerGeneric') + data.exception.message, [{
            label: OB.I18N.getLabel('OBPOS_LblRetry'),
            action: function () {
              processCashMgmtMaster(cashMgntCallback);
            }
          }], {
            autoDismiss: false,
            onHideFunction: function () {
              cashMgntCallback(false, null);
            }
          });
        } else {
          cashMgntCallback(true, data);
        }
      });
    }

    var currentCash = OB.DEC.Zero;
    if (selectedPayment && selectedPayment.paymentMethod.iscash) {
      currentCash = selectedPayment.currentCash || OB.DEC.Zero;
    }
    if ((OB.POS.modelterminal.get('terminal').ismaster || OB.POS.modelterminal.get('terminal').isslave) && selectedPayment.paymentMethod.iscash && selectedPayment.paymentMethod.isshared) {
      // Load current cashup info from slaves
      processCashMgmtMaster(function (success, data) {
        if (success) {
          _.each(data, function (pay) {
            if (pay.searchKey === selectedPayment.payment.searchKey) {
              currentCash = OB.DEC.add(currentCash, pay.startingCash + pay.totalDeposits + pay.totalSales - pay.totalReturns - pay.totalDrops);
            }
          });
        }
        callback.call(scope, currentCash);
      });
    } else {
      callback.call(scope, currentCash);
    }
  },

  initComponents: function () {
    this.inherited(arguments);
    this.$.errorLabelArea.render();
    this.$.totalpendinglbl.setContent(OB.I18N.getLabel('OBPOS_PaymentsRemaining'));
    this.$.changelbl.setContent(OB.I18N.getLabel('OBPOS_PaymentsChange'));
    this.$.overpaymentlbl.setContent(OB.I18N.getLabel('OBPOS_PaymentsOverpayment'));
    this.$.exactlbl.setContent(OB.I18N.getLabel('OBPOS_PaymentsExact'));
    this.$.donezerolbl.setContent(OB.I18N.getLabel('OBPOS_MsgPaymentAmountZero'));
    this.$.noenoughchangelbl.setContent(OB.I18N.getLabel('OBPOS_NoEnoughCash'));
    this.$.overpaymentnotavailable.setContent(OB.I18N.getLabel('OBPOS_OverpaymentNotAvailable'));
    this.$.overpaymentexceedlimit.setContent(OB.I18N.getLabel('OBPOS_OverpaymentExcededLimit'));
    this.$.onlycashpaymentmethod.setContent(OB.I18N.getLabel('OBPOS_OnlyCashPaymentMethod'));
  },
  init: function (model) {
    var me = this;
    this.model = model;
    if (_.isEmpty(OB.MobileApp.model.paymentnames)) {
      this.$.donebutton.show();
      this.$.exactbutton.hide();
    }
    this.model.get('multiOrders').get('multiOrdersList').on('all', function (event) {
      if (this.model.isValidMultiOrderState()) {
        this.updatePendingMultiOrders();
      }
    }, this);

    this.model.get('multiOrders').on('change:payment change:total change:change', function () {
      this.updatePendingMultiOrders();
    }, this);
    this.model.get('leftColumnViewManager').on('change:currentView', function (changedModel) {
      if (changedModel.isOrder()) {
        this.$.multiPayments.hide();
        this.$.payments.show();
        return;
      }
      if (changedModel.isMultiOrder()) {
        this.$.multiPayments.show();
        this.$.payments.hide();
        return;
      }
    }, this);
    //    this.model.get('multiOrders').on('change:isMultiOrders', function () {
    //      if (!this.model.get('multiOrders').get('isMultiOrders')) {
    //        this.$.multiPayments.hide();
    //        this.$.payments.show();
    //      } else {
    //        this.$.payments.hide();
    //        this.$.multiPayments.show();
    //      }
    //    }, this);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.ProcessButton',
  kind: 'OB.UI.RegularButton',
  style: 'width: 120px; float: right; margin: 5px 5px 10px 0px; height: 2.5em; display:block; clear: right; font-weight: normal; padding: 0px',
  processdisabled: false,
  localdisabled: false,
  setLocalDisabled: function (value) {
    this.localdisabled = value;
    this.setDisabled(this.processdisabled || this.localdisabled);
  },
  initComponents: function () {
    var me = this;
    this.inherited(arguments);
    OB.POS.EventBus.on('UI_Enabled', function (state) {
      me.processdisabled = !state;
      me.setDisabled(me.processdisabled || me.localdisabled);
    });
    me.processdisabled = !OB.POS.EventBus.isProcessEnabled();
    me.setDisabled(me.processdisabled || me.localdisabled);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.DoneButton',
  kind: 'OB.OBPOSPointOfSale.UI.ProcessButton',
  handlers: {
    synchronizing: 'isSynchronizing',
    synchronized: 'isSynchronized'
  },
  drawerOpened: true,
  isLocked: true,
  lasDisabledPetition: true,
  isSynchronizing: function () {
    this.isLocked = true;
    this.setDisabledIfSynchronized();
  },
  isSynchronized: function () {
    this.isLocked = false;
    this.setDisabledIfSynchronized();
  },
  setDisabled: function (value) {
    this.lasDisabledPetition = value;
    this.setDisabledIfSynchronized(value);
  },
  setDisabledIfSynchronized: function () {
    var value = this.lasDisabledPetition;
    // check arguments
    if (value === undefined) {
      // be sure that the value is always valid
      OB.UTIL.Debug.execute(function () {
        throw "The disabled value must be true or false";
      });
      value = false;
    }
    // force disabled is there are pending synchronizations
    if (this.isLocked) {
      value = true;
    }
    this.disabled = value; // for getDisabled() to return the correct value
    this.setAttribute('disabled', value); // to effectively turn the button enabled or disabled    
  },
  init: function (model) {
    this.model = model;
    this.setContent(OB.I18N.getLabel('OBPOS_LblDone'));
    this.model.get('order').on('change:openDrawer', function () {
      this.drawerpreference = this.model.get('order').get('openDrawer');
      var me = this;

      if (this.drawerpreference) {
        this.drawerOpened = false;
        this.setContent(OB.I18N.getLabel('OBPOS_LblOpen'));
      } else {
        this.drawerOpened = true;
        this.setContent(OB.I18N.getLabel('OBPOS_LblDone'));
      }
    }, this);
    this.model.get('multiOrders').on('change:openDrawer', function () {
      this.drawerpreference = this.model.get('multiOrders').get('openDrawer');
      if (this.drawerpreference) {
        this.drawerOpened = false;
        this.setContent(OB.I18N.getLabel('OBPOS_LblOpen'));
      } else {
        this.drawerOpened = true;
        this.setContent(OB.I18N.getLabel('OBPOS_LblDone'));
      }
    }, this);
    this.model.get('order').on('paymentCancel', function () {
      OB.UTIL.showLoading(false);
      this.setDisabled(false);
    }, this);
  },
  blocked: false,
  tap: function () {
    var myModel = this.owner.model,
        me = this,
        payments, orderDesc = '';
    //*** Avoid double click ***
    if (this.getContent() === OB.I18N.getLabel('OBPOS_LblDone')) {
      if (me.blocked) {
        if (this.owner.receipt && this.owner.receipt.getOrderDescription) {
          orderDesc = this.owner.receipt.getOrderDescription();
        }
        OB.error('Time: ' + new Date() + '. Done button has been pressed 2 times and second execution is discarded ' + orderDesc);
        return;
      } else {
        me.blocked = true;
        setTimeout(function () {
          me.blocked = false;
        }, 1000);
      }
    }
    if (this && this.owner && this.owner.receipt && this.owner.receipt.getOrderDescription) {
      orderDesc = this.owner.receipt.getOrderDescription();
    }
    OB.info('Time: ' + new Date() + '. Payment Button Pressed ( Status: ' + this.disabled + ') ' + orderDesc);
    this.allowOpenDrawer = false;

    if (this.disabled) {
      return true;
    }

    var synchId = OB.UTIL.SynchronizationHelper.busyUntilFinishes("doneButton");

    if (myModel.get('leftColumnViewManager').isOrder()) {
      payments = this.owner.receipt.get('payments');
    } else {
      payments = this.owner.model.get('multiOrders').get('payments');
    }

    payments.each(function (payment) {
      if (payment.get('allowOpenDrawer') || payment.get('isCash')) {
        me.allowOpenDrawer = true;
      }
    });
    //if (this.owner.model.get('multiOrders').get('multiOrdersList').length === 0 && !this.owner.model.get('multiOrders').get('isMultiOrders')) {
    if (myModel.get('leftColumnViewManager').isOrder()) {
      if (this.drawerpreference && this.allowOpenDrawer) {
        if (this.drawerOpened) {
          if (this.owner.receipt.get('orderType') === 3) {
            this.owner.receipt.trigger('voidLayaway');
          } else {
            this.setDisabled(true);
            enyo.$.scrim.show();
            me.owner.model.get('order').trigger('paymentDone', false);
          }
          this.drawerOpened = false;
          this.setContent(OB.I18N.getLabel('OBPOS_LblOpen'));
        } else {
          OB.POS.hwserver.openDrawer({
            openFirst: true,
            receipt: me.owner.receipt
          }, OB.MobileApp.model.get('permissions').OBPOS_timeAllowedDrawerSales);
          this.drawerOpened = true;
          this.setContent(OB.I18N.getLabel('OBPOS_LblDone'));
        }
      } else {
        //Void Layaway
        if (this.owner.receipt.get('orderType') === 3) {
          this.owner.receipt.trigger('voidLayaway');
        } else {
          this.setDisabled(true);
          enyo.$.scrim.show();
          me.owner.receipt.trigger('paymentDone', this.allowOpenDrawer);
        }
      }
    } else {
      if (this.drawerpreference && this.allowOpenDrawer) {
        if (this.drawerOpened) {
          enyo.$.scrim.show();
          this.owner.model.get('multiOrders').trigger('paymentDone', false);
          this.owner.model.get('multiOrders').set('openDrawer', false);
          this.drawerOpened = false;
          this.setContent(OB.I18N.getLabel('OBPOS_LblOpen'));
        } else {
          OB.POS.hwserver.openDrawer({
            openFirst: true,
            receipt: me.owner.model.get('multiOrders')
          }, OB.MobileApp.model.get('permissions').OBPOS_timeAllowedDrawerSales);
          this.drawerOpened = true;
          this.setContent(OB.I18N.getLabel('OBPOS_LblDone'));
        }
      } else {
        enyo.$.scrim.show();
        this.owner.model.get('multiOrders').trigger('paymentDone', this.allowOpenDrawer);
        this.owner.model.get('multiOrders').set('openDrawer', false);
      }
    }
    OB.UTIL.SynchronizationHelper.finished(synchId, "doneButton");
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.ExactButton',
  kind: 'OB.OBPOSPointOfSale.UI.ProcessButton',
  events: {
    onExactPayment: ''
  },
  classes: 'btn-icon-adaptative btn-icon-check btnlink-green',
  tap: function () {
    if (this.disabled) {
      return true;
    }
    this.doExactPayment();
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.RenderPaymentLine',
  classes: 'btnselect',
  components: [{
    style: 'color:white;',
    components: [{
      name: 'name',
      style: 'float: left; width: 20%; padding: 5px 0px 0px 0px;'
    }, {
      name: 'info',
      style: 'float: left; width: 15%; padding: 5px 0px 0px 0px;'
    }, {
      name: 'foreignAmount',
      style: 'float: left; width: 20%; padding: 5px 0px 0px 0px; text-align: right;'
    }, {
      name: 'amount',
      style: 'float: left; width: 25%; padding: 5px 0px 0px 0px; text-align: right;'
    }, {
      style: 'float: left; width: 20%; text-align: right;',
      components: [{
        kind: 'OB.OBPOSPointOfSale.UI.RemovePayment'
      }]
    }, {
      style: 'clear: both;'
    }]
  }],
  initComponents: function () {
    this.inherited(arguments);
    this.$.name.setContent(OB.MobileApp.model.getPaymentName(this.model.get('kind')) || this.model.get('name'));
    this.$.amount.setContent(this.model.printAmount());
    if (this.model.get('rate') && this.model.get('rate') !== '1') {
      this.$.foreignAmount.setContent(this.model.printForeignAmount());
    } else {
      this.$.foreignAmount.setContent('');
    }
    if (this.model.get('description')) {
      this.$.info.setContent(this.model.get('description'));
    } else {
      if (this.model.get('paymentData')) {
        //legacy
        if (this.model.get('paymentData').Name) {
          this.model.get('paymentData').name = this.model.get('paymentData').Name;
        }
        //end legacy
        this.$.info.setContent(this.model.get('paymentData').name);
      } else {
        this.$.info.setContent('');
      }
    }
    if (this.model.get('isPrePayment')) {
      this.hide();
    }
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.RemovePayment',
  events: {
    onRemovePayment: ''
  },
  kind: 'OB.UI.SmallButton',
  classes: 'btnlink-darkgray btnlink-payment-clear btn-icon-small btn-icon-clearPayment',
  tap: function () {
    var me = this;
    if ((_.isUndefined(this.deleting) || this.deleting === false)) {
      this.deleting = true;
      this.removeClass('btn-icon-clearPayment');
      this.addClass('btn-icon-loading');
      this.bubble('onMaxLimitAmountError', {
        show: false,
        maxLimitAmount: 0,
        currency: '',
        symbolAtRight: true
      });
      this.bubble('onClearPaymentSelect');
      this.doRemovePayment({
        payment: this.owner.model,
        removeCallback: function () {
          me.deleting = false;
          me.removeClass('btn-icon-loading');
          me.addClass('btn-icon-clearPayment');
        }
      });
    }
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.CreditButton',
  kind: 'OB.OBPOSPointOfSale.UI.ProcessButton',
  i18nLabel: 'OBPOS_LblCreditSales',
  classes: 'btn-icon-small btnlink-green',
  permission: 'OBPOS_receipt.creditsales',
  events: {
    onShowPopup: ''
  },
  init: function (model) {
    this.model = model;
  },
  disabled: false,
  putDisabled: function (status) {
    if (status === false) {
      this.setDisabled(false);
      this.removeClass('disabled');
      this.disabled = false;
    } else {
      this.setDisabled(true);
      this.addClass('disabled');
      this.disabled = true;
    }
  },
  initComponents: function () {
    this.inherited(arguments);
    this.putDisabled(!OB.MobileApp.model.hasPermission(this.permission));
  },
  tap: function () {
    if (this.disabled) {
      return true;
    }

    var process = new OB.DS.Process('org.openbravo.retail.posterminal.CheckBusinessPartnerCredit');
    var me = this;
    var paymentstatus = this.model.get('order').getPaymentStatus();
    if (!paymentstatus.isReturn) {
      //this.setContent(OB.I18N.getLabel('OBPOS_LblLoading'));
      var synchId = OB.UTIL.SynchronizationHelper.busyUntilFinishes("creditButtonTap");
      process.exec({
        businessPartnerId: this.model.get('order').get('bp').get('id'),
        totalPending: this.model.get('order').getPending()
      }, function (data) {
        OB.UTIL.SynchronizationHelper.finished(synchId, "creditButtonTap");
        if (data) {
          if (data.enoughCredit) {
            me.doShowPopup({
              popup: 'modalEnoughCredit',
              args: {
                order: me.model.get('order')
              }
            });
            //this.setContent(OB.I18N.getLabel('OBPOS_LblCreditSales'));
          } else {
            var bpName = data.bpName;
            var actualCredit = data.actualCredit;
            me.doShowPopup({
              popup: 'modalNotEnoughCredit',
              args: {
                bpName: bpName,
                actualCredit: actualCredit
              }
            });
            //this.setContent(OB.I18N.getLabel('OBPOS_LblCreditSales'));
            //OB.UI.UTILS.domIdEnyoReference['modalNotEnoughCredit'].$.bodyContent.children[0].setContent();
          }
        } else {
          OB.UTIL.showError(OB.I18N.getLabel('OBPOS_MsgErrorCreditSales'));
        }
      }, function () {
        OB.UTIL.SynchronizationHelper.finished(synchId, "creditButtonTap");
        me.doShowPopup({
          popup: 'modalEnoughCredit',
          args: {
            order: me.model.get('order'),
            message: 'OBPOS_Unabletocheckcredit'
          }
        });
      });
      //    } else if (this.model.get('order').get('orderType') === 1) {
    } else if (paymentstatus.isReturn) {
      var actualCredit;
      var creditLimit = this.model.get('order').get('bp').get('creditLimit');
      var creditUsed = this.model.get('order').get('bp').get('creditUsed');
      var totalPending = this.model.get('order').getPending();
      this.doShowPopup({
        popup: 'modalEnoughCredit',
        args: {
          order: this.model.get('order')
        }
      });
    }
  }
});
enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.LayawayButton',
  kind: 'OB.OBPOSPointOfSale.UI.ProcessButton',
  content: '',
  classes: 'btn-icon-small btnlink-green',
  permission: 'OBPOS_receipt.layawayReceipt',
  init: function (model) {
    this.model = model;
    this.setContent(OB.I18N.getLabel('OBPOS_LblLayaway'));
  },
  updateVisibility: function (isVisible) {
    if (!OB.MobileApp.model.hasPermission(this.permission)) {
      this.hide();
      return;
    }
    if (!isVisible) {
      this.hide();
      return;
    }
    this.show();
  },
  tap: function () {
    var receipt = this.owner.receipt,
        negativeLines, me = this,
        myModel = this.owner.model,
        payments;
    this.allowOpenDrawer = false;

    if (receipt.get('bp').id === OB.MobileApp.model.get('terminal').businessPartner && !OB.MobileApp.model.get('terminal').layaway_anonymouscustomer) {
      OB.UTIL.showConfirmation.display("Error", OB.I18N.getLabel('OBPOS_layawaysOrdersWithAnonimousCust'));
      return;
    }

    if (!this.showing) {
      return true;
    }

    if (myModel.get('leftColumnViewManager').isOrder()) {
      payments = this.owner.receipt.get('payments');
    } else {
      payments = this.owner.model.get('multiOrders').get('payments');
    }

    payments.each(function (payment) {
      if (payment.get('allowOpenDrawer') || payment.get('isCash')) {
        me.allowOpenDrawer = true;
      }
    });
    if (receipt) {
      negativeLines = _.find(receipt.get('lines').models, function (line) {
        return line.get('qty') < 0;
      });
      if (negativeLines) {
        OB.UTIL.showWarning(OB.I18N.getLabel('OBPOS_layawaysOrdersWithReturnsNotAllowed'));
        return true;
      }
      if (receipt.get('generateInvoice')) {
        OB.UTIL.showWarning(OB.I18N.getLabel('OBPOS_noInvoiceIfLayaway'));
        receipt.set('generateInvoice', false);
      }
    }
    this.hide();
    enyo.$.scrim.show();
    receipt.trigger('paymentDone', me.allowOpenDrawer);
  }
});