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
 * All portions are Copyright (C) 2001-2007 Openbravo SL 
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
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Vector;

import javax.servlet.*;
import javax.servlet.http.*;

import org.openbravo.erpCommon.utility.ComboTableData;

import org.openbravo.erpCommon.utility.DateTimeData;

public class DebtPayment extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  public void init (ServletConfig config) {
    super.init(config);
    boolHist = false;
  }

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);

    if (vars.commandIn("DEFAULT") || vars.commandIn("KEY")) {
      printPage(response, vars);
    } else if (vars.commandIn("STRUCTURE")) {
      printGridStructure(response, vars);
    } else if(vars.commandIn("DATA")) {
      
      if(vars.getStringParameter("newFilter").equals("1")) {
        cleanSessionValue(vars);                
      }
      
      String strBpartnerId = vars.getGlobalVariable("inpBpartnerId", "DebtPayment.inpBpartnerId", "");
      String strDateFrom = vars.getGlobalVariable("inpDateFrom", "DebtPayment.inpDateFrom", "");
      String strDateTo = vars.getGlobalVariable("inpDateTo", "DebtPayment.inpDateTo", "");
      String strCal1 = vars.getGlobalVariable("inpCal1", "DebtPayment.inpCal1", "");
      String strCal2 = vars.getGlobalVariable("inpCal2", "DebtPayment.inpCal2", "");
      String strPaymentRule = vars.getGlobalVariable("inpCPaymentRuleId", "DebtPayment.inpCPaymentRuleId", "");
      String strIsReceipt = vars.getGlobalVariable("inpIsReceipt", "DebtPayment.inpIsReceipt", "Y");
      String strIsPaid = vars.getGlobalVariable("inpIsPaid", "DebtPayment.inpIsPaid", "N");
      String strIsPending = vars.getGlobalVariable("inpPending", "DebtPayment.inpPending", "P");
      String strInvoice = vars.getGlobalVariable("inpInvoice","DebtPayment.inpInvoice", "");
      String strOrder = vars.getGlobalVariable("inpOrder", "DebtPayment.inpOrder", "");
      
      String strNewFilter = vars.getStringParameter("newFilter");
      String strOffset = vars.getStringParameter("offset");
      String strPageSize = vars.getStringParameter("page_size");
      String strSortCols = vars.getStringParameter("sort_cols").toUpperCase();
      String strSortDirs = vars.getStringParameter("sort_dirs").toUpperCase();
      
      printGridData(response, vars, strBpartnerId, strDateFrom, strDateTo, strCal1, strCal2, strPaymentRule, strIsReceipt, strIsPaid, strIsPending, strOrder, strInvoice, strSortCols + " " + strSortDirs, strOffset, strPageSize, strNewFilter);
    } else pageError(response);
  }

  void printPageFS(HttpServletResponse response, VariablesSecureApp vars) throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: DebtPayments seeker Frame Set");
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/info/DebtPayment_FS").createXmlDocument();

    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  void printPage(HttpServletResponse response, VariablesSecureApp vars) throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: Frame 1 of the DebtPayments seeker");
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/info/DebtPayment").createXmlDocument();
    xmlDocument.setParameter("calendar", vars.getLanguage().substring(0,2));
    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("theme", vars.getTheme());
    try {
      ComboTableData comboTableData = new ComboTableData(vars, this, "LIST", "", "All_Payment Rule", "", Utility.getContext(this, vars, "#User_Org", "DebtPayment"), Utility.getContext(this, vars, "#User_Client", "DebtPayment"), 0);
      Utility.fillSQLParameters(this, vars, null, comboTableData, "DebtPayment", "");
      xmlDocument.setData("reportPaymentRule","liststructure", comboTableData.select(false));
      comboTableData = null;
    } catch (Exception ex) {
      throw new ServletException(ex);
    }
    
    // Set default filter values due to heavy load. From date = To Date = Today
    String strDateFormat = vars.getJavaDateFormat();
    SimpleDateFormat dateFormat = new SimpleDateFormat(strDateFormat);
    Date today = new Date();
    xmlDocument.setParameter("dateFromValue", dateFormat.format(today));
    xmlDocument.setParameter("dateToValue", dateFormat.format(today));    
    
    vars.setSessionValue("DebtPayment.inpDateFrom", dateFormat.format(today));
    vars.setSessionValue("DebtPayment.inpDateTo", dateFormat.format(today));
    
    xmlDocument.setParameter("dateFromdisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateFromsaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateTodisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateTosaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  void printGridStructure(HttpServletResponse response, VariablesSecureApp vars) throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: print page structure");
      XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/utility/DataGridStructure").createXmlDocument();
      
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
      if (log4j.isDebugEnabled()) log4j.debug(xmlDocument.print());
      out.println(xmlDocument.print());
      out.close();
  }
  
  private SQLReturnObject[] getHeaders(VariablesSecureApp vars) {
    SQLReturnObject[] data = null;
    Vector<SQLReturnObject> vAux = new Vector<SQLReturnObject>();   
    String[] colNames = {"BPARTNER", "ORDERNO","INVOICE","DATEPLANNED", "AMOUNT", "WRITEOFFAMT", "CURRENCY", "PAYMENTRULE", "DEBTCANCEL", "DEBTGENERATE", "C_DEBT_PAYMENT_ID", "ROWKEY"};
    String[] colWidths = {"113", "59", "57", "60", "65", "62", "55", "81", "110", "110", "0", "0"};
    for(int i=0; i < colNames.length; i++) {
      SQLReturnObject dataAux = new SQLReturnObject();
      dataAux.setData("columnname", colNames[i]);
        dataAux.setData("gridcolumnname", colNames[i]);
        dataAux.setData("adReferenceId", "AD_Reference_ID");
        dataAux.setData("adReferenceValueId", "AD_ReferenceValue_ID");        
        dataAux.setData("isidentifier", (colNames[i].equals("ROWKEY")?"true":"false"));
        dataAux.setData("iskey", (colNames[i].equals("ROWKEY")?"true":"false"));
        dataAux.setData("isvisible", (colNames[i].endsWith("_ID") || colNames[i].equals("ROWKEY")?"false":"true"));
        String name = Utility.messageBD(this, "DPS_" + colNames[i].toUpperCase(), vars.getLanguage());
        dataAux.setData("name", (name.startsWith("DPS_")?colNames[i]:name));
        dataAux.setData("type", "string");
        dataAux.setData("width", colWidths[i]);
        vAux.addElement(dataAux);
    }
    data = new SQLReturnObject[vAux.size()];
    vAux.copyInto(data);
    return data;
  }
  
  void printGridData(HttpServletResponse response, VariablesSecureApp vars, String strBpartnerId, String strDateFrom, String strDateTo, String strCal1, String strCal2, String strPaymentRule, String strIsReceipt, String strIsPaid, String strIsPending, String strOrder, String strInvoice, String strOrderBy, String strOffset, String strPageSize, String strNewFilter ) throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: print page rows");
    
    SQLReturnObject[] headers = getHeaders(vars);
    FieldProvider[] data = null;
    String type = "Hidden";
    String title = "";
    String description = "";
    String strNumRows = "0";

    // adjust to either pending or any other state then pending
    strIsPending = strIsPending.equals("P")?"= 'P'":"<> 'P'";

    if (headers!=null) {
      try{
      if(strNewFilter.equals("1") || strNewFilter.equals("")) { // New filter or first load
        data = DebtPaymentData.select(this, "1", vars.getLanguage(), Utility.getContext(this, vars, "#User_Client", "DebtPayment"), Utility.getContext(this, vars, "#User_Org", "DebtPayment"), strBpartnerId,  strDateFrom, DateTimeData.nDaysAfter(this,strDateTo, "1"), strCal1, strCal2, strPaymentRule, strIsPaid, strIsReceipt, strInvoice, strOrder, strIsPending, strOrderBy, "", "");
        strNumRows = String.valueOf(data.length);
        vars.setSessionValue("DebtPaymentInfo.numrows", strNumRows);
      }
      else {
        strNumRows = vars.getSessionValue("DebtPaymentInfo.numrows");
      }
          
      // Filtering result
      if(this.myPool.getRDBMS().equalsIgnoreCase("ORACLE")) {
        String oraLimit = strOffset + " AND " + String.valueOf(Integer.valueOf(strOffset).intValue() + Integer.valueOf(strPageSize));       
        data = DebtPaymentData.select(this, "ROWNUM", vars.getLanguage(), Utility.getContext(this, vars, "#User_Client", "DebtPayment"), Utility.getContext(this, vars, "#User_Org", "DebtPayment"), strBpartnerId,  strDateFrom, DateTimeData.nDaysAfter(this,strDateTo, "1"), strCal1, strCal2, strPaymentRule, strIsPaid, strIsReceipt, strInvoice, strOrder, strIsPending, strOrderBy, oraLimit, "");
      }
      else {
        String pgLimit = strPageSize + " OFFSET " + strOffset;
        data = DebtPaymentData.select(this, "1", vars.getLanguage(), Utility.getContext(this, vars, "#User_Client", "DebtPayment"), Utility.getContext(this, vars, "#User_Org", "DebtPayment"), strBpartnerId,  strDateFrom, DateTimeData.nDaysAfter(this,strDateTo, "1"), strCal1, strCal2, strPaymentRule, strIsPaid, strIsReceipt, strInvoice, strOrder, strIsPending, strOrderBy, "", pgLimit);
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
          if (!myError.getMessage().startsWith("<![CDATA[")) description = "<![CDATA[" + myError.getMessage() + "]]>";
          else description = myError.getMessage();
        }
      } catch (Exception e) { 
        if (log4j.isDebugEnabled()) log4j.debug("Error obtaining rows data");
        type = "Error";
        title = "Error";
        if (e.getMessage().startsWith("<![CDATA[")) description = "<![CDATA[" + e.getMessage() + "]]>";
        else description = e.getMessage();
        e.printStackTrace();
      }
    }
    
    if (!type.startsWith("<![CDATA[")) type = "<![CDATA[" + type + "]]>";
    if (!title.startsWith("<![CDATA[")) title = "<![CDATA[" + title + "]]>";
    if (!description.startsWith("<![CDATA[")) description = "<![CDATA[" + description + "]]>";
    StringBuffer strRowsData = new StringBuffer();
    strRowsData.append("<xml-data>\n");
    strRowsData.append("  <status>\n");
    strRowsData.append("    <type>").append(type).append("</type>\n");
    strRowsData.append("    <title>").append(title).append("</title>\n");
    strRowsData.append("    <description>").append(description).append("</description>\n");
    strRowsData.append("  </status>\n");
    strRowsData.append("  <rows numRows=\"").append(strNumRows).append("\">\n");
    if (data!=null && data.length>0) {
      for (int j=0;j<data.length;j++) {
        strRowsData.append("    <tr>\n");
        for (int k=0;k<headers.length;k++) {
          strRowsData.append("      <td><![CDATA[");
          String columnname = headers[k].getField("columnname");
          
          if ((data[j].getField(columnname)) != null) {
            if (headers[k].getField("adReferenceId").equals("32")) strRowsData.append(strReplaceWith).append("/images/");
            strRowsData.append(data[j].getField(columnname).replaceAll("<b>","").replaceAll("<B>","").replaceAll("</b>","").replaceAll("</B>","").replaceAll("<i>","").replaceAll("<I>","").replaceAll("</i>","").replaceAll("</I>","").replaceAll("<p>","&nbsp;").replaceAll("<P>","&nbsp;").replaceAll("<br>","&nbsp;").replaceAll("<BR>","&nbsp;"));
          } else {
            if (headers[k].getField("adReferenceId").equals("32")) {
              strRowsData.append(strReplaceWith).append("/images/blank.gif");
            } else strRowsData.append("&nbsp;");
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
    if (log4j.isDebugEnabled()) log4j.debug(strRowsData.toString());  
    out.print(strRowsData.toString());
    out.close();
  }
  
  private void cleanSessionValue(VariablesSecureApp vars) {
    vars.removeSessionValue("DebtPayment.inpBpartnerId");
    vars.removeSessionValue("DebtPayment.inpDateFrom");
    vars.removeSessionValue("DebtPayment.inpDateTo");
    vars.removeSessionValue("DebtPayment.inpCal1");
    vars.removeSessionValue("DebtPayment.inpCal2");
    vars.removeSessionValue("DebtPayment.inpCPaymentRuleId");
    vars.removeSessionValue("DebtPayment.inpIsReceipt");
    vars.removeSessionValue("DebtPayment.inpIsPaid");
    vars.removeSessionValue("DebtPayment.inpPending");
    vars.removeSessionValue("DebtPayment.inpInvoice");
    vars.removeSessionValue("DebtPayment.inpOrder");
  }

  public String getServletInfo() {
    return "Servlet that presents que DebtPayments seeker";
  } // end of getServletInfo() method
}
