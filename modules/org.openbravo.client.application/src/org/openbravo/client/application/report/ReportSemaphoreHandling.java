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
 * All portions are Copyright (C) 2014-2015 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.client.application.report;

import org.openbravo.base.exception.OBException;
import org.openbravo.base.provider.OBSingleton;
import org.openbravo.erpCommon.businessUtility.Preferences;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.erpCommon.utility.PropertyConflictException;
import org.openbravo.erpCommon.utility.PropertyException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * A class which can be used to limit the number of parallel processes running. If no semaphore is
 * available an {@link OBException} is thrown.
 * 
 * This semaphore handler can/should be used by heavy resource intensive reporting processes.To
 * prevent too many to run at the same time.
 * 
 * The {@link #acquire()} and {@link #release()} methods should be called using a try finally block:
 * 
 * <pre>
 * <code>
 * // call acquire before the try:
 * ReportSemaphoreHandling.acquire();
 * try {
 * 
 * } finally {
 *   ReportSemaphoreHandling.release();
 * }
 * </code>
 * </pre>
 * 
 * @author mtaal
 */
public class ReportSemaphoreHandling implements OBSingleton {
  private static int DEFAULT_MAX_THREADS = 3;
  private static int maxThreads = 3;
  private static int threadCounter = 0;
  private static final Logger log = LoggerFactory.getLogger(ReportSemaphoreHandling.class);

  /**
   * Increments the threadCounter by one unit. The Max value of the counter can be parameterized by
   * setting the OBUIAPP_MaxReportThreads System preference. If no preference is found or it is
   * wrongly configured DEFAULT_MAX_THREADS default value is used.
   * 
   * @throws OBException
   *           When the threadCounter is in its max value.
   */
  public static synchronized void acquire() throws OBException {
    String value = "";
    try {
      // strNull needed to avoid ambiguous definition of getPreferenceValue() method. That can
      // receive BaseOBObjects or its ids.
      final String strNull = null;
      value = Preferences.getPreferenceValue("OBUIAPP_MaxReportThreads", true, strNull, strNull,
          strNull, strNull, strNull);
      maxThreads = Integer.valueOf(value);
    } catch (PropertyException e) {
      if (e instanceof PropertyConflictException) {
        // Conflict on OBUIAPP_MaxReportThreads
        log.warn("There are conflicts with OBUIAPP_MaxReportThreads property.", e);
      }
      // Use default value.
      maxThreads = DEFAULT_MAX_THREADS;
    } catch (NumberFormatException e) {
      // Value of preference is not numeric, use default value.
      log.warn("The value of OBUIAPP_MaxReportThreads property is not a valid number {}.", value, e);
      maxThreads = DEFAULT_MAX_THREADS;
    }
    if (threadCounter == maxThreads) {
      log.error("All available threads ({}) occupied.", maxThreads);
      throw new OBException(OBMessageUtils.messageBD("OBUIAPP_ReportProcessOccupied"));
    }
    threadCounter++;
  }

  /**
   * Decreases the threadCounter by one unit.
   * 
   * @throws OBException
   *           In case the current value is zero an Exception is thrown. This can only happen by a
   *           wrong implementation of the semaphore.
   */
  public static synchronized void release() throws OBException {
    if (threadCounter == 0) {
      throw new OBException("Illegal thread counter, decreasing below zero");
    }
    threadCounter--;
  }
}
