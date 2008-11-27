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

import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.dal.core.SessionHandler;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.xml.EntityXMLConverter;
import org.openbravo.model.ad.system.Client;
import org.openbravo.model.common.businesspartner.Greeting;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.common.enterprise.Warehouse;
import org.openbravo.model.common.geography.Location;
import org.openbravo.service.db.DataImportService;
import org.openbravo.service.db.ImportResult;

/**
 * Test if warnings are generated by the xml import.
 * 
 * @author mtaal
 */

public class EntityXMLImportTestWarning extends XMLBaseTest {

    public void testNotWritableWarningUpdate() {
        cleanRefDataLoaded();
        setErrorOccured(true);
        setUserContext("1000001");

        final List<Greeting> gs = getList(Greeting.class);
        String xml = getXML(gs);

        // change the xml to force an update
        xml = xml.replaceAll("</name>", "t</name>");
        setUserContext("1000000");
        final ImportResult ir = DataImportService.getInstance()
                .importDataFromXML(
                        OBDal.getInstance().get(Client.class, "1000000"),
                        OBDal.getInstance().get(Organization.class, "1000000"),
                        xml);
        if (ir.getException() != null) {
            ir.getException().printStackTrace(System.err);
            fail(ir.getException().getMessage());
        } else {
            assertTrue(ir.getWarningMessages() != null);
            assertTrue(ir.getWarningMessages().indexOf("updating") != -1);
            assertTrue(ir.getWarningMessages().indexOf(
                    " because it is not writable") != -1);
        }
        // force a rollback, so that the db is not changed
        setErrorOccured(true);
    }

    public void testNotWritableReferencedDataWarning() {
        cleanRefDataLoaded();
        setErrorOccured(true);
        setUserContext("1000001");

        final List<Warehouse> ws = getList(Warehouse.class);
        String xml = getXML(ws);

        // change the xml to force an update
        xml = xml.replaceAll("</name>", "t</name>");
        setUserContext("1000020");
        final ImportResult ir = DataImportService.getInstance()
                .importDataFromXML(
                        OBDal.getInstance().get(Client.class, "1000001"),
                        OBDal.getInstance().get(Organization.class, "1000001"),
                        xml);
        if (ir.getException() != null) {
            ir.getException().printStackTrace(System.err);
            fail(ir.getException().getMessage());
        } else {
            assertTrue(ir.getWarningMessages() != null);
            assertTrue(ir.getWarningMessages().indexOf("updating") != -1);
            assertTrue(ir.getWarningMessages().indexOf(
                    " because it is not writable") != -1);
        }
        // force a rollback, so that the db is not changed
        setErrorOccured(true);
    }

    public void testNotWritableInsertWarning() {
        cleanRefDataLoaded();
        setErrorOccured(true);
        setUserContext("1000001");

        final List<Warehouse> ws = getList(Warehouse.class);
        String xml = getXML(ws);

        // change the xml to force an update
        xml = xml.replaceAll("</name>", "t</name>");
        xml = xml.replaceAll("</id>", "new</id>");
        setUserContext("1000001");
        final ImportResult ir = DataImportService.getInstance()
                .importDataFromXML(
                        OBDal.getInstance().get(Client.class, "1000001"),
                        OBDal.getInstance().get(Organization.class, "1000001"),
                        xml);
        if (ir.getException() != null) {
            ir.getException().printStackTrace(System.err);
            fail(ir.getException().getMessage());
        } else {
            assertTrue(ir.getWarningMessages() != null);
            assertTrue(ir.getWarningMessages().indexOf(
                    "Not allowed to create entity") != -1);
            assertTrue(ir.getWarningMessages().indexOf(
                    " because it is not writable") != -1);
        }
        // force a rollback, so that the db is not changed
        setErrorOccured(true);
    }

    public void testNotUpdatingReferencedDataWarning() {
        cleanRefDataLoaded();
        setErrorOccured(true);
        setUserContext("1000001");

        final List<Warehouse> ws = getList(Warehouse.class);
        String xml = getXML(ws);

        // change the xml to force an update
        xml = xml.replaceAll("</name>", "t</name>");
        xml = xml.replaceAll("</id>", "new</id>");
        setUserContext("0");
        final ImportResult ir = DataImportService.getInstance()
                .importDataFromXML(
                        OBDal.getInstance().get(Client.class, "1000001"),
                        OBDal.getInstance().get(Organization.class, "1000001"),
                        xml);
        if (ir.getException() != null) {
            ir.getException().printStackTrace(System.err);
            fail(ir.getException().getMessage());
        } else {
            assertTrue(ir.getWarningMessages() != null);
            assertTrue(ir.getWarningMessages().indexOf(
                    "has not been updated because it already exists") != -1);
        }
        // force a rollback, so that the db is not changed
        setErrorOccured(true);
    }

