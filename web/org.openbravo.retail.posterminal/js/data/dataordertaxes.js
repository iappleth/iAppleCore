/*
 ************************************************************************************
 * Copyright (C) 2012-2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

(function() {
  function calculateTaxes(receipt) {
    if (!receipt.get('isEditable') && !receipt.get('forceCalculateTaxes')) {
      return regenerateTaxes(receipt);
    }

    try {
      initializeTaxes(receipt);
      const taxes = OB.Taxes.Pos.calculateTaxes(receipt);
      setTaxes(receipt, taxes);
    } catch (error) {
      showLineTaxError(receipt, error);
    }
  }

  function regenerateTaxes(receipt) {
    const value = _.map(receipt.get('lines').models, function(line) {
      const taxes = Array.isArray(line.get('taxes'))
        ? line.get('taxes').reduce((obj, item) => {
            const newObj = { ...obj };
            newObj[item.taxId] = {
              amount: item.taxAmount,
              name: item.identifier,
              net: item.taxableAmount,
              rate: item.taxRate
            };
            return newObj;
          }, {})
        : line.get('taxes');

      const taxAmount = getTaxAmount(taxes);
      setLineTaxes(receipt, line, {
        // FIXME: Do not save grossUnitAmount/grossUnitPrice as zero in price excluding taxes
        grossUnitAmount: receipt.get('priceIncludesTax')
          ? OB.DEC.mul(line.get('grossUnitPrice'), line.get('qty'))
          : OB.DEC.add(
              OB.DEC.mul(line.get('unitPrice'), line.get('qty')),
              taxAmount
            ),
        netUnitAmount: OB.DEC.mul(line.get('unitPrice'), line.get('qty')),
        grossUnitPrice: receipt.get('priceIncludesTax')
          ? line.get('grossUnitPrice')
          : OB.DEC.div(
              OB.DEC.add(
                OB.DEC.mul(line.get('unitPrice'), line.get('qty')),
                taxAmount
              ),
              line.get('qty')
            ),
        netUnitPrice: line.get('unitPrice'),
        taxes,
        taxAmount
      });
    });

    if (value.length !== receipt.get('lines').length) {
      OB.debug('The number of original lines of the receipt has change!');
      return;
    }

    const taxes = {};
    _.forEach(receipt.get('receiptTaxes'), function(receiptTax) {
      var taxObj = {
        amount: receiptTax.amount,
        cascade: receiptTax.cascade,
        docTaxAmount: receiptTax.docTaxAmount,
        lineNo: receiptTax.lineNo,
        name: receiptTax.name,
        net: receiptTax.net,
        rate: receiptTax.rate,
        taxBase: receiptTax.taxBase
      };
      taxes[receiptTax.taxid] = taxObj;
    });

    receipt.set(
      {
        gross: receipt.get('lines').reduce(function(memo, line) {
          return OB.DEC.add(memo, line.get('grossUnitAmount'));
        }, 0),
        net: receipt.get('lines').reduce(function(memo, line) {
          return OB.DEC.add(memo, line.get('netUnitAmount'));
        }, 0),
        taxes: taxes
      },
      {
        silent: true
      }
    );
  }

  function initializeTaxes(receipt) {
    receipt.set(
      {
        taxes: []
      },
      {
        silent: true
      }
    );
  }

  function setTaxes(receipt, taxes) {
    receipt.set(
      {
        gross: taxes.grossAmount,
        net: taxes.netAmount,
        taxes: taxes.taxes
      },
      {
        silent: true
      }
    );
    receipt.get('lines').forEach(line => {
      const lineTax = taxes.lines.find(lineTax => lineTax.id === line.id);
      setLineTaxes(receipt, line, lineTax);
    });
  }

  function setLineTaxes(receipt, line, values) {
    const taxAmount = getTaxAmount(values.taxes);
    line.set(
      {
        gross: receipt.get('priceIncludesTax')
          ? line.get('gross')
          : OB.DEC.add(line.get('net'), taxAmount),
        net: receipt.get('priceIncludesTax')
          ? OB.DEC.sub(line.get('gross'), taxAmount)
          : line.get('net'),
        grossUnitAmount: values.grossUnitAmount,
        netUnitAmount: values.netUnitAmount,
        grossUnitPrice: values.grossUnitPrice,
        unitPrice: values.netUnitPrice,
        lineRate: values.taxRate ? values.taxRate : line.get('lineRate'),
        tax: values.tax ? values.tax : line.get('tax'),
        taxes: values.taxes
      },
      {
        silent: true
      }
    );
  }

  function getTaxAmount(taxes) {
    return Object.keys(taxes)
      .map(key => taxes[key].amount)
      .reduce((sum, amount) => sum + amount);
  }

  function showLineTaxError(receipt, error) {
    // We use Promise.reject to show async message in case of error
    new Promise((resolve, reject) => {
      const lineIdWithError = error.message.substring(
        error.message.length - 32
      );
      const line =
        receipt.get('lines').find(line => line.id === lineIdWithError) ||
        receipt.get('lines').models[receipt.get('lines').length - 1];
      return reject(line);
    }).catch(function(line) {
      const taxCategoryName = OB.Taxes.Pos.taxCategory
        .concat(OB.Taxes.Pos.taxCategoryBOM)
        .find(
          taxCategory =>
            taxCategory.id === line.get('product').get('taxCategory')
        ).name;

      const errorTitle = OB.I18N.getLabel('OBPOS_TaxNotFound_Header');
      const errorMessage = OB.I18N.getLabel(
        'OBPOS_TaxWithCategoryNotFound_Message',
        [
          receipt.get('bp').get('name') ||
            OB.I18N.getLabel('OBPOS_LblEmptyAddress'),
          receipt.get('bp').get('shipLocName') ||
            OB.I18N.getLabel('OBPOS_LblEmptyAddress'),
          taxCategoryName
        ]
      );
      OB.error(errorTitle + ':' + errorMessage);

      line.set('hasTaxError', true, {
        silent: true
      });
      receipt.deleteLinesFromOrder([line], function() {
        OB.MobileApp.view.$.containerWindow
          .getRoot()
          .bubble('onErrorCalcLineTax', {
            line: line,
            reason: errorMessage
          });
        OB.MobileApp.view.$.containerWindow.getRoot().doShowPopup({
          popup: 'OB_UI_MessageDialog',
          args: {
            header: errorTitle,
            message: errorMessage
          }
        });
      });
    });
  }

  OB.DATA = window.OB.DATA || {};
  OB.DATA.OrderTaxes = function(modelOfAnOrder) {
    modelOfAnOrder.calculateTaxes = function(callback) {
      calculateTaxes(this);
      this.trigger('paintTaxes');
      callback();
    };
  };
})();
