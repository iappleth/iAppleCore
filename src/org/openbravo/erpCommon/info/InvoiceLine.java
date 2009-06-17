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
 * All portions are Copyright (C) 2001-2009 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.erpCommon.info;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Vector;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.openbravo.base.filter.RequestFilter;
import org.openbravo.base.filter.ValueListFilter;
import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.data.FieldProvider;
import org.openbravo.erpCommon.utility.DateTimeData;
import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.erpCommon.utility.SQLReturnObject;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.utils.Replace;
import org.openbravo.xmlEngine.XmlDocument;

public class InvoiceLine extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  private static final String[] colNames = { "BPARTNER_NAME", "DATEINVOICED", "DOCUMENTNO",
      "ISSOTRX", "PRODUCT_NAME", "QTY", "PRICEACTUAL", "LINENETAMT", "C_INVOICELINE_ID", "ROWKEY" };
  private static final RequestFilter columnFilter = new ValueListFilter(colNames);
  private static final RequestFilter directionFilter = new ValueListFilter("asc", "desc");

  public void init(ServletConfig config) {
    super.init(config);
    boolHist = false;
  }

  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException,
      ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);

    if (vars.commandIn("DEFAULT")) {
      String strNameValue = vars.getRequestGlobalVariable("inpNameValue", "InvoiceLine.name");
      vars.getRequestGlobalVariable("WindowID", "InvoiceLine.windowId");
      vars.getRequestGlobalVariable("inpProduct", "InvoiceLine.product");
      vars.getRequestGlobalVariable("inpBPartner", "InvoiceLine.bpartner");
      if (!strNameValue.equals("")) {
        int i = 0, count = 1, inicio = 0;
        String search = " - ", token = "";
        do {
          i = strNameValue.indexOf(search, inicio);
          if (i >= 0) {
            token = strNameValue.substring(inicio, i).trim();
            inicio = i + search.length();
          } else {
            token = strNameValue.substring(inicio).trim();
          }

          switch (count) {
          case 1:
            vars.setSessionValue("InvoiceLine.documentno", token);
            break;
          case 2:
            vars.setSessionValue("InvoiceLine.datefrom", token);
            vars.setSessionValue("InvoiceLine.dateto", token);
            break;
          case 3:
            vars.setSessionValue("InvoiceLine.grandtotalfrom", token);
            vars.setSessionValue("InvoiceLine.grandtotalto", token);
            break;
          case 4:
            vars.setSessionValue("InvoiceLine.lineno", token);
            break;
          case 5:
            vars.setSessionValue("InvoiceLine.linenet", token);
            break;
          }
          count++;
        } while (i != -1);
      }
      String strBPartner = vars.getGlobalVariable("inpcBpartnerId", "InvoiceLine.bpartner", "");
      String strProduct = vars.getGlobalVariable("inpmProductId", "InvoiceLine.product", "");
      String strDocumentNo = vars.getGlobalVariable("inpdocumentno", "InvoiceLine.documentno", "");
      String strDateFrom = vars.getGlobalVariable("inpDateFrom", "InvoiceLine.datefrom", "");
      String strDateTo = vars.getGlobalVariable("inpDateTo", "InvoiceLine.dateto", "");
      String strCal1 = vars.getGlobalVariable("inpCal1", "InvoiceLine.grandtotalfrom", "");
      String strCal2 = vars.getGlobalVariable("inpCal2", "InvoiceLine.grandtotalto", "");
      printPage(response, vars, strBPartner, strProduct, strDocumentNo, strDateFrom, strDateTo,
          strCal1, strCal2);
    } else if (vars.commandIn("KEY")) {
      String strKeyValue = vars.getRequestGlobalVariable("inpNameValue", "InvoiceLine.key");
      vars.getRequestGlobalVariable("WindowID", "InvoiceLine.windowId");

      vars.setSessionValue("InvoiceLine.documentno", strKeyValue + "%");
      InvoiceLineData[] data = null;
      String strOrg = vars.getStringParameter("inpAD_Org_ID");
      data = InvoiceLineData.selectKey(this, Utility.getContext(this, vars, "#User_Client",
          "InvoiceLine"), Utility.getSelectorOrgs(this, vars, strOrg), strKeyValue + "%");

      if (data != null && data.length == 1)
        printPageKey(response, vars, data);
      else {
        String strBPartner = vars.getGlobalVariable("inpcBpartnerId", "InvoiceLine.bpartner", "");
        String strProduct = vars.getGlobalVariable("inpmProductId", "InvoiceLine.product", "");
        String strDocumentNo = vars
            .getGlobalVariable("inpdocumentno", "InvoiceLine.documentno", "");
        String strDateFrom = vars.getGlobalVariable("inpDateFrom", "InvoiceLine.datefrom", "");
        String strDateTo = vars.getGlobalVariable("inpDateTo", "InvoiceLine.dateto", "");
        String strCal1 = vars.getGlobalVariable("inpCal1", "InvoiceLine.grandtotalfrom", "");
        String strCal2 = vars.getGlobalVariable("inpCal2", "InvoiceLine.grandtotalto", "");
        printPage(response, vars, strBPartner, strProduct, strDocumentNo, strDateFrom, strDateTo,
            strCal1, strCal2);
      }
    } else if (vars.commandIn("STRUCTURE")) {
      printGridStructure(response, vars);
    } else if (vars.commandIn("DATA")) {

      if (vars.getStringParameter("NewFilter").equals("1"))
        clearSessionVariables(vars);

      String strBpartnerId = vars.getGlobalVariable("inpBpartnerId", "InvoiceLine.bpartner", "");
      String strProduct = vars.getGlobalVariable("inpmProductId", "InvoiceLine.product", "");
      String strDocumentNo = vars.getGlobalVariable("inpdocumentno", "InvoiceLine.documentno", "");
      String strDateFrom = vars.getGlobalVariable("inpDateFrom", "InvoiceLine.datefrom", "");
      String strDateTo = vars.getGlobalVariable("inpDateTo", "InvoiceLine.dateto", "");
      String strDescription = vars.getGlobalVariable("inpDescription", "InvoiceLine.description",
          "");
      String strCal1 = vars.getGlobalVariable("inpCal1", "InvoiceLine.grandtotalfrom", "");
      String strCal2 = vars.getGlobalVariable("inpCal2", "InvoiceLine.grandtotalto", "");
      String strOrder = vars.getGlobalVariable("inpInvoice", "InvoiceLine.invoice", "");
      String strOrg = vars.getGlobalVariable("inpInvoice", "InvoiceLine.adorgid", "");

      String strNewFilter = vars.getStringParameter("newFilter");
      String strOffset = vars.getStringParameter("offset");
      String strPageSize = vars.getStringParameter("page_size");
      String strSortCols = vars.getInStringParameter("sort_cols", columnFilter);
      String strSortDirs = vars.getInStringParameter("sort_dirs", directionFilter);

      printGridData(response, vars, strDocumentNo, strBpartnerId, strDateFrom, strDateTo,
          strDescription, strCal1, strCal2, strOrder, strProduct, strSortCols, strSortDirs,
          strOffset, strPageSize, strNewFilter, strOrg);

    } else
      pageError(response);
  }

  private void printPageKey(HttpServletResponse response, VariablesSecureApp vars,
      InvoiceLineData[] data) throws IOException, ServletException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: sale-order-lines seeker Frame Set");
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/info/SearchUniqueKeyResponse").createXmlDocument();

    xmlDocument.setParameter("script", generateResult(data));
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  private String generateResult(InvoiceLineData[] data) throws IOException, ServletException {
    StringBuffer html = new StringBuffer();
    if (log4j.isDebugEnabled())
      log4j.debug("Save- clave:" + data[0].cInvoicelineId + " txt:" + data[0].lineText);
    html.append("\nfunction validateSelector() {\n");
    html.append("var key = \"" + data[0].cInvoicelineId + "\";\n");
    html.append("var text = \"" + Replace.replace(data[0].lineText, "\"", "\\\"") + "\";\n");
    html.append("parent.opener.closeSearch(\"SAVE\", key, text);\n");
    html.append("}\n");
    return html.toString();
  }

  private void printPage(HttpServletResponse response, VariablesSecureApp vars, String strBPartner,
      String strProduct, String strDocumentNo, String strDateFrom, String strDateTo,
      String strCal1, String strCal2) throws IOException, ServletException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: Frame 1 of sale-order-lines seeker");
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/info/InvoiceLine")
        .createXmlDocument();
    if (strBPartner.equals("") && strProduct.equals("") && strDocumentNo.equals("")
        && strDateFrom.equals("") && strDateTo.equals("") && strCal1.equals("")
        && strCal2.equals("")) {
      strDocumentNo = "%";
    }
    xmlDocument.setParameter("calendar", vars.getLanguage().substring(0, 2));
    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("theme", vars.getTheme());
    xmlDocument.setParameter("documentno", strDocumentNo);
    xmlDocument.setParameter("datefrom", strDateFrom);
    xmlDocument.setParameter("dateto", strDateTo);
    xmlDocument.setParameter("grandtotalfrom", strCal1);
    xmlDocument.setParameter("grandtotalto", strCal2);
    xmlDocument.setParameter("cBpartnerId", strBPartner);
    xmlDocument.setParameter("cBpartnerId_DES", InvoiceLineData.selectBPartner(this, strBPartner));
    xmlDocument.setParameter("mProductId", strProduct);
    xmlDocument.setParameter("mProductId_DES", InvoiceLineData.selectProduct(this, strProduct));
    xmlDocument.setParameter("dateFromdisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateFromsaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateTodisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateTosaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  private void printGridStructure(HttpServletResponse response, VariablesSecureApp vars)
      throws IOException, ServletException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: print page structure");
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/utility/DataGridStructure").createXmlDocument();

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
    String[] colWidths = { "220", "80", "110", "35", "170", "60", "50", "55", "0", "0" };
    for (int i = 0; i < colNames.length; i++) {
      SQLReturnObject dataAux = new SQLReturnObject();
      dataAux.setData("columnname", colNames[i]);
      dataAux.setData("gridcolumnname", colNames[i]);
      dataAux.setData("adReferenceId", "AD_Reference_ID");
      dataAux.setData("adReferenceValueId", "AD_ReferenceValue_ID");
      dataAux.setData("isidentifier", (colNames[i].equals("rowkey") ? "true" : "false"));
      dataAux.setData("iskey", (colNames[i].equals("ROWKEY") ? "true" : "false"));
      dataAux.setData("isvisible",
          (colNames[i].endsWith("_ID") || colNames[i].equals("ROWKEY") ? "false" : "true"));
      String name = Utility.messageBD(this, "ILS_" + colNames[i].toUpperCase(), vars.getLanguage());
      dataAux.setData("name", (name.startsWith("ILS_") ? colNames[i] : name));
      dataAux.setData("type", "string");
      dataAux.setData("width", colWidths[i]);
      vAux.addElement(dataAux);
    }
    data = new SQLReturnObject[vAux.size()];
    vAux.copyInto(data);
    return data;
  }

  private void printGridData(HttpServletResponse response, VariablesSecureApp vars,
      String strDocumentNo, String strBpartnerId, String strDateFrom, String strDateTo,
      String strDescription, String strCal1, String strCal2, String strOrder, String strProduct,
      String strOrderCols, String strOrderDirs, String strOffset, String strPageSize,
      String strNewFilter, String strOrg) throws IOException, ServletException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: print page rows");

    SQLReturnObject[] headers = getHeaders(vars);
    FieldProvider[] data = null;
    String type = "Hidden";
    String title = "";
    String description = "";
    String strNumRows = "0";
    int offset = Integer.valueOf(strOffset).intValue();
    int pageSize = Integer.valueOf(strPageSize).intValue();

    if (headers != null) {
      try {
        // build sql orderBy clause
        String strOrderBy = SelectorUtility.buildOrderByClause(strOrderCols, strOrderDirs);

        // remove single % in parameters used in like upper(parameter)
        if (strDocumentNo.equals("%")) {
          strDocumentNo = null;
        }
        if (strDescription.equals("%")) {
          strDescription = null;
        }
        if (strOrder.equals("%")) {
          strOrder = null;
        }

        if (strNewFilter.equals("1") || strNewFilter.equals("")) { // New
          // filter
          // or
          // first
          // load
          strNumRows = InvoiceLineData.countRows(this, Utility.getContext(this, vars,
              "#User_Client", "InvoiceLine"), Utility.getSelectorOrgs(this, vars, strOrg),
              strDocumentNo, strDescription, strOrder, strBpartnerId, strDateFrom, DateTimeData
                  .nDaysAfter(this, strDateTo, "1"), strCal1, strCal2, strProduct);
          vars.setSessionValue("BusinessPartnerInfo.numrows", strNumRows);
        } else {
          strNumRows = vars.getSessionValue("BusinessPartnerInfo.numrows");
        }
        // Filtering result
        if (this.myPool.getRDBMS().equalsIgnoreCase("ORACLE")) {
          String oraLimit = (offset + 1) + " AND " + String.valueOf(offset + pageSize);
          data = InvoiceLineData.select(this, "ROWNUM", Utility.getContext(this, vars,
              "#User_Client", "InvoiceLine"), Utility.getSelectorOrgs(this, vars, strOrg),
              strDocumentNo, strDescription, strOrder, strBpartnerId, strDateFrom, DateTimeData
                  .nDaysAfter(this, strDateTo, "1"), strCal1, strCal2, strProduct, strOrderBy,
              oraLimit, "");
        } else {
          String pgLimit = pageSize + " OFFSET " + offset;
          data = InvoiceLineData.select(this, "1", Utility.getContext(this, vars, "#User_Client",
              "InvoiceLine"), Utility.getSelectorOrgs(this, vars, strOrg), strDocumentNo,
              strDescription, strOrder, strBpartnerId, strDateFrom, DateTimeData.nDaysAfter(this,
                  strDateTo, "1"), strCal1, strCal2, strProduct, strOrderBy, "", pgLimit);
        }
      } catch (ServletException e) {
        log4j.error("Error in print page data: " + e);
        e.printStackTrace();
        OBError myError = Utility.translateError(this, vars, vars.getLanguage(), e.getMessage());
        if (!myError.isConnectionAvailable()) {
          bdErrorAjax(response, "Error", "Connection Error", "No database connection");
          return;
        } else {
          type = myError.getType();
          title = myError.getTitle();
          if (!myError.getMessage().startsWith("<![CDATA["))
            description = "<![CDATA[" + myError.getMessage() + "]]>";
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
    strRowsData.append("    <description>").append(description).append("</description>\n");
    strRowsData.append("  </status>\n");
    strRowsData.append("  <rows numRows=\"").append(strNumRows).append("\">\n");
    if (data != null && data.length > 0) {
      for (int j = 0; j < data.length; j++) {
        strRowsData.append("    <tr>\n");
        for (int k = 0; k < headers.length; k++) {
          strRowsData.append("      <td><![CDATA[");
          String columnname = headers[k].getField("columnname");

          if ((data[j].getField(columnname)) != null) {
            if (headers[k].getField("adReferenceId").equals("32"))
              strRowsData.append(strReplaceWith).append("/images/");
            strRowsData.append(data[j].getField(columnname).replaceAll("<b>", "").replaceAll("<B>",
                "").replaceAll("</b>", "").replaceAll("</B>", "").replaceAll("<i>", "").replaceAll(
                "<I>", "").replaceAll("</i>", "").replaceAll("</I>", "")
                .replaceAll("<p>", "&nbsp;").replaceAll("<P>", "&nbsp;").replaceAll("<br>",
                    "&nbsp;").replaceAll("<BR>", "&nbsp;"));
          } else {
            if (headers[k].getField("adReferenceId").equals("32")) {
              strRowsData.append(strReplaceWith).append("/images/blank.gif");
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

  private void clearSessionVariables(VariablesSecureApp vars) {
    vars.removeSessionValue("InvoiceLine.bpartner");
    vars.removeSessionValue("InvoiceLine.product");
    vars.removeSessionValue("InvoiceLine.documentno");
    vars.removeSessionValue("InvoiceLine.datefrom");
    vars.removeSessionValue("InvoiceLine.dateto");
    vars.removeSessionValue("InvoiceLine.description");
    vars.removeSessionValue("InvoiceLine.grandtotalfrom");
    vars.removeSessionValue("InvoiceLine.grandtotalto");
    vars.removeSessionValue("InvoiceLine.invoice");
  }

  public String getServletInfo() {
    return "Servlet that presents que sale-orders lines seeker";
  } // end of getServletInfo() method
}
