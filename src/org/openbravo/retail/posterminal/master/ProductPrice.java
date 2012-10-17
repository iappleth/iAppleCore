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
import org.openbravo.retail.posterminal.POSUtils;
import org.openbravo.retail.posterminal.ProcessHQLQuery;

public class ProductPrice extends ProcessHQLQuery {

  @Override
  protected boolean isAdminMode() {
    return true;
  }

  @Override
  protected String getQuery(JSONObject jsonsent) throws JSONException {
    return "from PricingProductPrice as pricingProductPrice where "
        + "(pricingProductPrice.$incrementalUpdateCriteria) AND priceListVersion in "
        + "(select plv.id from PricingPriceList as ppl, PricingPriceListVersion as plv "
        + "where ppl.id = '"
        + POSUtils.getPriceListByOrgId(jsonsent.getString("organization")).getId()
        + "' and ppl.id = plv.priceList.id  and "
        + "plv.validFromDate = (select max(pplv.validFromDate) from PricingPriceListVersion as pplv where pplv.priceList.id = ppl.id))";
  }
}
