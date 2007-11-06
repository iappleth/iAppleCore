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

public class ReportProjectProfitabilityJR extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;
  public static String strTreeOrg = "";

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);

    if (!Utility.hasProcessAccess(this, vars, "", "ReportProjectProfitabilityJR")) {
      bdError(response, "AccessTableNoView", vars.getLanguage());
      return;
    }

    if (vars.commandIn("DEFAULT")) {
      String strOrg = vars.getGlobalVariable("inpOrg", "ReportProjectProfitabilityJR|Org", vars.getOrg());
      String strProject = vars.getGlobalVariable("inpcProjectId", "ReportProjectProfitabilityJR|Project", "");
      String strProjectType = vars.getGlobalVariable("inpProjectType", "ReportProjectProfitabilityJR|ProjectType", "");
      String strResponsible = vars.getGlobalVariable("inpResponsible", "ReportProjectProfitabilityJR|Responsible", "");
      String strDateFrom = vars.getGlobalVariable("inpDateFrom", "ReportProjectProfitabilityJR|DateFrom", "");
      String strDateTo = vars.getGlobalVariable("inpDateTo", "ReportProjectProfitabilityJR|DateTo", "");
      String strExpand = vars.getGlobalVariable("inpExpand", "ReportProjectProfitabilityJR|Expand", "Y");
      String strPartner = vars.getGlobalVariable("inpcBPartnerId", "ReportProjectProfitabilityJR|Partner", "");
      printPageDataSheet(response, vars, strOrg, strProject, strProjectType, strResponsible, strDateFrom, strDateTo, strExpand, strPartner);
    } else if (vars.commandIn("FIND")) {
      String strOrg = vars.getRequestGlobalVariable("inpOrg", "ReportProjectProfitabilityJR|Org");
      String strProject = vars.getRequestGlobalVariable("inpcProjectId", "ReportProjectProfitabilityJR|Project");
      String strProjectType = vars.getRequestGlobalVariable("inpProjectType", "ReportProjectProfitabilityJR|ProjectType");
      String strResponsible = vars.getRequestGlobalVariable("inpResponsible", "ReportProjectProfitabilityJR|Responsible");
      String strDateFrom = vars.getRequestGlobalVariable("inpDateFrom", "ReportProjectProfitabilityJR|DateFrom");
      String strDateTo = vars.getRequestGlobalVariable("inpDateTo", "ReportProjectProfitabilityJR|DateTo");
      String strExpand = vars.getRequestGlobalVariable("inpExpand", "ReportProjectProfitabilityJR|Expand");
      String strPartner = vars.getRequestGlobalVariable("inpcBPartnerId", "ReportProjectProfitabilityJR|Partner");
      printPageDataHtml(response, vars, strOrg, strProject, strProjectType, strResponsible, strDateFrom, strDateTo, strExpand, strPartner);
    } else pageError(response);
  }

  
  void printPageDataHtml(HttpServletResponse response, VariablesSecureApp vars, String strOrg, String strProject, String strProjectType, String strResponsible, String strDateFrom, String strDateTo, String strExpand, String strPartner)
    throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: dataSheet");
    
    String discard[]={"discard"};
    strTreeOrg = strOrg;
    if (strExpand.equals("Y")) treeOrg(vars, strOrg);
    ReportProjectProfitabilityData[] data= ReportProjectProfitabilityData.select(this, strTreeOrg, strDateFrom , DateTimeData.nDaysAfter(this, strDateTo,"1"), strProjectType, strProject, strResponsible, strPartner);

    if (data == null || data.length == 0) {
      data = ReportProjectProfitabilityData.set("1","1","1","1","1","1","1","1","1","1","1");
      discard[0] = "discardAll";
    }
    
      String strReportName = "@basedesign@/org/openbravo/erpCommon/ad_reports/ReportProjectProfitabilityJR.jrxml";
      String strOutput="html";
      if (strOutput.equals("pdf")) response.setHeader("Content-disposition", "inline; filename=ReportProjectProfitabilityJR.pdf");

       
		HashMap<String, Object> parameters = new HashMap<String, Object>();
		parameters.put("Title", "Project profitability");
		parameters.put("REPORT_TITLE", "Project profitability");
		parameters.put("REPORT_SUBTITLE", "Filters: "+strDateFrom+" to "+strDateTo);
	
	renderJR(vars, response, strReportName, strOutput, parameters, data, null );
  }

  
   void printPageDataSheet(HttpServletResponse response, VariablesSecureApp vars, String strOrg, String strProject, String strProjectType, String strResponsible, String strDateFrom, String strDateTo, String strExpand, String strPartner)
    throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: dataSheet");
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
   
    XmlDocument xmlDocument;
    strTreeOrg = strOrg;
    if (strExpand.equals("Y")) treeOrg(vars, strOrg);
    
    xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_reports/ReportProjectProfitabilityJR").createXmlDocument();
     

    ToolBar toolbar = new ToolBar(this, vars.getLanguage(), "ReportProjectProfitabilityJR", false, "", "", "",false, "ad_reports", strReplaceWith, false,  true);
    toolbar.prepareSimpleToolBarTemplate();
    xmlDocument.setParameter("toolbar", toolbar.toString());

    try {
      KeyMap key = new KeyMap(this, vars, "ReportProjectProfitabilityJR.html");
      xmlDocument.setParameter("keyMap", key.getReportKeyMaps());
    } catch (Exception ex) {
      throw new ServletException(ex);
    }
    try {
      WindowTabs tabs = new WindowTabs(this, vars, "org.openbravo.erpCommon.ad_reports.ReportProjectProfitabilityJR");
      xmlDocument.setParameter("parentTabContainer", tabs.parentTabs());
      xmlDocument.setParameter("mainTabContainer", tabs.mainTabs());
      xmlDocument.setParameter("childTabContainer", tabs.childTabs());
      xmlDocument.setParameter("theme", vars.getTheme());
      NavigationBar nav = new NavigationBar(this, vars.getLanguage(), "ReportProjectProfitabilityJR.html", classInfo.id, classInfo.type, strReplaceWith, tabs.breadcrumb());
      xmlDocument.setParameter("navigationBar", nav.toString());
      LeftTabsBar lBar = new LeftTabsBar(this, vars.getLanguage(), "ReportProjectProfitabilityJR.html", strReplaceWith);
      xmlDocument.setParameter("leftTabs", lBar.manualTemplate());
    } catch (Exception ex) {
      throw new ServletException(ex);
    }
    {
      OBError myMessage = vars.getMessage("ReportProjectProfitabilityJR");
      vars.removeMessage("ReportProjectProfitabilityJR");
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
    xmlDocument.setParameter("dateFromdisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateFromsaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateTo", strDateTo);
    xmlDocument.setParameter("dateTodisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateTosaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    

    xmlDocument.setParameter("orgid", strOrg);
    xmlDocument.setParameter("project", strProject);
    xmlDocument.setParameter("projecttype", strProjectType);
    xmlDocument.setParameter("responsible", strResponsible);
    xmlDocument.setParameter("partnerid", strPartner);
    xmlDocument.setParameter("expand", strExpand);


    try {
      ComboTableData comboTableData = null;

      comboTableData = new ComboTableData(vars, this, "TABLE", "Responsible_ID", "Responsible employee", "", Utility.getContext(this, vars, "#User_Org", "ReportProjectProfitabilityJR"), Utility.getContext(this, vars, "#User_Client", "ReportProjectProfitabilityJR"), 0);
      Utility.fillSQLParameters(this, vars, null, comboTableData, "ReportProjectProfitabilityJR", strResponsible);
      xmlDocument.setData("reportResponsible","liststructure", comboTableData.select(false));
      comboTableData = null;

      comboTableData = new ComboTableData(vars, this, "TABLEDIR", "AD_Org_ID", "", "", Utility.getContext(this, vars, "#User_Org", "ReportProjectProfitabilityJR"), Utility.getContext(this, vars, "#User_Client", "ReportProjectProfitabilityJR"), 0);
      Utility.fillSQLParameters(this, vars, null, comboTableData, "ReportProjectProfitabilityJR", strOrg);
      xmlDocument.setData("reportAD_Org_ID","liststructure", comboTableData.select(false));
      comboTableData = null;

      comboTableData = new ComboTableData(vars, this, "TABLEDIR", "C_Project_ID", "", "", Utility.getContext(this, vars, "#User_Org", "ReportProjectProfitabilityJR"), Utility.getContext(this, vars, "#User_Client", "ReportProjectProfitabilityJR"), 0);
      Utility.fillSQLParameters(this, vars, null, comboTableData, "ReportProjectProfitabilityJR", strProject);
      xmlDocument.setData("reportC_Project_ID","liststructure", comboTableData.select(false));
      comboTableData = null;

      comboTableData = new ComboTableData(vars, this, "TABLEDIR", "C_ProjectType_ID", "", "", Utility.getContext(this, vars, "#User_Org", "ReportProjectProfitabilityJR"), Utility.getContext(this, vars, "#User_Client", "ReportProjectProfitabilityJR"), 0);
      Utility.fillSQLParameters(this, vars, null, comboTableData, "ReportProjectProfitabilityJR", strProjectType);
      xmlDocument.setData("reportC_ProjectType_ID","liststructure", comboTableData.select(false));
      comboTableData = null;

    } catch (Exception e) {throw new ServletException(e);}

    out.println(xmlDocument.print());
    out.close();
  }
  
  public String getServletInfo() {
    return "Servlet ReportProjectProfitabilityJR. This Servlet was made by Pablo Sarobe";
  } // end of getServletInfo() method

  void treeOrg(VariablesSecureApp vars, String strOrg) throws ServletException{
    ReportProjectProfitabilityData[] dataOrg = ReportProjectProfitabilityData.selectOrg(this, strOrg, vars.getClient());
    for (int i = 0; i<dataOrg.length; i++) {
      strTreeOrg += "," + dataOrg[i].nodeId;
      if (dataOrg[i].issummary.equals("Y")) treeOrg(vars, dataOrg[i].nodeId);
    }
    return;
  }
}
