/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.0  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html 
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License. 
 * The Original Code is Openbravo ERP. 
 * The Initial Developer of the Original Code is Openbravo SL 
 * All portions are Copyright (C) 2008 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.test.security;

import java.util.Set;

import org.openbravo.base.exception.OBSecurityException;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.core.SessionHandler;
import org.openbravo.dal.security.OrganizationStructureProvider;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.project.Project;
import org.openbravo.test.base.BaseTest;

/**
 * Tests computation of natural tree of an organization.
 * 
 * @author mtaal
 */

public class AllowedOrganizationsTest extends BaseTest {

  public void testOrganizationTree() {
    setBigBazaarAdminContext();
    final OrganizationStructureProvider osp = new OrganizationStructureProvider();
    osp.setClientId("1000000");

    checkResult("1000001", osp, new String[] { "1000001" });
    checkResult("1000002", osp, new String[] { "1000003", "1000004", "1000000", "0", "1000002" });
    checkResult("1000003", osp, new String[] { "1000003", "1000000", "0", "1000002" });
    checkResult("1000004", osp, new String[] { "1000004", "1000000", "0", "1000002" });
    checkResult("1000005", osp, new String[] { "1000009", "1000006", "0", "1000000", "1000008",
        "1000005", "1000007" });
    checkResult("1000006", osp, new String[] { "1000009", "1000006", "0", "1000000", "1000008",
        "1000005" });
    checkResult("1000007", osp, new String[] { "1000000", "0", "1000005", "1000007" });
    checkResult("1000008", osp, new String[] { "1000000", "1000006", "0", "1000008", "1000005" });
    checkResult("1000009", osp, new String[] { "1000009", "1000006", "0", "1000000", "1000005" });
  }

  private void checkResult(String id, OrganizationStructureProvider osp, String[] values) {
    final Set<String> result = osp.getNaturalTree(id);
    assertEquals(values.length, result.size());
    for (final String value : values) {
      assertTrue(result.contains(value));
    }
  }

  public void testOrganizationCheck() {
    setUserContext("0");
    OBContext.getOBContext().getOrganizationStructureProvider().reInitialize();

    final Project p = OBDal.getInstance().get(Project.class, "1000001");
    final Organization o5 = OBDal.getInstance().get(Organization.class, "1000005");
    final Organization o3 = OBDal.getInstance().get(Organization.class, "1000001");
    p.setOrganization(o3);
    p.getBusinessPartner().setOrganization(o5);

    try {
      SessionHandler.getInstance().commitAndClose();
      fail();
    } catch (final OBSecurityException e) {
      assertTrue("Invalid exception " + e.getMessage(), e.getMessage().indexOf(
          "which is not part of the natural tree of") != -1);
      // no fail!
      SessionHandler.getInstance().rollback();
    }
  }
}