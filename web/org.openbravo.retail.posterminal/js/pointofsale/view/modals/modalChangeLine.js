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
  actionInput: function (inSender, inEvent) {
    var value = parseFloat(this.$.textline.getValue());
    this.edited = true;
    this.hasErrors = _.isNaN(value) || value < 0 || value > this.maxValue;
    this.displayStatus();

    return this.bubble('onActionInput', {
      value: value,
      hasErrors: this.hasErrors,
      line: this
    });
  },
  actionShowRemaining: function (inSender, inEvent) {
    var remaining = this.calculateAmount(inEvent.value);

    switch (OB.DEC.compare(remaining)) {
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
    var currentChange;

    this.maxValue = this.calculateAmount(inEvent.receipt.getPaymentStatus().changeAmt);
    this.$.infomax.setContent(OB.I18N.getLabel('OBPOS_MaxChange', [OB.I18N.formatCurrencyWithSymbol(this.maxValue, this.payment.symbol, this.payment.currencySymbolAtTheRight)]));
    this.$.inforemaining.setContent('');
    this.edited = false;
    this.isComplete = false;
    this.isOverpaid = false;

    currentChange = inEvent.receipt.get('changePayments').find(function (item) {
      return item.key === this.payment.payment.searchKey;
    }, this);

    this.assignValidValue(currentChange ? currentChange.amountRounded : 0);
  },
  assignValidValue: function (amountRounded) {
    this.$.textline.setValue(amountRounded);
    this.hasErrors = false;
    this.displayStatus();
    setTimeout(function () {
      this.$.textline.hasNode().setSelectionRange(0, this.$.textline.getValue().length);
    }.bind(this), 100);
  },
  calculateAmount: function (value) {
    return OB.Payments.Change.getChangeRounded({
      payment: this.payment,
      amount: OB.DEC.mul(value, this.payment.mulrate, this.payment.obposPosprecision)
    });
  },
  displayStatus: function () {
    this.$.textline.removeClass('changedialog-properties-validation-ok');
    this.$.textline.removeClass('changedialog-properties-validation-error');
    this.$.textline.addClass(this.hasErrors || this.isOverpaid ? 'changedialog-properties-validation-error' : 'changedialog-properties-validation-ok');
  }
});