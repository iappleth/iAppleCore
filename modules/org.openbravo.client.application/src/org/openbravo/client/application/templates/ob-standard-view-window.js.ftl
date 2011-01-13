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
// contains the code for creating a class reflecting the standard window
//jslint
// tell the view manager what got loaded...
OB.Layout.ViewManager.loadedWindowClassName = '${data.windowClientClassName?js_string}';

isc.ClassFactory.defineClass('${data.windowClientClassName?js_string}', isc.OBStandardWindow).addProperties({
    windowId: '${data.windowId?js_string}', 
    viewProperties: {
      windowId: '${data.windowId?js_string}', 
      ${data.tabView}
    }
});

