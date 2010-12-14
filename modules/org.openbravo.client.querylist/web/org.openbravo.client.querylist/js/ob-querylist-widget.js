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
 * All portions are Copyright (C) 2010 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
// = OBQueryListWidget =
//
// Implements the Query / List widget superclass.
//
isc.defineClass('OBQueryListWidget', isc.OBWidget).addProperties({

  widgetId: null,
  widgetInstanceId: null,
  fields: null,
  grid: null,
  gridProperties: {},
  
  createWindowContents: function(){
    var layout = isc.VStack.create({
      height: '100%',
      width: '100%',
      styleName: ''
    }), url, params = {};
    
    this.grid = isc.OBQueryListGrid.create(isc.addProperties({
      widget: this,
      fields: this.fields
    }, this.gridProperties));
    
    layout.addMembers(this.grid);
    return layout;
  },
  
  refresh: function(){
    this.grid.invalidateCache();
    this.grid.filterData();
  }
  
});

isc.ClassFactory.defineClass('OBQueryListGrid', isc.ListGrid);

isc.OBQueryListGrid.addProperties({
  width: '100%',
  height: '100%',
  dataSource: null,
  
  // some common settings
  //showFilterEditor: false,
  //filterOnKeypress: false,
  
  canEdit: false,
  alternateRecordStyles: true,
  canReorderFields: true,
  canFreezeFields: false,
  canGroupBy: false,
  autoFetchData: true,
  //canAutoFitFields: false,
  
  //autoFitFieldWidths: true,
  //autoFitWidthApproach: 'title',
  
  initWidget: function(){
    this.setDataSource(OB.Datasource.get('DD17275427E94026AD721067C3C91C18', this));
    return this.Super('initWidget', arguments);
  },
  
  setDataSource: function(ds){
    if (ds) {
      ds.fields = this.widget.fields;
      this.dataSource = ds;
    }
  },
  
  filterData: function(criteria, callback, requestProperties){
    if (!criteria) {
      criteria = {};
    }
    if (!requestProperties) {
      requestProperties = {};
    }
    requestProperties.showPrompt = false;
    criteria.widgetInstanceId = this.widget.dbInstanceId;
    return this.Super('filterData', [criteria, callback, requestProperties]);
  },
  
  fetchData: function(criteria, callback, requestProperties){
    if (!criteria) {
      criteria = {};
    }
    if (!requestProperties) {
      requestProperties = {};
    }
    requestProperties.showPrompt = false;
    criteria.widgetInstanceId = this.widget.dbInstanceId;
    return this.Super('fetchData', [criteria, callback, requestProperties]);
  }  
});
