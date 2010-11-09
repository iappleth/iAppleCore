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
 * The Initial Developer of the Original Code is Openbravo SLU 
 * All portions are Copyright (C) 2001-2010 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.erpCommon.security;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.openbravo.base.HttpBaseServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.businessUtility.Preferences;
import org.openbravo.erpCommon.utility.OBVersion;
import org.openbravo.erpCommon.utility.PropertyException;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.ad.system.Client;
import org.openbravo.xmlEngine.XmlDocument;

public class Login extends HttpBaseServlet {
  private static final long serialVersionUID = 1L;

  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException,
      ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);

    if (vars.commandIn("LOGIN")) {
      log4j.debug("Command: Login");
      String strTheme = vars.getTheme();
      vars.clearSession(false);

      OBContext.setAdminMode();
      try {
        Client systemClient = OBDal.getInstance().get(Client.class, "0");
        String cacheMsg = Utility.messageBD(this, "OUTDATED_FILES_CACHED", systemClient
            .getLanguage().getLanguage());
        String browserMsg = Utility.messageBD(this, "BROWSER_NOT_SUPPORTED", systemClient
            .getLanguage().getLanguage());
        String orHigherMsg = Utility.messageBD(this, "OR_HIGHER_TEXT", systemClient.getLanguage()
            .getLanguage());

        if (OBVersion.getInstance().is30()) {
          printPageLogin30(response, strTheme, cacheMsg, browserMsg, orHigherMsg);
        } else {
          printPageLogin250(response, strTheme, cacheMsg, browserMsg, orHigherMsg);
        }
      } finally {
        OBContext.restorePreviousMode();
      }

    } else if (vars.commandIn("BLANK")) {
      printPageBlank(response, vars);
    } else if (vars.commandIn("CHECK")) {
      String checkString = "success";
      response.setContentType("text/plain; charset=UTF-8");
      response.setHeader("Cache-Control", "no-cache");
      PrintWriter out = response.getWriter();
      out.print(checkString);
      out.close();
    } else if (vars.commandIn("WELCOME")) {
      log4j.debug("Command: Welcome");
      if (OBVersion.getInstance().is30()) {
        printPageBlank(response, vars);
      } else {
        String strTheme = vars.getTheme();
        printPageWelcome(response, strTheme);
      }
    } else if (vars.commandIn("LOGO")) {
      printPageLogo(response, vars);
    } else {
      // Look for forced login URL property and redirect in case it is set and the login is accessed
      // through a different URL
      try {
        String forcedLoginUrl = Preferences.getPreferenceValue("ForcedLoginURL", true, null, null,
            null, null, null);
        log4j.debug("Forced URL: " + forcedLoginUrl);
        if (forcedLoginUrl != null && !forcedLoginUrl.isEmpty()
            && !request.getRequestURL().toString().startsWith(forcedLoginUrl)) {
          log4j.info("Redireting login from " + request.getRequestURL().toString()
              + " to forced login URL " + forcedLoginUrl);
          response.sendRedirect(forcedLoginUrl);
          return;
        }
      } catch (PropertyException e) {
        // Ignore and continue with the standard login. PropertyException is raised in case property
        // is not defined (standard case) or in case of conflict.
        log4j.debug("Exception getting ForcedLoginURL", e);
      }

      // Standard login
      String textDirection = vars.getSessionValue("#TextDirection", "LTR");
      printPageFrameIdentificacion(response, "Login_Welcome.html?Command=WELCOME",
          "Login_F1.html?Command=LOGIN", textDirection);
    }
  }

  private void printPageFrameIdentificacion(HttpServletResponse response, String strMenu,
      String strDetalle, String textDirection) throws IOException, ServletException {

    XmlDocument xmlDocument;
    if (textDirection.equals("RTL")) {
      xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/security/Login_FS_RTL")
          .createXmlDocument();
      xmlDocument.setParameter("frameMenu", strMenu);
      xmlDocument.setParameter("frameMenuLoading", strDetalle);
      xmlDocument.setParameter("frame1", strMenu);
    } else {
      xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/security/Login_FS")
          .createXmlDocument();
      xmlDocument.setParameter("frameMenu", strMenu);
      xmlDocument.setParameter("frameMenuLoading", strMenu);
      xmlDocument.setParameter("frame1", strDetalle);
    }

    String jsConstants = "\nvar isMenuHide = false; \n var isRTL = " + "RTL".equals(textDirection)
        + "; \n var menuWidth = '25%';\n var isMenuBlock = false;\n";

    xmlDocument.setParameter("jsConstants", jsConstants);
    xmlDocument.setParameter("framesetMenu", "25");
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  private void printPageBlank(HttpServletResponse response, VariablesSecureApp vars)
      throws IOException, ServletException {
    XmlDocument xmlDocument = xmlEngine
        .readXmlTemplate("org/openbravo/erpCommon/security/Login_F0").createXmlDocument();

    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  private void printPageWelcome(HttpServletResponse response, String strTheme) throws IOException,
      ServletException {
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/security/Login_Welcome").createXmlDocument();

    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("theme", strTheme);

    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  private void printPageLogo(HttpServletResponse response, VariablesSecureApp vars)
      throws IOException, ServletException {
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/security/Login_Logo").createXmlDocument();

    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("theme", vars.getTheme());

    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  /**
   * Shows 2.50 login page
   */
  private void printPageLogin250(HttpServletResponse response, String strTheme, String cacheMsg,
      String browserMsg, String orHigherMsg) throws IOException, ServletException {
    XmlDocument xmlDocument = xmlEngine
        .readXmlTemplate("org/openbravo/erpCommon/security/Login_F1").createXmlDocument();

    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("theme", strTheme);
    xmlDocument.setParameter("itService", SessionLoginData.selectSupportContact(this));

    String cacheMsgFinal = (cacheMsg != null && !cacheMsg.equals("")) ? cacheMsg
        : "Your browser's cache has outdated files. Please clean it and reload the page.";
    cacheMsgFinal = "var cacheMsg = \"" + cacheMsgFinal + "\"";
    xmlDocument.setParameter("cacheMsg", cacheMsgFinal.replaceAll("\\n", "\n"));

    String orHigherMsgFinal = (orHigherMsg != null && !orHigherMsg.equals("")) ? orHigherMsg
        : "or higher";

    String browserMsgFinal = (browserMsg != null && !browserMsg.equals("")) ? browserMsg
        : "Your browser is not officially supported.\n\nYou can continue at your own risk or access the application with one of the supported browsers:";

    browserMsgFinal = browserMsgFinal + "\\n * Mozilla Firefox 3.0 " + orHigherMsgFinal
        + "\\n * Microsoft Internet Explorer 7.0 " + orHigherMsgFinal;
    browserMsgFinal = "var browserMsg = \"" + browserMsgFinal + "\"";
    xmlDocument.setParameter("browserMsg", browserMsgFinal.replaceAll("\\n", "\n"));

    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  /**
   * Shows 3.0 login page
   */
  private void printPageLogin30(HttpServletResponse response, String strTheme, String cacheMsg,
      String browserMsg, String orHigherMsg) throws IOException, ServletException {
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/erpCommon/security/Login")
        .createXmlDocument();

    String windowTitle = "TestBravo";
    String windowFavicon = "http://www.noticias3d.com/favicon.ico";
    String showYourCompanyLogo = "true";
    String showYourITServiceLogo = "true";
    String showForgeLogo = "true";

    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("theme", strTheme);
    xmlDocument.setParameter("visualPrefs", "var windowTitle = '" + windowTitle
        + "', windowFavicon = '" + windowFavicon + "', showYourCompanyLogo = "
        + showYourCompanyLogo + ", showYourITServiceLogo = " + showYourITServiceLogo
        + ", showForgeLogo = " + showForgeLogo + ";");
    xmlDocument.setParameter("itServiceUrl", "var itServiceUrl = '"
        + SessionLoginData.selectSupportContact(this) + "'");

    String cacheMsgFinal = (cacheMsg != null && !cacheMsg.equals("")) ? cacheMsg
        : "Your browser's cache has outdated files. Please clean it and reload the page.";
    cacheMsgFinal = "var cacheMsg = \"" + cacheMsgFinal + "\"";
    xmlDocument.setParameter("cacheMsg", cacheMsgFinal.replaceAll("\\n", "\n"));

    String orHigherMsgFinal = (orHigherMsg != null && !orHigherMsg.equals("")) ? orHigherMsg
        : "or higher";

    String browserMsgFinal = (browserMsg != null && !browserMsg.equals("")) ? browserMsg
        : "Your browser is not officially supported.\n\nYou can continue at your own risk or access the application with one of the supported browsers:";

    browserMsgFinal = browserMsgFinal + "\\n * Mozilla Firefox 3.0 " + orHigherMsgFinal
        + "\\n * Microsoft Internet Explorer 7.0 " + orHigherMsgFinal;
    browserMsgFinal = "var browserMsg = \"" + browserMsgFinal + "\"";
    xmlDocument.setParameter("browserMsg", browserMsgFinal.replaceAll("\\n", "\n"));

    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  private void goToRetry(HttpServletResponse res) throws IOException {
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/base/secureApp/HtmlErrorLogin").createXmlDocument();

    res.setContentType("text/html");
    PrintWriter out = res.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  // public void printPageOptions(HttpServletResponse response,
  // VariablesSecureApp vars) throws IOException, ServletException {
  // XmlDocument xmlDocument =
  // xmlEngine.readXmlTemplate("org/openbravo/erpCommon/security/Login_Options_F1").createXmlDocument
  // ();
  //    
  // RoleComboData[] data = RoleComboData.select(this, vars.getUser());
  // if (data==null || data.length==0) {
  // goToRetry(response);
  // return;
  // }
  // xmlDocument.setParameter("language", "defaultLang=\"" +
  // vars.getLanguage() + "\";");
  // ClientData[] clients = null;
  // {
  // ClientData[] data1 = ClientData.select(this);
  // if (data1==null || data1.length==0) {
  // bdError(response, "NoClientLogin", vars.getLanguage());
  // return;
  // } else {
  // Vector<Object> vecClients = new Vector<Object>();
  // for (int i=0;i<data.length;i++) {
  // StringTokenizer st = new StringTokenizer(data[i].clientlist, ",", false);
  //    
  // while (st.hasMoreTokens()) {
  // String token = st.nextToken().trim();
  // ClientData auxClient = new ClientData();
  // auxClient.padre = data[i].adRoleId;
  // auxClient.id = token;
  // auxClient.name = getDescriptionFromArray(data1, token);
  // vecClients.addElement(auxClient);
  // }
  // }
  // clients = new ClientData[vecClients.size()];
  // vecClients.copyInto(clients);
  // }
  // xmlDocument.setParameter("clientes", arrayDobleEntrada("arrClientes",
  // clients));
  // }
  // {
  // OrganizationData[] data1 = OrganizationData.select(this);
  // if (data1==null || data1.length==0) {
  // bdError(response, "NoOrgLogin", vars.getLanguage());
  // return;
  // }
  // xmlDocument.setParameter("organizaciones", arrayDobleEntrada("arrOrgs",
  // data1));
  // }
  // xmlDocument.setParameter("warehouses", arrayDobleEntrada("arrWare",
  // WarehouseData.select(this)));
  // xmlDocument.setData("structureRol", data);
  // ClientComboData[] clientCombo = null;
  // {
  // Vector<Object> vecClientCombo = new Vector<Object>();
  // for (int i=0;i<clients.length;i++) {
  // if (clients[i].padre.equals(data[0].adRoleId)) {
  // ClientComboData auxCombo = new ClientComboData();
  // auxCombo.adClientId = clients[i].id;
  // auxCombo.name = clients[i].name;
  // vecClientCombo.addElement(auxCombo);
  // }
  // }
  // clientCombo = new ClientComboData[vecClientCombo.size()];
  // vecClientCombo.copyInto(clientCombo);
  // }
  // xmlDocument.setData("structureCliente", clientCombo);
  // xmlDocument.setData("structureOrganizacion",
  // OrganizationComboData.select(this, data[0].adRoleId));
  // xmlDocument.setData("structureAlmacen", WarehouseComboData.select(this,
  // data[0].adRoleId, data[0].adClientId));
  //
  // response.setContentType("text/html; charset=UTF-8");
  // PrintWriter out = response.getWriter();
  // out.println(xmlDocument.print());
  // out.close();
  // }

  private void bdError(HttpServletResponse response, String strCode, String strLanguage)
      throws IOException {
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/base/secureApp/Error")
        .createXmlDocument();

    xmlDocument.setParameter("ParamTitulo", strCode);
    xmlDocument.setParameter("ParamTexto", Utility.messageBD(this, strCode, strLanguage));
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  public String getServletInfo() {
    return "Login servlet";
  }
}
