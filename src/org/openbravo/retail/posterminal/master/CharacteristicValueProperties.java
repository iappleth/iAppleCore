/*
 ************************************************************************************
 * Copyright (C) 2015-2017 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal.master;

import java.util.ArrayList;
import java.util.List;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.dal.core.OBContext;
import org.openbravo.erpCommon.businessUtility.Preferences;
import org.openbravo.mobile.core.model.HQLProperty;
import org.openbravo.mobile.core.model.ModelExtension;

@Qualifier(CharacteristicValue.characteristicValuePropertyExtension)
public class CharacteristicValueProperties extends ModelExtension {

  public static final Logger log = LogManager.getLogger();

  @Override
  public List<HQLProperty> getHQLProperties(Object params) {

    ArrayList<HQLProperty> list = null;
    try {
      list = new ArrayList<HQLProperty>() {
        private static final long serialVersionUID = 1L;

        {
          add(new HQLProperty("cv.id", "id"));
          add(new HQLProperty("cv.name", "name"));
          add(new HQLProperty("cv.characteristic.id", "characteristic_id"));
          boolean isRemote = false;
          isRemote = "Y".equals(Preferences.getPreferenceValue("OBPOS_remote.product", true,
              OBContext.getOBContext().getCurrentClient(), OBContext.getOBContext()
                  .getCurrentOrganization(), OBContext.getOBContext().getUser(), OBContext
                  .getOBContext().getRole(), null));
          if (!isRemote) {
            add(new HQLProperty("node.reportSet", "parent"));
          } else {
            add(new HQLProperty("'0'", "parent"));
          }
          add(new HQLProperty("cv.summaryLevel", "summaryLevel"));
          add(new HQLProperty("cv.name", "_identifier"));
          add(new HQLProperty("cv.active", "active"));
          add(new HQLProperty("cv.characteristic.name", "characteristicName"));
        }
      };
    } catch (org.openbravo.erpCommon.utility.PropertyException e) {
      log.error("Error while setting properties", e);
    }
    return list;
  }

}
