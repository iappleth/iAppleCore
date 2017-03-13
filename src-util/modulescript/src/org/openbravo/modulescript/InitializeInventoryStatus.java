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
 * All portions are Copyright (C) 2017 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.modulescript;

import org.apache.log4j.Logger;
import org.openbravo.database.ConnectionProvider;
import org.openbravo.utils.FormatUtilities;

public class InitializeInventoryStatus extends ModuleScript {
  
  final static String INVENTORY_STATUS_NO_NEGATIVE_STOCK = "7B3DC15A20234C418D26EECDC5D59003";

  @Override
  // Initialize the Inventory Status for Clients with allowNegativeStock = 'Y'
  public void execute() {
    try {
      ConnectionProvider cp = getConnectionProvider();
      boolean isExecuted= InitializeInventoryStatusData.isExecuted(cp);
      if (!isExecuted){
        InitializeInventoryStatusData [] clients = InitializeInventoryStatusData.getClientIds(cp);
        for(int i =0; i< clients.length;i++){
          if (!InitializeInventoryStatusData.isNegativeStockAllowed(cp, clients[i].adClientId)){
            InitializeInventoryStatusData.initializeInventoryStatus(cp, INVENTORY_STATUS_NO_NEGATIVE_STOCK, clients[i].adClientId);
          }
        }
        InitializeInventoryStatusData.createPreference(cp);
      }
    } catch (Exception e) {
      handleError(e);
    }
  }
  
  @Override
  protected ModuleScriptExecutionLimits getModuleScriptExecutionLimits() {
    return new ModuleScriptExecutionLimits("0", new OpenbravoVersion(3,0,25367), 
        null);
  }
}
