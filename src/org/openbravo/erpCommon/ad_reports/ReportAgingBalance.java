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

import java.io.*;

import javax.servlet.*;
import javax.servlet.http.*;
import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.erpCommon.businessUtility.Tree;
import org.openbravo.erpCommon.businessUtility.WindowTabs;
import org.openbravo.erpCommon.utility.*;
import org.openbravo.xmlEngine.XmlDocument;
import org.openbravo.erpCommon.utility.DateTimeData;


public class ReportAgingBalance extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;
  //static Category log4j = Category.getInstance(ReportAgingBalance.class);

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);

    if (vars.commandIn("DEFAULT")) {
      String strisReceipt = vars.getGlobalVariable("inpReceipt", "ReportAgingBalance|IsReceipt", "N");
      String strcolumn1 = vars.getGlobalVariable("inpColumn1", "ReportAgingBalance|Column1", "10");
      String strcolumn2 = vars.getGlobalVariable("inpColumn2", "ReportAgingBalance|Column2", "20");
      String strcolumn3 = vars.getGlobalVariable("inpColumn3", "ReportAgingBalance|Column3", "30");
      String strcolumn4 = vars.getGlobalVariable("inpColumn4", "ReportAgingBalance|Column4", "60");
      String strcBpartnerId = vars.getInGlobalVariable("inpcBPartnerId_IN", "ReportAgingBalance|cBpartnerId", "");
      String strOrg = vars.getGlobalVariable("inpOrg", "ReportAgingBalance|Org", "");
      printPageDataSheet(response, vars, strisReceipt, strcolumn1, strcolumn2, strcolumn3, strcolumn4, strcBpartnerId, strOrg, "Y");
    } else if (vars.commandIn("FIND")) {
      String strisReceipt = vars.getRequestGlobalVariable("inpReceipt", "ReportAgingBalance|IsReceipt");
      String strcolumn1 = vars.getRequestGlobalVariable("inpColumn1", "ReportAgingBalance|Column1");
      String strcolumn2 = vars.getRequestGlobalVariable("inpColumn2", "ReportAgingBalance|Column2");
      String strcolumn3 = vars.getRequestGlobalVariable("inpColumn3", "ReportAgingBalance|Column3");
      String strcolumn4 = vars.getRequestGlobalVariable("inpColumn4", "ReportAgingBalance|Column4");
      String strcBpartnerId = vars.getRequestInGlobalVariable("inpcBPartnerId_IN", "ReportAgingBalance|cBpartnerId");
      String strOrg = vars.getRequestGlobalVariable("inpOrg", "ReportAgingBalance|Org");
      printPageDataSheet(response, vars, strisReceipt, strcolumn1, strcolumn2, strcolumn3, strcolumn4, strcBpartnerId, strOrg, "N");
    } else pageError(response);
  }

  void printPageDataSheet(HttpServletResponse response, VariablesSecureApp vars, String strisReceipt, String strcolumn1, String strcolumn2, String strcolumn3, String strcolumn4, String strcBpartnerId, String strOrgTrx, String strfirstPrint)
    throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("Output: dataSheet");
    response.setContentType("text/html");
    PrintWriter out = response.getWriter();
    String discard[]={"sectionDocType"};
    XmlDocument xmlDocument=null;
    ReportAgingBalanceData[] data=null;
    //Jarenor
