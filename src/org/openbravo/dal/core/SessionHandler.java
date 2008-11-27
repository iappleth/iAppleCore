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

import java.io.Serializable;

import org.apache.log4j.Logger;
import org.hibernate.FlushMode;
import org.hibernate.Query;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.openbravo.base.model.Entity;
import org.openbravo.base.provider.OBNotSingleton;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.session.SessionFactoryController;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.base.structure.Identifiable;
import org.openbravo.base.util.Check;

/**
 * Keeps the Hibernate Session and Transaction in a ThreadLocal so that it is
 * available throughout the application. This class provides convenience methods
 * to get a Session and to create/commit/rollback a transaction.
 * 
 * @author mtaal
 */
// TODO: revisit when looking at factory pattern and dependency injection
// framework
public class SessionHandler implements OBNotSingleton {
    private static final Logger log = Logger.getLogger(SessionHandler.class);

    // The threadlocal which handles the session
    private static ThreadLocal<SessionHandler> sessionHandler = new ThreadLocal<SessionHandler>();

    /**
     * Removes the current SessionHandler from the ThreadLocal. A call to
     * getSessionHandler will create a new SessionHandler, session and
     * transaction.
     */
    public static void deleteSessionHandler() {
        log.debug("Removing sessionhandler");
        sessionHandler.set(null);
    }

    /** @return true if a session handler is present for this thread, false */
    public static boolean isSessionHandlerPresent() {
        return sessionHandler.get() != null;
    }

    /**
     * Returns the SessionHandler of this thread. If there is none then a new
     * one is created and a Hibernate Session is created and a transaction is
     * started.
     * 
     * @return the sessionhandler for this thread
     */
    public static SessionHandler getInstance() {
        SessionHandler sh = sessionHandler.get();
        if (sh == null) {
            log.debug("Creating sessionHandler");
            sh = getCreateSessionHandler();
            sh.begin();
            sessionHandler.set(sh);
        }
        return sh;
    }

    private static boolean checkedSessionHandlerRegistration = false;

    private static SessionHandler getCreateSessionHandler() {
        if (!checkedSessionHandlerRegistration
                && !OBProvider.getInstance().isRegistered(SessionHandler.class)) {
            OBProvider.getInstance().register(SessionHandler.class,
                    SessionHandler.class, false);
        }
        return OBProvider.getInstance().get(SessionHandler.class);
    }

    private Session session;
    private Transaction tx;

    // Sets the session handler at rollback so that the controller can rollback
    // at the end
    private boolean doRollback = false;

    /** @returns the session */
    public Session getSession() {
        return session;
    }

    /**
     * Saves the object in this session.
     * 
     * @param obj
     *            the object to persist
     */
    public void save(Object obj) {
        if (Identifiable.class.isAssignableFrom(obj.getClass())) {
            session.save(((Identifiable) obj).getEntityName(), obj);
        } else {
            session.save(obj);
        }
    }

    /**
     * Delete the object from the db.
     * 
     * @param obj
     *            the object to remove
     */
    public void delete(Object obj) {
        session.delete(obj);
    }

    /**
     * Queries for a certain object using the class and id. If not found then
     * null is returned.
     * 
     * @param clazz
     *            the class to query
     * @param id
     *            the id to use for querying
     * @return the retrieved object, can be null
     */
    @SuppressWarnings("unchecked")
    public <T extends Object> T find(Class<T> clazz, Object id) {
        // translates a class to an entityname because the hibernate
        // Session.get method can not handle class names if the entity was
        // mapped with entitynames.
        if (Identifiable.class.isAssignableFrom(clazz)) {
            return (T) find(DalUtil.getEntityName(clazz), id);
        }
        return (T) session.get(clazz, (Serializable) id);
    }

    /**
     * Queries for a certain object using the entity name and id. If not found
     * then null is returned.
     * 
     * @param entityName
     *            the name of the entity to query
     * @param id
     *            the id to use for querying
     * @return the retrieved object, can be null
     * 
     * @see Entity
     */
    public BaseOBObject find(String entityName, Object id) {
        return (BaseOBObject) session.get(entityName, (Serializable) id);
    }

    /**
     * Create a query object from the current session.
     * 
     * @param qryStr
     *            the HQL query
     * @return a new Query object
     */
    public Query createQuery(String qryStr) {
        return session.createQuery(qryStr);
    }

    /**
     * Starts a transaction.
     */
    private void begin() {
        Check.isTrue(session == null, "Session must be null before begin");
        session = SessionFactoryController.getInstance().getSessionFactory()
                .openSession();
        session.setFlushMode(FlushMode.COMMIT);
        Check.isTrue(tx == null, "tx must be null before begin");
        tx = session.beginTransaction();
        log.debug("Transaction started");
    }

    /**
     * Commits the transaction and closes the session, should normally be called
     * at the end of all the work.
     */
    public void commitAndClose() {
        try {
            checkInvariant();
            tx.commit();
            tx = null;
        } finally {
            deleteSessionHandler();
            session.close();
        }
        session = null;
        log.debug("Transaction closed, session closed");
    }

    /**
     * Commits the transaction and starts a new transaction.
     */
    public void commitAndStart() {
        checkInvariant();
        tx.commit();
        tx = null;
        tx = session.beginTransaction();
        log.debug("Committed and started new transaction");
    }

    /**
     * Rolls back the transaction and closes the session.
     */
    public void rollback() {
        log.debug("Rolling back transaction");
        try {
            checkInvariant();
            tx.rollback();
            tx = null;
        } finally {
            deleteSessionHandler();
            try {
                log.debug("Closing session");
                session.close();
            } finally {
                // purposely ignoring it to not hide other errors
            }
        }
        session = null;
    }

    /**
     * The invariant is that for begin, rollback and commit the session etc. are
     * alive
     */
    private void checkInvariant() {
        Check.isNotNull(session, "Session is null");
        Check.isNotNull(tx, "Tx is null");
        Check.isTrue(tx.isActive(), "Tx is active");
    }

    /**
     * Registers that the transaction should be rolled back. Is used by the
     * {@link DalThreadHandler}.
     * 
     * @param setRollback
     *            if true then the transaction will be rolled back at the end of
     *            the thread.
     */
    public void setDoRollback(boolean setRollback) {
        if (setRollback) {
            log.debug("Rollback is set to true");
        }
        this.doRollback = setRollback;
    }

    /** @return the doRollback value */
    public boolean getDoRollback() {
        return doRollback;
    }
}