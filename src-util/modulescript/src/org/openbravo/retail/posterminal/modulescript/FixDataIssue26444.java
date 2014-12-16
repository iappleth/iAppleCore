/*
 ************************************************************************************
 * Copyright (C) 2014 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal.modulescript;

import org.openbravo.database.ConnectionProvider;
import org.openbravo.modulescript.ModuleScript;

public class FixDataIssue26444 extends ModuleScript {

  @Override
  public void execute() {
    try {
      ConnectionProvider cp = getConnectionProvider();

      String isFixed = FixDataIssue26444Data.selectExistsPreference(cp);
      if (isFixed.equals("1")) {
        return;
      }
      FixDataIssue26444Data.fixInvoice(cp);
      FixDataIssue26444Data.fixPaymentScheduleDetail(cp);
      FixDataIssue26444Data.deletePaymentSchedule(cp);
      FixDataIssue26444Data.insertPreference(cp);
    } catch (Exception e) {
      handleError(e);
    }
  }
}
