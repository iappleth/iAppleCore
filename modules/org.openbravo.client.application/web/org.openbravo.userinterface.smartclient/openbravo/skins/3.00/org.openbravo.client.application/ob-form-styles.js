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
 * All portions are Copyright (C) 2010-2011 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
isc.OBViewForm.addProperties({
  styleName: 'OBViewForm',
  width: '100%',
  overflow: 'visible',
  //cellBorder: 1, // debug layout
  cellPadding: 8
});

isc.OBSectionItem.addProperties({
  sectionHeaderClass: 'OBSectionItemButton',
  height: 24
});

isc.ClassFactory.defineClass('OBSectionItemButton', ImgSectionHeader);
isc.OBSectionItemButton.changeDefaults('backgroundDefaults', {
  showRollOver: true,
  showDown: false,
  showDisabledIcon: false,
  showRollOverIcon: false,
  src: '[SKIN]/../../org.openbravo.client.application/images/form/sectionItem-bg.png',
  icon: '[SKIN]/../../org.openbravo.client.application/images/form/sectionItem-ico.png',
  iconSize: 12,
  capSize: 12,
  titleStyle: 'OBSectionItemButton_Title_',
  backgroundColor: 'transparent'
});

isc.OBSearchItem.addProperties({
  pickerIconHeight: 21,
  pickerIconWidth: 21,
  pickerIconSrc: '[SKINIMG]../../org.openbravo.client.application/images/form/search_picker.png',
  clearIcon: {
    height: 15,
    width: 15,
    // note: TODO: show a helpfull text, need to be present in the messages table
    //prompt: 'test',
    showIf: function(form, item){
      if (item.disabled) {
        return false;
      }
      if (item.required) {
        return false;
      }
      if (item.getValue()) {
        return true;
      }
      return false;
    },
    
    click: function() {
      this.formItem.clearValue();
    },
    
    src: '[SKINIMG]../../org.openbravo.client.application/images/form/clear-field.png'
  },
  newTabIconSrc: '[SKINIMG]../../org.openbravo.client.application/images/form/ico-to-new-tab.png',
  newTabIconSize: 8
});

isc.OBFKItem.addProperties({
  newTabIconSrc: '[SKINIMG]../../org.openbravo.client.application/images/form/ico-to-new-tab.png',
  newTabIconSize: 8
});
