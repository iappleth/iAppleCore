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
isc.ClassFactory.defineClass('OBSelectorFilterSelectItem', SelectItem);

isc.OBSelectorFilterSelectItem.addProperties({
  pickListFields: [{
    name: OB.Constants.IDENTIFIER,
    displayField: OB.Constants.IDENTIFIER,
    valueField: OB.Constants.ID
  }],

  init: function() {
    OB.Datasource.get(this.entity, this);
    this.Super('init', arguments);
  },

  setDataSource: function(ds) {
    this.optionDataSource = ds;
  },

  change: function(form, item, value, oldValue) {
    var criteria = {};
    criteria[this.displayField] = value;
    this.selectorWindow.selectorGrid.filterData(criteria);
  }
});
