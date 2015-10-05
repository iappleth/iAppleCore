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
package org.openbravo.roleInheritance;

import javax.enterprise.event.Observes;
import javax.inject.Inject;

import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.client.kernel.event.EntityDeleteEvent;
import org.openbravo.client.kernel.event.EntityNewEvent;
import org.openbravo.client.kernel.event.EntityPersistenceEventObserver;
import org.openbravo.client.kernel.event.EntityUpdateEvent;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.ad.access.Role;
import org.openbravo.model.ad.access.RoleInheritance;

/**
 * Listens to delete, update and save events for the {@link RoleInheritance} entity. This handler
 * takes care of recalculating the access of the role affected by the changes on its inheritance.
 */
public class RoleInheritanceEventHandler extends EntityPersistenceEventObserver {
  private static Entity[] entities = { ModelProvider.getInstance().getEntity(
      RoleInheritance.ENTITY_NAME) };

  @Inject
  private RoleInheritanceManager manager;

  @Override
  protected Entity[] getObservedEntities() {
    return entities;
  }

  public void onSave(@Observes EntityNewEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
    final RoleInheritance inheritance = (RoleInheritance) event.getTargetInstance();
    String inheritFromId = (String) DalUtil.getId(inheritance.getInheritFrom());
    // Check correct Inherit From
    if (!inheritance.getInheritFrom().isTemplate()) {
      Utility.throwErrorMessage("InheritFromNotTemplate");
    }
    // Check User Level
    if (!isSameUserLevel(inheritance.getRole(), inheritance.getInheritFrom())) {
      Utility.throwErrorMessage("DifferentUserLevelRoleInheritance");
    }
    // Check cycles
    if (existCycles(inheritance.getRole(), inheritFromId)) {
      Utility.throwErrorMessage("CyclesInRoleInheritance");
    } else {
      manager.applyNewInheritance(inheritance);
    }
  }

  public void onUpdate(@Observes EntityUpdateEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
    Utility.throwErrorMessage("RoleInheritanceNotEdit");
  }

  public void onDelete(@Observes EntityDeleteEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
    final RoleInheritance inheritance = (RoleInheritance) event.getTargetInstance();
    boolean notDeletingParent = OBDal.getInstance().exists(Role.ENTITY_NAME,
        (String) DalUtil.getId(inheritance.getRole()));
    if (notDeletingParent) {
      manager.applyRemoveInheritance(inheritance);
    }
  }

  private boolean isSameUserLevel(Role role1, Role role2) {
    String roleAccessLevel = role1.getUserLevel();
    String inheritFromAccessLevel = role2.getUserLevel();
    return roleAccessLevel.equals(inheritFromAccessLevel);
  }

  private boolean existCycles(Role role, String roleIdToFind) {
    boolean result = false;
    for (RoleInheritance ri : role.getADRoleInheritanceInheritFromList()) {
      if (roleIdToFind.equals((String) DalUtil.getId(ri.getRole()))) {
        return true;
      }
      result = existCycles(ri.getRole(), roleIdToFind);
    }
    return result;
  }
}
