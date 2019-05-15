/*
 ************************************************************************************
 * Copyright (C) 2012-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo*/

enyo.kind({
  name: 'OB.UI.Modalnoteditableorder',
  kind: 'OB.UI.ModalInfo',
  classes: 'obUiModalnoteditableorder',
  i18nHeader: 'OBPOS_modalNoEditableHeader',
  bodyContent: {
    i18nContent: 'OBPOS_modalNoEditableBody'
  }
});