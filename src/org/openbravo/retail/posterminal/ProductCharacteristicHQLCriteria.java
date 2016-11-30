/*
 ************************************************************************************
 * Copyright (C) 2016 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal;

import javax.enterprise.context.ApplicationScoped;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONTokener;
import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.dal.core.OBContext;
import org.openbravo.mobile.core.process.HQLCriteriaProcess;
import org.openbravo.retail.config.OBRETCOProductList;

@ApplicationScoped
@Qualifier("ProductCH_Filter")
public class ProductCharacteristicHQLCriteria extends HQLCriteriaProcess {

  @Override
  public String getHQLFilter(String params) {
    String[] array_params = getParams(params);
    String sql = null;
    if (array_params[1].equals("__all__")) {
      sql = getAllQuery();
    } else if (array_params[1].equals("OBPOS_bestsellercategory")) {
      sql = getBestsellers();
    } else {
      sql = getProdCategoryQuery();
    }
    if (array_params.length >= 3 && !array_params[3].equals("")) {
      sql += " and pli.product.brand.id in ('" + getIds(array_params, 3) + "') ";
    }
    if (array_params.length > 2 && !array_params[2].equals("")) {
      sql = sql + getCharacteristics(array_params[2]);
    }
    sql = sql + ") ";
    return sql;
  }

  private String[] getParams(String params) {
    try {
      JSONArray array = new JSONArray(new JSONTokener(params));
      String[] array_params = new String[array.length()];
      for (int i = 0; i < array.length(); i++) {
        array_params[i] = array.getString(i);
      }
      return array_params;
    } catch (JSONException e) {
      return new String[] { "%", "__all__" };
    }
  }

  public String getAllQuery() {
    String orgId = OBContext.getOBContext().getCurrentOrganization().getId();
    final OBRETCOProductList productList = POSUtils.getProductListByOrgId(orgId);
    return "   exists (select 1 from ProductCharacteristicValue as pchv , OBRETCO_Prol_Product pli"
        + " where pchv.product.id=pli.product.id and cv.characteristic = pchv.characteristic and cv.id = pchv.characteristicValue.id "
        + " and pli.obretcoProductlist.id='" + productList.getId()
        + "' and upper(pchv.product.name) like upper('$1') ";
  }

  public String getProdCategoryQuery() {
    String orgId = OBContext.getOBContext().getCurrentOrganization().getId();
    final OBRETCOProductList productList = POSUtils.getProductListByOrgId(orgId);
    return "   exists (select 1 from ProductCharacteristicValue as pchv , OBRETCO_Prol_Product pli"
        + " where pchv.product.id=pli.product.id and cv.characteristic = pchv.characteristic and  cv.id = pchv.characteristicValue.id"
        + " and pli.obretcoProductlist.id='"
        + productList.getId()
        + "' and upper(pchv.product.name) like upper('$1') and pchv.product.productCategory.id in ('$2') ";
  }

  public String getBestsellers() {
    String orgId = OBContext.getOBContext().getCurrentOrganization().getId();
    final OBRETCOProductList productList = POSUtils.getProductListByOrgId(orgId);
    return "  exists (select 1 from ProductCharacteristicValue as pchv , OBRETCO_Prol_Product pli "
        + " where pchv.product.id=pli.product.id "
        + " and cv.characteristic = pchv.characteristic and cv.id = pchv.characteristicValue.id and pli.bestseller = true and pli.obretcoProductlist.id = '"
        + productList.getId() + "' " + " and upper(pchv.product.name) like upper('$1') ";
  }

  public String getCharacteristics(String params) {
    String[] array = params.split(";");
    String hql = "";
    for (int i = 0; i < array.length; i++) {
      hql = hql
          + " and  exists (select 1  from ProductCharacteristicValue p  where p.product.id = pchv.product.id and  p.characteristicValue.id in ('"
          + getIds(array, i) + "'))  ";
    }
    return hql;
  }

  private String getIds(String[] array, int i) {
    return array[i].replace(",", "','");
  }
}