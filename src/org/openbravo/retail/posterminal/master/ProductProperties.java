/*
 ************************************************************************************
 * Copyright (C) 2013-2016 Openbravo S.L.U.
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

import org.apache.log4j.Logger;
import org.hibernate.dialect.Dialect;
import org.hibernate.dialect.function.SQLFunction;
import org.hibernate.dialect.function.StandardSQLFunction;
import org.hibernate.impl.SessionFactoryImpl;
import org.hibernate.impl.SessionImpl;
import org.hibernate.type.StringType;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.client.kernel.RequestContext;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.businessUtility.Preferences;
import org.openbravo.erpCommon.utility.PropertyException;
import org.openbravo.erpCommon.utility.PropertyNotFoundException;
import org.openbravo.mobile.core.model.HQLProperty;
import org.openbravo.mobile.core.model.ModelExtension;
import org.openbravo.model.pricing.pricelist.ProductPrice;
import org.openbravo.retail.posterminal.OBPOSApplications;
import org.openbravo.retail.posterminal.POSUtils;

@Qualifier(Product.productPropertyExtension)
public class ProductProperties extends ModelExtension {

  private static final Logger log = Logger.getLogger(ProductProperties.class);

  @Override
  public List<HQLProperty> getHQLProperties(Object params) {

    List<HQLProperty> list = ProductProperties.getMainProductHQLProperties(params);

    list.addAll(new ArrayList<HQLProperty>() {
      private static final long serialVersionUID = 1L;
      {
        try {
          if ("Y".equals(Preferences.getPreferenceValue("OBPOS_retail.productImages", true,
              OBContext.getOBContext().getCurrentClient(),
              OBContext.getOBContext().getCurrentOrganization(), OBContext.getOBContext().getUser(),
              OBContext.getOBContext().getRole(), null))) {
          } else {
            add(new HQLProperty("img.bindaryData", "img"));
          }
        } catch (PropertyException e) {
          add(new HQLProperty("img.bindaryData", "img"));
        }
        add(new HQLProperty("case when product.isGeneric is false then "
            + "(case when pli.bestseller = 'Y' then true else false end) "
            + "when (product.isGeneric is true and exists(select 1 "
            + "from Product p3 left join p3.oBRETCOProlProductList as pli3, "
            + "PricingProductPrice ppp3 where p3.genericProduct.id = product.id and "
            + "p3 = ppp3.product and ppp3.priceListVersion.id = :priceListVersionId "
            + "and pli3.obretcoProductlist.id = :productListId and pli3.bestseller = true)) "
            + "then true else false end", "bestseller"));
        add(new HQLProperty("'false'", "ispack"));
        add(new HQLProperty("ppp.listPrice", "listPrice"));
        add(new HQLProperty("ppp.standardPrice", "standardPrice"));
        add(new HQLProperty("ppp.priceLimit", "priceLimit"));
        add(new HQLProperty("ppp.cost", "cost"));
        Entity ProductPrice = ModelProvider.getInstance().getEntity(ProductPrice.class);
        if (ProductPrice.hasProperty("algorithm") == true) {
          add(new HQLProperty("ppp.algorithm", "algorithm"));
        }
        add(new HQLProperty(
            "case when product.active = 'Y' and pli.active is not null then pli.active else product.active end",
            "active"));
        add(new HQLProperty(
            "(select case when atri.id is not null then true else false end from Product as prod left join prod.attributeSet as atri where prod.id = product.id)",
            "hasAttributes"));
        add(new HQLProperty(
            "(select case when atri.serialNo = 'Y' then true else false end from Product as prod left join prod.attributeSet as atri where prod.id = product.id)",
            "isSerialNo"));
      }
    });

    return list;

  }

  public static List<HQLProperty> getMainProductHQLProperties(Object params) {

    Boolean localmultiPriceList = false;
    try {
      if (params != null) {
        @SuppressWarnings("unchecked")
        HashMap<String, Object> localParams = (HashMap<String, Object>) params;
        localmultiPriceList = (Boolean) localParams.get("multiPriceList");

      }
    } catch (Exception e) {
      log.error("Error getting posPrecision: " + e.getMessage(), e);
    }
    final boolean multiPriceList = localmultiPriceList;

    // Build Product Tax Category select clause
    final Dialect dialect = ((SessionFactoryImpl) ((SessionImpl) OBDal.getInstance().getSession())
        .getSessionFactory()).getDialect();
    Map<String, SQLFunction> function = dialect.getFunctions();
    if (!function.containsKey("c_get_product_taxcategory")) {
      dialect.getFunctions().put("c_get_product_taxcategory",
          new StandardSQLFunction("c_get_product_taxcategory", new StringType()));
    }
    OBPOSApplications posDetail;
    posDetail = POSUtils
        .getTerminalById(RequestContext.get().getSessionAttribute("POSTerminal").toString());
    if (posDetail == null) {
      throw new OBException("terminal id is not present in session ");
    }
    StringBuffer taxCategoryQry = new StringBuffer();
    taxCategoryQry.append("c_get_product_taxcategory(product.id, '");
    taxCategoryQry.append(posDetail.getOrganization().getId());
    // Date, shipfrom and shipto as null
    taxCategoryQry.append("', null, null, null)");
    final String strTaxCategoryQry = taxCategoryQry.toString();

    ArrayList<HQLProperty> list = null;
    try {
      list = new ArrayList<HQLProperty>() {
        private static final long serialVersionUID = 1L;
        {
          String trlName;
          try {
            boolean isRemote = "Y".equals(Preferences.getPreferenceValue("OBPOS_remote.product",
                true, OBContext.getOBContext().getCurrentClient(),
                OBContext.getOBContext().getCurrentOrganization(),
                OBContext.getOBContext().getUser(), OBContext.getOBContext().getRole(), null));

            if (OBContext.hasTranslationInstalled() && !isRemote) {
              trlName = "coalesce((select pt.name from ProductTrl AS pt where pt.language='"
                  + OBContext.getOBContext().getLanguage().getLanguage()
                  + "'  and pt.product=product), product.name)";
            } else {
              trlName = "product.name";
            }
          } catch (PropertyNotFoundException e) {
            if (OBContext.hasTranslationInstalled()) {
              trlName = "coalesce((select pt.name from ProductTrl AS pt where pt.language='"
                  + OBContext.getOBContext().getLanguage().getLanguage()
                  + "'  and pt.product=product), product.name)";
            } else {
              trlName = "product.name";
            }
          }

          add(new HQLProperty("product.id", "id"));
          add(new HQLProperty("product.searchKey", "searchkey"));
          add(new HQLProperty(trlName, "_identifier"));
          add(new HQLProperty(strTaxCategoryQry, "taxCategory"));
          add(new HQLProperty("product.productCategory.id", "productCategory"));
          add(new HQLProperty("product.obposScale", "obposScale"));
          add(new HQLProperty("product.uOM.id", "uOM"));
          add(new HQLProperty("product.uOM.symbol", "uOMsymbol"));
          add(new HQLProperty("coalesce(product.uOM.standardPrecision)", "uOMstandardPrecision"));
          add(new HQLProperty("upper(product.uPCEAN)", "uPCEAN"));
          add(new HQLProperty("product.description", "description"));
          add(new HQLProperty("product.obposGroupedproduct", "groupProduct"));
          add(new HQLProperty("product.stocked", "stocked"));
          add(new HQLProperty("product.obposShowstock", "showstock"));
          add(new HQLProperty("product.isGeneric", "isGeneric"));
          add(new HQLProperty("product.genericProduct.id", "generic_product_id"));
          add(new HQLProperty("product.brand.id", "brand"));
          add(new HQLProperty("product.characteristicDescription", "characteristicDescription"));
          add(new HQLProperty("product.obposShowChDesc", "showchdesc"));
          add(new HQLProperty("product.productType", "productType"));
          add(new HQLProperty("product.includedProductCategories", "includeProductCategories"));
          add(new HQLProperty("product.includedProducts", "includeProducts"));
          add(new HQLProperty("product.printDescription", "printDescription"));
          add(new HQLProperty("product.oBPOSAllowAnonymousSale", "oBPOSAllowAnonymousSale"));
          add(new HQLProperty("product.returnable", "returnable"));
          add(new HQLProperty("product.overdueReturnDays", "overdueReturnDays"));
          add(new HQLProperty("product.ispricerulebased", "isPriceRuleBased"));
          add(new HQLProperty("product.obposProposalType", "proposalType"));
          add(new HQLProperty("product.obposIsmultiselectable", "availableForMultiline"));
          add(new HQLProperty("product.linkedToProduct", "isLinkedToProduct"));
          add(new HQLProperty("product.allowDeferredSell", "allowDeferredSell"));
          add(new HQLProperty("product.deferredSellMaxDays", "deferredSellMaxDays"));
          add(new HQLProperty("product.quantityRule", "quantityRule"));
          add(new HQLProperty("product.obposPrintservices", "isPrintServices"));
          if (multiPriceList) {
            add(new HQLProperty("pp.standardPrice", "currentStandardPrice"));
          }
        }
      };

    } catch (PropertyException e) {
      log.error("Error getting preference: " + e.getMessage(), e);
    }
    return list;
  }
}
