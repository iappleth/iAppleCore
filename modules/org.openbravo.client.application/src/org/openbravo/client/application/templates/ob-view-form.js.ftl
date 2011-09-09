<#--
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
-->
{
    // this this is the view
    statusBarFields: this.statusBarFields,
    
<#--
    // except for the fields all other form properties should be added to the formProperties
    // the formProperties are re-used for inline grid editing
-->
    obFormProperties: {
      onFieldChanged: function(form, item, value) {
        var f = form || this,
            context = this.view.getContextInfo(false, true),
            currentValues = f.view.getCurrentValues(), otherItem;
        <#list data.fieldHandler.fields as field>
        <#if field.readOnlyIf != "">
            f.disableItem('${field.name}', ${field.readOnlyIf});
        </#if>
        </#list>
      }
    }
}