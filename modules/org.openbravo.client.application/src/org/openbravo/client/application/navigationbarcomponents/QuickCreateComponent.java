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
package org.openbravo.client.application.navigationbarcomponents;

/**
 * Provides a widget to open a classic view from the database in create mode.
 * 
 * @author mtaal
 */
public class QuickCreateComponent extends QuickLaunchComponent {

  public static final String DATASOURCE_ID = "C17951F970E942FD9F3771B7BE91D049";

  public String getDataSourceId() {
    return DATASOURCE_ID;
  }

  public String getPrefixRecent() {
    return "UINAVBA_NEW";
  }

  public String getCommand() {
    return "NEW";
  }

  public String getLabel() {
    return "UINAVBA_CREATE_NEW";
  }

  public String getIcon() {
    return "[SKINIMG]../../org.openbravo.client.application/images/navbar/ico-asterisk.gif";
  }

  public String getRecentPropertyName() {
    return "UINAVBA_RecentCreateList";
  }

  public String getKeyboardShortcutId() {
    return "NavBar_OBQuickCreate";
  }

}
