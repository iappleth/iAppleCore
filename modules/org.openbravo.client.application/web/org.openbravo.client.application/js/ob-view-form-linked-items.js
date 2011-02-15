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
// = OBLinkedItems =
//
// Represents the linked items section shown in the bottom of the form.
// Note is not shown for new records.
//
isc.ClassFactory.defineClass('OBLinkedItemSectionItem', isc.OBSectionItem);

isc.OBLinkedItemSectionItem.addProperties({
  // as the name is always the same there should be at most
  // one linked item section per form
  name: '_linkedItems_',
  
  // note: setting these apparently completely hides the section
  // width: '100%',
  // height: '100%',
  
  overflow: 'hidden',
  
  canFocus: true,
  
  // don't expand as a default
  sectionExpanded: false,
  
  prompt: OB.I18N.getLabel('OBUIAPP_LinkedItemsPrompt'),
  
  canvasItem: null,
  
  visible: false,
  
  // note formitems don't have an initWidget but an init method
  init: function(){
  
    // override the one passed in
    this.defaultValue = OB.I18N.getLabel('OBUIAPP_LinkedItemsTitle');
    this.sectionExpanded = false;
    
    // tell the form who we are
    this.form.linkedItemSection = this;
    
    return this.Super('init', arguments);
  },
  
  getLinkedItemPart: function(){
    if (!this.canvasItem) {
      this.canvasItem = this.form.getField(this.itemIds[0]);
    }
    return this.canvasItem.canvas;
  },
  
  setRecordInfo: function(entity, id){
    this.getLinkedItemPart().setRecordInfo(entity, id);
  },
  
  collapseSection: function(){
    var ret = this.Super('collapseSection', arguments);
    this.getLinkedItemPart().setExpanded(false);
    return ret;
  },
  
  expandSection: function(){
    // if this is not there then when clicking inside the 
    // section item will visualize it
    if (!this.isVisible()) {
      return;
    }
    var ret = this.Super('expandSection', arguments);
    this.getLinkedItemPart().setExpanded(true);
    return ret;
  },
  
  hide: function(){
    this.collapseSection();
    this.prompt = '';
    return this.Super('hide', arguments);
  },
  
  visibilityChanged: function(state) {
    if (state) {
      this.prompt = OB.I18N.getLabel('OBUIAPP_LinkedItemsPrompt');      
    } else {
      this.prompt = '';
    }
  }
});

isc.ClassFactory.defineClass('OBLinkedItemLayout', isc.VLayout);

