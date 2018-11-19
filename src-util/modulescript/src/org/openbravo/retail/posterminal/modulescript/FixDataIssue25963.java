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
 * All portions are Copyright (C) 2010-2017 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.retail.posterminal.modulescript;

import org.openbravo.database.ConnectionProvider;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openbravo.utils.FormatUtilities;
import org.openbravo.modulescript.ModuleScript;
import org.openbravo.modulescript.ModuleScriptExecutionLimits;
import org.openbravo.modulescript.OpenbravoVersion;

/**
 * 
 * @author Orekaria
 * Fixes issue 25963 related to a "'Y'" char in the backoffice preferences when it should be a "Y" 
 */
public class FixDataIssue25963 extends ModuleScript {

  private static final Logger log4j = LogManager.getLogger();
  private static final String RETAIL_PACK_MODULE_ID = "03FAB282A7BF47D3B1B242AC67F7845B";
  
  @Override
  public void execute() {

    try {
      ConnectionProvider cp = getConnectionProvider();
      int count = FixDataIssue25963Data.fix(cp);
      log4j.debug("Updated " + count + " OBPOS_retail.opendrawerfrommenu preferences");  
    } catch (Exception e) {
      handleError(e);
    }
  }
  
  @Override
  protected ModuleScriptExecutionLimits getModuleScriptExecutionLimits() {
    // The module script needs to be executed only when updating from a version
    // lower than 3.0RR14Q3 (Retail pack)(1.8.601)
    return new ModuleScriptExecutionLimits(RETAIL_PACK_MODULE_ID, null,
        new OpenbravoVersion(1, 8, 601));
  }
  
  @Override
  protected boolean executeOnInstall() {
    return false;
  }

  public static void main(String[] args) {

    // This method is provided for testing purposes.

  FixDataIssue25963 t = new FixDataIssue25963();
    t.execute();
  }
}
