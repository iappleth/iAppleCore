/*
 ************************************************************************************
 * Copyright (C) 2013 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

package org.openbravo.retail.posterminal.master;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.apache.log4j.Logger;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.dal.core.OBContext;
import org.openbravo.erpCommon.businessUtility.Preferences;
import org.openbravo.erpCommon.utility.PropertyException;
import org.openbravo.mobile.core.model.HQLProperty;
import org.openbravo.mobile.core.model.ModelExtension;
import org.openbravo.model.pricing.pricelist.ProductPrice;

@Qualifier(Product.productPropertyExtension)
public class ProductProperties extends ModelExtension {

  public static final Logger log = Logger.getLogger(ProductProperties.class);

  @Override
  public List<HQLProperty> getHQLProperties(Object params) {
    String localPosPrecision = "";
    try {
      if (params != null) {
        localPosPrecision = ((HashMap<String, String>) params).get("posPrecision");
      }
    } catch (Exception e) {
      log.error("Error getting posPrecision: " + e.getMessage(), e);
    }
    final String posPrecision = localPosPrecision;

    ArrayList<HQLProperty> list = new ArrayList<HQLProperty>() {
      private static final long serialVersionUID = 1L;
      {
        String trlName;
        if (OBContext.hasTranslationInstalled()) {
          trlName = "coalesce((select pt.name from ProductTrl AS pt where pt.language='"
              + OBContext.getOBContext().getLanguage().getLanguage()
              + "'  and pt.product=product), product.name)";
        } else {
          trlName = "product.name";
        }

        add(new HQLProperty("product.id", "id"));
        add(new HQLProperty("product.searchKey", "searchkey"));
        add(new HQLProperty(trlName, "_identifier"));
        add(new HQLProperty("product.taxCategory.id", "taxCategory"));
        add(new HQLProperty("product.productCategory.id", "productCategory"));
        add(new HQLProperty("product.obposScale", "obposScale"));
        add(new HQLProperty("product.uOM.id", "uOM"));
        add(new HQLProperty("product.uOM.symbol", "uOMsymbol"));
        add(new HQLProperty("product.uPCEAN", "uPCEAN"));
        try {
          if ("Y".equals(Preferences.getPreferenceValue("OBPOS_retail.productImages", true,
              OBContext.getOBContext().getCurrentClient(), OBContext.getOBContext()
                  .getCurrentOrganization(), OBContext.getOBContext().getUser(), OBContext
                  .getOBContext().getRole(), null))) {
          } else {
            add(new HQLProperty("img.bindaryData", "img"));
          }
        } catch (PropertyException e) {
          add(new HQLProperty("img.bindaryData", "img"));
        }
        add(new HQLProperty("product.description", "description"));
        add(new HQLProperty("product.obposGroupedproduct", "groupProduct"));
        add(new HQLProperty("product.stocked", "stocked"));
        add(new HQLProperty("product.obposShowstock", "showstock"));
        add(new HQLProperty("product.isGeneric", "isGeneric"));
        add(new HQLProperty("product.genericProduct.id", "generic_product_id"));
        add(new HQLProperty("product.brand.id", "brand"));
        add(new HQLProperty("product.characteristicDescription", "characteristicDescription"));
        add(new HQLProperty("product.obposShowChDesc", "showchdesc"));
        add(new HQLProperty("pli.bestseller", "bestseller"));
        add(new HQLProperty("'false'", "ispack"));
        if (posPrecision != null && !"".equals(posPrecision))
          add(new HQLProperty("round(ppp.listPrice, " + posPrecision + ")", "listPrice"));
        else
          add(new HQLProperty("ppp.listPrice", "listPrice"));
        if (posPrecision != null && !"".equals(posPrecision))
          add(new HQLProperty("round(ppp.standardPrice, " + posPrecision + ")", "standardPrice"));
        else
          add(new HQLProperty("ppp.standardPrice", "standardPrice"));

        add(new HQLProperty("ppp.priceLimit", "priceLimit"));
        add(new HQLProperty("ppp.cost", "cost"));
        Entity ProductPrice = ModelProvider.getInstance().getEntity(ProductPrice.class);
        if (ProductPrice.hasProperty("algorithm") == true) {
          add(new HQLProperty("ppp.algorithm", "algorithm"));
        }
      }
    };
    return list;
  }
}
