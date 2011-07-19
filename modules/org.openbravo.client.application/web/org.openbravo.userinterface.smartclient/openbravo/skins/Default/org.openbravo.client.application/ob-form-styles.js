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

/* =====================================================================
 * Styling properties for:
 * 1) OB Form items
 * 2) SectionItem Button Styles
 * 3) Attachments Styles
 =======================================================================*/

/* =====================================================================
 * FormItem styling properties
 =======================================================================*/
isc.OBViewForm.addProperties({
  styleName: 'OBViewForm',
  width: '100%',
  overflow: 'visible',
  //cellBorder: 1, // debug layout
  cellPadding: 0
});

isc.OBFormContainerLayout.addProperties({
  styleName: 'OBFormContainerLayout'
});

isc.OBFormButton.addProperties({
  baseStyle: 'OBFormButton',
  titleStyle: 'OBFormButtonTitle'
});

OB.Styles.OBFormField = {};
OB.Styles.OBFormField.DefaultTextItem = {
  errorOrientation: 'left',
  height: 21,
  width: '100%',
  cellStyle: 'OBFormField',
  titleStyle: 'OBFormFieldLabel',
  textBoxStyle: 'OBFormFieldInput'
};

isc.OBTextItem.addProperties(isc.addProperties({}, OB.Styles.OBFormField.DefaultTextItem));

isc.OBTimeItem.addProperties(isc.addProperties({}, OB.Styles.OBFormField.DefaultTextItem));

isc.OBEncryptedItem.addProperties(isc.addProperties({}, OB.Styles.OBFormField.DefaultTextItem));

isc.OBTextAreaItem.addProperties(isc.addProperties({}, OB.Styles.OBFormField.DefaultTextItem));
isc.OBTextAreaItem.addProperties({
  height: 66
});

isc.OBPopUpTextAreaItem.addProperties({
  errorOrientation: 'left',
  cellStyle: 'OBFormField',
  titleStyle: 'OBFormFieldLabel',
  textBoxStyle: 'OBFormFieldStatic'
});

OB.Styles.OBFormField.DefaultComboBox = {
  cellStyle: 'OBFormField',
  titleStyle: 'OBFormFieldLabel',
  textBoxStyle: 'OBFormFieldSelectInput',
  controlStyle: 'OBFormFieldSelectControl',
  pickerIconStyle: 'OBFormFieldSelectPickerIcon',
  pickListBaseStyle: 'OBFormFieldPickListCell',
  // tallbasestyle is used when the cellheight is different
  // from the standard
  pickListTallBaseStyle: 'OBFormFieldPickListCell',
  pickerIconSrc: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/comboBoxPicker.png',
  height: 21,
  pickerIconWidth: 21,
  pickerIconHeight: 21, 
  
  // note the menu-rollover.png which is the background for selected rows
  // is 20
  pickListCellHeight: 22,
  
  quickRunWidth: 210,
  // fixes issue https://issues.openbravo.com/view.php?id=15105
  quickRunPickListCellHeight: 22,
  pickListHeight: 200,
  autoSizePickList: false,

  pickListProperties: {
    showShadow: false,
    shadowDepth: 5,
    bodyStyleName: 'OBPickListBody'
  },

  errorOrientation: 'left'
};

isc.OBListItem.addProperties(isc.addProperties({}, OB.Styles.OBFormField.DefaultComboBox));

isc.OBFKItem.addProperties(isc.addProperties({}, OB.Styles.OBFormField.DefaultComboBox));

isc.OBFKItem.addProperties({
  newTabIconSrc: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/ico-to-new-tab.png',
  newTabIconSize: 8
});

isc.OBYesNoItem.addProperties(isc.addProperties({}, OB.Styles.OBFormField.DefaultComboBox));

OB.Styles.OBFormField.DefaultCheckbox = {
  cellStyle: 'OBFormField',
  titleStyle: 'OBFormFieldLabel',
  textBoxStyle: 'OBFormFieldLabel',
  showValueIconOver: true,
  showValueIconFocused: true,
  showFocused: true,
  defaultValue: false,
  checkedImage: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/checked.png',
  uncheckedImage: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/unchecked.png'
};

isc.OBCheckboxItem.addProperties(isc.addProperties({}, OB.Styles.OBFormField.DefaultCheckbox));

OB.Styles.OBFormField.DefaultSearch = {
  cellStyle: 'OBFormField',
  titleStyle: 'OBFormFieldLabel',
  textBoxStyle: 'OBFormFieldInput',
  pickerIconHeight: 21,
  pickerIconWidth: 21,
  height: 21,
  pickerIconSrc: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/search_picker.png',
  clearIcon: {
    showHover: true,
    height: 15,
    width: 15,
    src: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/clear-field.png',    
    prompt: OB.I18N.getLabel('OBUIAPP_ClearIconPrompt')
  },
  newTabIconSrc: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/ico-to-new-tab.png',
  newTabIconSize: 8
};

