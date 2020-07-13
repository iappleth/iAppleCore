/*
 ************************************************************************************
 * Copyright (C) 2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/**
 * @fileoverview defines the Ticket global action that completes a ticket and moves it to a message in the state
 */

/* eslint-disable no-use-before-define */

(() => {
  OB.App.StateAPI.Global.registerAction(
    'completeTicket',
    (globalState, payload) => {
      const newGlobalState = { ...globalState };
      let newTicket = { ...newGlobalState.Ticket };
      let newDocumentSequence = { ...newGlobalState.DocumentSequence };
      let newCashup = { ...newGlobalState.Cashup };
      let newMessages = [...newGlobalState.Messages];

      // Set complete ticket properties
      newTicket.completeTicket = true;
      newTicket = OB.App.State.Ticket.Utils.completeTicket(newTicket, payload);

      // FIXME: Move to calculateTotals?
      newTicket = OB.App.State.Ticket.Utils.updateTicketType(
        newTicket,
        payload
      );

      // Complete ticket payment
      newTicket = OB.App.State.Ticket.Utils.completePayment(newTicket, payload);

      // Document number generation
      ({
        ticket: newTicket,
        documentSequence: newDocumentSequence
      } = OB.App.State.DocumentSequence.Utils.generateTicketDocumentSequence(
        newTicket,
        newDocumentSequence,
        payload
      ));

      // Delivery generation
      newTicket = OB.App.State.Ticket.Utils.generateDelivery(
        newTicket,
        payload
      );

      // Invoice generation
      newTicket = OB.App.State.Ticket.Utils.generateInvoice(newTicket, payload);
      if (newTicket.calculatedInvoice) {
        ({
          ticket: newTicket.calculatedInvoice,
          documentSequence: newDocumentSequence
        } = OB.App.State.DocumentSequence.Utils.generateTicketDocumentSequence(
          newTicket.calculatedInvoice,
          newDocumentSequence,
          payload
        ));
      }

      // Cashup update
      ({
        ticket: newTicket,
        cashup: newCashup
      } = OB.App.State.Cashup.Utils.updateCashupFromTicket(
        newTicket,
        newCashup,
        payload
      ));

      // Ticket synchronization message
      newMessages = [
        ...newMessages,
        OB.App.State.Messages.Utils.createNewMessage(
          'Order',
          'org.openbravo.retail.posterminal.OrderLoader',
          newTicket
        )
      ];

      // Ticket print message
      newMessages = [
        ...newMessages,
        OB.App.State.Messages.Utils.createPrintTicketMessage(newTicket)
      ];
      if (newTicket.calculatedInvoice) {
        newMessages = [
          ...newMessages,
          OB.App.State.Messages.Utils.createPrintTicketMessage(
            newTicket.calculatedInvoice
          )
        ];
      }

      newGlobalState.Ticket = newTicket;
      newGlobalState.DocumentSequence = newDocumentSequence;
      newGlobalState.Cashup = newCashup;
      newGlobalState.Messages = newMessages;

      return newGlobalState;
    }
  );

  OB.App.StateAPI.Global.completeTicket.addActionPreparation(
    async (globalState, payload) => {
      let newPayload = { ...payload };

      newPayload = await checkAnonymousReturn(globalState.Ticket, newPayload);
      newPayload = await checkNegativePayments(globalState.Ticket, newPayload);
      newPayload = await checkExtraPayments(globalState.Ticket, newPayload);
      newPayload = await checkPrePayments(globalState.Ticket, newPayload);
      newPayload = await checkOverPayments(globalState.Ticket, newPayload);
      newPayload = await checkTicketUpdated(globalState.Ticket, newPayload);

      return newPayload;
    },
    async (globalState, payload) => payload,
    100
  );

  const checkAnonymousReturn = async (ticket, payload) => {
    if (
      !payload.terminal.returnsAnonymousCustomer &&
      ticket.businessPartner.id === payload.terminal.businessPartner &&
      ticket.lines.some(line => line.qty < 0 && !line.originalDocumentNo)
    ) {
      throw new OB.App.Class.ActionCanceled({
        errorConfirmation: 'OBPOS_returnServicesWithAnonimousCust'
      });
    }

    return payload;
  };

  const checkNegativePayments = async (ticket, payload) => {
    if (
      ticket.payments
        .filter(payment => payment.isReturnOrder !== undefined)
        .some(payment => payment.isReturnOrder !== ticket.isNegative)
    ) {
      throw new OB.App.Class.ActionCanceled({
        errorConfirmation: ticket.isNegative
          ? 'OBPOS_PaymentOnReturnReceipt'
          : 'OBPOS_NegativePaymentOnReceipt'
      });
    }

    return payload;
  };

  const checkExtraPayments = async (ticket, payload) => {
    ticket.payments.reduce((total, payment) => {
      if (total >= OB.DEC.abs(ticket.grossAmount) && !payment.paymentRounding) {
        throw new OB.App.Class.ActionCanceled({
          errorConfirmation: 'OBPOS_UnnecessaryPaymentAdded'
        });
      }

      if (
        payment.isReversePayment ||
        payment.isReversed ||
        payment.isPrePayment
      ) {
        return total;
      }

      return OB.DEC.add(total, payment.origAmount);
    }, OB.DEC.Zero);

    return payload;
  };

  const checkPrePayments = async (ticket, payload) => {
    const paymentStatus = OB.App.State.Ticket.Utils.getPaymentStatus(
      ticket,
      payload
    );

    if (
      !payload.terminal.calculatePrepayments ||
      ticket.orderType === 1 ||
      ticket.orderType === 3 ||
      ticket.obposPrepaymentlimitamt === OB.DEC.Zero ||
      paymentStatus.totalAmt <= OB.DEC.Zero ||
      OB.DEC.sub(
        OB.DEC.add(ticket.obposPrepaymentlimitamt, paymentStatus.pendingAmt),
        paymentStatus.totalAmt
      ) <= OB.DEC.Zero
    ) {
      return payload;
    }

    if (!OB.App.Security.hasPermission('OBPOS_AllowPrepaymentUnderLimit')) {
      throw new OB.App.Class.ActionCanceled({
        errorConfirmation: 'OBPOS_PrepaymentUnderLimit_NotAllowed',
        messageParams: [ticket.obposPrepaymentlimitamt]
      });
    }

    if (
      ticket.approvals.some(
        approval =>
          approval.approvalType === 'OBPOS_approval.prepaymentUnderLimit'
      )
    ) {
      return payload;
    }

    const newPayload = await OB.App.Security.requestApprovalForAction(
      'OBPOS_approval.prepaymentUnderLimit',
      payload
    );
    return newPayload;
  };

  const checkOverPayments = async (ticket, payload) => {
    const paymentStatus = OB.App.State.Ticket.Utils.getPaymentStatus(
      ticket,
      payload
    );

    if (paymentStatus.overpayment) {
      const confirmation = await OB.App.View.DialogUIHandler.askConfirmation({
        title: 'OBPOS_OverpaymentWarningTitle',
        message: 'OBPOS_OverpaymentWarningBody',
        messageParams: [
          OB.I18N.formatCurrencyWithSymbol(
            paymentStatus.overpayment,
            payload.terminal.symbol,
            payload.terminal.currencySymbolAtTheRight
          )
        ]
      });
      if (!confirmation) {
        throw new OB.App.Class.ActionCanceled();
      }
    } else if (
      ticket.payment !== OB.DEC.abs(ticket.grossAmount) &&
      !OB.App.State.Ticket.Utils.isLayaway(ticket) &&
      !ticket.payOnCredit &&
      OB.DEC.abs(ticket.obposPrepaymentamt) ===
        OB.DEC.abs(ticket.grossAmount) &&
      !payload.terminal.calculatePrepayments
    ) {
      const confirmation = await OB.App.View.DialogUIHandler.askConfirmation({
        title: 'OBPOS_PaymentAmountDistinctThanReceiptAmountTitle',
        message: 'OBPOS_PaymentAmountDistinctThanReceiptAmountBody'
      });
      if (!confirmation) {
        throw new OB.App.Class.ActionCanceled();
      }
    }

    return payload;
  };

  const checkTicketUpdated = async (ticket, payload) => {
    if (!ticket.isPaid && !ticket.isLayaway) {
      return payload;
    }

    const showTicketUpdatedError = async errorType => {
      if (
        errorType ||
        !payload.preferences.allowToSynchronizeLoadedReceiptsOffline
      ) {
        const getErrorConfirmation = () => {
          switch (errorType) {
            case 'P':
              return 'OBPOS_SyncPending';
            case 'E':
              return 'OBPOS_SyncWithErrors';
            case 'O':
              return 'OBPOS_RemoveAndLoad';
            default:
              return 'OBPOS_NotPossibleToConfirmReceipt';
          }
        };
        throw new OB.App.Class.ActionCanceled({
          errorConfirmation: getErrorConfirmation(),
          messageParams: [ticket.documentNo]
        });
      }

      const confirmation = await OB.App.View.DialogUIHandler.askConfirmation({
        title: 'OBPOS_UpdatedReceipt',
        message: 'OBPOS_NotPossibleToConfirmReceiptWarn',
        messageParams: [ticket.documentNo]
      });
      if (!confirmation) {
        throw new OB.App.Class.ActionCanceled();
      }

      return payload;
    };

    if (!payload.terminal.connectedToERP || !navigator.onLine) {
      return showTicketUpdatedError();
    }

    try {
      const data = await OB.App.Request.mobileServiceRequest(
        'org.openbravo.retail.posterminal.process.CheckUpdated',
        {
          order: {
            id: ticket.id,
            loaded: ticket.loaded,
            lines: ticket.lines.map(line => {
              return {
                id: line.id,
                loaded: line.loaded
              };
            })
          }
        }
      );
      if (data.response.data.type) {
        return showTicketUpdatedError(data.response.data.type);
      }
    } catch (error) {
      return showTicketUpdatedError();
    }

    return payload;
  };
})();
