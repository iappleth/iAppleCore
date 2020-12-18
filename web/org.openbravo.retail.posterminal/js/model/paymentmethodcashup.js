/*
 ************************************************************************************
 * Copyright (C) 2013-2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

(function() {
  var PaymentMethodCashUp = OB.Data.ExtensibleModel.extend({
    modelName: 'PaymentMethodCashUp',
    tableName: 'paymentmethodcashup',
    entityName: 'PaymentMethodCashUp',
    legacyModel: true,
    local: true
  });

  PaymentMethodCashUp.addProperties([
    {
      name: 'id',
      column: 'paymentmethodcashup_id',
      primaryKey: true,
      type: 'TEXT'
    },
    {
      name: 'paymentmethod_id',
      column: 'paymentmethod_id',
      type: 'TEXT'
    },
    {
      name: 'searchKey',
      column: 'searchKey',
      type: 'TEXT'
    },
    {
      name: 'name',
      column: 'name',
      type: 'TEXT'
    },
    {
      name: 'startingCash',
      column: 'startingCash',
      type: 'NUMERIC'
    },
    {
      name: 'totalSales',
      column: 'totalSales',
      type: 'NUMERIC'
    },
    {
      name: 'totalReturns',
      column: 'totalReturns',
      type: 'NUMERIC'
    },
    {
      name: 'totalDeposits',
      column: 'totalDeposits',
      type: 'NUMERIC'
    },
    {
      name: 'totalDrops',
      column: 'totalDrops',
      type: 'NUMERIC'
    },
    {
      name: 'rate',
      column: 'rate',
      type: 'NUMERIC'
    },
    {
      name: 'cashup_id',
      column: 'cashup_id',
      type: 'TEXT'
    },
    {
      name: 'isocode',
      column: 'isocode',
      type: 'TEXT'
    },
    {
      name: 'lineNo',
      column: 'lineNo',
      type: 'NUMERIC'
    },
    {
      name: 'usedInCurrentTrx',
      column: 'usedInCurrentTrx',
      type: 'TEXT'
    },
    {
      name: 'newPaymentMethod',
      column: 'newPaymentMethod',
      type: 'TEXT'
    }
  ]);

  OB.Data.Registry.registerModel(PaymentMethodCashUp);
})();
