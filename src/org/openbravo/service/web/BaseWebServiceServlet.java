/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.1  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html 
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License. 
 * The Original Code is Openbravo ERP. 
 * The Initial Developer of the Original Code is Openbravo SLU 
 * All portions are Copyright (C) 2008-2014 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.service.web;

import java.io.IOException;
import java.io.Writer;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.openbravo.authentication.AuthenticationException;
import org.openbravo.authentication.AuthenticationManager;
import org.openbravo.base.exception.OBSecurityException;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.core.SessionHandler;

/**
 * This servlet has two main responsibilities: 1) authenticate, 2) set the correct {@link OBContext}
 * , and 3) translate Exceptions into the correct Http response code.
 * <p/>
 * In regard to authentication: there is support for basic-authentication as well as url parameter
 * based authentication.
 * 
 * @author mtaal
 */

public class BaseWebServiceServlet extends HttpServlet {
  private static final Logger log = Logger.getLogger(BaseWebServiceServlet.class);

  public static final String LOGIN_PARAM = "l";
  public static final String PASSWORD_PARAM = "p";

  private static final long serialVersionUID = 1L;

  @Override
  protected final void service(HttpServletRequest request, HttpServletResponse response)
      throws ServletException, IOException {

    // do the login action
    AuthenticationManager authManager = AuthenticationManager.getAuthenticationManager(this);

    // if a stateless webservice then set the stateless flag
    try {
      final WebService webservice = getWebService(request);
      if (webservice != null
          && (AuthenticationManager.isStatelessService(webservice.getClass()) || AuthenticationManager
              .isStatelessRequest(request))) {
        request.setAttribute(AuthenticationManager.STATELESS_REQUEST_PARAMETER, "true");
      }
    } catch (Throwable ignore) {
      // ignore on purpose as subclasses may manage the resolving of webservices in a different
      // way
      // ignore also for backward compatibility
    }

    String userId = null;
    try {
      userId = authManager.webServiceAuthenticate(request);
    } catch (AuthenticationException e) {
      response.setStatus(HttpServletResponse.SC_FORBIDDEN);
      response.setContentType("text/plain;charset=UTF-8");
      final Writer w = response.getWriter();
      w.write(e.getMessage());
      w.close();
      return;
    }

    if (userId != null) {
      log.debug("WS accessed by userId " + userId);
      OBContext.setOBContext(UserContextCache.getInstance().getCreateOBContext(userId));
      OBContext.setOBContextInSession(request, OBContext.getOBContext());

      doService(request, response);

    } else {
      log.debug("WS accessed by unauthenticated user, requesting authentication");
      // not logged in
      if (!"false".equals(request.getParameter("auth"))) {
        response.setHeader("WWW-Authenticate", "Basic realm=\"Openbravo\"");
      }
      response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    }
  }

  protected WebService getWebService(HttpServletRequest request) {
    final String segment = WebServiceUtil.getInstance().getFirstSegment(request.getPathInfo());
    final Object o = OBProvider.getInstance().get(segment);
    if (o instanceof WebService) {
      return (WebService) o;
    }
    return null;
  }

  protected void callServiceInSuper(HttpServletRequest request, HttpServletResponse response)
      throws ServletException, IOException {
    super.service(request, response);
  }

  protected void doService(HttpServletRequest request, HttpServletResponse response)
      throws ServletException, IOException {
    try {
      if (OBContext.getOBContext() != null) {
        if (OBContext.getOBContext().isPortalRole()) {
          // Portal users are not granted to direct web services
          log.error("Portal user " + OBContext.getOBContext().getUser() + " with role "
              + OBContext.getOBContext().getRole()
              + " is trying to access to non granted web service " + request.getRequestURL());
          throw new OBSecurityException("Web Services are not granted to Portal roles");
        } else if (!OBContext.getOBContext().isWebServiceEnabled()) {
          log.error("User " + OBContext.getOBContext().getUser() + " with role "
              + OBContext.getOBContext().getRole()
              + " is trying to access to non granted web service " + request.getRequestURL());
          throw new OBSecurityException("Web Services are not granted to "
              + OBContext.getOBContext().getRole() + " role");
        }
      }
      super.service(request, response);
      response.setStatus(200);
    } catch (final InvalidRequestException e) {
      SessionHandler.getInstance().setDoRollback(true);
      response.setStatus(400);
      final Writer w = response.getWriter();
      w.write(WebServiceUtil.getInstance().createErrorXML(e));
      w.close();
    } catch (final InvalidContentException e) {
      SessionHandler.getInstance().setDoRollback(true);
      response.setStatus(409);
      final Writer w = response.getWriter();
      w.write(WebServiceUtil.getInstance().createErrorXML(e));
      w.close();
    } catch (final ResourceNotFoundException e) {
      SessionHandler.getInstance().setDoRollback(true);
      response.setStatus(404);
      final Writer w = response.getWriter();
      w.write(WebServiceUtil.getInstance().createErrorXML(e));
      w.close();
    } catch (final OBSecurityException e) {
      SessionHandler.getInstance().setDoRollback(true);
      response.setStatus(401);
      final Writer w = response.getWriter();
      w.write(WebServiceUtil.getInstance().createErrorXML(e));
      w.close();
    } catch (final Throwable t) {
      log.error(t.getMessage(), t);
      SessionHandler.getInstance().setDoRollback(true);
      response.setStatus(500);
      final Writer w = response.getWriter();
      w.write(WebServiceUtil.getInstance().createErrorXML(t));
      w.close();
    }
  }
}
