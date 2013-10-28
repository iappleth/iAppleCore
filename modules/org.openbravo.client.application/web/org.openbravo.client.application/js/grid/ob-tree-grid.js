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
 * All portions are Copyright (C) 2013 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
isc.ClassFactory.defineClass('OBTreeGrid', isc.TreeGrid);

isc.OBTreeGrid.addProperties({
  referencedTableId: null,
  parentTabRecordId: null,
  view: null,
  orderedTree: false,

  arrowKeyAction: "select",
  canPickFields: false,
  canDropOnLeaves: true,
  canHover: false,
  canReorderRecords: true,
  canAcceptDroppedRecords: true,
  dropIconSuffix: "into",
  showOpenIcons: false,
  showDropIcons: false,
  nodeIcon: null,
  folderIcon: null,
  autoFetchData: false,
  closedIconSuffix: "",
  showFilterEditor: true,
  selectionAppearance: "checkbox",
  showSelectedStyle: true,
  // the grid will be refreshed when:
  // - The tree category is LinkToParent and
  // - There has been at least a reparent
  needsViewGridRefresh: false,
  // Can't reparent with cascade selection 
  //  showPartialSelection: true,
  //  cascadeSelection: true,
  dataProperties: {
    modelType: "parent",
    rootValue: "0",
    idField: "nodeId",
    parentIdField: "parentId",
    openProperty: "isOpen"
  },

  init: function () {
    this.copyFunctionsFromViewGrid();
    this.Super('init', arguments);
    if (this.orderedTree) {
      this.canSort = false;
    } else {
      this.canSort = true;
    }
  },

  // Some OBTreeGrid functionality is alreadyd implemented in OBViewGrid
  // Instead of rewriting it, copy it
  // Do not do this for functions that makes call to super() if it needs to use code from OBGrid. It would not use OBGrid as prototype, but ListGrid
  copyFunctionsFromViewGrid: function () {
    this.filterEditorProperties = this.view.viewGrid.filterEditorProperties;
    this.checkShowFilterFunnelIcon = this.view.viewGrid.checkShowFilterFunnelIcon;
    this.isGridFiltered = this.view.viewGrid.isGridFiltered;
    this.isGridFilteredWithCriteria = this.view.viewGrid.isGridFilteredWithCriteria;
    this.isValidFilterField = this.view.viewGrid.isValidFilterField;
    this.convertCriteria = this.view.viewGrid.convertCriteria;
    this.resetEmptyMessage = this.view.viewGrid.resetEmptyMessage;
    this.filterData = this.view.viewGrid.filterData;
    this.loadingDataMessage = this.view.viewGrid.loadingDataMessage;
    this.emptyMessage = this.view.viewGrid.emptyMessage;
    this.noDataEmptyMessage = this.view.viewGrid.noDataEmptyMessage;
    this.filterNoRecordsEmptyMessage = this.view.viewGrid.filterNoRecordsEmptyMessage;
  },

  // Sets the fields of the datasource and extends the transformRequest and transformResponse functions
  setDataSource: function (ds, fields) {
    var me = this;
    ds.transformRequest = function (dsRequest) {
      dsRequest.params = dsRequest.params || {};
      dsRequest.params.referencedTableId = me.referencedTableId;
      me.parentTabRecordId = me.getParentTabRecordId();
      dsRequest.params.parentRecordId = me.parentTabRecordId;
      dsRequest.params.tabId = me.view.tabId;
      if (dsRequest.dropIndex || dsRequest.dropIndex === 0) {
        //Only send the index if the tree is ordered
        dsRequest = me.addOrderedTreeParameters(dsRequest);
      }
      if (!me.view.isShowingTree) {
        dsRequest.params.selectedRecords = me.getSelectedRecordsString();
      } else {
        delete dsRequest.params.selectedRecords;
      }
      dsRequest.params._selectedProperties = me.getSelectedPropertiesString();
      // Includes the context, it could be used in the hqlwhereclause
      isc.addProperties(dsRequest.params, me.view.getContextInfo(true, false));
      dsRequest.willHandleError = true;
      return this.Super('transformRequest', arguments);
    };

    ds.transformResponse = function (dsResponse, dsRequest, jsonData) {
      if (jsonData.response.message) {
        me.view.messageBar.setMessage(jsonData.response.message.messageType, null, jsonData.response.message.message);
      }
      return this.Super('transformResponse', arguments);
    };

    fields = this.getTreeGridFields(me.fields);
    ds.primaryKeys = {
      id: 'id'
    };
    return this.Super("setDataSource", [ds, fields]);
  },

  // Used to copy the fields from the OBViewGrid to the OBTreeGrid.
  // It does not copy the fields that start with underscore
  getTreeGridFields: function (fields) {
    var treeGridFields = isc.shallowClone(fields),
        i, nDeleted = 0;
    for (i = 0; i < treeGridFields.length; i++) {
      if (treeGridFields[i - nDeleted].name[0] === '_') {
        treeGridFields.splice(i - nDeleted, 1);
        nDeleted = nDeleted + 1;
      }
    }
    return treeGridFields;
  },

  // Adds to the request the parameters related with the node ordering
  // * prevNodeId: Id of the node placed right before the moved node. Null if there are none
  // * prevNodeId: Id of the node placed right after the moved node. Null if there are none
  addOrderedTreeParameters: function (dsRequest) {
    var childrenOfNewParent, prevNode, nextNode;
    if (this.orderedTree) {
      dsRequest.params.dropIndex = dsRequest.dropIndex;
      childrenOfNewParent = this.getData().getChildren(dsRequest.newParentNode);
      if (childrenOfNewParent.length !== 0) {
        if (dsRequest.dropIndex === 0) {
          nextNode = childrenOfNewParent[dsRequest.dropIndex];
          dsRequest.params.nextNodeId = nextNode.id;
        } else if (dsRequest.dropIndex === childrenOfNewParent.length) {
          prevNode = childrenOfNewParent[dsRequest.dropIndex - 1];
          dsRequest.params.prevNodeId = prevNode.id;
        } else {
          prevNode = childrenOfNewParent[dsRequest.dropIndex - 1];
          dsRequest.params.prevNodeId = prevNode.id;
          nextNode = childrenOfNewParent[dsRequest.dropIndex];
          dsRequest.params.nextNodeId = nextNode.id;
        }
      }
    }
    return dsRequest;
  },

  // Returns a string that represents a jsonarray containing the ids of all the nodes selected in the view grid 
  getSelectedRecordsString: function () {
    var selectedRecordsString = '[',
        first = true,
        selectedRecords = this.view.viewGrid.getSelectedRecords(),
        len = selectedRecords.length,
        i;
    for (i = 0; i < len; i++) {
      if (first) {
        first = false;
        selectedRecordsString = selectedRecordsString + "'" + selectedRecords[i][OB.Constants.ID] + "'";
      } else {
        selectedRecordsString = selectedRecordsString + ',' + "'" + selectedRecords[i][OB.Constants.ID] + "'";
      }
    }
    selectedRecordsString = selectedRecordsString + ']';
    return selectedRecordsString;
  },

  // TODO: Remove?
  getParentTabRecordId: function () {
    var parentRecordId = null;
    if (!this.view.parentView) {
      return null;
    }
    return this.view.parentView.viewGrid.getSelectedRecord().id;
  },

  // Returns a string that represents a jsonarray containing the names of all the TreeGrid fields 
  getSelectedPropertiesString: function () {
    var selectedProperties = '[',
        first = true,
        len = this.fields.length,
        i;
    for (i = 0; i < len; i++) {
      if (first) {
        first = false;
        selectedProperties = selectedProperties + "'" + this.fields[i].name + "'";
      } else {
        selectedProperties = selectedProperties + ',' + "'" + this.fields[i].name + "'";
      }
    }
    selectedProperties = selectedProperties + ']';
    return selectedProperties;
  },

  // smartclients transferNodes does not update the tree it a node is moved within its same parent
  // do it here
  transferNodes: function (nodes, folder, index, sourceWidget, callback) {
    var node, dataSource, oldValues, dragTree, dropNeighbor, dataSourceProperties, i;
    if (this.movedToSameParent(nodes, folder)) {
      dragTree = sourceWidget.getData();
      dataSource = this.getDataSource();
      for (i = 0; i < nodes.length; i++) {
        node = nodes[i];
        oldValues = isc.addProperties({}, node);
        dataSourceProperties = {
          oldValues: oldValues,
          parentNode: this.data.getParent(node),
          newParentNode: folder,
          dragTree: dragTree,
          draggedNode: node,
          draggedNodeList: nodes,
          dropIndex: index
        };
        if (index > 0) {
          dataSourceProperties.dropNeighbor = this.data.getChildren(folder)[index - 1];
        }
        this.updateDataViaDataSource(node, dataSource, dataSourceProperties, sourceWidget);
      }
    } else {
      if (this.treeStructure === 'LinkToParent') {
        this.needsViewGridRefresh = true;
      }
    }

    this.Super('transferNodes', arguments);
  },

  // Checks if any node has been moved to another position of its current parent node
  movedToSameParent: function (nodes, newParent) {
    var i, len = nodes.length;
    for (i = 0; i < len; i++) {
      if (nodes[i].parentId !== newParent.id) {
        return false;
      }
    }
    return true;
  },

  // Returns a node from its id (the id property of the record, not the nodeId property)
  // If no node exists with that id, it return null
  getNodeByID: function (nodeId) {
    var i, node, nodeList = this.data.getNodeList();
    for (i = 0; i < nodeList.length; i++) {
      node = nodeList[i];
      if (node.id === nodeId) {
        return node;
      }
    }
    return null;
  },

  setView: function (view) {
    this.view = view;
  },

  // When a response is received from the datasource, it selects the nodes that were selected in the view grid
  treeDataArrived: function () {
    var i, selectedRecords, node;
    selectedRecords = this.view.viewGrid.getSelectedRecords();
    for (i = 0; i < selectedRecords.length; i++) {
      node = this.getNodeByID(selectedRecords[i].id);
      this.selectRecord(node);
    }
  },

  // Opens the record in the edit form
  // TODO: Check if the record is readonly?
  recordDoubleClick: function (viewer, record, recordNum, field, fieldNum, value, rawValue) {
    this.view.editRecordFromTreeGrid(record, false, (field ? field.name : null));
  },

  show: function () {
    this.copyCriteriaFromViewGrid();
    this.view.toolBar.updateButtonState();
    this.Super('show', arguments);
  },

  // When hiding the tree grid to show the view grid, only refresh it if needed
  hide: function () {
    this.copyCriteriaToViewGrid();
    if (this.needsViewGridRefresh) {
      this.needsViewGridRefresh = false;
      this.view.viewGrid.refreshGrid();
    }
    this.Super('hide', arguments);
  },

  copyFieldsFromViewGrid: function () {
    this.setFields(this.getTreeGridFields(this.view.viewGrid.getFields()));
  },

  copyCriteriaFromViewGrid: function () {
    var viewGridCriteria = this.view.viewGrid.getCriteria();
    this.setCriteria(viewGridCriteria);
  },

  copyCriteriaToViewGrid: function () {
    var treeGridCriteria = this.getCriteria();
    this.view.viewGrid.setCriteria(treeGridCriteria);
  },

  rowMouseDown: function (record, rowNum, colNum) {
    this.Super('rowMouseDown', arguments);
    if (!isc.EventHandler.ctrlKeyDown()) {
      this.deselectAllRecords();
    }
    this.selectRecord(rowNum);
  },

  recordClick: function (viewer, record, recordNum, field, fieldNum, value, rawValue) {
    if (isc.EH.getEventType() === 'mouseUp') {
      // Don't do anything on the mouseUp event, the record is actually selected in the mouseDown event
      return;
    }
    this.deselectAllRecords();
    this.selectRecord(recordNum);
  },

  selectionUpdated: function (record, recordList) {
    var me = this,
        callback = function () {
        me.delayedSelectionUpdated();
        };
    // wait 2 times longer than the fire on pause delay default
    this.fireOnPause('delayedSelectionUpdated_' + this.ID, callback, this.fireOnPauseDelay * 2);
  },

  delayedSelectionUpdated: function (record, recordList) {
    var selectedRecordId = this.getSelectedRecord() ? this.getSelectedRecord().id : null,
        length, tabViewPane, i;
    // refresh the tabs
    if (this.view.childTabSet) {
      length = this.view.childTabSet.tabs.length;
      for (i = 0; i < length; i++) {
        tabViewPane = this.view.childTabSet.tabs[i].pane;
        if (!selectedRecordId || selectedRecordId !== tabViewPane.parentRecordId) {
          tabViewPane.doRefreshContents(true);
        }
      }
    }
  },

  // Show the record in bold if it is a filter hit (when the tree grid is filtered, some records 
  // might be shown because they are parents of a filtered node, not because they are a filter hit themselves)
  getCellCSSText: function (record, rowNum, colNum) {
    if (record.notFilterHit) {
      return "color:#606060;";
    } else {
      return "";
    }
  },

  getFetchRequestParams: function (params) {
    return this.view.viewGrid.getFetchRequestParams(params);
  },

  // show or hide the filter button
  filterEditorSubmit: function (criteria) {
    this.checkShowFilterFunnelIcon(criteria);
  },

  clearFilter: function (keepFilterClause, noPerformAction) {
    var i = 0,
        fld, length;
    this.view.messageBar.hide();
    if (!keepFilterClause) {
      delete this.filterClause;
      delete this.sqlFilterClause;
    }
    this.forceRefresh = true;
    if (this.filterEditor) {
      if (this.filterEditor.getEditForm()) {
        this.filterEditor.getEditForm().clearValues();

        // clear the date values in a different way
        length = this.filterEditor.getEditForm().getFields().length;

        for (i = 0; i < length; i++) {
          fld = this.filterEditor.getEditForm().getFields()[i];
          if (fld.clearFilterValues) {
            fld.clearFilterValues();
          }
        }
      } else {
        this.filterEditor.setValuesAsCriteria(null);
      }
    }
    if (!noPerformAction) {
      this.filterEditor.performAction();
    }
  },

  // If any filter change, the view grid will have to te refreshed when the tree grid is hidden
  editorChanged: function (item) {
    this.needsViewGridRefresh = true;
    this.Super('editorChanged', arguments);
  },

  getCriteria: function () {
    var criteria = this.Super('getCriteria', arguments) || {};
    if ((criteria === null || !criteria.criteria) && this.initialCriteria) {
      criteria = isc.shallowClone(this.initialCriteria);
    }
    criteria = this.convertCriteria(criteria);
    return criteria;
  }

});