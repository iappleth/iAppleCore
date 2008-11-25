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

package org.openbravo.dal.core;

/**
 * Ensures that the session/transaction are closed/committed/rolledback at the
 * end of the thread. It also ensures that the OBContext is removed from the
 * thread.
 * 
 * Note that cleaning up the thread is particularly important in webcontainer
 * environments because webcontainers (tomcat) re-use thread instances for new
 * requests (using a threadpool).
 * 
 * @author mtaal
 */

public abstract class DalThreadHandler extends ThreadHandler {

    @Override
    public void doBefore() {
    }

    @Override
    public void doFinal(boolean errorOccured) {
        try {
            if (SessionHandler.isSessionHandlerPresent()) {
                // application software can force a rollback
                if (SessionHandler.getInstance().getDoRollback()) {
                    SessionHandler.getInstance().rollback();
                } else if (errorOccured) {
                    SessionHandler.getInstance().rollback();
                } else {
                    SessionHandler.getInstance().commitAndClose();
                }
            }
        } finally {
            SessionHandler.deleteSessionHandler();
            if (OBContext.getOBContext() != null) {
                OBContext.getOBContext().setInAdministratorMode(false);
            }
            OBContext.setOBContext((OBContext) null);
        }
    }
}