/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
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
import org.openbravo.client.kernel.RequestContext;
import org.openbravo.mobile.core.process.ProcessHQLQuery;
import org.openbravo.retail.posterminal.POSUtils;

public class PriceListVersion extends ProcessHQLQuery {

  @Override
  protected List<String> getQuery(JSONObject jsonsent) throws JSONException {
    String priceListId = POSUtils.getPriceListByTerminalId(
        RequestContext.get().getSessionAttribute("POSTerminal").toString()).getId();
    return Arrays
        .asList(new String[] { "select plv.id AS id " + "from PricingPriceListVersion AS plv "
            + "where plv.$readableCriteria and plv.priceList.id ='" + priceListId
            + "' and plv.validFromDate = (select max(pplv.validFromDate) "
            + "from PricingPriceListVersion as pplv where pplv.priceList.id = '" + priceListId
            + "')" });
  }
}
