/*
 ******************************************************************************
 * The contents of this file are subject to the   Compiere License  Version 1.1
 * ("License"); You may not use this file except in compliance with the License
 * You may obtain a copy of the License at http://www.compiere.org/license.html
 * Software distributed under the License is distributed on an  "AS IS"  basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for
 * the specific language governing rights and limitations under the License.
 * The Original Code is                  Compiere  ERP & CRM  Business Solution
 * The Initial Developer of the Original Code is Jorg Janke  and ComPiere, Inc.
 * Portions created by Jorg Janke are Copyright (C) 1999-2001 Jorg Janke, parts
 * created by ComPiere are Copyright (C) ComPiere, Inc.;   All Rights Reserved.
 * Contributor(s): Openbravo SL
 * Contributions are Copyright (C) 2001-2006 Openbravo S.L.
 ******************************************************************************
*/
package org.openbravo.erpCommon.ad_process;

import org.openbravo.erpCommon.ad_actionButton.*;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.erpCommon.utility.ComboTableData;
import org.openbravo.utils.FormatUtilities;
import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.xmlEngine.XmlDocument;
import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;


public class ImportBudgetServlet extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  public void init (ServletConfig config) {
    super.init(config);
    boolHist = false;
  }

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);

    String process = ImportData.processId(this, "ImportBudget");
    if (vars.commandIn("DEFAULT")) {
      String strTabId = vars.getGlobalVariable("inpTabId", "ImportBudgetServlet|tabId");
      String strWindowId = vars.getGlobalVariable("inpwindowId", "ImportBudgetServlet|windowId");
      //String strKey = vars.getGlobalVariable("inpKey", "ImportBudgetServlet|key");
      String strKey = "00";
      String strDeleteOld = vars.getStringParameter("inpDeleteOld", "Y");
      printPage(response, vars, process, strWindowId, strTabId, strKey, strDeleteOld);
    } else if (vars.commandIn("SAVE")) {
      String strDeleteOld = vars.getStringParameter("inpDeleteOld", "Y");
      String strRecord = vars.getGlobalVariable("inpKey", "ImportBudgetServlet|key");
      String strTabId = vars.getRequestGlobalVariable("inpTabId", "ImportBudgetServlet|tabId");
      String strWindowId = vars.getRequestGlobalVariable("inpwindowId", "ImportBudgetServlet|windowId");
      String strBudget = vars.getRequestGlobalVariable("inpBudgetId","ImportBudgetServlet|inpBudgetId");

      ActionButtonDefaultData[] tab = ActionButtonDefaultData.windowName(this, strTabId);
      String strWindowPath="";
      String strTabName="";
      if (tab!=null && tab.length!=0) {
        strTabName = FormatUtilities.replace(tab[0].name);
        if (tab[0].help.equals("Y")) strWindowPath="../utility/WindowTree_FS.html?inpTabId=" + strTabId;
        else strWindowPath = "../" + FormatUtilities.replace(tab[0].description) + "/" + strTabName + "_Relation.html";
      } else strWindowPath = strDefaultServlet;

      ImportBudget b = new ImportBudget(this, process, strRecord, strBudget, strDeleteOld.equals("Y"));
      b.startProcess(vars);
      String strMessage = b.getLog();
      if (!strMessage.equals("")) vars.setSessionValue(strWindowId + "|" + strTabName + ".message", strMessage);
      printPageClosePopUp(response, vars, strWindowPath);
    } else pageErrorPopUp(response);
  }


  void printPage(HttpServletResponse response, VariablesSecureApp vars, String strProcessId, String strWindowId, String strTabId, String strRecordId, String strDeleteOld) throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: process ImportBudgetServlet");
    ActionButtonDefaultData[] data = null;
    String strHelp="", strDescription="";
    if (vars.getLanguage().equals("en_US")) data = ActionButtonDefaultData.select(this, strProcessId);
    else data = ActionButtonDefaultData.selectLanguage(this, vars.getLanguage(), strProcessId);
    if (data!=null && data.length!=0) {
      strDescription = data[0].description;
      strHelp = data[0].help;
    }
    String[] discard = {""};
    if (strHelp.equals("")) discard[0] = new String("helpDiscard");
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_process/ImportBudgetServlet").createXmlDocument();
    xmlDocument.setParameter("language", "LNG_POR_DEFECTO=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("direction", "var baseDirection = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("theme", vars.getTheme());
    xmlDocument.setParameter("question", Utility.messageBD(this, "StartProcess?", vars.getLanguage()));
    xmlDocument.setParameter("description", strDescription);
    xmlDocument.setParameter("help", strHelp);
    xmlDocument.setParameter("windowId", strWindowId);
    xmlDocument.setParameter("tabId", strTabId);
    xmlDocument.setParameter("recordId", strRecordId);
    xmlDocument.setParameter("deleteOld", strDeleteOld);

	try {
		ComboTableData comboTableData = new ComboTableData(vars, this, "TABLEDIR", "C_Budget_ID", "", "", Utility.getContext(this, vars, "#User_Org", strWindowId), Utility.getContext(this, vars, "#User_Client", strWindowId), 0);
		Utility.fillSQLParameters(this, vars, null, comboTableData, strWindowId, "");
		xmlDocument.setData("reportC_BUDGET","liststructure", comboTableData.select(false));
		comboTableData = null;
	} catch (Exception ex) {
		throw new ServletException(ex);
	}


    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  public String getServletInfo() {
    return "Servlet ImportBudgetServlet";
  } // end of getServletInfo() method
}
