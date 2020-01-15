/*
 ************************************************************************************
 * Copyright (C) 2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

(function() {
  class PriceIncludingTax extends OB.Taxes.Tax {
    constructor(ticket, rules) {
      super(ticket, rules);
    }

    /* @Override */
    getLineTaxes(line, rules) {
      const tax = rules[0];
      const taxRate = this.getTaxRate(tax.rate);
      const lineGrossAmount = line.amount;
      const lineNetAmount = this.calculateNetAmount(lineGrossAmount, taxRate);
      let lineTaxAmount = this.calculateTaxAmount(lineNetAmount, taxRate);

      // If line gross amount <> line net amount + line tax amount, we need to adjust the highest line tax amount
      lineTaxAmount = OB.DEC.add(
        lineTaxAmount,
        OB.DEC.sub(lineGrossAmount, OB.DEC.add(lineNetAmount, lineTaxAmount))
      );

      return {
        id: line.id,
        gross: line.amount,
        net: lineNetAmount,
        tax: tax.id,
        taxes: [
          {
            base: lineNetAmount,
            amount: lineTaxAmount,
            tax: tax
          }
        ]
      };
    }

    /* @Override */
    getHeaderTaxes(lineTaxes) {
      const linesByTax = OB.App.ArrayUtils.groupBy(lineTaxes, 'tax');
      const headerTaxes = Object.keys(linesByTax).map(tax => {
        const lines = linesByTax[tax];
        const taxRate = this.getTaxRate(lines[0].taxes[0].tax.rate);

        const grossAmount = lines.reduce(
          (line1, line2) => line1 + line2.gross,
          0
        );
        const netAmount = this.calculateNetAmount(grossAmount, taxRate);
        let taxAmount = this.calculateTaxAmount(netAmount, taxRate);

        // If header gross amount <> header net amount + header tax amount, we need to adjust the highest header tax amount
        taxAmount = OB.DEC.add(
          taxAmount,
          OB.DEC.sub(grossAmount, OB.DEC.add(netAmount, taxAmount))
        );

        // If the header net amount is different than the sum of line net amounts, we need to adjust the highest line net amount
        const adjustment = OB.DEC.sub(
          netAmount,
          lines.reduce((line1, line2) => line1 + line2.net, 0)
        );
        if (OB.DEC.compare(adjustment) !== 0) {
          const line = lines.sort((line1, line2) => line2.net - line1.net)[0];
          line.net = OB.DEC.add(line.net, adjustment);
        }

        return {
          base: netAmount,
          amount: taxAmount,
          tax: lines[0].taxes[0].tax
        };
      });

      const grossAmount = lineTaxes.reduce(
        (line1, line2) => line1 + line2.gross,
        0
      );
      const netAmount = lineTaxes.reduce(
        (line1, line2) => line1 + line2.net,
        0
      );

      return {
        gross: grossAmount,
        net: netAmount,
        taxes: headerTaxes
      };
    }

    // taxRate = rate / 100
    getTaxRate(rate) {
      return OB.DEC.toNumber(
        new BigDecimal(String(rate)).divide(
          new BigDecimal('100'),
          20,
          BigDecimal.prototype.ROUND_HALF_UP
        )
      );
    }

    // lineNetAmount = (lineGrossAmount * lineGrossAmount) / (lineGrossAmount + (lineGrossAmount * taxRate))
    calculateNetAmount(grossAmount, taxRate) {
      const grossAmountBigDecimal = new BigDecimal(String(grossAmount));
      const taxRateBigDecimal = new BigDecimal(String(taxRate));
      return OB.DEC.toNumber(
        grossAmountBigDecimal
          .multiply(grossAmountBigDecimal)
          .divide(
            grossAmountBigDecimal.add(
              grossAmountBigDecimal.multiply(taxRateBigDecimal)
            ),
            20,
            BigDecimal.prototype.ROUND_HALF_UP
          )
      );
    }

    // lineTaxAmount = lineNetAmount * taxRate
    calculateTaxAmount(netAmount, taxRate) {
      return OB.DEC.mul(netAmount, taxRate);
    }
  }

  OB.Taxes.PriceIncludingTax = PriceIncludingTax;
})();
