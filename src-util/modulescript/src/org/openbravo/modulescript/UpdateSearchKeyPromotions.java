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
 * All portions are Copyright (C) 2024 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.modulescript;

import java.sql.PreparedStatement;

import org.openbravo.database.ConnectionProvider;

public class UpdateSearchKeyPromotions extends ModuleScript {

  @Override
  public void execute() {
    try {
      ConnectionProvider cp = getConnectionProvider();
      PreparedStatement ps = cp.getPreparedStatement(
          "UPDATE M_Offer SET value = SUBSTRING(name, 1, 30) WHERE value IS NULL");
      ps.executeUpdate();
    } catch (Exception e) {
      handleError(e);
    }
  }

  @Override
  protected ModuleScriptExecutionLimits getModuleScriptExecutionLimits() {
    return new ModuleScriptExecutionLimits("0", null, new OpenbravoVersion(3, 0, 243000));
  }
  
  @Override
  protected boolean executeOnInstall() {
    return false;
  }
}
