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
 * All portions are Copyright (C) 2001-2008 Openbravo S.L.
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
*/
package org.openbravo.erpCommon.ad_forms;

import org.openbravo.erpCommon.businessUtility.WindowTabs;
import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.xmlEngine.XmlDocument;
import org.openbravo.erpCommon.utility.*;
import java.io.*;
import javax.servlet.*;
import javax.servlet.http.*;

import java.util.*;


public class ShowSessionPreferences extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;
  protected static final String windowId = "0";
  protected static final String tableLevel = "2";

  public void doPost (HttpServletRequest request, HttpServletResponse response) throws IOException,ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);


    if (vars.commandIn("SAVE_PREFERENCES")) {
      String strTranslate = vars.getStringParameter("inpTranslate", "N");
      String strAccounting = vars.getStringParameter("inpAccounting", "N");
      String strAudit = vars.getStringParameter("inpAudit", "N");
      String strFecha = vars.getStringParameter("inpFecha");
      String strTest = vars.getStringParameter("inpTest", "N");
      String strRecordRange = vars.getGlobalVariable("inpRecordRange", "#RecordRange");
      String strRecordRangeInfo = vars.getGlobalVariable("inpRecordRangeInfo", "#RecordRangeInfo");
      String strTheme = vars.getStringParameter("inpTheme");
      vars.setSessionValue("#Theme", vars.getSessionValue("#Theme").substring(0, 4)+strTheme);
      String strTransactionalRange = vars.getGlobalVariable("inpTransactionalRange", "#Transactional$Range");
      vars.setSessionValue("#Date", strFecha);
      vars.setSessionValue("#ShowTrl", strTranslate);
      vars.setSessionValue("#ShowAudit", strAudit);
      String strPreference = ShowSessionPreferencesData.selectPreference(this, Utility.getContext(this, vars, "#User_Client", "ShowSessionPreferences"), Utility.getContext(this, vars, "#User_Org", "ShowSessionPreferences"), vars.getUser(), "ShowTrl");
      ShowSessionPreferencesData.updateRange(this, vars.getUser(), strRecordRange, strRecordRangeInfo, strTransactionalRange, strTheme);
      if (!strPreference.equals("")) ShowSessionPreferencesData.update(this, vars.getUser(), strTranslate, strPreference);
      else {
        strPreference = SequenceIdData.getUUID();
        ShowSessionPreferencesData.insert(this, strPreference, vars.getClient(), vars.getOrg(), vars.getUser(), "ShowTrl", strTranslate);
      }
      vars.setSessionValue("#ShowAcct", strAccounting);
      strPreference = ShowSessionPreferencesData.selectPreference(this, Utility.getContext(this, vars, "#User_Client", "ShowSessionPreferences"), Utility.getContext(this, vars, "#User_Org", "ShowSessionPreferences"), vars.getUser(), "ShowAcct");
      if (!strPreference.equals("")) ShowSessionPreferencesData.update(this, vars.getUser(), strAccounting, strPreference);
      else {
        strPreference = SequenceIdData.getUUID();
        ShowSessionPreferencesData.insert(this, strPreference, vars.getClient(), vars.getOrg(), vars.getUser(), "ShowAcct", strAccounting);
      }
      vars.setSessionValue("#ShowTest", strTest);
      strPreference = ShowSessionPreferencesData.selectPreference(this, Utility.getContext(this, vars, "#User_Client", "ShowSessionPreferences"), Utility.getContext(this, vars, "#User_Org", "ShowSessionPreferences"), vars.getUser(), "ShowTest");
      ShowSessionPreferencesData.updateRange(this, vars.getUser(), strRecordRange, strRecordRangeInfo, strTransactionalRange, strTheme);
      if (!strPreference.equals("")) ShowSessionPreferencesData.update(this, vars.getUser(), strTest, strPreference);
      else {
        strPreference = SequenceIdData.getUUID();
        ShowSessionPreferencesData.insert(this, strPreference, vars.getClient(), vars.getOrg(), vars.getUser(), "ShowTest", strTest);
      }
      vars.setSessionValue("#ShowAudit", strAudit);
      strPreference = ShowSessionPreferencesData.selectPreference(this, Utility.getContext(this, vars, "#User_Client", "ShowSessionPreferences"), Utility.getContext(this, vars, "#User_Org", "ShowSessionPreferences"), vars.getUser(), "ShowAuditDefault");
      if (!strPreference.equals("")) ShowSessionPreferencesData.update(this, vars.getUser(), strAudit, strPreference);
      else {
        strPreference = SequenceIdData.getUUID();
        ShowSessionPreferencesData.insert(this, strPreference, vars.getClient(), vars.getOrg(), vars.getUser(), "ShowAuditDefault", strAudit);
      }
      response.sendRedirect(strDireccion + request.getServletPath());
    } else {
      printPagePreferences(response, vars);
    }
  }

  boolean existsWindow(Vector<Object> windows, String windowId) {
    if (windows.size()==0) return false;
    for (int i=0;i<windows.size();i++) {
      String aux = (String)windows.elementAt(i);
      if (aux.equals(windowId)) return true;
    }
    return false;
  }

  String windowName(ShowSessionPreferencesData[] windows, String windowId) {
    if (windows==null || windowId==null || windowId.equals("")) return "";
    for (int i=0;i<windows.length;i++) {
      if (windows[i].id.equals(windowId)) return windows[i].name;
    }
    return "";
  }

  void printPagePreferences(HttpServletResponse response, VariablesSecureApp vars) throws IOException, ServletException {
    if (log4j.isDebugEnabled()) log4j.debug("ShowSession - printPagePreferences - Output: preferences");
    
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/ad_forms/ShowSessionPreferences").createXmlDocument();
    
    xmlDocument.setParameter("calendar", vars.getLanguage().substring(0,2));
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");

    xmlDocument.setParameter("translate", vars.getSessionValue("#ShowTrl", "N"));
    xmlDocument.setParameter("accounting", vars.getSessionValue("#ShowAcct", "N"));
    xmlDocument.setParameter("audit", vars.getSessionValue("#ShowAudit", "N"));
    xmlDocument.setParameter("fecha", vars.getSessionValue("#Date", ""));
    xmlDocument.setParameter("fechadisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("fechasaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("transactionalRange", vars.getSessionValue("#Transactional$Range", ""));
    xmlDocument.setParameter("test", vars.getSessionValue("#ShowTest", "N"));
    xmlDocument.setParameter("recordRange", vars.getSessionValue("#RecordRange"));
    xmlDocument.setParameter("recordRangeInfo", vars.getSessionValue("#RecordRangeInfo"));
    xmlDocument.setParameter("info", getInfo(vars));
    xmlDocument.setParameter("theme", vars.getTheme().substring(4));

    ToolBar toolbar = new ToolBar(this, vars.getLanguage(), "ShowSessionPreferences", false, "", "", "",false, "ad_forms",  strReplaceWith, false,  true);
    toolbar.prepareSimpleToolBarTemplate();
    xmlDocument.setParameter("toolbar", toolbar.toString());
    try {
      WindowTabs tabs = new WindowTabs(this, vars, "org.openbravo.erpCommon.ad_forms.ShowSessionPreferences");
      xmlDocument.setParameter("theme", vars.getTheme());
      NavigationBar nav = new NavigationBar(this, vars.getLanguage(), "ShowSessionPreferences.html", classInfo.id, classInfo.type, strReplaceWith, tabs.breadcrumb());
      xmlDocument.setParameter("navigationBar", nav.toString());
      LeftTabsBar lBar = new LeftTabsBar(this, vars.getLanguage(), "ShowSessionPreferences.html", strReplaceWith);
      xmlDocument.setParameter("leftTabs", lBar.manualTemplate());
    } catch (Exception ex) {
      throw new ServletException(ex);
    }
    {
      OBError myMessage = vars.getMessage("ShowSessionPreferences");
      vars.removeMessage("ShowSessionPreferences");
      if (myMessage!=null) {
        xmlDocument.setParameter("messageType", myMessage.getType());
        xmlDocument.setParameter("messageTitle", myMessage.getTitle());
        xmlDocument.setParameter("messageMessage", myMessage.getMessage());
      }
    }

    ComboTableData comboTableData = null;
    try {
      comboTableData = new ComboTableData(vars, this, "LIST", "Theme", "800102", "", Utility.getContext(this, vars, "#User_Org", "ShowSessionPreferences"), Utility.getContext(this, vars, "#User_Client", "ShowSessionPreferences"), 0);
      Utility.fillSQLParameters(this, vars, null, comboTableData, "ShowSessionPreferences", "");
      xmlDocument.setData("reportTheme", "liststructure", comboTableData.select(true));
    } catch (Exception ex) {}
    comboTableData = null;

    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  private String getInfo(VariablesSecureApp vars) throws ServletException {
    StringBuffer script = new StringBuffer();
    script.append(Utility.messageBD(this, "User", vars.getLanguage())).append(": ").append(ShowSessionPreferencesData.usuario(this, vars.getUser())).append("\n");
    script.append(Utility.messageBD(this, "Role", vars.getLanguage())).append(": ").append(ShowSessionPreferencesData.rol(this, vars.getRole())).append("\n");
    script.append(Utility.messageBD(this, "Client", vars.getLanguage())).append(": ").append(ShowSessionPreferencesData.cliente(this, vars.getClient())).append("\n");
    script.append(Utility.messageBD(this, "Org", vars.getLanguage())).append(": ").append(ShowSessionPreferencesData.organizacion(this, vars.getOrg())).append("\n");
    script.append(Utility.messageBD(this, "Web", vars.getLanguage())).append(": ").append(strReplaceWith).append("\n");
    script.append(Utility.messageBD(this, "DB", vars.getLanguage())).append(": ").append(globalParameters.strBBDD).append("\n");
    script.append(Utility.messageBD(this, "RecordRange", vars.getLanguage())).append(": ").append(vars.getSessionValue("#RecordRange")).append("\n");
    script.append(Utility.messageBD(this, "SearchsRecordRange", vars.getLanguage())).append(": ").append(vars.getSessionValue("#RecordRangeInfo")).append("\n");
    if (globalParameters.strVersion!=null && !globalParameters.strVersion.equals("")) script.append(Utility.messageBD(this, "SourceVersion", vars.getLanguage())).append(": ").append(globalParameters.strVersion).append("\n");
    if (globalParameters.strParentVersion!=null && !globalParameters.strParentVersion.equals("")) script.append(Utility.messageBD(this, "VerticalSourceVersion", vars.getLanguage())).append(": ").append(globalParameters.strParentVersion).append("\n");
    script.append(Utility.messageBD(this, "JavaVM", vars.getLanguage())).append(": ").append(System.getProperty("java.vm.name")).append("\n");
    script.append(Utility.messageBD(this, "VersionJavaVM", vars.getLanguage())).append(": ").append(System.getProperty("java.vm.version")).append("\n");
    script.append(Utility.messageBD(this, "SystemLanguage", vars.getLanguage())).append(": ").append(globalParameters.strSystemLanguage).append("\n");
    script.append(Utility.messageBD(this, "JavaTMP", vars.getLanguage())).append(": ").append(System.getProperty("java.io.tmpdir")).append("\n");
    //script.append(Utility.messageBD(this, "UserFolder", vars.getLanguage())).append(": ").append(globalParameters.strFileProperties).append("\n");
    script.append(Utility.messageBD(this, "OS", vars.getLanguage())).append(": ").append(System.getProperty("os.name")).append(" ").append(System.getProperty("os.version"));
    script.append(" ").append(System.getProperty("sun.os.patch.level"));

    return script.toString();
  }


  public String getServletInfo() {
    return "Servlet ShowSession. This Servlet was made by Wad constructor";
  } // end of getServletInfo() method
}

