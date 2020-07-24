/*
 ************************************************************************************
 * Copyright (C) 2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/**
 * @fileoverview Declares a global action that loads the Ticket passed as payload as the current active ticket
 * and enqueues the active ticket into the list
 */
(function LoadTicketActions() {
  function loadTicketAndEnqueueCurrentById(state, ticketToLoadId) {
    if (ticketToLoadId && state.Ticket.id === ticketToLoadId) {
      return state;
    }

    const newState = { ...state };
    newState.TicketList = { ...newState.TicketList };
    const newCurrentTicket = newState.TicketList.tickets.find(
      ticket => ticket.id === ticketToLoadId
    );
    if (!newCurrentTicket) {
      throw new OB.App.Class.ActionCanceled('Ticket to load not found', {
        ticketToLoadId
      });
    }

    newState.TicketList.tickets = newState.TicketList.tickets.filter(
      ticket => ticket.id !== ticketToLoadId
    );
    newState.TicketList.tickets.unshift({ ...newState.Ticket });
    if (!newState.TicketList.addedIds.includes(newState.Ticket.id)) {
      newState.TicketList.addedIds = [
        ...newState.TicketList.addedIds,
        newState.Ticket.id
      ];
    }
    newState.Ticket = newCurrentTicket;

    return newState;
  }

  OB.App.StateAPI.Global.registerAction('loadTicket', (state, payload) => {
    const ticketToLoadId = payload.ticket.id;
    return loadTicketAndEnqueueCurrentById(state, ticketToLoadId);
  });

  OB.App.StateAPI.Global.registerAction('loadTicketById', (state, payload) => {
    const ticketToLoadId = payload.id;
    return loadTicketAndEnqueueCurrentById(state, ticketToLoadId);
  });
})();