    public void testUpdatingOtherOrganizationWarning() {
        cleanRefDataLoaded();
        setErrorOccured(true);
        setUserContext("1000001");

        final List<Warehouse> ws = getList(Warehouse.class);
        String xml = getXML(ws);

        // change the xml to force an update
        xml = xml.replaceAll("</name>", "t</name>");
        xml = xml.replaceAll("</id>", "new</id>");
        setUserContext("0");
        final ImportResult ir = DataImportService.getInstance()
                .importDataFromXML(
                        OBDal.getInstance().get(Client.class, "1000000"),
                        OBDal.getInstance().get(Organization.class, "1000002"),
                        xml);
        if (ir.getException() != null) {
            ir.getException().printStackTrace(System.err);
            fail(ir.getException().getMessage());
        } else {
            assertTrue(ir.getWarningMessages() != null);
            assertTrue(ir.getWarningMessages().indexOf("Updating entity") != -1);
            assertTrue(ir
                    .getWarningMessages()
                    .indexOf(
                            "eventhough it does not belong to the target organization ") != -1);
        }
        // force a rollback, so that the db is not changed
        setErrorOccured(true);
    }

    public void testUpdateOtherClientWarning() {
        cleanRefDataLoaded();
        setErrorOccured(true);
        setUserContext("1000001");

        final List<Location> cs = getList(Location.class);
        String xml = getXML(cs);

        // change the xml to force an update
        xml = xml.replaceAll("</cityName>", "t</cityName>");

        // the following should result in creation of location
        // xml = xml.replaceAll("location id=\"", "location id=\"new");
        // xml = xml.replaceAll("CoreLocation id=\"", "CoreLocation id=\"new");
        setUserContext("0");
        final ImportResult ir = DataImportService.getInstance()
                .importDataFromXML(
                        OBDal.getInstance().get(Client.class, "1000000"),
                        OBDal.getInstance().get(Organization.class, "1000001"),
                        xml);
        if (ir.getException() != null) {
            ir.getException().printStackTrace(System.err);
            fail(ir.getException().getMessage());
        } else {
            assertTrue(ir.getWarningMessages() != null);
            assertTrue(ir.getWarningMessages().indexOf("Updating entity") != -1);
            assertTrue(ir.getWarningMessages().indexOf(
                    "eventhough it does not belong to the target client") != -1);
        }
        // force a rollback, so that the db is not changed
        setErrorOccured(true);
    }

    public void testInsertOtherOrganizationWarning() {
        cleanRefDataLoaded();
        setErrorOccured(true);
        setUserContext("100");

        final List<Location> cs = getList(Location.class);
        String xml = getXML(cs);

        // clears the session and ensures that it starts with a new one
        SessionHandler.getInstance().rollback();

        // the following should result in creation of location
        xml = xml.replaceAll("<name>", "<name>new");
        xml = xml.replaceAll("region id=\"", "region id=\"new");
        xml = xml.replaceAll("Region id=\"", "Region id=\"new");
        System.err.println(xml);
        setUserContext("0");
        final ImportResult ir = DataImportService.getInstance()
                .importDataFromXML(
                        OBDal.getInstance().get(Client.class, "1000000"),
                        OBDal.getInstance().get(Organization.class, "1000001"),
                        xml);
        if (ir.getException() != null) {
            ir.getException().printStackTrace(System.err);
            fail(ir.getException().getMessage());
        } else {
            assertTrue(ir.getWarningMessages() != null);
            assertTrue(ir.getWarningMessages().indexOf("Creating entity ") != -1);
            assertTrue(ir.getWarningMessages().indexOf(
                    "eventhough it does not belong to the target organization") != -1);
        }
        // force a rollback, so that the db is not changed
        setErrorOccured(true);
    }

    public <T extends BaseOBObject> List<T> getList(Class<T> clz) {
        setErrorOccured(true);
        final OBCriteria<T> obc = OBDal.getInstance().createCriteria(clz);
        return obc.list();
    }

    public <T extends BaseOBObject> String getXML(List<T> objs) {
        setErrorOccured(true);
        final EntityXMLConverter exc = EntityXMLConverter.newInstance();
        exc.setOptionIncludeReferenced(true);
        // exc.setOptionEmbedChildren(true);
        // exc.setOptionIncludeChildren(true);
        exc.setAddSystemAttributes(false);
        return exc.toXML(new ArrayList<BaseOBObject>(objs));
    }

    public <T extends BaseOBObject> String getXML(Class<T> clz) {
        setErrorOccured(true);
        final OBCriteria<T> obc = OBDal.getInstance().createCriteria(clz);
        final EntityXMLConverter exc = EntityXMLConverter.newInstance();
        exc.setOptionIncludeReferenced(true);
        // exc.setOptionEmbedChildren(true);
        // exc.setOptionIncludeChildren(true);
        exc.setAddSystemAttributes(false);
        return exc.toXML(new ArrayList<BaseOBObject>(obc.list()));
    }
}