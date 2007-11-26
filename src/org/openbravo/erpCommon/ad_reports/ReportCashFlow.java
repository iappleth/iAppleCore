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

package org.openbravo.erpCommon.ad_reports;


import org.openbravo.erpCommon.businessUtility.WindowTabs;
import org.openbravo.erpCommon.utility.*;

import org.openbravo.erpCommon.ad_actionButton.*;

import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.xmlEngine.XmlDocument;
import java.io.*;
import java.util.*;
import javax.servlet.*;
import javax.servlet.http.*;

import org.openbravo.erpCommon.utility.DateTimeData;


public class ReportCashFlow extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;
  public static String strTreeOrg = "";

  public void init (ServletConfig config) {
    super.init(config);
    boolHist = false;
  }

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);

    String process = ReportCashFlowData.processId(this, "ReportCashFlow");
    if (vars.commandIn("DEFAULT")) {
      printPage_FS(response, vars);
    } else if (vars.commandIn("FRAME1")) {
      String strAccountingReportId = vars.getGlobalVariable("inpAccountingReportId", "ReportCashFlow|accountingReport", "");
      String strOrg = vars.getGlobalVariable("inpadOrgId", "ReportCashFlow|orgId", "0");
      String strPeriod = vars.getGlobalVariable("inpPeriodId", "ReportCashFlow|period", "");
      printPageFrame1(response, vars, strAccountingReportId, strOrg, strPeriod, process);
    } else if (vars.commandIn("DEPURAR")){
      String strAccountingReportId = vars.getRequestGlobalVariable("inpAccountingReportId", "ReportCashFlow|accountingReport");
      String strOrg = vars.getGlobalVariable("inpadOrgId", "ReportCashFlow|orgId", "0");
      String strPeriod = vars.getRequestGlobalVariable("inpPeriodId", "ReportCashFlow|period");
      printPageDepurar(response, vars, strAccountingReportId, strOrg, strPeriod, process);
    } else if (vars.commandIn("FIND")){
      String strAccountingReportId = vars.getRequestGlobalVariable("inpAccountingReportId", "ReportCashFlow|accountingReport");
      String strOrg = vars.getGlobalVariable("inpadOrgId", "ReportCashFlow|orgId", "0");
      String strPeriod = vars.getRequestGlobalVariable("inpPeriodId", "ReportCashFlow|period");
      printPagePopUp(response, vars, strAccountingReportId, strOrg, strPeriod, process);
    } else pageErrorPopUp(response);
  }

  void printPage_FS(HttpServletResponse response, VariablesSecureApp vars) throws IOException, ServletException {
    log4j.debug("Output: FrameSet");
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_reports/ReportCashFlow_FS").createXmlDocument();
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

void printPageFrame1(HttpServletResponse response, VariablesSecureApp vars, String strAccountingReportId, String strOrg, String strPeriod, String strProcessId) throws IOException, ServletException {
      if (log4j.isDebugEnabled()) log4j.debug("Output: printPage ReportCashFlow_F1");
      
      ActionButtonDefaultData[] data = null;
      String strHelp="";
      if (vars.getLanguage().equals("en_US")) data = ActionButtonDefaultData.select(this, strProcessId);
      else data = ActionButtonDefaultData.selectLanguage(this, vars.getLanguage(), strProcessId);
      if (data!=null && data.length!=0) {
        strHelp = data[0].help;
      }
      XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_reports/ReportCashFlow_F1").createXmlDocument();

      String strArray = arrayEntry(vars);

      xmlDocument.setParameter("language", "LNG_POR_DEFECTO=\"" + vars.getLanguage() + "\";");
      xmlDocument.setParameter("direction", "var baseDirection = \"" + strReplaceWith + "/\";\n");
      xmlDocument.setParameter("help", strHelp);
      xmlDocument.setParameter("accounting", strAccountingReportId);
      xmlDocument.setParameter("org", strOrg);
      xmlDocument.setParameter("period", strPeriod);
      xmlDocument.setParameter("array", strArray);

      try {
        ComboTableData comboTableData = new ComboTableData(vars, this, "TABLEDIR", "AD_Org_ID", "", "", Utility.getContext(this, vars, "#User_Org", "ReportCashFlow"), Utility.getContext(this, vars, "#User_Client", "ReportCashFlow"), 0);
        Utility.fillSQLParameters(this, vars, null, comboTableData, "ReportCashFlow", "");
        xmlDocument.setData("reportAD_ORG", "liststructure", comboTableData.select(false));
        comboTableData = null;
      } catch (Exception ex) {
        throw new ServletException(ex);
      }

      xmlDocument.setData("reportAD_ACCOUNTINGRPT_ELEMENT", "liststructure", ReportCashFlowData.selectAD_Accountingrpt_Element_ID(this, Utility.getContext(this, vars, "#User_Org", "ReportCashFlow"), Utility.getContext(this, vars, "#User_Client", "ReportCashFlow"), ""));

      xmlDocument.setData("reportPeriod", "liststructure", ReportCashFlowData.selectCombo(this, Utility.getContext(this, vars, "#User_Org", "ReportCashFlow"), Utility.getContext(this, vars, "#User_Client", "ReportCashFlow"), vars.getLanguage()));

      ToolBar toolbar = new ToolBar(this, vars.getLanguage(), "ReportCashFlow", false, "", "", "",false, "ad_reports",  strReplaceWith, false,  true);
      toolbar.prepareSimpleToolBarTemplate();
      xmlDocument.setParameter("toolbar", toolbar.toString());

      // New interface paramenters
      try {
        KeyMap key = new KeyMap(this, vars, "ReportCashFlow.html");
        xmlDocument.setParameter("keyMap", key.getActionButtonKeyMaps());
      } catch (Exception ex) {
        throw new ServletException(ex);
      }
      try {
        WindowTabs tabs = new WindowTabs(this, vars, "org.openbravo.erpCommon.ad_reports.ReportCashFlow");
        xmlDocument.setParameter("parentTabContainer", tabs.parentTabs());
        xmlDocument.setParameter("mainTabContainer", tabs.mainTabs());
        xmlDocument.setParameter("childTabContainer", tabs.childTabs());
        xmlDocument.setParameter("theme", vars.getTheme());
        NavigationBar nav = new NavigationBar(this, vars.getLanguage(), "ReportCashFlow_FS.html", classInfo.id, classInfo.type, strReplaceWith, tabs.breadcrumb());
        xmlDocument.setParameter("navigationBar", nav.toString());
        LeftTabsBar lBar = new LeftTabsBar(this, vars.getLanguage(), "ReportCashFlow_FS.html", strReplaceWith);
        xmlDocument.setParameter("leftTabs", lBar.manualTemplate());
      } catch (Exception ex) {
        throw new ServletException(ex);
      }
      {
        OBError myMessage = vars.getMessage("ReportCashFlow");
        vars.removeMessage("ReportCashFlow");
        System.out.println("***************** " + (myMessage!=null));
        if (myMessage!=null) {
          xmlDocument.setParameter("messageType", myMessage.getType());
          xmlDocument.setParameter("messageTitle", myMessage.getTitle());
          xmlDocument.setParameter("messageMessage", myMessage.getMessage());
        }
      }
      
     
      response.setContentType("text/html; charset=UTF-8");
      PrintWriter out = response.getWriter();
      out.println(xmlDocument.print());
      out.close();
    }

void printPagePopUp (HttpServletResponse response, VariablesSecureApp vars, String strAccountingReportId, String strOrg, String strPeriod, String process) throws IOException, ServletException {
      if (log4j.isDebugEnabled()) log4j.debug("Output: pop up ReportCashFlow");
      XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_reports/ReportCashFlowPopUp").createXmlDocument();
      String strPeriodFrom = "";
      int level = 0;
      String strPeriodTo = "";
      String strYear = DateTimeData.sysdateYear(this);
      String strAccountingType = ReportCashFlowData.selectType(this, strAccountingReportId);
      if (strAccountingType.equals("Q")) {
        String strAux = ReportCashFlowData.selectMax(this, strPeriod);
        strPeriodFrom = "01/" + ReportCashFlowData.selectMin(this, strPeriod) + "/" + strYear;
        strPeriodTo = ReportCashFlowData.lastDay(this, "01/"+ strAux + "/" + strYear, vars.getSqlDateFormat());
        strPeriodTo = DateTimeData.nDaysAfter(this, strPeriodTo, "1");
      }else if (strAccountingType.equals("M")) {
        strPeriodFrom = "01/" + strPeriod +  "/"  + strYear;
        strPeriodTo = ReportCashFlowData.lastDay(this, strPeriodFrom, vars.getSqlDateFormat());
        strPeriodTo = DateTimeData.nDaysAfter(this, strPeriodTo, "1");
      }else {
        strPeriodFrom = "01/01/" + strPeriod;
        strPeriodTo = DateTimeData.nDaysAfter(this, "31/12/" + strPeriod, "1");
      }
      strPeriodFrom = ReportCashFlowData.selectFormat(this, strPeriodFrom, vars.getSqlDateFormat());
      strPeriodTo = ReportCashFlowData.selectFormat(this, strPeriodTo, vars.getSqlDateFormat());
      strTreeOrg = strOrg;
      treeOrg(vars, strOrg);

      Vector<Object> vectorArray = new Vector<Object>();

      childData(vars, vectorArray, strAccountingReportId, strPeriodFrom, strPeriodTo, strTreeOrg, level, "0");

      ReportCashFlowData[] dataTree = convertVector(vectorArray);
      dataTree = filterData(dataTree);
      strTreeOrg = "";

      xmlDocument.setParameter("title", dataTree[0].name);
      xmlDocument.setParameter("direction", "var baseDirection = \"" + strReplaceWith + "/\";\n");
      xmlDocument.setParameter("language", "LNG_POR_DEFECTO=\"" + vars.getLanguage() + "\";");
      xmlDocument.setParameter("theme", vars.getTheme());
      xmlDocument.setData("structure", dataTree);
      response.setContentType("text/html; charset=UTF-8");
      PrintWriter out = response.getWriter();
      out.println(xmlDocument.print());
      out.close();
}

void printPageDepurar (HttpServletResponse response, VariablesSecureApp vars, String strAccountingReportId, String strOrg, String strPeriod, String process) throws IOException, ServletException {
      if (log4j.isDebugEnabled()) log4j.debug("Output: ReportCashFlow_F0");
      XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_reports/ReportCashFlow_F0").createXmlDocument();
      String strPeriodFrom = "";
      String strPeriodTo = "";
      String strYear = DateTimeData.sysdateYear(this);
      String strAccountingType = ReportCashFlowData.selectType(this, strAccountingReportId);
      if (strAccountingType.equals("Q")) {
        String strAux = ReportCashFlowData.selectMax(this, strPeriod);
        strPeriodFrom = "01/" + ReportCashFlowData.selectMin(this, strPeriod) + "/" + strYear;
        strPeriodTo = ReportCashFlowData.lastDay(this, "01/"+ strAux + "/" + strYear, vars.getSqlDateFormat());
        strPeriodTo = DateTimeData.nDaysAfter(this, strPeriodTo, "1");
      }else if (strAccountingType.equals("M")) {
        strPeriodFrom = "01/" + strPeriod +  "/"  + strYear;
        strPeriodTo = ReportCashFlowData.lastDay(this, strPeriodFrom, vars.getSqlDateFormat());
        strPeriodTo = DateTimeData.nDaysAfter(this, strPeriodTo, "1");
      }else {
        strPeriodFrom = "01/01/" + strPeriod;
        strPeriodTo = DateTimeData.nDaysAfter(this, "31/12/" + strPeriod, "1");
      }
      strPeriodFrom = ReportCashFlowData.selectFormat(this, strPeriodFrom, vars.getSqlDateFormat());
      strPeriodTo = ReportCashFlowData.selectFormat(this, strPeriodTo, vars.getSqlDateFormat());
      strTreeOrg = strOrg;
      treeOrg(vars, strOrg);

      ReportCashFlowData [] data = ReportCashFlowData.selectMissingEntries(this, Utility.getContext(this, vars, "#User_Client", "ReportCashFlow"), Utility.getContext(this, vars, "#User_Org", "ReportCashFlow"), strPeriodFrom, strPeriodTo, vars.getClient());
      if (log4j.isDebugEnabled()) log4j.debug("printPageDepurar - data.length: " + data.length);
      if (log4j.isDebugEnabled()) log4j.debug("printPageDepurar - #User_Client: " + Utility.getContext(this, vars, "#User_Client", "ReportCashFlow"));
      if (log4j.isDebugEnabled()) log4j.debug("printPageDepurar - #User_Org: " + Utility.getContext(this, vars, "#User_Org", "ReportCashFlow"));
      if (log4j.isDebugEnabled()) log4j.debug("printPageDepurar - strPeriodFrom: " + strPeriodFrom);
      if (log4j.isDebugEnabled()) log4j.debug("printPageDepurar - strPeriodTo: " + strPeriodTo);
      if (log4j.isDebugEnabled()) log4j.debug("printPageDepurar - vars.getClient(): " + vars.getClient());
      if (log4j.isDebugEnabled()) log4j.debug("printPageDepurar - bol: " + ((data!=null && data.length > 0)?"true":"false"));
      if(data!=null && data.length > 0){
        OBError myError = new OBError();
        myError.setTitle("");
        myError.setType("Error");
        myError.setMessage(Utility.messageBD(this, "MissingCashFlowStatements", vars.getLanguage()));
        vars.setMessage("ReportCashFlow", myError);
      }
      xmlDocument.setParameter("language", "LNG_POR_DEFECTO=\"" + vars.getLanguage() + "\";");
      if (log4j.isDebugEnabled()) log4j.debug("language");
      xmlDocument.setParameter("org", strOrg);
      if (log4j.isDebugEnabled()) log4j.debug("org");
      xmlDocument.setParameter("bol", (data!=null && data.length > 0)?"true":"false");
      if (log4j.isDebugEnabled()) log4j.debug("bol");
      xmlDocument.setParameter("period", strPeriod);
      if (log4j.isDebugEnabled()) log4j.debug("period");
      xmlDocument.setParameter("report", strAccountingReportId);
      if (log4j.isDebugEnabled()) log4j.debug("report");
      response.setContentType("text/html; charset=UTF-8");
      if (log4j.isDebugEnabled()) log4j.debug("text/html; charset=UTF-8");
      PrintWriter out = response.getWriter();
      if (log4j.isDebugEnabled()) log4j.debug("PrintWriter");
      out.println(xmlDocument.print());
      if (log4j.isDebugEnabled()) log4j.debug("print");
      out.close();
}


String arrayEntry(VariablesSecureApp vars) throws ServletException{
      String result = "";
      ReportCashFlowData[] data = ReportCashFlowData.selectAD_Accountingrpt_Element_ID(this, Utility.getContext(this, vars, "#User_Org", "ReportCashFlow"), Utility.getContext(this, vars, "#User_Client", "ReportCashFlow"), "");
      if (data == null || data.length == 0) {
        result = "var array = null;";
      } else {
        result = "var array = new Array(\n";
        for (int i = 0;i<data.length;i++) {
          result += "new Array(\"" + data[i].id  + "\",\"" + data[i].filteredbyorganization  + "\",\"" + data[i].temporaryfiltertype  + "\")";
          if (i<data.length-1) result += ",\n";
        }
        result += ");";
        ReportCashFlowData[] dataPeriod = ReportCashFlowData.selectCombo(this, Utility.getContext(this, vars, "#User_Org", "ReportCashFlow"), Utility.getContext(this, vars, "#User_Client", "ReportCashFlow"), vars.getLanguage());
        if (dataPeriod == null || dataPeriod.length == 0){
          result += "\nvar combo = null;";
        } else {
          result += "\nvar combo = new Array(\n";
            for (int j = 0; j<dataPeriod.length; j++){
              result += "new Array(\"" + dataPeriod[j].value + "\", \"" + dataPeriod[j].id +"\", \"" + dataPeriod[j].name + "\")";
              if (j<dataPeriod.length-1) result += ",\n";
            }
          result += ");";
        }
        
      }
      return result;
}


void treeOrg(VariablesSecureApp vars, String strOrg) throws ServletException{
      ReportCashFlowData[] dataOrg = ReportCashFlowData.selectOrg(this, strOrg, vars.getClient());
      for (int i = 0; i<dataOrg.length; i++) {
        strTreeOrg += "," + dataOrg[i].id;
        if (dataOrg[i].issummary.equals("Y")) treeOrg(vars, dataOrg[i].id);
      }
      return;
}

void childData(VariablesSecureApp vars, Vector<Object> vectorArray, String strAccountingReportId, String strPeriodFrom, String strPeriodTo, String strOrg, int level, String strParent) throws IOException, ServletException{
      if (log4j.isDebugEnabled()) log4j.debug("Ouput: child tree data");
      String strAccountId = ReportCashFlowData.selectAccounting(this, strAccountingReportId);
      ReportCashFlowData[] data = ReportCashFlowData.select(this, strParent, String.valueOf(level), Utility.getContext(this, vars, "#User_Client", "ReportCashFlow"), strOrg, strPeriodFrom, strPeriodTo, strAccountId, strAccountingReportId);
      if (data == null || data.length == 0) data = ReportCashFlowData.set();
      vectorArray.addElement(data[0]);
      ReportCashFlowData[] dataAux = ReportCashFlowData.selectChild(this, Utility.getContext(this, vars, "#User_Client", "ReportCashFlow"), Utility.getContext(this, vars, "#User_Org", "ReportCashFlow"), data[0].id, ReportCashFlowData.selectTree(this, vars.getClient()));
      for (int i = 0; i<dataAux.length; i++){
          childData(vars, vectorArray, dataAux[i].id, strPeriodFrom, strPeriodTo, strOrg, level+1, data[0].id);
      }
}

ReportCashFlowData[] convertVector(Vector<Object> vectorArray) throws ServletException {
    ReportCashFlowData[] data = new ReportCashFlowData[vectorArray.size()];
    double count = 0;
    for (int i = 0; i<vectorArray.size(); i++){
      data[i] = (ReportCashFlowData)vectorArray.elementAt(i);
    }
    for (int i = data.length-1; i>=0; i--){
        if (data[i].issummary.equals("Y")){
            for (int j=i+1; j<data.length; j++){
                if (Integer.valueOf(data[j].levelAccount).intValue() > Integer.valueOf(data[i].levelAccount).intValue() && data[j].parent.equals(data[i].id)){
                    String total = data[j].total;
                    count += Double.valueOf(total).doubleValue();
                }
            }
            data[i].total = String.valueOf(count);
            count = 0;
        }
    }
    return data;
}

ReportCashFlowData[] filterData(ReportCashFlowData[] data) throws ServletException {
    ArrayList<Object> new_a = new ArrayList<Object>();
    for (int i = 0; i<data.length; i++){
      if(data[i].isshown.equals("Y")) new_a.add(data[i]);
    }
    ReportCashFlowData[] newData = new ReportCashFlowData [new_a.size()];
    new_a.toArray(newData);
    return newData;
}

  public String getServletInfo() {
    return "Servlet ReportCashFlow";
  } // end of getServletInfo() method
}

