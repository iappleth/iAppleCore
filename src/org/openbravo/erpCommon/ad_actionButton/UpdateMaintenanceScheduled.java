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
 * All portions are Copyright (C) 2001-2008 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
*/
package org.openbravo.erpCommon.ad_actionButton;

import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.utils.FormatUtilities;
import org.openbravo.base.secureApp.*;
import org.openbravo.xmlEngine.XmlDocument;
import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import java.math.BigDecimal;

// imports for transactions
import java.sql.Connection;

import org.openbravo.erpCommon.utility.ComboTableData;

public class UpdateMaintenanceScheduled extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;
  static final BigDecimal ZERO = new BigDecimal(0.0);
  

  public void init (ServletConfig config) {
    super.init(config);
    boolHist = false;
  }

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);
    if (vars.commandIn("DEFAULT")) {
      vars.getRequestGlobalVariable("inppartdate", "UpdateMaintenanceScheduled|inppartdate");

      String strWindowId = vars.getStringParameter("inpwindowId");
      String strKey = vars.getRequiredStringParameter("inpmaMaintPartId");
      String strTabId = vars.getStringParameter("inpTabId");
      String strPartDate = vars.getRequiredStringParameter("inppartdate");
      //vars.removeSessionValue("UpdateMaintenanceScheduled|inpmaMaintScheduledId");
      //vars.removeSessionValue("UpdateMaintenanceScheduled|inppartdate");

      printPageDataSheet(response, vars, strKey, strWindowId, strTabId, strPartDate, strPartDate, null);
    } else if (vars.commandIn("FIND")) {
      String strWindowId = vars.getRequiredStringParameter("inpWindowId");
      String strKey = vars.getRequiredStringParameter("inpmaMaintPartId");
      String strTabId = vars.getStringParameter("inpTabId");
      String strPartDateFrom = vars.getStringParameter("inpPartDateFrom");
      String strPartDateTo = vars.getStringParameter("inpPartDateTo");
      String strMaintType = vars.getStringParameter("inpMaintType");


      printPageDataSheet(response, vars, strKey, strWindowId, strTabId, strPartDateFrom, strPartDateTo, strMaintType);
    } else if (vars.commandIn("SAVE")) {
      String strKey = vars.getStringParameter("inpmaMaintPartId");
      String strWindowId = vars.getStringParameter("inpWindowId");
      String strTabId = vars.getStringParameter("inpTabId");
      String strMessage = updateValues(request, vars, strKey);
      ActionButtonDefaultData[] tab = ActionButtonDefaultData.windowName(this, strTabId);
      String strWindowPath="", strTabName="";
      if (tab!=null && tab.length!=0) {
        strTabName = FormatUtilities.replace(tab[0].name);
        strWindowPath = "../" + FormatUtilities.replace(tab[0].description) + "/" + strTabName + "_Relation.html";
      } else strWindowPath = strDefaultServlet;
      if (!strMessage.equals("")) vars.setSessionValue(strWindowId + "|" + strTabName + ".message", strMessage);
      printPageClosePopUp(response, vars, strWindowPath);
    } else pageErrorPopUp(response);
  }

  void printPageDataSheet(HttpServletResponse response, VariablesSecureApp vars, String strKey, String strWindowId, String strTabId, String strPartDateFrom, String strPartDateTo, String strMaintType) throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: values ");
    String[] discard = {""};
    UpdateMaintenanceScheduledData[] data = null;
    if (strMaintType == null) strMaintType = "";
    if (strPartDateTo == null) strPartDateTo = "";
    data = UpdateMaintenanceScheduledData.select(this, vars.getLanguage(), strPartDateFrom, strPartDateTo, strMaintType);

    XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_actionButton/UpdateMaintenanceScheduled", discard).createXmlDocument();
    
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("theme", vars.getTheme());
    xmlDocument.setParameter("key", strKey);
    xmlDocument.setParameter("windowId", strWindowId);
    xmlDocument.setParameter("tabId", strTabId);

    xmlDocument.setParameter("partDateFrom", strPartDateFrom);
    xmlDocument.setParameter("partDateTo", strPartDateTo);
    xmlDocument.setParameter("maintType", strMaintType);

    xmlDocument.setParameter("calendar", vars.getLanguage().substring(0,2));
    xmlDocument.setParameter("dateFromdisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateFromsaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateTodisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateTosaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    try {
      ComboTableData comboTableData = new ComboTableData(vars, this, "LIST", "", "Maintenance type", "", Utility.getContext(this, vars, "#User_Org", "UpdateMaintenanceScheduled"), Utility.getContext(this, vars, "#User_Client", "UpdateMaintenanceScheduled"), 0);
      Utility.fillSQLParameters(this, vars, null, comboTableData, "UpdateMaintenanceScheduled", strMaintType);
      xmlDocument.setData("reportMaintType","liststructure", comboTableData.select(false));
      comboTableData = null;
    } catch (Exception ex) {
      throw new ServletException(ex);
    }

    xmlDocument.setData("structure1", data);
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
    if (log4j.isDebugEnabled()) log4j.debug("Output: values - out");
  }

  String updateValues(HttpServletRequest request, VariablesSecureApp vars, String strKey) throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Update: values");

    String[] strValueId = request.getParameterValues("strMaintScheduled");
    if (log4j.isDebugEnabled()) log4j.debug("Update: values after strValueID");
    if (strValueId == null || strValueId.length == 0) return "";
    Connection conn = null;
    try {
      conn = this.getTransactionConnection();
      for (int i=0; i<strValueId.length; i++) {
        if (log4j.isDebugEnabled()) log4j.debug("*****strValueId[i]=" + strValueId[i]);
        String done = vars.getStringParameter("strDone"+strValueId[i]);
        if (done == null) done = "";
        String result = vars.getStringParameter("strResult"+strValueId[i]);
        if (result == null) result = "";
        String usedtime = vars.getStringParameter("strUsedTime"+strValueId[i]);
        String observation = vars.getStringParameter("strObservation"+strValueId[i]);
        if (done.equals("Y")) {
          if (log4j.isDebugEnabled()) log4j.debug("Values to update: " + strValueId[i] + ", " + result + ", " + usedtime + ", " + observation);
          UpdateMaintenanceScheduledData.update(conn, this, result.equals("Y")?"Y":"N", usedtime, observation, vars.getUser(), strKey, strValueId[i]);
        }
      }
      releaseCommitConnection(conn);
    } catch (Exception e) {
      try {
        releaseRollbackConnection(conn);
      } catch (Exception ignored) {}
      e.printStackTrace();
      log4j.warn("Rollback in transaction");
      return Utility.messageBD(this, "ProcessRunError", vars.getLanguage());
    }//*/
    return Utility.messageBD(this, "Success", vars.getLanguage());
  }


  public String getServletInfo() {
    return "Servlet that presents the Create From Multiple button";
  } // end of getServletInfo() method
}
