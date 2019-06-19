/*
 ************************************************************************************
 * Copyright (C) 2015-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

(function() {
  var CancelLayaway = OB.Data.ExtensibleModel.extend({
    modelName: 'CancelLayaway',
    tableName: 'cancellayaway',
    entityName: 'CancelLayaway',
    local: true,
    source: ''
  });

  CancelLayaway.addProperties([
    {
      name: 'id',
      column: 'cancellayaway_id',
      primaryKey: true,
      type: 'TEXT'
    },
    {
      name: 'json',
      column: 'json',
      type: 'TEXT'
    }
  ]);

  OB.Data.Registry.registerModel(CancelLayaway);
})();
