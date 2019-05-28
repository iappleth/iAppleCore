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
import org.openbravo.retail.posterminal.POSUtils;

public class UIConfiguration extends QueryTerminalProperty {

  @Override
  protected boolean isAdminMode() {
    return true;
  }

  @Override
  protected List<String> getQuery(JSONObject jsonsent) throws JSONException {
    String uiConfId = POSUtils.getUiConfigurationByTerminalId(jsonsent.getString("pos")).getId();
    StringBuilder hqlSelect = new StringBuilder();
    hqlSelect.append("SELECT ");
    hqlSelect.append("dfact.rowposition as row, dfact.columnposition as column, ");
    hqlSelect.append("dfact.rowspan as rowspan, dfact.colspan as colspan, ");
    hqlSelect.append("dfact.cssclass as cssclass, ctype.value as ctypevalue, ");
    hqlSelect.append("act.value as actvalue, aba.value as abavalue, ");
    hqlSelect.append("win.value as winvalue, layvar.value as layvarvalue ");
    hqlSelect.append("FROM OBMOBC_UiConfigurationWindowAbaAction AS dfact ");
    hqlSelect.append("LEFT JOIN dfact.componentType AS ctype ");
    hqlSelect.append("LEFT JOIN dfact.aBAUiConfiguration AS abaconf ");
    hqlSelect.append("LEFT JOIN dfact.action AS act ");
    hqlSelect.append("LEFT JOIN abaconf.window AS win ");
    hqlSelect.append("LEFT JOIN abaconf.actionButtonArea AS aba ");
    hqlSelect.append("LEFT JOIN abaconf.actionButtonAreaLayoutVariant AS layvar ");
    hqlSelect.append("WHERE dfact.active = 'Y' AND ");
    hqlSelect.append("abaconf.active = 'Y' AND ");
    hqlSelect.append("abaconf.mobileUIConfiguration.active = 'Y' AND ");
    hqlSelect.append("abaconf.mobileUIConfiguration.id = '" + uiConfId + "'");
    return Arrays.asList(new String[] { hqlSelect.toString() });
  }

  @Override
  protected boolean bypassPreferenceCheck() {
    return true;
  }

  @Override
  public String getProperty() {
    return "uiConfiguration";
  }

  @Override
  public boolean returnList() {
    return false;
  }
}
