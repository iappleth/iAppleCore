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
 * All portions are Copyright (C) 2015 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.service.importprocess;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Queue;
import java.util.WeakHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;

import org.apache.log4j.Logger;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.client.kernel.RequestContext;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.security.EntityAccessChecker;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.common.enterprise.Organization;

/**
 * The {@link ImportEntryProcessor} is responsible for importing/processing {@link ImportEntry}
 * instances for a specific TypeOfData.
 * 
 * The {@link ImportEntryProcessor} is a singleton/applicationscoped, it implements a generic
 * approach to make to make it possible to do import of {@link ImportEntry} in parallel threads (
 * {@link ImportEntryProcessRunnable}) if possible.
 * 
 * It is important that a specific ImportEntry is assigned to the right processing thread to prevent
 * for example deadlocks in the database. To make this possible a concept of
 * {@link #getProcessSelectionKey(ImportEntry)} is used. The process selection key is a unique key
 * derived from the {@link ImportEntry} which can be used to create/identify the thread which should
 * process the {@link ImportEntry}. If no such thread exists a new
 * {@link ImportEntryProcessRunnable} is created. The exact type of
 * {@link ImportEntryProcessRunnable} is determined by the extending subclass through the
 * {@link #createImportEntryProcessRunnable()} method.
 * 
 * For example if ImportEntry records of the same organization should be processed after each other
 * (so not in parallel) to prevent DB deadlocks, this means that the records of the same
 * organization should be assigned to the same thread object. So that they are indeed processed
 * sequential and not in parallel. The {@link #getProcessSelectionKey(ImportEntry)} should in this
 * case return the {@link Organization#getId()} so that {@link ImportEntryProcessRunnable} are
 * keyed/registered using the organization. Other {@link ImportEntry} records of the same
 * organization are then processed by the same thread, always sequential, not parallel, preventing
 * DB deadlocks.
 * 
 * The {@link ImportEntryManager} passes new {@link ImportEntry} records to the the
 * {@link ImportEntryProcessor} by calling its {@link #handleImportEntry(ImportEntry)}. The
 * {@link ImportEntryProcessor} then can decide how to handle this {@link ImportEntry}, create a new
 * thread or assign it to an existing thread (which is busy processing previous entries). This is
 * all done in this generic class. An implementing subclass needs to implement the
 * {@link #getProcessSelectionKey(ImportEntry)} method. This method determines which/how the correct
 * {@link ImportEntryProcessRunnable} is chosen.
 * 
 * The default/base implementation of the {@link ImportEntryProcessRunnable} provides standard
 * features related to caching of {@link OBContext}, error handling and transaction handling.
 * 
 * Note: this implementation uses the java {@link ExecutorService} to create a threadpool with a
 * fixed size. Threads are started by using the {@link ExecutorService#submit(Runnable)} method. Any
 * exceptions inside the {@link Runnable#run()} method are swallowed and won't directly show up in
 * the console. Therefore the default implementation in the {@link ImportEntryProcessRunnable#run()}
 * has different mechanisms to correctly log/record the error (in the
 * {@link ImportEntry#getErrorinfo()}).
 * 
 * Note: the {@link ImportEntryProcessor} should be aware that the same {@link ImportEntry} can be
 * passed multiple times to it. Also after the {@link ImportEntryProcessor} has already processed
 * it. This can happen because of the parallel/multi-threaded approach followed here. So the
 * {@link ImportEntryProcessor} and the implementation of the {@link ImportEntryProcessRunnable}
 * should correctly and robustly handle this case. The default {@link ImportEntryProcessRunnable}
 * implementation has mechanism to prevent double processing in some cases.
 * 
 * Note: it is save for an ImportEntryProcessor to occasionally not process an {@link ImportEntry}.
 * The {@link ImportEntryManager} will offer the {@link ImportEntry} again in its next cycle. But it
 * is quite important that this only happens if the order of the entries being processed is
 * maintained or not relevant.
 * 
 * @author mtaal
 */
@ApplicationScoped
public abstract class ImportEntryProcessor {

  // not static to create a Logger for each subclass
  private Logger log;

  private boolean initialized = false;

