/*
 ************************************************************************************
 * Copyright (C) 2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/**
 * @fileoverview defines the Document Sequence utility functions
 */

(() => {
  OB.App.StateAPI.DocumentSequence.registerUtilityFunctions({
    /**
     * Increases in one the sequence defined with the given sequence name.
     *
     * @param {object} documentSequence - The document sequence whose sequence will be increased
     * @param {object} settings - The calculation settings, which include:
     *             * sequenceName - Name of the sequence to increase
     *
     * @returns {number} The new document sequence.
     */
    increaseSequence(documentSequence, settings) {
      const newDocumentSequence = { ...documentSequence };

      if (newDocumentSequence[settings.sequenceName]) {
        const newStateSequence = {
          ...newDocumentSequence[settings.sequenceName]
        };
        newStateSequence.sequenceNumber =
          newDocumentSequence[settings.sequenceName].sequenceNumber + 1;
        newDocumentSequence[settings.sequenceName] = newStateSequence;
      }

      return newDocumentSequence;
    },

    /**
     * Generates a document number based on given prefix and sequence number.
     *
     * @param {object} settings - The calculation settings, which include:
     *             * sequencePrefix - Prefix of the document number
     *             * documentNumberSeparator - Character to separate prefix and suffix in document number
     *             * sequenceNumber - Suffix of the document number
     *             * documentNumberPadding - Padding to use in the the suffix of document number
     *
     * @returns {number} The document number.
     */
    calculateDocumentNumber(settings) {
      return (
        settings.sequencePrefix +
        settings.documentNumberSeparator +
        settings.sequenceNumber
          .toString()
          .padStart(settings.documentNumberPadding, '0')
      );
    },

    /**
     * Calculates the sequence name to be used by the order based on ticket properties.
     *
     * @param {object} ticket - The ticket whose order sequence name will be calculated
     * @param {object} settings - The calculation settings, which include:
     *             * returnSequencePrefix - Return document sequence prefix
     *             * quotationSequencePrefix - Quotation document sequence prefix
     *             * salesWithOneLineNegativeAsReturns - SalesWithOneLineNegativeAsReturns preference value
     *
     * @returns {string} The order sequence name.
     */
    getOrderSequenceName(ticket, settings) {
      const isReturnTicket = OB.App.State.Ticket.Utils.isReturnTicket(
        ticket,
        settings
      );
      if (ticket.isQuotation && settings.quotationSequencePrefix) {
        return 'quotationslastassignednum';
      }
      if (isReturnTicket && settings.returnSequencePrefix) {
        return 'returnslastassignednum';
      }
      return 'lastassignednum';
    },

    /**
     * Calculates the sequence name to be used by the invoice based on ticket properties.
     *
     * @param {object} ticket - The ticket whose invoice sequence name will be calculated
     * @param {object} settings - The calculation settings, which include:
     *             * fullReturnInvoiceSequencePrefix - Full return invoice document sequence prefix
     *             * simplifiedReturnInvoiceSequencePrefix - Simplified return invoice document sequence prefix
     *             * salesWithOneLineNegativeAsReturns - SalesWithOneLineNegativeAsReturns preference value
     *
     * @returns {string} The invoice sequence name.
     */
    getInvoiceSequenceName(ticket, settings) {
      const isReturnTicket = OB.App.State.Ticket.Utils.isReturnTicket(
        ticket,
        settings
      );
      if (
        !ticket.fullInvoice &&
        isReturnTicket &&
        settings.simplifiedReturnInvoiceSequencePrefix
      ) {
        return 'simplifiedreturninvoiceslastassignednum';
      }
      if (
        ticket.fullInvoice &&
        isReturnTicket &&
        settings.fullReturnInvoiceSequencePrefix
      ) {
        return 'fullreturninvoiceslastassignednum';
      }
      if (!ticket.fullInvoice) {
        return 'simplifiedinvoiceslastassignednum';
      }
      return 'fullinvoiceslastassignednum';
    },

    /**
     * Generates a document number for given ticket increasing the corresponding sequence.
     *
     * @param {object} ticket - The ticket whose document sequence will be generated
     * @param {object} documentSequence - The ticket whose type will be updated
     * @param {object} settings - The calculation settings, which include:
     *             * returnSequencePrefix - Return document sequence prefix
     *             * quotationSequencePrefix - Quotation document sequence prefix
     *             * fullReturnInvoiceSequencePrefix - Full return invoice document sequence prefix
     *             * simplifiedReturnInvoiceSequencePrefix - Simplified return invoice document sequence prefix
     *             * documentNumberSeparator - Character to separate prefix and suffix in document number
     *             * documentNumberPadding - Padding to use in the the suffix of document number
     *             * salesWithOneLineNegativeAsReturns - SalesWithOneLineNegativeAsReturns preference value
     *
     * @returns {object} The new state of Ticket and DocumentSequence after document number generation.
     */
    generateTicketDocumentSequence(ticket, documentSequence, settings) {
      if (ticket.documentNo) {
        return { ticket, documentSequence };
      }

      const sequenceName = ticket.isInvoice
        ? OB.App.State.DocumentSequence.Utils.getInvoiceSequenceName(
            ticket,
            settings
          )
        : OB.App.State.DocumentSequence.Utils.getOrderSequenceName(
            ticket,
            settings
          );
      const newDocumentSequence = OB.App.State.DocumentSequence.Utils.increaseSequence(
        documentSequence,
        { sequenceName }
      );
      const { sequencePrefix, sequenceNumber } = newDocumentSequence[
        sequenceName
      ];
      const newTicket = { ...ticket };
      newTicket.obposSequencename = sequenceName;
      newTicket.obposSequencenumber = sequenceNumber;
      newTicket.documentNo = OB.App.State.DocumentSequence.Utils.calculateDocumentNumber(
        {
          sequencePrefix,
          documentNumberSeparator: settings.documentNumberSeparator,
          documentNumberPadding: settings.documentNumberPadding,
          sequenceNumber
        }
      );

      return { ticket: newTicket, documentSequence: newDocumentSequence };
    }
  });
})();
