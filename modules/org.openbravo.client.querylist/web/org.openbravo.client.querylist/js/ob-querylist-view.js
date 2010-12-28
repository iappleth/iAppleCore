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
isc.defineClass('OBQueryListView', isc.PortalLayout);

isc.OBQueryListView.addProperties({
  widgetInstanceId: null,
  fields: null,

  numColumns: 1,
  showColumnMenus: false,
  
  
  initWidget: function(args){
    this.Super('initWidget', arguments);

    this.widgetInstanceId = args.widgetInstanceId;
    this.fields = args.fields;

    console.log(this.widgetInstanceId);
    var widgetInstance = isc.OBQueryListWidget.create(isc.addProperties({
      viewMode: 'maximized'
      }));
    this.addPortlet(widgetInstance);
/*
    var layout = isc.VStack.create({
      height: '100%',
      width: '100%',
      styleName: ''
    }), url, params = {};
    
    this.grid = isc.OBQueryListGrid.create(isc.addProperties({
      widget: this.widget,
      fields: this.widget.fields
    }, this.gridProperties));
    
    layout.addMembers(this.grid);
*/
  }
});


