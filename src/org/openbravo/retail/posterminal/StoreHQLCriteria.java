/*
 ************************************************************************************
 * Copyright (C) 2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

package org.openbravo.retail.posterminal;

import javax.enterprise.context.ApplicationScoped;

import org.apache.commons.lang.StringUtils;
import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.StringCollectionUtils;
import org.openbravo.mobile.core.process.HQLCriteriaProcess;
import org.openbravo.model.common.enterprise.Organization;

@ApplicationScoped
@Qualifier("Store")
public class StoreHQLCriteria extends HQLCriteriaProcess {

  private static final String SUFIX = "[\"all_";

  @Override
  public String getHQLFilter(final String params) {
    if (StringUtils.startsWith(params, SUFIX)) {
      final String orgId = params.substring(SUFIX.length(), params.length() - 2);
      final Organization org = OBDal.getInstance().get(Organization.class, orgId);
      final String crossStoreList = StringCollectionUtils.commaSeparated(
          POSUtils.getOrgListByCrossStoreId(org.getOBRETCOCrossStoreOrganization().getId()), true);

      return " ord.organization.id in (" + crossStoreList + ") ";
    }

    return " ord.organization.id = $1 ";
  }
}
