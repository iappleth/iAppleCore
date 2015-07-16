/*
 ************************************************************************************
 * Copyright (C) 2012-2015 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal.term;

import java.util.Arrays;
import java.util.List;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.dal.core.OBContext;

public class Location extends QueryTerminalProperty {

  @Override
  protected boolean isAdminMode() {
    return true;
  }

  @Override
  protected List<String> getQuery(JSONObject jsonsent) throws JSONException {
    String orgId = OBContext.getOBContext().getCurrentOrganization().getId();
    return Arrays
        .asList(new String[] { "from Location where id = (select min(locationAddress) from OrganizationInformation where organization.id = '"
            + orgId + "' and $readableSimpleCriteria and $activeCriteria)" });
  }

  @Override
  protected boolean bypassPreferenceCheck() {
    return true;
  }

  @Override
  public String getProperty() {
    return "location";
  }

  @Override
  public boolean returnList() {
    return true;
  }
}
