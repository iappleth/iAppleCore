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
 * All portions are Copyright (C) 2008-2009 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.erpCommon.ad_forms;

import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashMap;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.fileupload.FileItem;
import org.openbravo.base.filter.IsIDFilter;
import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.dal.service.OBDal;
import org.openbravo.data.FieldProvider;
import org.openbravo.erpCommon.businessUtility.WindowTabs;
import org.openbravo.erpCommon.modules.ImportModule;
import org.openbravo.erpCommon.modules.ModuleTree;
import org.openbravo.erpCommon.modules.UninstallModule;
import org.openbravo.erpCommon.modules.VersionUtility;
import org.openbravo.erpCommon.obps.ActivationKey;
import org.openbravo.erpCommon.utility.ComboTableData;
import org.openbravo.erpCommon.utility.FieldProviderFactory;
import org.openbravo.erpCommon.utility.HttpsUtils;
import org.openbravo.erpCommon.utility.LeftTabsBar;
import org.openbravo.erpCommon.utility.NavigationBar;
import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.erpCommon.utility.ToolBar;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.ad.system.SystemInformation;
import org.openbravo.services.webservice.Module;
import org.openbravo.services.webservice.ModuleDependency;
import org.openbravo.services.webservice.SimpleModule;
import org.openbravo.services.webservice.WebServiceImpl;
import org.openbravo.services.webservice.WebServiceImplServiceLocator;
import org.openbravo.xmlEngine.XmlDocument;

/**
 * This servlet is in charge of showing the Module Manager Console which have three tabs: *Installed
 * modules *Add Modules *Installation history
 * 
 * 
 */
