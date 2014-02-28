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
 * All portions are Copyright (C) 2013-2014 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */


// = Tree Item =
// Contains the OBTreeItem. This widget consists of three main parts:
// 1) a text item with a picker icon
// 2) a tree grid that will show data filtered by the text entered in the text item
// 3) a popup window showing a search grid and a tree grid with data
//
isc.ClassFactory.defineClass('OBTreeItem', isc.OBTextItem);

isc.ClassFactory.mixInInterface('OBTreeItem', 'OBLinkTitleItem');

isc.OBTreeItem.addProperties({
  showPickerIcon: true,
  pickerIconSrc: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/comboBoxPicker.png',
  tree: null,
  init: function () {
    this.Super('init', arguments);
    this.tree = isc.OBTreeItemTree.create({
      treeItem: this
    });
    this.treeDisplayField = this.getTreeDisplayField();
    this.treeWindow = isc.OBTreeItemPopupWindow.create({
      // solves issue: https://issues.openbravo.com/view.php?id=17268
      title: (this.form && this.form.grid ? this.form.grid.getField(this.name).title : this.title),
      dataSource: this.optionDataSource,
      treeItem: this,
      valueField: this.valueField,
      displayField: this.displayField,
      treeGridFields: isc.shallowClone(this.treeGridFields)
    });
    this.enableShortcuts();
  },

  destroy: function () {
    if (this.tree) {
      this.tree.destroy();
    }
    if (this.treeWindow) {
      this.treeWindow.destroy();
    }
    return this.Super('destroy', arguments);
  },

  enableShortcuts: function () {
    var ksAction_ShowPopup, ksAction_ShowTree, ksAction_MoveToTree;
    ksAction_ShowPopup = function (caller) {
      caller.openTreeWindow();
      return false; //To avoid keyboard shortcut propagation
    };
    OB.KeyboardManager.Shortcuts.set('TreeItem_ShowPopup', 'OBTreeItem', ksAction_ShowPopup);

    ksAction_ShowTree = function (caller) {
      caller.tree.show();
      return false; //To avoid keyboard shortcut propagation
    };
    OB.KeyboardManager.Shortcuts.set('TreeItem_ShowTree', 'OBTreeItem', ksAction_ShowTree);

    ksAction_MoveToTree = function (caller) {
      if (caller.tree.isVisible()) {
        caller.tree.focus();
      }
      return false; //To avoid keyboard shortcut propagation
    };
    OB.KeyboardManager.Shortcuts.set('TreeItem_MoveToTree', 'OBTreeItem', ksAction_MoveToTree);
  },

  getTreeDisplayField: function () {
    if (!this.displayField.contains(OB.Constants.FIELDSEPARATOR)) {
      return this.displayField;
    } else {
      return this.displayField.substr(this.displayField.lastIndexOf(OB.Constants.FIELDSEPARATOR) + 1);
    }
  },

  keyPress: function (keyName, character, form, item, icon) {
    var response = OB.KeyboardManager.Shortcuts.monitor('OBTreeItem', this);
    if (response !== false) {
      response = this.Super('keyPress', arguments);
    }
    return response;
  },

  icons: [{
    src: OB.Styles.skinsPath + 'Default/org.openbravo.client.application/images/form/search_picker.png',
    width: 21,
    height: 21,
    click: function (form, item, icon) {
      item.openTreeWindow();
    }
  }],

  openTreeWindow: function () {
    var selectedValue = this.getValue(),
        criteria, innerCriteria;
    if (this.treeWindow.treeGrid) {
      //If there is a record selected in the item, use it to filter the tree
      if (OB.Utilities.isUUID(selectedValue)) {
        this.targetRecordId = selectedValue;
        this.targetRecordIdentifier = this.getDisplayValue();
      }
    }
    this.treeWindow.show(true);
  },

  showPicker: function () {
    this.toggleTreePicker();
  },

  toggleTreePicker: function () {
    if (this.tree.isVisible()) {
      this.tree.hide();
    } else {
      this.tree.show();
    }
  },

  moved: function () {
    this.tree.updatePosition();
    return this.Super('moved', arguments);
  },

  changed: function (form, item, value) {
    if (!this.tree.isVisible() && !this.valueChangedFromPopup) {
      this.tree.show();
    }
    this.fireOnPause('refreshTree', this.refreshTree, 500, this);
    return this.Super('changed', arguments);
  },

  refreshTree: function () {
    this.tree.fetchData();
  },

  setValueFromRecord: function (record) {
    var currentValue = this.getValue(),
        identifierFieldName = this.name + OB.Constants.FIELDSEPARATOR + OB.Constants.IDENTIFIER,
        i;
    if (!record) {
      this.storeValue(null);
      this.form.setValue(this.name + OB.Constants.FIELDSEPARATOR + this.displayField, null);
      this.form.setValue(identifierFieldName, null);
    } else {
      this.storeValue(record[this.valueField]);
      this.form.setValue(this.name + OB.Constants.FIELDSEPARATOR + this.displayField, record[this.displayField]);
      this.form.setValue(identifierFieldName, record[OB.Constants.IDENTIFIER]);
      if (!this.valueMap) {
        this.valueMap = {};
      }
      this.valueMap[record[this.valueField]] = record[this.treeDisplayField].replace(/[\n\r]/g, '');
      this.updateValueMap();
    }
    // only jump to the next field if the value has really been set
    // do not jump to the next field if the event has been triggered by the Tab key,
    // to prevent a field from being skipped (see https://issues.openbravo.com/view.php?id=21419)
    if (currentValue && this.form.focusInNextItem && isc.EH.getKeyName() !== 'Tab') {
      this.form.focusInNextItem(this.name);
    }
    delete this._notUpdatingManually;
  },

  mapValueToDisplay: function (value) {
    var ret = this.Super('mapValueToDisplay', arguments);
    if (ret === value && this.isDisabled()) {
      return '';
    }
    // if value is null then don't set it in the valueMap, this results 
    // in null being displayed in the combobox
    if (ret === value && value) {
      if (!this.valueMap) {
        this.valueMap = {};
        this.valueMap[value] = '';
        return '';
      } else if (!this.valueMap[value] && OB.Utilities.isUUID(value)) {
        return '';
      }
    }
    if (value && value !== '' && ret === '' && !OB.Utilities.isUUID(value)) {
      this.savedEnteredValue = value;
    }
    return ret;
  }

});

