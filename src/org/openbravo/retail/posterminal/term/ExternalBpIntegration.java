/*
 ************************************************************************************
 * Copyright (C) 2021 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal.term;

import javax.servlet.ServletException;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.base.weld.WeldUtils;
import org.openbravo.dal.core.OBContext;
import org.openbravo.mobile.core.login.ExternalBusinessPartnerConfigurationProvider;
import org.openbravo.service.json.JsonConstants;

public class ExternalBpIntegration extends JSONTerminalProperty {

  @Override
  public JSONObject exec(JSONObject jsonsent) throws JSONException, ServletException {
    JSONObject result = new JSONObject();
    OBContext.setAdminMode(true);
    try {
      ExternalBusinessPartnerConfigurationProvider extBpInstance = WeldUtils
          .getInstanceFromStaticBeanManager(ExternalBusinessPartnerConfigurationProvider.class);
      result.put(JsonConstants.RESPONSE_DATA, extBpInstance.getJsonObject());
      result.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
      return result;
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  @Override
  public String getProperty() {
    return "externalBpIntegration";
  }

  @Override
  protected boolean bypassPreferenceCheck() {
    return true;
  }

}
