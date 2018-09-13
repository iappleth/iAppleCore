/*
 ************************************************************************************
 * Copyright (C) 2018 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, _, enyo */

enyo.kind({
  name: 'OB.UI.ModalChangeLine',
  handlers: {
    onActionShow: 'actionShow',
    onActionShowRemaining: 'actionShowRemaining'
  },
  components: [{
    name: 'labelLine',
    classes: 'properties-label changedialog-properties-label',
    content: ''
  }, {
    classes: 'modal-dialog-receipt-properties-text changedialog-properties-text',
    components: [{
      name: 'textline',
      kind: 'enyo.Input',
      type: 'text',
      classes: 'input changedialog-properties-input',
      oninput: 'actionInput'
    }]
  }, {
    classes: 'changedialog-properties-info',
    components: [{
      name: 'infomax',
      classes: 'changedialog-properties-info-text'
    }, {
      name: 'inforemaining',
      classes: 'changedialog-properties-info-text'
    }]
  }, {
    classes: 'changedialog-properties-end'
  }],
  initComponents: function () {
    this.inherited(arguments);
    this.$.labelLine.content = this.payment.payment.commercialName;
  },
  getParsedValue: function () {
    var value = this.$.textline.getValue();
    try {
      if (!OB.I18N.isValidNumber(value)) {
        return NaN;
      }
      value = value.split(OB.Format.defaultGroupingSymbol).join(''); // Replace All
      return OB.I18N.parseNumber(value);
    } catch (ex) {
      return NaN;
    }
  },
  actionInput: function (inSender, inEvent) {
    var value = this.getParsedValue();
    this.edited = true;
    this.hasErrors = _.isNaN(value) || value < 0 || OB.DEC.compare(OB.DEC.sub(value, this.calculateAmount(value), this.payment.obposPosprecision));
    this.displayStatus();

    return this.bubble('onActionInput', {
      value: value,
      hasErrors: this.hasErrors,
      line: this
    });
  },
  actionShowRemaining: function (inSender, inEvent) {
    var remaining = this.calculateAmount(OB.DEC.mul(inEvent.value, this.payment.mulrate, this.payment.obposPosprecision));
    switch (OB.DEC.compare(inEvent.value)) {
    case -1:
      this.$.inforemaining.setContent(OB.I18N.getLabel('OBPOS_RemainingOverpaid'));
      this.isComplete = false;
      this.isOverpaid = true;
      break;
    case 0:
      this.$.inforemaining.setContent('');
      this.isComplete = true;
      this.isOverpaid = false;
      break;
    default:
      this.$.inforemaining.setContent(OB.I18N.getLabel('OBPOS_RemainingChange', [OB.I18N.formatCurrencyWithSymbol(remaining, this.payment.symbol, this.payment.currencySymbolAtTheRight)]));
      this.isComplete = false;
      this.isOverpaid = false;
      break;
    }
    this.displayStatus();
  },
  actionShow: function (inSender, inEvent) {
    var value, currentChange;

    value = OB.DEC.mul(inEvent.receipt.getPaymentStatus().changeAmt, this.payment.mulrate, this.payment.obposPosprecision);
    this.maxValue = this.calculateAmount(value);
    this.$.infomax.setContent(OB.I18N.getLabel('OBPOS_MaxChange', [OB.I18N.formatCurrencyWithSymbol(this.maxValue, this.payment.symbol, this.payment.currencySymbolAtTheRight)]));
    this.$.inforemaining.setContent('');
    this.edited = false;
    this.isComplete = true;
    this.isOverpaid = false;

    currentChange = inEvent.receipt.get('changePayments').find(function (item) {
      return item.key === this.payment.payment.searchKey;
    }, this);

    this.assignValidValue(currentChange ? currentChange.amountRounded : 0);
  },
  assignValidValue: function (amountRounded) {
    this.$.textline.setValue(OB.I18N.formatCurrency(amountRounded));
    this.hasErrors = false;
    this.displayStatus();
    setTimeout(function () {
      this.$.textline.hasNode().setSelectionRange(0, this.$.textline.getValue().length);
    }.bind(this), 100);
  },
  calculateAmount: function (value) {
    var changeLessThan;

    changeLessThan = this.payment.paymentMethod.changeLessThan;
    if (changeLessThan) {
      return OB.DEC.mul(changeLessThan, Math.trunc(OB.DEC.div(value, changeLessThan, 5)), this.payment.obposPosprecision);
    } else {
      return OB.Payments.Change.getChangeRounded({
        payment: this.payment,
        amount: value
      });
    }
  },
  displayStatus: function () {
    this.$.textline.removeClass('changedialog-properties-validation-ok');
    this.$.textline.removeClass('changedialog-properties-validation-error');
    this.$.textline.addClass(this.hasErrors || this.isOverpaid ? 'changedialog-properties-validation-error' : 'changedialog-properties-validation-ok');
  }
});