isc.OBLinkedItemLayout.addProperties({

  // set to true when the content has been created at first expand
  isInitialized: false,
  
  layoutMargin: 5,
  
  // setting width/height makes the canvasitem to be hidden after a few
  // clicks on the section item, so don't do that for now
  // width: '100%',
  // height: '100%',
  
  
  /** 
   * Loads categories to the categories grid
   **/
  loadCategories: function(){
    var windowId = this.getForm().view.standardWindow.windowId;
    var entityName = this.getForm().view.entity;
    var actionURL = OB.Application.contextUrl + 'utility/UsedByLink.html';
    
    var that = this;
    
    var callback = function(response, data, request){
      var msg = data.msg;
      var usedByLinkData = data.usedByLinkData;
      if (msg !== null) {
        that.messageLabel.setContents(msg);
      }
      
      if (usedByLinkData === null) {
        usedByLinkData = [];
      }
      
      that.linkedItemCategoryDS.setCacheData(usedByLinkData, true);
      that.linkedItemCategoryListGrid.invalidateCache();
      that.linkedItemCategoryListGrid.filterData();
    };
    
    var reqObj = {
      params: {
        Command: 'JSONCategory',
        windowId: windowId,
        entityName: entityName
      },
      callback: callback,
      evalResult: true,
      httpMethod: 'POST',
      useSimpleHttp: true,
      actionURL: actionURL
    };
    
    isc.RPCManager.sendRequest(reqObj);
  },
  
  /** 
   * Loads linked items of a chosen category to linkedItemListGrid
   * */
  loadLinkedItems: function(record){
  
    var windowId = this.getForm().view.standardWindow.windowId;
    var entityName = this.getForm().view.entity;
    var actionURL = OB.Application.contextUrl + 'utility/UsedByLink.html';
    
    var that = this;
    /* loads linked items to the child grid */
    var callback = function(response, data, request){
      var msg = data.msg;
      var usedByLinkData = data.usedByLinkData;
      if (msg !== null) {
        that.messageLabel.setContents(msg);
      }
      
      if (usedByLinkData === null) {
        usedByLinkData = [];
      }
      that.linkedItemListGrid.invalidateCache();
      that.linkedItemDS.setCacheData(usedByLinkData, true);
      that.linkedItemListGrid.filterData();
    };
    var reqObj = {
      params: {
        Command: 'JSONLinkedItem',
        windowId: windowId,
        entityName: entityName,
        adTabId: record.adTabId,
        tableName: record.tableName,
        columnName: record.columnName
      },
      callback: callback,
      evalResult: true,
      httpMethod: 'POST',
      useSimpleHttp: true,
      actionURL: actionURL
    };
    isc.RPCManager.sendRequest(reqObj);
    
  },
  
  /**
   * Opens linked item in a new window
   */
  openLinkedItemInNewWindow: function(record){
  
    var windowId = record.adWindowId;
    var entityName = record.tableName;
    var recordId = record.id;
    var tabId = record.adTabId;
    var tabTitle = record.adMenuName;
    
    var openObject = {
      viewId: '_' + windowId,
      targetEntity: entityName,
      targetRecordId: recordId,
      targetTabId: tabId,
      tabTitle: tabTitle,
      windowId: windowId
    };
    
    OB.Layout.ViewManager.openView(openObject.viewId, openObject);
  },
  
  /**
   * Cleans linked items grid when the filter is used.
   **/
  cleanLinkedItemsListGrid: function(){
    this.linkedItemListGrid.invalidateCache();
    this.linkedItemDS.setCacheData([], true);
    this.linkedItemListGrid.filterData();
    this.linkedItemCategoryListGrid.deselectAllRecords();
  },
  
  /** 
   * Initializes the widget
   **/
  initWidget: function(){
    var ret = this.Super('initWidget', arguments);
    
    // the list of linked items
    this.linkedItemDS = isc.DataSource.create({
      fields: [{
        name: "name",
        title: OB.I18N.getLabel('OBUIAPP_LinkedItemsListGridHeader'),
        type: 'text',
        filterEditorType: 'OBTextItem'
      }],
      clientOnly: true
    });
    this.linkedItemListGrid = isc.OBGrid.create({
      width: '50%',
      height: 300,
      baseStyle: 'OBLinksGrid',
      dataSource: this.linkedItemDS,
      autoFetchData: true,
      showFilterEditor: true,
      selectionType: 'single',
      filterOnKeypress: true,
      emptyMessage: OB.I18N.getLabel('OBUIAPP_LinkedItemsEmptyMessage'),
      layout: this,
      recordClick: 'this.layout.openLinkedItemInNewWindow(record)',
      fetchData: function(criteria, callback, requestProperties){
        this.checkShowFilterFunnelIcon(criteria);
        return this.Super('fetchData', arguments);
      },
      filterData: function(criteria, callback, requestProperties){
        this.checkShowFilterFunnelIcon(criteria);
        return this.Super('filterData', arguments);
      }
    });
    
    
    // the list of linked item categories
    this.linkedItemCategoryDS = isc.DataSource.create({
      fields: [{
        name: 'fullElementName',
        title: OB.I18N.getLabel('OBUIAPP_LinkedItemsCategoryListGridHeader'),
        type: 'text',
        canFilter: true,
        filterEditorType: 'OBTextItem'
      }],
      clientOnly: true,
      testData: []
    });
    this.linkedItemCategoryListGrid = isc.OBGrid.create({
      width: '50%',
      autoFetchData: true,
      height: 300,
      dataSource: this.linkedItemCategoryDS,
      layout: this,
      recordClick: 'this.layout.loadLinkedItems(record)',
      showFilterEditor: true,
      selectionType: 'single',
      filterOnKeypress: true,
      filterEditorSubmit: 'this.layout.cleanLinkedItemsListGrid()',
      fetchData: function(criteria, callback, requestProperties){
        this.checkShowFilterFunnelIcon(criteria);
        return this.Super('fetchData', arguments);
      },
      filterData: function(criteria, callback, requestProperties){
        this.checkShowFilterFunnelIcon(criteria);
        return this.Super('filterData', arguments);
      }
    });
    
    var hLayout = isc.HLayout.create({
      layoutTopMargin: 5
    });
    
    // add the grids to the horizontal layout
    hLayout.addMember(this.linkedItemCategoryListGrid);
    hLayout.addMember(this.linkedItemListGrid);
    
    this.messageLabel = isc.Label.create({
      ID: 'messageLabel',
      width: '100%',
      height: '100%',
      canFocus: true
    });
    
    // add the grids to the vertical layout
    this.addMember(this.messageLabel);
    this.addMember(hLayout);
    
    return ret;
  },
  
  
  // never disable this item
  isDisabled: function(){
    return false;
  },
  
  getForm: function(){
    return this.canvasItem.form;
  },
  
  // is called when a new record is loaded in the form
  // in this method the linked item section should be cleared
  // but not reload its content, that's done when the section
  // gets expanded
  setRecordInfo: function(entity, id){
    this.entity = entity;
    // use recordId instead of id, as id is often used to keep
    // html ids
    this.recordId = id;
    this.isInitialized = false;
  },
  
  
  // is called when the section expands/collapse
  // the linked items should not be loaded before the section actually expands
  setExpanded: function(expanded){
    if (expanded && !this.isInitialized) {
    
      this.loadCategories();
      
      // this part should stay also for linked items
      this.isInitialized = true;
    }
  },
  
  // ensure that the view gets activated
  focusChanged: function(){
    var view = this.getForm().view;
    if (view && view.setAsActiveView) {
      view.setAsActiveView();
    }
    return this.Super('focusChanged', arguments);
  }
});


isc.ClassFactory.defineClass('OBLinkedItemCanvasItem', isc.CanvasItem);

isc.OBLinkedItemCanvasItem.addProperties({

  canFocus: true,
  
  // setting width/height makes the canvasitem to be hidden after a few
  // clicks on the section item, so don't do that for now
  // width: '100%',
  // height: '100%',
  
  showTitle: false,
  overflow: 'auto',
  // note that explicitly setting the canvas gives an error as not
  // all props are set correctly on the canvas (for example the
  // pointer back to this item: canvasItem
  // for setting more properties use canvasProperties, etc. see
  // the docs
  canvasConstructor: 'OBLinkedItemLayout',
  
  // never disable this one
  isDisabled: function(){
    return false;
  }
  
});
