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
 * All portions are Copyright (C) 2019 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.client.application.test;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.isEmptyString;
import static org.hamcrest.Matchers.not;
import static org.junit.Assert.assertThat;
import static org.junit.Assume.assumeTrue;

import javax.inject.Inject;

import org.junit.Before;
import org.junit.Test;
import org.openbravo.base.weld.test.WeldBaseTest;
import org.openbravo.client.application.window.ApplicationDictionaryCachedStructures;
import org.openbravo.client.application.window.StandardWindowComponent;
import org.openbravo.client.kernel.ComponentGenerator;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.ad.ui.Tab;
import org.openbravo.model.ad.ui.Window;
import org.openbravo.test.base.TestConstants.Tabs;

/** Additional test cases for {@link ApplicationDictionaryCachedStructures} */
public class ADCSTest extends WeldBaseTest {
  @Inject
  private ApplicationDictionaryCachedStructures adcs;

  @Inject
  private StandardWindowComponent component;

  @Before
  public void doChecks() {
    assumeTrue("Cache can be used (no modules in development)", adcs.useCache());
    setSystemAdministratorContext();
  }

  /** See issue #40633 */
  @Test
  public void tabWithProductCharacteristicsIsGeneratedAfterADCSInitialization() {
    // given ADCS initialized with only Discounts and Promotions window
    adcs.init();
    Window w = adcs.getWindow("167");

    // when Discounts and Promotions view is requested in a different DAL session
    OBDal.getInstance().commitAndClose();
    component.setWindow(w);
    String generatedView = ComponentGenerator.getInstance().generate(component);

    // then the view gets generated without throwing exceptions
    assertThat(generatedView, not(isEmptyString()));
  }

  /** See issue #41338 */
  @Test
  public void tabsSharingTableAreCorrectlyInitialized() {
    // given ADCS initialized with only Sales Invoice header tab (uses c_order)
    adcs.init();

    adcs.getTab(Tabs.SALES_INVOICE_HEADER);
    OBDal.getInstance().commitAndClose();

    // when Purchase Invoice header (it also uses c_order) is taken from ADCS
    adcs.getTab(Tabs.PURCHASE_INVOICE_HEADER);
    OBDal.getInstance().commitAndClose();

    // then Purchase Invoice header is fully initialized even if taken in a different session
    Tab t = adcs.getTab(Tabs.PURCHASE_INVOICE_HEADER);
    assertThat(t.getTable().getADColumnList().size(), greaterThan(1));
  }

}
