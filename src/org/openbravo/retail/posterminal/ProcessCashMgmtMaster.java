/*
 ************************************************************************************
 * Copyright (C) 2015 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal;

import java.util.ArrayList;
import java.util.List;

import javax.servlet.ServletException;

import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.criterion.Restrictions;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;

public class ProcessCashMgmtMaster extends JSONProcessSimple {

  private static final Logger log = Logger.getLogger(ProcessCashMgmtMaster.class);

  @Override
  public JSONObject exec(JSONObject jsonsent) throws JSONException, ServletException {
    JSONObject result = new JSONObject();
    JSONArray payments = new JSONArray();
    if (jsonsent.has("cashUpId")) {
      String cashUpId = jsonsent.getString("cashUpId");
      boolean terminalSlave = jsonsent.has("terminalSlave") && jsonsent.getBoolean("terminalSlave");
      // If terminal is slave get parent CashupId
      if (terminalSlave) {
        OBPOSAppCashup cashUp = OBDal.getInstance().get(OBPOSAppCashup.class, cashUpId);
        if (cashUp != null && cashUp.getObposParentCashup() != null) {
          cashUpId = cashUp.getObposParentCashup().getId();
        } else {
          cashUpId = null;
        }
      }
      if (cashUpId != null) {
        List<OBPOSAppCashup> cashUpList = getCashUpList(cashUpId);
        List<String> cashUpIds = new ArrayList<String>();
        if (terminalSlave) {
          cashUpIds.add(cashUpId);
        }
        for (OBPOSAppCashup cashUp : cashUpList) {
          if (terminalSlave && cashUp.getId().equals(jsonsent.getString("cashUpId"))) {
            continue;
          }
          cashUpIds.add(cashUp.getId());
        }
        if (!cashUpIds.isEmpty()) {
          ProcessCashCloseMaster.addPaymentmethodCashup(payments, cashUpIds);
        }
      }
    }
    result.put("data", payments);
    result.put("status", 0);
    return result;
  }

  /**
   * Get cash up list with parent cash up
   * 
   * @param parentCashUp
   *          Parent cash up id.
   * @return
   */
  private List<OBPOSAppCashup> getCashUpList(String parentCashUp) {
    OBCriteria<OBPOSAppCashup> obCriteria = OBDal.getInstance()
        .createCriteria(OBPOSAppCashup.class);
    obCriteria
        .add(Restrictions.eq(OBPOSAppCashup.PROPERTY_OBPOSPARENTCASHUP + ".id", parentCashUp));
    return obCriteria.list();
  }

}
