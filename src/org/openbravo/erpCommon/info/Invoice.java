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
package org.openbravo.erpCommon.info;

import org.openbravo.base.secureApp.*;
import org.openbravo.xmlEngine.XmlDocument;
import org.openbravo.data.FieldProvider;
import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.erpCommon.utility.SQLReturnObject;
import org.openbravo.erpCommon.utility.Utility;
import java.io.*;
import java.util.Vector;

import javax.servlet.*;
import javax.servlet.http.*;

import org.openbravo.utils.Replace;

import org.openbravo.erpCommon.utility.DateTimeData;

public class Invoice extends HttpSecureAppServlet {
    private static final long serialVersionUID = 1L;

    public void init(ServletConfig config) {
        super.init(config);
        boolHist = false;
    }

    public void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException, ServletException {
        VariablesSecureApp vars = new VariablesSecureApp(request);

        if (vars.commandIn("DEFAULT")) {
            String strNameValue = vars.getRequestGlobalVariable("inpNameValue",
                    "Invoice.name");
            String strWindowId = vars.getRequestGlobalVariable("WindowID",
                    "Invoice.windowId");
            String strSOTrx = Utility.getContext(this, vars, "isSOTrx",
                    strWindowId);
            if (!strWindowId.equals("")) {
                vars.setSessionValue("Invoice.isSOTrx",
                        (strSOTrx.equals("") ? "N" : strSOTrx));
            }
            if (!strNameValue.equals(""))
                vars.setSessionValue("Invoice.name", strNameValue + "%");
            printPage(response, vars, strNameValue, strWindowId);
        } else if (vars.commandIn("KEY")) {
            String strKeyValue = vars.getRequestGlobalVariable("inpNameValue",
                    "Invoice.name");
            String strWindowId = vars.getRequestGlobalVariable("WindowID",
                    "Invoice.windowId");
            String strSOTrx = Utility.getContext(this, vars, "isSOTrx",
                    strWindowId);
            String strOrg = vars.getStringParameter("inpAD_Org_ID");
            if (!strWindowId.equals("")) {
                vars.setSessionValue("Invoice.isSOTrx",
                        (strSOTrx.equals("") ? "N" : strSOTrx));
            }
            vars.setSessionValue("Invoice.name", strKeyValue + "%");
            InvoiceData[] data = InvoiceData.selectKey(this, vars
                    .getSqlDateFormat(), Utility.getContext(this, vars,
                    "#User_Client", "Invoice"), Utility.getSelectorOrgs(this,
                    vars, strOrg), strSOTrx, strKeyValue + "%");
            if (data != null && data.length == 1) {
                printPageKey(response, vars, data);
            } else
                printPage(response, vars, strKeyValue, strWindowId);
        } else if (vars.commandIn("STRUCTURE")) {
            printGridStructure(response, vars);
        } else if (vars.commandIn("DATA")) {

            if (vars.getStringParameter("newFilter").equals("1")
                    || vars.getStringParameter("newFilter").equals("")) {
                vars.removeSessionValue("Invoice.key");
                vars.removeSessionValue("Invoice.name");
                vars.removeSessionValue("Invoice.inpBpartnerId");
                vars.removeSessionValue("Invoice.inpDateFrom");
                vars.removeSessionValue("Invoice.inpDateTo");
                vars.removeSessionValue("Invoice.inpDescription");
                vars.removeSessionValue("Invoice.inpCal1");
                vars.removeSessionValue("Invoice.inpCal2");
                vars.removeSessionValue("Invoice.inpOrder");
                vars.removeSessionValue("Invoice.inpisSOTrx");
                vars.removeSessionValue("Invoice.adorgid");
            }

            String strName = vars.getGlobalVariable("inpKey", "Invoice.name",
                    "");
            String strBpartnerId = vars.getGlobalVariable("inpBpartnerId",
                    "Invoice.inpBpartnerId", "");
            String strDateFrom = vars.getGlobalVariable("inpDateFrom",
                    "Invoice.inpDateFrom", "");
            String strFechaTo = vars.getGlobalVariable("inpDateTo",
                    "Invoice.inpDateTo", "");
            String strDescription = vars.getGlobalVariable("inpDescription",
                    "Invoice.inpDescription", "");
            String strCal1 = vars.getGlobalVariable("inpCal1",
                    "Invoice.inpCal1", "");
            String strCalc2 = vars.getGlobalVariable("inpCal2",
                    "Invoice.inpCal2", "");
            String strOrder = vars.getGlobalVariable("inpOrder",
                    "Invoice.inpOrder", "");
            String strSOTrx = vars.getGlobalVariable("inpisSOTrx",
                    "Invoice.inpisSOTrx", "");
            String strOrg = vars.getGlobalVariable("inpAD_Org_ID",
                    "Invoice.adorgid", "");

            String strNewFilter = vars.getStringParameter("newFilter");
            String strOffset = vars.getStringParameter("offset");
            String strPageSize = vars.getStringParameter("page_size");
            String strSortCols = vars.getStringParameter("sort_cols")
                    .toUpperCase();
            String strSortDirs = vars.getStringParameter("sort_dirs")
                    .toUpperCase();

            printGridData(response, vars, strName, strBpartnerId, strDateFrom,
                    strFechaTo, strDescription, strCal1, strCalc2, strOrder,
                    strSOTrx, strOrg, strSortCols + " " + strSortDirs,
                    strOffset, strPageSize, strNewFilter);

        } else
            pageError(response);
    }

