/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.1  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License.
 * The Original Code is Openbravo ERP.
 * The Initial Developer of the Original Code is Openbravo SLU
 * All portions are Copyright (C) 2012 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.erpCommon.ad_callouts;

import javax.servlet.ServletException;

import org.hibernate.criterion.Restrictions;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.security.OrganizationStructureProvider;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDao;
import org.openbravo.model.common.businesspartner.Category;
import org.openbravo.model.common.enterprise.Organization;

public class SL_BP_Category_Default extends SimpleCallout {
  private static final long serialVersionUID = 1L;

  @Override
  protected void execute(CalloutInfo info) throws ServletException {
    final String strOrgId = info.vars.getStringParameter("inpadOrgId");
    if (strOrgId != null && !"".equals(strOrgId)) {
      try {
        info.addSelect("inpcBpGroupId");

        OBContext.setAdminMode();
        OBCriteria<Category> bpCatCrit = OBDao.getFilteredCriteria(Category.class, Restrictions.in(
            Category.PROPERTY_ORGANIZATION + "." + Organization.PROPERTY_ID,
            new OrganizationStructureProvider().getNaturalTree(strOrgId)));
        bpCatCrit.addOrderBy(Category.PROPERTY_NAME, true);

        for (final Category bpCategory : bpCatCrit.list()) {
          info.addSelectResult(bpCategory.getId(), bpCategory.getIdentifier(), bpCategory
              .isDefault().booleanValue() && strOrgId.equals(bpCategory.getOrganization().getId()));
        }

        info.endSelect();
      } finally {
        OBContext.restorePreviousMode();
      }
    }
  }
}
