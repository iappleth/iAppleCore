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
import org.openbravo.model.pricing.pricelist.PriceList;
import org.openbravo.retail.config.OBRETCOProductList;
import org.openbravo.retail.posterminal.POSUtils;
import org.openbravo.retail.posterminal.ProcessHQLQuery;

public class Product extends ProcessHQLQuery {

  @Override
  protected String getQuery(JSONObject jsonsent) throws JSONException {
    final OBRETCOProductList productList = POSUtils.getProductListByOrgId(jsonsent
        .getString("organization"));

    final PriceList priceList = POSUtils.getPriceListByOrgId(jsonsent.getString("organization"));

    if (productList != null) {
      return "select pli.product.id as id, pli.product.name as _identifier, pli.product.taxCategory.id as taxCategory, "
          + "pli.product.productCategory.id as productCategory, pli.product.obposScale as obposScale, pli.product.uOM.id as uOM, pli.product.uPCEAN as uPCEAN, img.bindaryData as img "
          + "FROM OBRETCO_Prol_Product pli left outer join pli.product.image img, "
          + "PricingProductPrice ppp, "
          + "PricingPriceListVersion pplv "
          + "WHERE (pli.obretcoProductlist = '"
          + productList.getId()
          + "') "
          + "AND ("
          + "pplv.priceList.id = '"
          + priceList.getId()
          + "' AND "
          + "pplv.validFromDate = (select max(a.validFromDate) "
          + "  FROM PricingPriceListVersion a "
          + "  WHERE a.priceList.id = '"
          + priceList.getId()
          + "')"
          + ") AND ("
          + "ppp.priceListVersion.id = pplv.id"
          + ") AND ("
          + "pli.product.id = ppp.product.id" + ") order by pli.product.name";
    } else {
      throw new JSONException("Product list not found");
    }
  }
}
