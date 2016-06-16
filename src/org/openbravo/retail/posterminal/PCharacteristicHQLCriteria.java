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

import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.dal.core.OBContext;
import org.openbravo.mobile.core.process.HQLCriteriaProcess;
import org.openbravo.retail.config.OBRETCOProductList;

@ApplicationScoped
@Qualifier("PCH_Filter")
public class PCharacteristicHQLCriteria extends HQLCriteriaProcess {

  @Override
  public String getHQLFilter(String params) {
    String orgId = OBContext.getOBContext().getCurrentOrganization().getId();
    final OBRETCOProductList productList = POSUtils.getProductListByOrgId(orgId);

    String[] array_params = getParams(params);
    String sql = null;
    if (array_params[1].equals("__all__")) {
      sql = getAllQuery(productList);
    } else if (array_params[1].equals("OBPOS_bestsellercategory")) {
      sql = getBestsellers(productList);
    } else {
      sql = getProdCategoryQuery(productList);
    }
    return sql;
  }

  private String[] getParams(String params) {
    String[] array_params = new String[params.length()];
    String[] array = (params.substring(1, params.length() - 1)).split(",");
    for (int i = 0; i < array.length; i++) {
      array_params[i] = array[i].substring(1, array[i].length() - 1);
    }
    return array_params;
  }

  public String getAllQuery(OBRETCOProductList productList) {
    return " exists (select 1 from ProductCharacteristicValue as pchv , OBRETCO_Prol_Product pli "
        + "where ch.id = pchv.characteristic.id "
        + "and pchv.product.id= pli.product.id  and   pli.obretcoProductlist.id='"
        + productList.getId() + "' and upper(pchv.product.name) like upper('$1') ) ";
  }

  public String getProdCategoryQuery(OBRETCOProductList productList) {
    return " exists (select 1 from ProductCharacteristicValue as pchv , OBRETCO_Prol_Product pli "
        + "where ch.id = pchv.characteristic.id "
        + "and pchv.product.id= pli.product.id  and   pli.obretcoProductlist.id='"
        + productList.getId()
        + "' and upper(pchv.product.name) like upper('$1') and pchv.product.productCategory.id in ( '$2') ) ";
  }

  public String getBestsellers(OBRETCOProductList productList) {
    return " exists (select 1 from ProductCharacteristicValue as pchv, OBRETCO_Prol_Product pli "
        + "where pchv.product.id=pli.product.id and ch.id = pchv.characteristic.id "
        + "and pli.bestseller = true and upper(pchv.product.name) like upper('$1') and pli.obretcoProductlist.id='"
        + productList.getId() + "') ";
  }
}
