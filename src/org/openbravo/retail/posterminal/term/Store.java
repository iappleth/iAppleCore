/*
 ************************************************************************************
 * Copyright (C) 2019 Openbravo S.L.U.
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
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.retail.posterminal.OBPOSApplications;
import org.openbravo.retail.posterminal.POSUtils;

public class Store extends QueryTerminalProperty {

  @Override
  public String getProperty() {
    return "store";
  }

  @Override
  protected boolean isAdminMode() {
    return false;
  }

  @Override
  public boolean returnList() {
    return false;
  }

  @Override
  protected List<String> getQuery(JSONObject jsonsent) throws JSONException {

    OBPOSApplications pOSTerminal = POSUtils.getTerminal(jsonsent.optString("terminalName"));
    Organization myOrg = pOSTerminal.getOrganization().getOrganizationInformationList().get(0)
        .getOrganization();
    String crossStoreOrgId = myOrg.getOBPOSCrossStoreOrganization() != null ? myOrg
        .getOBPOSCrossStoreOrganization().getId() : "";

    return Arrays.asList(new String[] { "select id as id, case when id = '0' then '(All Stores)'"
        + " when id = '" + myOrg.getId()
        + "' then concat('This Store (', name, ')') else name end as name"
        + " from Organization organization" + " where id = '0' " + " or $readableSimpleCriteria"
        + " and $activeCriteria" + " and oBPOSCrossStoreOrganization.id = '" + crossStoreOrgId
        + "' order by name" });
  }
}