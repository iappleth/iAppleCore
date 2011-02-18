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
 * All portions are Copyright (C) 2009 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.client.kernel;

import java.util.List;

import org.hibernate.criterion.Expression;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.ad.module.Module;

/**
 * Base implementation, can be extended.
 * 
 * @author mtaal
 */
public abstract class BaseComponentProvider implements ComponentProvider {

  private Module module;

  public Module getModule() {
    if (module != null) {
      return module;
    }
    OBContext.setAdminMode();
    try {
      final OBCriteria<Module> modules = OBDal.getInstance().createCriteria(Module.class);
      modules.add(Expression.eq(Module.PROPERTY_JAVAPACKAGE, getModulePackageName()));
      if (modules.list().isEmpty()) {
        throw new IllegalStateException("Component " + this.getClass().getName()
            + " is not in a module or it does not belong to a package of a module. "
            + "Consider overriding the getModulePackageName method as it now returns " + "a value "
            + getModulePackageName() + " which does not correspond to a module package name");
      }
      module = modules.list().get(0);
      return module;
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  /**
   * Override this method if the component is in a different package than the module.
   * 
   * @return
   */
  protected String getModulePackageName() {
    return this.getClass().getPackage().getName();
  }

  public List<String> getTestResources() {
    return null;
  }
}
