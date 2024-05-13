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
package org.openbravo.materialmgmt.refinventory;

import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.openbravo.materialmgmt.refinventory.HandlingUnitTestUtils.createHandlingUnit;
import static org.openbravo.materialmgmt.refinventory.HandlingUnitTestUtils.createHandlingUnitType;

import java.util.Collections;
import java.util.Map;

import org.codehaus.jettison.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.openbravo.base.weld.WeldUtils;
import org.openbravo.base.weld.test.WeldBaseTest;
import org.openbravo.materialmgmt.refinventory.HandlingUnitStatusProcessor.HandlingUnitStatus;
import org.openbravo.model.materialmgmt.onhandquantity.ReferencedInventory;

/**
 * Test cases to cover the execution of the {@link ChangeHandlingUnitStatus} process action handler.
 */
public class ChangeHandlingUnitStatusTest extends WeldBaseTest {

  private ReferencedInventory handlingUnit;

  @Before
  public void prepareHandlingUnits() {
    handlingUnit = createHandlingUnit("C1", createHandlingUnitType("Container"));
  }

  @After
  public void cleanUp() {
    rollback();
  }

  @Test
  public void changeHandlingUnitStatus() {
    assertThat("Handling unit status is initally open", handlingUnit.getStatus(),
        equalTo(HandlingUnitStatus.OPEN.name()));

    JSONObject requestData = new JSONObject(Map.of("M_RefInventory_ID", handlingUnit.getId(),
        "_params", new JSONObject(Map.of("Status", "CLOSED"))));
    WeldUtils.getInstanceFromStaticBeanManager(ChangeHandlingUnitStatus.class)
        .doExecute(Collections.emptyMap(), requestData.toString());

    assertThat("Handling unit status is changed", handlingUnit.getStatus(),
        equalTo(HandlingUnitStatus.CLOSED.name()));
  }
}
