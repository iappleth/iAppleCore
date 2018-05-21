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
 * All portions are Copyright (C) 2008-2018 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.dal.core;

import java.sql.Connection;
import java.sql.PreparedStatement;

import org.apache.log4j.Logger;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.util.Check;
import org.openbravo.dal.service.OBDal;

/**
 * Supports disabling and again enabling of database triggers.
 * 
 * The user of this class should call disable() after beginning the transaction and enable at the
 * end, before committing.
 * 
 * @author martintaal
 */

public class TriggerHandler {
  private static final Logger log = Logger.getLogger(TriggerHandler.class);

  private static TriggerHandler instance;

  public static TriggerHandler getInstance() {
    if (instance == null) {
      instance = OBProvider.getInstance().get(TriggerHandler.class);
    }
    return instance;
  }

  private ThreadLocal<Boolean> sessionStatus = new ThreadLocal<Boolean>();

  /**
   * Disabled all triggers in the database. This is done by creating an ADSessionStatus object and
   * storing it in the AD_SESSION_STATUS table. Note: this method will also call
   * {@link OBDal#flush() OBDal.flush()}.
   */
  public void disable() {
    log.debug("Disabling triggers");
    Check.isNull(sessionStatus.get(),
        "There is already a ADSessionStatus present in this thread, call enable before calling disable again");
    Connection con = OBDal.getInstance().getConnection();
    try (PreparedStatement ps = con.prepareStatement(
        "INSERT INTO AD_SESSION_STATUS (ad_session_status_id, ad_client_id, ad_org_id, isactive, created, createdby, updated, updatedby, isimporting)"
            + " VALUES (get_uuid(), '0', '0', 'Y', now(), '0', now(), '0', 'Y')")) {
      ps.executeUpdate();
      sessionStatus.set(Boolean.TRUE);
    } catch (Exception e) {
      throw new OBException("Couldn't disable triggers: ", e);
    }
  }

  /**
   * @return true if the database triggers are disabled, false in other cases.
   */
  public boolean isDisabled() {
    return sessionStatus.get() != null;
  }

  /**
   * Clears the SessionStatus from the threadlocal, must be done in case of rollback
   */
  public void clear() {
    sessionStatus.set(null);
  }

  /**
   * Enables triggers in the database. It does this by removing the ADSessionStatus from the
   * database.
   */
  public void enable() {
    log.debug("Enabling triggers");
    Check.isNotNull(sessionStatus.get(),
        "SessionStatus not set, call disable before calling this method");

    Connection con = OBDal.getInstance().getConnection();
    try (PreparedStatement ps = con
        .prepareStatement("DELETE FROM AD_SESSION_STATUS WHERE isimporting = 'Y'")) {
      ps.executeUpdate();
    } catch (Exception e) {
      throw new OBException("Couldn't enable triggers: ", e);
    } finally {
      // always clear the threadlocal
      clear();
    }
  }
}