/*
 ************************************************************************************
 * Copyright (C) 2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

package org.openbravo.retail.posterminal.master;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.mobile.core.model.HQLProperty;
import org.openbravo.mobile.core.model.ModelExtension;

@Qualifier(CrossStoreFilter.crossStorePropertyExtension)
public class CrossStoreFilterProperties extends ModelExtension {

  @Override
  public List<HQLProperty> getHQLProperties(Object params) {
    final List<HQLProperty> list = new ArrayList<>();
    @SuppressWarnings("unchecked")
    final Map<String, Boolean> args = (Map<String, Boolean>) params;

    list.add(new HQLProperty("o.id", "orgId"));
    list.add(new HQLProperty("o.name", "orgName"));
    list.add(new HQLProperty("w.id", "warehouseId"));
    list.add(new HQLProperty("w.name", "warehouseName"));
    list.add(new HQLProperty("coalesce(sum(sd.quantityOnHand - sd.reservedQty), 0)", "stock"));
    if (args.get("showOnlyProductsWithPrice")) {
      list.add(new HQLProperty("pl.id", "standardPriceListId"));
      list.add(new HQLProperty("pp.standardPrice", "standardPrice"));
    }
    if (args.get("showProductsWithCurrentPrice")) {
      list.add(new HQLProperty("bppl.id", "currentPriceListId"));
      list.add(new HQLProperty("bppp.standardPrice", "currentPrice"));
    }

    return list;

  }
}
