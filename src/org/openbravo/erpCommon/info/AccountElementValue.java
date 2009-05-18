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
 * All portions are Copyright (C) 2009 Openbravo SL
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

import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.data.FieldProvider;
import org.openbravo.erpCommon.utility.ComboTableData;
import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.erpCommon.utility.SQLReturnObject;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.utils.Replace;
import org.openbravo.xmlEngine.XmlDocument;

public class AccountElementValue extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  public void init(ServletConfig config) {
    super.init(config);
    boolHist = false;
  }

  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException,
      ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);
    if (vars.commandIn("DEFAULT")) {
      String strWindowId = vars.getStringParameter("WindowID");
      String strNameValue = vars.getRequestGlobalVariable("inpNameValue",
          "AccountElementValue.name");
      String strAcctSchema = vars.getSessionValue(strWindowId + "|C_AcctSchema_ID");
      if (strAcctSchema.equals("")) {
        strAcctSchema = vars.getRequestGlobalVariable("inpAcctSchema",
            "AccountElementValue.cAcctschemaId");
      }
      if (strAcctSchema.equals("")) {
        strAcctSchema = Utility.getContext(this, vars, "$C_AcctSchema_ID", "AccountElementValue");
        vars.setSessionValue("AccountElementValue.cAcctschemaId", strAcctSchema);
      } else
        vars.setSessionValue("$C_AcctSchema_ID", strAcctSchema);

      vars.removeSessionValue("AccountElementValue.value");
      if (!strNameValue.equals(""))
        vars.setSessionValue("AccountElementValue.name", strNameValue + "%");

      String strValue = vars.getGlobalVariable("inpValue", "AccountElementValue.value", "");
      String strName = vars.getGlobalVariable("inpName", "AccountElementValue.name", "");
      printPage(response, vars, strValue, strName, "", strAcctSchema, true);
    } else if (vars.commandIn("STRUCTURE")) {
      printGridStructure(response, vars);
    } else if (vars.commandIn("DATA")) {
      if (vars.getStringParameter("newFilter").equals("1"))
        clearSessionValues(vars);
      String strWindowId = vars.getStringParameter("WindowID");
      String strAcctSchema = vars.getSessionValue(strWindowId + "|C_AcctSchema_ID");
      if (strAcctSchema.equals("")) {
        strAcctSchema = vars.getRequestGlobalVariable("inpAcctSchema",
            "AccountElementValue.cAcctschemaId");
      }
      if (strAcctSchema.equals("")) {
        strAcctSchema = Utility.getContext(this, vars, "$C_AcctSchema_ID", "AccountElementValue");
        vars.setSessionValue("AccountElementValue.cAcctschemaId", strAcctSchema);
      } else
        vars.setSessionValue("$C_AcctSchema_ID", strAcctSchema);
      String strValue = vars.getGlobalVariable("inpValue", "AccountElementValue.value", "");
      String strName = vars.getGlobalVariable("inpName", "AccountElementValue.name", "");
      String strOrganization = vars.getStringParameter("inpOrganization");
      String strAccountElementValue = vars.getStringParameter("inpAccountElementValueId");
      String strNewFilter = vars.getStringParameter("newFilter");
      String strOffset = vars.getStringParameter("offset");
      String strPageSize = vars.getStringParameter("page_size");
      String strSortCols = vars.getInStringParameter("sort_cols");
      String strSortDirs = vars.getInStringParameter("sort_dirs");
      printGridData(response, vars, strValue, strName, strOrganization, strAccountElementValue,
          strSortCols, strSortDirs, strOffset, strPageSize, strNewFilter, strAcctSchema);
    } else if (vars.commandIn("KEY")) {
      String strKeyValue = vars.getRequestGlobalVariable("inpNameValue",
          "AccountElementValue.value");
      String strAcctSchema = vars.getRequestGlobalVariable("inpAcctSchema",
          "AccountElementValue.cAcctschemaId");
      if (strAcctSchema.equals("")) {
        strAcctSchema = Utility.getContext(this, vars, "$C_AcctSchema_ID", "AccountElementValue");
        vars.setSessionValue("AccountElementValue.cAcctschemaId", strAcctSchema);
      }
      vars.removeSessionValue("AccountElementValue.name");
      vars.setSessionValue("AccountElementValue.value", strKeyValue + "%");
      String strOrg = vars.getStringParameter("inpAD_Org_ID");
      AccountElementValueData[] data = AccountElementValueData.selectKey(this, strAcctSchema,
          Utility.getContext(this, vars, "#User_Client", "AccountElementValue"), Utility
              .getSelectorOrgs(this, vars, strOrg), strKeyValue + "%");
      if (data != null && data.length == 1) {
        printPageKey(response, vars, data);
      } else
        printPage(response, vars, strKeyValue + "%", "", "", strAcctSchema, true);
    } else
      pageError(response);
  }

  void printPageSave(HttpServletResponse response, VariablesSecureApp vars,
      AccountElementValueData data) throws IOException, ServletException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: Saved");
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(data.name);
    out.close();
  }

  void printPageKey(HttpServletResponse response, VariablesSecureApp vars,
      AccountElementValueData[] data) throws IOException, ServletException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: AccountElementValue seeker Frame Set");
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/info/SearchUniqueKeyResponse").createXmlDocument();

    xmlDocument.setParameter("script", generateResult(data));
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  String generateResult(AccountElementValueData[] data) throws IOException, ServletException {
    StringBuffer html = new StringBuffer();

    html.append("\nfunction validateSelector() {\n");
    html.append("var key = \"" + data[0].cElementvalueId + "\";\n");
    html.append("var text = \"" + Replace.replace(data[0].name, "\"", "\\\"") + "\";\n");
    html.append("parent.opener.closeSearch(\"SAVE\", key, text, null);\n");
    html.append("}\n");
    return html.toString();
  }

  void printPage(HttpServletResponse response, VariablesSecureApp vars, String strValue,
      String strName, String strElementValue, String strAcctSchema, boolean isDefault)
      throws IOException, ServletException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: Frame 1 of the AccountElementValues seeker");
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/info/AccountElementValue").createXmlDocument();
    AccountElementValueData[] data = null;
    if (isDefault) {
      if (strValue.equals("") && strName.equals(""))
        strValue = "%";
      data = AccountElementValueData.set(strValue, strName);
    } else {
      data = AccountElementValueData.select(this, "1", "", "", "", "", strElementValue, Utility
          .getContext(this, vars, "#User_Client", "AccountElementValue"), Utility.getContext(this,
          vars, "#User_Org", "AccountElementValue"), "1 ASC", "", "");
    }
    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("theme", vars.getTheme());
    xmlDocument.setData("structure1", data);

    try {
      // Utility.getContext(conn, vars, "#AccessibleOrgTree", windowId,
      // accesslevel)

      ComboTableData comboTableData = new ComboTableData(vars, this, "19", "AD_Org_ID", "", "",
          Utility.getContext(this, vars, "#AccessibleOrgTree", "AccountElementValue"), Utility
              .getContext(this, vars, "#User_Client", "AccountElementValue"), 0);
      Utility.fillSQLParameters(this, vars, null, comboTableData, "AccountElementValue", "");
      xmlDocument.setData("reportAD_Org_ID", "liststructure", comboTableData.select(false));
      comboTableData = null;
    } catch (Exception ex) {
      throw new ServletException(ex);
    }

    xmlDocument.setParameter("orgs", vars.getStringParameter("inpAD_Org_ID"));

    xmlDocument.setParameter("grid", "20");
    xmlDocument.setParameter("grid_Offset", "");
    xmlDocument.setParameter("grid_SortCols", "1");
    xmlDocument.setParameter("grid_SortDirs", "ASC");
    xmlDocument.setParameter("grid_Default", "0");

    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  void printGridStructure(HttpServletResponse response, VariablesSecureApp vars)
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
    String[] colNames = { "Value", "NAME", "AD_ORG_ID_D", "C_ELEMENTVALUE_ID", "ROWKEY" };
    String[] colWidths = { "204", "401", "151", "0", "0" };
    for (int i = 0; i < colNames.length; i++) {
      SQLReturnObject dataAux = new SQLReturnObject();
      dataAux.setData("columnname", colNames[i]);
      dataAux.setData("gridcolumnname", colNames[i]);
      dataAux.setData("adReferenceId", "AD_Reference_ID");
      dataAux.setData("adReferenceValueId", "AD_ReferenceValue_ID");
      dataAux.setData("isidentifier", (colNames[i].equals("ROWKEY") ? "true" : "false"));
      dataAux.setData("iskey", (colNames[i].equals("ROWKEY") ? "true" : "false"));
      dataAux.setData("isvisible", (colNames[i].endsWith("_ID") ? "false" : "true"));
      String name = Utility
          .messageBD(this, "ACCS_" + colNames[i].toUpperCase(), vars.getLanguage());
      dataAux.setData("name", (name.startsWith("ACCS_") ? colNames[i] : name));
      dataAux.setData("type", "string");
      dataAux.setData("width", colWidths[i]);
      vAux.addElement(dataAux);
    }
    data = new SQLReturnObject[vAux.size()];
    vAux.copyInto(data);
    return data;
  }

  void printGridData(HttpServletResponse response, VariablesSecureApp vars, String strValue,
      String strName, String strOrganization, String strAccountElementValue, String strOrderCols,
      String strOrderDirs, String strOffset, String strPageSize, String strNewFilter,
      String strAcctSchema) throws IOException, ServletException {
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
        // validate orderby parameters and build sql orderBy clause
        String strOrderBy = SelectorUtility.buildOrderByClause(strOrderCols, strOrderDirs, headers);

        strAcctSchema = (strAcctSchema.equals("%") ? "" : strAcctSchema);
        strValue = (strValue.equals("%") ? "" : strValue);
        strName = (strName.equals("%") ? "" : strName);
        if (strNewFilter.equals("1") || strNewFilter.equals("")) { // New
          // filter
          // or
          // first
          // load
          strNumRows = AccountElementValueData.countRows(this, strAcctSchema, strValue, strName,
              strOrganization, strAccountElementValue, Utility.getContext(this, vars,
                  "#User_Client", "AccountElementValue"), Utility.getContext(this, vars,
                  "#User_Org", "AccountElementValue"));
          vars.setSessionValue("AccountElementValueInfo.numrows", strNumRows);
        } else {
          strNumRows = vars.getSessionValue("AccountElementValueInfo.numrows");
        }

        // Filtering result
        if (this.myPool.getRDBMS().equalsIgnoreCase("ORACLE")) {
          String oraLimit = (offset + 1) + " AND " + String.valueOf(offset + pageSize);
          data = AccountElementValueData.select(this, "ROWNUM", strAcctSchema, strValue, strName,
              strOrganization, strAccountElementValue, Utility.getContext(this, vars,
                  "#User_Client", "AccountElementValue"), Utility.getContext(this, vars,
                  "#User_Org", "AccountElementValue"), strOrderBy, oraLimit, "");
        } else {
          String pgLimit = pageSize + " OFFSET " + offset;
          data = AccountElementValueData.select(this, "1", strAcctSchema, strValue, strName,
              strOrganization, strAccountElementValue, Utility.getContext(this, vars,
                  "#User_Client", "AccountElementValue"), Utility.getContext(this, vars,
                  "#User_Org", "AccountElementValue"), strOrderBy, "", pgLimit);
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

  private void clearSessionValues(VariablesSecureApp vars) {
    vars.removeSessionValue("");
  }

  public String getServletInfo() {
    return "Servlet that presents que AccountElementValues seeker";
  } // end of getServletInfo() method
}
