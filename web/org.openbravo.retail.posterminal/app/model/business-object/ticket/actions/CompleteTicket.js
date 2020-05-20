/*
 ************************************************************************************
 * Copyright (C) 2019-2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/**
 * @fileoverview defines the Ticket global action that completes a ticket and moves it to a message in the state
 */

(() => {
  OB.App.StateAPI.Global.registerAction(
    'completeTicket',
    (globalState, payload) => {
      const newGlobalState = { ...globalState };
      let newTicket = { ...newGlobalState.Ticket };
      let newDocumentSequence = { ...newGlobalState.DocumentSequence };

      const {
        terminal,
        documentNumberSeperator,
        salesWithOneLineNegativeAsReturns,
        discountRules,
        bpSets,
        taxRules
      } = payload;

      newTicket.created = new Date().getTime();
      newTicket.completeTicket = true;
      newTicket = OB.App.State.Ticket.Utils.updateTicketType(newTicket, {
        terminalOrganization: terminal.organization,
        documentTypeForSales: terminal.terminalType.documentType,
        documentTypeForReturns: terminal.terminalType.documentTypeForReturns
      });
      // FIXME: set cashup info once Cashup is migrated to state
      // ticket.obposAppCashup = terminal.cashUpId;

      // Document number generation
      ({
        ticket: newTicket,
        documentSequence: newDocumentSequence
      } = OB.App.State.DocumentSequence.Utils.generateTicketDocumentSequence(
        newTicket,
        newDocumentSequence,
        terminal.returnDocNoPrefix,
        terminal.quotationDocNoPrefix,
        terminal.fullReturnInvoiceDocNoPrefix,
        terminal.simplifiedReturnInvoiceDocNoPrefix,
        documentNumberSeperator,
        terminal.documentnoPadding,
        salesWithOneLineNegativeAsReturns
      ));

      // Shipment generation
      newTicket = OB.App.State.Ticket.Utils.generateShipment(newTicket, {
        terminalOrganization: terminal.organization
      });

      // Invoice generation
      newTicket = OB.App.State.Ticket.Utils.generateInvoice(newTicket, {
        discountRules,
        bpSets,
        taxRules
      });
      if (newTicket.calculatedInvoice) {
        ({
          ticket: newTicket.calculatedInvoice,
          documentSequence: newDocumentSequence
        } = OB.App.State.DocumentSequence.Utils.generateTicketDocumentSequence(
          newTicket.calculatedInvoice,
          newDocumentSequence,
          terminal.returnDocNoPrefix,
          terminal.quotationDocNoPrefix,
          terminal.fullReturnInvoiceDocNoPrefix,
          terminal.simplifiedReturnInvoiceDocNoPrefix,
          documentNumberSeperator,
          terminal.documentnoPadding,
          salesWithOneLineNegativeAsReturns
        ));
      }

      // FIXME: Remove once properties are mapped
      newTicket.bp = newTicket.businessPartner;
      newTicket.gross = newTicket.grossAmount;
      newTicket.net = newTicket.netAmount;
      newTicket.lines = newTicket.lines.map(line => {
        return {
          ...line,
          gross: line.gross || line.grossAmount,
          net: line.net || line.netAmount,
          taxLines: line.taxLines || line.taxes
        };
      });

      const newMessage = OB.App.State.Messages.Utils.createNewMessage(
        'Order',
        'org.openbravo.retail.posterminal.OrderLoader',
        newTicket
      );

      newGlobalState.DocumentSequence = newDocumentSequence;
      newGlobalState.Messages = [...newGlobalState.Messages, newMessage];

      return newGlobalState;
    }
  );
})();
