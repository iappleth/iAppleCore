/*global OB, enyo, $, confirm */

/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

enyo.kind({
  name: 'OB.UI.Modalnoteditableorder',
  kind: 'OB.UI.ModalInfo',
  header: OB.I18N.getLabel('OBPOS_modalNoEditableHeader'),
  bodyContent: {
    tag: 'div',
    content: OB.I18N.getLabel('OBPOS_modalNoEditableBody')
  },
  myId: 'modalNotEditableOrder'
});