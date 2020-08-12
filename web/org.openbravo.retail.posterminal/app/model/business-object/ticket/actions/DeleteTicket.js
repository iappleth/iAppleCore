/*
 ************************************************************************************
 * Copyright (C) 2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/**
 * @fileoverview defines the Ticket global action that deletes a ticket and moves it to a message in the state
 */

/* eslint-disable no-use-before-define */

(() => {
  OB.App.StateAPI.Global.registerAction(
    'deleteTicket',
    (globalState, payload) => {
      const newGlobalState = { ...globalState };
      let newTicketList = [...newGlobalState.TicketList];
      let newTicket = { ...newGlobalState.Ticket };
      let newDocumentSequence = { ...newGlobalState.DocumentSequence };
      let newCashup = { ...newGlobalState.Cashup };
      let newMessages = [...newGlobalState.Messages];

      if (
        payload.preferences.removeTicket &&
        globalState.Ticket.isEditable &&
        (globalState.Ticket.lines.length || !globalState.Ticket.isNew)
      ) {
        // Set complete ticket properties
        newTicket.obposIsDeleted = true;
        newTicket.grossAmount = 0;
        newTicket.netAmount = 0;
        newTicket.taxes = Object.keys(newTicket.taxes).reduce((taxes, tax) => {
          const result = { ...taxes };
          result[tax] = { ...newTicket.taxes[tax], net: 0, amount: 0 };
          return result;
        }, {});
        newTicket.lines = newTicket.lines.map(line => {
          return {
            ...line,
            obposIsDeleted: true,
            obposQtyDeleted: line.qty,
            grossUnitAmount: 0,
            netUnitAmount: 0,
            qty: 0,
            taxes: Object.keys(line.taxes).reduce((taxes, tax) => {
              const result = { ...taxes };
              result[tax] = { ...newTicket.taxes[tax], net: 0, amount: 0 };
              return result;
            }, {})
          };
        });
        newTicket = OB.App.State.Ticket.Utils.completeTicket(
          newTicket,
          payload
        );

        // Document number generation
        ({
          ticket: newTicket,
          documentSequence: newDocumentSequence
        } = OB.App.State.DocumentSequence.Utils.generateDocumentNumber(
          newTicket,
          newDocumentSequence,
          payload
        ));

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
            [newTicket]
          )
        ];
      }

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
      newGlobalState.DocumentSequence = newDocumentSequence;
      newGlobalState.Cashup = newCashup;
      newGlobalState.Messages = newMessages;

      return newGlobalState;
    }
  );
})();
