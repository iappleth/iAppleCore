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
 * All portions are Copyright (C) 2017 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.jmx;

import java.lang.management.ManagementFactory;

import javax.management.InstanceAlreadyExistsException;
import javax.management.MBeanServer;
import javax.management.ObjectName;

import org.openbravo.apachejdbcconnectionpool.JdbcExternalConnectionPool;
import org.openbravo.base.provider.OBSingleton;
import org.openbravo.dal.core.DalContextListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This class is intended to register the jmx beans defined in the application.
 */
public class OBManagementFactory implements OBSingleton {
  final static private Logger log = LoggerFactory.getLogger(JdbcExternalConnectionPool.class);
  private static OBManagementFactory instance;
  private MBeanServer mBeanServer;

  public OBManagementFactory() {
    this.mBeanServer = ManagementFactory.getPlatformMBeanServer();
  }

  /**
   * @returns the single instance of the OBManagementFactory.
   */
  public static synchronized OBManagementFactory getInstance() {
    if (instance == null) {
      instance = new OBManagementFactory();
    }
    return instance;
  }

  /**
   * Registers a pre-existing object as an MBean with the MBean server instance of the
   * OBManagementFactory.
   * 
   * @param mBeanName
   *          the name of the MBean
   * @param mBean
   *          the MBean object
   */
  public void registerMBean(String mBeanName, Object mBean) {
    try {
      ObjectName name = new ObjectName("Openbravo:" + getContextString() + "name=" + mBeanName);
      mBeanServer.registerMBean(mBean, name);
    } catch (InstanceAlreadyExistsException alreadyRegistered) {
      log.debug("JMX instance already registered for {}, bean name: {}", mBeanName,
          alreadyRegistered.getMessage());
    } catch (Exception ignored) {
      log.error("Could not register {} as jmx bean", mBeanName, ignored);
    }
  }

  private String getContextString() {
    String context = "";
    if (DalContextListener.getServletContext() != null) {
      context = "context="
          + DalContextListener.getServletContext().getContextPath().replace("/", "") + ",";
    }
    return context;
  }
}