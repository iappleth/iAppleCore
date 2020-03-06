/*
 ************************************************************************************
 * Copyright (C) 2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

package org.openbravo.retail.posterminal.modulescript;

import java.util.UUID;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;


import org.openbravo.database.ConnectionProvider;
import org.openbravo.modulescript.ModuleScript;
import org.openbravo.modulescript.ModuleScriptExecutionLimits;
import org.openbravo.modulescript.OpenbravoVersion;

public class SetServicesTrancheInProduct extends ModuleScript {

  private static final Logger log4j = LogManager.getLogger();
  private static final String RETAIL_PACK_MODULE_ID = "03FAB282A7BF47D3B1B242AC67F7845B";

  @Override
  public void execute() {
    try {
      ConnectionProvider cp = getConnectionProvider();    
      SetServicesTrancheInProductData.updateMaximunPrice(cp.getConnection(), cp);
      SetServicesTrancheInProductData.updateMinimunPrice(cp.getConnection(), cp);
      
    } catch (

    Exception e) {
      log4j.error("Errors setting minimun and maximun price associated to product. ");
      handleError(e);
    }
  }

  @Override
  protected ModuleScriptExecutionLimits getModuleScriptExecutionLimits() {
    return new ModuleScriptExecutionLimits(RETAIL_PACK_MODULE_ID, null,
        new OpenbravoVersion(1, 8, 5000));
  }

  @Override
  protected boolean executeOnInstall() {
    return false;
  }

}
