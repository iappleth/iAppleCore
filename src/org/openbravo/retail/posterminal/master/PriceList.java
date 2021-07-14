/*
 ************************************************************************************
 * Copyright (C) 2015-2021 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal.master;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.enterprise.inject.Any;
import javax.enterprise.inject.Instance;
import javax.inject.Inject;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.dal.core.OBContext;
import org.openbravo.erpCommon.businessUtility.Preferences;
import org.openbravo.erpCommon.utility.PropertyException;
import org.openbravo.mobile.core.master.MasterDataProcessHQLQuery;
import org.openbravo.mobile.core.master.MasterDataProcessHQLQuery.MasterDataModel;
import org.openbravo.mobile.core.model.HQLPropertyList;
import org.openbravo.mobile.core.model.ModelExtension;
import org.openbravo.mobile.core.model.ModelExtensionUtils;
import org.openbravo.retail.posterminal.OBPOSApplications;
import org.openbravo.retail.posterminal.POSUtils;

@MasterDataModel("PriceList")
public class PriceList extends MasterDataProcessHQLQuery {
  public static final String priceListPropertyExtension = "OBPOS_PriceListExtension";
  private static final Logger log = LogManager.getLogger();

  @Inject
  @Any
  @Qualifier(priceListPropertyExtension)
  private Instance<ModelExtension> extensions;

  @Override
  protected Map<String, Object> getParameterValues(JSONObject jsonsent) throws JSONException {
    try {
      OBContext.setAdminMode(true);
      OBPOSApplications POSTerminal = POSUtils.getTerminalById(jsonsent.getString("pos"));
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
    boolean multiPrices = false;
    List<String> hqlQueries = new ArrayList<String>();

    HQLPropertyList priceListHQLProperties = ModelExtensionUtils.getPropertyExtensions(extensions);
    try {
      multiPrices = "Y".equals(Preferences.getPreferenceValue("OBPOS_EnableMultiPriceList", true,
          OBContext.getOBContext().getCurrentClient(),
          OBContext.getOBContext().getCurrentOrganization(), OBContext.getOBContext().getUser(),
          OBContext.getOBContext().getRole(), null));
    } catch (PropertyException e1) {
      log.error("Error getting Preference: " + e1.getMessage(), e1);
    }

    if (multiPrices) {
      hqlQueries.add("select " + priceListHQLProperties.getHqlSelect()
          + " from PricingPriceList pl "
          + "left outer join BusinessPartner bp with pl.id = bp.priceList.id and bp.$readableClientCriteria and bp.customer = 'Y' "
          + "where pl.id <> (:priceList) "
          + "and pl.$naturalOrgCriteria and pl.$readableClientCriteria and (pl.$incrementalUpdateCriteria or bp.$incrementalUpdateCriteria) "
          + "and pl.$paginationByIdCriteria order by pl.id asc");
    }

    return hqlQueries;
  }

  @Override
  public List<String> getMasterDataModelProperties() {
    return getPropertiesFrom(extensions);
  }
}
