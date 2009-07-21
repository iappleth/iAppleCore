/*
 ************************************************************************************
 * Copyright (C) 2001-2009 Openbravo S.L.
 * Licensed under the Apache Software License version 2.0
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to  in writing,  software  distributed
 * under the License is distributed  on  an  "AS IS"  BASIS,  WITHOUT  WARRANTIES  OR
 * CONDITIONS OF ANY KIND, either  express  or  implied.  See  the  License  for  the
 * specific language governing permissions and limitations under the License.
 ************************************************************************************
 */
package org.openbravo.base.secureApp;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Properties;
import java.util.UUID;

import javax.servlet.RequestDispatcher;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JRExporterParameter;
import net.sf.jasperreports.engine.JRParameter;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.export.JExcelApiExporter;
import net.sf.jasperreports.engine.export.JExcelApiExporterParameter;
import net.sf.jasperreports.engine.export.JRHtmlExporter;
import net.sf.jasperreports.engine.export.JRHtmlExporterParameter;

import org.openbravo.authentication.AuthenticationException;
import org.openbravo.authentication.AuthenticationManager;
import org.openbravo.authentication.basic.DefaultAuthenticationManager;
import org.openbravo.base.HttpBaseServlet;
import org.openbravo.base.exception.OBException;
import org.openbravo.dal.core.OBContext;
import org.openbravo.data.FieldProvider;
import org.openbravo.erpCommon.security.SessionLogin;
import org.openbravo.erpCommon.utility.JRFieldProviderDataSource;
import org.openbravo.erpCommon.utility.JRFormatFactory;
import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.erpCommon.utility.PrintJRData;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.utils.FileUtility;
import org.openbravo.utils.Replace;
import org.openbravo.xmlEngine.XmlDocument;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

public class HttpSecureAppServlet extends HttpBaseServlet {
  private static final long serialVersionUID = 1L;
  protected boolean boolHist = true;
  // String myTheme = "";
  protected ClassInfoData classInfo;
  private AuthenticationManager m_AuthManager = null;

  private String servletClass = this.getClass().getName();

  private class Variables extends VariablesHistory {
    public Variables(HttpServletRequest request) {
      super(request);
    }

    public void updateHistory(HttpServletRequest request) {
      if (boolHist) {
        String sufix = getCurrentHistoryIndex();
        if (!(servletClass.equals(getSessionValue("reqHistory.servlet" + sufix, "")))) {
          upCurrentHistoryIndex();
          sufix = getCurrentHistoryIndex();
          setSessionValue("reqHistory.servlet" + sufix, servletClass);
          setSessionValue("reqHistory.path" + sufix, request.getServletPath());
          setSessionValue("reqHistory.command" + sufix, "DEFAULT");
        }
      }
    }

    public void setHistoryCommand(String strCommand) {
      final String sufix = getCurrentHistoryIndex();
      setSessionValue("reqHistory.command" + sufix, strCommand);
    }
  }

  @Override
  public void init(ServletConfig config) {
    super.init(config);

    // Authentication manager load
    // String sAuthManagerClass =
    // config.getServletContext().getInitParameter("AuthenticationManager");
    String sAuthManagerClass = globalParameters.getOBProperty("authentication.class");
    if (sAuthManagerClass == null || sAuthManagerClass.equals("")) {
      // If not defined, load default
      sAuthManagerClass = "org.openbravo.authentication.basic.DefaultAuthenticationManager";
    }

    try {
      m_AuthManager = (AuthenticationManager) Class.forName(sAuthManagerClass).newInstance();
    } catch (final Exception e) {
      log4j.error("Authentication manager not defined", e);
      m_AuthManager = new DefaultAuthenticationManager();
    }

    try {
      m_AuthManager.init(this);
    } catch (final AuthenticationException e) {
      log4j.error("Unable to initialize authentication manager", e);
    }

    if (log4j.isDebugEnabled())
      log4j.debug("strdireccion: " + strDireccion);

    // Calculate class info
    try {
      if (log4j.isDebugEnabled())
        log4j.debug("Servlet request for class info: " + this.getClass());
      ClassInfoData[] classInfoAux = ClassInfoData.select(this, this.getClass().getName());
      if (classInfoAux != null && classInfoAux.length > 0)
        classInfo = classInfoAux[0];
      else {
        classInfoAux = ClassInfoData.set();
        classInfo = classInfoAux[0];
      }
    } catch (final Exception ex) {
      log4j.error(ex);
      ClassInfoData[] classInfoAux;
      try {
        classInfoAux = ClassInfoData.set();
        classInfo = classInfoAux[0];
      } catch (ServletException e) {
        log4j.error(e);
      }
    }
  }

