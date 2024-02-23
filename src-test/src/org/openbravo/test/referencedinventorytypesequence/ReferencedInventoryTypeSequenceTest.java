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
 * All portions are Copyright (C) 2024 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.test.referencedinventorytypesequence;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assume.assumeThat;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.junit.After;
import org.junit.Before;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.base.weld.test.WeldBaseTest;
import org.openbravo.client.kernel.KernelUtils;
import org.openbravo.client.kernel.RequestContext;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;

/**
 * Helper class to develop Referenced Inventory Type Sequence related tests
 */

public class ReferencedInventoryTypeSequenceTest extends WeldBaseTest {
  protected static final Logger log = LogManager.getLogger();

  private boolean isAwoInstalled() {
    try {
      OBContext.setAdminMode(true);
      return KernelUtils.getInstance()
          .isModulePresent("org.openbravo.warehouse.advancedwarehouseoperations");
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  @Before
  public void initialize() {

    boolean awoIsInstalled = isAwoInstalled();
    assumeThat("Auto-Disabled test case as incompatible with AWO (found to be installed) ",
        awoIsInstalled, is(false));

    setUserContext(QA_TEST_ADMIN_USER_ID);
    VariablesSecureApp vsa = new VariablesSecureApp(OBContext.getOBContext().getUser().getId(),
        OBContext.getOBContext().getCurrentClient().getId(),
        OBContext.getOBContext().getCurrentOrganization().getId());
    RequestContext.get().setVariableSecureApp(vsa);
  }

  @After
  public void cleanUp() {
    OBDal.getInstance().rollbackAndClose();
  }

}
