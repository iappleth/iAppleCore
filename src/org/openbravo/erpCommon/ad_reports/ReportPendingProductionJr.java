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
 

public class ReportPendingProductionJr extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);

    
    if (vars.commandIn("FIND"))
       printPageDataHtml(response, vars);
     else 
       printPageDataSheet(response, vars);
  }

  void printPageDataHtml(HttpServletResponse response, VariablesSecureApp vars)
    throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: dataSheet");
    response.setContentType("text/html; charset=UTF-8");
    //PrintWriter out = response.getWriter();
    //XmlDocument xmlDocument=null;
    ReportPendingProductionJrData[] data=null;
    //xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_reports/ReportPendingProductionEdit").createXmlDocument();
    data = ReportPendingProductionJrData.select(this, Utility.getContext(this, vars, "#User_Client", "ReportPendingProductionJr"), Utility.getContext(this, vars, "#User_Org", "ReportPendingProductionJr"));

     String strOutput = "html";
	 String strReportName = "@basedesign@/org/openbravo/erpCommon/ad_reports/ReportPendingProductionJr.jrxml";
      if (strOutput.equals("pdf")) response.setHeader("Content-disposition", "inline; filename=ReportPendingProductionJr.pdf");
       HashMap<String, Object> parameters = new HashMap<String, Object>();
       parameters.put("REPORT_TITLE", classInfo.name);
        //parameters.put("PRODUCT_LEVEL", new Integer(intProductLevel));
      renderJR(vars, response, strReportName, strOutput, parameters, data, null);

  }

   void printPageDataSheet(HttpServletResponse response, VariablesSecureApp vars)
    throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: dataSheet");
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    XmlDocument xmlDocument=null;
    xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_reports/ReportPendingProductionJr").createXmlDocument();
    


    ToolBar toolbar = new ToolBar(this, vars.getLanguage(), "ReportPendingProductionJr", false, "", "", "",false, "ad_reports",  strReplaceWith, false,  true);
    toolbar.prepareSimpleToolBarTemplate();
    xmlDocument.setParameter("toolbar", toolbar.toString());

    try {
      WindowTabs tabs = new WindowTabs(this, vars, "org.openbravo.erpCommon.ad_reports.ReportPendingProductionJr");
      xmlDocument.setParameter("parentTabContainer", tabs.parentTabs());
      xmlDocument.setParameter("mainTabContainer", tabs.mainTabs());
      xmlDocument.setParameter("childTabContainer", tabs.childTabs());
      xmlDocument.setParameter("theme", vars.getTheme());
      NavigationBar nav = new NavigationBar(this, vars.getLanguage(), "ReportPendingProductionJr.html", classInfo.id, classInfo.type, strReplaceWith, tabs.breadcrumb());
      xmlDocument.setParameter("navigationBar", nav.toString());
      LeftTabsBar lBar = new LeftTabsBar(this, vars.getLanguage(), "ReportPendingProductionJr.html", strReplaceWith);
      xmlDocument.setParameter("leftTabs", lBar.manualTemplate());
    } catch (Exception ex) {
      throw new ServletException(ex);
    }
    {
      OBError myMessage = vars.getMessage("ReportPendingProductionJr");
      vars.removeMessage("ReportPendingProductionJr");
      if (myMessage!=null) {
        xmlDocument.setParameter("messageType", myMessage.getType());
        xmlDocument.setParameter("messageTitle", myMessage.getTitle());
        xmlDocument.setParameter("messageMessage", myMessage.getMessage());
      }
    }
	xmlDocument.setParameter("paramLanguage", "LNG_POR_DEFECTO=\"" + vars.getLanguage() + "\";");
   
    out.println(xmlDocument.print());
    out.close();
	
	}

  
  public String getServletInfo() {
    return "Servlet ReportPendingProductionJr.";
  } // end of getServletInfo() method
}

