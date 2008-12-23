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

public class ReportShipmentEditionJR extends HttpSecureAppServlet {
    private static final long serialVersionUID = 1L;

    public void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException, ServletException {
        VariablesSecureApp vars = new VariablesSecureApp(request);

        if (vars.commandIn("DEFAULT")) {
            String strdateFrom = vars.getStringParameter("inpDateFrom", "");
            String strdateTo = vars.getStringParameter("inpDateTo", "");
            printPageDataSheet(response, vars, strdateFrom, strdateTo);
        } else if (vars.commandIn("EDIT_PDF", "EDIT_HTML")) {
            log4j.info("EDITAMOS EL PDF");
            String strdateFrom = vars.getStringParameter("inpDateFrom");
            String strdateTo = vars.getStringParameter("inpDateTo");
            String strcBpartnetId = vars.getStringParameter("inpcBPartnerId");
            String strmWarehouseId = vars.getStringParameter("inpmWarehouseId");
            String strcProjectId = vars.getStringParameter("inpcProjectId");
            String strissotrx = "Y";
            printPagePdf(response, vars, strdateFrom, strdateTo,
                    strcBpartnetId, strmWarehouseId, strcProjectId, strissotrx);
        } else
            pageErrorPopUp(response);

    }

    void printPageDataSheet(HttpServletResponse response,
            VariablesSecureApp vars, String strdateFrom, String strdateTo)
            throws IOException, ServletException {
        if (log4j.isDebugEnabled())
            log4j.debug("Output: dataSheet");
        XmlDocument xmlDocument = null;
        xmlDocument = xmlEngine.readXmlTemplate(
                "org/openbravo/erpCommon/ad_reports/ReportShipmentFilterJR")
                .createXmlDocument();

        ToolBar toolbar = new ToolBar(this, vars.getLanguage(),
                "ReportShipmentFilterJR", false, "", "", "", false,
                "ad_reports", strReplaceWith, false, true);
        toolbar.prepareSimpleToolBarTemplate();
        xmlDocument.setParameter("toolbar", toolbar.toString());

        try {
            WindowTabs tabs = new WindowTabs(this, vars,
                    "org.openbravo.erpCommon.ad_reports.ReportShipmentEditionJR");
            xmlDocument.setParameter("parentTabContainer", tabs.parentTabs());
            xmlDocument.setParameter("mainTabContainer", tabs.mainTabs());
            xmlDocument.setParameter("childTabContainer", tabs.childTabs());
            xmlDocument.setParameter("theme", vars.getTheme());
            NavigationBar nav = new NavigationBar(this, vars.getLanguage(),
                    "ReportShipmentEditionJR.html", classInfo.id,
                    classInfo.type, strReplaceWith, tabs.breadcrumb());
            xmlDocument.setParameter("navigationBar", nav.toString());
            LeftTabsBar lBar = new LeftTabsBar(this, vars.getLanguage(),
                    "ReportShipmentEditionJR.html", strReplaceWith);
            xmlDocument.setParameter("leftTabs", lBar.manualTemplate());
        } catch (Exception ex) {
            throw new ServletException(ex);
        }
        {
            OBError myMessage = vars.getMessage("ReportShipmentEditionJR");
            vars.removeMessage("ReportShipmentEditionJR");
            if (myMessage != null) {
                xmlDocument.setParameter("messageType", myMessage.getType());
                xmlDocument.setParameter("messageTitle", myMessage.getTitle());
                xmlDocument.setParameter("messageMessage", myMessage
                        .getMessage());
            }
        }

        xmlDocument
                .setParameter("calendar", vars.getLanguage().substring(0, 2));
        xmlDocument.setParameter("language", "defaultLang=\""
                + vars.getLanguage() + "\";");
        xmlDocument.setParameter("directory", "var baseDirectory = \""
                + strReplaceWith + "/\";\n");
        xmlDocument.setParameter("dateFrom", strdateFrom);
        xmlDocument.setParameter("dateFromdisplayFormat", vars
                .getSessionValue("#AD_SqlDateFormat"));
        xmlDocument.setParameter("dateFromsaveFormat", vars
                .getSessionValue("#AD_SqlDateFormat"));
        xmlDocument.setParameter("dateTo", strdateTo);
        xmlDocument.setParameter("dateTodisplayFormat", vars
                .getSessionValue("#AD_SqlDateFormat"));
        xmlDocument.setParameter("dateTosaveFormat", vars
                .getSessionValue("#AD_SqlDateFormat"));
        xmlDocument.setParameter("paramBPartnerId", "");
        xmlDocument.setParameter("mWarehouseId", "");
        xmlDocument.setParameter("cProjectId", "");
        xmlDocument.setParameter("projectName", "");
        try {
            ComboTableData comboTableData = new ComboTableData(vars, this,
                    "TABLEDIR", "M_Warehouse_ID", "", "", Utility.getContext(
                            this, vars, "#User_Org", "ShipmentFilter"), Utility
                            .getContext(this, vars, "#User_Client",
                                    "ShipmentFilter"), 0);
            Utility.fillSQLParameters(this, vars, null, comboTableData,
                    "ShipmentFilter", "");
            xmlDocument.setData("reportM_WAREHOUSEID", "liststructure",
                    comboTableData.select(false));
            comboTableData = null;
        } catch (Exception ex) {
            throw new ServletException(ex);
        }

        response.setContentType("text/html; charset=UTF-8");
        PrintWriter out = response.getWriter();
        out.println(xmlDocument.print());
        out.close();
    }

    void printPagePdf(HttpServletResponse response, VariablesSecureApp vars,
            String strdateFrom, String strdateTo, String strcBpartnetId,
            String strmWarehouseId, String strcProjectId, String strissotrx)
            throws IOException, ServletException {
        if (log4j.isDebugEnabled())
            log4j.debug("Output: print pdf");
        String strOutput = new String(vars.commandIn("EDIT_PDF") ? "pdf"
                : "html");

        String strReportName = "@basedesign@/org/openbravo/erpCommon/ad_reports/ReportShipmentEdition.jrxml";
        if (strOutput.equals("pdf"))
            response.setHeader("Content-disposition",
                    "inline; filename=ReportShipmetEditionJR.pdf");

        InoutEditionData[] data = InoutEditionData.select(this, Utility
                .getContext(this, vars, "#User_Org", "ShipmentFilter"), Utility
                .getContext(this, vars, "#User_Client", "ShipmentFilter"),
                strdateFrom, strdateTo, strcBpartnetId, strmWarehouseId,
                strcProjectId, strissotrx);
        HashMap<String, Object> parameters = new HashMap<String, Object>();

        String strTitle = classInfo.name;
        String strSubTitle = "";
        strSubTitle = Utility.messageBD(this, "From", vars.getLanguage()) + " "
                + strdateFrom + " "
                + Utility.messageBD(this, "To", vars.getLanguage()) + " "
                + strdateTo;
        parameters.put("REPORT_TITLE", strTitle);
        parameters.put("REPORT_SUBTITLE", strSubTitle);
        if (log4j.isDebugEnabled())
            log4j.debug("data" + data.length);

        renderJR(vars, response, strReportName, strOutput, parameters, data,
                null);

    }

    public String getServletInfo() {
        return "Servlet PurchaseOrderFilter. This Servlet was made by Jon Alegría";
    } // end of getServletInfo() method
}
