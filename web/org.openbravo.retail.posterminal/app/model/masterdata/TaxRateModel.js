/*
 ************************************************************************************
 * Copyright (C) 2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

(function taxRateModel() {
  class TaxRate extends OB.App.Class.MasterdataModel {
    // eslint-disable-next-line class-methods-use-this
    getName() {
      return 'TaxRate';
    }
  }

  OB.App.MasterdataController.registerModel(TaxRate);
})();
