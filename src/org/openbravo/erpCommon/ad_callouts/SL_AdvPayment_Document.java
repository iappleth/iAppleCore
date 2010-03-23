package org.openbravo.erpCommon.ad_callouts;

import javax.servlet.ServletException;

import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.erpCommon.utility.Utility;

public class SL_AdvPayment_Document extends SimpleCallout {

  private static final long serialVersionUID = 1L;

  @Override
  protected void execute(CalloutInfo info) throws ServletException {
    VariablesSecureApp vars = info.vars;
    String strWindowNo = info.getWindowId();
    String strTableNameId = vars.getStringParameter("inpkeyColumnId");
    String strDocType_Id = vars.getStringParameter("inpcDoctypeId");
    String strTableName = strTableNameId.substring(0, strTableNameId.length() - 3);
    String strDocumentNo = Utility.getDocumentNo(this, vars, strWindowNo, strTableName,
        strDocType_Id, strDocType_Id, false, false);
    info.addResult("DocumentNo", "<" + strDocumentNo + ">");
  }

}
