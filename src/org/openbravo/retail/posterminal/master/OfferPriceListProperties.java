/*
 ************************************************************************************
 * Copyright (C) 2014-2015 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

package org.openbravo.retail.posterminal.master;

import java.util.ArrayList;
import java.util.List;

import org.apache.log4j.Logger;
import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.mobile.core.model.HQLProperty;
import org.openbravo.mobile.core.model.ModelExtension;

/**
 * @author eduardobecerra
 * 
 */
@Qualifier(OfferPriceList.discFilterPriceListPropertyExtension)
public class OfferPriceListProperties extends ModelExtension {

  public static final Logger log = Logger.getLogger(OfferPriceListProperties.class);

  @Override
  public List<HQLProperty> getHQLProperties(Object params) {
    ArrayList<HQLProperty> list = new ArrayList<HQLProperty>() {
      private static final long serialVersionUID = 1L;
      {
        add(new HQLProperty("pl.id", "m_offer_pricelist_id"));
        add(new HQLProperty("pl.priceAdjustment.id", "m_offer_id"));
        add(new HQLProperty("pl.priceList.id", "m_pricelist_id"));
      }
    };
    return list;
  }
}