  // multiple threads access this map, its access is handled through
  // synchronized methods
  private Map<String, ImportEntryProcessRunnable> runnables = new HashMap<String, ImportEntryProcessRunnable>();
  private ExecutorService executorService;

  @Inject
  private ImportEntryManager importEntryManager;

  // create executor service which manages the threads
  private synchronized void initialize() {
    if (initialized) {
      return;
    }

    log = Logger.getLogger(this.getClass());

    // TODO: make number of threads configurable through a preference
    // threads are created on demand, so if not needed then it is not
    // used
    executorService = Executors.newFixedThreadPool(Math.max(1, getMaxNumberOfThreads()));

    initialized = true;
  }

  /**
   * The max number of threads to be started by the {@link ExecutorService} to process
   * {@link ImportEntry} objects. Default is 2.
   * 
   * For high-load-volume data consider setting this equal to half or a quarter of the number of
   * cores/processors (this to leave 'room' for other threads and processes).
   * 
   * @see Runtime#getRuntime()#availableProcessors();
   */
  // TODO: consider making the number of threads configurable through a preference
  protected int getMaxNumberOfThreads() {
    return 2;
  }

  /**
   * Is called when the application context/tomcat stops, is called from
   * {@link ImportEntryManager#shutdown()}.
   */
  public void shutdown() {
    if (executorService != null) {
      executorService.shutdownNow();
    }
  }

  /**
   * Is called from the {@link ImportEntryManager} thread, passes in a new ImportEntry to process.
   * Finds the Thread which can handle this entry, if none is found a new thread is created, if one
   * is found then the ImportEntry is passed/given to it.
   * 
   * If the processing of the entry does not happen fast enough then it can be that the
   * {@link ImportEntry} is again offered to the {@link ImportEntryProcessor} through a call to this
   * method. The implementation should be able to gracefully handle duplicate entries. Also the
   * implementation should check if the {@link ImportEntry} was possibly already handled and ignore
   * it then.
   */
  public void handleImportEntry(ImportEntry importEntry) {

    initialize();

    if (!canHandleImportEntry(importEntry)) {
      return;
    }
    // check if there is already a thread which should handle this
    // importentry.
    final String key = getProcessSelectionKey(importEntry);

    // the next call is synchronized to manage the case
    // that a thread deregisters itself at the same time
    assignEntryToThread(key, importEntry);
  }

  // synchronized to handle the case that a thread tries to deregister
  // itself at the same time
  protected synchronized void assignEntryToThread(String key, ImportEntry importEntry) {

    // runnables is a concurrent hashmap
    ImportEntryProcessRunnable runnable = runnables.get(key);

    // note: don't if here on an isProcessing flag on the runnable
    // this can result in 2 runnables for the same key
    // as runnable can already be in a queue of the executorservice
    // waiting to be processed, but not yet started
    if (runnable != null) {
      // there is runnable which can handle this ImportEntry
      if (log.isDebugEnabled()) {
        log.debug("Adding entry to runnable with key " + key);
      }
      // give it to the runnable
      runnable.addEntry(importEntry);

      // done
      return;
    }

    log.debug("Created new runnable for key " + key);

    // no runnable, create a new one
    runnable = createImportEntryProcessRunnable();

    // give it the entry
    runnable.setImportEntryManager(importEntryManager);
    runnable.setImportEntryProcessor(this);
    runnable.addEntry(importEntry);
    runnable.setKey(key);

    // and make sure it can get next entries by caching it
    runnables.put(key, runnable);

    // and give it to the executorServer to run
    executorService.submit(runnable);
  }

  /**
   * Is called when a {@link ImportEntryProcessRunnable} is ready with its current sets of
   * {@link ImportEntry} and stops running.
   * 
   * Is synchronized to be handle the case that deregistering happens while also an entry was added.
   * If an entry was added false is returned and the thread continues.
   */
  private synchronized boolean deregisterProcessThread(ImportEntryProcessRunnable runnable) {
    if (!runnable.getImportEntryQueue().isEmpty()) {
      // a new entry was entered while we tried to deregister
      return false;
    }
    log.debug("Removing runnable " + runnable.getKey());
    runnables.remove(runnable.getKey());
    return true;
  }

