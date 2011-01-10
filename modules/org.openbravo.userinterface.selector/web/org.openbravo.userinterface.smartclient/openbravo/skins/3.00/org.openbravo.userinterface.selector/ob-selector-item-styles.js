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
isc.OBSelectorPopupWindow.addProperties({
  autoSize: false,
  width: '85%',
  height: '85%',
  align: 'center',
  autoCenter: true,
  isModal: true,
  showModalMask: true,
  animateMinimize: false,
  showMaximizeButton: true,
  headerControls: ['headerIcon', 'headerLabel', 'minimizeButton', 'maximizeButton', 'closeButton'],
//  headerIconProperties: {
//    width: 16,
//    height: 16,
//    src: '[SKINIMG]../../org.openbravo.client.application/images/form/search_picker.png'
//  },
  buttonBarHeight: 40,
  buttonBarSpace: 20,
  buttonBarStyleName: null,
  
  selectorGridProperties: {
    width: '100%',
    height: '100%',
    alternateRecordStyles: true
  }
});

isc.OBSelectorItem.addProperties({
  newTabIconSrc: '[SKINIMG]../../org.openbravo.client.application/images/form/ico-to-new-tab.png',
  newTabIconSize: 8,  
  
  popupIconSrc: '[SKINIMG]../../org.openbravo.client.application/images/form/search_picker.png',
  popupIconWidth: 21,
  popupIconHeight: 21
});

isc.OBSelectorLinkItem.addProperties({
  newTabIconSrc: '[SKINIMG]../../org.openbravo.client.application/images/form/ico-to-new-tab.png',
  newTabIconSize: 8,
  pickerIconHeight: 21,
  pickerIconWidth: 21,
  pickerIconSrc: '[SKINIMG]../../org.openbravo.client.application/images/form/search_picker.png',  
  showPickerIcon: true,
  clearIcon: {        
    src: '[SKINIMG]../../org.openbravo.client.application/images/form/clear-field.png',
    height: 15,
    width: 15,
    showHover: true,
    prompt: OB.I18N.getLabel('OBUIAPP_ClearIconPrompt')
  }
});
