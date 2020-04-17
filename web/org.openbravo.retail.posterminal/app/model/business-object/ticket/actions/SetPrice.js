/*
 ************************************************************************************
 * Copyright (C) 2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/* global lodash */

(function SetQuantityDefinition() {
  OB.App.StateAPI.Ticket.registerAction('setPrice', (state, payload) => {
    const ticket = { ...state };
    const { price, lineIds } = payload;

    ticket.lines = ticket.lines.map(l => {
      if (!lineIds.includes(l.id)) {
        return l;
      }
      return { ...l, price, priceList: l.product.listPrice };
    });

    return ticket;
  });

  function checkParameters(ticket, lineIds, price) {
    if (lineIds === undefined) {
      throw new Error('lineIds parameter is mandatory');
    }

    if (!(lineIds instanceof Array)) {
      throw new Error('lineIds parameter must be an array of Ids');
    }

    const ticketLineIds = ticket.lines.map(l => l.id);
    const notPresentLineIds = lineIds.filter(
      lid => !ticketLineIds.includes(lid)
    );
    if (notPresentLineIds.length !== 0) {
      throw new Error(`not found lineId3s: [${notPresentLineIds.join(',')}]`);
    }

    if (price === undefined) {
      throw new Error('price parameter is mandatory');
    }

    if (!lodash.isNumber(price)) {
      throw new Error(`price is not numeric: ${price}`);
    }

    if (price < 0) {
      throw new Error('Cannot set price less than 0');
    }
  }

  OB.App.StateAPI.Ticket.setPrice.addActionPreparation(
    async (state, payload) => {
      const ticket = state.Ticket;
      const { price, lineIds } = payload;

      checkParameters(ticket, lineIds, price);

      return payload;
    }
  );
})();
