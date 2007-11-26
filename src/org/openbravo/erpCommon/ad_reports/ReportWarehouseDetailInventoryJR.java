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

import org.openbravo.erpCommon.utility.*;
import org.openbravo.erpCommon.businessUtility.WindowTabs;
import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.xmlEngine.XmlDocument;
import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;

import org.openbravo.erpCommon.utility.DateTimeData;


import java.util.HashMap;

public class ReportWarehouseDetailInventoryJR extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);

    if (vars.commandIn("DEFAULT")) {
      String strDateFrom = vars.getGlobalVariable("inpDateFrom", "ReportWarehouseDetailInventoryJR|DateFrom", "");
      String strDateTo = vars.getGlobalVariable("inpDateTo", "ReportWarehouseDetailInventoryJR|DateTo", "");
      String strWarehouse = vars.getStringParameter("inpmWarehouseId","");
      printPageDataSheet(response, vars, strDateFrom, strDateTo, strWarehouse);
    } else if (vars.commandIn("FIND")) {
      String strDateFrom = vars.getRequestGlobalVariable("inpDateFrom", "ReportWarehouseDetailInventoryJR|DateFrom");
      String strDateTo = vars.getRequestGlobalVariable("inpDateTo", "ReportWarehouseDetailInventoryJR|DateTo");
      String strWarehouse = vars.getStringParameter("inpmWarehouseId");
      printPagePDF(response, vars, strDateFrom, strDateTo, strWarehouse);
    } else pageErrorPopUp(response);
  }

  void printPageDataSheet(HttpServletResponse response, VariablesSecureApp vars, String strDateFrom, String strDateTo, String strWarehouse)
    throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: dataSheet");
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_reports/ReportWarehouseDetailInventoryJR").createXmlDocument();

    ToolBar toolbar = new ToolBar(this, vars.getLanguage(), "ReportWarehouseDetailInventoryJR", false, "", "", "",false, "ad_reports",  strReplaceWith, false,  true);
    toolbar.prepareSimpleToolBarTemplate();
    xmlDocument.setParameter("toolbar", toolbar.toString());

    try {
      KeyMap key = new KeyMap(this, vars, "ReportWarehouseDetailInventoryJR.html");
      xmlDocument.setParameter("keyMap", key.getReportKeyMaps());
    } catch (Exception ex) {
      throw new ServletException(ex);
    }
    try {
      WindowTabs tabs = new WindowTabs(this, vars, "org.openbravo.erpCommon.ad_reports.ReportWarehouseDetailInventoryJR");
      xmlDocument.setParameter("parentTabContainer", tabs.parentTabs());
      xmlDocument.setParameter("mainTabContainer", tabs.mainTabs());
      xmlDocument.setParameter("childTabContainer", tabs.childTabs());
      xmlDocument.setParameter("theme", vars.getTheme());
      NavigationBar nav = new NavigationBar(this, vars.getLanguage(), "ReportWarehouseDetailInventoryJR.html", classInfo.id, classInfo.type, strReplaceWith, tabs.breadcrumb());
      xmlDocument.setParameter("navigationBar", nav.toString());
      LeftTabsBar lBar = new LeftTabsBar(this, vars.getLanguage(), "ReportWarehouseDetailInventoryJR.html", strReplaceWith);
      xmlDocument.setParameter("leftTabs", lBar.manualTemplate());
    } catch (Exception ex) {
      throw new ServletException(ex);
    }
    {
      OBError myMessage = vars.getMessage("ReportWarehouseDetailInventoryJR");
      vars.removeMessage("ReportWarehouseDetailInventoryJR");
      if (myMessage!=null) {
        xmlDocument.setParameter("messageType", myMessage.getType());
        xmlDocument.setParameter("messageTitle", myMessage.getTitle());
        xmlDocument.setParameter("messageMessage", myMessage.getMessage());
      }
    }  

    xmlDocument.setParameter("calendar", vars.getLanguage().substring(0,2));
    xmlDocument.setParameter("direction", "var baseDirection = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("paramLanguage", "LNG_POR_DEFECTO=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("dateFrom", strDateFrom);
    xmlDocument.setParameter("dateTo", strDateTo);
    xmlDocument.setParameter("mWarehouseId", strWarehouse);
    xmlDocument.setParameter("dateFrom", strDateFrom);
    xmlDocument.setParameter("dateFromdisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateFromsaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateTo", strDateTo);
    xmlDocument.setParameter("dateTodisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateTosaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    try {
      ComboTableData comboTableData = new ComboTableData(vars, this, "TABLEDIR", "M_Warehouse_ID", "", "", Utility.getContext(this, vars, "#User_Org", "ReportWarehouseDetailInventoryJR"), Utility.getContext(this, vars, "#User_Client", "ReportWarehouseDetailInventoryJR"), 0);
      Utility.fillSQLParameters(this, vars, null, comboTableData, "ReportWarehouseDetailInventoryJR", strWarehouse);
      xmlDocument.setData("reportM_WAREHOUSEID","liststructure", comboTableData.select(false));
      comboTableData = null;
    } catch (Exception ex) {
      throw new ServletException(ex);
    }

    out.println(xmlDocument.print());
    out.close();
  }

  void printPagePDF(HttpServletResponse response, VariablesSecureApp vars, String strDateFrom, String strDateTo, String strWarehouse) throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: PDF");

    String strDateFromSql = strDateFrom;

    if (DateTimeData.compare(this, strDateFrom, DateTimeData.firstDay(this, DateTimeData.today(this))).equals("0")) strDateFromSql = DateTimeData.nDaysAfter(this, strDateFrom, "1");

    ReportWarehouseDetailInventoryData[] data = ReportWarehouseDetailInventoryData.select(this, Utility.getContext(this, vars, "#User_Client", "ReportWarehouseDetailInventory"), Utility.getContext(this, vars, "#User_Org", "ReportWarehouseDetailInventory"), strDateFromSql, DateTimeData.nDaysAfter(this, strDateTo,"1"), strWarehouse);

   if (log4j.isDebugEnabled()) log4j.debug("data.length:"+data.length);

   String strReportName = "@basedesign@/org/openbravo/erpCommon/ad_reports/ReportWarehouseDetailInventory.jrxml";
   String strOutput = "pdf";
    if (strOutput.equals("pdf")) response.setHeader("Content-disposition", "inline; filename=ReportWarehouseDetailInventory.pdf");

   HashMap<String, Object> parameters = new HashMap<String, Object>();
        parameters.put("REPORT_TITLE", classInfo.name);
        String strSubTitle = Utility.messageBD(this, "From", vars.getLanguage()) + " "+strDateFrom+" " + Utility.messageBD(this, "To", vars.getLanguage()) + " "+strDateTo;
        parameters.put("REPORT_SUBTITLE", strSubTitle);		
    renderJR(vars, response, strReportName, strOutput, parameters, data, null ); 

  }

  public String getServletInfo() {
    return "Servlet ReportWarehouseDetailInventory. This Servlet was made by Jon Alegria";
  } // end of getServletInfo() method
}
