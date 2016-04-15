/*
 ************************************************************************************
 * Copyright (C) 2015-2016 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global Backbone, _ */

(function () {

  var ProductCharacteristicValue = OB.Data.ExtensibleModel.extend({
    modelName: 'ProductCharacteristicValue',
    tableName: 'm_product_ch_value',
    entityName: 'ProductCharacteristicValue',
    source: 'org.openbravo.retail.posterminal.master.ProductCharacteristicValue',
    includeTerminalDate: true,
    remote: 'OBPOS_remote.product',
    dataLimit: OB.Dal.DATALIMIT
  });

  ProductCharacteristicValue.addProperties([{
    name: 'id',
    column: 'm_product_ch_value_id',
    primaryKey: true,
    type: 'TEXT'
  }, {
    name: 'product',
    column: 'm_product_id',
    type: 'TEXT'
  }, {
    name: 'characteristic',
    column: 'm_characteristic_id',
    type: 'TEXT'
  }, {
    name: 'characteristicValue',
    column: 'm_ch_value_id',
    type: 'TEXT'
  }, {
    name: '_identifier',
    column: '_identifier',
    type: 'TEXT'
  }, {
    name: 'active',
    column: 'active',
    type: 'TEXT'
  }, {
    name: 'obposFilteronwebpos',
    column: 'obposFilteronwebpos',
    type: 'TEXT'
  }]);

  ProductCharacteristicValue.addIndex([{
    name: 'm_ch_vl_prod_idx',
    columns: [{
      name: 'm_ch_value_id',
      sort: 'desc'
    }, {
      name: 'm_product_id',
      sort: 'desc'
    }]
  }]);

  OB.Data.Registry.registerModel(ProductCharacteristicValue);
}());