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
import org.openbravo.erpCommon.businessUtility.Tree;
import org.openbravo.erpCommon.info.OrganizationData;
import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.xmlEngine.XmlDocument;
import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;
import org.openbravo.erpCommon.utility.DateTimeData;
import java.util.*;

public class ReportAnnualCertification extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);

    if (vars.commandIn("DEFAULT")) {
      String strcAcctSchemaId = vars.getGlobalVariable("inpcAcctSchemaId", "ReportAnnualCertification|cAcctSchemaId", "");
      String strDateFrom = vars.getGlobalVariable("inpDateFrom", "ReportAnnualCertification|DateFrom", "");
      String strDateTo = vars.getGlobalVariable("inpDateTo", "ReportAnnualCertification|DateTo", "");
      String strAmtFrom = vars.getGlobalVariable("inpAmtFrom", "ReportAnnualCertification|AmtFrom", "");
      String strAmtTo = vars.getGlobalVariable("inpAmtTo", "ReportAnnualCertification|AmtTo", "");
      String strcelementvaluefrom = vars.getGlobalVariable("inpcElementValueIdFrom", "ReportAnnualCertification|C_ElementValue_IDFROM", "");
      String strcelementvalueto = vars.getGlobalVariable("inpcElementValueIdTo", "ReportAnnualCertification|C_ElementValue_IDTO", "");
      String strOrg = vars.getGlobalVariable("inpOrg", "ReportAnnualCertification|Org", "0");
      String strcBpartnerId = vars.getInGlobalVariable("inpcBPartnerId_IN", "ReportAnnualCertification|cBpartnerId", "");
      String strAll = vars.getGlobalVariable("inpAll","ReportAnnualCertification|All","");
      String strReportType = vars.getRequestGlobalVariable("inpcReportType", "ReportAnnualCertification|ReportType");
      String strHide = vars.getGlobalVariable("inpHideMatched","ReportAnnualCertification|HideMatched","");
      printPageDataSheet(response, vars, strDateFrom, strDateTo, strAmtFrom, strAmtTo, strcelementvaluefrom, strcelementvalueto, strOrg, strcBpartnerId, strAll, strReportType,strHide, strcAcctSchemaId);
    } else if (vars.commandIn("FIND")) {
      String strcAcctSchemaId = vars.getRequestGlobalVariable("inpcAcctSchemaId", "ReportAnnualCertification|cAcctSchemaId");
      String strDateFrom = vars.getRequestGlobalVariable("inpDateFrom", "ReportAnnualCertification|DateFrom");
      String strDateTo = vars.getRequestGlobalVariable("inpDateTo", "ReportAnnualCertification|DateTo");
      String strAmtFrom = vars.getRequestGlobalVariable("inpAmtFrom", "ReportAnnualCertification|AmtFrom");
      String strAmtTo = vars.getRequestGlobalVariable("inpAmtTo", "ReportAnnualCertification|AmtTo");
      String strcelementvaluefrom = vars.getRequestGlobalVariable("inpcElementValueIdFrom", "ReportAnnualCertification|C_ElementValue_IDFROM");
      String strcelementvalueto = vars.getRequestGlobalVariable("inpcElementValueIdTo", "ReportAnnualCertification|C_ElementValue_IDTO");
      String strOrg = vars.getGlobalVariable("inpOrg", "ReportAnnualCertification|Org", "0");
      String strcBpartnerId = vars.getRequestInGlobalVariable("inpcBPartnerId_IN", "ReportAnnualCertification|cBpartnerId");
      String strAll = vars.getStringParameter("inpAll");
      String strReportType = vars.getRequestGlobalVariable("inpcReportType", "ReportAnnualCertification|ReportType");
      String strHide = vars.getStringParameter("inpHideMatched");
      if (log4j.isDebugEnabled()) log4j.debug("inpAll: "+strAll);
      if (strAll.equals("")) vars.removeSessionValue("ReportAnnualCertification|All");
      else  strAll = vars.getGlobalVariable("inpAll","ReportAnnualCertification|All");
      if (strHide.equals("")) vars.removeSessionValue("ReportAnnualCertification|HideMatched");
      else  strHide = vars.getGlobalVariable("inpHideMatched","ReportAnnualCertification|HideMatched");
      if (log4j.isDebugEnabled()) log4j.debug("##################### DoPost - Find - strcBpartnerId= " + strcBpartnerId);
      if (log4j.isDebugEnabled()) log4j.debug("##################### DoPost - XLS - strcelementvaluefrom= " + strcelementvaluefrom);
      if (log4j.isDebugEnabled()) log4j.debug("##################### DoPost - XLS - strcelementvalueto= " + strcelementvalueto);
      vars.setSessionValue("ReportAnnualCertification.initRecordNumber", "0");
      
      printPageDataSheet(response, vars, strDateFrom, strDateTo, strAmtFrom, strAmtTo, strcelementvaluefrom, strcelementvalueto, strOrg, strcBpartnerId, strAll, strReportType, strHide, strcAcctSchemaId);
       
    } else if (vars.commandIn("PREVIOUS_RELATION")) {
      String strInitRecord = vars.getSessionValue("ReportAnnualCertification.initRecordNumber");
      String strRecordRange = Utility.getContext(this, vars, "#RecordRange", "ReportAnnualCertification");
      int intRecordRange = strRecordRange.equals("")?0:Integer.parseInt(strRecordRange);
      if (strInitRecord.equals("") || strInitRecord.equals("0")) vars.setSessionValue("ReportAnnualCertification.initRecordNumber", "0");
      else {
        int initRecord = (strInitRecord.equals("")?0:Integer.parseInt(strInitRecord));
        initRecord -= intRecordRange;
        strInitRecord = ((initRecord<0)?"0":Integer.toString(initRecord));
        vars.setSessionValue("ReportAnnualCertification.initRecordNumber", strInitRecord);
      }
      response.sendRedirect(strDireccion + request.getServletPath());
    } else if (vars.commandIn("NEXT_RELATION")) {
      String strInitRecord = vars.getSessionValue("ReportAnnualCertification.initRecordNumber");
      String strRecordRange = Utility.getContext(this, vars, "#RecordRange", "ReportAnnualCertification");
      int intRecordRange = strRecordRange.equals("")?0:Integer.parseInt(strRecordRange);
      int initRecord = (strInitRecord.equals("")?0:Integer.parseInt(strInitRecord));
      if (initRecord==0) initRecord=1;
      initRecord += intRecordRange;
      strInitRecord = ((initRecord<0)?"0":Integer.toString(initRecord));
      vars.setSessionValue("ReportAnnualCertification.initRecordNumber", strInitRecord);
      response.sendRedirect(strDireccion + request.getServletPath());
    } else if (vars.commandIn("PDF","XLS")){
      String strcAcctSchemaId = vars.getRequestGlobalVariable("inpcAcctSchemaId", "ReportAnnualCertification|cAcctSchemaId");
      String strDateFrom = vars.getRequestGlobalVariable("inpDateFrom", "ReportAnnualCertification|DateFrom");
      String strDateTo = vars.getRequestGlobalVariable("inpDateTo", "ReportAnnualCertification|DateTo");
      String strAmtFrom = vars.getRequestGlobalVariable("inpAmtFrom", "ReportAnnualCertification|AmteFrom");
      String strAmtTo = vars.getRequestGlobalVariable("inpAmtTo", "ReportAnnualCertification|AmtTo");
      String strcelementvaluefrom = vars.getRequestGlobalVariable("inpcElementValueIdFrom", "ReportAnnualCertification|C_ElementValue_IDFROM");
      String strcelementvalueto = vars.getRequestGlobalVariable("inpcElementValueIdTo", "ReportAnnualCertification|C_ElementValue_IDTO");
      String strOrg = vars.getGlobalVariable("inpOrg", "ReportAnnualCertification|Org", "0");
      String strcBpartnerId = vars.getRequestInGlobalVariable("inpcBPartnerId_IN", "ReportAnnualCertification|cBpartnerId");
      String strAll = vars.getStringParameter("inpAll");
      String strReportType = vars.getRequestGlobalVariable("inpcReportType", "ReportAnnualCertification|ReportType");
      String strHide = vars.getStringParameter("inpHideMatched");
      printPageDataPDF(response, vars, strDateFrom, strDateTo, strAmtFrom, strAmtTo, strcelementvaluefrom, strcelementvalueto, strOrg, strcBpartnerId, strAll, strReportType, strHide, strcAcctSchemaId);
    } else pageError(response);
  }

  void printPageDataSheet(HttpServletResponse response, VariablesSecureApp vars, String strDateFrom, String strDateTo, String strAmtFrom, String strAmtTo, String strcelementvaluefrom, String strcelementvalueto, String strOrg, String strcBpartnerId, String strAll, String strReportType, String strHide, String strcAcctSchemaId) throws IOException, ServletException {
	String strRecordRange="500";
	int intRecordRange = (strRecordRange.equals("")?0:Integer.parseInt(strRecordRange));
    String strInitRecord = vars.getSessionValue("ReportAnnualCertification.initRecordNumber");
    int initRecordNumber = (strInitRecord.equals("")?0:Integer.parseInt(strInitRecord));
    if (log4j.isDebugEnabled()) log4j.debug("Output: dataSheet");
    if (log4j.isDebugEnabled()) log4j.debug("Date From:"+strDateFrom+"- To:"+strDateTo+" - Schema:"+strcAcctSchemaId);
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    XmlDocument xmlDocument=null;
    ReportAnnualCertificationData[] data=null;
    
    String[] discard = {"discard"};
    xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_reports/ReportAnnualCertification", discard).createXmlDocument();
    //Setting Key Mappings ( key shortcut)
    xmlDocument.setParameter("theme", vars.getTheme());

    //Toolbar
    ToolBar toolbar = new ToolBar(this, vars.getLanguage(), "ReportAnnualCertification", false, "", "", "imprimir();return false;",false, "ad_reports",  strReplaceWith, false,  true);
    toolbar.prepareSimpleToolBarTemplate();
    //toolbar.prepareRelationBarTemplate(false, false,"submitCommandForm('XLS', false, frmMain, 'ReportAnnualCertification.xls', 'EXCEL');return false;");
    xmlDocument.setParameter("toolbar", toolbar.toString());
    try {
        //GESTIONE TABS
        WindowTabs tabs = new WindowTabs(this, vars, "org.openbravo.erpCommon.ad_reports.ReportAnnualCertification");
        xmlDocument.setParameter("parentTabContainer", tabs.parentTabs());
        xmlDocument.setParameter("mainTabContainer", tabs.mainTabs());
        xmlDocument.setParameter("childTabContainer", tabs.childTabs());
        //Setting for Skin (CSS)
        xmlDocument.setParameter("theme", vars.getTheme());
        //NavigationBar
        NavigationBar nav = new NavigationBar(this, vars.getLanguage(), "ReportAnnualCertification.html", classInfo.id, classInfo.type, strReplaceWith, tabs.breadcrumb());
        xmlDocument.setParameter("navigationBar", nav.toString());
        //Left Bar
        LeftTabsBar lBar = new LeftTabsBar(this, vars.getLanguage(), "ReportAnnualCertification.html", strReplaceWith);
        xmlDocument.setParameter("leftTabs", lBar.manualTemplate());
    } catch (Exception ex) {
        throw new ServletException(ex);
    }
    //Section for Manage the Messages
    {
        OBError myMessage = vars.getMessage("ReportAnnualCertification");
        vars.removeMessage("ReportAnnualCertification");
        if (myMessage!=null) {
          xmlDocument.setParameter("messageType", myMessage.getType());
          xmlDocument.setParameter("messageTitle", myMessage.getTitle());
          xmlDocument.setParameter("messageMessage", myMessage.getMessage());
        }
      }
    // PARAMETRI UTENTE
    xmlDocument.setParameter("calendar", vars.getLanguage().substring(0,2));
    xmlDocument.setParameter("dateFrom", strDateFrom);
    xmlDocument.setParameter("dateFromdisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateFromsaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateTo", strDateTo);
    xmlDocument.setParameter("dateTodisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateTosaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));

    //SEZIONE RISULTATI
    if (strDateFrom.equals("") && strDateTo.equals("")) {
    	data = ReportAnnualCertificationData.set();
    } else {
        data = ReportAnnualCertificationData.select( this, Utility.getContext(this, vars, "#User_Client", "ReportAnnualCertification"), Utility.getContext(this, vars, "#User_Org", "ReportAnnualCertification"), strDateFrom, DateTimeData.nDaysAfter(this, strDateTo,"1"), strcBpartnerId, initRecordNumber, intRecordRange);
    }
    xmlDocument.setData("structure1", data);
    
 /*
    xmlDocument.setParameter("calendar", vars.getLanguage().substring(0,2));
    //xmlDocument.setData("reportAD_ORGID", "liststructure", OrganizationComboData.selectCombo(this, vars.getRole()));
    xmlDocument.setParameter("direction", "var baseDirection = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("paramLanguage", "LNG_POR_DEFECTO=\"" + vars.getLanguage() + "\";");
    xmlDocument.setData("reportCBPartnerId_IN", "liststructure", ReportRefundInvoiceCustomerDimensionalAnalysesData.selectBpartner(this, Utility.getContext(this, vars, "#User_Org", ""), Utility.getContext(this, vars, "#User_Client", ""), strcBpartnerIdAux));
 */   	
    out.println(xmlDocument.print());
    out.close();
  }

  void printPageDataPDF(HttpServletResponse response, VariablesSecureApp vars, String strDateFrom, String strDateTo, String strAmtFrom, String strAmtTo, String strcelementvaluefrom, String strcelementvalueto, String strOrg, String strcBpartnerId, String strAll, String strReportType,String strHide, String strcAcctSchemaId) throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: PDF");
    ReportAnnualCertificationData[] data=null;
    data = ReportAnnualCertificationData.select( this, Utility.getContext(this, vars, "#User_Client", "ReportAnnualCertification"), Utility.getContext(this, vars, "#User_Org", "ReportAnnualCertification"), strDateFrom, DateTimeData.nDaysAfter(this, strDateTo,"1"), strcBpartnerId);
    
    String sClientID = vars.getClient();
    String sOrganID = vars.getOrg();
    OrganizationData[] dataOrganization=OrganizationData.select(this, vars.getLanguage(), sClientID, sOrganID);

    String strOutput = vars.commandIn("PDF")?"pdf":"xls";
    String strReportName = "@basedesign@/org/openbravo/erpCommon/ad_reports/ReportAnnualCertification.jrxml";
     
    HashMap<String, Object> parameters = new HashMap<String, Object>();
    parameters.put("Mittente", dataOrganization[0].adClientIdr);
    parameters.put("Erogante", dataOrganization[0].adClientIdr);
    parameters.put("AddressOrganization", dataOrganization[0].cLocationIdr);
    parameters.put("DateFrom", strDateFrom);
    parameters.put("DateTo", strDateTo);
    renderJR(vars, response, strReportName, strOutput, parameters, data, null );
 }


  public String getFamily(String strTree, String strChild) throws IOException, ServletException {
    return Tree.getMembers(this, strTree, strChild);
  }

  
  public String getRange (String accountfrom, String accountto) throws IOException,ServletException {

    ReportGeneralLedgerData[] data = ReportGeneralLedgerData.selectRange(this,accountfrom,accountto);

    boolean bolFirstLine = true;
    String strText = "";
    for (int i = 0; i < data.length; i++) {
      if (bolFirstLine){
        bolFirstLine = false;
        strText = data[i].name;
      }
      else{
        strText = data[i].name + "," + strText ;
      }
    }
    return strText;
  }


  public String getServletInfo() {
    return "Servlet ReportAnnualCertification. This Servlet was made by Pablo Sarobe";
  } // end of getServletInfo() method
}
