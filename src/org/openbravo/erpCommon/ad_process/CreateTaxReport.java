/*
 ******************************************************************************
 * The contents of this file are subject to the   Compiere License  Version 1.1
 * ("License"); You may not use this file except in compliance with the License
 * You may obtain a copy of the License at http://www.compiere.org/license.html
 * Software distributed under the License is distributed on an  "AS IS"  basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for
 * the specific language governing rights and limitations under the License.
 * The Original Code is                  Compiere  ERP & CRM  Business Solution
 * The Initial Developer of the Original Code is Jorg Janke  and ComPiere, Inc.
 * Portions created by Jorg Janke are Copyright (C) 1999-2001 Jorg Janke, parts
 * created by ComPiere are Copyright (C) ComPiere, Inc.;   All Rights Reserved.
 * Contributor(s): Openbravo SL
 * Contributions are Copyright (C) 2001-2006 Openbravo S.L.
 ******************************************************************************
*/

package org.openbravo.erpCommon.ad_process;

import org.openbravo.erpCommon.utility.*;

import org.openbravo.erpCommon.businessUtility.*;
import org.openbravo.erpCommon.ad_actionButton.*;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.erpCommon.utility.DateTimeData;
import org.openbravo.erpCommon.utility.ComboTableData;
import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.xmlEngine.XmlDocument;
import java.io.*;
import java.util.*;
import javax.servlet.*;
import javax.servlet.http.*;

public class CreateTaxReport extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;
  public static String strTreeOrg = "";
  public static int rownum = 1;

  public void init (ServletConfig config) {
    super.init(config);
    boolHist = false;
  }

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);

    String process = CreateTaxReportData.processId(this, "CreateTaxReport");
    if (vars.commandIn("DEFAULT")) {
      String strTaxReportId = vars.getGlobalVariable("inpTaxReportId", "CreateTaxReport|taxReport", "");
      String strDateFrom = vars.getGlobalVariable("inpDateFrom", "CreateTaxReport|dateFrom", "");
      String strDateTo = vars.getGlobalVariable("inpDateTo", "CreateTaxReport|dateTo", "");
      String strOrg = vars.getGlobalVariable("inpadOrgId", "CreateTaxReport|orgId", "0");
      printPage(response, vars, strTaxReportId, strDateFrom, strDateTo, strOrg, process);
    } else if (vars.commandIn("FIND")){
      String strTaxReportId = vars.getRequestGlobalVariable("inpTaxReportId", "CreateTaxReport|taxReport");
      String strDateFrom = vars.getGlobalVariable("inpDateFrom", "CreateTaxReport|dateFrom", "");
      String strDateTo = vars.getGlobalVariable("inpDateTo", "CreateTaxReport|dateTo", "");
      String strOrg = vars.getGlobalVariable("inpadOrgId", "CreateTaxReport|orgId", "0");
      printPagePopUp(response, vars, strTaxReportId, strDateFrom, strDateTo, strOrg);
    } else pageErrorPopUp(response);
  }