  /**
   * Create a concrete subclass of {@link ImportEntryProcessRunnable}
   */
  protected abstract ImportEntryProcessRunnable createImportEntryProcessRunnable();

  /**
   * Can be used by implementing subclass to check that the ImportEntry can be processed now. In
   * some cases other ImportEntries should be processed first. By returning false the ImportEntry is
   * ignored for now. It will again be picked up in a next execution cycle of the
   * {@link ImportEntryManager} thread and then offered again to this {@link ImportEntryProcessor}
   * to be processed.
   */
  protected abstract boolean canHandleImportEntry(ImportEntry importEntry);

  /**
   * Based on the {@link ImportEntry} returns a key which uniquely identifies the thread which
   * should process this {@link ImportEntry}. Can be used to place import entries which block/use
   * the same records in the same import thread, in this way preventing DB (dead)locks.
   */
  protected abstract String getProcessSelectionKey(ImportEntry importEntry);

  /**
   * The default implementation of the ImportEntryProcessRunnable. It performs the following
   * actions:
   * <ul>
   * <li>able to get new {@link ImportEntry} records while the processing of other
   * {@link ImportEntry} records happens.</li>
   * <li>processes the ImportEntry, creates a new OBContext based on the user data of the
   * {@link ImportEntry}</li>
   * <li>makes sure that there is a {@link VariablesSecureApp} in the {@link RequestContext}.
   * <li>OBContexts are temporary cached in a {@link WeakHashMap}</li>
   * <li>the process checks the {@link ImportEntry} status just before it is processed, it also
   * prevents the same {@link ImportEntry} to be processed twice by one thread</li>
   * <li>each {@link ImportEntry} is processed in its own connection and transaction. Note the
   * process here does not commit a transaction, the implementing subclass must do that.</li>
   * <li>the process sets admin mode, before calling the subclass</li>
   * <li>an error which ends up in the main loop here is stored in the {@link ImportEntry} in the
   * errorInfo property</li>
   * <li>subclasses implement the {@link #processEntry(ImportEntry)} method.
   * </ul>
   * 
   * @author mtaal
   *
   */
  public static abstract class ImportEntryProcessRunnable implements Runnable {
    private Queue<ImportEntry> importEntries = new ConcurrentLinkedQueue<ImportEntry>();

    private Logger logger;

    private HashSet<String> importEntryIds = new HashSet<String>();

    private ImportEntryManager importEntryManager;
    private ImportEntryProcessor importEntryProcessor;
    private String key = null;
    // use weakhashmap so that the content is automatically purged
    // when the garbagecollector runs
    private Map<String, OBContext> cachedOBContexts = new HashMap<String, OBContext>();

    @Override
    public void run() {
      logger = Logger.getLogger(this.getClass());
      try {
        int cnt = 0;
        long totalT = 0;
        ImportEntry importEntry;
        while ((importEntry = importEntries.poll()) != null) {
          try {
            final long t0 = System.currentTimeMillis();

            // start from scratch
            OBDal.getInstance().rollbackAndClose();

            // set the same obcontext as was being used for the original
            // entry
            setOBContext(importEntry);

            try {
              OBContext.setAdminMode();
              ImportEntry localImportEntry;
              try {
                // reload the importEntry
                localImportEntry = OBDal.getInstance().get(ImportEntry.class, importEntry.getId());

                // check if already processed, if so skip it
                if (localImportEntry == null
                    || !"Initial".equals(localImportEntry.getImportStatus())) {
                  continue;
                }
              } finally {
                OBContext.restorePreviousMode();
              }

              // not changed, process
              processEntry(localImportEntry);

            } finally {
              cleanUpThreadForNextCycle();
            }

            // keep some stats
            cnt++;
            final long timeForEntry = (System.currentTimeMillis() - t0);
            totalT += timeForEntry;
            importEntryManager.reportStats(importEntry.getTypeofdata(), timeForEntry);
            if ((cnt % 100) == 0 && logger.isDebugEnabled()) {
              logger.debug("Runnable: " + key + ", processed " + cnt + " import entries in "
                  + totalT + " millis, " + (totalT / cnt)
                  + " per import entry, current queue size: " + importEntries.size());
            }
          } catch (Throwable t) {
            // bit rough but ensures that the connection is released/closed
            try {
              OBDal.getInstance().rollbackAndClose();
            } catch (Exception ignored) {
            }

            // store the error
            importEntryManager.setImportEntryErrorIndependent(importEntry.getId(), t);
          }
        }
        if (logger.isDebugEnabled()) {
          logger.debug("Runnable: " + key + ", processed " + cnt + " import entries in " + totalT
              + " millis, " + (totalT / cnt) + " per import entry, current queue size: "
              + importEntries.size());

        }
      } finally {

        // bit rough but ensures that the connection is released/closed
        try {
          OBDal.getInstance().rollbackAndClose();
        } catch (Exception ignored) {
        }

        if (!importEntryProcessor.deregisterProcessThread(this)) {
          // a new entry was added when we tried to deregister, restart ourselves
          run();
        } else {
          importEntryIds.clear();
          cachedOBContexts.clear();
        }
      }
    }

