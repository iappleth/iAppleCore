/*
 ************************************************************************************
 * Copyright (C) 2016-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

(function CountryDefinition() {
  class Country extends OB.App.MasterdataModel {
    constructor() {
      super();
      this.indices = [
        new OB.App.Index({
          name: '_identifier',
          properties: [{ property: '_identifier' }]
        })
      ];
    }
  }
  OB.App.MasterdataController.registerModel(Country);
})();
