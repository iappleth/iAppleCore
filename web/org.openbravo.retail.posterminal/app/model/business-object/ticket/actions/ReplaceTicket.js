/*
 ************************************************************************************
 * Copyright (C) 2020-2021 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/**
 * @fileoverview defines the Ticket global action that replaces a ticket and moves it to a message in the state
 */

(() => {
  OB.App.StateAPI.Global.registerAction(
    'replaceTicket',
    (globalState, payload) => {
      const newGlobalState = { ...globalState };
      let newTicketList = [...newGlobalState.TicketList];
      let newTicket = { ...newGlobalState.Ticket };
      let newDocumentSequence = { ...newGlobalState.DocumentSequence };
      let newCashup = { ...newGlobalState.Cashup };
      let newMessages = [...newGlobalState.Messages];
      let currentTicket = {};

      // Set complete ticket properties
      newTicket.completeTicket = true;
      newTicket = OB.App.State.Ticket.Utils.processTicket(newTicket, payload);

      // FIXME: Move to calculateTotals?
      newTicket = OB.App.State.Ticket.Utils.updateTicketType(
        newTicket,
        payload
      );

      // Complete ticket payment
      newTicket = OB.App.State.Ticket.Utils.completePayment(newTicket, payload);

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
        } = OB.App.State.DocumentSequence.Utils.generateDocumentNumber(
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
          'OBPOS_Order',
          'org.openbravo.retail.posterminal.OrderLoader',
          [OB.App.State.Ticket.Utils.cleanTicket(newTicket)],
          {
            ...payload.extraProperties,
            name: 'OBPOS_Order'
          }
        )
      ];

      // Ticket print message
      if (
        !newTicket.calculatedInvoice ||
        (newTicket.calculatedInvoice &&
          newTicket.calculatedInvoice.fullInvoice &&
          payload.preferences &&
          payload.preferences.autoPrintReceipts)
      ) {
        newMessages = OB.App.State.Messages.Utils.createPrintTicketMessage(
          newTicket,
          {},
          payload.deliverAction,
          payload.deliverService,
          newMessages
        );
      }
      if (newTicket.calculatedInvoice) {
        newMessages = OB.App.State.Messages.Utils.createPrintTicketMessage(
          newTicket.calculatedInvoice,
          {},
          payload.deliverAction,
          payload.deliverService,
          newMessages
        );
      }

      // Welcome message
      newMessages = [
        ...newMessages,
        OB.App.State.Messages.Utils.createPrintWelcomeMessage()
      ];

      // Add Current Ticket to Last Ticket
      currentTicket = { ...newTicket };

      // TicketList update
      ({
        ticketList: newTicketList,
        ticket: newTicket
      } = OB.App.State.TicketList.Utils.removeTicket(
        newTicketList,
        newTicket,
        payload
      ));

      newGlobalState.TicketList = newTicketList;
      newGlobalState.Ticket = newTicket;
      newGlobalState.LastTicket = currentTicket;
      newGlobalState.DocumentSequence = newDocumentSequence;
      newGlobalState.Cashup = newCashup;
      newGlobalState.Messages = newMessages;

      return newGlobalState;
    }
  );

  OB.App.StateAPI.Global.replaceTicket.addActionPreparation(
    async (globalState, payload) => {
      let newPayload = { ...payload };

      newPayload = await OB.App.State.Ticket.Utils.checkAnonymousReturn(
        globalState.Ticket,
        newPayload
      );
      newPayload = await OB.App.State.Ticket.Utils.checkNegativePayments(
        globalState.Ticket,
        newPayload
      );
      newPayload = await OB.App.State.Ticket.Utils.checkExtraPayments(
        globalState.Ticket,
        newPayload
      );
      newPayload = await OB.App.State.Ticket.Utils.checkPrePayments(
        globalState.Ticket,
        newPayload
      );
      newPayload = await OB.App.State.Ticket.Utils.checkOverPayments(
        globalState.Ticket,
        newPayload
      );
      newPayload = await OB.App.State.Ticket.Utils.checkTicketCanceled(
        globalState.Ticket.canceledorder,
        { ...newPayload, actionType: 'R' }
      );
      newPayload = await OB.App.State.Ticket.Utils.checkTicketUpdated(
        globalState.Ticket.canceledorder,
        newPayload
      );

      return newPayload;
    }
  );
})();