void printPage(HttpServletResponse response, VariablesSecureApp vars, String strTaxReportId, String strDateFrom, String strDateTo, String strOrg, String strProcessId) throws IOException, ServletException {
      if (log4j.isDebugEnabled()) log4j.debug("Output: process CreateTaxReport");
      
      ActionButtonDefaultData[] data = null;
      String strHelp="", strDescription="";
      if (vars.getLanguage().equals("en_US")) data = ActionButtonDefaultData.select(this, strProcessId);
      else data = ActionButtonDefaultData.selectLanguage(this, vars.getLanguage(), strProcessId);
      if (data!=null && data.length!=0) {
        strDescription = data[0].description;
        strHelp = data[0].help;
      }

      XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_process/CreateTaxReport").createXmlDocument();

      //String strArray = arrayEntry(vars);

      xmlDocument.setParameter("calendar", vars.getLanguage().substring(0,2));
      xmlDocument.setParameter("language", "LNG_POR_DEFECTO=\"" + vars.getLanguage() + "\";");
      xmlDocument.setParameter("direction", "var baseDirection = \"" + strReplaceWith + "/\";\n");
      xmlDocument.setParameter("description", strDescription);
      xmlDocument.setParameter("help", strHelp);
      xmlDocument.setParameter("dateFrom", strDateFrom);
      xmlDocument.setParameter("dateTo", strDateTo);
      xmlDocument.setParameter("org", strOrg);
      xmlDocument.setParameter("taxReport", strTaxReportId);
      xmlDocument.setParameter("dateFromdisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
      xmlDocument.setParameter("dateFromsaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
      xmlDocument.setParameter("dateTodisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
      xmlDocument.setParameter("dateTosaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
      
      ToolBar toolbar = new ToolBar(this, vars.getLanguage(), "CreateTaxReport", false, "", "", "",false, "ad_process",  strReplaceWith, false,  true);
      toolbar.prepareSimpleToolBarTemplate();
      xmlDocument.setParameter("toolbar", toolbar.toString());
      
            // New interface paramenters
      try {
        KeyMap key = new KeyMap(this, vars, "CreateTaxReport.html");
        xmlDocument.setParameter("keyMap", key.getActionButtonKeyMaps());
      } catch (Exception ex) {
        throw new ServletException(ex);
      }
      try {
        WindowTabs tabs = new WindowTabs(this, vars, "org.openbravo.erpCommon.ad_process.CreateTaxReport");

        xmlDocument.setParameter("parentTabContainer", tabs.parentTabs());
        xmlDocument.setParameter("mainTabContainer", tabs.mainTabs());
        xmlDocument.setParameter("childTabContainer", tabs.childTabs());
        xmlDocument.setParameter("theme", vars.getTheme());
        NavigationBar nav = new NavigationBar(this, vars.getLanguage(), "CreateTaxReport.html", classInfo.id, classInfo.type, strReplaceWith, tabs.breadcrumb());
        xmlDocument.setParameter("navigationBar", nav.toString());
        LeftTabsBar lBar = new LeftTabsBar(this, vars.getLanguage(), "CreateTaxReport.html", strReplaceWith);
        xmlDocument.setParameter("leftTabs", lBar.manualTemplate());
      } catch (Exception ex) {
        throw new ServletException(ex);
      }
      {
        OBError myMessage = vars.getMessage("CreateTaxReport");
        vars.removeMessage("CreateTaxReport");
        if (myMessage!=null) {
          xmlDocument.setParameter("messageType", myMessage.getType());
          xmlDocument.setParameter("messageTitle", myMessage.getTitle());
          xmlDocument.setParameter("messageMessage", myMessage.getMessage());
        }
      }
      
     ////----
      
      //xmlDocument.setParameter("array", strArray);

      try {
        ComboTableData comboTableData = new ComboTableData(vars, this, "TABLEDIR", "AD_Org_ID", "", "", Utility.getContext(this, vars, "#User_Org", "CreateTaxReport"), Utility.getContext(this, vars, "#User_Client", "CreateTaxReport"), 0);
        Utility.fillSQLParameters(this, vars, null, comboTableData, "CreateTaxReport", "");
        xmlDocument.setData("reportAD_ORG", "liststructure", comboTableData.select(false));
        comboTableData = null;
      } catch (Exception ex) {
        throw new ServletException(ex);
      }

      xmlDocument.setData("reportC_TAX_REPORT", "liststructure", CreateTaxReportData.selectC_TAX_REPORT(this, Utility.getContext(this, vars, "#User_Org", "CreateTaxReport"), Utility.getContext(this, vars, "#User_Client", "CreateTaxReport"), ""));

      response.setContentType("text/html; charset=UTF-8");
      PrintWriter out = response.getWriter();
      out.println(xmlDocument.print());
      out.close();
    }

void printPagePopUp (HttpServletResponse response, VariablesSecureApp vars, String strTaxReportId, String strDateFrom, String strDateTo, String strOrg) throws IOException, ServletException {
      if (log4j.isDebugEnabled()) log4j.debug("Output: pop up CreateTaxReport");
      XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_process/CreateTaxReportPopUp").createXmlDocument();
      int level = 0;

      strTreeOrg = strOrg;
      treeOrg(vars, strOrg);

      Vector<Object> vectorArray = new Vector<Object>();

      childData(vars, vectorArray, strTaxReportId, strDateFrom, strDateTo, strTreeOrg, level, "0", rownum);

      CreateTaxReportData[] dataTree = convertVector(vectorArray);
      strTreeOrg = "";
    xmlDocument.setParameter("direction", "var baseDirection = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "LNG_POR_DEFECTO=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("theme", vars.getTheme());
      xmlDocument.setParameter("title", dataTree[0].name);
      xmlDocument.setData("structure", dataTree);
      response.setContentType("text/html; charset=UTF-8");
      PrintWriter out = response.getWriter();
      out.println(xmlDocument.print());
      out.close();
}

/*String arrayEntry(VariablesSecureApp vars) throws ServletException{
      String result = "";
      CreateTaxReportData[] data = CreateTaxReportData.selectC_TAX_REPORT(this, Utility.getContext(this, vars, "#User_Org", "CreateTaxReport"), Utility.getContext(this, vars, "#User_Client", "CreateTaxReport"), "");
      if (data == null || data.length == 0) {
        result = "var array = null;";
      } else {
        result = "var array = new Array(\n";
        for (int i = 0;i<data.length;i++) {
          result += "new Array(\"" + data[i].id  + "\",\"" + data[i].filteredbyorganization  + "\",\"" + data[i].temporaryfiltertype  + "\")";
          if (i<data.length-1) result += ",\n";
        }
        result += ");";
      }
      return result;
}*/


void treeOrg(VariablesSecureApp vars, String strOrg) throws ServletException{
      CreateTaxReportData[] dataOrg = CreateTaxReportData.selectOrg(this, strOrg, vars.getClient());
      for (int i = 0; i<dataOrg.length; i++) {
        strTreeOrg += "," + dataOrg[i].id;
        if (dataOrg[i].issummary.equals("Y")) treeOrg(vars, dataOrg[i].id);
      }
      return;
}

void childData(VariablesSecureApp vars, Vector<Object> vectorArray, String strTaxReportId, String strPeriodFrom, String strPeriodTo, String strOrg, int level, String strParent, int rownum) throws IOException, ServletException{
      if (log4j.isDebugEnabled()) log4j.debug("**********************strTaxReportId: "+strTaxReportId);
      if (log4j.isDebugEnabled()) log4j.debug("**********************strPeriodFrom: "+strPeriodFrom);
      if (log4j.isDebugEnabled()) log4j.debug("**********************strPeriodTo: "+strPeriodTo);
      if (log4j.isDebugEnabled()) log4j.debug("**********************strOrg: "+strOrg);
      if (log4j.isDebugEnabled()) log4j.debug("**********************level: "+String.valueOf(level));
      if (log4j.isDebugEnabled()) log4j.debug("**********************User_Client: "+Utility.getContext(this, vars, "#User_Client", "CreateTaxReport"));
      if (log4j.isDebugEnabled()) log4j.debug("**********************#User_Org: "+Utility.getContext(this, vars, "#User_Org", "CreateTaxReport"));
      if (log4j.isDebugEnabled()) log4j.debug("Ouput: child tree data");
      //CreateTaxReportData[] dataTree = new CreateTaxReportData[data.length];
      String strTaxId = CreateTaxReportData.selectTax(this, strTaxReportId);
      if (log4j.isDebugEnabled()) log4j.debug("**********************strTaxId: "+strTaxId);
      CreateTaxReportData[] data = CreateTaxReportData.select(this, String.valueOf(rownum), strParent, String.valueOf(level), Utility.getContext(this, vars, "#User_Client", "CreateTaxReport"), strOrg, strPeriodFrom, DateTimeData.nDaysAfter(this,strPeriodTo,"1"), strTaxReportId);
      if (data == null || data.length == 0) data = CreateTaxReportData.set();
	  else rownum++;
	  System.out.println("rownum" +rownum);
      vectorArray.addElement(data[0]);
      if (log4j.isDebugEnabled()) log4j.debug("**********************data[0]*********************data[0].id: " + data[0].id + "- data[0].name:"+data[0].name+"  data[0].total:"+data[0].total);
      CreateTaxReportData[] dataAux = CreateTaxReportData.selectChild(this, Utility.getContext(this, vars, "#User_Client", "CreateTaxReport"), Utility.getContext(this, vars, "#User_Org", "CreateTaxReport"), data[0].id);
      if (log4j.isDebugEnabled()) log4j.debug("**********************dataAux.length: "+ dataAux.length);
      for (int i = 0; i<dataAux.length; i++){
          //if (dataAux[i].issummary.equals("Y")){
              childData(vars, vectorArray, dataAux[i].id, strPeriodFrom, strPeriodTo, strOrg, level+1, data[0].id, rownum);
			  rownum++;
          //}
      }
}

CreateTaxReportData[] convertVector(Vector<Object> vectorArray) throws ServletException {
    CreateTaxReportData[] data = new CreateTaxReportData[vectorArray.size()];
    double count = 0;
    for (int i = 0; i<vectorArray.size(); i++){
      data[i] = (CreateTaxReportData)vectorArray.elementAt(i);
    }
    if (log4j.isDebugEnabled()) log4j.debug("***************************data.length: "+data.length);
    for (int i = data.length-1; i>=0; i--){
        if (log4j.isDebugEnabled()) log4j.debug("*******************dataissummary: "+data[i].name+" "+data[i].issummary+" "+data[i].levelTax);
        if (data[i].issummary.equals("Y")){
            for (int j=i+1; j<data.length; j++){
                if (log4j.isDebugEnabled()) log4j.debug("******************************data[j].name: "+data[j].name+" "+data[j].levelTax+" "+data[i].levelTax);
                if (Integer.valueOf(data[j].levelTax).intValue() > Integer.valueOf(data[i].levelTax).intValue() && data[j].parent.equals(data[i].id)){
                    if (log4j.isDebugEnabled()) log4j.debug("******************************issummary[j]: "+data[j].issummary);
                    //if (!data[j].issummary.equals("Y")){
                        String total = data[j].total;
                        count += Double.valueOf(total).doubleValue();
                    //}
                }
                /*String strLevelSecundary = data[j].levelTax;
                if (!strLevelSecundary.equals("")){
                    if (Integer.valueOf(strLevelSecundary).intValue() == Integer.valueOf(strLevel).intValue()+1) {
                        String total = data[j].total;
                        count += Double.valueOf(total).doubleValue();
                    }
                }*/
            }
            data[i].total = String.valueOf(count);
            count = 0;
        }
    }
    return data;
}

  public String getServletInfo() {
    return "Servlet CreateTaxReport";
  } // end of getServletInfo() method
}

