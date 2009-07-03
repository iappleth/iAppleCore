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

package org.openbravo.test.base;

import java.io.File;
import java.net.URL;
import java.sql.SQLException;

import junit.framework.TestCase;
import junit.framework.TestResult;

import org.openbravo.base.exception.OBException;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.provider.OBConfigFileProvider;
import org.openbravo.base.session.OBPropertiesProvider;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.dal.core.DalLayerInitializer;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.core.SessionHandler;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;

/**
 * Base test class which can/should be extended by most other test classes which want to make use of
 * the Openbravo test infrastructure.
 * 
 * @author mtaal
 */

public class BaseTest extends TestCase {

  private boolean errorOccured = false;

  /**
   * Overridden to initialize the Dal layer, sets the current user to the the BigBazaar 1000000
   * user.
   */
  @Override
  protected void setUp() throws Exception {
    initializeDalLayer();
    // clear the session otherwise it keeps the old model
    setBigBazaarUserContext();
    super.setUp();
    // be negative is set back to false at the end of a successfull test.
    errorOccured = true;
  }

  /**
   * Initializes the DALLayer, can be overridden to add specific initialization behavior.
   * 
   * @throws Exception
   */
  protected void initializeDalLayer() throws Exception {
    if (!DalLayerInitializer.getInstance().isInitialized()) {
      setConfigPropertyFiles();
      DalLayerInitializer.getInstance().initialize(true);
    }
  }

  /**
   * Reads the configuration properties from the property files.
   */
  protected void setConfigPropertyFiles() {
    // get the location of the current class file
    final URL url = this.getClass().getResource(getClass().getSimpleName() + ".class");
    File f = new File(url.getPath());
    File propertiesFile = null;
    while (f.getParentFile() != null && f.getParentFile().exists()) {
      f = f.getParentFile();
      final File configDirectory = new File(f, "config");
      if (configDirectory.exists()) {
        propertiesFile = new File(configDirectory, "Openbravo.properties");
        if (propertiesFile.exists()) {
          // found it and break
          break;
        }
      }
    }
    if (propertiesFile == null) {
      throw new OBException("The testrun assumes that it is run from "
          + "within eclipse and that the Openbravo.properties "
          + "file is located as a grandchild of the 7th ancestor " + "of this class");
    }
    OBPropertiesProvider.getInstance().setProperties(propertiesFile.getAbsolutePath());
    OBConfigFileProvider.getInstance().setFileLocation(
        propertiesFile.getParentFile().getAbsolutePath());
  }

  /**
   * Set the current user to the 0 user.
   */
  protected void setSystemAdministratorContext() {
    setUserContext("0");
  }

  /**
   * Sets the current user to the 1000000 user.
   */
  protected void setBigBazaarUserContext() {
    setUserContext("1000000");
  }

  @Override
  public TestResult run() {
    // TODO Auto-generated method stub
    return super.run();
  }

  /**
   * Overridden to keep track if an exception was thrown, if not then errorOccurred is set to false,
   * signaling to tearDown to commit the transaction.
   */
  @Override
  public void runTest() throws Throwable {
    super.runTest();
    errorOccured = false;
  }

  /**
   * Sets the current user,
   * 
   * @param userId
   *          the id of the user to use.
   */
  protected void setUserContext(String userId) {
    OBContext.setOBContext(userId);
  }

  /**
   * Sets the current user to the 100 user.
   */
  protected void setBigBazaarAdminContext() {
    setUserContext("100");
  }

  /**
   * Performs rolling back of a transaction (in case setTestCompleted was not called by the
   * subclass), or commits the transaction if the testcase passed without exception.
   */
  @Override
  protected void tearDown() throws Exception {
    try {
      if (SessionHandler.isSessionHandlerPresent()) {
        if (SessionHandler.getInstance().getDoRollback()) {
          SessionHandler.getInstance().rollback();
        } else if (isErrorOccured()) {
          SessionHandler.getInstance().rollback();
        } else {
          SessionHandler.getInstance().commitAndClose();
        }
      }
    } catch (final Exception e) {
      SessionHandler.getInstance().rollback();
      reportException(e);
      throw e;
    } finally {
      SessionHandler.deleteSessionHandler();
      OBContext.setOBContext((OBContext) null);
    }
    super.tearDown();
  }

  /**
   * Prints the stacktrace of the exception to System.err. Handles the case that the exception is a
   * SQLException which has the real causing exception in the
   * {@link SQLException#getNextException()} method.
   * 
   * @param e
   *          the exception to report.
   */
  protected void reportException(Exception e) {
    if (e == null)
      return;
    e.printStackTrace(System.err);
    if (e instanceof SQLException) {
      reportException(((SQLException) e).getNextException());
    }
  }

  public boolean isErrorOccured() {
    return errorOccured;
  }

  /**
   * Does a rollback of the transaction;
   */
  public void rollback() {
    OBDal.getInstance().rollbackAndClose();
  }

  /**
   * Commits the transaction to the database.
   */
  public void commitTransaction() {
    OBDal.getInstance().commitAndClose();
  }

  /**
   * Deprecated, no need to call this method explicitly anymore. The BaseTest class overrides the
   * runTest method which sets the internal flag, overriding any value passed in this method.
   * 
   * @param errorOccured
   * @deprecated
   */
  public void setErrorOccured(boolean errorOccured) {
    this.errorOccured = errorOccured;
  }

  /**
   * Convenience method, gets an instance for the passed Class from the database. If there are no
   * records for that class then an exception is thrown. If there is more than one result then an
   * arbitrary instance is returned (the first one in the un-ordered resultset).
   * 
   * @param <T>
   *          the specific class to query for.
   * @param clz
   *          instances
   * @return an instance of clz.
   */
  protected <T extends BaseOBObject> T getOneInstance(Class<T> clz) {
    final OBCriteria<T> obc = OBDal.getInstance().createCriteria(clz);
    if (obc.list().size() == 0) {
      throw new OBException("There are zero instances for class " + clz.getName());
    }
    return obc.list().get(0);
  }

  /**
   * Extends the read and write access of the current user to also include the passed class. This
   * can be used to circumvent restrictive access which is not usefull for the test itself.
   * 
   * @param clz
   *          after this call the current user (in the {@link OBContext}) will have read/write
   *          access to this class.
   */
  protected void addReadWriteAccess(Class<?> clz) {
    final Entity entity = ModelProvider.getInstance().getEntity(clz);
    if (!OBContext.getOBContext().getEntityAccessChecker().getWritableEntities().contains(entity)) {
      OBContext.getOBContext().getEntityAccessChecker().getWritableEntities().add(entity);
    }
    if (!OBContext.getOBContext().getEntityAccessChecker().getReadableEntities().contains(entity)) {
      OBContext.getOBContext().getEntityAccessChecker().getReadableEntities().add(entity);
    }
  }

  /**
   * Counts the total occurences in the database for the passed class. Note that active, client and
   * organization filtering applies.
   * 
   * @param <T>
   *          a class type parameter
   * @param clz
   *          the class to count occurences for
   * @return the number of occurences which are active and belong to the current client/organization
   */
  protected <T extends BaseOBObject> int count(Class<T> clz) {
    final OBCriteria<T> obc = OBDal.getInstance().createCriteria(clz);
    return obc.count();
  }
}