// Tree that is displayed under the tree form item
isc.ClassFactory.defineClass('OBTreeItemTree', isc.OBTreeGrid);

isc.OBTreeItemTree.addProperties({
  treeItem: null,
  height: 200,
  autoFetchData: false,
  visibility: 'hidden',
  init: function () {
    OB.Datasource.get(this.treeItem.dataSourceId, this, null, true);
    this.Super('init', arguments);
  },

  dataArrived: function () {
    var selectedValue, record, rowNum;
    this.Super('dataArrived', arguments);
    selectedValue = this.treeItem.getValue();
    record = this.data.find('id', selectedValue);
    //If there is a record selected in the item, select it
    if (record) {
      rowNum = this.getRecordIndex(record);
      this.selectSingleRecord(record);
      // give grid time to draw
      this.fireOnPause('scrollRecordIntoView', this.scrollRecordIntoView, [rowNum, true], this);
    }
  },

  show: function () {
    this.updatePosition();
    this.fetchData();
    this._pageClickID = this.ns.Page.setEvent('mouseDown', this, null, 'clickOutsideTree');
    return this.Super('show', arguments);
  },

  clickOutsideTree: function () {
    var target, event, eventInfo;
    if (!this.isVisible()) {
      return;
    }
    target = isc.EH.lastEvent.target;
    eventInfo = this.treeItem.form.getEventItemInfo();
    // Do not hide if the picker of the formitem was clicked
    // Do picker itself will hide the tree
    if (eventInfo.icon === 'picker' && eventInfo.item.ID === this.treeItem.ID) {
      return;
    }
    if (!this.contains(target, true)) {
      this.hide();
    }
  },

  updatePosition: function () {
    var me = this,
        interval, treeItemWidth;
    if (this.treeItem) {
      treeItemWidth = this.treeItem.getVisibleWidth();
      if (treeItemWidth && treeItemWidth - 2 > this.getWidth()) {
        this.setWidth(treeItemWidth - 2);
      }
      this.placeNear(this.treeItem.getPageLeft() + 2, this.treeItem.getPageTop() + 26);
    }
  },

  setDataSource: function (ds, fields) {
    var me = this,
        i;
    ds.transformRequest = function (dsRequest) {
      var target = window[dsRequest.componentId];
      dsRequest.params = dsRequest.params || {};
      dsRequest.params._startRow = 0;
      dsRequest.params._endRow = OB.Properties.TreeDatasourceFetchLimit;
      dsRequest.params.treeReferenceId = target.treeItem.treeReferenceId;
      return this.Super('transformRequest', arguments);
    };

    ds.transformResponse = function (dsResponse, dsRequest, jsonData) {
      if (jsonData.response.error) {
        dsResponse.error = jsonData.response.error;
      }
      return this.Super('transformResponse', arguments);
    };

    ds.handleError = function (response, request) {
      if (response && response.error && response.error.type === 'tooManyNodes') {
        me.treeItem.form.view.messageBar.setMessage('error', null, OB.I18N.getLabel('OBUIAPP_TooManyNodes'));
      }
    };

    fields = this.treeItem.pickListFields;

    for (i = 0; i < fields.length; i++) {
      fields[i].escapeHTML = true;
    }
    ds.primaryKeys = {
      id: 'id'
    };
    return this.Super('setDataSource', [ds, fields]);
  },

  //Select the record
  rowDoubleClick: function (record, recordNum, fieldNum) {
    var id = record[OB.Constants.ID],
        identifier = record[OB.Constants.IDENTIFIER];
    if (!this.treeItem.parentSelectionAllowed && this.data.hasChildren(record)) {
      return;
    }
    if (!this.treeItem.valueMap) {
      this.treeItem.valueMap = {};
    }
    if (!this.treeItem.valueMap[id]) {
      this.treeItem.valueMap[id] = identifier;
    }
    this.treeItem.setElementValue(identifier);
    this.treeItem.updateValue();
    this.treeItem.form.view.toolBar.updateButtonState(true);
    this.hide();
  },

  fetchData: function (criteria, callback, requestProperties) {
    return this.Super('fetchData', [this.getCriteriaFromTreeItem(), callback, requestProperties]);
  },

  getCriteriaFromTreeItem: function () {
    var value = this.treeItem.getValue(),
        criteria = {};
    if (!value) {
      return null;
    }
    if (OB.Utilities.isUUID(value)) {
      value = this.treeItem.valueMap[value] ? this.treeItem.valueMap[value] : value;
    }
    criteria.fieldName = this.getFields()[0].name;
    criteria.operator = 'iContains';
    criteria.value = value;
    return {
      criteria: criteria
    };
  }
});