/*    String strClient=Utility.getContext(this, vars, "#User_Client", "ReportAgingBalance");
    String strOrg= Utility.getContext(this, vars, "#User_Org", "ReportAgingBalance");
*/
    
    String strTreeOrg = ReportTrialBalanceData.treeOrg(this, vars.getClient());
    String strOrgFamily = getFamily(strTreeOrg, strOrgTrx);
    
    if (strisReceipt.equals("")) strisReceipt="N";

    if (vars.commandIn("FIND")) {
      data = ReportAgingBalanceData.select(this, vars.getLanguage(), strOrgTrx, strcolumn1, strcolumn2, strcolumn3, strcolumn4, strisReceipt, strcBpartnerId, strOrgFamily, Utility.getContext(this, vars, "#User_Client", "ReportAgingBalance"), Utility.getContext(this, vars, "#User_Org", "ReportAgingBalance"));
    }
    if (strfirstPrint=="Y" || data == null || data.length == 0) {
      xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_reports/ReportAgingBalance", discard).createXmlDocument();
      data = ReportAgingBalanceData.set();
    } else {
      xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_reports/ReportAgingBalance").createXmlDocument();
    }



    ToolBar toolbar = new ToolBar(this, vars.getLanguage(), "ReportAgingBalance", false, "", "", "",false, "ad_reports",  strReplaceWith, false,  true);
    toolbar.prepareSimpleToolBarTemplate();

    xmlDocument.setParameter("toolbar", toolbar.toString());

    try {
      WindowTabs tabs = new WindowTabs(this, vars, "org.openbravo.erpCommon.ad_reports.ReportAgingBalance");
      xmlDocument.setParameter("parentTabContainer", tabs.parentTabs());
      xmlDocument.setParameter("mainTabContainer", tabs.mainTabs());
      xmlDocument.setParameter("childTabContainer", tabs.childTabs());
      xmlDocument.setParameter("theme", vars.getTheme());
      NavigationBar nav = new NavigationBar(this, vars.getLanguage(), "ReportAgingBalance.html", classInfo.id, classInfo.type, strReplaceWith, tabs.breadcrumb());
      xmlDocument.setParameter("navigationBar", nav.toString());
      LeftTabsBar lBar = new LeftTabsBar(this, vars.getLanguage(), "ReportAgingBalance.html", strReplaceWith);
      xmlDocument.setParameter("leftTabs", lBar.manualTemplate());
    } catch (Exception ex) {
      throw new ServletException(ex);
    }
    {
      OBError myMessage = vars.getMessage("ReportAgingBalance");
      vars.removeMessage("ReportAgingBalance");
      if (myMessage!=null) {
        xmlDocument.setParameter("messageType", myMessage.getType());
        xmlDocument.setParameter("messageTitle", myMessage.getTitle());
        xmlDocument.setParameter("messageMessage", myMessage.getMessage());
      }
    }

    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("paramLanguage", "defaultLang=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("receipt", strisReceipt);
    xmlDocument.setParameter("payable", strisReceipt);
    xmlDocument.setParameter("column1", strcolumn1);
    xmlDocument.setParameter("column2", strcolumn2);
    xmlDocument.setParameter("column3", strcolumn3);
    xmlDocument.setParameter("column4", strcolumn4);
    xmlDocument.setParameter("paramAD_ORG_Id", strOrgTrx);
    try {
      ComboTableData comboTableData = new ComboTableData(vars, this, "LIST", "", "AD_ORG NAME", "", Utility.getContext(this, vars, "#User_Org", "ReportAgingBalanceData"), Utility.getContext(this, vars, "#User_Client", "ReportAgingBalanceData"), '*');
      Utility.fillSQLParameters(this, vars, null, comboTableData, "ReportAgingBalanceData", strOrgTrx);
      xmlDocument.setData("reportAD_ORGID","liststructure", ReportAgingBalanceData.selectCombo(this, vars.getRole()));
      comboTableData = null;
    } catch (Exception ex) {
      throw new ServletException(ex);
    }

    xmlDocument.setParameter("titleColumn1", "0 - " + strcolumn1);
    Integer iAux = Integer.valueOf(strcolumn1).intValue() + Integer.valueOf("1").intValue();
    xmlDocument.setParameter("titleColumn2", iAux.toString() + " - " + strcolumn2);
    iAux = Integer.valueOf(strcolumn2).intValue() + Integer.valueOf("1").intValue();
    xmlDocument.setParameter("titleColumn3", iAux.toString() + " - " + strcolumn3);
    iAux = Integer.valueOf(strcolumn3).intValue() + Integer.valueOf("1").intValue();
    xmlDocument.setParameter("titleColumn4", iAux.toString() + " - " + strcolumn4);
    xmlDocument.setParameter("titleColumn5", "&gt;" + strcolumn4);

    xmlDocument.setParameter("dateFromPrevious", DateTimeData.nDaysAfter(this, DateTimeData.today(this),"-1"));
    xmlDocument.setParameter("dateFromCol1", DateTimeData.today(this));
    xmlDocument.setParameter("dateToCol1", DateTimeData.nDaysAfter(this, DateTimeData.today(this),strcolumn1));
    iAux = Integer.valueOf(strcolumn1).intValue() + Integer.valueOf("1").intValue();
    xmlDocument.setParameter("dateFromCol2", DateTimeData.nDaysAfter(this, DateTimeData.today(this),iAux.toString()));
    xmlDocument.setParameter("dateToCol2", DateTimeData.nDaysAfter(this, DateTimeData.today(this),strcolumn2));
    iAux = Integer.valueOf(strcolumn2).intValue() + Integer.valueOf("1").intValue();
    xmlDocument.setParameter("dateFromCol3", DateTimeData.nDaysAfter(this, DateTimeData.today(this),iAux.toString()));
    xmlDocument.setParameter("dateToCol3", DateTimeData.nDaysAfter(this, DateTimeData.today(this),strcolumn3));
    iAux = Integer.valueOf(strcolumn3).intValue() + Integer.valueOf("1").intValue();
    xmlDocument.setParameter("dateFromCol4", DateTimeData.nDaysAfter(this, DateTimeData.today(this),iAux.toString()));
    xmlDocument.setParameter("dateToCol4", DateTimeData.nDaysAfter(this, DateTimeData.today(this),strcolumn4));
    iAux = Integer.valueOf(strcolumn4).intValue() + Integer.valueOf("1").intValue();
    xmlDocument.setParameter("dateFromCol5", DateTimeData.nDaysAfter(this, DateTimeData.today(this),iAux.toString()));
    xmlDocument.setParameter("dateToCol5", "");
    
    xmlDocument.setData("reportCBPartnerId_IN", "liststructure", ReportInOutData.selectBpartner(this, Utility.getContext(this, vars, "#User_Org", ""), Utility.getContext(this, vars, "#User_Client", ""), strcBpartnerId));
    xmlDocument.setData("structure1", data);
    out.println(xmlDocument.print());
    out.close();
  }

  public String getFamily(String strTree, String strChild) throws IOException, ServletException {
    return Tree.getMembers(this, strTree, strChild);
    /*    ReportGeneralLedgerData [] data = ReportGeneralLedgerData.selectChildren(this, strTree, strChild);
          String strFamily = "";
          if(data!=null && data.length>0) {
          for (int i = 0;i<data.length;i++){
          if (i>0) strFamily = strFamily + ",";
          strFamily = strFamily + data[i].id;
          }
          return strFamily;
          }else return "'1'";*/
  }

  public String getServletInfo() {
    return "Servlet ReportAgingBalance. This Servlet was made by David Alsasua";
  } // end of the getServletInfo() method
}