    protected Queue<ImportEntry> getImportEntryQueue() {
      return importEntries;
    }

    /**
     * EntityAccessChecking uses the {@link EntityAccessChecker}. This class needs to be initialized
     * when it is used for the first time. This is often the case in import entry processing as
     * OBContexts (which holds an instance of the {@link EntityAccessChecker}) can be created for
     * each ImportEntry which is processed. Entity access checking is not always needed as access to
     * specific services is already checked by using form access and role checks.
     * 
     * Depending on the service which processes the data this check was already done and no new
     * checks are needed. As a default the entity access checking is enabled.
     */
    protected boolean isEntityAccessCheckingNeeded() {
      return true;
    }

    protected void setOBContext(ImportEntry importEntry) {
      final String userId = (String) DalUtil.getId(importEntry.getCreatedBy());
      final String orgId = (String) DalUtil.getId(importEntry.getOrganization());
      final String cacheKey = userId + "_" + orgId;
      OBContext obContext = cachedOBContexts.get(cacheKey);
      if (obContext != null) {
        OBContext.setOBContext(obContext);
      } else {
        final String clientId = (String) DalUtil.getId(importEntry.getClient());
        OBContext.setOBContext(userId, null, clientId, orgId);
        cachedOBContexts.put(cacheKey, OBContext.getOBContext());
        obContext = OBContext.getOBContext();
      }

      obContext.setDoEntityAccessChecking(isEntityAccessCheckingNeeded());

      OBContext.setAdminMode();
      try {
        final VariablesSecureApp variablesSecureApp = new VariablesSecureApp(obContext.getUser()
            .getId(), obContext.getCurrentClient().getId(), obContext.getCurrentOrganization()
            .getId(), obContext.getRole().getId(), obContext.getLanguage().getLanguage());

        RequestContext.get().setVariableSecureApp(variablesSecureApp);
      } finally {
        OBContext.restorePreviousMode();
      }
    }

    protected void cleanUpThreadForNextCycle() {
      OBContext.setOBContext((OBContext) null);
      RequestContext.get().setVariableSecureApp(null);
    }

    /**
     * Must be implemented by a subclass. Note subclass implementation must do its own commit of a
     * transaction or setting admin mode.
     */
    protected abstract void processEntry(ImportEntry importEntry) throws Exception;

    public void setImportEntryManager(ImportEntryManager importEntryManager) {
      this.importEntryManager = importEntryManager;
    }

    public void setKey(String key) {
      this.key = key;
    }

    private void addEntry(ImportEntry importEntry) {
      if (!importEntryIds.contains(importEntry.getId())) {

        // hardcoded way of not letting the mem usage to get out of hand
        // duplicates are also handled above in the code
        if (importEntryIds.size() > 10000) {
          importEntryIds.clear();
        }

        importEntryIds.add(importEntry.getId());
        importEntries.add(importEntry);
      }
    }

    public void setImportEntryProcessor(ImportEntryProcessor importEntryProcessor) {
      this.importEntryProcessor = importEntryProcessor;
    }

    public String getKey() {
      return key;
    }
  }
}
