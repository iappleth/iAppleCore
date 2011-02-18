/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.0  (the  "License"),  being   the  Mozilla   Public  License
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
// jslint

OB.I18N.labels = {
<#list data.labels as label>
'${label.key?js_string}':  '${label.value?js_string}'<#if label_has_next>,</#if>
</#list>
};

OB.I18N.getLabel = function(key, params) {
    if (!OB.I18N.labels[key]) {
        return 'UNDEFINED ' + key;
    }
    var label = OB.I18N.labels[key];
    if (params && params.length && params.length > 0) {
        for (var i = 0; i < params.length; i++) {
            label = label.replace("%" + i, params[i]);
        }
    }
    return label;
};