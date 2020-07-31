/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo Public License
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
 * All portions are Copyright (C) 2019-2020 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.scheduling.quartz;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

import org.openbravo.scheduling.KillableProcessHandler;
import org.quartz.JobPersistenceException;
import org.quartz.SchedulerException;
import org.quartz.impl.jdbcjobstore.JobStoreTX;

public class OpenbravoPersistentJobStore extends JobStoreTX {

  private static Map<String, OpenbravoPersistentJobStore> clusterJobStores = new HashMap<>();
  private KillableProcessHandler killableProcessHandler = null;

  @Override
  public void setInstanceName(String instanceName) {
    super.setInstanceName(instanceName);
    clusterJobStores.put(instanceName, this);
  }

  @Override
  public void schedulerPaused() {
    try {
      super.schedulerPaused();
      updateSchedulerStatus(OpenbravoJDBCDelegate.SCHEDULER_STATUS_STANDBY);
    } catch (JobPersistenceException | SQLException e) {
      getLog().error("Scheduler state could not be updated(paused). {}", e.getMessage());
    }
  }

  @Override
  public void schedulerStarted() {
    try {
      super.schedulerStarted();
      killableProcessHandler = new KillableProcessHandler();
      killableProcessHandler.initialize(this.getThreadExecutor());
      updateSchedulerStatus(OpenbravoJDBCDelegate.SCHEDULER_STATUS_STARTED);
    } catch (SchedulerException | SQLException e) {
      getLog().error("Scheduler state could not be updated(started). {}", e.getMessage());
    }
  }

  @Override
  public void schedulerResumed() {
    try {
      super.schedulerResumed();
      /*
       * The status intends to inform about the ability of the scheduler to execute processes, it
       * makes no difference if the scheduler was just started or put in standby and then resumed.
       */
      updateSchedulerStatus(OpenbravoJDBCDelegate.SCHEDULER_STATUS_STARTED);
    } catch (JobPersistenceException | SQLException e) {
      getLog().error("Scheduler state could not be updated. {}", e.getMessage());
    }
  }

  /**
   * Shuts down the killableProcessHandler
   */
  @Override
  public void shutdown() {
    if (killableProcessHandler != null) {
      killableProcessHandler.shutdown();
      try {
        killableProcessHandler.join();
      } catch (InterruptedException ignore) {
        killableProcessHandler.interrupt();
      }
    }
    super.shutdown();
  }

  private void updateSchedulerStatus(String status) throws JobPersistenceException, SQLException {
    Connection conn = getNonManagedTXConnection();
    try {
      ((OpenbravoJDBCDelegate) getDelegate()).updateSchedulerStatus(conn, getInstanceId(),
          lastCheckin, status);
    } catch (ClassCastException e) {
      getDelegate().updateSchedulerState(conn, getInstanceId(), lastCheckin);
      commitConnection(conn);
    } finally {
      cleanupConnection(conn);
    }
  }

  public boolean isSchedulingAllowed() {
    Connection conn = null;
    try {
      conn = getNonManagedTXConnection();
      return ((OpenbravoJDBCDelegate) getDelegate()).schedulersStarted(conn);
    } catch (ClassCastException | JobPersistenceException | SQLException e) {
      getLog().error("Failed to look for started scheduler instances. {}", e.getMessage());
    } finally {
      if (conn != null) {
        cleanupConnection(conn);
      }
    }
    return false;
  }

  /*
   * This method overridden only to suppress the warnings produced by TxJobStore in the Quartz
   * library
   */
  @Override
  protected Object executeInLock(String lockName,
      @SuppressWarnings("rawtypes") TransactionCallback txCallback) throws JobPersistenceException {
    return super.executeInLock(lockName, txCallback);
  }

  public static boolean isSchedulingAllowedInCluster(String instanceName) {
    OpenbravoPersistentJobStore jobStore = clusterJobStores.get(instanceName);
    if (jobStore == null) {
      return false;
    }
    return jobStore.isSchedulingAllowed();
  }

}