  @Override
  public void service(HttpServletRequest request, HttpServletResponse response) throws IOException,
      ServletException {
    final Variables variables = new Variables(request);
    // VariablesSecureApp vars = new VariablesSecureApp(request);

    // bdErrorGeneral(response, "Error", "No access");

    if (log4j.isDebugEnabled())
      log4j.debug("class info type: " + classInfo.type + " - ID: " + classInfo.id);
    String strAjax = "";
    String strHidden = "";
    String strPopUp = "";
    try {
      strAjax = request.getParameter("IsAjaxCall");
    } catch (final Exception ignored) {
    }
    try {
      strHidden = request.getParameter("IsHiddenCall");
    } catch (final Exception ignored) {
    }
    try {
      strPopUp = request.getParameter("IsPopUpCall");
    } catch (final Exception ignored) {
    }

    try {
      final String strUserAuth = m_AuthManager.authenticate(request, response);
      if (strUserAuth != null) {
        if (variables.getRole().equals("")
            || !SeguridadData.loggedOK(this, variables.getDBSession())) {
          String strLanguage = "";
          String strIsRTL = "";
          String strRole = "";
          String strClient = "";
          String strOrg = "";
          String strWarehouse = "";

          strRole = DefaultOptionsData.defaultRole(this, strUserAuth);
          if (strRole == null)
            strRole = DefaultOptionsData.getDefaultRole(this, strUserAuth);
          validateDefault(strRole, strUserAuth, "Role");

          strOrg = DefaultOptionsData.defaultOrg(this, strUserAuth);
          if (strOrg == null)
            strOrg = DefaultOptionsData.getDefaultOrg(this, strRole);
          validateDefault(strOrg, strRole, "Org");

          strClient = DefaultOptionsData.defaultClient(this, strUserAuth);
          if (strClient == null)
            strClient = DefaultOptionsData.getDefaultClient(this, strRole);
          validateDefault(strClient, strRole, "Client");

          strWarehouse = DefaultOptionsData.defaultWarehouse(this, strUserAuth);
          if (strWarehouse == null) {
            if (!strRole.equals("0")) {
              OBContext.setAdminContext();
              try {
                strWarehouse = DefaultOptionsData.getDefaultWarehouse(this, strClient, new OrgTree(
                    this, strClient).getAccessibleTree(this, strRole).toString());

              } finally {
                OBContext.setOBContext((OBContext) null);
              }
            } else
              strWarehouse = "";
          }

          DefaultOptionsData dataLanguage[] = DefaultOptionsData.defaultLanguage(this, strUserAuth);
          if (dataLanguage != null && dataLanguage.length > 0) {
            strLanguage = dataLanguage[0].getField("DEFAULT_AD_LANGUAGE");
            strIsRTL = dataLanguage[0].getField("ISRTL");
          }
          if (strLanguage == null || strLanguage.equals("")) {
            dataLanguage = DefaultOptionsData.getDefaultLanguage(this);
            if (dataLanguage != null && dataLanguage.length > 0) {
              strLanguage = dataLanguage[0].getField("AD_LANGUAGE");
              strIsRTL = dataLanguage[0].getField("ISRTL");
            }
          }

          final VariablesSecureApp vars = new VariablesSecureApp(request);
          if (LoginUtils.fillSessionArguments(this, vars, strUserAuth, strLanguage, strIsRTL,
              strRole, strClient, strOrg, strWarehouse)) {
            readProperties(vars, globalParameters.getOpenbravoPropertiesPath());
            readNumberFormat(vars, globalParameters.getFormatPath());
            saveLoginBD(request, vars, strClient, strOrg);
          } else {
            // Re-login
            log4j.error("Unable to fill session Arguments for: " + strUserAuth);
            logout(request, response);
            return;
          }
        } else
          variables.updateHistory(request);
      }
      if (log4j.isDebugEnabled()) {
        log4j.debug("Call to HttpBaseServlet.service");
      }
    } catch (final DefaultValidationException d) {
      // Added DefaultValidationException class to catch user login
      // without a valid role
      final OBError roleError = new OBError();
      roleError.setTitle("Invalid " + d.getDefaultField());
      roleError.setType("Error");
      roleError.setMessage("No valid " + d.getDefaultField()
          + " identified. Please contact your system administrator for access.");
      invalidLogin(request, response, roleError);

      return;
    } catch (final Exception e) {
      // Re-login
      log4j.error("HTTPSecureAppServlet.service() - exception caught: ", e);
      logout(request, response);
      return;
    }

    try {

      super.initialize(request, response);
      final VariablesSecureApp vars1 = new VariablesSecureApp(request, false);
      if (vars1.getRole().equals("") || hasAccess(vars1)) {
        // Autosave logic
        final Boolean saveRequest = (Boolean) request.getAttribute("autosave");
        final String strTabId = vars1.getStringParameter("inpTabId");

        if (saveRequest == null && strTabId != null) {

          final String autoSave = request.getParameter("autosave");
          Boolean failedAutosave = (Boolean) vars1.getSessionObject(strTabId + "|failedAutosave");

          if (failedAutosave == null) {
            failedAutosave = false;
          }

          if (autoSave != null && autoSave.equalsIgnoreCase("Y") && !failedAutosave) {

            if (log4j.isDebugEnabled()) {
              log4j.debug("service: saveRequest - " + this.getClass().getCanonicalName()
                  + " - autosave: " + autoSave);
            }

            if (log4j.isDebugEnabled()) {
              log4j.debug(this.getClass().getCanonicalName() + " - hash: "
                  + vars1.getPostDataHash());
            }

            final String servletMappingName = request.getParameter("mappingName");

            if (servletMappingName != null
                && !Utility.isExcludedFromAutoSave(this.getClass().getCanonicalName())
                && !vars1.commandIn("DIRECT")) {

              final String hash = vars1.getSessionValue(servletMappingName + "|hash");

              if (log4j.isDebugEnabled()) {
                log4j.debug("hash in session: " + hash);
              }
              // Check if the form was previously saved based on
              // the hash of the post data
              if (!hash.equals(vars1.getPostDataHash())) {
                request.setAttribute("autosave", true);
                if (vars1.getCommand().indexOf("BUTTON") != -1)
                  request.setAttribute("popupWindow", true);
                // forward request
                if (!forwardRequest(request, response)) {
                  return; // failed save
                }
              }
            }
          }
        }
        super.serviceInitialized(request, response);
      } else {
        if ((strPopUp != null && !strPopUp.equals("")) || (classInfo.type.equals("S")))
          bdErrorGeneralPopUp(request, response, Utility.messageBD(this, "Error", variables
              .getLanguage()), Utility
              .messageBD(this, "AccessTableNoView", variables.getLanguage()));
        else
          bdError(request, response, "AccessTableNoView", vars1.getLanguage());
      }
    } catch (final ServletException ex) {
      log4j.error("Error captured: ", ex);
      final VariablesSecureApp vars1 = new VariablesSecureApp(request, false);
      final OBError myError = Utility.translateError(this, vars1, variables.getLanguage(), ex
          .getMessage());
      if (strAjax != null && !strAjax.equals(""))
        bdErrorAjax(response, myError.getType(), myError.getTitle(), myError.getMessage());
      else if (strHidden != null && !strHidden.equals(""))
        bdErrorHidden(response, myError.getType(), myError.getTitle(), myError.getMessage());
      else if (!myError.isConnectionAvailable())
        bdErrorConnection(response);
      else if (strPopUp != null && !strPopUp.equals(""))
        bdErrorGeneralPopUp(request, response, myError.getTitle(), myError.getMessage());
      else
        bdErrorGeneral(request, response, myError.getTitle(), myError.getMessage());
    } catch (final OBException e) {
      final Boolean isAutosaving = (Boolean) request.getAttribute("autosave");
      if (isAutosaving) {
        request.removeAttribute("autosave");
        request.removeAttribute("popupWindow");
        throw e;
      } else {
        log4j.error("Error captured: ", e);
        if (strPopUp != null && !strPopUp.equals(""))
          bdErrorGeneralPopUp(request, response, "Error", e.toString());
        else
          bdErrorGeneral(request, response, "Error", e.toString());
      }
    } catch (final Exception e) {
      log4j.error("Error captured: ", e);
      if (strPopUp != null && !strPopUp.equals(""))
        bdErrorGeneralPopUp(request, response, "Error", e.toString());
      else
        bdErrorGeneral(request, response, "Error", e.toString());
    }
  }

