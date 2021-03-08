/*
 ************************************************************************************
 * Copyright (C) 2021 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

(function ReturnTicketDefinition() {
  OB.App.StateAPI.Ticket.registerAction('returnTicket', (ticket, payload) => {
    let newTicket = { ...ticket };

    newTicket.lines = newTicket.lines.map(line => {
      const newLine = { ...line };
      newLine.qty = -newLine.qty;
      return newLine;
    });

    newTicket = OB.App.State.Ticket.Utils.updateTicketType(newTicket, {
      ...payload,
      isSale: false
    });

    return newTicket;
  });

  OB.App.StateAPI.Ticket.returnTicket.addActionPreparation(
    async (ticket, payload) => {
      checkRestrictions(ticket);
      return payload;
    }
  );

  function checkRestrictions(ticket) {
    OB.App.State.Ticket.Utils.checkIsEditable(ticket);
    checkReturnable(ticket);
  }

  function checkReturnable(ticket) {
    ticket.lines.forEach(line => {
      if (!line.product.returnable) {
        throw new OB.App.Class.ActionCanceled({
          title: 'OBPOS_UnreturnableProduct',
          errorConfirmation: 'OBPOS_UnreturnableProductMessage',
          // eslint-disable-next-line no-underscore-dangle
          messageParams: [line.product._identifier]
        });
      }
    });
  }
})();
