/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.1  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html 
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License.
 * The Original Code is Openbravo ERP.
 * The Initial Developer of the Original Code is Openbravo SLU
 * All portions are Copyright (C) 2011 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
*/

OB.MyOBStyles = {
  recentViewsLayout: {
    baseStyle: 'OBMyOBRecentViews',
    nodeIcons: {
      Window: OB.SkinsPath + 'Default/org.openbravo.client.application/images/application-menu/iconWindow.png',
      Process: OB.SkinsPath + 'Default/org.openbravo.client.application/images/application-menu/iconProcess.png',
      Report: OB.SkinsPath + 'Default/org.openbravo.client.application/images/application-menu/iconReport.png',
      Form: OB.SkinsPath + 'Default/org.openbravo.client.application/images/application-menu/iconForm.png'
    },
    Label: {
      baseStyle: 'OBMyOBRecentViewsEntry'
    },
    newIcon: {
      src: OB.SkinsPath + 'Default/org.openbravo.client.myob/images/management/iconCreateNew.png'
    }
  },
  recentDocumentsLayout: {
    baseStyle: 'OBMyOBRecentViews',
    Label: {
      baseStyle: 'OBMyOBRecentViewsEntry',
      icon: OB.SkinsPath + 'Default/org.openbravo.client.myob/images/management/IconRecentDocs.png'
    }
  },
  actionTitle: {
    baseStyle: 'OBMyOBRecentViews'
  },
  refreshLayout: {
    styleName: 'OBMyOBLeftColumnLink'
  },
  addWidgetLayout: {
    styleName: 'OBMyOBLeftColumnLink'
  },
  adminOtherMyOBLayout: {
    styleName: 'OBMyOBLeftColumnLink'
  },
  leftColumnLayout: {
    styleName: 'OBMyOBLeftColumn'
  },
  portalLayout: {
    styleName: 'OBMyOBPortal'
  }
};

OB.OBMyOBAddWidgetDialog = {
  cellStyle: 'OBFormField',
  titleStyle: 'OBFormFieldLabel',
  textBoxStyle: 'OBFormFieldSelectInput',
  controlStyle: 'OBFormFieldSelectControl',
  pickListBaseStyle: 'OBFormFieldPickListCell',
  pickerIconSrc: OB.SkinsPath + 'Default/org.openbravo.client.application/images/form/comboBoxPicker.png',
  height: 21,
  pickerIconWidth: 21,
  pickListProperties: {
    bodyStyleName: 'OBPickListBody'
  }
};

OB.OBMyOBAdminModeDialogStyles = {
  cellStyle: 'OBFormField',
  titleStyle: 'OBFormFieldLabel',
  textBoxStyle: 'OBFormFieldSelectInput',
  controlStyle: 'OBFormFieldSelectControl',
  pickListBaseStyle: 'OBFormFieldPickListCell',
  pickerIconSrc: OB.SkinsPath + 'Default/org.openbravo.client.application/images/form/comboBoxPicker.png',
  height: 21,
  pickerIconWidth: 21,
  pickListProperties: {
    bodyStyleName: 'OBPickListBody'
  }
};

OB.OBMyOBPublishChangesDialogStyles = {
  form: {
    styleName: 'OBMyOBPublishLegend'
  }
};


isc.OBMyOpenbravo.addProperties({
  styleName: 'OBMyOpenbravo'
});