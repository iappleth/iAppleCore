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

package org.openbravo.erpCommon.ad_forms;

import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.erpCommon.utility.ToolBar;
import org.openbravo.erpCommon.utility.Utility;

import org.openbravo.erpCommon.utility.SequenceIdData;
import org.openbravo.erpCommon.reference.*;
import org.openbravo.erpCommon.utility.*;
import org.openbravo.erpCommon.businessUtility.WindowTabs;
import org.openbravo.erpCommon.businessUtility.Tree;
import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.xmlEngine.XmlDocument;
import org.openbravo.erpCommon.utility.ComboTableData;
import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;


// imports for transactions

import org.openbravo.erpCommon.utility.DateTimeData;


public class GenerateShipmentsmanual extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);
    OBError myMessage = null;
    
    if (!Utility.hasFormAccess(this, vars, "", "org.openbravo.erpCommon.ad_forms.GenerateShipmentsmanual")) {
      bdError(response, "AccessTableNoView", vars.getLanguage());
      return;
    }

    if (vars.commandIn("DEFAULT")) {
      String strDateFrom = vars.getGlobalVariable("inpDateFrom", "GenerateShipmentsmanual|DateFrom", "");
      String strDateTo = vars.getGlobalVariable("inpDateTo", "GenerateShipmentsmanual|DateTo", "");
      String strC_BPartner_ID = vars.getGlobalVariable("inpcBpartnerId", "GenerateShipmentsmanual|C_BPartner_ID", "");
      String strAD_Org_ID = vars.getGlobalVariable("inpadOrgId", "GenerateShipmentsmanual|AD_Org_ID", vars.getOrg());
      vars.setSessionValue("GenerateShipmentsmanual|isSOTrx", "Y");
      printPageDataSheet(response, vars, strC_BPartner_ID, strAD_Org_ID, strDateFrom, strDateTo);
    } else if (vars.commandIn("FIND")) {
      String strDateFrom = vars.getRequestGlobalVariable("inpDateFrom", "GenerateShipmentsmanual|DateFrom");
      String strDateTo = vars.getRequestGlobalVariable("inpDateTo", "GenerateShipmentsmanual|DateTo");
      String strC_BPartner_ID = vars.getRequestGlobalVariable("inpcBpartnerId", "GenerateShipmentsmanual|C_BPartner_ID");
      String strAD_Org_ID = vars.getGlobalVariable("inpadOrgId", "GenerateShipmentsmanual|AD_Org_ID");
      printPageDataSheet(response, vars, strC_BPartner_ID, strAD_Org_ID, strDateFrom, strDateTo);
    } else if (vars.commandIn("GENERATE")) {
      myMessage = new OBError();
      myMessage.setTitle("");
      String strSalesOrder = vars.getRequiredInStringParameter("inpOrder");
      
      GenerateShipmentsmanualData.update(this);
      GenerateShipmentsmanualData.updateSelection(this, strSalesOrder);

      String pinstance = SequenceIdData.getSequence(this, "AD_PInstance", vars.getClient());

      PInstanceProcessData.insertPInstance(this, pinstance, "199", "0", "N", vars.getUser(), vars.getClient(), vars.getOrg());
      PInstanceProcessData.insertPInstanceParam(this, pinstance, "1", "Selection", "Y", vars.getClient(), vars.getOrg(), vars.getUser());
      ActionButtonData.process199(this, pinstance);

      PInstanceProcessData[] pinstanceData = PInstanceProcessData.select(this, pinstance);
      if (pinstanceData!=null && pinstanceData.length>0) {
        if (!pinstanceData[0].errormsg.equals("")) {
          String message = pinstanceData[0].errormsg;
          if (message.startsWith("@") && message.endsWith("@")) {
            message = message.substring(1, message.length()-1);
            if (message.indexOf("@")==-1){
            	myMessage.setType("Error");        
                myMessage.setMessage(Utility.messageBD(this, message, vars.getLanguage()));                
            	//messageResult = Utility.messageBD(this, message, vars.getLanguage());
            }
            else{
            	myMessage.setType("Error");        
                myMessage.setMessage(Utility.parseTranslation(this, vars, vars.getLanguage(), "@" + message + "@"));
            	//messageResult = Utility.parseTranslation(this, vars, vars.getLanguage(), "@" + message + "@");            
            }
          } else {
        	 myMessage.setType("Error");        
             myMessage.setMessage(Utility.parseTranslation(this, vars, vars.getLanguage(), message));  
             //messageResult = Utility.parseTranslation(this, vars, vars.getLanguage(), message);
            
          }
        } else if (pinstanceData[0].result.equals("1")) {
        	myMessage.setType("Success");        
            myMessage.setMessage(Utility.messageBD(this, "Success", vars.getLanguage()));	
           //messageResult = Utility.messageBD(this, "Success", vars.getLanguage());
        } else {
          myMessage.setType("Error");        
          myMessage.setMessage(Utility.messageBD(this, "Error", vars.getLanguage()));		
          //messageResult = Utility.messageBD(this, "Error", vars.getLanguage());
        }
      }
      GenerateShipmentsmanualData.updateReset(this, strSalesOrder);

      if (log4j.isDebugEnabled()) log4j.debug(myMessage.getMessage());
      // new message system
      vars.setMessage("GenerateShipmentsmanual", myMessage);
      //vars.setSessionValue("GenerateShipmentsmanual|message", messageResult);      
      response.sendRedirect(strDireccion + request.getServletPath());
  } else pageError(response);
}


  void printPageDataSheet(HttpServletResponse response, VariablesSecureApp vars, String strC_BPartner_ID, String strAD_Org_ID, String strDateFrom, String strDateTo)
      throws IOException, ServletException {
      if (log4j.isDebugEnabled()) log4j.debug("Output: dataSheet");
      response.setContentType("text/html; charset=UTF-8");
      PrintWriter out = response.getWriter();
      String discard[]={"sectionDetail"};
      XmlDocument xmlDocument=null;
      //String strMessage = vars.getSessionValue("GenerateShipmentsmanual|message");
      //vars.removeSessionValue("GenerateShipmentsmanual|message");
      GenerateShipmentsmanualData[] data=null;
      String strTreeOrg = GenerateShipmentsmanualData.treeOrg(this, vars.getClient());
      if (strC_BPartner_ID.equals("") && strAD_Org_ID.equals("")){
      xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_forms/GenerateShipmentsmanual", discard).createXmlDocument();
      data = GenerateShipmentsmanualData.set();
      }
      else {
      xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_forms/GenerateShipmentsmanual").createXmlDocument();
      data = GenerateShipmentsmanualData.select(this, Utility.getContext(this, vars, "#User_Client", "GenerateShipmentsmanual"), Utility.getContext(this, vars, "#User_Org", "GenerateShipmentsmanual"), strC_BPartner_ID, strDateFrom, DateTimeData.nDaysAfter(this, strDateTo,"1"), Tree.getMembers(this, strTreeOrg, strAD_Org_ID));
      }

      ToolBar toolbar = new ToolBar(this, vars.getLanguage(), "GenerateShipmentsmanual", false, "", "", "",false, "ad_forms",  strReplaceWith, false,  true);
      toolbar.prepareSimpleToolBarTemplate();
      xmlDocument.setParameter("toolbar", toolbar.toString());

	  try {
      KeyMap key = new KeyMap(this, vars, "GenerateShipmentsmanual.html");
      xmlDocument.setParameter("keyMap", key.getActionButtonKeyMaps());
    } catch (Exception ex) {
      throw new ServletException(ex);
    }
    try {
      WindowTabs tabs = new WindowTabs(this, vars, "org.openbravo.erpCommon.ad_forms.GenerateShipmentsmanual");
      xmlDocument.setParameter("parentTabContainer", tabs.parentTabs());
      xmlDocument.setParameter("mainTabContainer", tabs.mainTabs());
      xmlDocument.setParameter("childTabContainer", tabs.childTabs());
      xmlDocument.setParameter("theme", vars.getTheme());
      NavigationBar nav = new NavigationBar(this, vars.getLanguage(), "GenerateShipmentsmanual.html", classInfo.id, classInfo.type, strReplaceWith, tabs.breadcrumb());
      xmlDocument.setParameter("navigationBar", nav.toString());
      LeftTabsBar lBar = new LeftTabsBar(this, vars.getLanguage(), "GenerateShipmentsmanual.html", strReplaceWith);
      xmlDocument.setParameter("leftTabs", lBar.manualTemplate());
    } catch (Exception ex) {
      throw new ServletException(ex);
    }
    {
      OBError myMessage = vars.getMessage("GenerateShipmentsmanual");
      vars.removeMessage("GenerateShipmentsmanual");
      if (myMessage!=null) {
        xmlDocument.setParameter("messageType", myMessage.getType());
        xmlDocument.setParameter("messageTitle", myMessage.getTitle());
        xmlDocument.setParameter("messageMessage", myMessage.getMessage());
      }
    }

      xmlDocument.setParameter("calendar", vars.getLanguage().substring(0,2));
      xmlDocument.setParameter("direction", "var baseDirection = \"" + strReplaceWith + "/\";\n");
      xmlDocument.setParameter("paramLanguage", "LNG_POR_DEFECTO=\"" + vars.getLanguage() + "\";");
      xmlDocument.setParameter("paramBPartnerId", strC_BPartner_ID);
      xmlDocument.setParameter("paramAdOrgId", strAD_Org_ID);
       xmlDocument.setParameter("dateFrom", strDateFrom);
    xmlDocument.setParameter("dateFromdisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateFromsaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateTo", strDateTo);
    xmlDocument.setParameter("dateTodisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateTosaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("paramBPartnerDescription", GenerateInvoicesmanualData.bPartnerDescription(this, strC_BPartner_ID));
    //
    //xmlDocument.setParameter("paramMessage", (strMessage.equals("")?"":"alert('" + Replace.replace(strMessage, "\"", "\\'") + "');"));
      try {
        ComboTableData comboTableData = new ComboTableData(vars, this, "TABLEDIR", "AD_Org_ID", "", "AD_Org Security validation", Utility.getContext(this, vars, "#User_Org", "GenerateShipmentsmanual"), Utility.getContext(this, vars, "#User_Client", "GenerateShipmentsmanual"), 0);
        Utility.fillSQLParameters(this, vars, null, comboTableData, "GenerateShipmentsmanual", strAD_Org_ID);
        xmlDocument.setData("reportAD_Org_ID","liststructure", comboTableData.select(false));
        comboTableData = null;
      } catch (Exception ex) {
        throw new ServletException(ex);
      }
        xmlDocument.setData("structure1", data);
        out.println(xmlDocument.print());
        out.close();
      }


  public String getServletInfo() {
    return "GenerateShipmentsmanual Servlet. This Servlet was made by Wad constructor";
  } // end of getServletInfo() method
}

