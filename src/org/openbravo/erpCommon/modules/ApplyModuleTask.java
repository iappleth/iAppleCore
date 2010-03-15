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
 * The Initial Developer of the Original Code is Openbravo SLU 
 * All portions are Copyright (C) 2008-2010 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.erpCommon.modules;

import java.io.File;

import org.apache.log4j.Logger;
import org.apache.tools.ant.BuildException;
import org.openbravo.base.exception.OBException;
import org.openbravo.dal.core.DalInitializingTask;
import org.openbravo.database.CPStandAlone;
import org.openbravo.erpCommon.utility.AntExecutor;

/**
 * Ant task for ApplyModule class
 * 
 */
public class ApplyModuleTask extends DalInitializingTask {
  // private String propertiesFile;
  private String obDir;
  private static final Logger log4j = Logger.getLogger(ApplyModuleTask.class);

  public static void main(String[] args) {
    final String srcPath = args[0];
    final File srcDir = new File(srcPath);
    final File baseDir = srcDir.getParentFile();
    try {
      final AntExecutor antExecutor = new AntExecutor(baseDir.getAbsolutePath());
      antExecutor.runTask("apply.module.forked");
    } catch (final Exception e) {
      throw new OBException(e);
    }
  }

  public void execute() {
    // Initialize DAL only in case it is needed: modules have refrence data to be loaded
    CPStandAlone pool = new CPStandAlone(propertiesFile);
    ApplyModuleData[] ds = null;
    try {
      ds = ApplyModuleData.selectClientReferenceModules(pool);
    } catch (Exception e) {
      log4j.error("Error checking modules with reference data", e);
    }
    if (ds != null && ds.length > 0) {
      // Initialize DAL and execute
      super.execute();
    } else {
      try {
        ds = ApplyModuleData.selectTranslationModules(pool);
      } catch (Exception e) {
        log4j.error("Error checking modules with translation data", e);
      }
      if (ds != null && ds.length > 0) {
        // Execute without DAL
        doExecute();
      }
      // do not execute if not reference data nor translations present
    }
  }

  @Override
  public void doExecute() {
    try {
      if (obDir == null || obDir.equals(""))
        obDir = getProject().getBaseDir().toString();
      if (propertiesFile == null || propertiesFile.equals(""))
        propertiesFile = obDir + "/config/Openbravo.properties";
      final ApplyModule am = new ApplyModule(new CPStandAlone(propertiesFile), obDir);
      am.execute();
    } catch (final Exception e) {
      throw new BuildException(e);
    }
  }

  /*
   * public void setPropertiesFile(String propertiesFile) { this.propertiesFile = propertiesFile; }
   */
  public void setObDir(String obDir) {
    this.obDir = obDir;
  }
}
