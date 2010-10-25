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
 * All portions are Copyright (C) 2010 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.erpCommon.utility;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.erpCommon.obps.ActivationKey;
import org.openbravo.erpCommon.obps.ActivationKey.LicenseClass;

public class StaticCommunityBranding extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException,
      ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);
    if (vars.commandIn("DEFAULT")) {
      printPage(response);
    } else
      pageError(response);

  }

  private void printPage(HttpServletResponse response) throws IOException {
    log4j.debug("Output: dataSheet");
    final LicenseClass licenseClass = ActivationKey.getInstance().getLicenseClass();
    final String strVersion = OBVersion.getInstance().getMajorVersion();

    String strUrl = strDireccion + "/web/html/" + "en_US";
    if (strVersion.startsWith("3")) {
      if (LicenseClass.COMMUNITY.equals(licenseClass)) {
        response.sendRedirect(strUrl + "/StaticCommunityBranding-2.50-Comm.html");
      } else if (LicenseClass.BASIC.equals(licenseClass)) {
        response.sendRedirect(strUrl + "/StaticCommunityBranding-2.50-Basic.html");
      } else if (LicenseClass.STD.equals(licenseClass)) {
        response.sendRedirect(strUrl + "/StaticCommunityBranding-2.50-STD.html");
      } else {
        // Unknown license class, showing community content.
        log4j.error("unknown license class: " + licenseClass.getCode());
        response.sendRedirect(strUrl + "/StaticCommunityBranding-2.50-Comm.html");
      }
    } else {
      if (LicenseClass.COMMUNITY.equals(licenseClass)) {
        response.sendRedirect(strUrl + "/StaticCommunityBranding-2.50-Comm.html");
      } else if (LicenseClass.BASIC.equals(licenseClass)) {
        response.sendRedirect(strUrl + "/StaticCommunityBranding-2.50-Basic.html");
      } else if (LicenseClass.STD.equals(licenseClass)) {
        response.sendRedirect(strUrl + "/StaticCommunityBranding-2.50-STD.html");
      } else {
        // Unknown license class, showing community content.
        log4j.error("unknown license class: " + licenseClass.getCode());
        response.sendRedirect(strUrl + "/StaticCommunityBranding-2.50-Comm.html");
      }
    }

  }
}