//
isc.ClassFactory.defineClass('OBTreeItemPopupWindow', isc.OBPopup);

isc.OBTreeItemPopupWindow.addProperties({
  canDragReposition: true,
  canDragResize: true,
  dismissOnEscape: true,
  showMaximizeButton: true,
  multiselect: false,

  defaultTreeGridField: {
    canFreeze: true,
    canGroupBy: false
  },

  initWidget: function () {
    var treeWindow = this,
        okButton, cancelButton, i;
    okButton = isc.OBFormButton.create({
      title: OB.I18N.getLabel('OBUISC_Dialog.OK_BUTTON_TITLE'),
      click: function () {
        treeWindow.setValueInField();
      }
    });
    cancelButton = isc.OBFormButton.create({
      title: OB.I18N.getLabel('OBUISC_Dialog.CANCEL_BUTTON_TITLE'),
      click: function () {
        treeWindow.closeClick();
      }
    });

    this.setFilterEditorProperties(this.treeGridFields);

    OB.Utilities.applyDefaultValues(this.treeGridFields, this.defaultTreeGridField);

    for (i = 0; i < this.treeGridFields.length; i++) {
      this.treeGridFields[i].canSort = (this.treeGridFields[i].canSort === false ? false : true);
      if (this.treeGridFields[i].disableFilter) {
        this.treeGridFields[i].canFilter = false;
      } else {
        this.treeGridFields[i].canFilter = true;
      }
    }
    if (!this.dataSource.fields || !this.dataSource.fields.length || this.dataSource.fields.length === 0) {
      this.dataSource.fields = this.treeGridFields;
      this.dataSource.init();
    }
    this.treeGrid = isc.OBTreeGrid.create({
      treeItem: this.treeItem,
      treeWindow: this,
      view: this.treeItem.form.view,
      selectionAppearance: this.selectionAppearance,
      treePopup: this,
      autoFetchData: false,
      filterOnKeypress: true,
      width: '100%',
      height: '100%',
      bodyStyleName: 'OBGridBody',
      showFilterEditor: true,
      alternateRecordStyles: true,
      dataSource: this.dataSource,
      sortField: this.displayField,
      init: function () {
        OB.Datasource.get(this.treeItem.dataSourceId, this, null, true);
        this.copyFunctionsFromViewGrid();
        this.Super('init', arguments);
      },

      copyFunctionsFromViewGrid: function () {
        var view = this.treeItem.form.view;
        this.filterEditorProperties = view.viewGrid.filterEditorProperties;
        this.checkShowFilterFunnelIconSuper = view.viewGrid.checkShowFilterFunnelIcon;
        this.isGridFiltered = view.viewGrid.isGridFiltered;
        this.isGridFilteredWithCriteria = view.viewGrid.isGridFilteredWithCriteria;
        this.isValidFilterField = view.viewGrid.isValidFilterField;
        this.resetEmptyMessage = view.viewGrid.resetEmptyMessage;
        this.filterData = view.viewGrid.filterData;
        this.loadingDataMessage = view.viewGrid.loadingDataMessage;
        this.emptyMessage = view.viewGrid.emptyMessage;
        this.noDataEmptyMessage = view.viewGrid.noDataEmptyMessage;
        this.filterNoRecordsEmptyMessage = view.viewGrid.filterNoRecordsEmptyMessage;
      },

      convertCriteria: function (criteria) {
        return criteria;
      },

      onFetchData: function (criteria, requestProperties) {
        requestProperties = requestProperties || {};
        requestProperties.params = this.getFetchRequestParams(requestProperties.params);
      },

      getFetchRequestParams: function (params) {
        params = params || {};
        if (this.getSelectedRecord()) {
          params._targetRecordId = this.targetRecordId;
        }
        return params;
      },

      dataArrived: function () {
        var record, rowNum, i, selectedRecords = [],
            ds, ids;
        this.Super('dataArrived', arguments);
        if (this.treeItem.targetRecordId) {
          record = this.data.find(OB.Constants.ID, this.treeItem.targetRecordId);
          rowNum = this.getRecordIndex(record);
          this.selectSingleRecord(record);
          // give grid time to draw
          this.fireOnPause('scrollRecordIntoView', this.scrollRecordIntoView, [rowNum, true], this);
          delete this.treeItem.targetRecordId;
        }
      },
      fields: this.treeGridFields,
      recordDoubleClick: function () {
        this.treeWindow.setValueInField();
      },

      handleFilterEditorSubmit: function (criteria, context) {
        var innerCriteria;
        if (this.treeItem.targetRecordId) {
          innerCriteria = {};
          innerCriteria.fieldName = OB.Constants.ID;
          innerCriteria.operator = 'equals';
          innerCriteria.value = this.treeItem.targetRecordId;
          criteria = {
            _constructor: 'AdvancedCriteria',
            criteria: [innerCriteria],
            operator: 'and'
          };
        }
        this.Super('handleFilterEditorSubmit', [criteria, context]);
      },

      setFilterValues: function (criteria) {
        var innerCriteria;
        if (criteria && criteria.criteria && criteria.criteria[0] && criteria.criteria[0].fieldName === OB.Constants.ID) {
          // Target record id criteria. Show the identifier of the row in the filter values
          innerCriteria = {};
          innerCriteria.fieldName = this.treeItem.treeDisplayField;
          innerCriteria.operator = 'iContains';
          innerCriteria.value = this.treeItem.getDisplayValue();
          criteria = {
            _constructor: 'AdvancedCriteria',
            criteria: [innerCriteria],
            operator: 'and'
          };
        }
        this.Super('setFilterValues', criteria);
      },

      setDataSource: function (ds, fields) {
        var me = this;
        ds.transformRequest = function (dsRequest) {
          var target = window[dsRequest.componentId];
          dsRequest.params = dsRequest.params || {};
          dsRequest.params._startRow = 0;
          dsRequest.params._endRow = OB.Properties.TreeDatasourceFetchLimit;
          dsRequest.params.treeReferenceId = target.treeItem.treeReferenceId;
          return this.Super('transformRequest', arguments);
        };

        ds.transformResponse = function (dsResponse, dsRequest, jsonData) {
          if (jsonData.response.error) {
            dsResponse.error = jsonData.response.error;
          }
          return this.Super('transformResponse', arguments);
        };

        ds.handleError = function (response, request) {
          if (response && response.error && response.error.type === 'tooManyNodes') {
            isc.warn(OB.I18N.getLabel('OBUIAPP_TooManyNodes'));
          }
        };

        fields = this.treePopup.treeGridFields;
        ds.primaryKeys = {
          id: 'id'
        };
        return this.Super('setDataSource', [ds, fields]);
      },

      // show or hide the filter button
      filterEditorSubmit: function (criteria) {
        this.checkShowFilterFunnelIcon(criteria);
      },

      checkShowFilterFunnelIcon: function (criteria) {
        var innerCriteria;
        if (criteria && criteria.criteria && criteria.criteria[0] && criteria.criteria[0].fieldName === OB.Constants.ID) {
          // Target record id criteria. Show the identifier of the row in the filter values
          innerCriteria = {};
          innerCriteria.fieldName = this.treeItem.treeDisplayField;
          innerCriteria.operator = 'iContains';
          innerCriteria.value = this.treeItem.getDisplayValue();
          criteria = {
            _constructor: 'AdvancedCriteria',
            criteria: [innerCriteria],
            operator: 'and'
          };
        }
        this.checkShowFilterFunnelIconSuper(criteria);
      }
    });

    this.items = [isc.VLayout.create({
      height: this.height,
      width: this.width,
      members: [this.treeGrid, isc.HLayout.create({
        styleName: this.buttonBarStyleName,
        height: 40,
        defaultLayoutAlign: 'center',
        members: [isc.LayoutSpacer.create({}), okButton, isc.LayoutSpacer.create({
          width: 20
        }), cancelButton, isc.LayoutSpacer.create({})]
      })]
    })];
    this.Super('initWidget', arguments);
  },

  setFilterEditorProperties: function (gridFields) {
    var i, gridField;
    for (i = 0; i < gridFields.length; i++) {
      gridField = gridFields[i];
      gridField.filterEditorProperties = gridField.filterEditorProperties || {};
      gridFields[i].filterEditorProperties.treeWindow = this;
    }
  },

  destroy: function () {
    var i;
    for (i = 0; i < this.items.length; i++) {
      this.items[i].destroy();
    }
    return this.Super('destroy', arguments);
  },

  closeClick: function () {
    this.hide(arguments);
    this.treeItem.focusInItem();
  },

  hide: function () {
    this.Super('hide', arguments);
    //focus is now moved to the next item in the form automatically
    if (!this.treeItem.form.getFocusItem()) {
      this.treeItem.focusInItem();
    }
  },

  show: function (applyDefaultFilter) {
    // draw now already otherwise the filter does not work the
    // first time    
    var ret = this.Super('show', arguments);
    if (applyDefaultFilter) {
      this.treeGrid.setFilterEditorCriteria(this.defaultFilter);
      this.treeGrid.filterByEditor();
    }
    if (this.treeGrid.isDrawn()) {
      this.treeGrid.focusInFilterEditor();
    } else {
      isc.Page.setEvent(isc.EH.IDLE, this.treeGrid, isc.Page.FIRE_ONCE, 'focusInFilterEditor');
    }

    if (this.treeItem.getValue()) {
      this.treeGrid.selectSingleRecord(this.treeGrid.data.find(this.valueField, this.treeItem.getValue()));
    } else {
      this.treeGrid.selectSingleRecord(null);
    }

    this.treeGrid.checkShowFilterFunnelIcon(this.treeGrid.getCriteria());

    return ret;
  },

  resized: function () {
    this.items[0].setWidth(this.width - 4);
    this.items[0].setHeight(this.height - 40);
    this.items[0].redraw();
    return this.Super('resized', arguments);
  },

  setValueInField: function () {
    var record = this.treeGrid.getSelectedRecord();
    if (!this.treeItem.parentSelectionAllowed && this.treeGrid.data.hasChildren(record)) {
      return;
    }
    this.treeItem.valueChangedFromPopup = true;
    this.treeItem.setValueFromRecord(record);
    delete this.treeItem.valueChangedFromPopup;
    this.hide();
  }
});

isc.ClassFactory.defineClass('OBTreeFilterSelectItem', isc.OBFKFilterTextItem);

isc.OBTreeFilterSelectItem.addProperties({

  filterDataBoundPickList: function (requestProperties, dropCache) {
    requestProperties = requestProperties || {};
    requestProperties.params = requestProperties.params || {};
    // on purpose not passing the third boolean param
    var contextInfo = this.treeWindow.treeItem.form.view.getContextInfo(false, true);

    // also add the special ORG parameter
    if (this.treeWindow.treeItem.form.getField('organization')) {
      requestProperties.params[OB.Constants.ORG_PARAMETER] = this.treeWindow.treeItem.form.getValue('organization');
    } else if (contextInfo.inpadOrgId) {
      requestProperties.params[OB.Constants.ORG_PARAMETER] = contextInfo.inpadOrgId;
    }
    requestProperties.params._tableId = this.treeWindow.treeItem.referencedTableId;
    return this.Super('filterDataBoundPickList', [requestProperties, true]);
  }
});