isc.OBSearchItem.addProperties(isc.addProperties({}, OB.Styles.OBFormField.DefaultSearch));

isc.OBLinkItem.addProperties(isc.addProperties({}, OB.Styles.OBFormField.DefaultSearch));

isc.OBLinkButtonItem.addProperties({
  width: 1, //To allow button be just text width
  align: 'left',
  baseStyle: 'OBLinkButtonItem',
  showDown: true,
  showFocused: true,
  showFocusedAsOver: false,
  showRollOver: true,
  autoFit: true,
  height: 1,
  overflow: 'visible'
});

isc.OBDateChooser.addProperties({
  headerStyle: 'OBDateChooserButton',
  weekendHeaderStyle: 'OBDateChooserWeekendButton',
  baseNavButtonStyle: 'OBDateChooserNavButton',
  baseWeekdayStyle: 'OBDateChooserWeekday',
  baseWeekendStyle: 'OBDateChooserWeekend',
  baseBottomButtonStyle: 'OBDateChooserBottomButton',
  alternateWeekStyles: false,
  firstDayOfWeek: 1,  

  showEdges: true,

  edgeImage: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/dateChooser-popup.png',
  edgeSize: 6,
  edgeTop: 26,
  edgeBottom: 5,
  edgeOffsetTop: 1,
  edgeOffsetRight: 5,
  edgeOffsetLeft: 5,
  edgeOffsetBottom: 5,

  todayButtonHeight: 20,

  headerHeight: 24,

  edgeCenterBackgroundColor: '#FFFFFF',
  backgroundColor: null,

  showShadow: false,
  shadowDepth: 6,
  shadowOffset: 5,

  showDoubleYearIcon: false,
  prevYearIcon: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/dateChooser-doubleArrow_left.png',
  prevYearIconWidth: 16,
  prevYearIconHeight: 16,
  nextYearIcon: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/dateChooser-doubleArrow_right.png',
  nextYearIconWidth: 16,
  nextYearIconHeight: 16,
  prevMonthIcon: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/dateChooser-arrow_left.png',
  prevMonthIconWidth: 16,
  prevMonthIconHeight: 16,
  nextMonthIcon: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/dateChooser-arrow_right.png',
  nextMonthIconWidth: 16,
  nextMonthIconHeight: 16
});

OB.Styles.OBFormField.DefaultDateInput = {
  cellStyle: 'OBFormField',
  titleStyle: 'OBFormFieldLabel',
  textBoxStyle: 'OBFormFieldInput',
  errorOrientation: 'left',

  pickerIconHSpace: '0',

  textFieldProperties: {
    type: 'OBTextField',
    textBoxStyle: 'OBFormFieldDateInput'
  },

  height: 25,

  pickerIconWidth: 21,
  pickerIconHeight: 21,
  pickerIconSrc: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/date_control.png'
};

isc.OBDateItem.addProperties(isc.addProperties({}, OB.Styles.OBFormField.DefaultDateInput));

isc.OBDateTimeItem.addProperties(isc.addProperties({}, OB.Styles.OBFormField.DefaultDateInput));


isc.OBNumberItem.addProperties({
  cellStyle: 'OBFormField',
  titleStyle: 'OBFormFieldLabel',
  textBoxStyle: 'OBFormFieldNumberInput',
  errorOrientation: 'left'
});

/* =====================================================================
 * Date range filter item and dialog
 =======================================================================*/

isc.OBDateRangeDialog.addProperties({
  // rounded frame edges
  showEdges: true,
  edgeImage: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/popup/border.png',
  customEdges: null,
  edgeSize: 2,
  edgeTop: 27,
  edgeBottom: 2,
  edgeOffsetTop: 2,
  edgeOffsetRight: 2,
  edgeOffsetBottom: 2,
  showHeaderBackground: false, // part of edges
  showHeaderIcon: true,
  isModal : true,
  showModalMask : true,
  dragAppearance : 'target',

  // clear backgroundColor and style since corners are rounded
  backgroundColor: null,
  border: null,
  styleName: 'OBPopup',
  edgeCenterBackgroundColor: '#FFFFFF',
  bodyColor: 'transparent',
  bodyStyle: 'OBPopupBody',
  headerStyle: 'OBPopupHeader',

  layoutMargin: 0,
  membersMargin: 0,

  showShadow: false,
  shadowDepth: 5,
  width: 420,
  height: 170
});

isc.OBDateRangeDialog.changeDefaults('headerDefaults', {
  layoutMargin: 0,
  height: 25
});

isc.OBDateRangeDialog.changeDefaults('headerLabelDefaults', {
  wrap : false,
  width : '100%',
  inherentWidth : true,
  styleName: 'OBPopupHeaderText',
  align: isc.Canvas.CENTER
});

isc.OBDateRangeDialog.changeDefaults('buttonLayoutDefaults', {
  align: 'center'
});

isc.OBDateRangeDialog.changeDefaults('closeButtonDefaults', {
  baseStyle: 'OBPopupIconClose',
  src: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/popup/close.png',
  width: 24,
  height: 20
});

