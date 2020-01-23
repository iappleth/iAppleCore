/*
 ************************************************************************************
 * Copyright (C) 2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

(() => {
  class PriceExcludingTax extends OB.Taxes.Tax {
    /* @Override */
    getLineTaxes(line, rules) {
      OB.debug(
        `PriceExcludingTax: calculating line taxes for ticket with id: ${this.ticket.id} and line with id: ${line.id}`
      );

      const parentTaxId = OB.Taxes.Tax.getParentTaxId(rules[0]);
      const lineNetAmount = line.amount;
      const lineNetPrice = OB.Taxes.Tax.calculatePriceFromAmount(
        lineNetAmount,
        line.quantity
      );
      const lineGrossAmount = OB.Taxes.PriceExcludingTax.calculateGrossAmountFromNetAmount(
        lineNetAmount,
        rules
      );
      const lineGrossPrice = OB.Taxes.Tax.calculatePriceFromAmount(
        lineGrossAmount,
        line.quantity
      );
      const lineTaxes = OB.Taxes.Tax.calculateTaxes(
        lineGrossAmount,
        lineNetAmount,
        rules
      );

      return {
        id: line.id,
        grossAmount: lineGrossAmount,
        netAmount: lineNetAmount,
        grossPrice: lineGrossPrice,
        netPrice: lineNetPrice,
        tax: parentTaxId,
        taxes: lineTaxes
      };
    }

    /* @Override */
    getHeaderTaxes(lines) {
      OB.debug(
        `PriceExcludingTax: calculating header taxes for ticket with id: ${this.ticket.id}`
      );

      const linesByParentTaxId = OB.App.ArrayUtils.groupBy(lines, 'tax');
      const groupTaxes = Object.values(linesByParentTaxId).map(groupLines => {
        const rules = groupLines[0].taxes.map(lineTax => lineTax.tax);
        const groupNetAmount = groupLines.reduce(
          (total, line) => OB.DEC.add(total, line.netAmount),
          OB.DEC.Zero
        );
        const groupGrossAmount = OB.Taxes.PriceExcludingTax.calculateGrossAmountFromNetAmount(
          groupNetAmount,
          rules
        );

        OB.Taxes.PriceExcludingTax.adjustLineGrossAmount(
          groupGrossAmount,
          groupLines
        );

        return OB.Taxes.Tax.calculateTaxes(
          groupGrossAmount,
          groupNetAmount,
          rules
        );
      });

      const headerTaxes = groupTaxes.flat();
      const headerNetAmount = lines.reduce(
        (total, line) => OB.DEC.add(total, line.netAmount),
        OB.DEC.Zero
      );
      const headerGrossAmount = headerTaxes.reduce(
        (total, headerTax) => OB.DEC.add(total, headerTax.amount),
        headerNetAmount
      );

      return {
        id: this.ticket.id,
        grossAmount: headerGrossAmount,
        netAmount: headerNetAmount,
        taxes: headerTaxes
      };
    }

    /**
     * If the header gross amount is different than the sum of line gross amounts, we need to adjust the highest line gross amount
     */
    static adjustLineGrossAmount(grossAmount, lines) {
      const adjustment = OB.DEC.sub(
        grossAmount,
        lines.reduce(
          (line1, line2) => OB.DEC.add(line1, line2.grossAmount),
          OB.DEC.Zero
        )
      );

      if (OB.DEC.compare(adjustment) !== 0) {
        const line = lines.reduce((line1, line2) => {
          return line1.grossAmount > line2.grossAmount ? line1 : line2;
        });
        line.grossAmount = OB.DEC.add(line.grossAmount, adjustment);
      }
    }

    /**
     * grossAmount = netAmount + taxAmount
     */
    static calculateGrossAmountFromNetAmount(netAmount, rules) {
      return OB.DEC.add(
        netAmount,
        OB.Taxes.Tax.calculateTotalTaxAmount(netAmount, rules)
      );
    }
  }

  OB.Taxes.PriceExcludingTax = PriceExcludingTax;
})();
