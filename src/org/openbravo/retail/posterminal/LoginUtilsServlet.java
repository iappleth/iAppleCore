/*
 ************************************************************************************
 * Copyright (C) 2012-2018 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.lang.StringEscapeUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.criterion.Restrictions;
import org.hibernate.query.Query;
import org.openbravo.authentication.AuthenticationException;
import org.openbravo.authentication.AuthenticationManager;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.client.kernel.RequestContext;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.database.ConnectionProvider;
import org.openbravo.erpCommon.businessUtility.Preferences;
import org.openbravo.erpCommon.businessUtility.Preferences.QueryFilter;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.erpCommon.utility.PropertyException;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.mobile.core.MobileServerDefinition;
import org.openbravo.mobile.core.MobileServerOrganization;
import org.openbravo.mobile.core.login.MobileCoreLoginUtilsServlet;
import org.openbravo.mobile.core.servercontroller.MobileServerUtils;
import org.openbravo.model.ad.access.FormAccess;
import org.openbravo.model.ad.access.User;
import org.openbravo.model.ad.access.UserRoles;
import org.openbravo.model.ad.system.Client;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.retail.posterminal.utility.OBPOSPrintTemplateReader;
import org.openbravo.service.db.DalConnectionProvider;

public class LoginUtilsServlet extends MobileCoreLoginUtilsServlet {
  public static final Logger log = LogManager.getLogger();
  private static final long serialVersionUID = 1L;

  private String[] getClientOrgIds(String terminalName) {
    final String hqlOrg = "select terminal.organization.client.id, terminal.organization.id "
        + "from OBPOS_Applications terminal " + "where terminal.searchKey = :theTerminalSearchKey";
    Query<Object[]> qryOrg = OBDal.getInstance().getSession().createQuery(hqlOrg, Object[].class);
    qryOrg.setParameter("theTerminalSearchKey", terminalName);
    qryOrg.setMaxResults(1);

    String strClient = "none";
    String strOrg = "none";

    if (qryOrg.uniqueResult() != null) {
      final Object[] orgResult = qryOrg.uniqueResult();
      strClient = orgResult[0].toString();
      strOrg = orgResult[1].toString();
    }

    final String result[] = { strClient, strOrg };
    return result;
  }

  private boolean hasADFormAccess(UserRoles userRole) {
    for (FormAccess form : userRole.getRole().getADFormAccessList()) {
      if (form.getSpecialForm().getId().equals(POSUtils.WEB_POS_FORM_ID)) {
        return true;
      }
    }
    return false;
  }

  @Override
  protected JSONObject getCompanyLogo(HttpServletRequest request) throws JSONException {
    JSONObject result = new JSONObject();
    final String terminalName = request.getParameter("terminalName");
    String clientId = getClientOrgIds(terminalName)[0];
    if ("none".equals(clientId)) {
      clientId = "0";
    }

    result.put("logoUrl", getClientLogoData(clientId));
    return result;
  }

  @Override
  protected JSONObject getUserImages(HttpServletRequest request) throws JSONException {
    JSONObject result = new JSONObject();
    JSONArray data = new JSONArray();
    JSONArray approvalType = new JSONArray();
    final String terminalName = request.getParameter("terminalName");
    if (request.getParameter("approvalType") != null) {
      approvalType = new JSONArray(request.getParameter("approvalType"));
    }

    OBCriteria<OBPOSApplications> terminalCriteria = OBDal.getInstance().createCriteria(
        OBPOSApplications.class);
    terminalCriteria.add(Restrictions.eq(OBPOSApplications.PROPERTY_SEARCHKEY, terminalName));
    terminalCriteria.setFilterOnReadableOrganization(false);
    terminalCriteria.setFilterOnReadableClients(false);

    List<OBPOSApplications> terminalList = terminalCriteria.list();
    if (terminalList.size() != 0) {
      OBPOSApplications terminalObj = terminalList.get(0);

      List<String> naturalTreeOrgList = new ArrayList<String>(OBContext.getOBContext()
          .getOrganizationStructureProvider(terminalObj.getClient().getId())
          .getNaturalTree(terminalObj.getOrganization().getId()));

      String extraFilter = "";
      if (!doFilterUserOnlyByTerminalAccessPreference()) {
        extraFilter = "not exists(from OBPOS_TerminalAccess ta where ta.userContact = user) or ";
      }

      String hqlUser = "select distinct user.name, user.username, user.id "
          + "from ADUser user, ADUserRoles userRoles, ADRole role, "
          + "ADFormAccess formAccess, OBPOS_Applications terminal "
          + "where user.active = true and "
          + "userRoles.active = true and "
          + "role.active = true and "
          + "formAccess.active = true and "
          + "user.username is not null and "
          + "user.password is not null and "
          + "exists (from ADRoleOrganization ro where ro.role = role and ro.organization = terminal.organization) and "
          + "("
          + extraFilter
          + "exists(from OBPOS_TerminalAccess ta where ta.userContact = user and ta.pOSTerminal=terminal)) and "
          + "terminal.searchKey = :theTerminalSearchKey and "
          + "user.id = userRoles.userContact.id and userRoles.role.id = role.id and "
          + "userRoles.role.id = formAccess.role.id and "
          + "userRoles.role.forPortalUsers = false and "
          + "formAccess.specialForm.id = :webPOSFormId and "
          + "((user.organization.id in (:orgList)) or (terminal.organization.id in (:orgList)))";

      Map<String, String> iterParameter = new HashMap<>();
      if (approvalType.length() != 0) {
        // checking supervisor users for sent approval type
        for (int i = 0; i < approvalType.length(); i++) {
          hqlUser += "and exists (from ADPreference as p where property =  :iter" + i
              + " and active = true and to_char(searchKey) = 'Y'"
              + "   and (userContact = user or exists (from ADUserRoles r"
              + "                  where r.role = p.visibleAtRole"
              + "                    and r.userContact = user)) "
              + "   and (p.visibleAtOrganization = terminal.organization "
              + "   or p.visibleAtOrganization.id in (:orgList) "
              + "   or p.visibleAtOrganization is null)) ";
          iterParameter.put("iter" + i, approvalType.getString(i));
        }
      }

      hqlUser += "order by user.name";
      Query<Object[]> qryUser = OBDal.getInstance().getSession()
          .createQuery(hqlUser, Object[].class);
      qryUser.setParameter("theTerminalSearchKey", terminalName);
      qryUser.setParameter("webPOSFormId", "B7B7675269CD4D44B628A2C6CF01244F");
      qryUser.setParameterList("orgList", naturalTreeOrgList);
      qryUser.setProperties(iterParameter);

      for (Object[] qryUserObjectItem : qryUser.list()) {
        JSONObject item = new JSONObject();
        item.put("name", qryUserObjectItem[0]);
        item.put("userName", qryUserObjectItem[1]);
        item.put("userId", qryUserObjectItem[2]);

        // Get the image for the current user
        String hqlImage = "select image.mimetype, image.bindaryData "
            + "from ADImage image, ADUser user "
            + "where user.image = image.id and user.id = :theUserId";
        Query<Object[]> qryImage = OBDal.getInstance().getSession()
            .createQuery(hqlImage, Object[].class);
        qryImage.setParameter("theUserId", qryUserObjectItem[2].toString());
        String imageData = "none";

        for (Object[] qryImageObjectItem : qryImage.list()) {
          imageData = "data:"
              + qryImageObjectItem[0].toString()
              + ";base64,"
              + org.apache.commons.codec.binary.Base64
                  .encodeBase64String((byte[]) qryImageObjectItem[1]);
        }
        item.put("image", imageData);

        data.put(item);
      }
    }
    result.put("data", data);
    return result;
  }

  public static boolean doFilterUserOnlyByTerminalAccessPreference() {
    try {
      OBContext.setAdminMode(false);
      final String value = Preferences.getPreferenceValue(
          "OBPOS_FILTER_USER_ONLY_BY_TERMINAL_ACCESS", true, OBContext.getOBContext()
              .getCurrentClient(), OBContext.getOBContext().getCurrentOrganization(), OBContext
              .getOBContext().getUser(), OBContext.getOBContext().getRole(), null);
      return "Y".equals(value);
    } catch (Exception e) {
      return false;
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  @Override
  protected JSONObject getPrerrenderData(HttpServletRequest request) throws JSONException {

    JSONObject result = super.getPrerrenderData(request);

    if (OBContext.getOBContext().getUser().getId().equals("0")) {
      final VariablesSecureApp vars = new VariablesSecureApp(request);
      final String terminalSearchKey = vars.getStringParameter("terminalName");
      OBCriteria<OBPOSApplications> qApp = OBDal.getInstance().createCriteria(
          OBPOSApplications.class);
      qApp.add(Restrictions.eq(OBPOSApplications.PROPERTY_SEARCHKEY, terminalSearchKey));
      qApp.setFilterOnReadableOrganization(false);
      qApp.setFilterOnReadableClients(false);
      List<OBPOSApplications> apps = qApp.list();
      if (apps.size() == 1) {
        OBPOSApplications terminal = apps.get(0);
        RequestContext.get().setSessionAttribute("POSTerminal", terminal.getId());

        result.put("appCaption", terminal.getIdentifier() + " - "
            + terminal.getOrganization().getIdentifier());
      }
    }
    return result;
  }

  @Override
  protected JSONObject preLogin(HttpServletRequest request) throws JSONException {
    String userId = "";
    boolean success = false;
    boolean hasAccess = false;
    JSONObject result = super.preLogin(request);
    Object params = request.getParameter("params");
    JSONObject obj = new JSONObject((String) params);
    String terminalKeyIdentifier = obj.getString("terminalKeyIdentifier");
    String cacheSessionId = obj.getString("cacheSessionId");

    OBCriteria<OBPOSApplications> qApp = OBDal.getInstance()
        .createCriteria(OBPOSApplications.class);
    qApp.add(Restrictions.eq(OBPOSApplications.PROPERTY_TERMINALKEY, terminalKeyIdentifier));
    qApp.setFilterOnReadableOrganization(false);
    qApp.setFilterOnReadableClients(false);
    List<OBPOSApplications> apps = qApp.list();
    if (apps.size() == 1) {
      OBPOSApplications terminal = ((OBPOSApplications) apps.get(0));
      if (terminal.isLinked()
          && (!(terminal.getCurrentCacheSession().equals(cacheSessionId) && terminal
              .getTerminalKey().equals(terminalKeyIdentifier)))) {
        result.put("exception", "OBPOS_TerminalAlreadyLinked");
        return result;
      }

      try {
        AuthenticationManager authManager = AuthenticationManager.getAuthenticationManager(this);
        HttpServletResponse response = RequestContext.get().getResponse();
        userId = authManager.authenticate(request, response);
        terminal = OBDal.getInstance().get(OBPOSApplications.class, terminal.getId());
      } catch (AuthenticationException ae) {
        ConnectionProvider cp = new DalConnectionProvider(false);
        Client systemClient = OBDal.getInstance().get(Client.class, "0");
        throw new AuthenticationException(Utility.messageBD(cp, ae.getMessage(), systemClient
            .getLanguage().getLanguage()));
      } catch (Exception e) {
        throw new AuthenticationException(e.getMessage());
      }

      if (userId != null && !userId.isEmpty()) {
        // Terminal access will be checked to ensure that the user has access to the terminal
        OBQuery<TerminalAccess> accessCrit = OBDal.getInstance().createQuery(TerminalAccess.class,
            "where userContact.id='" + userId + "'");
        accessCrit.setFilterOnReadableClients(false);
        accessCrit.setFilterOnReadableOrganization(false);
        List<TerminalAccess> accessList = accessCrit.list();

        if (accessList.size() != 0) {
          for (TerminalAccess access : accessList) {
            if (access.getPOSTerminal().getSearchKey().equals(terminal.getSearchKey())) {
              hasAccess = true;
              break;
            }
          }
          if (!hasAccess) {
            result.put("exception", "OBPOS_USER_NO_ACCESS_TO_TERMINAL_TITLE");
            return result;
          }
        }
        OBCriteria<User> userQ = OBDal.getInstance().createCriteria(User.class);
        userQ.add(Restrictions.eq(OBPOSApplications.PROPERTY_ID, userId));
        userQ.setFilterOnReadableOrganization(false);
        userQ.setFilterOnReadableClients(false);
        List<User> userList = userQ.list();
        if (userList.size() == 1) {
          User user = ((User) userList.get(0));
          for (UserRoles userRole : user.getADUserRolesList()) {
            if (this.hasADFormAccess(userRole)) {
              success = true;
              break;
            }
          }
        }
        if (success) {
          RequestContext.get().setSessionAttribute("POSTerminal", terminal.getId());
          result.put("terminalName", terminal.getSearchKey());
          result.put("terminalKeyIdentifier", terminal.getTerminalKey());
          result.put("appCaption", terminal.getIdentifier() + " - "
              + terminal.getOrganization().getIdentifier());
          result.put("servers", getServers(terminal));
          result.put("services", getServices());
          result.put("processes", getProcesses());
          terminal.setLinked(true);
          terminal.setCurrentCacheSession(cacheSessionId);

          OBDal.getInstance().save(terminal);

          try {
            OBDal.getInstance().getConnection().commit();
            log.info("[termAuth] Terminal " + terminal.getIdentifier() + "("
                + terminal.getCurrentCacheSession() + ") has been linked");
          } catch (SQLException e) {
            throw new JSONException(e);
          }
        } else {
          result.put("exception", "OBPOS_USERS_ROLE_NO_ACCESS_WEB_POS");
          return result;
        }

      } else {
        result.put("exception", "OBPOS_InvalidUserPassword");
        return result;
      }
    } else {
      result.put("exception", "OBPOS_WrongTerminalKeyIdentifier");
      return result;
    }

    HttpSession session = request.getSession(false);
    if (session != null) {
      // finally invalidate the session (this event will be caught by the session listener
      session.invalidate();
    }

    return result;
  }

  @Override
  protected JSONObject initActions(HttpServletRequest request) throws JSONException {
    JSONObject result = super.initActions(request);

    final String terminalName = request.getParameter("terminalName");
    JSONObject properties = (JSONObject) result.get("properties");
    if (terminalName != null) {
      OBPOSApplications terminal = null;
      OBCriteria<OBPOSApplications> qApp = OBDal.getInstance().createCriteria(
          OBPOSApplications.class);
      qApp.add(Restrictions.eq(OBPOSApplications.PROPERTY_SEARCHKEY, terminalName));
      qApp.setFilterOnReadableOrganization(false);
      qApp.setFilterOnReadableClients(false);
      List<OBPOSApplications> apps = qApp.list();
      if (apps.size() == 1) {
        terminal = ((OBPOSApplications) apps.get(0));
        properties.put("servers", getServers(terminal));
      }
    }
    properties.put("templateVersion", OBPOSPrintTemplateReader.getInstance()
        .getPrintTemplatesIdentifier());

    String terminalAuthenticationValue = "";
    String maxAllowedTimeInOfflineValue = "";
    String offlineSessionTimeExpirationValue = "";
    String currentPropertyToLaunchError = "";
    try {
      // Get terminal terminalAuthentication
      currentPropertyToLaunchError = "errorReadingTerminalAuthentication";
      Map<QueryFilter, Boolean> terminalAuthenticationQueryFilters = new HashMap<>();
      terminalAuthenticationQueryFilters.put(QueryFilter.ACTIVE, true);
      terminalAuthenticationQueryFilters.put(QueryFilter.CLIENT, false);
      terminalAuthenticationQueryFilters.put(QueryFilter.ORGANIZATION, false);
      terminalAuthenticationValue = Preferences.getPreferenceValue("OBPOS_TerminalAuthentication",
          true, null, null, null, null, (String) null, terminalAuthenticationQueryFilters);
      result.put("terminalAuthentication", terminalAuthenticationValue);
    } catch (PropertyException e) {
      result.put("terminalAuthentication", "Y");
      result.put(currentPropertyToLaunchError,
          OBMessageUtils.messageBD("OBPOS_errorWhileReadingTerminalAuthenticationPreference"));
    }

    try {
      // Get maxTimeInOffline preference
      currentPropertyToLaunchError = "errorReadingMaxAllowedTimeInOffline";
      Map<QueryFilter, Boolean> maxAllowedTimeInOfflineQueryFilters = new HashMap<>();
      maxAllowedTimeInOfflineQueryFilters.put(QueryFilter.ACTIVE, true);
      maxAllowedTimeInOfflineQueryFilters.put(QueryFilter.CLIENT, false);
      maxAllowedTimeInOfflineQueryFilters.put(QueryFilter.ORGANIZATION, false);
      maxAllowedTimeInOfflineValue = Preferences.getPreferenceValue("OBPOS_MaxTimeInOffline", true,
          null, null, null, null, (String) null, maxAllowedTimeInOfflineQueryFilters);
      result.put("maxTimeInOffline", maxAllowedTimeInOfflineValue);
    } catch (PropertyException e) {
      // Preference is not defined, max time in offline will not be set
      result.put(currentPropertyToLaunchError,
          OBMessageUtils.messageBD("OBPOS_errorWhileReadingMaxAllowedTimeInOfflinePreference"));
    }
    try {
      // Get offlineSessionTimeExpiration preference
      currentPropertyToLaunchError = "errorReadingOfflineSessionTimeExpiration";
      Map<QueryFilter, Boolean> offlineSessionTimeExpirationQueryFilters = new HashMap<>();
      offlineSessionTimeExpirationQueryFilters.put(QueryFilter.ACTIVE, true);
      offlineSessionTimeExpirationQueryFilters.put(QueryFilter.CLIENT, false);
      offlineSessionTimeExpirationQueryFilters.put(QueryFilter.ORGANIZATION, false);
      offlineSessionTimeExpirationValue = Preferences.getPreferenceValue(
          "OBPOS_offlineSessionTimeExpiration", true, null, null, null, null, (String) null,
          offlineSessionTimeExpirationQueryFilters);
      result.put("offlineSessionTimeExpiration", offlineSessionTimeExpirationValue);
    } catch (PropertyException e) {
      result.put("offlineSessionTimeExpiration", 60);
      result
          .put(currentPropertyToLaunchError, OBMessageUtils
              .messageBD("OBPOS_errorWhileReadingOfflineSessionTimeExpirationPreference"));
    }
    return result;
  }

  protected JSONArray getServers(OBPOSApplications terminal) throws JSONException {
    JSONArray respArray = new JSONArray();

    if (!MobileServerUtils.isMultiServerEnabled()) {
      return respArray;
    }

    OBQuery<MobileServerDefinition> servers = OBDal.getInstance().createQuery(
        MobileServerDefinition.class,
        "client.id=:clientId order by " + MobileServerDefinition.PROPERTY_PRIORITY);
    servers.setFilterOnReadableClients(false);
    servers.setFilterOnReadableOrganization(false);
    servers.setNamedParameter("clientId", terminal.getClient().getId());

    List<MobileServerDefinition> serversList = servers.list();
    for (MobileServerDefinition server : serversList) {
      if (server.isAllorgs()) {
        respArray.put(createServerJSON(server));
      } else {
        StringBuilder hql = new StringBuilder();
        hql.append("select mso from " + MobileServerOrganization.ENTITY_NAME + " as mso ");
        hql.append("where mso." + MobileServerOrganization.PROPERTY_OBMOBCSERVERDEFINITION
            + " = :serverDefinition ");
        hql.append("and mso." + MobileServerOrganization.PROPERTY_SERVERORG + " = :org");
        Query<Object> query = OBDal.getInstance().getSession()
            .createQuery(hql.toString(), Object.class);

        query.setParameter("serverDefinition", server);
        query.setParameter("org", terminal.getOrganization());
        if (!query.list().isEmpty()) {
          respArray.put(createServerJSON(server));
        }
      }
    }

    return respArray;
  }

  @Override
  public String getDefaultDecimalSymbol() {
    String decimalSymbol = (String) POSUtils.getPropertyInOrgTree(OBContext.getOBContext()
        .getCurrentOrganization(), Organization.PROPERTY_OBPOSFORMATDECIMAL);
    if (StringUtils.isEmpty(decimalSymbol)) {
      return super.getDefaultDecimalSymbol();
    } else {
      return StringEscapeUtils.escapeJavaScript(decimalSymbol);
    }
  }

  @Override
  public String getDefaultGroupingSymbol() {
    String groupSymbol = (String) POSUtils.getPropertyInOrgTree(OBContext.getOBContext()
        .getCurrentOrganization(), Organization.PROPERTY_OBPOSFORMATGROUP);
    if (StringUtils.isEmpty(groupSymbol)) {
      return super.getDefaultGroupingSymbol();
    } else {
      return StringEscapeUtils.escapeJavaScript(groupSymbol);
    }
  }

  @Override
  public String getDateFormat() {
    String dateFormat = (String) POSUtils.getPropertyInOrgTree(OBContext.getOBContext()
        .getCurrentOrganization(), Organization.PROPERTY_OBPOSDATEFORMAT);
    if (StringUtils.isEmpty(dateFormat)) {
      return super.getDateFormat();
    } else {
      return dateFormat;
    }
  }

  @Override
  protected String getModuleId() {
    return POSConstants.MODULE_ID;
  }
}