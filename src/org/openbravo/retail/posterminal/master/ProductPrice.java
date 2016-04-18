/*
 ************************************************************************************
 * Copyright (C) 2015-2016 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal.master;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.enterprise.inject.Any;
import javax.enterprise.inject.Instance;
import javax.inject.Inject;

import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.client.kernel.RequestContext;
import org.openbravo.dal.core.OBContext;
import org.openbravo.erpCommon.businessUtility.Preferences;
import org.openbravo.erpCommon.utility.PropertyException;
import org.openbravo.mobile.core.model.HQLPropertyList;
import org.openbravo.mobile.core.model.ModelExtension;
import org.openbravo.mobile.core.model.ModelExtensionUtils;
import org.openbravo.mobile.core.utils.OBMOBCUtils;
import org.openbravo.retail.config.OBRETCOProductList;
import org.openbravo.retail.posterminal.OBPOSApplications;
import org.openbravo.retail.posterminal.POSUtils;
import org.openbravo.retail.posterminal.ProcessHQLQuery;

public class ProductPrice extends ProcessHQLQuery {
  public static final String productPricePropertyExtension = "OBPOS_ProductPriceExtension";
  public static final Logger log = Logger.getLogger(Discount.class);

  @Inject
  @Any
  @Qualifier(productPricePropertyExtension)
  private Instance<ModelExtension> extensions;

  protected List<HQLPropertyList> getHqlProperties(JSONObject jsonsent) {
    List<HQLPropertyList> propertiesList = new ArrayList<HQLPropertyList>();
    Map<String, Object> args = new HashMap<String, Object>();
    HQLPropertyList ProductPriceProperties = ModelExtensionUtils.getPropertyExtensions(extensions,
        args);
    propertiesList.add(ProductPriceProperties);

    return propertiesList;
  }

  @Override
  protected Map<String, Object> getParameterValues(JSONObject jsonsent) throws JSONException {
    try {
      OBContext.setAdminMode(true);
      String posId = RequestContext.get().getSessionAttribute("POSTerminal").toString();
      OBPOSApplications POSTerminal = POSUtils.getTerminalById(posId);
      String pricelist = POSUtils.getPriceListByTerminal(POSTerminal.getSearchKey()).getId();
      Map<String, Object> paramValues = new HashMap<String, Object>();
      paramValues.put("priceList", pricelist);
      return paramValues;
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  @Override
  protected List<String> getQuery(JSONObject jsonsent) throws JSONException {
    String orgId = OBContext.getOBContext().getCurrentOrganization().getId();
    boolean multiPrices = false;
    OBRETCOProductList productList = POSUtils.getProductListByOrgId(orgId);

    if (productList == null) {
      throw new JSONException("Product list not found");
    }

    try {
      multiPrices = "Y".equals(Preferences.getPreferenceValue("OBPOS_EnableMultiPriceList", true,
          OBContext.getOBContext().getCurrentClient(), OBContext.getOBContext()
              .getCurrentOrganization(), OBContext.getOBContext().getUser(), OBContext
              .getOBContext().getRole(), null));
    } catch (PropertyException e1) {
      log.error("Error getting Preference: " + e1.getMessage(), e1);
    }

    Date terminalDate = OBMOBCUtils.calculateServerDate(jsonsent.getJSONObject("parameters")
        .getString("terminalTime"),
        jsonsent.getJSONObject("parameters").getJSONObject("terminalTimeOffset").getLong("value"));

    List<String> hqlQueries = new ArrayList<String>();

    HQLPropertyList priceListHQLProperties = ModelExtensionUtils.getPropertyExtensions(extensions);
    if (multiPrices) {
      hqlQueries
          .add("select "
              + priceListHQLProperties.getHqlSelect()
              + "from OBRETCO_Prol_Product as pli, PricingProductPrice ppp "
              + "where pli.product.id = ppp.product.id and pli.obretcoProductlist = '"
              + productList.getId()
              + "' and ppp.priceListVersion.id in ("
              + PriceList.getSelectPriceListVersionIds(orgId, terminalDate)
              + ") and $filtersCriteria AND $hqlCriteria "
              + "and pli.$naturalOrgCriteria and pli.$readableClientCriteria and (ppp.$incrementalUpdateCriteria) "
              + "order by ppp.id asc");
    }

    return hqlQueries;
  }
}