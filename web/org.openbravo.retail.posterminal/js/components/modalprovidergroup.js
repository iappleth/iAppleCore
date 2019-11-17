/*
 ************************************************************************************
 * Copyright (C) 2018-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, _*/

enyo.kind({
  name: 'OB.UI.ModalProviderGroup',
  kind: 'OB.UI.Modal',
  classes: 'obUiModalProviderGroup',
  header: '',
  autoDismiss: false,
  hideCloseButton: true,
  events: {
    onHideThisPopup: ''
  },
  body: {
    classes: 'obUiModalProviderGroup-body',
    components: [
      {
        classes: 'obUiModalProviderGroup-body-container1',
        components: [
          {
            classes:
              'obUiModalProviderGroup-body-container1-container1 row-fluid',
            components: [
              {
                name: 'lblType',
                classes:
                  'obUiModalProviderGroup-body-container1-container1-lblType'
              },
              {
                name: 'paymenttype',
                classes:
                  'obUiModalProviderGroup-body-container1-container1-paymenttype'
              }
            ]
          },
          {
            classes: 'obUiModalProviderGroup-body-container1-container2'
          },
          {
            classes:
              'obUiModalProviderGroup-body-container1-container3 row-fluid',
            components: [
              {
                name: 'description',
                classes:
                  'obUiModalProviderGroup-body-container1-container3-description'
              }
            ]
          },
          {
            classes: 'obUiModalProviderGroup-body-container1-container4'
          }
        ]
      },
      {
        classes: 'obUiModalProviderGroup-body-providergroupcomponent',
        name: 'providergroupcomponent'
      }
    ]
  },
  initComponents: function() {
    this.inherited(arguments);
  },
  createProvider: function(providername, refund) {
    if (refund) {
      return (
        enyo.createFromKind(providername + 'Refund') ||
        enyo.createFromKind(providername)
      );
    } else {
      return enyo.createFromKind(providername);
    }
  },
  executeOnShow: function() {
    var amount = this.args.amount;
    var refund = this.args.refund;
    var providerGroup = this.args.providerGroup;

    this.setHeader(
      refund
        ? OB.I18N.getLabel('OBPOS_LblModalReturn', [
            OB.I18N.formatCurrency(amount)
          ])
        : OB.I18N.getLabel('OBPOS_LblModalPayment', [
            OB.I18N.formatCurrency(amount)
          ])
    );
    this.$.body.$.lblType.setContent(OB.I18N.getLabel('OBPOS_LblModalType'));
    this.$.body.$.paymenttype.setContent(providerGroup.provider._identifier);
    this.$.body.$.description.setContent(providerGroup.provider.description);

    // Set timeout needed because on ExecuteOnShow
    setTimeout(this.startPaymentRefund.bind(this), 0);
  },
  showMessageAndClose: function(message) {
    window.setTimeout(this.doHideThisPopup.bind(this), 0);
    OB.UTIL.showConfirmation.display(
      OB.I18N.getLabel('OBPOS_LblPaymentMethod'),
      message,
      [
        {
          label: OB.I18N.getLabel('OBMOBC_LblOk'),
          isConfirmButton: true
        }
      ],
      {
        autoDismiss: false
      }
    );
  },
  startPaymentRefund: function() {
    var receipt = this.args.receipt;
    var amount = this.args.amount;
    var refund = this.args.refund;
    var currency = this.args.currency;
    var providerGroup = this.args.providerGroup;
    var providerinstance = this.createProvider(
      this.args.providername,
      this.args.refund
    );
    var attributes = this.args.attributes;
    var i;

    this.$.body.$.providergroupcomponent.destroyComponents();
    if (providerinstance.providerComponent) {
      this.$.body.$.providergroupcomponent
        .createComponent(providerinstance.providerComponent)
        .render();
    }

    if (providerinstance.checkOverpayment && !refund) {
      // check over payments in all payments of the group
      for (i = 0; i < providerGroup._payments.length; i++) {
        var payment = providerGroup._payments[i];

        if (!payment.paymentMethod.allowoverpayment) {
          this.showMessageAndClose(
            OB.I18N.getLabel('OBPOS_OverpaymentNotAvailable')
          );
          return;
        }

        if (
          _.isNumber(payment.paymentMethod.overpaymentLimit) &&
          amount >
            OB.BIGDEC.sub(
              receipt.get('gross') + payment.paymentMethod.overpaymentLimit,
              receipt.get('payment')
            )
        ) {
          this.showMessageAndClose(
            OB.I18N.getLabel('OBPOS_OverpaymentExcededLimit')
          );
          return;
        }
      }
    }

    providerinstance
      .processPayment({
        receipt: receipt,
        currency: currency,
        amount: amount,
        refund: refund,
        providerGroup: providerGroup
      })
      .then(response => {
        const processedAmount = response.properties.processedAmount
          ? response.properties.processedAmount
          : amount;
        const addResponseToPayment = payment => {
          // We found the payment method that applies.
          const paymentline = {
            kind: payment.payment.searchKey,
            name: payment.payment._identifier,
            amount: processedAmount,
            rate: payment.rate,
            mulrate: payment.mulrate,
            isocode: payment.isocode,
            allowOpenDrawer: payment.paymentMethod.allowopendrawer,
            isCash: payment.paymentMethod.iscash,
            openDrawer: payment.paymentMethod.openDrawer,
            printtwice: payment.paymentMethod.printtwice,
            paymentData: {
              provider: providerGroup.provider,
              voidConfirmation: false,
              // Is the void provider in charge of defining confirmation.
              transaction: response.transaction,
              authorization: response.authorization,
              properties: response.properties
            }
          };
          receipt.addPayment(
            new OB.Model.PaymentLine(Object.assign(paymentline, attributes))
          );
          window.setTimeout(this.doHideThisPopup.bind(this), 0);
        };

        // First attempt. Find an exact match.
        const cardlogo = response.properties.cardlogo;
        let undefinedPayment = null;
        for (i = 0; i < providerGroup._payments.length; i++) {
          const payment = providerGroup._payments[i];
          if (cardlogo === payment.paymentType.searchKey) {
            addResponseToPayment(payment);
            return; // Success
          } else if ('UNDEFINED' === payment.paymentType.searchKey) {
            undefinedPayment = payment;
          }
        }

        // Second attempt. Find UNDEFINED paymenttype.
        if (undefinedPayment) {
          addResponseToPayment(undefinedPayment);
          return; // Success
        }

        // Fail. Cannot find payment to assign response
        this.showMessageAndClose(
          OB.I18N.getLabel('OBPOS_CannotFindPaymentMethod')
        );
      })
      .catch(exception => {
        this.showMessageAndClose(
          providerinstance.getErrorMessage
            ? providerinstance.getErrorMessage(exception)
            : exception.message
        );
      });
  }
});