  /**
   * Cheks access passing all the parameters
   * 
   * @param vars
   * @param type
   *          type of element
   * @param id
   *          id for the element
   * @return true in case it has access false if not
   */
  protected boolean hasGeneralAccess(VariablesSecureApp vars, String type, String id) {
    try {
      final String accessLevel = SeguridadData.selectAccessLevel(this, type, id);
      vars.setSessionValue("#CurrentAccessLevel", accessLevel);
      if (type.equals("W")) {
        return hasLevelAccess(vars, accessLevel)
            && SeguridadData.selectAccess(this, vars.getRole(), "TABLE", id).equals("0")
            && !SeguridadData.selectAccess(this, vars.getRole(), type, id).equals("0");
      } else if (type.equals("S")) {
        return !SeguridadData.selectAccessSearch(this, vars.getRole(), id).equals("0");
      } else if (type.equals("C"))
        return true;
      else
        return hasLevelAccess(vars, accessLevel)
            && !SeguridadData.selectAccess(this, vars.getRole(), type, id).equals("0");
    } catch (final Exception e) {
      log4j.error("Error checking access: ", e);
      return false;
    }

  }

  /**
   * Checks if the user has access to the window
   * */
  private boolean hasAccess(VariablesSecureApp vars) {
    try {
      if (classInfo == null || classInfo.id.equals("") || classInfo.type.equals(""))
        return true;
      return hasGeneralAccess(vars, classInfo.type, classInfo.id);

    } catch (final Exception e) {
      log4j.error("Error checking access: ", e);
      return false;
    }
  }

  /**
   * Checks if the level access is correct.
   * 
   */
  private boolean hasLevelAccess(VariablesSecureApp vars, String accessLevel) {
    final String userLevel = vars.getSessionValue("#User_Level");

    boolean retValue = true;

    if (accessLevel.equals("4") && userLevel.indexOf("S") == -1)
      retValue = false;
    else if (accessLevel.equals("1") && userLevel.indexOf("O") == -1)
      retValue = false;
    else if (accessLevel.equals("3")
        && (!(userLevel.indexOf("C") != -1 || userLevel.indexOf("O") != -1)))
      retValue = false;
    else if (accessLevel.equals("6")
        && (!(userLevel.indexOf("S") != -1 || userLevel.indexOf("C") != -1)))
      retValue = false;

    return retValue;
  }

