/*
 ************************************************************************************
 * Copyright (C) 2021 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/**
 * @fileoverview defines the action to reverse a payment to the ticket
 */

(function ReversePaymentDefinition() {
  OB.App.StateAPI.Ticket.registerAction('reversePayment', (ticket, payload) => {
    let newTicket = { ...ticket };

    newTicket = OB.App.State.Ticket.Utils.addPaymentRounding(
      newTicket,
      payload
    );
    // Set values defined in actionPreparations
    if (payload.extraInfo) {
      newTicket = { ...newTicket, ...payload.extraInfo.ticket };
    }

    newTicket = OB.App.State.Ticket.Utils.addPayment(newTicket, payload);
    return newTicket;
  });

  OB.App.StateAPI.Ticket.reversePayment.addActionPreparation(
    async (ticket, payload) => {
      let newPayload = { ...payload };

      newPayload = await OB.App.State.Ticket.Utils.notReversablePaymentValidation(
        newPayload
      );
      newPayload = await OB.App.State.Ticket.Utils.moreThanOnePaymentMethodValidation(
        newPayload
      );
      newPayload = await OB.App.State.Ticket.Utils.createReversalPaymentAndRounding(
        ticket,
        newPayload
      );
      return newPayload;
    },
    async (ticket, payload) => payload,
    10
  );

  OB.App.StateAPI.Ticket.reversePayment.addActionPreparation(
    async (ticket, payload) => {
      let newPayload = { ...payload };

      newPayload = await OB.App.State.Ticket.Utils.fillPayment(
        ticket,
        newPayload
      );
      return newPayload;
    },
    async (ticket, payload) => payload,
    0
  );

  OB.App.StateAPI.Ticket.reversePayment.addActionPreparation(
    async (ticket, payload) => {
      let newPayload = { ...payload };

      newPayload = await OB.App.State.Ticket.Utils.checkAlreadyPaid(
        ticket,
        newPayload
      );
      newPayload = await OB.App.State.Ticket.Utils.checkNotNumberAmount(
        ticket,
        newPayload
      );
      newPayload = await OB.App.State.Ticket.Utils.checkStopAddingPayments(
        ticket,
        newPayload
      );
      newPayload = await OB.App.State.Ticket.Utils.checkExactPaid(
        ticket,
        newPayload
      );
      newPayload = await OB.App.State.Ticket.Utils.checkVoidLayaway(
        ticket,
        newPayload
      );
      newPayload = await OB.App.State.Ticket.Utils.managePrePaymentChange(
        ticket,
        newPayload
      );

      return newPayload;
    }
  );
})();
