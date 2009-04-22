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

package org.openbravo.test.xml;

import java.util.ArrayList;
import java.util.List;

import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.xml.EntityXMLConverter;
import org.openbravo.model.ad.system.Client;
import org.openbravo.model.common.businesspartner.Greeting;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.common.uom.UOM;
import org.openbravo.service.db.DataImportService;
import org.openbravo.service.db.ImportResult;

/**
 * Test various issues reported with XML import/export in mantis.
 * 
 * @author mtaal
 */

public class EntityXMLIssues extends XMLBaseTest {

  /**
   * Checks mantis issue 6212, issue text: When inserting reference data using DAL into ad_client 0
   * it should not generate new uuids but maintain the current ids but it is doing so.
   */
  public void testMantis6212() {
    cleanRefDataLoaded();
    final Client c = OBDal.getInstance().get(Client.class, "1000000");
    final Organization o = OBDal.getInstance().get(Organization.class, "1000000");
    setUserContext("1000000");

    addReadWriteAccess(Greeting.class);

    // only do one greeting
    final Greeting greeting = (Greeting) OBProvider.getInstance().get(Greeting.class);
    final String id = "" + System.currentTimeMillis();
    greeting.setName("test" + id);
    greeting.setId(id);
    greeting.setTitle("test");
    final List<Greeting> newGs = new ArrayList<Greeting>();
    newGs.add(greeting);
    final String xml = getXML(newGs);

    final ImportResult ir = DataImportService.getInstance().importDataFromXML(c, o, xml);

    if (ir.getException() != null) {
      ir.getException().printStackTrace(System.err);
      fail(ir.getException().getMessage());
    } else if (ir.getErrorMessages() != null) {
      fail(ir.getErrorMessages());
    }

    assertEquals(1, ir.getInsertedObjects().size());
    assertTrue(ir.getWarningMessages() == null);
    final BaseOBObject bob = ir.getInsertedObjects().get(0);
    assertEquals(id, bob.getId());
  }

  /**
   * Checks mantis issue 6213, issue text: When exporting/importing reference data for char columns
   * dal trims the blank spaces so in case the column contains only blank spaces it is treated as
   * null.
   */
  public void testMantis6213() {
    final String spaces = "   ";
    cleanRefDataLoaded();
    final Client c = OBDal.getInstance().get(Client.class, "1000000");
    final Organization o = OBDal.getInstance().get(Organization.class, "1000000");
    setUserContext("1000000");
    addReadWriteAccess(UOM.class);

    final List<UOM> uoms = getList(UOM.class);

    // only copy one uom
    final UOM prevUom = uoms.get(0);
    // a prerequisite, if this fails then the length has changed
    assertEquals(3, prevUom.getSymbol().length());
    final UOM uom = (UOM) DalUtil.copy(prevUom);
    final List<UOM> newUoms = new ArrayList<UOM>();
    final String id = "" + System.currentTimeMillis();
    uom.setId(id);
    uom.setName(id);
    uom.setSymbol("   ");
    newUoms.add(uom);
    final String xml = getXML(newUoms);
    assertTrue(xml.indexOf("<symbol>" + uom.getSymbol() + "</symbol>") != -1);

    final ImportResult ir = DataImportService.getInstance().importDataFromXML(c, o, xml);
    if (ir.getException() != null) {
      ir.getException().printStackTrace(System.err);
      fail(ir.getException().getMessage());
    } else if (ir.hasErrorOccured()) {
      fail(ir.getErrorMessages());
    }

    assertEquals(1, ir.getInsertedObjects().size());
    // there is a warning that the uom is created in org *, that's fine
    assertTrue(ir.getWarningMessages() != null);
    assertTrue(ir.getWarningMessages().indexOf(
        "eventhough it does not belong to the target organization") != -1);
    final BaseOBObject bob = ir.getInsertedObjects().get(0);
    assertEquals(id, bob.getId());

    OBDal.getInstance().commitAndClose();

    // now reread the greeting and check that the space is still there
    final UOM newUom = OBDal.getInstance().get(UOM.class, id);
    // before testing if it is okay remove it!
    OBDal.getInstance().remove(newUom);
    OBDal.getInstance().commitAndClose();

    // ensure that hibernate did not give us the same object twice
    assertTrue(uom != newUom);
    assertEquals(uom.getSymbol(), newUom.getSymbol());
  }

  public <T extends BaseOBObject> List<T> getList(Class<T> clz) {
    final OBCriteria<T> obc = OBDal.getInstance().createCriteria(clz);
    return obc.list();
  }

  public <T extends BaseOBObject> String getXML(List<T> objs) {
    final EntityXMLConverter exc = EntityXMLConverter.newInstance();
    exc.setOptionIncludeReferenced(true);
    // exc.setOptionEmbedChildren(true);
    // exc.setOptionIncludeChildren(true);
    exc.setAddSystemAttributes(false);
    return exc.toXML(new ArrayList<BaseOBObject>(objs));
  }

  public <T extends BaseOBObject> String getXML(Class<T> clz) {
    final OBCriteria<T> obc = OBDal.getInstance().createCriteria(clz);
    final EntityXMLConverter exc = EntityXMLConverter.newInstance();
    exc.setOptionIncludeReferenced(true);
    // exc.setOptionEmbedChildren(true);
    // exc.setOptionIncludeChildren(true);
    exc.setAddSystemAttributes(false);
    return exc.toXML(new ArrayList<BaseOBObject>(obc.list()));
  }
}