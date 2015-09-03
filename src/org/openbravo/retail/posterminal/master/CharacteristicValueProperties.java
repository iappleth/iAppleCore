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

@Qualifier(CharacteristicValue.characteristicValuePropertyExtension)
public class CharacteristicValueProperties extends ModelExtension {

  @Override
  public List<HQLProperty> getHQLProperties(Object params) {
    ArrayList<HQLProperty> list = new ArrayList<HQLProperty>() {
      private static final long serialVersionUID = 1L;
      {
        add(new HQLProperty("cv.id", "id"));
        add(new HQLProperty("cv.name", "name"));
        add(new HQLProperty("cv.characteristic.id", "characteristic_id"));
        add(new HQLProperty("node.reportSet", "parent"));
        add(new HQLProperty("cv.name", "_identifier"));
        add(new HQLProperty("cv.active", "active"));
      }
    };
    return list;
  }

}
