/*
 ************************************************************************************
 * Copyright (C) 2015-2016 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal;

import javax.enterprise.context.ApplicationScoped;

import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.mobile.core.process.HQLCriteriaProcess;

@ApplicationScoped
@Qualifier("PBrand_Filter")
public class BrandProductHQLCriteria extends HQLCriteriaProcess {

  @Override
  public String getHQLFilter(String params) {
    String[] array_params = getParams(params);
    String sql = null;
    if (array_params[1].equals("__all__")) {
      sql = getAllQuery();
    } else if (array_params[1].equals("Best sellers")) {
      sql = getBestsellers();
    } else {
      sql = getProdCategoryQuery();
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

  public String getAllQuery() {
    return " exists (select 1 from Product as p where p.brand.id = brand.id and upper(p.name) like upper ('$1'))";
  }

  public String getProdCategoryQuery() {
    return " exists (select 1 from Product as p where p.brand.id = brand.id and upper(p.name) like upper ('$1') and p.productCategory.id = '$2')";
  }

  public String getBestsellers() {
    return " exists (select 1 from OBRETCO_Prol_Product pli where pli.product.brand.id = brand.id  and pli.bestseller = true and upper(pli.product.name) like upper ('$1')) ";
  }

}
