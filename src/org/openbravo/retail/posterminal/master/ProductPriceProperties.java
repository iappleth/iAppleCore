/*
 ************************************************************************************
 * Copyright (C) 2015 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

package org.openbravo.retail.posterminal.master;

import java.util.ArrayList;
import java.util.List;

import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.mobile.core.model.HQLProperty;
import org.openbravo.mobile.core.model.ModelExtension;

@Qualifier(ProductPrice.productPricePropertyExtension)
public class ProductPriceProperties extends ModelExtension {

  @Override
  public List<HQLProperty> getHQLProperties(Object params) {
    ArrayList<HQLProperty> list = new ArrayList<HQLProperty>() {
      private static final long serialVersionUID = 1L;
      {
        add(new HQLProperty("ppp.id", "m_productprice_id"));
        add(new HQLProperty("ppp.priceListVersion.priceList.id", "m_pricelist_id"));
        add(new HQLProperty("ppp.product.id", "m_product_id"));
        add(new HQLProperty("ppp.listPrice", "pricelist"));
        add(new HQLProperty("ppp.standardPrice", "pricestd"));
        add(new HQLProperty("ppp.priceLimit", "pricelimit"));
      }
    };
    return list;
  }
}
