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
import java.util.HashMap;

import org.openbravo.erpCommon.ad_combos.AccountNumberComboData;

import org.openbravo.erpCommon.utility.DateTimeData;

public class ReportBankJR extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);


    if (vars.commandIn("DEFAULT")) {
      String strDateFrom = vars.getGlobalVariable("inpDateFrom", "ReportBankJR|DateFrom", "");
      String strDateTo = vars.getGlobalVariable("inpDateTo", "ReportBankJR|DateTo", "");
      String strcbankaccount = vars.getGlobalVariable("inpmProductId", "ReportBankJR|C_Bankaccount_ID", "");
      printPageDataSheet(response, vars, strDateFrom, strDateTo, strcbankaccount);
    } else if (vars.commandIn("FIND")) {
      String strDateFrom = vars.getRequestGlobalVariable("inpDateFrom", "ReportBankJR|DateFrom");
      String strDateTo = vars.getRequestGlobalVariable("inpDateTo", "ReportBankJR|DateTo");
      String strcbankaccount = vars.getRequestGlobalVariable("inpcBankAccountId", "ReportBankJR|C_Bankaccount_ID");
      printPageDataHtml(response, vars, strDateFrom, strDateTo, strcbankaccount);
    } else pageError(response);
  }

  void printPageDataSheet(HttpServletResponse response, VariablesSecureApp vars, String strDateFrom, String strDateTo, String strcbankaccount)
    throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: dataSheet");
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    String strMessage="";
   
    XmlDocument xmlDocument=null;
    xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_reports/ReportBankJR").createXmlDocument();
  
    ToolBar toolbar = new ToolBar(this, vars.getLanguage(), "ReportBankJR", false, "", "", "",false, "ad_reports",  strReplaceWith, false,  true);
    toolbar.prepareSimpleToolBarTemplate();
    xmlDocument.setParameter("toolbar", toolbar.toString()); 

    try {
      WindowTabs tabs = new WindowTabs(this, vars, "org.openbravo.erpCommon.ad_reports.ReportBankJR");
      xmlDocument.setParameter("parentTabContainer", tabs.parentTabs());
      xmlDocument.setParameter("mainTabContainer", tabs.mainTabs());
      xmlDocument.setParameter("childTabContainer", tabs.childTabs());
      xmlDocument.setParameter("theme", vars.getTheme());
      NavigationBar nav = new NavigationBar(this, vars.getLanguage(), "ReportBankJR.html", classInfo.id, classInfo.type, strReplaceWith, tabs.breadcrumb());
      xmlDocument.setParameter("navigationBar", nav.toString());
      LeftTabsBar lBar = new LeftTabsBar(this, vars.getLanguage(), "ReportBankJR.html", strReplaceWith);
      xmlDocument.setParameter("leftTabs", lBar.manualTemplate());
    } catch (Exception ex) {
      throw new ServletException(ex);
    }
    {
      OBError myMessage = vars.getMessage("ReportBankJR");
      vars.removeMessage("ReportBankJR");
      if (myMessage!=null) {
        xmlDocument.setParameter("messageType", myMessage.getType());
        xmlDocument.setParameter("messageTitle", myMessage.getTitle());
        xmlDocument.setParameter("messageMessage", myMessage.getMessage());
      }
    }


    xmlDocument.setParameter("calendar", vars.getLanguage().substring(0,2));
    xmlDocument.setParameter("direction", "var baseDirection = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("paramLanguage", "LNG_POR_DEFECTO=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("cBankAccount", strcbankaccount);
    xmlDocument.setParameter("dateFrom", strDateFrom);
    xmlDocument.setParameter("dateFromdisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateFromsaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateTo", strDateTo);
    xmlDocument.setParameter("dateTodisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateTosaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("paramMessage", (strMessage.equals("")?"":"alert('" + strMessage + "');"));
    xmlDocument.setData("reportC_ACCOUNTNUMBER","liststructure",AccountNumberComboData.select(this, Utility.getContext(this, vars, "#User_Client", "ReportBankJR"), Utility.getContext(this, vars, "#User_Org", "ReportBankJR")));
    
    out.println(xmlDocument.print());
    out.close();
  }
  
   void printPageDataHtml(HttpServletResponse response, VariablesSecureApp vars, String strDateFrom, String strDateTo, String strcbankaccount)
    throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: dataSheet");
    response.setContentType("text/html; charset=UTF-8");
    String strMessage="";
    ReportBankJRData[] data=null;
    if (strDateFrom.equals("") && strDateTo.equals("")) {
    String discard[]={"sectionAmount"};
    XmlDocument xmlDocument=null;
     xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_reports/ReportBankJR", discard).createXmlDocument();
     data = ReportBankJRData.set();
     if (vars.commandIn("FIND")) {
         strMessage=Utility.messageBD(this, "BothDatesCannotBeBlank", vars.getLanguage()); 
         log4j.warn("Both dates are blank");
       }
       ToolBar toolbar = new ToolBar(this, vars.getLanguage(), "ReportBankJR", false, "", "", "",false, "ad_reports",  strReplaceWith, false,  true);
        toolbar.prepareSimpleToolBarTemplate();
        xmlDocument.setParameter("toolbar", toolbar.toString()); 
        
        xmlDocument.setParameter("calendar", vars.getLanguage().substring(0,2));
        xmlDocument.setParameter("direction", "var baseDirection = \"" + strReplaceWith + "/\";\n");
        xmlDocument.setParameter("paramLanguage", "LNG_POR_DEFECTO=\"" + vars.getLanguage() + "\";");
        xmlDocument.setParameter("cBankAccount", strcbankaccount);
        xmlDocument.setParameter("dateFrom", strDateFrom);
        xmlDocument.setParameter("dateTo", strDateTo);
        xmlDocument.setParameter("paramMessage", (strMessage.equals("")?"":"alert('" + strMessage + "');"));
        xmlDocument.setData("reportC_ACCOUNTNUMBER","liststructure",AccountNumberComboData.select(this, Utility.getContext(this, vars, "#User_Client", "ReportBankJR"), Utility.getContext(this, vars, "#User_Org", "ReportBankJR")));
    } else {
     data = ReportBankJRData.select(this, Utility.getContext(this, vars, "#User_Client", "ReportBankJR"), Utility.getContext(this, vars, "#User_Org", "ReportBankJR"),strDateFrom, DateTimeData.nDaysAfter(this, strDateTo,"1"), strcbankaccount);
//     xmlDocument.setParameter("sumAmount", ReportBankJRData.BeginningBalance(this, Utility.getContext(this, vars, "#User_Client", "ReportBankJR"), Utility.getContext(this, vars, "#User_Org", "ReportBankJR"),strDateFrom, strcbankaccount));
    }

    HashMap<String, Object> parameters = new HashMap<String, Object>();
    parameters.put("REPORT_TITLE", classInfo.name);
    String strReportPath = "@basedesign@/org/openbravo/erpCommon/ad_reports/ReportBankJR.jrxml";
    renderJR(vars, response, strReportPath, "html", parameters, data, null);
  }

  public String getServletInfo() {
    return "Servlet ReportBankJR.";
  } // end of getServletInfo() method
}

