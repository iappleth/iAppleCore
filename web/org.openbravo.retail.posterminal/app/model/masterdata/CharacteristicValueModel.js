/*
 ************************************************************************************
 * Copyright (C) 2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
(function CharacteristicValueDefinition() {
  class CharacteristicValue extends OB.App.Class.MasterdataModel {
    constructor() {
      super();
      this.indices = [
        new OB.App.Class.Index({
          name: 'characteristicvalue_characteristicid_idx',
          properties: [{ property: 'characteristic_id' }]
        })
      ];
    }

    // eslint-disable-next-line class-methods-use-this
    getName() {
      return 'CharacteristicValue';
    }
  }
  OB.App.MasterdataController.registerModel(CharacteristicValue);
})();
