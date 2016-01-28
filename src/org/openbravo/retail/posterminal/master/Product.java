/*
 ************************************************************************************
 * Copyright (C) 2012-2016 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal.master;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
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
import org.openbravo.dal.core.OBContext;
import org.openbravo.erpCommon.businessUtility.Preferences;
import org.openbravo.erpCommon.utility.PropertyException;
import org.openbravo.mobile.core.model.HQLPropertyList;
import org.openbravo.mobile.core.model.ModelExtension;
import org.openbravo.mobile.core.model.ModelExtensionUtils;
import org.openbravo.mobile.core.utils.OBMOBCUtils;
import org.openbravo.model.pricing.pricelist.PriceList;
import org.openbravo.model.pricing.pricelist.PriceListVersion;
import org.openbravo.retail.config.OBRETCOProductList;
import org.openbravo.retail.posterminal.POSUtils;
import org.openbravo.retail.posterminal.ProcessHQLQuery;

public class Product extends ProcessHQLQuery {
  public static final String productPropertyExtension = "OBPOS_ProductExtension";
  public static final String productDiscPropertyExtension = "OBPOS_ProductDiscExtension";
  public static final Logger log = Logger.getLogger(Product.class);

  @Inject
  @Any
  @Qualifier(productPropertyExtension)
  private Instance<ModelExtension> extensions;
  @Inject
  @Any
  @Qualifier(productDiscPropertyExtension)
  private Instance<ModelExtension> extensionsDisc;

  @Override
  protected List<HQLPropertyList> getHqlProperties(JSONObject jsonsent) {
    // Get Product Properties
    List<HQLPropertyList> propertiesList = new ArrayList<HQLPropertyList>();
    String orgId = OBContext.getOBContext().getCurrentOrganization().getId();
    final PriceList priceList = POSUtils.getPriceListByOrgId(orgId);
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
    boolean isRemote = false;
    try {
      OBContext.setAdminMode(false);
      posPrecision = (priceList.getCurrency().getObposPosprecision() == null ? priceList
          .getCurrency().getPricePrecision() : priceList.getCurrency().getObposPosprecision())
          .toString();
      isRemote = "Y".equals(Preferences.getPreferenceValue("OBPOS_remote.product", true, OBContext
          .getOBContext().getCurrentClient(), OBContext.getOBContext().getCurrentOrganization(),
          OBContext.getOBContext().getUser(), OBContext.getOBContext().getRole(), null));
    } catch (PropertyException e) {
      log.error("Error getting preference OBPOS_remote.product " + e.getMessage(), e);
    } finally {
      OBContext.restorePreviousMode();
    }
    boolean isMultipricelist = false;
    try {
      OBContext.setAdminMode(false);
      isMultipricelist = "Y".equals(Preferences.getPreferenceValue("OBPOS_EnableMultiPriceList",
          true, OBContext.getOBContext().getCurrentClient(), OBContext.getOBContext()
              .getCurrentOrganization(), OBContext.getOBContext().getUser(), OBContext
              .getOBContext().getRole(), null));
    } catch (PropertyException e) {
      log.error("Error getting preference EnableMultiPriceList " + e.getMessage(), e);
    } finally {
      OBContext.restorePreviousMode();
    }
    Map<String, Object> args = new HashMap<String, Object>();
    args.put("posPrecision", posPrecision);
    try {
      if (isRemote && isMultipricelist && jsonsent.has("remoteParams")
          && jsonsent.getJSONObject("remoteParams").getString("currentPriceList") != null) {
        args.put("multiPriceList", true);
      } else {
        args.put("multiPriceList", false);
      }
    } catch (JSONException e) {
      e.printStackTrace();
    }

    HQLPropertyList regularProductsHQLProperties = ModelExtensionUtils.getPropertyExtensions(
        extensions, args);
    HQLPropertyList regularProductsDiscHQLProperties = ModelExtensionUtils.getPropertyExtensions(
        extensionsDisc, args);

    propertiesList.add(regularProductsHQLProperties);
    propertiesList.add(regularProductsDiscHQLProperties);
    propertiesList.add(regularProductsHQLProperties);

    return propertiesList;
  }

  @Override
  protected List<String> getQuery(JSONObject jsonsent) throws JSONException {
    String orgId = OBContext.getOBContext().getCurrentOrganization().getId();
    final OBRETCOProductList productList = POSUtils.getProductListByOrgId(orgId);

    final Date terminalDate = OBMOBCUtils.calculateServerDate(jsonsent.getJSONObject("parameters")
        .getString("terminalTime"),
        jsonsent.getJSONObject("parameters").getJSONObject("terminalTimeOffset").getLong("value"));

    final PriceList priceList = POSUtils.getPriceListByOrgId(orgId);
    final PriceListVersion priceListVersion = POSUtils.getPriceListVersionByOrgId(orgId,
        terminalDate);

    if (productList == null) {
      throw new JSONException("Product list not found");
    }

    SimpleDateFormat format = new SimpleDateFormat("yyyy/MM/dd");
    Calendar now = Calendar.getInstance();

    List<String> products = new ArrayList<String>();
    String posPrecision = "";
    boolean isRemote = false;
    try {
      OBContext.setAdminMode(false);
      posPrecision = (priceList.getCurrency().getObposPosprecision() == null ? priceList
          .getCurrency().getPricePrecision() : priceList.getCurrency().getObposPosprecision())
          .toString();
      isRemote = "Y".equals(Preferences.getPreferenceValue("OBPOS_remote.product", true, OBContext
          .getOBContext().getCurrentClient(), OBContext.getOBContext().getCurrentOrganization(),
          OBContext.getOBContext().getUser(), OBContext.getOBContext().getRole(), null));
    } catch (PropertyException e) {
      log.error("Error getting preference OBPOS_remote.product " + e.getMessage(), e);
    } finally {
      OBContext.restorePreviousMode();
    }
    boolean isMultipricelist = false;
    try {
      OBContext.setAdminMode(false);
      isMultipricelist = "Y".equals(Preferences.getPreferenceValue("OBPOS_EnableMultiPriceList",
          true, OBContext.getOBContext().getCurrentClient(), OBContext.getOBContext()
              .getCurrentOrganization(), OBContext.getOBContext().getUser(), OBContext
              .getOBContext().getRole(), null));
    } catch (PropertyException e) {
      log.error("Error getting preference EnableMultiPriceList " + e.getMessage(), e);
    } finally {
      OBContext.restorePreviousMode();
    }
    Map<String, Object> args = new HashMap<String, Object>();
    args.put("posPrecision", posPrecision);
    try {
      if (isRemote && isMultipricelist && jsonsent.has("remoteParams")
          && jsonsent.getJSONObject("remoteParams").getString("currentPriceList") != null) {
        args.put("multiPriceList", true);
      } else {
        args.put("multiPriceList", false);
      }
    } catch (JSONException e) {
      e.printStackTrace();
    }

    HQLPropertyList regularProductsHQLProperties = ModelExtensionUtils.getPropertyExtensions(
        extensions, args);
    HQLPropertyList regularProductsDiscHQLProperties = ModelExtensionUtils.getPropertyExtensions(
        extensionsDisc, args);

    Long lastUpdated = jsonsent.has("lastUpdated")
        && !jsonsent.get("lastUpdated").equals("undefined")
        && !jsonsent.get("lastUpdated").equals("null") ? jsonsent.getLong("lastUpdated") : null;

    // regular products
    String hql = "select"
        + regularProductsHQLProperties.getHqlSelect()
        + "FROM OBRETCO_Prol_Product as pli left outer join pli.product.image img inner join pli.product as product, "
        + "PricingProductPrice ppp, " + "PricingPriceListVersion pplv ";
    if (isRemote && isMultipricelist && jsonsent.has("remoteParams")) {
      String multipriceListVersionId = POSUtils.getPriceListVersionForPriceList(
          jsonsent.getJSONObject("remoteParams").getString("currentPriceList"), terminalDate)
          .getId();
      hql += ", PricingProductPrice pp WHERE pp.product=pli.product and pp.priceListVersion='"
          + multipriceListVersionId + "'";
    } else {
      hql += " WHERE 1=1";
    }

    hql += " AND $filtersCriteria AND $hqlCriteria AND (pli.obretcoProductlist = '"
        + productList.getId() + "') " + "AND (" + "pplv.id='" + priceListVersion.getId() + "'"
        + ") AND (" + "ppp.priceListVersion.id = pplv.id" + ") AND ("
        + "pli.product.id = ppp.product.id" + ") ";

    if (lastUpdated != null) {
      hql += "AND ((pli.product.$incrementalUpdateCriteria) OR (pli.$incrementalUpdateCriteria) OR (ppp.$incrementalUpdateCriteria)) ";
    } else {
      hql += "AND ((pli.product.$incrementalUpdateCriteria) AND (pli.$incrementalUpdateCriteria)) ";
    }

    hql += "order by pli.product.name asc";
    products.add(hql);
    // Packs, combos...
    products.add("select "
        + regularProductsDiscHQLProperties.getHqlSelect()
        + " from PricingAdjustment as p left outer join p.obdiscImage img" //
        + " where $filtersCriteria AND p.discountType.obposIsCategory = true "//
        + "   and p.discountType.active = true " //
        + "   and p.$readableSimpleClientCriteria"//
        + "   and (p.endingDate is null or p.endingDate >= TO_DATE('"
        + format.format(now.getTime())
        + "', 'yyyy/MM/dd'))" //
        + "   and p.startingDate <= TO_DATE('"
        + format.format(now.getTime())
        + "', 'yyyy/MM/dd')"
        + "   and (p.$incrementalUpdateCriteria) "//
        // organization
        + "and ((p.includedOrganizations='Y' " + "  and not exists (select 1 "
        + "         from PricingAdjustmentOrganization o" + "        where active = true"
        + "          and o.priceAdjustment = p" + "          and o.organization.id ='" + orgId
        + "')) " + "   or (p.includedOrganizations='N' " + "  and  exists (select 1 "
        + "         from PricingAdjustmentOrganization o" + "        where active = true"
        + "          and o.priceAdjustment = p" + "          and o.organization.id ='" + orgId
        + "')) " + "    ) order by p.name asc");

    // generic products
    if (!isRemote) {// BROWSE tab is hidden, we do not need to send generic products
      products
          .add("select "
              + regularProductsHQLProperties.getHqlSelect()
              + " from Product product left outer join product.image img left join product.oBRETCOProlProductList as pli left outer join product.pricingProductPriceList ppp where $filtersCriteria AND (product.$incrementalUpdateCriteria) and exists (select 1 from Product product2 left join product2.oBRETCOProlProductList as pli2, PricingProductPrice ppp2 where product.id = product2.genericProduct.id and product2 = ppp2.product and ppp2.priceListVersion.id = '"
              + priceListVersion.getId() + "' and pli2.obretcoProductlist.id = '"
              + productList.getId() + "') order by product.name asc");
    }

    return products;

  }

  @Override
  protected boolean bypassPreferenceCheck() {
    return true;
  }
}
