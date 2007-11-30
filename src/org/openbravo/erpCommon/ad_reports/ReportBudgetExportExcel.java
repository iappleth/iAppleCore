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
 * The Initial Developer of the Original Code is Openbravo SL 
 * All portions are Copyright (C) 2001-2006 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.erpCommon.ad_reports;

import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.xmlEngine.XmlDocument;
import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class ReportBudgetExportExcel extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);


    if (vars.commandIn("DEFAULT")){
      String strKey = vars.getRequiredGlobalVariable("inpcBudgetId", "ReportBudgetGenerateExcel|inpcBudgetId");
      printPageDataExportExcel(response, vars, strKey);
    } else pageErrorPopUp(response);
  }

  void printPageDataExportExcel(HttpServletResponse response, VariablesSecureApp vars, String strBudgetId) throws IOException, ServletException {

    if (log4j.isDebugEnabled()) log4j.debug("Output: EXCEL");

    vars.removeSessionValue("ReportBudgetGenerateExcel|inpTabId");

    response.setContentType("application/xls");
    PrintWriter out = response.getWriter();

    XmlDocument xmlDocument=null;
    ReportBudgetGenerateExcelData[] data=null;
    data = ReportBudgetGenerateExcelData.selectLines(this, vars.getLanguage(), strBudgetId);

    xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_reports/ReportBudgetGenerateExcelXLS").createXmlDocument();

    xmlDocument.setParameter("direction", "var baseDirection = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "LNG_POR_DEFECTO=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("theme", vars.getTheme());

    xmlDocument.setData("structure1", data);
    out.println(xmlDocument.print());

  }

  public String getServletInfo() {
    return "Servlet ReportBudgetGenerateExcel.";
  } // end of getServletInfo() method
}