public class ModuleManagement extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  /**
   * Main method that controls the sent command
   */
  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException,
      ServletException {
    final VariablesSecureApp vars = new VariablesSecureApp(request);

    if (vars.commandIn("DEFAULT")) {
      printPageInstalled(response, vars);
    } else if (vars.commandIn("APPLY")) {
      printPageApply(response, vars);
    } else if (vars.commandIn("ADD")) {
      final String searchText = vars.getGlobalVariable("inpSearchText", "ModuleManagemetAdd|text",
          "");
      printPageAdd(request, response, vars, searchText, true);
    } else if (vars.commandIn("ADD_NOSEARCH")) {
      final String searchText = vars.getGlobalVariable("inpSearchText", "ModuleManagemetAdd|text",
          "");
      printPageAdd(request, response, vars, searchText, false);
    } else if (vars.commandIn("ADD_SEARCH")) {
      final String searchText = vars.getRequestGlobalVariable("inpSearchText",
          "ModuleManagemetAdd|text");
      printPageAdd(request, response, vars, searchText, true);
    } else if (vars.commandIn("HISTORY")) {
      final String strDateFrom = vars.getGlobalVariable("inpDateFrom", "ModuleManagement|DateFrom",
          "");
      final String strDateTo = vars.getGlobalVariable("inpDateTo", "ModuleManagement|DateTo", "");
      final String strUser = vars.getGlobalVariable("inpUser", "ModuleManagement|inpUser", "");
      printPageHistory(response, vars, strDateFrom, strDateTo, strUser);
    } else if (vars.commandIn("HISTORY_SEARCH")) {
      final String strDateFrom = vars.getRequestGlobalVariable("inpDateFrom",
          "ModuleManagement|DateFrom");
      final String strDateTo = vars
          .getRequestGlobalVariable("inpDateTo", "ModuleManagement|DateTo");
      final String strUser = vars.getRequestGlobalVariable("inpUser", "ModuleManagement|inpUser");
      printPageHistory(response, vars, strDateFrom, strDateTo, strUser);
    } else if (vars.commandIn("DETAIL")) {
      final String record = vars.getStringParameter("inpcRecordId");
      final boolean local = vars.getStringParameter("inpLocalInstall").equals("Y");
      printPageDetail(response, vars, record, local);
    } else if (vars.commandIn("INSTALL")) {
      final String record = vars.getStringParameter("inpcRecordId");
      printPageInstall1(response, request, vars, record, false, null, new String[0]);
    } else if (vars.commandIn("INSTALL2")) {
      printPageInstall2(response, vars);
    } else if (vars.commandIn("INSTALL3")) {
      printPageInstall3(response, vars);
    } else if (vars.commandIn("LICENSE")) {
      final String record = vars.getStringParameter("inpcRecordId");
      printLicenseAgreement(response, vars, record);
    } else if (vars.commandIn("LOCAL")) {
      printSearchFile(response, vars, null);
    } else if (vars.commandIn("INSTALLFILE")) {
      printPageInstallFile(response, request, vars);

    } else if (vars.commandIn("UNINSTALL")) {
      final String modules = vars.getInStringParameter("inpNodes", IsIDFilter.instance);
      final UninstallModule um = new UninstallModule(this, vars.getSessionValue("#sourcePath"),
          vars);
      um.execute(modules);
      final OBError msg = um.getOBError();
      vars.setMessage("ModuleManagement|message", msg);
      response.sendRedirect(strDireccion + request.getServletPath() + "?Command=DEFAULT");
      log4j.info(modules);
    } else if (vars.commandIn("SCAN")) {
      printScan(response, vars);
    } else if (vars.commandIn("UPDATE")) {
      final String updateModule = vars.getStringParameter("inpcUpdate");
      String[] modulesToUpdate;
      if (updateModule.equals("all")) {
        modulesToUpdate = getUpdateableModules();
      } else {
        modulesToUpdate = new String[1];
        modulesToUpdate[0] = updateModule;
      }
      printPageInstall1(response, request, vars, null, false, null, modulesToUpdate);
    } else
      pageError(response);
  }

  /**
   * Show the tab for installed modules, where it is possible to look for updates, uninstall and
   * apply changes-
   * 
   * @param response
   * @param vars
   * @throws IOException
   * @throws ServletException
   */
  private void printPageInstalled(HttpServletResponse response, VariablesSecureApp vars)
      throws IOException, ServletException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: Installed");
    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/ad_forms/ModuleManagementInstalled").createXmlDocument();
    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");

    // Interface parameters
    final ToolBar toolbar = new ToolBar(this, vars.getLanguage(), "ModuleManagement", false, "",
        "", "", false, "ad_forms", strReplaceWith, false, true);
    toolbar.prepareSimpleToolBarTemplate();
    xmlDocument.setParameter("toolbar", toolbar.toString());

    try {
      final WindowTabs tabs = new WindowTabs(this, vars,
          "org.openbravo.erpCommon.ad_forms.ModuleManagement");
      xmlDocument.setParameter("theme", vars.getTheme());
      final NavigationBar nav = new NavigationBar(this, vars.getLanguage(),
          "ModuleManagement.html", classInfo.id, classInfo.type, strReplaceWith, tabs.breadcrumb());
      xmlDocument.setParameter("navigationBar", nav.toString());
      final LeftTabsBar lBar = new LeftTabsBar(this, vars.getLanguage(), "ModuleManagement.html",
          strReplaceWith);
      xmlDocument.setParameter("leftTabs", lBar.manualTemplate());
    } catch (final Exception ex) {
      throw new ServletException(ex);
    }
    {
      final OBError myMessage = vars.getMessage("ModuleManagement|message");
      vars.removeMessage("ModuleManagement|message");
      if (myMessage != null) {
        xmlDocument.setParameter("messageType", myMessage.getType());
        xmlDocument.setParameter("messageTitle", myMessage.getTitle());
        xmlDocument.setParameter("messageMessage", myMessage.getMessage());
      }
    }
    // //----
    final ModuleTree tree = new ModuleTree(this);
    tree.setLanguage(vars.getLanguage());
    tree.showNotifications(true);
    tree.setNotifications(getNotificationsHTML(vars.getLanguage()));

    // Obtains a tree for the installed modules
    xmlDocument.setParameter("moduleTree", tree.toHtml());

    // Obtains a box for display the modules descriptions
    xmlDocument.setParameter("moduleTreeDescription", tree.descriptionToHtml());

    out.println(xmlDocument.print());
    out.close();
  }

  /**
   * Displays the pop-up to execute an ant task
   * 
   * @param response
   * @param vars
   * @throws IOException
   * @throws ServletException
   */
  private void printPageApply(HttpServletResponse response, VariablesSecureApp vars)
      throws IOException, ServletException {
    try {
      final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
          "org/openbravo/erpCommon/ad_forms/ApplyModule").createXmlDocument();
      final PrintWriter out = response.getWriter();
      response.setContentType("text/html; charset=UTF-8");
      out.println(xmlDocument.print());
      out.close();
    } catch (final Exception e) {
      e.printStackTrace();
    }
  }

  /**
   * Returns an HTML with the available notifications which can be: *Unapplied changes: rebuild
   * system *Available updates: install them
   * 
   * @param lang
   * @return
   */
  private String getNotificationsHTML(String lang) {
    String rt = "";
    try {
      // Check for rebuild system
      String total = ModuleManagementData.selectRebuild(this);
      if (!total.equals("0")) {
        rt = total
            + "&nbsp;"
            + Utility.messageBD(this, "ApplyModules", lang)
            + ", <a class=\"LabelLink_noicon\" href=\"#\" onclick=\"openServletNewWindow('DEFAULT', false, '../ad_process/ApplyModules.html', 'BUTTON', null, true, 650, 900);return false;\">"
            + Utility.messageBD(this, "RebuildNow", lang) + "</a>";
        return rt;
      }

      // Check for updates
      total = ModuleManagementData.selectUpdate(this);
      if (!total.equals("0")) {
        rt += total
            + "&nbsp;"
            + Utility.messageBD(this, "UpdateAvailable", lang)
            + "&nbsp;"
            + "<a class=\"LabelLink_noicon\" href=\"#\" onclick=\"installUpdate('all'); return false;\">"
            + Utility.messageBD(this, "InstallUpdatesNow", lang) + "</a>";
      }
    } catch (final Exception e) {
      e.printStackTrace();
    }
    return rt;
  }

  /**
   * Displays the second tab: Add modules where it is possible to search and install modules
   * remotely or locally
   * 
   * @param request
   * @param response
   * @param vars
   * @param searchText
   * @param displaySearch
   * @throws IOException
   * @throws ServletException
   */
  private void printPageAdd(HttpServletRequest request, HttpServletResponse response,
      VariablesSecureApp vars, String searchText, boolean displaySearch) throws IOException,
      ServletException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: Installed");
    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/ad_forms/ModuleManagementAdd").createXmlDocument();
    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    // Interface parameters
    final ToolBar toolbar = new ToolBar(this, vars.getLanguage(), "ModuleManagement", false, "",
        "", "", false, "ad_forms", strReplaceWith, false, true);
    toolbar.prepareSimpleToolBarTemplate();
    xmlDocument.setParameter("toolbar", toolbar.toString());

    try {
      final WindowTabs tabs = new WindowTabs(this, vars,
          "org.openbravo.erpCommon.ad_forms.ModuleManagement");
      xmlDocument.setParameter("theme", vars.getTheme());
      final NavigationBar nav = new NavigationBar(this, vars.getLanguage(),
          "ModuleManagement.html", classInfo.id, classInfo.type, strReplaceWith, tabs.breadcrumb());
      xmlDocument.setParameter("navigationBar", nav.toString());
      final LeftTabsBar lBar = new LeftTabsBar(this, vars.getLanguage(), "ModuleManagement.html",
          strReplaceWith);
      xmlDocument.setParameter("leftTabs", lBar.manualTemplate());
    } catch (final Exception ex) {
      throw new ServletException(ex);
    }
    {
      final OBError myMessage = vars.getMessage("ModuleManagement");
      vars.removeMessage("ModuleManagement");
      if (myMessage != null) {
        xmlDocument.setParameter("messageType", myMessage.getType());
        xmlDocument.setParameter("messageTitle", myMessage.getTitle());
        xmlDocument.setParameter("messageMessage", myMessage.getMessage());
      }
    }
    // //----

    xmlDocument.setParameter("inpSearchText", searchText);

    // In case the search results must be shown request and display them
    if (displaySearch)
      xmlDocument.setParameter("searchResults", getSearchResults(request, response, vars,
          searchText));

    out.println(xmlDocument.print());
    out.close();
  }

  /**
   * Displays the third tab "Installation History" with a log of all installation actions
   * 
   * @param response
   * @param vars
   * @param strDateFrom
   * @param strDateTo
   * @param strUser
   * @throws IOException
   * @throws ServletException
   */
  private void printPageHistory(HttpServletResponse response, VariablesSecureApp vars,
      String strDateFrom, String strDateTo, String strUser) throws IOException, ServletException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: Installed");
    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/ad_forms/ModuleManagementHistory").createXmlDocument();
    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    // Interface parameters
    final ToolBar toolbar = new ToolBar(this, vars.getLanguage(), "ModuleManagement", false, "",
        "", "", false, "ad_forms", strReplaceWith, false, true);
    toolbar.prepareSimpleToolBarTemplate();
    xmlDocument.setParameter("toolbar", toolbar.toString());

    try {
      final WindowTabs tabs = new WindowTabs(this, vars,
          "org.openbravo.erpCommon.ad_forms.ModuleManagement");
      xmlDocument.setParameter("theme", vars.getTheme());
      final NavigationBar nav = new NavigationBar(this, vars.getLanguage(),
          "ModuleManagement.html", classInfo.id, classInfo.type, strReplaceWith, tabs.breadcrumb());
      xmlDocument.setParameter("navigationBar", nav.toString());
      final LeftTabsBar lBar = new LeftTabsBar(this, vars.getLanguage(), "ModuleManagement.html",
          strReplaceWith);
      xmlDocument.setParameter("leftTabs", lBar.manualTemplate());
    } catch (final Exception ex) {
      throw new ServletException(ex);
    }

    xmlDocument.setParameter("dateFrom", strDateFrom);
    xmlDocument.setParameter("dateFromdisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateFromsaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateTo", strDateTo);
    xmlDocument.setParameter("dateTodisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));
    xmlDocument.setParameter("dateTosaveFormat", vars.getSessionValue("#AD_SqlDateFormat"));

    xmlDocument.setParameter("inpUser", strUser);
    try {
      ComboTableData comboTableData = new ComboTableData(vars, this, "18", "AD_User_ID", "110", "",
          Utility.getContext(this, vars, "#AccessibleOrgTree", "ModuleManagement"), Utility
              .getContext(this, vars, "#User_Client", "ModuleManagement"), 0);
      Utility.fillSQLParameters(this, vars, null, comboTableData, "ModuleManagement", strUser);
      xmlDocument.setData("reportUser", "liststructure", comboTableData.select(false));
      comboTableData = null;
    } catch (final Exception ex) {
      throw new ServletException(ex);
    }

    final ModuleManagementData data[] = ModuleManagementData.selectLog(this, vars.getLanguage(),
        strUser, strDateFrom, strDateTo);
    xmlDocument.setData("detail", data);

    out.println(xmlDocument.print());
    out.close();
  }

  /**
   * Shows the detail pop-up for a module
   * 
   * @param response
   * @param vars
   * @param recordId
   * @throws IOException
   * @throws ServletException
   */
  private void printPageDetail(HttpServletResponse response, VariablesSecureApp vars,
      String recordId, boolean local) throws IOException, ServletException {
    Module module = null;
    if (!local) {
      try {
        // retrieve the module details from the webservice
        final WebServiceImplServiceLocator loc = new WebServiceImplServiceLocator();
        final WebServiceImpl ws = loc.getWebService();
        module = ws.moduleDetail(recordId);
      } catch (final Exception e) {
        log4j.error(e);
        throw new ServletException(e);
      }
    } else {
      final ImportModule im = (ImportModule) vars.getSessionObject("InstallModule|ImportModule");
      module = im.getModule(recordId);
    }

    final ModuleDependency[] dependencies = module.getDependencies();
    final ModuleDependency[] includes = module.getIncludes();

    final String discard[] = { "", "" };
    if (includes == null || includes.length == 0)
      discard[0] = "includeDiscard";
    if (dependencies == null || dependencies.length == 0)
      discard[1] = "dependDiscard";

    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/ad_forms/ModuleManagementDetails", discard).createXmlDocument();
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("theme", vars.getTheme());
    xmlDocument.setParameter("key", recordId);
    xmlDocument.setParameter("type", (module.getType() == null ? "M" : module.getType())
        .equals("M") ? "Module" : module.getType().equals("T") ? "Template" : "Pack");
    xmlDocument.setParameter("moduleName", module.getName());
    xmlDocument.setParameter("moduleVersion", module.getVersionNo());
    xmlDocument.setParameter("description", module.getDescription());
    xmlDocument.setParameter("help", module.getHelp());
    xmlDocument.setParameter("author", module.getAuthor());
    String url = module.getUrl();
    if (url == null || url.equals("")) {
      xmlDocument.setParameter("urlDisplay", "none");
    } else {
      xmlDocument.setParameter("urlLink", url);
      xmlDocument.setParameter("url", url);
    }
    xmlDocument.setParameter("license", module.getLicenseType());

    if (dependencies != null && dependencies.length > 0)
      xmlDocument.setData("dependencies", FieldProviderFactory.getFieldProviderArray(dependencies));

    if (includes != null && includes.length > 0)
      xmlDocument.setData("includes", FieldProviderFactory.getFieldProviderArray(includes));

    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  /**
   * A decision needs to be made when executing this method/pop-up:
   * 
   * a. The file is not a .obx file -> Display the search file pop-up again, with an error
   * indicating the file must be a .obx file.
   * 
   * b. The file is an .obx file but no need to update -> Display the same pop-up again with a
   * warning indicating the module is already the most recent version.
   * 
   * b. The .obx file is okay -> redirect to the moduleInstall1 pop-up.
   * 
   * @param request
   * @param response
   * @throws IOException
   */
  private void printPageInstallFile(HttpServletResponse response, HttpServletRequest request,
      VariablesSecureApp vars) throws ServletException, IOException {
    final FileItem fi = vars.getMultiFile("inpFile");

    if (!fi.getName().toUpperCase().endsWith(".OBX")) {
      // We don't have a .obx file
      OBError message = new OBError();
      message.setType("Error");
      message.setTitle(Utility.messageBD(this, message.getType(), vars.getLanguage()));
      message.setMessage(Utility.messageBD(this, "MOD_OBX", vars.getLanguage()));

      printSearchFile(response, vars, message);

    } else {
      ImportModule im = new ImportModule(this, vars.getSessionValue("#sourcePath"), vars);
      try {
        if (im.isModuleUpdate(fi.getInputStream())) {
          vars.setSessionObject("ModuleManagementInstall|File", vars.getMultiFile("inpFile"));
          printPageInstall1(response, request, vars, null, true, fi.getInputStream(), new String[0]);
        } else {
          OBError message = im.getOBError(this);
          printSearchFile(response, vars, message);
        }
      } catch (Exception e) {
        log4j.error(e.getMessage(), e);
        throw new ServletException(e);
      }
    }
  }

  /**
   * Shows the first pop-up for the installation process, where it is displayed the modules to
   * install/update and an error message in case it is not possible to install the selected one or a
   * warning message in case the selected version is not installable but it is possible to install
   * another one.
   * 
   * @param response
   * @param vars
   * @param recordId
   * @param islocal
   * @param obx
   * @throws IOException
   * @throws ServletException
   */
  private void printPageInstall1(HttpServletResponse response, HttpServletRequest request,
      VariablesSecureApp vars, String recordId, boolean islocal, InputStream obx,
      String[] updateModules) throws IOException, ServletException {
    final String discard[] = { "", "", "", "", "", "" };
    Module module = null;

    // Remote installation is only allowed for heartbeat enabled instances
    if (!islocal && !isHeartbeatEnabled()) {
      response.sendRedirect(strDireccion + "/ad_forms/Heartbeat.html?Command=DEFAULT_MODULE");
    }

    if (!islocal && (updateModules == null || updateModules.length == 0)) {
      // if it is a remote installation get the module from webservice,
      // other case the obx file is passed as an InputStream
      try {
        final WebServiceImplServiceLocator loc = new WebServiceImplServiceLocator();
        final WebServiceImpl ws = loc.getWebService();
        module = ws.moduleDetail(recordId);
      } catch (final Exception e) {
        e.printStackTrace();
      }
    } else {
      discard[4] = "core";
    }

    Module[] inst = null;
    Module[] upd = null;
    OBError message = null;
    boolean found = false;
    boolean check;

    VersionUtility.setPool(this);

    // Craete a new ImportModule instance which will be used to check
    // depencecies and to process the installation
    final ImportModule im = new ImportModule(this, vars.getSessionValue("#sourcePath"), vars);
    im.setInstallLocal(islocal);
    try {
      // check the dependenies and obtain the modules to install/update
      if (!islocal) {
        final String[] installableModules = { module != null ? module.getModuleVersionID() : "" };
        check = im.checkDependenciesId(installableModules, updateModules);
      } else {
        check = im.checkDependenciesFile(obx);
      }

      // Check commercial modules can be installed

      if (check) { // dependencies are statisfied, show modules to install
        // installOrig includes also the module to install
        final Module[] installOrig = im.getModulesToInstall();

        // check commercial modules and show error page if not allowed to install
        if (!checkCommercialModules(im, response, vars)) {
          return;
        }

        if (installOrig == null || installOrig.length == 0)
          discard[0] = "modulesToinstall";
        else {
          if (!islocal && module != null) {
            inst = new Module[installOrig.length - 1]; // to remove
            // the module
            // itself
            // check if the version for the selected module is the
            // selected one
            int j = 0;
            for (int i = 0; i < installOrig.length; i++) {
              found = installOrig[i].getModuleID().equals(module.getModuleID());
              if (found && !module.getModuleVersionID().equals(installOrig[i].getModuleVersionID())) {

                message = new OBError();
                message.setType("Warning");
                message.setTitle(Utility.messageBD(this, message.getType(), vars.getLanguage()));
                message.setMessage(module.getName()
                    + " "
                    + module.getVersionNo()
                    + " "
                    + Utility.messageBD(this, "OtherModuleVersionToinstallOrigall", vars
                        .getLanguage()) + " " + installOrig[i].getVersionNo());
              }
              if (found) {
                module = installOrig[i];
              } else {
                inst[j] = installOrig[i];
                j++;
              }

            }
          } else {
            inst = installOrig;
          }
        }
        upd = im.getModulesToUpdate();
        // after all the checks, save the ImportModule object in session
        // to take it in next steps
        vars.setSessionObject("InstallModule|ImportModule", im);
      } else { // Dependencies not satisfied, do not show continue button
        message = im.getCheckError();
        discard[5] = "discardContinue";
      }
      if (upd == null || upd.length == 0)
        discard[1] = "updateModules";
      if (inst == null || inst.length == 0)
        discard[2] = "installModules";
      if ((upd == null || upd.length == 0) && (inst == null || inst.length == 0)
          && (module == null)) {
        discard[3] = "discardAdditional";
        discard[5] = "discardContinue";
      }
    } catch (final Exception e) {
      e.printStackTrace();
      message = new OBError();
      message.setType("Error");
      message.setTitle(Utility.messageBD(this, message.getType(), vars.getLanguage()));
      message.setMessage(e.toString());
    }

    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/ad_forms/ModuleManagement_InstallP1", discard).createXmlDocument();
    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("theme", vars.getTheme());
    if (inst != null && inst.length > 0)
      xmlDocument.setData("installs", FieldProviderFactory.getFieldProviderArray(inst));

    if (upd != null && upd.length > 0)
      xmlDocument.setData("updates", FieldProviderFactory.getFieldProviderArray(upd));

    xmlDocument.setParameter("inpLocalInstall", islocal ? "Y" : "N");

    if (!islocal && module != null) {
      xmlDocument.setParameter("key", recordId);
      xmlDocument.setParameter("moduleID", module.getModuleID());
      xmlDocument.setParameter("moduleName", module.getName());
      xmlDocument.setParameter("moduleVersion", module.getVersionNo());
      xmlDocument.setParameter("linkCore", module.getModuleVersionID());
    }
    {
      if (message != null) {
        xmlDocument.setParameter("messageType", message.getType());
        xmlDocument.setParameter("messageTitle", message.getTitle());
        xmlDocument.setParameter("messageMessage", message.getMessage());
      }
    }
    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  private boolean checkCommercialModules(ImportModule im, HttpServletResponse response,
      VariablesSecureApp vars) throws IOException {
    ActivationKey ak = new ActivationKey();
    boolean OBPSActiveInstance = ActivationKey.isActiveInstance();
    ArrayList<Module> notAllowedMods = new ArrayList<Module>();

    for (Module instMod : im.getModulesToInstall()) {
      if (instMod.getIsCommercial()
          && (!OBPSActiveInstance || !ak.isModuleSubscribed(instMod.getModuleID(), true))) {
        notAllowedMods.add(instMod);
      }
    }

    for (Module updMod : im.getModulesToUpdate()) {
      if (updMod.getIsCommercial()
          && (!OBPSActiveInstance || !ak.isModuleSubscribed(updMod.getModuleID(), true))) {
        notAllowedMods.add(updMod);
      }
    }

    if (notAllowedMods.size() > 0) {
      String discard[] = { "" };

      if (OBPSActiveInstance) {
        discard[0] = "CEInstance";
      } else {
        discard[0] = "OBPSInstance";
      }
      XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
          "org/openbravo/erpCommon/ad_forms/ModuleManagement_ErrorCommercial", discard)
          .createXmlDocument();
      xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
      xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
      xmlDocument.setParameter("theme", vars.getTheme());
      xmlDocument.setData("modules", FieldProviderFactory.getFieldProviderArray(notAllowedMods));
      response.setContentType("text/html; charset=UTF-8");
      final PrintWriter out = response.getWriter();
      out.println(xmlDocument.print());
      out.close();
    }
    return notAllowedMods.size() == 0;
  }

  private boolean isHeartbeatEnabled() {
    SystemInformation sys = OBDal.getInstance().get(SystemInformation.class, "0");
    return sys.isEnableHeartbeat() != null && sys.isEnableHeartbeat();
  }

  /**
   * Shows the second installation pup-up with all the license agreements for the modules to
   * install/update
   * 
   * @param response
   * @param vars
   * @throws IOException
   * @throws ServletException
   */
  private void printPageInstall2(HttpServletResponse response, VariablesSecureApp vars)
      throws IOException, ServletException {
    Module[] inst = null;
    Module[] selected;

    // Obtain the session object with the modules to install/update
    final ImportModule im = (ImportModule) vars.getSessionObject("InstallModule|ImportModule");
    final Module[] installOrig = im.getModulesToInstall();
    final Module[] upd = im.getModulesToUpdate();

    final String adModuleId = vars.getStringParameter("inpModuleID"); // selected
    // module
    // to
    // install
    final boolean islocal = im.getIsLocal();

    if (!islocal) {
      selected = new Module[1];
      inst = new Module[installOrig.length == 0 ? 0 : adModuleId.equals("") ? installOrig.length
          : installOrig.length - 1]; // to
      // remove
      // the
      // module
      // itself
      // check if the version for the selected module is the selected one
      int j = 0;
      for (int i = 0; i < installOrig.length; i++) {
        final boolean found = installOrig[i].getModuleID().equals(adModuleId);
        if (found) {
          selected[0] = installOrig[i];
        } else {
          inst[j] = installOrig[i];
          j++;
        }

      }
    } else {
      selected = installOrig;
    }

    final String discard[] = { "", "", "" };

    if (inst == null || inst.length == 0)
      discard[0] = "moduleIntallation";

    if (upd == null || upd.length == 0)
      discard[1] = "moduleUpdate";

    if (selected == null || selected.length == 0)
      discard[2] = "moduleSelected";

    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/ad_forms/ModuleManagement_InstallP2", discard).createXmlDocument();

    // Set positions to names in order to be able to use keyboard for
    // navigation in the box
    int position = 1;
    if (selected != null && selected.length > 0) {
      final FieldProvider[] fp = FieldProviderFactory.getFieldProviderArray(selected);
      for (int i = 0; i < fp.length; i++)
        FieldProviderFactory.setField(fp[i], "position", new Integer(position++).toString());
      xmlDocument.setData("selected", fp);
    }

    if (inst != null && inst.length > 0) {
      final FieldProvider[] fp = FieldProviderFactory.getFieldProviderArray(inst);
      for (int i = 0; i < fp.length; i++)
        FieldProviderFactory.setField(fp[i], "position", new Integer(position++).toString());
      xmlDocument.setData("installs", fp);
    }

    if (upd != null && upd.length > 0) {
      final FieldProvider[] fp = FieldProviderFactory.getFieldProviderArray(upd);
      for (int i = 0; i < fp.length; i++)
        FieldProviderFactory.setField(fp[i], "position", new Integer(position++).toString());
      xmlDocument.setData("updates", fp);
    }

    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("theme", vars.getTheme());
    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  /**
   * Shows the third pup-up for the installation process, in this popup the installation is executed
   * and afterwards a message is displayed with the success or fail information.
   * 
   * @param response
   * @param vars
   * @throws IOException
   * @throws ServletException
   */
  private void printPageInstall3(HttpServletResponse response, VariablesSecureApp vars)
      throws IOException, ServletException {
    final ImportModule im = (ImportModule) vars.getSessionObject("InstallModule|ImportModule");
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/ad_forms/ModuleManagement_InstallP4").createXmlDocument();
    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("theme", vars.getTheme());
    OBError message;
    if (im.getIsLocal())
      im.execute(((FileItem) vars.getSessionObject("ModuleManagementInstall|File"))
          .getInputStream());
    else
      im.execute();
    message = im.getOBError(this);

    {
      if (message != null) {
        xmlDocument.setParameter("messageType", message.getType());
        xmlDocument.setParameter("messageTitle", message.getTitle());
        xmlDocument.setParameter("messageMessage", message.getMessage());
      }
    }

    vars.removeSessionValue("ModuleManagementInstall|File");
    vars.removeSessionValue("InstallModule|ImportModule");

    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  /**
   * Executes a search query in the web service and returns a HTML with the list of modules
   * retrieved from the query. This list is HTML with styles.
   * 
   * @param request
   * @param response
   * @param vars
   * @param text
   * @return
   */
  private String getSearchResults(HttpServletRequest request, HttpServletResponse response,
      VariablesSecureApp vars, String text) {
    SimpleModule[] modules = null;
    SystemInformation info = OBDal.getInstance().get(SystemInformation.class, "0");
    try {
      if (info.isProxyRequired() && !info.getProxyServer().equals("") && info.getProxyPort() > 0) {
        if (!HttpsUtils.isInternetAvailable(info.getProxyServer(), info.getProxyPort().intValue())) {
          final OBError message = new OBError();
          message.setType("Error");
          message.setTitle(Utility.messageBD(this, "Error", vars.getLanguage()));
          message.setMessage(Utility.messageBD(this, "WSError", vars.getLanguage()));
          vars.setMessage("ModuleManagement", message);
          try {
            response
                .sendRedirect(strDireccion + request.getServletPath() + "?Command=ADD_NOSEARCH");
          } catch (final Exception ex) {
            ex.printStackTrace();
          }
        }
      }
      final WebServiceImplServiceLocator loc = new WebServiceImplServiceLocator();
      final WebServiceImpl ws = loc.getWebService();
      modules = ws.moduleSearch(text, getInstalledModules());

    } catch (final Exception e) {
      final OBError message = new OBError();
      message.setType("Error");
      message.setTitle(Utility.messageBD(this, "Error", vars.getLanguage()));
      message.setMessage(Utility.messageBD(this, "WSError", vars.getLanguage()));
      vars.setMessage("ModuleManagement", message);
      e.printStackTrace();
      try {
        response.sendRedirect(strDireccion + request.getServletPath() + "?Command=ADD_NOSEARCH");
      } catch (final Exception ex) {
        ex.printStackTrace();
      }
    }
    if (modules != null && modules.length > 0) {

      for (int i = 0; i < modules.length; i++) {
        String icon = modules[i].getType();
        icon = (icon == null ? "M" : icon).equals("M") ? "Module" : icon.equals("T") ? "Template"
            : "Pack";
        modules[i].setType(icon);

        // If there is no url, we need to hide the 'Visit Site' link and separator.
        String url = modules[i].getUrl();
        modules[i].setUrl(url == null || url.equals("") ? "HIDDEN" : url);
      }
    }
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/modules/ModuleBox").createXmlDocument();

    FieldProvider[] fieldProviders = FieldProviderFactory.getFieldProviderArray(modules);
    xmlDocument.setData("structureBox", fieldProviders);
    return xmlDocument.print();
  }

  /**
   * Returns String[] with the installed modules, this is used for perform the search in the
   * webservice and not to obtain in the list the already installed ones.
   * 
   * @return
   */
  private String[] getInstalledModules() {
    try {
      final ModuleManagementData data[] = ModuleManagementData.selectInstalled(this);
      if (data != null && data.length != 0) {
        final String[] rt = new String[data.length];
        for (int i = 0; i < data.length; i++)
          rt[i] = data[i].adModuleId;
        return rt;
      } else
        return new String[0];
    } catch (final Exception e) {
      e.printStackTrace();
      return (new String[0]);
    }
  }

  private String[] getUpdateableModules() {
    try {
      final ModuleManagementData data[] = ModuleManagementData.selectUpdateable(this);
      if (data != null && data.length != 0) {
        final String[] rt = new String[data.length];
        for (int i = 0; i < data.length; i++)
          rt[i] = data[i].adModuleVersionId;
        return rt;
      } else
        return new String[0];
    } catch (final Exception e) {
      e.printStackTrace();
      return (new String[0]);
    }
  }

  /**
   * This ajax call displays the license agreement for a module.
   * 
   * @param response
   * @param vars
   * @param record
   * @throws IOException
   * @throws ServletException
   */
  private void printLicenseAgreement(HttpServletResponse response, VariablesSecureApp vars,
      String record) throws IOException, ServletException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: ajaxreponse");

    response.setContentType("text/plain; charset=UTF-8");
    response.setHeader("Cache-Control", "no-cache");
    final PrintWriter out = response.getWriter();
    final ImportModule im = (ImportModule) vars.getSessionObject("InstallModule|ImportModule");
    final Module[] inst = im.getModulesToInstall();
    final Module[] upd = im.getModulesToUpdate();

    int i = 0;
    boolean found = false;
    String agreement = "";
    while (!found && inst != null && i < inst.length) {
      if (found = inst[i].getModuleID().equals(record))
        agreement = inst[i].getLicenseAgreement();
      i++;
    }
    i = 0;
    while (!found && upd != null && i < upd.length) {
      if (found = upd[i].getModuleID().equals(record))
        agreement = upd[i].getLicenseAgreement();
      i++;
    }

    out.println(agreement);
    out.close();

  }

  /**
   * Displays the pop-up for the search locally file in order to look for an obx file and to install
   * it locally.
   * 
   * @param response
   * @param vars
   * @throws IOException
   * @throws ServletException
   */
  private void printSearchFile(HttpServletResponse response, VariablesSecureApp vars,
      OBError message) throws IOException, ServletException {
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/ad_forms/ModuleManagement_InstallLocal").createXmlDocument();
    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("theme", vars.getTheme());

    if (message != null) {
      xmlDocument.setParameter("messageType", message.getType());
      xmlDocument.setParameter("messageTitle", message.getTitle());
      xmlDocument.setParameter("messageMessage", message.getMessage());
    }

    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  private void printScan(HttpServletResponse response, VariablesSecureApp vars) throws IOException,
      ServletException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: ajaxreponse");

    final HashMap<String, String> updates = ImportModule.scanForUpdates(this, vars);
    String up = "";
    for (final String node : updates.keySet())
      up += node + "," + updates.get(node) + "|";

    String notifications = getNotificationsHTML(vars.getLanguage());
    if (notifications.equals(""))
      notifications = Utility.messageBD(this, "NoUpdatesAvailable", vars.getLanguage());
    up = notifications + "|" + up + "|";
    response.setContentType("text/plain; charset=UTF-8");
    response.setHeader("Cache-Control", "no-cache");
    final PrintWriter out = response.getWriter();
    out.println(up);
    out.close();
  }

}