  /**
   * Validates if a selected default value is null or empty String
   * 
   * @param strValue
   * @param strKey
   * @param strError
   * @throws Exeption
   * */
  private void validateDefault(String strValue, String strKey, String strError) throws Exception {
    if (strValue == null || strValue.equals(""))
      throw new DefaultValidationException("Unable to read default " + strError + " for:" + strKey,
          strError);
  }

  protected void logout(HttpServletRequest request, HttpServletResponse response)
      throws IOException, ServletException {
    final VariablesSecureApp vars = new VariablesSecureApp(request);

    final String user = vars.getUser();
    final String dbSession = vars.getDBSession();

    vars.clearSession(true);
    if (log4j.isDebugEnabled())
      log4j.debug("Clearing session");
    if (!dbSession.equals(""))
      SeguridadData.saveProcessed(this, user, dbSession);

    m_AuthManager.logout(request, response);
  }

  /**
   * Logs the user out of the application, clears the session and returns the HTMLErrorLogin page
   * with the relevant error message passed into the method.
   * 
   * @param request
   * @param response
   * @param error
   * @throws IOException
   * @throws ServletException
   */
  private void invalidLogin(HttpServletRequest request, HttpServletResponse response, OBError error)
      throws IOException, ServletException {
    final VariablesSecureApp vars = new VariablesSecureApp(request);

    vars.clearSession(true);
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/base/secureApp/HtmlErrorLogin").createXmlDocument();

    xmlDocument.setParameter("messageType", error.getType());
    xmlDocument.setParameter("messageTitle", error.getTitle());
    xmlDocument.setParameter("messageMessage", error.getMessage());

    response.setContentType("text/html");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();

  }

  protected void setHistoryCommand(HttpServletRequest request, String strCommand) {
    final Variables vars = new Variables(request);
    vars.setHistoryCommand(strCommand);
  }

  private void advise(HttpServletResponse response, String strTipo, String strTitulo,
      String strTexto) throws IOException {
    advise(null, response, strTipo, strTitulo, strTexto);
  }