isc.OBDateRangeDialog.changeDefaults('headerIconProperties', {
  styleName: 'OBPopupHeaderIcon',
  src: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/popup/iconHeader.png',
  width: 20,
  height: 16
});

isc.OBDateRangeDialog.addProperties({
  clearButtonConstructor: isc.OBFormButton,
  cancelButtonConstructor: isc.OBFormButton,
  okButtonConstructor: isc.OBFormButton,
  okButtonTitle: OB.I18N.getLabel('OBUISC_Dialog.OK_BUTTON_TITLE'),
  clearButtonTitle: OB.I18N.getLabel('OBUIAPP_Clear'),
  cancelButtonTitle: OB.I18N.getLabel('OBUISC_Dialog.CANCEL_BUTTON_TITLE'),
  headerTitle: OB.I18N.getLabel('OBUIAPP_SelectDateRange')
});

isc.OBMiniDateRangeItem.changeDefaults('pickerIconDefaults', {
  width: 21,
  height: 21,
  src: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/date_control.png'
});

isc.OBMiniDateRangeItem.addProperties({
  cellStyle: 'OBFormField',
  titleStyle: 'OBFormFieldLabel',
  textBoxStyle: 'OBFormFieldInput',
  showFocused: true,
  fromDateOnlyPrefix: OB.I18N.getLabel('OBUIAPP_fromDateOnlyPrefix'),
  toDateOnlyPrefix: OB.I18N.getLabel('OBUIAPP_toDateOnlyPrefix'),
  pickerIconPrompt: OB.I18N.getLabel('OBUIAPP_pickerIconPrompt')
});

isc.DateRangeItem.changeDefaults('dateRangeFormDefaults', {
  titleSuffix: '</b>',
  titlePrefix: '<b>',
  requiredTitleSuffix: ' *</b>',
  requiredRightTitlePrefix: '<b>* ',
  rightTitlePrefix: '<b>',
  rightTitleSuffix: '</b>'
});

isc.DateRangeItem.addProperties({
  cellStyle: 'OBFormField',
  titleStyle: 'OBFormFieldLabel',
  textBoxStyle: 'OBFormFieldInput',
  fromTitle: OB.I18N.getLabel('OBUIAPP_From'),
  toTitle: OB.I18N.getLabel('OBUIAPP_To')
});

isc.RelativeDateItem.addProperties({
  cellStyle: 'OBFormField',
  titleStyle: 'OBFormFieldLabel',
  textBoxStyle: 'OBFormFieldSelectInput',
  controlStyle: 'OBFormFieldSelectControl'
});

isc.RelativeDateItem.changeDefaults('quantityFieldDefaults', {
  cellStyle: 'OBFormField',
  titleStyle: 'OBFormFieldLabel',
  textBoxStyle: 'OBFormFieldSelectInput',
  controlStyle: 'OBFormFieldSelectControl'
});

isc.RelativeDateItem.changeDefaults('valueFieldDefaults', {
  cellStyle: 'OBFormField',
  titleStyle: 'OBFormFieldLabel',
  textBoxStyle: 'OBFormFieldSelectInput',
  controlStyle: 'OBFormFieldSelectControl',
  pickerIconSrc: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/comboBoxPicker.png',
  pickerIconWidth: 21,
  pickerIconHeight: 21,
  calendarIconSrc: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/date_control.png',
  calendarIconWidth: 21,
  calendarIconHeight: 21,
  calendarIconHspace: 0
});

isc.RelativeDateItem.changeDefaults('calculatedDateFieldDefaults', {
  canFocus: false,
  disabled: true,
  showDisabled: false
});

/* =====================================================================
 * SectionItem Button Styles
 =======================================================================*/

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
  src: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/sectionItem-bg.png',
  icon: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/sectionItem-ico.png',
  iconSize: 12,
  capSize: 12,
  titleStyle: 'OBSectionItemButton_Title_',
  backgroundColor: 'transparent'
});
isc.OBSectionItemButton.addProperties({
  focusChanged: function() { // "ImgSectionHeader" is not a StatefulCanvas so -Focused- status should be done programmatically
    if (this.background) {
      if (this.containsFocus()) {
        this.background.setSrc(this.background.src.replace(/(\.)(png)$/, '_Focused.png'));
        this.background.setIcon(this.background.icon.replace(/(\.)(png)$/, '_Focused.png'));
      } else {
        this.background.setSrc(this.background.src.replace(/(_Focused)(\.)(png)$/, '.png'));
        this.background.setIcon(this.background.icon.replace(/(_Focused)(\.)(png)$/, '.png'));
      }
    }
    this.Super("focusChanged", arguments);
  }
});

/* =====================================================================
 * Attachments Styles
 =======================================================================*/

 isc.OBAttachmentsSubmitPopup.addProperties({
  hlayoutTopMargin: 10,
  height: 30,
  width: 450,
  align: 'center'
});