    void printPage(HttpServletResponse response, VariablesSecureApp vars,
            String strNameValue, String strWindow) throws IOException,
            ServletException {
        if (log4j.isDebugEnabled())
            log4j.debug("Output: business partners seeker Frame Set");
        XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
                "org/openbravo/erpCommon/info/Invoice").createXmlDocument();
        String strSOTrx = vars.getSessionValue("Invoice.isSOTrx");

        if (strNameValue.equals("")) {
            xmlDocument.setParameter("key", "%");
        } else {
            xmlDocument.setParameter("key", strNameValue);
        }
        xmlDocument
                .setParameter("calendar", vars.getLanguage().substring(0, 2));
        xmlDocument.setParameter("directory", "var baseDirectory = \""
                + strReplaceWith + "/\";\n");
        xmlDocument.setParameter("language", "defaultLang=\""
                + vars.getLanguage() + "\";");
        xmlDocument.setParameter("theme", vars.getTheme());
        xmlDocument.setParameter("isSOTrxCompra", strSOTrx);
        xmlDocument.setParameter("isSOTrxVenta", strSOTrx);
        xmlDocument.setParameter("dateFromdisplayFormat", vars
                .getSessionValue("#AD_SqlDateFormat"));
        xmlDocument.setParameter("dateFromsaveFormat", vars
                .getSessionValue("#AD_SqlDateFormat"));
        xmlDocument.setParameter("dateTodisplayFormat", vars
                .getSessionValue("#AD_SqlDateFormat"));
        xmlDocument.setParameter("dateTosaveFormat", vars
                .getSessionValue("#AD_SqlDateFormat"));
        StringBuffer total = new StringBuffer();
        total.append("keyArray = new Array(\n");
        total
                .append("new keyArrayItem(\"ENTER\", \"openSearch(null, null, '../Invoice.html', 'SELECTOR_INVOICE', false, 'frmMain', 'inpNewcInvoiceId', 'inpNewcInvoiceId_DES', document.frmMain.inpNewcInvoiceId_DES.value, 'Command', 'KEY', 'WindowID', '");
        total.append(strWindow).append(
                "');\", \"inpNewcInvoiceId_DES\", \"null\")\n");
        total.append(");\n");
        total.append("enableShortcuts();\n");
        xmlDocument.setParameter("WindowIDArray", total.toString());
        xmlDocument.setParameter("WindowID", strWindow);

