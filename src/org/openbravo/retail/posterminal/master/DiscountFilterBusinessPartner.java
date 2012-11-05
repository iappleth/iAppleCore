/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal.master;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;

public class DiscountFilterBusinessPartner extends Discount {

  @Override
  protected String prepareQuery(JSONObject jsonsent) throws JSONException {
    String hql = "from PricingAdjustmentBusinessPartner bp where active = true ";

    hql += " and exists (select 1 " + getPromotionsHQL(jsonsent);
    hql += "              and bp.priceAdjustment = p)";

    return hql;
  }
}
