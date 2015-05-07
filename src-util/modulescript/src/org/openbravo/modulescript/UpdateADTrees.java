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
 * All portions are Copyright (C) 2014 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.modulescript;

import org.apache.log4j.Logger;
import org.openbravo.database.ConnectionProvider;

/**
 * 
 * @author AugustoMauch
 */
public class UpdateADTrees extends ModuleScript {

  private static final Logger log4j = Logger.getLogger(UpdateADTrees.class);

  @Override
  public void execute() {
    try {
      ConnectionProvider cp = getConnectionProvider();
      // Fills in the ad_table_id column of the existing ad_tree table, using the treetype property to patch each ad_tree with its corresponding ad_table
      UpdateADTreesData.update(cp);
      // See issue https://issues.openbravo.com/view.php?id=27918
      UpdateADTreesData.fixAccountingReportSetup(cp);
      // Manually set to null the TreeType column of the FinancialMgmtAccountingReport table. Needs to be done manually to prevent a constraint exception that happens because of this design defect https://issues.openbravo.com/view.php?id=12577
      UpdateADTreesData.deleteTreeTypeFromFinancialMgmtAccountingReport(cp);
    } catch (Exception e) {
      handleError(e);
    }
  }
}
