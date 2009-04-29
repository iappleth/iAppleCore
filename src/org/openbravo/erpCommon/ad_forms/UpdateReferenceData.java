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
 * All portions are Copyright (C) 2008 Openbravo SL
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.erpCommon.ad_forms;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.dal.service.OBDal;
import org.openbravo.data.FieldProvider;
import org.openbravo.erpCommon.businessUtility.WindowTabs;
import org.openbravo.erpCommon.modules.ModuleReferenceDataOrgTree;
import org.openbravo.erpCommon.modules.ModuleUtiltiy;
import org.openbravo.erpCommon.utility.LeftTabsBar;
import org.openbravo.erpCommon.utility.NavigationBar;
import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.erpCommon.utility.ToolBar;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.ad.module.Module;
import org.openbravo.model.ad.system.Client;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.service.db.DataImportService;
import org.openbravo.service.db.ImportResult;
import org.openbravo.xmlEngine.XmlDocument;

public class UpdateReferenceData extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;
  static final String SALTO_LINEA = "<br>\n";
  String strError = "";
  static StringBuffer m_info = new StringBuffer();

  public void doPost(HttpServletRequest request, HttpServletResponse response)
      throws ServletException, IOException {
    VariablesSecureApp vars = new VariablesSecureApp(request);
    if (vars.commandIn("DEFAULT")) {
      String strOrganization = vars.getStringParameter("inpOrganization", "0");
      printPage(response, vars, strOrganization);
    } else if (vars.commandIn("OK")) {
      m_info.delete(0, m_info.length());
      String strResultado = updateReferenceData(request, response, vars);
      log4j.debug("UpdateReferenceData - after processFile");
      printPageResult(response, vars, strResultado);
    } else if (vars.commandIn("CANCEL")) {
    } else
      pageError(response);
  }

  private void printPage(HttpServletResponse response, VariablesSecureApp vars,
      String strOrganization) throws IOException, ServletException {
    ModuleReferenceDataOrgTree tree = new ModuleReferenceDataOrgTree(this, vars.getClient(),
        strOrganization, true);
    XmlDocument xmlDocument = null;
    String[] discard = { "selEliminar" };
    if (tree.getData() == null || tree.getData().length == 0)
      xmlDocument = xmlEngine.readXmlTemplate(
          "org/openbravo/erpCommon/ad_forms/UpdateReferenceData").createXmlDocument();
    else
      xmlDocument = xmlEngine.readXmlTemplate(
          "org/openbravo/erpCommon/ad_forms/UpdateReferenceData", discard).createXmlDocument();

    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    ToolBar toolbar = new ToolBar(this, vars.getLanguage(), "UpdateReferenceData", false, "", "",
        "", false, "ad_forms", strReplaceWith, false, true);
    toolbar.prepareSimpleToolBarTemplate();
    xmlDocument.setParameter("toolbar", toolbar.toString());
    try {
      WindowTabs tabs = new WindowTabs(this, vars,
          "org.openbravo.erpCommon.ad_forms.UpdateReferenceData");
      xmlDocument.setParameter("parentTabContainer", tabs.parentTabs());
      xmlDocument.setParameter("mainTabContainer", tabs.mainTabs());
      xmlDocument.setParameter("childTabContainer", tabs.childTabs());
      xmlDocument.setParameter("theme", vars.getTheme());
      NavigationBar nav = new NavigationBar(this, vars.getLanguage(), "UpdateReferenceData.html",
          classInfo.id, classInfo.type, strReplaceWith, tabs.breadcrumb());
      xmlDocument.setParameter("navigationBar", nav.toString());
      LeftTabsBar lBar = new LeftTabsBar(this, vars.getLanguage(), "UpdateReferenceData.html",
          strReplaceWith);
      xmlDocument.setParameter("leftTabs", lBar.manualTemplate());
    } catch (Exception ex) {
      throw new ServletException(ex);
    }
    {
      vars.removeMessage("UpdateReferenceData");
      OBError myMessage = vars.getMessage("UpdateReferenceData");
      if (myMessage != null) {
        xmlDocument.setParameter("messageType", myMessage.getType());
        xmlDocument.setParameter("messageTitle", myMessage.getTitle());
        xmlDocument.setParameter("messageMessage", myMessage.getMessage());
      }

      xmlDocument.setParameter("moduleTree", tree.toHtml());
      xmlDocument.setParameter("moduleTreeDescription", tree.descriptionToHtml());
      xmlDocument.setParameter("organization", strOrganization);
      xmlDocument.setData("reportAD_Org_ID", "liststructure", UpdateReferenceDataData
          .selectOrganization(this, vars.getRole(), vars.getUserOrg()));
      response.setContentType("text/html; charset=UTF-8");
      PrintWriter out = response.getWriter();
      out.println(xmlDocument.print());
      out.close();
    }
  }

  private void printPageResult(HttpServletResponse response, VariablesSecureApp vars,
      String strResultado) throws IOException, ServletException {
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/ad_forms/Resultado").createXmlDocument();

    xmlDocument.setParameter("resultado", m_info.toString());

    ToolBar toolbar = new ToolBar(this, vars.getLanguage(), "UpdateReferenceData", false, "", "",
        "", false, "ad_forms", strReplaceWith, false, true);
    toolbar.prepareSimpleToolBarTemplate();
    xmlDocument.setParameter("toolbar", toolbar.toString());
    try {
      WindowTabs tabs = new WindowTabs(this, vars,
          "org.openbravo.erpCommon.ad_forms.UpdateReferenceData");
      xmlDocument.setParameter("parentTabContainer", tabs.parentTabs());
      xmlDocument.setParameter("mainTabContainer", tabs.mainTabs());
      xmlDocument.setParameter("childTabContainer", tabs.childTabs());
      xmlDocument.setParameter("theme", vars.getTheme());
      NavigationBar nav = new NavigationBar(this, vars.getLanguage(), "UpdateReferenceData.html",
          classInfo.id, classInfo.type, strReplaceWith, tabs.breadcrumb());
      xmlDocument.setParameter("navigationBar", nav.toString());
      LeftTabsBar lBar = new LeftTabsBar(this, vars.getLanguage(), "UpdateReferenceData.html",
          strReplaceWith);
      xmlDocument.setParameter("leftTabs", lBar.manualTemplate());
    } catch (Exception ex) {
      throw new ServletException(ex);
    }
    OBError myMessage = new OBError();
    myMessage.setTitle("");
    if (log4j.isDebugEnabled())
      log4j.debug("UpdateReferenceData - before setMessage");
    if (strError != null && !strError.equals("")) {
      myMessage = Utility.translateError(this, vars, vars.getLanguage(), strError);
    }
    if (log4j.isDebugEnabled())
      log4j.debug("UpdateReferenceData - isOK: " + strResultado.equals(""));
    if (strResultado.equals("")) {
      myMessage.setType("Success");
    } else
      myMessage.setType("Error");
    myMessage.setMessage(Utility.messageBD(this,
        strResultado.equals("") ? "Success" : strResultado, vars.getLanguage()));
    if (log4j.isDebugEnabled())
      log4j.debug("UpdateReferenceData - Message Type: " + myMessage.getType());
    vars.setMessage("UpdateReferenceData", myMessage);
    if (log4j.isDebugEnabled())
      log4j.debug("UpdateReferenceData - after setMessage");
    if (myMessage != null) {
      xmlDocument.setParameter("messageType", myMessage.getType());
      xmlDocument.setParameter("messageTitle", myMessage.getTitle());
      xmlDocument.setParameter("messageMessage", myMessage.getMessage());
    }
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  public String updateReferenceData(HttpServletRequest request, HttpServletResponse response,
      VariablesSecureApp vars) throws IOException, ServletException {

    String strOrganization = vars.getStringParameter("inpOrganization");
    String strModules = vars.getInStringParameter("inpNodes");
    String strModule = vars.getStringParameter("inpNodeId");
    if (strModules == null || strModules.equals(""))
      strModules = "('" + strModule + "')";

    if (strModules != null && !strModules.equals("")) {
      UpdateReferenceDataData[] data = UpdateReferenceDataData.selectModules(this, strModules,
          strOrganization);
      data = orderModuleByDependency(data);
      if (data != null && data.length != 0) {
        DataImportService myData = DataImportService.getInstance();
        m_info.append(SALTO_LINEA).append(
            Utility.messageBD(this, "StartingReferenceData", vars.getLanguage())).append(
            SALTO_LINEA);
        for (int i = 0; i < data.length; i++) {
          String strPath = vars.getSessionValue("#SOURCEPATH") + "/modules/" + data[i].javapackage
              + "/referencedata/standard";
          File myDir = new File(strPath);
          File[] myFiles = myDir.listFiles();
          ArrayList<File> myTargetFiles = new ArrayList<File>();
          // if the directory does not exist then it will throw an exception
          if (myFiles != null) {
            for (int j = 0; j < myFiles.length; j++) {
              if (myFiles[j].getName().endsWith(".xml"))
                myTargetFiles.add(myFiles[j]);
            }
            myFiles = myTargetFiles.toArray(myFiles);
          } else {
            myFiles = new File[] {};
          }
          StringBuffer strError = new StringBuffer("");
          for (int j = 0; j < myFiles.length; j++) {
            String strXml = Utility.fileToString(myFiles[j].getPath());
            ImportResult myResult = myData.importDataFromXML((Client) OBDal.getInstance().get(
                Client.class, vars.getClient()), (Organization) OBDal.getInstance().get(
                Organization.class, strOrganization), strXml, (Module) OBDal.getInstance().get(
                Module.class, data[i].adModuleId));
            m_info.append(SALTO_LINEA).append("File: ").append(myFiles[j].getName()).append(":")
                .append(SALTO_LINEA);
            if (myResult.getLogMessages() != null && !myResult.getLogMessages().equals("")
                && !myResult.getLogMessages().equals("null")) {
              m_info.append(SALTO_LINEA).append("LOG:").append(SALTO_LINEA);
              m_info.append(SALTO_LINEA).append(replaceNL(myResult.getLogMessages())).append(
                  SALTO_LINEA);
            }
            if (myResult.getWarningMessages() != null && !myResult.getWarningMessages().equals("")
                && !myResult.getWarningMessages().equals("null")) {
              m_info.append(SALTO_LINEA).append("WARNINGS:").append(SALTO_LINEA);
              m_info.append(SALTO_LINEA).append(replaceNL(myResult.getWarningMessages())).append(
                  SALTO_LINEA);
            }
            if (myResult.getErrorMessages() != null && !myResult.getErrorMessages().equals("")
                && !myResult.getErrorMessages().equals("null")) {
              m_info.append(SALTO_LINEA).append("ERRORS:").append(SALTO_LINEA);
              m_info.append(SALTO_LINEA).append(replaceNL(myResult.getErrorMessages())).append(
                  SALTO_LINEA);
            }
            if (myResult.getErrorMessages() != null && !myResult.getErrorMessages().equals("")
                && !myResult.getErrorMessages().equals("null"))
              strError = strError.append(myResult.getErrorMessages());
          }
          if (!strError.toString().equals(""))
            return strError.toString();
          else {
            if (UpdateReferenceDataData.selectRegister(this, data[i].adModuleId, strOrganization)
                .equals("0"))
              InitialOrgSetupData.insertOrgModule(this, vars.getClient(), strOrganization, vars
                  .getUser(), data[i].adModuleId, data[i].version);
            else
              UpdateReferenceDataData.updateOrgModule(this, data[i].version, vars.getUser(), vars
                  .getClient(), strOrganization, data[i].adModuleId);
            m_info.append(SALTO_LINEA).append(
                Utility.messageBD(this, "CreateReferenceDataSuccess", vars.getLanguage())).append(
                SALTO_LINEA);
          }

          return "";
        }
      } else
        return "WrongModules";
    } else
      return "NoModules";
    return "";
  }

  private String replaceNL(String val) {
    return val.replaceAll("\n", "<br/>");
  }

  /**
   * Returns the modules {@link FieldProvider} ordered taking into account dependencies
   * 
   * @param modules
   * @return
   */
  private UpdateReferenceDataData[] orderModuleByDependency(UpdateReferenceDataData[] modules) {
    if (modules == null || modules.length == 0)
      return null;
    ArrayList<String> list = new ArrayList<String>();
    for (int i = 0; i < modules.length; i++) {
      list.add(modules[i].adModuleId);
    }
    ArrayList<String> orderList = ModuleUtiltiy.orderByDependency(this, list);
    UpdateReferenceDataData[] rt = new UpdateReferenceDataData[orderList.size()];
    for (int i = 0; i < orderList.size(); i++) {
      int j = 0;
      while (j < modules.length && !modules[j].adModuleId.equals(orderList.get(i)))
        j++;
      rt[i] = modules[j];
    }
    return rt;
  }

}
