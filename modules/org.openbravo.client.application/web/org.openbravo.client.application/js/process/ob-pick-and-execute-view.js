/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.1  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html
 * Software distributed under the License  is  distribfuted  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License.
 * The Original Code is Openbravo ERP.
 * The Initial Developer of the Original Code is Openbravo SLU
 * All portions are Copyright (C) 2011-2013 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

isc.defineClass('OBPickAndExecuteView', isc.VLayout);

// == OBPickAndExecuteView ==
//   OBPickAndExecuteView is the view that contains the grid for the Pick &
//   Execute pattern. It is a special parameter field in OBParameterWindowView
//   consisting in a window reference.
isc.OBPickAndExecuteView.addProperties({
  // Set default properties for the OBPopup container
  showMinimizeButton: true,
  showMaximizeButton: true,
  popupWidth: '90%',
  popupHeight: '90%',
  // Set later inside initWidget
  firstFocusedItem: null,

  // Set now pure P&E layout properties
  width: '100%',
  height: '100%',
  overflow: 'auto',
  autoSize: false,

  dataSource: null,

  viewGrid: null,

  addNewButton: null,

  gridFields: [],

  messageBar: null,

  initWidget: function () {
    var newButton, i, view = this;

    this.prepareGridFields(this.viewProperties.fields);

    if (this.viewProperties.showSelect) {
      this._addIconField();
    }

    if (this.viewProperties.allowDelete) {
      this._addDeleteField();
    }
    this.messageBar = isc.OBMessageBar.create({
      visibility: 'hidden',
      view: this
    });
    this.addMember(this.messageBar);

    this.dataSource = this.viewProperties.dataSource;
    this.dataSource.view = this;
    this.title = this.windowTitle;

    // the datasource object is defined on viewProperties, do not destroy it
    this.dataSource.potentiallyShared = true;

    this.viewGrid = isc.OBPickAndExecuteGrid.create({
      view: this.view,
      contentView: this,
      fields: this.gridFields,
      height: '*',
      cellHeight: OB.Styles.Process.PickAndExecute.gridCellHeight,
      dataSource: this.dataSource,
      gridProperties: this.viewProperties.gridProperties,
      selectionAppearance: (this.viewProperties.showSelect ? 'checkbox' : 'rowStyle'),
      selectionType: 'simple',
      canRemoveRecords: (this.viewProperties.allowDelete ? true : false),
      saveLocally: (this.viewProperties.allowDelete || this.viewProperties.allowAdd ? true : false),
      autoSaveEdits: (this.viewProperties.allowDelete || this.viewProperties.allowAdd ? true : false),
      neverValidate: (this.viewProperties.allowDelete || this.viewProperties.allowAdd ? true : false),
      showGridSummary: this.showGridSummary,
      viewProperties: this.viewProperties,
      parameterName: this.parameterName
    });


    if (this.viewProperties.allowAdd) {
      this.addNewButton = isc.OBLinkButtonItem.create({
        title: '[ ' + OB.I18N.getLabel('OBUIAPP_AddNew') + ' ]',
        action: function () {
          var newValues;
          view.viewGrid.endEditing();
          if (view.viewProperties.newFn) {
            newValues = view.viewProperties.newFn(view.viewGrid);
          }
          view.viewGrid.startEditingNew(newValues);
        }
      });
    }
    OB.TestRegistry.register('org.openbravo.client.application.process.pickandexecute.button.addnew', this.addNewButton);

    this.members = [this.viewGrid, isc.HLayout.create({
      height: 1,
      overflow: 'visible',
      align: OB.Styles.Process.PickAndExecute.addNewButtonAlign,
      width: '100%',
      visibility: (this.addNewButton ? 'visible' : 'hidden'),
      members: (this.addNewButton ? [this.addNewButton] : [])
    })];

    this.Super('initWidget', arguments);
    OB.TestRegistry.register('org.openbravo.client.application.process.pickandexecute.popup', this);

  },

  prepareGridFields: function (fields) {
    var result = isc.OBStandardView.getPrototype().prepareGridFields.apply(this, arguments),
        i, f, len = result.length;

    for (i = 0; i < len; i++) {
      if (result[i].editorProperties && result[i].editorProperties.disabled) {
        result[i].canEdit = false;
        result[i].readOnlyEditorType = 'OBTextItem';
      } else {
        result[i].validateOnExit = true;
      }

      if (result[i].showGridSummary) {
        if (!this.showGridSummary) {
          this.showGridSummary = true;
        }
      } else {
        result[i].showGridSummary = false;
      }
    }

    this.gridFields = result;
  },

  _addIconField: function () {
    if (!this.gridFields) {
      return;
    }

    this.gridFields.unshift({
      name: '_pin',
      type: 'boolean',
      title: '&nbsp;',
      canEdit: false,
      canFilter: false,
      canSort: false,
      canReorder: false,
      canHide: false,
      frozen: true,
      canFreeze: false,
      canDragResize: false,
      canGroupBy: false,
      autoExpand: false,
      width: OB.Styles.Process.PickAndExecute.pinColumnWidth,
      formatCellValue: function (value, record, rowNum, colNum, grid) {
        if (record[grid.selectionProperty]) {
          return '<img class="' + OB.Styles.Process.PickAndExecute.iconPinStyle + '" src="' + OB.Styles.Process.PickAndExecute.iconPinSrc + '" />';
        }
        return '';
      },
      formatEditorValue: function (value, record, rowNum, colNum, grid) {
        return this.formatCellValue(arguments);
      }
    });
  },

  _addDeleteField: function () {
    if (!this.gridFields) {
      return;
    }
    this.gridFields.unshift({
      name: '_delete',
      type: 'boolean',
      title: '&nbsp;',
      canEdit: false,
      canFilter: false,
      canSort: false,
      canReorder: false,
      canHide: false,
      canFreeze: false,
      canDragResize: false,
      canGroupBy: false,
      autoExpand: false,
      align: 'center',
      cellAlign: 'center',
      isRemoveField: true,
      //width: 32, // No effect
      formatCellValue: function (value, record, rowNum, colNum, grid) {
        var src = OB.Styles.Process.PickAndExecute.iconDeleteSrc,
            srcWithoutExt = src.substring(0, src.lastIndexOf('.')),
            srcExt = src.substring(src.lastIndexOf('.') + 1, src.length),
            onmouseover = 'this.src=\'' + srcWithoutExt + '_Over.' + srcExt + '\'',
            onmousedown = 'this.src=\'' + srcWithoutExt + '_Down.' + srcExt + '\'',
            onmouseout = 'this.src=\'' + src + '\'';
        return '<img class="' + OB.Styles.Process.PickAndExecute.iconDeleteStyle + '" onmouseover="' + onmouseover + '" onmousedown="' + onmousedown + '" onmouseout="' + onmouseout + '" src="' + src + '" />';
      },
      formatEditorValue: function (value, record, rowNum, colNum, grid) {
        return this.formatCellValue(arguments);
      }
    });
  },

  // dummy required by OBStandardView.prepareGridFields
  setFieldFormProperties: function () {}
});