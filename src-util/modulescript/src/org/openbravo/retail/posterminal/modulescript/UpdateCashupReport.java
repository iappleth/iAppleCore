package org.openbravo.retail.posterminal.modulescript;

import org.apache.log4j.Logger;
import org.openbravo.database.ConnectionProvider;
import org.openbravo.modulescript.ModuleScript;
import org.openbravo.modulescript.ModuleScriptExecutionLimits;
import org.openbravo.modulescript.OpenbravoVersion;

public class UpdateCashupReport extends ModuleScript {

  private static final Logger log4j = Logger.getLogger(UpdateCashupReport.class);

  @Override
  public void execute() {
    log4j.info("Update CashUpReport structure ...");
    try {
      ConnectionProvider cp = getConnectionProvider();
      UpdateCashupReportData[] cashUps = getPaymentMethodCashup(cp);
      for (int i = 0; i < cashUps.length; i++) {
        log4j.info("UpdateCashupReport: "+cashUps[i].obposPaymentmethodcashupId+", "+cashUps[i].name+", "+cashUps[i].totalcounted);
        UpdateCashupReportData.updateCashupStartingCash(cp.getConnection(), cp, cashUps[i].totalcounted, cashUps[i].obposPaymentmethodcashupId);
      }
    } catch (Exception e) {
      handleError(e);
    }
  }

//  @Override
//  protected ModuleScriptExecutionLimits getModuleScriptExecutionLimits() {
//    return new ModuleScriptExecutionLimits("FF808181326CC34901326D53DBCF0018", null, 
//        new OpenbravoVersion(1,2,3110));
//  }
  
  private UpdateCashupReportData[] getPaymentMethodCashup(ConnectionProvider cp) throws Exception {
    return UpdateCashupReportData.selectPaymentMethodCashup(cp);
  }
}
