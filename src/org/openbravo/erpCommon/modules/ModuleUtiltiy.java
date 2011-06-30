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
 * All portions are Copyright (C) 2008-2011 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.erpCommon.modules;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.data.FieldProvider;
import org.openbravo.database.ConnectionProvider;
import org.openbravo.erpCommon.ad_forms.MaturityLevel;
import org.openbravo.erpCommon.obps.ActivationKey;
import org.openbravo.model.ad.module.Module;
import org.openbravo.model.ad.module.ModuleDependency;
import org.openbravo.model.ad.system.SystemInformation;

/**
 * This class implements different utilities related to modules
 * 
 * 
 */
public class ModuleUtiltiy {
  protected static Logger log4j = Logger.getLogger(ModuleUtiltiy.class);
  public final static String TEMPLATE_30 = "0138E7A89B5E4DC3932462252801FFBC";
  public final static String APRM_MODULE = "A918E3331C404B889D69AA9BFAFB23AC";

  /**
   * It receives an ArrayList<String> with modules IDs and returns the same list ordered taking into
   * account the module dependency tree.
   * <p/>
   * Note that the module list must be a complete list of modules, no dependencies will be checked
   * for more than one level of deep, this means that passing an incomplete list might not be
   * ordered correctly.
   * 
   * @param modules
   *          List of module to order
   * @return modules list ordered
   * @throws Exception
   */
  public static List<String> orderByDependency(List<String> modules) throws Exception {

    Map<String, List<String>> modsWithDeps = getModsDeps(modules);
    List<String> rt = orderDependencies(modsWithDeps);
    return rt;
  }

  /**
   * Deprecated use {@link ModuleUtiltiy#orderByDependency(List)} instead
   * 
   * @param conn
   * @param modules
   */
  @Deprecated
  public static ArrayList<String> orderByDependency(ConnectionProvider conn,
      ArrayList<String> modules) {
    try {
      return (ArrayList<String>) orderByDependency(modules);
    } catch (Exception e) {
      log4j.error("error in orderByDependency", e);
      return modules;
    }
  }

  /**
   * Modifies the passed modules {@link FieldProvider} parameter ordering it taking into account
   * dependencies.
   * <p/>
   * 
   * @param modules
   *          {@link FieldProvider} that will be sorted. It must contain at least a field named
   *          <i>adModuleId</i>
   * @throws Exception
   */
  public static void orderModuleByDependency(FieldProvider[] modules) throws Exception {
    OBContext.setAdminMode();
    try {
      List<Module> allModules = OBDal.getInstance().createCriteria(Module.class).list();
      ArrayList<String> allMdoulesId = new ArrayList<String>();
      for (Module mod : allModules) {
        allMdoulesId.add(mod.getId());
      }
      List<String> modulesOrder = orderByDependency(allMdoulesId);

      FieldProvider[] fpModulesOrder = new FieldProvider[modules.length];
      int i = 0;
      for (String modId : modulesOrder) {
        for (int j = 0; j < modules.length; j++) {
          if (modules[j].getField("adModuleId").equals(modId)) {
            fpModulesOrder[i] = modules[j];
            i++;
          }
        }
      }

      for (int j = 0; j < modules.length; j++) {
        modules[j] = fpModulesOrder[j];
      }
    } finally {
      OBContext.restorePreviousMode();
    }

  }

  /**
   * Deprecated, use instead {@link ModuleUtiltiy#orderModuleByDependency(FieldProvider[])}
   * 
   * @param pool
   * @param modules
   */
  @Deprecated
  public static void orderModuleByDependency(ConnectionProvider pool, FieldProvider[] modules) {
    try {
      orderModuleByDependency(modules);
    } catch (Exception e) {
      log4j.error("Error in orderModuleByDependency", e);
    }
  }

  /**
   * Orders modules by dependencies. It adds to a List the modules that have not dependencies to the
   * ones in the list and calls itself recursively
   */
  private static List<String> orderDependencies(Map<String, List<String>> modsWithDeps)
      throws Exception {
    ArrayList<String> rt = new ArrayList<String>();

    for (String moduleId : modsWithDeps.keySet()) {
      if (noDependenciesFromModule(moduleId, modsWithDeps)) {
        rt.add(moduleId);
      }
    }

    for (String modId : rt) {
      modsWithDeps.remove(modId);
    }

    if (rt.size() == 0) {
      throw new Exception("Recursive module dependencies found!" + modsWithDeps.size());
    }

    if (modsWithDeps.size() != 0) {
      rt.addAll(orderDependencies(modsWithDeps));
    }
    return rt;
  }

  /**
   * Checks the module has not dependencies to other modules in the list
   * 
   */
  private static boolean noDependenciesFromModule(String checkModule,
      Map<String, List<String>> modsWithDeps) {

    List<String> moduleDependencies = modsWithDeps.get(checkModule);

    for (String module : modsWithDeps.keySet()) {
      if (moduleDependencies.contains(module)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns a Map with all the modules and their dependencies
   */
  private static Map<String, List<String>> getModsDeps(List<String> modules) {
    Map<String, List<String>> rt = new HashMap<String, List<String>>();
    for (String moduleId : modules) {
      Module module = OBDal.getInstance().get(Module.class, moduleId);
      ArrayList<String> deps = new ArrayList<String>();
      for (ModuleDependency dep : module.getModuleDependencyList()) {
        deps.add(dep.getDependentModule().getId());
      }
      rt.put(moduleId, deps);
    }
    return rt;
  }

  /**
   * Obtains the global minimum maturity levels defined for module installation and update.
   * 
   * For installation these 2 values might be different, for update both values are set with the
   * MaturityUpdate, this makes new modules installed because of needed dependencies in scan for
   * updates not to be in a lower level than the update one.
   * 
   * @param install
   *          <ul>
   *          <li><code>true</code>: Module installation
   *          <li><code>false</code>: Module update
   *          </ul>
   * @return HashMap with install.level and update.level keys.
   */
  public static HashMap<String, String> getSystemMaturityLevels(boolean install) {
    try {
      OBContext.setAdminMode();
      boolean activeInstance = ActivationKey.getInstance().isActive();

      HashMap<String, String> maturityLevels = new HashMap<String, String>();
      SystemInformation sys = OBDal.getInstance().get(SystemInformation.class, "0");

      String updateLevel = sys.getMaturityUpdate();
      String installLevel = sys.getMaturitySearch();

      if (!activeInstance) {
        if (updateLevel != null && Integer.parseInt(updateLevel) >= MaturityLevel.GA_MATURITY) {
          updateLevel = Integer.toString(MaturityLevel.CR_MATURITY);
        }

        if (installLevel != null && Integer.parseInt(installLevel) >= MaturityLevel.GA_MATURITY) {
          installLevel = Integer.toString(MaturityLevel.CR_MATURITY);
        }
      }

      maturityLevels.put("update.level", updateLevel);
      if (install) {
        maturityLevels.put("install.level", installLevel);
      } else {
        maturityLevels.put("install.level", updateLevel);
      }
      maturityLevels.put("isProfessional", activeInstance ? "true" : "false");
      return maturityLevels;
    } finally {
      OBContext.restorePreviousMode();
    }
  }
}
