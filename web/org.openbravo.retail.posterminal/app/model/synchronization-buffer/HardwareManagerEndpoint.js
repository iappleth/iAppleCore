/*
 ************************************************************************************
 * Copyright (C) 2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/**
 * @fileoverview Defines the HardwareMaangerEndpoint class.
 * @author Carlos Aristu <carlos.aristu@openbravo.com>
 */

(function HardwareManagerEndpointDefinition() {
  // Turns an state ticket into a backbone order
  const toOrder = ticket => {
    if (!ticket.id) {
      // force to have a ticket id: if no id is provided an empty backbone order is created
      // eslint-disable-next-line no-param-reassign
      ticket.id = OB.App.UUID.generate();
    }
    return OB.App.StateBackwardCompatibility.getInstance(
      'Ticket'
    ).toBackboneObject(ticket);
  };

  // Turns an state ticket line into a backbone order line
  const toOrderLine = line => {
    return new OB.Model.OrderLine(line);
  };

  /**
   * A synchronization endpoint in charge of the messages for communicating with the Hardware Manager.
   */
  class HardwareManagerEndpoint extends OB.App.Class.SynchronizationEndpoint {
    constructor(name) {
      super(name || 'HardwareManager');
      this.messageTypes.push('displayTotal', 'printTicket', 'printTicketLine');
    }

    // Sets the main printer
    setPrinter(printer) {
      this.printer = printer;
    }

    // Sets the lines printer
    setLinePrinter(linePrinter) {
      this.linePrinter = linePrinter;
    }

    async synchronizeMessage(message) {
      switch (message.type) {
        case 'displayTotal':
          this.displayTotal(message.messageObj);
          break;
        case 'printTicket':
          this.printTicket(message.messageObj);
          break;
        case 'printTicketLine':
          this.printTicketLine(message.messageObj);
          break;
        default:
          throw new Error(
            `Unkwnown Hardware Manager operation: ${message.type}`
          );
      }
    }

    displayTotal(messageData) {
      if (!this.printer) {
        throw new Error(`The endpoint has no printer assigned`);
      }
      try {
        const order = toOrder(messageData.data.ticket);
        this.printer.doDisplayTotal(order);
      } catch (error) {
        OB.error(`Error displaying total: ${error}`);
      }
    }

    printTicket(messageData) {
      if (!this.printer) {
        throw new Error(`The endpoint has no printer assigned`);
      }
      try {
        const order = toOrder(messageData.data.ticket);
        this.printer.doPrint(order, {
          ...messageData.data.printSettings
        });
      } catch (error) {
        OB.error(`Error printing ticket: ${error}`);
      }
    }

    printTicketLine(messageData) {
      if (!this.linePrinter) {
        throw new Error(`The endpoint has no line printer assigned`);
      }
      try {
        const line = toOrderLine(messageData.data.line);
        this.linePrinter.doPrint(line);
      } catch (error) {
        OB.error(`Error printing ticket line: ${error}`);
      }
    }
  }

  OB.App.Class.HardwareManagerEndpoint = HardwareManagerEndpoint;
})();
