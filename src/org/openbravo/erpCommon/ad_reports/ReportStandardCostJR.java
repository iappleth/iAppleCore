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

import org.openbravo.erpCommon.ad_combos.ProcessPlanComboData;
import org.openbravo.erpCommon.ad_combos.ProcessPlanVersionComboData;

import net.sf.jasperreports.engine.design.JasperDesign;
import net.sf.jasperreports.engine.*;
import java.util.HashMap;
import java.util.Date;
import java.text.SimpleDateFormat;
import net.sf.jasperreports.engine.xml.JRXmlLoader;

public class ReportStandardCostJR extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);


    if (vars.commandIn("DEFAULT")){
      String strdate = vars.getGlobalVariable("inpDateFrom", "ReportStandardCostJR|date", "");
      String strProcessPlan = vars.getGlobalVariable("inpmaProcessPlanId", "ReportStandardCostJR|ProcessPlanID", "");
      String strVersion = vars.getGlobalVariable("inpmaProcessPlanVersionId", "ReportStandardCostJR|versionID", "");
      printPageDataSheet(response, vars, strdate, strProcessPlan, strVersion);
    }else if (vars.commandIn("FIND")) {
      String strdate = vars.getRequestGlobalVariable("inpDateFrom", "ReportStandardCostJR|date");
      String strProcessPlan = vars.getRequestGlobalVariable("inpmaProcessPlanId", "ReportStandardCostJR|ProcessPlanID");
      String strVersion = vars.getRequestGlobalVariable("inpmaProcessPlanVersionId", "ReportStandardCostJR|versionID");
      printPageHtml(response, vars, strdate, strProcessPlan, strVersion);
    }  else pageError(response);
  }

  void printPageDataSheet(HttpServletResponse response, VariablesSecureApp vars, String strdate, String strProcessPlan, String strVersion) throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: dataSheet");
    XmlDocument xmlDocument=null;
    xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_reports/ReportStandardCostJRFilter").createXmlDocument();

    ToolBar toolbar = new ToolBar(this, vars.getLanguage(), "ReportStandardCostJRFilter", false, "", "", "",false, "ad_reports",  strReplaceWith, false,  true);
    toolbar.prepareSimpleToolBarTemplate();
    xmlDocument.setParameter("toolbar", toolbar.toString());

    try {
      KeyMap key = new KeyMap(this, vars, "ReportStandardCostJR.html");
      xmlDocument.setParameter("keyMap", key.getReportKeyMaps());
    } catch (Exception ex) {
      throw new ServletException(ex);
    }
    try {
      WindowTabs tabs = new WindowTabs(this, vars, "org.openbravo.erpCommon.ad_reports.ReportStandardCostJR");
      xmlDocument.setParameter("parentTabContainer", tabs.parentTabs());
      xmlDocument.setParameter("mainTabContainer", tabs.mainTabs());
      xmlDocument.setParameter("childTabContainer", tabs.childTabs());
      xmlDocument.setParameter("theme", vars.getTheme());
      NavigationBar nav = new NavigationBar(this, vars.getLanguage(), "ReportStandardCostJR.html", classInfo.id, classInfo.type, strReplaceWith, tabs.breadcrumb());
      xmlDocument.setParameter("navigationBar", nav.toString());
      LeftTabsBar lBar = new LeftTabsBar(this, vars.getLanguage(), "ReportStandardCostJR.html", strReplaceWith);
      xmlDocument.setParameter("leftTabs", lBar.manualTemplate());
    } catch (Exception ex) {
      throw new ServletException(ex);
    }
    {
      OBError myMessage = vars.getMessage("ReportStandardCostJR");
      vars.removeMessage("ReportStandardCostJR");
      if (myMessage!=null) {
        xmlDocument.setParameter("messageType", myMessage.getType());
        xmlDocument.setParameter("messageTitle", myMessage.getTitle());
        xmlDocument.setParameter("messageMessage", myMessage.getMessage());
      }
    }

    xmlDocument.setParameter("calendar", vars.getLanguage().substring(0,2));
    xmlDocument.setParameter("language", "LNG_POR_DEFECTO=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("direction", "var baseDirection = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("date", strdate);
    xmlDocument.setParameter("datedisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("datesaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setData("reportMA_PROCESSPLAN", "liststructure", ProcessPlanComboData.select(this, Utility.getContext(this, vars, "#User_Client", "ReportStandardCostJR"), Utility.getContext(this, vars, "#User_Org", "ReportStandardCostJR")));
    xmlDocument.setData("reportMA_PROCESSVERSIONPLAN", "liststructure", ProcessPlanVersionComboData.select(this, Utility.getContext(this, vars, "#User_Client", "ReportStandardCostJR"), Utility.getContext(this, vars, "#User_Org", "ReportStandardCostJR")));
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  void printPageHtml(HttpServletResponse response, VariablesSecureApp vars, String strdate, String strProcessPlan, String strVersion) throws IOException, ServletException{
    if (log4j.isDebugEnabled()) log4j.debug("Output: print html");
    String strLanguage = vars.getLanguage();
    String strBaseDesign = getBaseDesignPath(strLanguage);
    HashMap<String, Object> parameters = new HashMap<String, Object> ();
    parameters.put("MA_PROCESSPLAN_ID", strProcessPlan);
    parameters.put("MA_PROCESSPLAN_VERSION_ID", strVersion);
    parameters.put("REPORT_TITLE", classInfo.name);
    JasperReport jasperReportCost;
    JasperReport jasperReportProduced;
    try {
      JasperDesign jasperDesignCost = JRXmlLoader.load(strBaseDesign+"/org/openbravo/erpCommon/ad_reports/ReportStandardCostsJR_srptcosts.jrxml");
      JasperDesign jasperDesignProduced = JRXmlLoader.load(strBaseDesign+"/org/openbravo/erpCommon/ad_reports/ReportStandardCostsJR_subreport0.jrxml");
      jasperReportCost = JasperCompileManager.compileReport(jasperDesignCost);
      jasperReportProduced = JasperCompileManager.compileReport(jasperDesignProduced);
    } catch (JRException e){
      e.printStackTrace();
      throw new ServletException(e.getMessage());
    }
    parameters.put("SR_COST", jasperReportCost);
    parameters.put("SR_PRODUCED", jasperReportProduced);

    if (strdate != null && !strdate.equals("")){
      String strDateFormat;
      strDateFormat = vars.getJavaDateFormat();
      SimpleDateFormat dateFormat = new SimpleDateFormat(strDateFormat);
      Date date=null;
      try {
        date = dateFormat.parse(strdate);
      } catch (Exception e) {
        throw new ServletException(e.getMessage());
      }
      parameters.put("DATEFROM", date);
      parameters.put("DATETO", date);
    }
    String strReportPath="@basedesign@/org/openbravo/erpCommon/ad_reports/ReportStandardCostsJR.jrxml";
    renderJR(vars, response, strReportPath, "html", parameters, null, null);
  }

  public String getServletInfo() {
    return "Servlet ReportStandardCostJRFilter.";
  } // end of getServletInfo() method
}