        response.setContentType("text/html; charset=UTF-8");
        PrintWriter out = response.getWriter();
        out.println(xmlDocument.print());
        out.close();
    }

    void printPageFS(HttpServletResponse response, VariablesSecureApp vars)
            throws IOException, ServletException {
        if (log4j.isDebugEnabled())
            log4j.debug("Output: business partners seeker Frame Set");
        XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
                "org/openbravo/erpCommon/info/Invoice_FS").createXmlDocument();

        response.setContentType("text/html; charset=UTF-8");
        PrintWriter out = response.getWriter();
        out.println(xmlDocument.print());
        out.close();
    }

    void printPageKey(HttpServletResponse response, VariablesSecureApp vars,
            InvoiceData[] data) throws IOException, ServletException {
        if (log4j.isDebugEnabled())
            log4j.debug("Output: Invoice seeker Frame Set");
        XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
                "org/openbravo/erpCommon/info/SearchUniqueKeyResponse")
                .createXmlDocument();

        xmlDocument.setParameter("script", generateResult(data));
        response.setContentType("text/html; charset=UTF-8");
        PrintWriter out = response.getWriter();
        out.println(xmlDocument.print());
        out.close();
    }

    void printGridStructure(HttpServletResponse response,
            VariablesSecureApp vars) throws IOException, ServletException {
        if (log4j.isDebugEnabled())
            log4j.debug("Output: print page structure");
        XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
                "org/openbravo/erpCommon/utility/DataGridStructure")
                .createXmlDocument();

        SQLReturnObject[] data = getHeaders(vars);
        String type = "Hidden";
        String title = "";
        String description = "";

        xmlDocument.setParameter("type", type);
        xmlDocument.setParameter("title", title);
        xmlDocument.setParameter("description", description);
        xmlDocument.setData("structure1", data);
        response.setContentType("text/xml; charset=UTF-8");
        response.setHeader("Cache-Control", "no-cache");
        PrintWriter out = response.getWriter();
        if (log4j.isDebugEnabled())
            log4j.debug(xmlDocument.print());
        out.println(xmlDocument.print());
        out.close();
    }

    private SQLReturnObject[] getHeaders(VariablesSecureApp vars) {
        SQLReturnObject[] data = null;
        Vector<SQLReturnObject> vAux = new Vector<SQLReturnObject>();
        String[] colNames = { "bpartnername", "dateinvoiced", "documentno",
                "currency", "grandtotal", "convertedamount", "openamt",
                "issOtrx", "description", "poreference", "rowkey" };
        boolean[] colSortable = { true, true, true, true, true, false, true,
                true, true, true, true };
        String[] colWidths = { "160", "58", "65", "65", "70", "60", "55", "65",
                "90", "40", "0" };

        for (int i = 0; i < colNames.length; i++) {
            SQLReturnObject dataAux = new SQLReturnObject();
            dataAux.setData("columnname", colNames[i]);
            dataAux.setData("gridcolumnname", colNames[i]);
            dataAux.setData("adReferenceId", "AD_Reference_ID");
            dataAux.setData("adReferenceValueId", "AD_ReferenceValue_ID");
            dataAux.setData("isidentifier",
                    (colNames[i].equals("rowkey") ? "true" : "false"));
            dataAux.setData("iskey", (colNames[i].equals("rowkey") ? "true"
                    : "false"));
            dataAux.setData("isvisible",
                    (colNames[i].equals("rowkey") ? "false" : "true"));
            String name = Utility.messageBD(this, "INS_"
                    + colNames[i].toUpperCase(), vars.getLanguage());
            dataAux.setData("name", (name.startsWith("INS_") ? colNames[i]
                    : name));
            dataAux.setData("type", "string");
            dataAux.setData("width", colWidths[i]);
            dataAux.setData("issortable", colSortable[i] ? "true" : "false");
            vAux.addElement(dataAux);
        }
        data = new SQLReturnObject[vAux.size()];
        vAux.copyInto(data);
        return data;
    }

    String generateResult(InvoiceData[] data) throws IOException,
            ServletException {
        StringBuffer html = new StringBuffer();

        html.append("\nfunction validateSelector() {\n");
        html.append("var key = \"" + data[0].cInvoiceId + "\";\n");
        html.append("var text = \""
                + Replace.replace(data[0].name, "\"", "\\\"") + "\";\n");
        html.append("parent.opener.closeSearch(\"SAVE\", key, text);\n");
        html.append("}\n");
        return html.toString();
    }

    void printGridData(HttpServletResponse response, VariablesSecureApp vars,
            String strName, String strBpartnerId, String strDateFrom,
            String strFechaTo, String strDescription, String strCal1,
            String strCalc2, String strOrder, String strSOTrx, String strOrg,
            String strOrderBy, String strOffset, String strPageSize,
            String strNewFilter) throws IOException, ServletException {

        if (log4j.isDebugEnabled())
            log4j.debug("Output: pint page rows");

        SQLReturnObject[] headers = getHeaders(vars);
        FieldProvider[] data = null;
        String type = "Hidden";
        String title = "";
        String description = "";
        String strNumRows = "0";

        if (headers != null) {
            try {

                // remove single % in parameters used in like upper(parameter)
                if (strName.equals("%")) {
                    strName = null;
                }
                if (strDescription.equals("%")) {
                    strDescription = null;
                }

                if (strNewFilter.equals("1") || strNewFilter.equals("")) { // New
                                                                           // filter
                                                                           // or
                                                                           // first
                                                                           // load
                    strNumRows = InvoiceData.countRows(this, Utility
                            .getContext(this, vars, "#User_Client", "Invoice"),
                            Utility.getSelectorOrgs(this, vars, strOrg),
                            strName, strDescription, strBpartnerId, strOrder,
                            strDateFrom, DateTimeData.nDaysAfter(this,
                                    strFechaTo, "1"), strCal1, strCalc2,
                            strSOTrx);
                    vars.setSessionValue("Invoice.numrows", strNumRows);
                } else {
                    strNumRows = vars.getSessionValue("Invoice.numrows");
                }

                // Filtering result
                if (this.myPool.getRDBMS().equalsIgnoreCase("ORACLE")) {
                    String oraLimit = strOffset
                            + " AND "
                            + String.valueOf(Integer.valueOf(strOffset)
                                    .intValue()
                                    + Integer.valueOf(strPageSize));
                    data = InvoiceData.select(this, "ROWNUM", vars
                            .getSqlDateFormat(), Utility.getContext(this, vars,
                            "#User_Client", "Invoice"), Utility
                            .getSelectorOrgs(this, vars, strOrg), strName,
                            strDescription, strBpartnerId, strOrder,
                            strDateFrom, DateTimeData.nDaysAfter(this,
                                    strFechaTo, "1"), strCal1, strCalc2,
                            strSOTrx, strOrderBy, oraLimit, "");
                } else {
                    String pgLimit = strPageSize + " OFFSET " + strOffset;
                    data = InvoiceData.select(this, "1", vars
                            .getSqlDateFormat(), Utility.getContext(this, vars,
                            "#User_Client", "Invoice"), Utility
                            .getSelectorOrgs(this, vars, strOrg), strName,
                            strDescription, strBpartnerId, strOrder,
                            strDateFrom, DateTimeData.nDaysAfter(this,
                                    strFechaTo, "1"), strCal1, strCalc2,
                            strSOTrx, strOrderBy, "", pgLimit);
                }
            } catch (ServletException e) {
                log4j.error("Error in print page data: " + e);
                e.printStackTrace();
                OBError myError = Utility.translateError(this, vars, vars
                        .getLanguage(), e.getMessage());
                if (!myError.isConnectionAvailable()) {
                    bdErrorAjax(response, "Error", "Connection Error",
                            "No database connection");
                    return;
                } else {
                    type = myError.getType();
                    title = myError.getTitle();
                    if (!myError.getMessage().startsWith("<![CDATA["))
                        description = "<![CDATA[" + myError.getMessage()
                                + "]]>";
                    else
                        description = myError.getMessage();
                }
            } catch (Exception e) {
                if (log4j.isDebugEnabled())
                    log4j.debug("Error obtaining rows data");
                type = "Error";
                title = "Error";
                if (e.getMessage().startsWith("<![CDATA["))
                    description = "<![CDATA[" + e.getMessage() + "]]>";
                else
                    description = e.getMessage();
                e.printStackTrace();
            }
        }

        if (!type.startsWith("<![CDATA["))
            type = "<![CDATA[" + type + "]]>";
        if (!title.startsWith("<![CDATA["))
            title = "<![CDATA[" + title + "]]>";
        if (!description.startsWith("<![CDATA["))
            description = "<![CDATA[" + description + "]]>";
        StringBuffer strRowsData = new StringBuffer();
        strRowsData.append("<xml-data>\n");
        strRowsData.append("  <status>\n");
        strRowsData.append("    <type>").append(type).append("</type>\n");
        strRowsData.append("    <title>").append(title).append("</title>\n");
        strRowsData.append("    <description>").append(description).append(
                "</description>\n");
        strRowsData.append("  </status>\n");
        strRowsData.append("  <rows numRows=\"").append(strNumRows).append(
                "\">\n");
        if (data != null && data.length > 0) {
            for (int j = 0; j < data.length; j++) {
                strRowsData.append("    <tr>\n");
                for (int k = 0; k < headers.length; k++) {
                    strRowsData.append("      <td><![CDATA[");
                    String columnname = headers[k].getField("columnname");

                    if ((data[j].getField(columnname)) != null) {
                        if (headers[k].getField("adReferenceId").equals("32"))
                            strRowsData.append(strReplaceWith).append(
                                    "/images/");
                        strRowsData.append(data[j].getField(columnname)
                                .replaceAll("<b>", "").replaceAll("<B>", "")
                                .replaceAll("</b>", "").replaceAll("</B>", "")
                                .replaceAll("<i>", "").replaceAll("<I>", "")
                                .replaceAll("</i>", "").replaceAll("</I>", "")
                                .replaceAll("<p>", "&nbsp;").replaceAll("<P>",
                                        "&nbsp;").replaceAll("<br>", "&nbsp;")
                                .replaceAll("<BR>", "&nbsp;"));
                    } else {
                        if (headers[k].getField("adReferenceId").equals("32")) {
                            strRowsData.append(strReplaceWith).append(
                                    "/images/blank.gif");
                        } else
                            strRowsData.append("&nbsp;");
                    }
                    strRowsData.append("]]></td>\n");
                }
                strRowsData.append("    </tr>\n");
            }
        }
        strRowsData.append("  </rows>\n");
        strRowsData.append("</xml-data>\n");

        response.setContentType("text/xml; charset=UTF-8");
        response.setHeader("Cache-Control", "no-cache");
        PrintWriter out = response.getWriter();
        if (log4j.isDebugEnabled())
            log4j.debug(strRowsData.toString());
        out.print(strRowsData.toString());
        out.close();

    }

    public String getServletInfo() {
        return "Servlet that presents the business partners seeker";
    } // end of getServletInfo() method
}
