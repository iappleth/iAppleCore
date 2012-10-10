/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal.term;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.retail.posterminal.ProcessHQLQuery;

public class CashMgmtPayments extends ProcessHQLQuery {

  @Override
  protected String getQuery(JSONObject jsonsent) throws JSONException {
    return "select p as payment, p.paymentMethod.allowdeposits as allowdeposits, p.paymentMethod.allowdrops as allowdrops, c_currency_rate(p.financialAccount.currency, p.obposApplications.organization.currency, null, null) as rate, p.financialAccount.currency.iSOCode as isocode from OBPOS_App_Payment as p "
        + "where obposApplications.id = :pos and (p.paymentMethod.allowdeposits=true or p.paymentMethod.allowdrops=true) order by p.commercialName";
  }
}
