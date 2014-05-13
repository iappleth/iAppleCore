/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.1  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use. this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License.
 * The Original Code is Openbravo ERP.
 * The Initial Developer of the Original Code is Openbravo SLU
 * All portions are Copyright (C) 2014 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */


// == OBPickEditGridItem ==
isc.ClassFactory.defineClass('OBPickEditGridItem', isc.CanvasItem);

isc.OBPickEditGridItem.addProperties({
  rowSpan: 1,
  colSpan: 4,
  defaultFilter: null,

  init: function () {
    var me = this,
        pickAndExecuteViewProperties = {};
    pickAndExecuteViewProperties.viewProperties = this.viewProperties;
    pickAndExecuteViewProperties.view = this.view;
    pickAndExecuteViewProperties.parameterName = this.parameterName;
    if (this.view.isPickAndExecuteWindow) {
      this.view.resized = function () {
        me.canvas.setHeight(me.view.height - 100);
        me.canvas.setWidth(me.view.width - 35);
        me.canvas.redraw();
      };
    } else {
      pickAndExecuteViewProperties.height = 45 + OB.Styles.Process.PickAndExecute.gridCellHeight * this.displayedRowsNumber;
    }
    this.canvas = isc.OBPickAndExecuteView.create(pickAndExecuteViewProperties);
    this.Super('init', arguments);
    this.selectionLayout = this.canvas;
  },

  getValue: function () {
    var allProperties = {},
        grid = this.canvas.viewGrid,
        allRows, len, i, selection, tmp;
    selection = grid.getSelectedRecords() || [];
    len = selection.length;
    allRows = grid.data.allRows || grid.data.localData || grid.data;
    allProperties._selection = [];
    allProperties._allRows = [];
    for (i = 0; i < len; i++) {
      tmp = isc.addProperties({}, selection[i], grid.getEditedRecord(grid.getRecordIndex(selection[i])));
      allProperties._selection.push(tmp);
    }
    len = (allRows && allRows.length) || 0;
    if (!(grid.data.resultSize) || (len < grid.data.resultSize)) {
      for (i = 0; i < len; i++) {
        tmp = isc.addProperties({}, allRows[i], grid.getEditedRecord(grid.getRecordIndex(allRows[i])));
        allProperties._allRows.push(tmp);
      }
    }
    return (allProperties);
  },

  setDisabled: function (newState) {
    this.Super('setDisabled', arguments);
    if (newState === true) {
      this.setDisabled(false);
      this.canvas.viewGrid.setCanEdit(false);
    } else {
      this.canvas.viewGrid.setCanEdit(true);
    }
  },

  setDefaultFilter: function (defaultFilter) {
    this.defaultFilter = defaultFilter;
  },

  destroy: function () {
    this.canvas.destroy();
    this.Super('destroy', arguments);
  }
});