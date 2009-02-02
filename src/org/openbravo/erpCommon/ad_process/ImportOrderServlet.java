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
 * Contributions are Copyright (C) 2001-2008 Openbravo S.L.
 ******************************************************************************
 */
package org.openbravo.erpCommon.ad_process;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.erpCommon.ad_actionButton.ActionButtonDefaultData;
import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.utils.FormatUtilities;
import org.openbravo.xmlEngine.XmlDocument;

public class ImportOrderServlet extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  public void init(ServletConfig config) {
    super.init(config);
    boolHist = false;
  }

  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException,
      ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);
    String process = ImportData.processId(this, "ImportOrderServlet");
    if (vars.commandIn("DEFAULT")) {
      String strTabId = vars.getGlobalVariable("inpTabId", "ImportOrderServlet|tabId");
      String strWindowId = vars.getGlobalVariable("inpwindowId", "ImportOrderServlet|windowId");
      // String strKey = vars.getGlobalVariable("inpKey",
      // "ImportOrderServlet|key");
      String strKey = "00";
      String strDeleteOld = vars.getStringParameter("inpDeleteOld", "N");
      String strProcessOrders = vars.getStringParameter("inpProcessOrders", "Y");
      printPage(response, vars, process, strWindowId, strTabId, strKey, strDeleteOld,
          strProcessOrders);
    } else if (vars.commandIn("SAVE")) {
      String strDeleteOld = vars.getStringParameter("inpDeleteOld", "N");
      String strProcessOrders = vars.getStringParameter("inpProcessOrders", "N");
      String strRecord = vars.getGlobalVariable("inpKey", "ImportOrderServlet|key");
      String strTabId = vars.getRequestGlobalVariable("inpTabId", "ImportOrderServlet|tabId");
      // String strWindowId = vars.getRequestGlobalVariable("inpwindowId",
      // "ImportOrderServlet|windowId");

      ActionButtonDefaultData[] tab = ActionButtonDefaultData.windowName(this, strTabId);
      String strWindowPath = "";
      String strTabName = "";
      if (tab != null && tab.length != 0) {
        strTabName = FormatUtilities.replace(tab[0].name);
        if (tab[0].help.equals("Y"))
          strWindowPath = "../utility/WindowTree_FS.html?inpTabId=" + strTabId;
        else
          strWindowPath = "../" + FormatUtilities.replace(tab[0].description) + "/" + strTabName
              + "_Relation.html";
      } else
        strWindowPath = strDefaultServlet;

      ImportOrder io = new ImportOrder(this, process, strRecord, strDeleteOld.equals("Y"),
          strProcessOrders.equals("Y"));
      io.startProcess(vars);
      OBError myError = io.getError();
      vars.setMessage(strTabId, myError);
      printPageClosePopUp(response, vars, strWindowPath);
    } else
      pageErrorPopUp(response);
  }

  void printPage(HttpServletResponse response, VariablesSecureApp vars, String strProcessId,
      String strWindowId, String strTabId, String strRecordId, String strDeleteOld,
      String strProcessOrders) throws IOException, ServletException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: process ImportOrderServlet");
    ActionButtonDefaultData[] data = null;
    String strHelp = "", strDescription = "";
    if (vars.getLanguage().equals("en_US"))
      data = ActionButtonDefaultData.select(this, strProcessId);
    else
      data = ActionButtonDefaultData.selectLanguage(this, vars.getLanguage(), strProcessId);
    if (data != null && data.length != 0) {
      strDescription = data[0].description;
      strHelp = data[0].help;
    }
    String[] discard = { "" };
    if (strHelp.equals(""))
      discard[0] = new String("helpDiscard");
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/ad_process/ImportOrderServlet").createXmlDocument();
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("theme", vars.getTheme());
    xmlDocument.setParameter("question", Utility.messageBD(this, "StartProcess?", vars
        .getLanguage()));
    xmlDocument.setParameter("description", strDescription);
    xmlDocument.setParameter("help", strHelp);
    xmlDocument.setParameter("windowId", strWindowId);
    xmlDocument.setParameter("tabId", strTabId);
    xmlDocument.setParameter("recordId", strRecordId);
    xmlDocument.setParameter("deleteOld", strDeleteOld);
    xmlDocument.setParameter("processOrders", strProcessOrders);

    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  public String getServletInfo() {
    return "Servlet ImportOrderServlet";
  } // end of getServletInfo() method
}
