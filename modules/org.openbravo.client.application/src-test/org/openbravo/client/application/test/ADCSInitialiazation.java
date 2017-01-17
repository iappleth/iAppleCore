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

package org.openbravo.client.application.test;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.Matchers.empty;
import static org.junit.Assert.assertThat;
import static org.junit.Assume.assumeTrue;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import javax.inject.Inject;

import org.hibernate.Query;
import org.junit.Test;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.base.weld.test.WeldBaseTest;
import org.openbravo.client.application.attachment.AttachmentUtils;
import org.openbravo.client.application.window.ApplicationDictionaryCachedStructures;
import org.openbravo.client.kernel.RequestContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.ad.ui.Field;
import org.openbravo.model.ad.utility.AttachmentMethod;
import org.openbravo.test.base.HiddenObjectHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Test cases to ensure correct concurrent initialization of ADCS.
 * 
 * @author alostale
 *
 */
public class ADCSInitialiazation extends WeldBaseTest {
  private static final Logger log = LoggerFactory.getLogger(ADCSInitialiazation.class);

  @Inject
  ApplicationDictionaryCachedStructures adcs;

  List<Exception> exceptions = new ArrayList<>();

  @Test
  public void aDCSshouldBeCorrectlyInitialized() {
    assumeTrue("Cache can be used (no modules in development)", adcs.useCache());

    int maxThreads = Runtime.getRuntime().availableProcessors() * 2;
    log.info("Starting ADCS initialization with {} threads.", maxThreads);
    ExecutorService executor = Executors.newFixedThreadPool(maxThreads);
    for (int i = 0; i < maxThreads; i++) {
      executor.execute(new ADCSEagerInitializator(i));
    }

    executor.shutdown();
    try {
      executor.awaitTermination(20L, TimeUnit.MINUTES);
    } catch (InterruptedException e) {
      log.error("Error in execution", e);
    }
    if (!exceptions.isEmpty()) {
      log.error("Executed with " + exceptions.size() + " exceptions");
      for (Exception e : exceptions) {
        log.error("-------------------");
        log.error("Exception", e);
        log.error("-------------------");
      }
    }
    assertThat("Exceptions while initializating ADCS", exceptions, is(empty()));
  }

  /** Initializes ADCS eagerly */
  private class ADCSEagerInitializator implements Runnable {
    private int threadNum;

    public ADCSEagerInitializator(int threadNum) {
      this.threadNum = threadNum;
    }

    @Override
    public void run() {
      try {
        Thread.sleep(threadNum * 500);
      } catch (InterruptedException ignored) {
      }

      VariablesSecureApp fakedVars = new VariablesSecureApp(null, null, null);
      try {
        HiddenObjectHelper.set(RequestContext.get(), "variablesSecureApp", fakedVars);
      } catch (Exception e) {
        log.error("Errror initializating context", e);
      }

      setSystemAdministratorContext();
      try {
        eagerADCSInitialization();
      } catch (Exception e) {
        synchronized (exceptions) {
          exceptions.add(e);
        }
        run();
      }
    }

    @SuppressWarnings("unchecked")
    private void eagerADCSInitialization() throws Exception {
      log.info("Starting eager initialization");

      Query queryTabs = OBDal.getInstance().getSession()
          .createQuery("select id from ADTab where active=true");

      List<String> tabs = queryTabs.list();
      long t = System.currentTimeMillis();
      int i = 0;
      for (String tabId : tabs) {
        adcs.getTab(tabId);

        if (++i % 100 == 0) {
          log.info("tab {}/{}", i, tabs.size());
        }
      }
      log.info("Intialized all tabs in {} ms", System.currentTimeMillis() - t);

      Query queryCombo = OBDal
          .getInstance()
          .getSession()
          .createQuery(
              "select f.id from ADField f where f.active=true and f.column.reference.id in ('18','17','19')");

      List<String> combos = queryCombo.list();
      long t1 = System.currentTimeMillis();
      i = 0;
      for (String comboId : combos) {
        adcs.getComboTableData(OBDal.getInstance().getProxy(Field.class, comboId));

        if (++i % 100 == 0) {
          log.info("combo {}/{}", i, combos.size());
        }
      }
      log.info("Intialized all combos in {} ms", System.currentTimeMillis() - t1);

      AttachmentMethod attMethod = AttachmentUtils.getDefaultAttachmentMethod();
      i = 0;
      t1 = System.currentTimeMillis();
      for (String tabId : tabs) {
        adcs.getMethodMetadataParameters(attMethod.getId(), tabId);

        if (++i % 100 == 0) {
          log.info("att method {}/{}", i, tabs.size());
        }
      }
      log.info("Intialized all attachemnt methods in {} ms", System.currentTimeMillis() - t1);

      log.info("Completed eager initialization in {} ms", System.currentTimeMillis() - t);
    }
  }
}
