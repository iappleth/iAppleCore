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

import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.mobile.core.model.HQLProperty;
import org.openbravo.mobile.core.model.ModelExtension;

@Qualifier(CrossStoreInfo.crossStoreInfoPropertyExtension)
public class CrossStoreInfoProperties extends ModelExtension {

  @Override
  public List<HQLProperty> getHQLProperties(Object params) {
    final List<HQLProperty> list = new ArrayList<>();

    final StringBuilder address = new StringBuilder();
    address.append(" COALESCE(l.addressLine1, '')");
    address.append(
        " || CASE WHEN l.addressLine2 IS NOT NULL THEN ' - ' || l.addressLine2 ELSE '' END");
    address.append(" || ' ' || COALESCE(l.postalCode, '') || ' ' || COALESCE(l.cityName, '')");
    address.append(" || CASE WHEN r.name IS NOT NULL THEN ' (' || r.name || ')' ELSE '' END");
    address.append(" || ' ' || COALESCE(c.name, '')");
    list.add(new HQLProperty(address.toString(), "address"));
    list.add(new HQLProperty("u.phone", "phone"));
    list.add(new HQLProperty("u.alternativePhone", "alternativePhone"));
    list.add(new HQLProperty("u.email", "email"));
    list.add(new HQLProperty("oi.taxID", "taxID"));

    return list;

  }
}
