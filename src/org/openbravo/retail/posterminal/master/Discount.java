/*
 ************************************************************************************
 * Copyright (C) 2012-2015 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal.master;

import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.dal.core.OBContext;
import org.openbravo.erpCommon.businessUtility.Preferences;
import org.openbravo.erpCommon.utility.PropertyException;
import org.openbravo.model.pricing.priceadjustment.PriceAdjustment;
import org.openbravo.model.pricing.pricelist.PriceList;
import org.openbravo.retail.posterminal.POSUtils;
import org.openbravo.retail.posterminal.ProcessHQLQuery;
import org.openbravo.service.json.JsonUtils;

public class Discount extends ProcessHQLQuery {

  public static final Logger log = Logger.getLogger(Discount.class);

  @Override
  protected boolean isAdminMode() {
    return true;
  }

  protected String getPromotionsHQL(JSONObject jsonsent) throws JSONException {
    return getPromotionsHQL(jsonsent, false);
  }

  protected String getPromotionsHQL(JSONObject jsonsent, boolean addIncrementalUpdateFilter)
      throws JSONException {
    String orgId = OBContext.getOBContext().getCurrentOrganization().getId();

    PriceList priceList = POSUtils.getPriceListByOrgId(orgId);
    String priceListId = priceList.getId();

    String posPrecision = "";

    try {
      OBContext.setAdminMode(false);
      posPrecision = (priceList.getCurrency().getObposPosprecision() == null ? priceList
          .getCurrency().getPricePrecision() : priceList.getCurrency().getObposPosprecision())
          .toString();
    } catch (Exception e) {
      log.error("Error getting currency by id: " + e.getMessage(), e);
    } finally {
      OBContext.restorePreviousMode();
    }

    String hql = "from PricingAdjustment p ";
    hql += "where client.id = '" + OBContext.getOBContext().getCurrentClient().getId() + "' ";
    if (addIncrementalUpdateFilter) {
      hql += "and (p.$incrementalUpdateCriteria) ";
    }
    boolean multiPrices = false;
    try {
      multiPrices = "Y".equals(Preferences.getPreferenceValue("OBPOS_EnableMultiPriceList", true,
          OBContext.getOBContext().getCurrentClient(), OBContext.getOBContext()
              .getCurrentOrganization(), OBContext.getOBContext().getUser(), OBContext
              .getOBContext().getRole(), null));
    } catch (PropertyException e1) {
      log.error("Error getting Preference: " + e1.getMessage(), e1);
    }
    if (!multiPrices) {
      // price list
      hql += "and ((includePriceLists='Y' ";
      hql += "  and not exists (select 1 ";
      hql += "         from PricingAdjustmentPriceList pl";
      hql += "        where active = true";
      hql += "          and pl.priceAdjustment = p";
      hql += "          and pl.priceList.id ='" + priceListId + "')) ";
      hql += "   or (includePriceLists='N' ";
      hql += "  and  exists (select 1 ";
      hql += "         from PricingAdjustmentPriceList pl";
      hql += "        where active = true";
      hql += "          and pl.priceAdjustment = p";
      hql += "          and pl.priceList.id ='" + priceListId + "')) ";
      hql += "    ) ";
    }
    // organization
    hql += "and ((includedOrganizations='Y' ";
    hql += "  and not exists (select 1 ";
    hql += "         from PricingAdjustmentOrganization o";
    hql += "        where active = true";
    hql += "          and o.priceAdjustment = p";
    hql += "          and o.organization.id ='" + orgId + "')) ";
    hql += "   or (includedOrganizations='N' ";
    hql += "  and  exists (select 1 ";
    hql += "         from PricingAdjustmentOrganization o";
    hql += "        where active = true";
    hql += "          and o.priceAdjustment = p";
    hql += "          and o.organization.id ='" + orgId + "')) ";
    hql += "    ) ";

    // Rules with currency can be only applied if the price list has the same currency
    try {
      // Hack: currency is defined in discounts module, check if it is present not to fail the query
      // other case
      PriceAdjustment.class.getField("PROPERTY_OBDISCCCURRENCY");
      hql += " and (oBDISCCCurrency is null or ";
      hql += "     oBDISCCCurrency.id = '" + priceList.getCurrency().getId() + "')";
    } catch (Exception e) {
      // ignore, the module column is not present: don't include it in the query
    }

    return hql;
  }

  @Override
  protected List<String> getQuery(JSONObject jsonsent) throws JSONException {
    JSONObject today = new JSONObject();
    JSONObject value = new JSONObject();

    value.put("type", "DATE");
    Calendar now = Calendar.getInstance();
    now.add(Calendar.DAY_OF_MONTH, -1);
    value.put("value", JsonUtils.createDateFormat().format(new Date(now.getTimeInMillis())));
    today.put("today", value);
    jsonsent.put("parameters", today);
    Long lastUpdated = jsonsent.has("lastUpdated")
        && !jsonsent.get("lastUpdated").equals("undefined")
        && !jsonsent.get("lastUpdated").equals("null") ? jsonsent.getLong("lastUpdated") : null;
    // if it is a total refresh we need to ensure that all(AND) entities are active. In a
    // incremental refresh, we need to retrieve it if some (OR) ot the entities have changed
    jsonsent.put("operator", lastUpdated == null ? " AND " : " OR ");

    return prepareQuery(jsonsent);
  }

  protected List<String> prepareQuery(JSONObject jsonsent) throws JSONException {
    String hql = getPromotionsHQL(jsonsent, true);
    hql += "order by priority, id";

    return Arrays.asList(new String[] { hql });
  }

  @Override
  protected boolean bypassPreferenceCheck() {
    return true;
  }
}