  protected void advise(HttpServletRequest request, HttpServletResponse response, String strTipo,
      String strTitulo, String strTexto) throws IOException {

    String myTheme;
    if (request != null)
      myTheme = new Variables(request).getSessionValue("#Theme");
    else
      myTheme = "Default";

    final XmlDocument xmlDocument = xmlEngine
        .readXmlTemplate("org/openbravo/base/secureApp/Advise").createXmlDocument();

    xmlDocument.setParameter("theme", myTheme);
    xmlDocument.setParameter("ParamTipo", strTipo.toUpperCase());
    xmlDocument.setParameter("ParamTitulo", strTitulo);
    xmlDocument.setParameter("ParamTexto", strTexto);
    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  protected void advisePopUp(HttpServletRequest request, HttpServletResponse response,
      String strTitulo, String strTexto) throws IOException {
    advisePopUp(request, response, "Error", strTitulo, strTexto);
  }

  protected void advisePopUp(HttpServletRequest request, HttpServletResponse response,
      String strTipo, String strTitulo, String strTexto) throws IOException {
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/base/secureApp/AdvisePopUp").createXmlDocument();

    String myTheme;
    if (request != null)
      myTheme = new Variables(request).getSessionValue("#Theme");
    else
      myTheme = "Default";
    xmlDocument.setParameter("theme", myTheme);
    xmlDocument.setParameter("ParamTipo", strTipo.toUpperCase());
    xmlDocument.setParameter("ParamTitulo", strTitulo);
    xmlDocument.setParameter("ParamTexto", strTexto);
    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  /**
   * Creates a pop up that when closed, will refresh the parent window.
   * 
   * @param response
   *          the HttpServletResponse object
   * @param strTitle
   *          the title of the popup window
   * @param strText
   *          the text to be displayed in the popup message area
   * @throws IOException
   *           if an error occurs writing to the output stream
   */
  private void advisePopUpRefresh(HttpServletRequest request, HttpServletResponse response,
      String strTitle, String strText) throws IOException {
    advisePopUpRefresh(request, response, "Error", strTitle, strText);
  }

  private void advisePopUpRefresh(HttpServletResponse response, String strTitle, String strText)
      throws IOException {
    advisePopUpRefresh(null, response, "Error", strTitle, strText);
  }

  private void advisePopUpRefresh(HttpServletResponse response, String strType, String strTitle,
      String strText) throws IOException {
    advisePopUpRefresh(null, response, strTitle, strText);
  }

  /**
   * Creates a pop up that when closed, will refresh the parent window.
   * 
   * @param response
   *          the HttpServletResponse object
   * @param strType
   *          the type of message to be displayed (e.g. ERROR, SUCCESS)
   * @param strTitle
   *          the title of the popup window
   * @param strText
   *          the text to be displayed in the popup message area
   * @throws IOException
   *           if an error occurs writing to the output stream
   */
  protected void advisePopUpRefresh(HttpServletRequest request, HttpServletResponse response,
      String strType, String strTitle, String strText) throws IOException {
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/base/secureApp/AdvisePopUpRefresh").createXmlDocument();

    String myTheme;
    if (request != null)
      myTheme = new Variables(request).getSessionValue("#Theme");
    else
      myTheme = "Default";

    xmlDocument.setParameter("theme", myTheme);
    xmlDocument.setParameter("ParamType", strType.toUpperCase());
    xmlDocument.setParameter("ParamTitle", strTitle);
    xmlDocument.setParameter("ParamText", strText);
    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  private void bdError(HttpServletResponse response, String strCode, String strLanguage)
      throws IOException {
    bdError(null, response, strCode, strLanguage);
  }

  protected void bdError(HttpServletRequest request, HttpServletResponse response, String strCode,
      String strLanguage) throws IOException {
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/base/secureApp/Error")
        .createXmlDocument();

    String myTheme;
    if (request != null)
      myTheme = new Variables(request).getSessionValue("#Theme");
    else
      myTheme = "Default";

    xmlDocument.setParameter("theme", myTheme);
    xmlDocument.setParameter("ParamTitulo", strCode);
    xmlDocument.setParameter("ParamTexto", Utility.messageBD(this, strCode, strLanguage));
    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  private void bdErrorGeneralPopUp(HttpServletResponse response, String strTitle, String strText)
      throws IOException {
    bdErrorGeneralPopUp(null, response, strTitle, strText);
  }

  protected void bdErrorGeneralPopUp(HttpServletRequest request, HttpServletResponse response,
      String strTitle, String strText) throws IOException {
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/base/secureApp/ErrorPopUp").createXmlDocument();

    String myTheme;
    if (request != null)
      myTheme = new Variables(request).getSessionValue("#Theme");
    else
      myTheme = "Default";

    xmlDocument.setParameter("theme", myTheme);
    xmlDocument.setParameter("ParamTipo", "ERROR");
    xmlDocument.setParameter("ParamTitulo", strTitle);
    xmlDocument.setParameter("ParamTexto", strText);
    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  private void bdErrorGeneral(HttpServletResponse response, String strTitle, String strText)
      throws IOException {
    bdErrorGeneral(null, response, strTitle, strText);
  }

  private void bdErrorGeneral(HttpServletRequest request, HttpServletResponse response,
      String strTitle, String strText) throws IOException {
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate("org/openbravo/base/secureApp/Error")
        .createXmlDocument();

    String myTheme;
    if (request != null)
      myTheme = new Variables(request).getSessionValue("#Theme");
    else
      myTheme = "Default";

    xmlDocument.setParameter("theme", myTheme);
    xmlDocument.setParameter("ParamTitulo", strTitle);
    xmlDocument.setParameter("ParamTexto", strText);

    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  protected void bdErrorConnection(HttpServletResponse response) throws IOException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: Error connection");
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/base/secureApp/ErrorConnection").createXmlDocument();

    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  protected void bdErrorAjax(HttpServletResponse response, String strType, String strTitle,
      String strText) throws IOException {
    response.setContentType("text/xml; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println("<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\n");
    out.println("<xml-structure>\n");
    out.println("  <status>\n");
    out.println("    <type>" + strType + "</type>\n");
    out.println("    <title>" + strTitle + "</title>\n");
    out.println("    <description><![CDATA[" + strText + "]]></description>\n");
    out.println("  </status>\n");
    out.println("</xml-structure>\n");
    out.close();
  }

  protected void bdErrorHidden(HttpServletResponse response, String strType, String strTitle,
      String strText) throws IOException {
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/ad_callouts/CallOut").createXmlDocument();

    final StringBuffer resultado = new StringBuffer();
    resultado.append("var calloutName='';\n\n");
    resultado.append("var respuesta = new Array(\n");

    resultado.append("new Array(\"MESSAGE\", \"");
    resultado.append(strText);
    resultado.append("\")");
    resultado.append("\n);");

    xmlDocument.setParameter("array", resultado.toString());
    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  protected void pageError(HttpServletResponse response) throws IOException {
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/base/secureApp/HtmlError").createXmlDocument();

    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  protected void pageErrorPopUp(HttpServletResponse response) throws IOException {
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/base/secureApp/HtmlErrorPopUp").createXmlDocument();

    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  protected void whitePage(HttpServletResponse response) throws IOException {
    whitePage(response, "");
  }

  protected void whitePage(HttpServletResponse response, String strAlert) throws IOException {
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/base/secureApp/HtmlWhitePage").createXmlDocument();
    if (strAlert == null)
      strAlert = "";
    xmlDocument.setParameter("body", strAlert);

    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  protected void printPageClosePopUp(HttpServletResponse response, VariablesSecureApp vars,
      String path) throws IOException, ServletException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: PopUp Response");
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/base/secureApp/PopUp_Response").createXmlDocument();
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("href", path.equals("") ? "null" : "'" + path + "'");
    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  protected void printPageClosePopUp(HttpServletResponse response, VariablesSecureApp vars)
      throws IOException, ServletException {
    printPageClosePopUp(response, vars, "");
  }

  private void printPageClosePopUpWindow(HttpServletResponse response, VariablesSecureApp vars)
      throws IOException, ServletException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: PopUp Response");
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/base/secureApp/PopUp_Close").createXmlDocument();
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  protected void printPagePopUpDownload(ServletOutputStream os, String fileName)
      throws IOException, ServletException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: PopUp Download");
    String href = strDireccion + "/utility/DownloadReport.html?report=" + fileName;
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/base/secureApp/PopUp_Download").createXmlDocument();
    xmlDocument.setParameter("href", href);
    os.println(xmlDocument.print());
    os.close();
  }

  private void printPageClosePopUpAndRefresh(HttpServletResponse response, VariablesSecureApp vars)
      throws IOException, ServletException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: PopUp Response");
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/base/secureApp/PopUp_Close_Refresh").createXmlDocument();
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  protected void printPageClosePopUpAndRefreshParent(HttpServletResponse response,
      VariablesSecureApp vars) throws IOException, ServletException {
    if (log4j.isDebugEnabled())
      log4j.debug("Output: PopUp Response");
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/base/secureApp/PopUp_Close_And_Refresh").createXmlDocument();
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  protected void pageErrorCallOut(HttpServletResponse response) throws IOException {
    final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/base/secureApp/HtmlErrorCallOut").createXmlDocument();

    response.setContentType("text/html; charset=UTF-8");
    final PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  protected void readProperties(VariablesSecureApp vars, String strFileProperties) {
    // Read properties file.
    final Properties properties = new Properties();
    try {
      log4j.info("strFileProperties: " + strFileProperties);
      properties.load(new FileInputStream(strFileProperties));
      final String javaDateFormat = properties.getProperty("dateFormat.java");
      log4j.info("javaDateFormat: " + javaDateFormat);
      vars.setSessionValue("#AD_JavaDateFormat", javaDateFormat);
      final String javaDateTimeFormat = properties.getProperty("dateTimeFormat.java");
      log4j.info("javaDateTimeFormat: " + javaDateTimeFormat);
      vars.setSessionValue("#AD_JavaDateTimeFormat", javaDateTimeFormat);
      final String jsDateFormat = properties.getProperty("dateFormat.js");
      log4j.info("jsDateFormat: " + jsDateFormat);
      vars.setSessionValue("#AD_JsDateFormat", jsDateFormat);
      final String sqlDateFormat = properties.getProperty("dateFormat.sql");
      log4j.info("sqlDateFormat: " + sqlDateFormat);
      vars.setSessionValue("#AD_SqlDateFormat", sqlDateFormat);
      final String pentahoServer = properties.getProperty("pentahoServer");
      log4j.info("pentahoServer: " + pentahoServer);
      vars.setSessionValue("#pentahoServer", pentahoServer);
      final String sourcePath = properties.getProperty("source.path");
      log4j.info("sourcePath: " + sourcePath);
      vars.setSessionValue("#sourcePath", sourcePath);
    } catch (final IOException e) {
      // catch possible io errors from readLine()
      log4j.error("Error reading properties", e);
    }
  }

  protected void readNumberFormat(VariablesSecureApp vars, String strFormatFile) {
    final String strNumberFormat = "###,##0.00"; // Default number format
    String strGroupingSeparator = ","; // Default grouping separator
    String strDecimalSeparator = "."; // Default decimal separator
    final String strName = "euroInform"; // Name of the format to use
    try {
      // Reading number format configuration
      final DocumentBuilderFactory docBuilderFactory = DocumentBuilderFactory.newInstance();
      final DocumentBuilder docBuilder = docBuilderFactory.newDocumentBuilder();
      final Document doc = docBuilder.parse(new File(strFormatFile));
      doc.getDocumentElement().normalize();
      final NodeList listOfNumbers = doc.getElementsByTagName("Number");
      final int totalNumbers = listOfNumbers.getLength();
      for (int s = 0; s < totalNumbers; s++) {
        final Node NumberNode = listOfNumbers.item(s);
        if (NumberNode.getNodeType() == Node.ELEMENT_NODE) {
          final Element NumberElement = (Element) NumberNode;
          final String strNumberName = NumberElement.getAttributes().getNamedItem("name")
              .getNodeValue();
          // store in session all the formats
          vars.setSessionValue("#FormatOutput|" + strNumberName, NumberElement.getAttributes()
              .getNamedItem("formatOutput").getNodeValue());
          vars.setSessionValue("#DecimalSeparator|" + strNumberName, NumberElement.getAttributes()
              .getNamedItem("decimal").getNodeValue());
          vars.setSessionValue("#GroupSeparator|" + strNumberName, NumberElement.getAttributes()
              .getNamedItem("grouping").getNodeValue());
          if (strNumberName.equals(strName)) {
            strDecimalSeparator = NumberElement.getAttributes().getNamedItem("decimal")
                .getNodeValue();
            strGroupingSeparator = NumberElement.getAttributes().getNamedItem("grouping")
                .getNodeValue();
          }
        }
      }
    } catch (final Exception e) {
      log4j.error("error reading number format", e);
    }
    vars.setSessionValue("#AD_ReportNumberFormat", strNumberFormat);
    vars.setSessionValue("#AD_ReportGroupingSeparator", strGroupingSeparator);
    vars.setSessionValue("#AD_ReportDecimalSeparator", strDecimalSeparator);
  }

  private void saveLoginBD(HttpServletRequest request, VariablesSecureApp vars, String strCliente,
      String strOrganizacion) throws ServletException {
    final SessionLogin sl = new SessionLogin(request, strCliente, strOrganizacion, vars
        .getSessionValue("#AD_User_ID"));
    sl.save(this);
    vars.setSessionValue("#AD_Session_ID", sl.getSessionID());
  }

  protected void renderJR(VariablesSecureApp variables, HttpServletResponse response,
      String strReportName, String strOutputType, HashMap<String, Object> designParameters,
      FieldProvider[] data, Map<Object, Object> exportParameters) throws ServletException {

    if (strReportName == null || strReportName.equals(""))
      strReportName = PrintJRData.getReportName(this, classInfo.id);

    final String strAttach = globalParameters.strFTPDirectory + "/284-" + classInfo.id;

    final String strLanguage = variables.getLanguage();
    final Locale locLocale = new Locale(strLanguage.substring(0, 2), strLanguage.substring(3, 5));

    final String strBaseDesign = getBaseDesignPath(strLanguage);

    strReportName = Replace.replace(Replace.replace(strReportName, "@basedesign@", strBaseDesign),
        "@attach@", strAttach);
    final String strFileName = strReportName.substring(strReportName.lastIndexOf("/") + 1);

    ServletOutputStream os = null;
    UUID reportId = null;
    try {

      final JasperReport jasperReport = Utility.getTranslatedJasperReport(this, strReportName,
          strLanguage, strBaseDesign);
      if (designParameters == null)
        designParameters = new HashMap<String, Object>();

      Boolean pagination = true;
      if (strOutputType.equals("pdf"))
        pagination = false;

      designParameters.put("IS_IGNORE_PAGINATION", pagination);
      designParameters.put("BASE_WEB", strReplaceWithFull);
      designParameters.put("BASE_DESIGN", strBaseDesign);
      designParameters.put("ATTACH", strAttach);
      designParameters.put("USER_CLIENT", Utility.getContext(this, variables, "#User_Client", ""));
      designParameters.put("USER_ORG", Utility.getContext(this, variables, "#User_Org", ""));
      designParameters.put("LANGUAGE", strLanguage);
      designParameters.put("LOCALE", locLocale);
      designParameters.put("REPORT_TITLE", PrintJRData.getReportTitle(this,
          variables.getLanguage(), classInfo.id));

      final DecimalFormatSymbols dfs = new DecimalFormatSymbols();
      dfs.setDecimalSeparator(variables.getSessionValue("#AD_ReportDecimalSeparator").charAt(0));
      dfs.setGroupingSeparator(variables.getSessionValue("#AD_ReportGroupingSeparator").charAt(0));
      final DecimalFormat numberFormat = new DecimalFormat(variables
          .getSessionValue("#AD_ReportNumberFormat"), dfs);
      designParameters.put("NUMBERFORMAT", numberFormat);

      if (log4j.isDebugEnabled())
        log4j.debug("creating the format factory: " + variables.getJavaDateFormat());
      final JRFormatFactory jrFormatFactory = new JRFormatFactory();
      jrFormatFactory.setDatePattern(variables.getJavaDateFormat());
      designParameters.put(JRParameter.REPORT_FORMAT_FACTORY, jrFormatFactory);

      JasperPrint jasperPrint;
      Connection con = null;
      try {
        con = getTransactionConnection();
        if (data != null) {
          designParameters.put("REPORT_CONNECTION", con);
          jasperPrint = JasperFillManager.fillReport(jasperReport, designParameters,
              new JRFieldProviderDataSource(data, variables.getJavaDateFormat()));
        } else {
          jasperPrint = JasperFillManager.fillReport(jasperReport, designParameters, con);
        }
      } catch (final Exception e) {
        throw new ServletException(e.getMessage(), e);
      } finally {
        releaseRollbackConnection(con);
      }

      os = response.getOutputStream();
      if (exportParameters == null)
        exportParameters = new HashMap<Object, Object>();
      if (strOutputType == null || strOutputType.equals(""))
        strOutputType = "html";
      if (strOutputType.equals("html")) {
        if (log4j.isDebugEnabled())
          log4j.debug("JR: Print HTML");
        response.setHeader("Content-disposition", "inline" + "; filename=" + strFileName + "."
            + strOutputType);
        final JRHtmlExporter exporter = new JRHtmlExporter();
        exportParameters.put(JRHtmlExporterParameter.JASPER_PRINT, jasperPrint);
        exportParameters.put(JRHtmlExporterParameter.IS_USING_IMAGES_TO_ALIGN, Boolean.FALSE);
        exportParameters.put(JRHtmlExporterParameter.SIZE_UNIT,
            JRHtmlExporterParameter.SIZE_UNIT_POINT);
        exportParameters.put(JRHtmlExporterParameter.OUTPUT_STREAM, os);
        exporter.setParameters(exportParameters);
        exporter.exportReport();
      } else if (strOutputType.equals("pdf") || strOutputType.equalsIgnoreCase("xls")) {
        reportId = UUID.randomUUID();
        saveReport(variables, jasperPrint, exportParameters, strFileName + "-" + (reportId) + "."
            + strOutputType);
        response.setContentType("text/html;charset=UTF-8");
        response.setHeader("Content-disposition", "inline" + "; filename=" + strFileName + "-"
            + (reportId) + ".html");
        printPagePopUpDownload(response.getOutputStream(), strFileName + "-" + (reportId) + "."
            + strOutputType);
      } else {
        throw new ServletException("Output format no supported");
      }
    } catch (final JRException e) {
      log4j.error("JR: Error: ", e);
      throw new ServletException(e.getMessage(), e);
    } catch (IOException ioe) {
      try {
        FileUtility f = new FileUtility(globalParameters.strFTPDirectory, strFileName + "-"
            + (reportId) + "." + strOutputType, false, true);
        if (f.exists())
          f.deleteFile();
      } catch (IOException ioex) {
        log4j.error("Error trying to delete temporary report file " + strFileName + "-"
            + (reportId) + "." + strOutputType + " : " + ioex.getMessage());
      }
    } catch (final Exception e) {
      throw new ServletException(e.getMessage(), e);
    } finally {
      try {
        os.close();
      } catch (final Exception e) {
      }
    }
  }

  /**
   * Saves the report on the attachments folder for future retrieval
   * 
   * @param vars
   *          An instance of VariablesSecureApp that contains the request parameters
   * @param jp
   *          An instance of JasperPrint of the loaded JRXML template
   * @param exportParameters
   *          A Map with all the parameters passed to all reports
   * @param fileName
   *          The file name for the report
   * @throws JRException
   */
  private void saveReport(VariablesSecureApp vars, JasperPrint jp,
      Map<Object, Object> exportParameters, String fileName) throws JRException {
    final String outputFile = globalParameters.strFTPDirectory + "/" + fileName;
    final String reportType = fileName.substring(fileName.lastIndexOf(".") + 1);
    if (reportType.equalsIgnoreCase("pdf")) {
      JasperExportManager.exportReportToPdfFile(jp, outputFile);
    } else if (reportType.equalsIgnoreCase("xls")) {
      JExcelApiExporter exporter = new JExcelApiExporter();
      exportParameters.put(JRExporterParameter.JASPER_PRINT, jp);
      exportParameters.put(JRExporterParameter.OUTPUT_FILE_NAME, outputFile);
      exportParameters.put(JExcelApiExporterParameter.IS_ONE_PAGE_PER_SHEET, Boolean.FALSE);
      exportParameters.put(JExcelApiExporterParameter.IS_REMOVE_EMPTY_SPACE_BETWEEN_ROWS,
          Boolean.TRUE);
      exportParameters.put(JExcelApiExporterParameter.IS_DETECT_CELL_TYPE, true);
      exporter.setParameters(exportParameters);
      exporter.exportReport();
    } else {
      throw new JRException("Report type not supported");
    }

  }

  /**
   * Forwards request to the referrer servlet to perform operations like "auto-save" Note: The
   * referrer servlet should have a hidden input field with mappingName (e.g.
   * /PurchaOrder/Header_Edition.html) to be able to get a RequestDispatcher
   * 
   * @param request
   * @param response
   * @throws IOException
   * @throws ServletException
   */
  private boolean forwardRequest(HttpServletRequest request, HttpServletResponse response)
      throws IOException, ServletException {
    final String forwardTo = request.getParameter("mappingName");
    final String autoSave = request.getParameter("autosave");
    final String commandType = request.getParameter("inpCommandType");
    final Boolean popupWindow = request.getAttribute("popupWindow") != null ? (Boolean) request
        .getAttribute("popupWindow") : false;

    // Forwarding request to save the modified record
    if (autoSave != null && autoSave.equalsIgnoreCase("Y")) {
      if (forwardTo != null && !forwardTo.equals("")) {
        final RequestDispatcher rd = getServletContext().getRequestDispatcher(forwardTo);
        if (rd != null) {
          final long time = System.currentTimeMillis();
          try {
            if (log4j.isDebugEnabled())
              log4j.debug("forward request to: " + forwardTo);
            rd.include(request, response);
            if (log4j.isDebugEnabled())
              log4j.debug("Request forward took: "
                  + String.valueOf(System.currentTimeMillis() - time) + " ms");
          } catch (final OBException e) {

            request.removeAttribute("autosave");
            request.removeAttribute("popupWindow");

            final VariablesSecureApp vars = new VariablesSecureApp(request);
            final String strTabId = vars.getStringParameter("inpTabId");
            vars.setSessionObject(strTabId + "|failedAutosave", true);

            if (!popupWindow) {
              vars.setSessionValue(strTabId + "|requestURL", request.getRequestURL().toString());
              response.sendRedirect(strDireccion + forwardTo + "?Command="
                  + (commandType != null ? commandType : "NEW"));
            } else { // close pop-up
              printPageClosePopUpAndRefresh(response, vars);
            }
            return false;
          }
        }
      }
    }
    request.removeAttribute("autosave");
    request.removeAttribute("popupWindow");
    return true;
  }

  @Override
  public String getServletInfo() {
    return "This servlet add some functions (autentication, privileges, application menu, ...) over HttpBaseServlet";
  }
}
