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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.enterprise.inject.Any;
import javax.enterprise.inject.Instance;
import javax.inject.Inject;

import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.hibernate.criterion.Restrictions;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.base.structure.InheritedAccessEnabled;
import org.openbravo.base.weld.WeldUtils;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.ad.access.FieldAccess;
import org.openbravo.model.ad.access.Role;
import org.openbravo.model.ad.access.RoleInheritance;
import org.openbravo.model.ad.access.TabAccess;
import org.openbravo.model.ad.access.WindowAccess;
import org.openbravo.model.ad.alert.AlertRecipient;
import org.openbravo.model.ad.domain.Preference;

public class RoleInheritanceManager {

  private static final Logger log4j = Logger.getLogger(RoleInheritanceManager.class);
  private static final Set<String> propertyBlackList = new HashSet<String>(Arrays.asList(
      "OBUIAPP_RecentDocumentsList", "OBUIAPP_RecentViewList", "OBUIAPP_GridConfiguration",
      "OBUIAPP_DefaultSavedView", "UINAVBA_RecentLaunchList"));

  private static final int ACCESS_NOT_CHANGED = 0;
  private static final int ACCESS_UPDATED = 1;
  private static final int ACCESS_CREATED = 2;

  private String className;
  private String securedElement;
  private List<String> skippedProperties;
  @Inject
  @Any
  private Instance<AccessTypeInjector> accessTypeInjectors;

  /**
   * Constructor of the class.
   */
  public RoleInheritanceManager() {
  }

  /**
   * Initializes the manager according to the entered class name of the access type.
   * 
   * @param classCanonicalName
   *          class name of the permissions that will be handled by the manager
   * @throws Exception
   */
  public void init(String classCanonicalName) throws Exception {
    AccessTypeInjector injector = getInjector(classCanonicalName);
    if (injector != null) {
      initialize(injector);
    } else {
      throw new Exception("No injector found for class name " + classCanonicalName);
    }
  }

  /**
   * Initializes the required elements of the manager.
   * 
   * @param injector
   *          injector used to retrieve the access type information
   */
  private void initialize(AccessTypeInjector injector) {
    this.className = injector.getClassName();
    this.securedElement = injector.getSecuredElement();
    this.skippedProperties = new ArrayList<String>(Arrays.asList("creationDate", "createdBy"));
    if ("org.openbravo.model.ad.alert.AlertRecipient".equals(className)) {
      skippedProperties.add("role");
    } else if ("org.openbravo.model.ad.domain.Preference".equals(className)) {
      skippedProperties.add("visibleAtRole");
    }
  }

  /**
   * Returns the name of the inheritable class.
   * 
   * @return A String with the class name
   */
  public String getClassName() {
    return this.className;
  }

  /**
   * Returns the secured object.
   * 
   * @return a String with the name of the method to retrieve the secured element
   */
  public String getSecuredElement() {
    return this.securedElement;
  }

  /**
   * Returns the id of the secured object by the given inheritable class.
   * 
   * @param access
   *          An object of an inheritable class,i.e., a class that implements
   *          InheritedAccessEnabled.
   * 
   * @return A String with the id of the secured object
   */
  public String getSecuredElementIdentifier(InheritedAccessEnabled access) {
    try {
      Class<?> myClass = Class.forName(className);
      if ("org.openbravo.model.ad.domain.Preference".equals(className)) {
        return (String) myClass.getMethod(securedElement).invoke(access);
      }
      BaseOBObject bob = (BaseOBObject) myClass.getMethod(securedElement).invoke(access);
      String securedElementIndentifier = (String) DalUtil.getId(bob);
      return securedElementIndentifier;
    } catch (Exception ex) {
      log4j.error("Error getting secured element identifier", ex);
      throw new OBException("Error getting secured element identifier");
    }
  }

  /**
   * Sets the parent for an inheritable access object.
   * 
   * @param newAccess
   *          Access whose parent object will be set
   * @param parentAccess
   *          Access that is used in some cases to find the correct parent
   * @param role
   *          Parent role to set directly when applies
   */
  private void setParent(InheritedAccessEnabled newAccess, InheritedAccessEnabled parentAccess,
      Role role) {
    try {
      // TabAccess, FieldAccess and Preference do not have role property as parent
      if ("org.openbravo.model.ad.access.TabAccess".equals(className)) {
        TabAccess newTabAccess = (TabAccess) newAccess;
        TabAccess parentTabAccess = (TabAccess) parentAccess;
        setParentWindow(newTabAccess, parentTabAccess, role);
        // We need to have the new tab access in memory for the case where we are
        // adding field accesses also (when adding a new inheritance)
        newTabAccess.getWindowAccess().getADTabAccessList().add(newTabAccess);
      } else if ("org.openbravo.model.ad.access.FieldAccess".equals(className)) {
        setParentTab((FieldAccess) newAccess, (FieldAccess) parentAccess, role);
      } else if ("org.openbravo.model.ad.domain.Preference".equals(className)) {
        ((Preference) (newAccess)).setVisibleAtRole(role);
      } else {
        setParentRole(newAccess, role);
        if ("org.openbravo.model.ad.access.WindowAccess".equals(className)) {
          // We need to have the new window access in memory for the case where we are
          // adding tab accesses also (when adding a new inheritance)
          role.getADWindowAccessList().add((WindowAccess) newAccess);
        }
      }
    } catch (Exception ex) {
      log4j.error("Error setting parent ", ex);
      throw new OBException("Error setting parent");
    }
  }

  /**
   * Sets the parent role for an inheritable access object.
   * 
   * @param access
   *          Access whose parent role will be set
   * @param role
   *          Parent role
   */
  private void setParentRole(InheritedAccessEnabled access, Role role) {
    try {
      Class<?> myClass = Class.forName(className);
      myClass.getMethod("setRole", new Class[] { Role.class })
          .invoke(access, new Object[] { role });
    } catch (Exception ex) {
      log4j.error("Error setting parent role ", ex);
      throw new OBException("Error setting parent role");
    }
  }

  /**
   * Sets the parent window for a TabAccess.
   * 
   * @param newTabAccess
   *          TabAccess whose parent window will be set
   * @param parentTabAccess
   *          TabAccess used to retrieve the parent window
   * @param role
   *          Parent role
   */
  private void setParentWindow(TabAccess newTabAccess, TabAccess parentTabAccess, Role role) {
    String parentWindowId = (String) DalUtil.getId(parentTabAccess.getWindowAccess().getWindow());
    for (WindowAccess wa : role.getADWindowAccessList()) {
      String currentWindowId = (String) DalUtil.getId(wa.getWindow());
      if (currentWindowId.equals(parentWindowId)) {
        newTabAccess.setWindowAccess(wa);
        break;
      }
    }
  }

  /**
   * Sets the parent tab for a FieldAccess.
   * 
   * @param newFieldAccess
   *          FieldAccess whose parent tab will be set
   * @param parentFieldAccess
   *          FieldAccess used to retrieve the parent tab
   * @param role
   *          Parent role
   */
  private void setParentTab(FieldAccess newFieldAccess, FieldAccess parentFieldAccess, Role role) {
    String parentTabId = (String) DalUtil.getId(parentFieldAccess.getTabAccess().getTab());
    for (WindowAccess wa : role.getADWindowAccessList()) {
      for (TabAccess ta : wa.getADTabAccessList()) {
        String currentTabId = (String) DalUtil.getId(ta.getTab());
        if (currentTabId.equals(parentTabId)) {
          newFieldAccess.setTabAccess(ta);
          break;
        }
      }
    }
  }

  /**
   * Returns the role which the access given as parameter is assigned to.
   * 
   * @param access
   *          An inheritable access
   * 
   * @return the Role owner of the access
   */
  public Role getRole(InheritedAccessEnabled access) {
    // TabAccess, FieldAccess and Preference do not have role property as parent
    if ("org.openbravo.model.ad.access.TabAccess".equals(className)) {
      TabAccess tabAccess = (TabAccess) access;
      return tabAccess.getWindowAccess().getRole();
    } else if ("org.openbravo.model.ad.access.FieldAccess".equals(className)) {
      FieldAccess fieldAccess = (FieldAccess) access;
      return fieldAccess.getTabAccess().getWindowAccess().getRole();
    } else if ("org.openbravo.model.ad.domain.Preference".equals(className)) {
      Preference preference = (Preference) access;
      return preference.getVisibleAtRole();
    } else {
      return getParentRole(access);
    }
  }

  /**
   * Returns the role which the access given as parameter is assigned to. This method is used for
   * those inheritable accesses which Role is their parent entity.
   * 
   * @param access
   *          An inheritable access
   * 
   * @return the parent Role of the access
   */
  private Role getParentRole(InheritedAccessEnabled access) {
    try {
      Class<?> myClass = Class.forName(className);
      Role role = (Role) myClass.getMethod("getRole").invoke(access);
      return role;
    } catch (Exception ex) {
      log4j.error("Error getting role ", ex);
      throw new OBException("Error getting role");
    }
  }

  /**
   * Returns the list of accesses of a particular type for the Role given as parameter.
   * 
   * @param role
   *          The role whose list of accesses of a particular type will be retrieved
   * 
   * @return a list of accesses
   */
  @SuppressWarnings("unchecked")
  private <T extends BaseOBObject> List<? extends InheritedAccessEnabled> getAccessList(Role role) {
    try {
      String roleProperty = getRoleProperty(className);
      Class<T> clazz = (Class<T>) Class.forName(className);
      final StringBuilder whereClause = new StringBuilder();
      whereClause.append(" as p ");
      whereClause.append(" where p.").append(roleProperty).append(" = :roleId");
      addEntityWhereClause(whereClause, className);
      final OBQuery<T> query = OBDal.getInstance().createQuery(clazz, whereClause.toString());
      query.setNamedParameter("roleId", (String) DalUtil.getId(role));
      doEntityParameterReplacement(query, className);
      query.setFilterOnActive(false);
      return (List<? extends InheritedAccessEnabled>) query.list();
    } catch (Exception ex) {
      log4j.error("Error getting access list of class " + className, ex);
      throw new OBException("Error getting access list of class " + className);
    }
  }

  /**
   * Returns the role property retrieved from the class name.
   * 
   * @return the role property that can be retrieved according to the input class name.
   */
  private String getRoleProperty(String clazzName) {
    // TabAccess, FieldAccess and Preference do not have role property as parent
    if ("org.openbravo.model.ad.access.TabAccess".equals(clazzName)) {
      return "windowAccess.role.id";
    } else if ("org.openbravo.model.ad.access.FieldAccess".equals(clazzName)) {
      return "tabAccess.windowAccess.role.id";
    } else if ("org.openbravo.model.ad.domain.Preference".equals(clazzName)) {
      return "visibleAtRole.id";
    } else {
      return "role.id";
    }
  }

  /**
   * Includes in the where clause some filtering needed for same cases.
   * 
   * @param whereClause
   *          The where clause where the particular filtering will be included
   * @param clazzName
   *          The class name used to identify which filtering must be returned
   */
  private void addEntityWhereClause(StringBuilder whereClause, String clazzName) {
    if ("org.openbravo.model.ad.domain.Preference".equals(clazzName)) {
      // Inheritable preferences are those that only define the visibility at role level
      whereClause.append(" and p.visibleAtClient = null and p.visibleAtOrganization = null"
          + " and p.userContact = null and p.window = null");
      whereClause.append(" and p.property not in (:blackList)");
    } else if ("org.openbravo.model.ad.alert.AlertRecipient".equals(clazzName)) {
      whereClause.append(" and p.userContact is null");
    }
  }

  /**
   * Performs the needed parameter substitution according to the input class name.
   * 
   * @param query
   *          The query where to perform the parameter substitution
   * @param clazzName
   *          The class name used to identify if the parameter substitution is needed
   */
  private <T extends BaseOBObject> void doEntityParameterReplacement(OBQuery<T> query,
      String clazzName) {
    if ("org.openbravo.model.ad.domain.Preference".equals(clazzName)) {
      query.setNamedParameter("blackList", propertyBlackList);
    }
  }

  /**
   * Creates a new access by copying from the one introduced as parameter. In addition, it sets the
   * Inherit From field with the corresponding role.
   * 
   * @param parentAccess
   *          The access to be copied
   * @param role
   *          The role used to set the parent of the new access
   */
  private void copyRoleAccess(InheritedAccessEnabled parentAccess, Role role) {
    // copy the new access
    final InheritedAccessEnabled newAccess = (InheritedAccessEnabled) DalUtil.copy(
        (BaseOBObject) parentAccess, false);
    setParent(newAccess, parentAccess, role);
    newAccess.setInheritedFrom(getRole(parentAccess));
    OBDal.getInstance().save(newAccess);
  }

  /**
   * Deletes all accesses which are inheriting from a particular role.
   * 
   * @param inheritFromToDelete
   *          The role whose inherited accesses will be removed from the list
   * @param roleAccessList
   *          The list of accesses to remove from
   */
  private void deleteRoleAccess(Role inheritFromToDelete,
      List<? extends InheritedAccessEnabled> roleAccessList) {
    String inheritFromId = (String) DalUtil.getId(inheritFromToDelete);
    List<InheritedAccessEnabled> iaeToDelete = new ArrayList<InheritedAccessEnabled>();
    for (InheritedAccessEnabled ih : roleAccessList) {
      String inheritedFromId = ih.getInheritedFrom() != null ? (String) DalUtil.getId(ih
          .getInheritedFrom()) : "";
      if (!StringUtils.isEmpty(inheritedFromId) && inheritFromId.equals(inheritedFromId)) {
        iaeToDelete.add(ih);
      }
    }
    for (InheritedAccessEnabled iae : iaeToDelete) {
      iae.setInheritedFrom(null);
      removeChildReferences(iae);
      roleAccessList.remove(iae);
      OBDal.getInstance().remove(iae);
    }
  }

  /**
   * Sets to null the Inherit From field to child elements (TabAccess and FieldAccess). This allows
   * the cascade deletion of these elements when removing an inherited Window Access or Tab Access.
   * 
   * @param access
   *          The access to be removed from the parent list
   */
  private void clearInheritFromFieldInChilds(InheritedAccessEnabled access) {
    if ("org.openbravo.model.ad.access.WindowAccess".equals(className)) {
      WindowAccess wa = (WindowAccess) access;
      for (TabAccess ta : wa.getADTabAccessList()) {
        ta.setInheritedFrom(null);
        for (FieldAccess fa : ta.getADFieldAccessList()) {
          fa.setInheritedFrom(null);
        }
      }
    } else if ("org.openbravo.model.ad.access.TabAccess".equals(className)) {
      TabAccess ta = (TabAccess) access;
      for (FieldAccess fa : ta.getADFieldAccessList()) {
        fa.setInheritedFrom(null);
      }
    }
  }

  /**
   * Removes references to child elements (TabAccess and FieldAccess) from the parent list. Using
   * this method prevents the "deleted object would be re-saved by cascade" error after deleting an
   * inherited TabAccess or FieldAccess.
   * 
   * @param access
   *          The access to be removed from the parent list
   */
  private void removeChildReferences(InheritedAccessEnabled access) {
    if ("org.openbravo.model.ad.access.TabAccess".equals(className)) {
      TabAccess ta = (TabAccess) access;
      ta.getWindowAccess().getADTabAccessList().remove(ta);
    } else if ("org.openbravo.model.ad.access.FieldAccess".equals(className)) {
      FieldAccess fa = (FieldAccess) access;
      fa.getTabAccess().getADFieldAccessList().remove(fa);
    }
  }

  /**
   * Updates the fields of an access with the values of the access introduced as parameter. In
   * addition, it sets the Inherit From field with the corresponding role.
   * 
   * @param access
   *          The access to be updated
   * @param inherited
   *          The access with the values to update
   */
  private void updateRoleAccess(InheritedAccessEnabled access, InheritedAccessEnabled inherited) {
    final InheritedAccessEnabled updatedAccess = (InheritedAccessEnabled) DalUtil.copyToTarget(
        (BaseOBObject) inherited, (BaseOBObject) access, false, skippedProperties);
    // update the inherit from field, to indicate from which role we are inheriting now
    updatedAccess.setInheritedFrom(getRole(inherited));
  }

  /**
   * Applies all type of accesses based on the inheritance passed as parameter
   * 
   * @param inheritance
   *          The inheritance used to calculate the possible new accesses
   */
  public static void applyNewInheritance(RoleInheritance inheritance) {
    List<RoleInheritance> inheritanceList = getUpdatedRoleInheritancesList(inheritance, false);
    List<String> inheritanceRoleIdList = getRoleInheritancesInheritFromIdList(inheritanceList);
    List<RoleInheritance> newInheritanceList = new ArrayList<RoleInheritance>();
    newInheritanceList.add(inheritance);
    for (AccessTypeInjector accessType : getAccessTypeOrderByPriority(true)) {
      RoleInheritanceManager manager = WeldUtils
          .getInstanceFromStaticBeanManager(RoleInheritanceManager.class);
      try {
        manager.init(accessType.getClassName());
      } catch (Exception ex) {
        // Do nothing, the manager will be always initialized without errors in this method
      }
      manager.calculateAccesses(newInheritanceList, inheritanceRoleIdList);
    }
  }

  /**
   * Calculates all type of accesses after the removal of the inheritance passed as parameter
   * 
   * @param inheritance
   *          The inheritance being removed
   */
  public static void applyRemoveInheritance(RoleInheritance inheritance) {
    List<RoleInheritance> inheritanceList = getUpdatedRoleInheritancesList(inheritance, true);
    List<String> inheritanceRoleIdList = getRoleInheritancesInheritFromIdList(inheritanceList);
    for (AccessTypeInjector accessType : getAccessTypeOrderByPriority(false)) {
      // We need to retrieve the access types ordered descending by their priority, to force to
      // handle first 'child' accesses like TabAccess or ChildAccess which have a
      // priority number higher than their parent, WindowAccess. This way, child instances will be
      // deleted first when it applies.
      RoleInheritanceManager manager = WeldUtils
          .getInstanceFromStaticBeanManager(RoleInheritanceManager.class);
      try {
        manager.init(accessType.getClassName());
      } catch (Exception ex) {
        // Do nothing, the manager will be always initialized without errors in this method
      }
      manager.calculateAccesses(inheritanceList, inheritanceRoleIdList, inheritance);
    }
  }

  /**
   * Recalculates all accesses for those roles using as template the role passed as parameter
   * 
   * @param template
   *          The template role used by the roles whose accesses will be recalculated
   * @return a list of the child roles which have accesses that have been updated or created
   */
  public static List<Role> recalculateAllAccessesFromTemplate(Role template) {
    List<Role> updatedRoles = new ArrayList<Role>();
    for (RoleInheritance ri : template.getADRoleInheritanceInheritFromList()) {
      Map<String, List<Integer>> result = recalculateAllAccessesForRole(ri.getRole());
      for (String accessClassName : result.keySet()) {
        List<Integer> counters = (List<Integer>) result.get(accessClassName);
        int updated = counters.get(0);
        int created = counters.get(1);
        if (updated > 0 || created > 0) {
          updatedRoles.add(ri.getRole());
        }
      }
    }
    return updatedRoles;
  }

  /**
   * Recalculates all accesses for a given role
   * 
   * @param role
   *          The role whose accesses will be recalculated
   * @return a map with the number of accesses updated and created for every access type
   */
  public static Map<String, List<Integer>> recalculateAllAccessesForRole(Role role) {
    Map<String, List<Integer>> result = new HashMap<String, List<Integer>>();
    List<RoleInheritance> inheritanceList = getRoleInheritancesList(role);
    List<String> inheritanceRoleIdList = getRoleInheritancesInheritFromIdList(inheritanceList);
    for (AccessTypeInjector accessType : getAccessTypeOrderByPriority(true)) {
      RoleInheritanceManager manager = WeldUtils
          .getInstanceFromStaticBeanManager(RoleInheritanceManager.class);
      try {
        manager.init(accessType.getClassName());
      } catch (Exception e) {
        // Do nothing, the manager will be always initialized without errors in this method
      }
      List<Integer> accessCounters = manager.calculateAccesses(inheritanceList,
          inheritanceRoleIdList);
      result.put(accessType.getClassName(), accessCounters);
    }
    return result;
  }

  /**
   * Recalculates the accesses whose type is assigned to the manager, for those roles using as
   * template the role passed as parameter
   * 
   * @param template
   *          The template role used by the roles whose accesses will be recalculated
   */
  public void recalculateAccessFromTemplate(Role template) {
    for (RoleInheritance ri : template.getADRoleInheritanceInheritFromList()) {
      recalculateAccessForRole(ri.getRole());
    }
  }

  /**
   * Recalculates the accesses whose type is assigned to the manager for a given role
   * 
   * @param role
   *          The role whose accesses will be recalculated
   */
  public void recalculateAccessForRole(Role role) {
    List<RoleInheritance> inheritanceList = getRoleInheritancesList(role);
    List<String> inheritanceRoleIdList = getRoleInheritancesInheritFromIdList(inheritanceList);
    calculateAccesses(inheritanceList, inheritanceRoleIdList);
  }

  /**
   * Propagates a new access assigned to a template role
   * 
   * @param role
   *          The template role whose new access will be propagated
   * @param access
   *          The new access to be propagated
   */
  public void propagateNewAccess(Role role, InheritedAccessEnabled access) {
    if ("org.openbravo.model.ad.domain.Preference".equals(className)
        && !isInheritablePreference((Preference) access)) {
      return;
    }
    if ("org.openbravo.model.ad.alert.AlertRecipient".equals(className)
        && !isInheritableAlertRecipient((AlertRecipient) access)) {
      return;
    }
    for (RoleInheritance ri : role.getADRoleInheritanceInheritFromList()) {
      List<RoleInheritance> inheritanceList = getRoleInheritancesList(ri.getRole());
      List<String> inheritanceRoleIdList = getRoleInheritancesInheritFromIdList(inheritanceList);
      handleAccess(ri, access, inheritanceRoleIdList);
    }
  }

  /**
   * Propagates an updated access of a template role
   * 
   * @param role
   *          The template role whose updated access will be propagated
   * @param access
   *          The updated access with the changes to propagate
   */
  public void propagateUpdatedAccess(Role role, InheritedAccessEnabled access) {
    if ("org.openbravo.model.ad.domain.Preference".equals(className)
        && !isInheritablePreference((Preference) access)) {
      return;
    }
    if ("org.openbravo.model.ad.alert.AlertRecipient".equals(className)
        && !isInheritableAlertRecipient((AlertRecipient) access)) {
      return;
    }
    for (RoleInheritance ri : role.getADRoleInheritanceInheritFromList()) {
      List<? extends InheritedAccessEnabled> roleAccessList = getAccessList(ri.getRole());
      InheritedAccessEnabled childAccess = findInheritedAccess(roleAccessList, access);
      if (childAccess != null) {
        updateRoleAccess(childAccess, access);
      }
    }
  }

  /**
   * Propagates a deleted access of a template role
   * 
   * @param role
   *          The template role whose deleted access will be propagated
   * @param access
   *          The removed access to be propagated
   */
  public void propagateDeletedAccess(Role role, InheritedAccessEnabled access) {
    if ("org.openbravo.model.ad.domain.Preference".equals(className)
        && !isInheritablePreference((Preference) access)) {
      return;
    }
    if ("org.openbravo.model.ad.alert.AlertRecipient".equals(className)
        && !isInheritableAlertRecipient((AlertRecipient) access)) {
      return;
    }
    for (RoleInheritance ri : role.getADRoleInheritanceInheritFromList()) {
      Role childRole = ri.getRole();
      List<? extends InheritedAccessEnabled> roleAccessList = getAccessList(childRole);
      InheritedAccessEnabled iaeToDelete = findInheritedAccess(roleAccessList, access);
      if (iaeToDelete != null) {
        // need to recalculate, look for this access in other inheritances
        String iaeToDeleteElementId = getSecuredElementIdentifier(iaeToDelete);
        boolean updated = false;
        // retrieve the list of templates, ordered by sequence number descending, to update the
        // access with the first one available (highest sequence number)
        List<Role> inheritFromList = getRoleInheritancesInheritFromList(childRole, role, false);
        for (Role inheritFrom : inheritFromList) {
          for (InheritedAccessEnabled inheritFromAccess : getAccessList(inheritFrom)) {
            String accessElementId = getSecuredElementIdentifier(inheritFromAccess);
            if (accessElementId.equals(iaeToDeleteElementId)) {
              updateRoleAccess(iaeToDelete, inheritFromAccess);
              updated = true;
              break;
            }
          }
          if (updated) {
            break;
          }
        }
        if (!updated) {
          // access not present in other inheritances, remove it
          iaeToDelete.setInheritedFrom(null);
          clearInheritFromFieldInChilds(iaeToDelete);
          removeChildReferences(iaeToDelete);
          roleAccessList.remove(iaeToDelete);
          OBDal.getInstance().remove(iaeToDelete);
        }
      }
    }
  }

  /**
   * Looks for a particular access into an accessList
   * 
   * @param accessList
   *          The accessList to look for
   * @param access
   *          The access to be found
   * @return the access being searched or null if not found
   */
  private InheritedAccessEnabled findInheritedAccess(
      List<? extends InheritedAccessEnabled> accessList, InheritedAccessEnabled access) {
    String accessElementId = getSecuredElementIdentifier(access);
    String accessRole = (String) DalUtil.getId(getRole(access));
    for (InheritedAccessEnabled iae : accessList) {
      String listElementId = getSecuredElementIdentifier(iae);
      String inheritFromRole = iae.getInheritedFrom() != null ? (String) DalUtil.getId(iae
          .getInheritedFrom()) : "";
      if (accessElementId.equals(listElementId) && accessRole.equals(inheritFromRole)) {
        return iae;
      }
    }
    return null;
  }

  /**
   * Utility method to determine if a preference is inheritable. An inheritable preference should
   * only define the role on its visibility settings and it must not be present in the black list.
   * 
   * @param preference
   *          The preference
   * @return true if the Preference is inheritable, false otherwise
   */
  private boolean isInheritablePreference(Preference preference) {
    if (preference.getVisibleAtClient() == null && preference.getVisibleAtOrganization() == null
        && preference.getUserContact() == null && preference.getWindow() == null
        && preference.getVisibleAtRole() != null) {
      return true;
    }
    if (preference.isPropertyList()) {
      return !propertyBlackList.contains(preference.getProperty());
    } else {
      return true;
    }
  }

  /**
   * Utility method to determine if an alert recipient is inheritable. An inheritable alert
   * recipient should have the User/Contact field empty.
   * 
   * @param alertRecipient
   *          The alert recipient instance
   * @return true if the AlertRecipient is inheritable, false otherwise
   */
  private boolean isInheritableAlertRecipient(AlertRecipient alertRecipient) {
    if (alertRecipient.getUserContact() != null) {
      return false;
    } else {
      return true;
    }
  }

  /**
   * @see RoleInheritanceManager#calculateAccesses(List<RoleInheritance>, List<String>,
   *      RoleInheritance)
   */
  private List<Integer> calculateAccesses(List<RoleInheritance> inheritanceList,
      List<String> inheritanceInheritFromIdList) {
    return calculateAccesses(inheritanceList, inheritanceInheritFromIdList, null);
  }

  /**
   * Calculate the inheritable accesses according to the inheritance list passed as parameter.
   * 
   * @param inheritanceList
   *          The list of inheritances used to calculate the accesses
   * @param inheritanceInheritFromIdList
   *          A list of template role ids. The position of the ids in this list determines the
   *          priority when applying their related inheritances.
   * @param roleInheritanceToDelete
   *          If not null, the accesses introduced by this inheritance will be removed
   * @return a list with two Integers containing the number of accesses updated and created
   *         respectively.
   */
  private List<Integer> calculateAccesses(List<RoleInheritance> inheritanceList,
      List<String> inheritanceInheritFromIdList, RoleInheritance roleInheritanceToDelete) {
    int[] counters = new int[] { 0, 0, 0 };
    for (RoleInheritance roleInheritance : inheritanceList) {
      for (InheritedAccessEnabled inheritedAccess : getAccessList(roleInheritance.getInheritFrom())) {
        if ("org.openbravo.model.ad.domain.Preference".equals(className)
            && !isInheritablePreference((Preference) inheritedAccess)) {
          continue;
        }
        if ("org.openbravo.model.ad.alert.AlertRecipient".equals(className)
            && !isInheritableAlertRecipient((AlertRecipient) inheritedAccess)) {
          continue;
        }
        int res = handleAccess(roleInheritance, inheritedAccess, inheritanceInheritFromIdList);
        counters[res]++;
      }
    }
    if (roleInheritanceToDelete != null) {
      // delete accesses not inherited anymore
      deleteRoleAccess(roleInheritanceToDelete.getInheritFrom(),
          getAccessList(roleInheritanceToDelete.getRole()));
    }
    List<Integer> result = new ArrayList<Integer>();
    result.add(new Integer(counters[ACCESS_UPDATED])); // number of accesses updated
    result.add(new Integer(counters[ACCESS_CREATED])); // number of accesses created
    return result;
  }

  /**
   * Determines if a access candidate to be inherited should be created, not created or updated.
   * 
   * @param roleInheritance
   *          Inheritance with the role information
   * @param inheritedAccess
   *          An existing access candidate to be overridden
   * @param inheritanceInheritFromIdList
   *          A list of template role ids which determines the priority of the template roles
   * @return an integer that indicates the final action done with the access: not changed
   *         (ACCESS_NOT_CHANGED), updated (ACCESS_UPDATED) or created (ACCESS_CREATED).
   */
  private int handleAccess(RoleInheritance roleInheritance, InheritedAccessEnabled inheritedAccess,
      List<String> inheritanceInheritFromIdList) {
    String inheritedAccessElementId = getSecuredElementIdentifier(inheritedAccess);
    String newInheritedFromId = (String) DalUtil.getId(roleInheritance.getInheritFrom());
    Role role = roleInheritance.getRole();
    for (InheritedAccessEnabled access : getAccessList(role)) {
      String accessElementId = getSecuredElementIdentifier(access);
      String currentInheritedFromId = access.getInheritedFrom() != null ? (String) DalUtil
          .getId(access.getInheritedFrom()) : "";
      if (accessElementId.equals(inheritedAccessElementId)) {
        if (!StringUtils.isEmpty(currentInheritedFromId)
            && isPrecedent(inheritanceInheritFromIdList, currentInheritedFromId, newInheritedFromId)) {
          updateRoleAccess(access, inheritedAccess);
          log4j.debug("Updated access for role " + role.getName() + ": class = " + className
              + " secured element id = " + inheritedAccessElementId);
          return ACCESS_UPDATED;
        }
        return ACCESS_NOT_CHANGED;
      }
    }
    copyRoleAccess(inheritedAccess, roleInheritance.getRole());
    log4j.debug("Created access for role " + role.getName() + ": class = " + className
        + " secured element id = " + inheritedAccessElementId);
    return ACCESS_CREATED;
  }

  /**
   * Utility method used to determine the precedence between two roles according to the given
   * priority list.
   * 
   * @param inheritanceInheritFromIdList
   *          A list of template role ids which determines the priority of the template roles
   * @param role1
   *          The first role to check its priority
   * @param role2
   *          The second role to check its priority
   * @return true if the first role is precedent to the second role, false otherwise
   */
  private boolean isPrecedent(List<String> inheritanceInheritFromIdList, String role1, String role2) {
    if (inheritanceInheritFromIdList.indexOf(role1) == -1) {
      // Not found, need to override (this can happen on delete or on update)
      return true;
    }
    if (inheritanceInheritFromIdList.indexOf(role1) < inheritanceInheritFromIdList.indexOf(role2)) {
      return true;
    }
    return false;
  }

  /**
   * @see RoleInheritanceManager#getRoleInheritancesList(Role, boolean)
   */
  public static List<RoleInheritance> getRoleInheritancesList(Role role) {
    return getRoleInheritancesList(role, true);
  }

  /**
   * @see RoleInheritanceManager#getRoleInheritancesList(Role, Role, boolean)
   */
  public static List<RoleInheritance> getRoleInheritancesList(Role role, boolean seqNoAscending) {
    return getRoleInheritancesList(role, null, true);
  }

  /**
   * Returns the list of inheritances of a role
   * 
   * @param role
   *          The role whose inheritance list will be retrieved
   * @param excludedInheritFrom
   *          A template role whose inheritance will be excluded from the returned list
   * @param seqNoAscending
   *          Determines of the list is returned by sequence number ascending (true) or descending
   * @return the list of inheritances of the role
   */
  public static List<RoleInheritance> getRoleInheritancesList(Role role, Role excludedInheritFrom,
      boolean seqNoAscending) {
    final OBCriteria<RoleInheritance> obCriteria = OBDal.getInstance().createCriteria(
        RoleInheritance.class);
    obCriteria.add(Restrictions.eq(RoleInheritance.PROPERTY_ROLE, role));
    if (excludedInheritFrom != null) {
      obCriteria.add(Restrictions.ne(RoleInheritance.PROPERTY_INHERITFROM, excludedInheritFrom));
    }
    obCriteria.addOrderBy(RoleInheritance.PROPERTY_SEQUENCENUMBER, seqNoAscending);
    return obCriteria.list();
  }

  /**
   * Returns the list of template roles which a particular role is using.
   * 
   * @param role
   *          The role whose parent template role list will be retrieved
   * @param excludedInheritFrom
   *          A template role that can be excluded from the list
   * @param seqNoAscending
   *          Determines of the list is returned by sequence number ascending (true) or descending
   * @return the list of template roles used by role
   */
  public static List<Role> getRoleInheritancesInheritFromList(Role role, Role excludedInheritFrom,
      boolean seqNoAscending) {
    List<RoleInheritance> inheritancesList = getRoleInheritancesList(role, excludedInheritFrom,
        seqNoAscending);
    final List<Role> inheritFromList = new ArrayList<Role>();
    for (RoleInheritance ri : inheritancesList) {
      inheritFromList.add(ri.getInheritFrom());
    }
    return inheritFromList;
  }

  /**
   * Returns the list of inheritances of the role owner of the inheritance passed as parameter. It
   * also verifies if this inheritance fulfills the unique constraints, before adding it to the
   * list.
   * 
   * @param inheritance
   *          inheritance that contains the role information
   * @param deleting
   *          a flag which determines whether the inheritance passed as parameter should be included
   *          in the returned list.
   * @return the list of role inheritances
   */
  private static List<RoleInheritance> getUpdatedRoleInheritancesList(RoleInheritance inheritance,
      boolean deleting) {
    final ArrayList<RoleInheritance> roleInheritancesList = new ArrayList<RoleInheritance>();
    final OBCriteria<RoleInheritance> obCriteria = OBDal.getInstance().createCriteria(
        RoleInheritance.class);
    obCriteria.add(Restrictions.eq(RoleInheritance.PROPERTY_ROLE, inheritance.getRole()));
    obCriteria
        .add(Restrictions.ne(RoleInheritance.PROPERTY_ID, (String) DalUtil.getId(inheritance)));
    obCriteria.addOrderBy(RoleInheritance.PROPERTY_SEQUENCENUMBER, true);
    boolean added = false;
    for (RoleInheritance rh : obCriteria.list()) {
      String inheritFromId = (String) DalUtil.getId(rh.getInheritFrom());
      String inheritanceInheritFromId = (String) DalUtil.getId(inheritance.getInheritFrom());
      if (inheritFromId.equals(inheritanceInheritFromId)) {
        Utility.throwErrorMessage("RoleInheritanceInheritFromDuplicated");
      } else if (rh.getSequenceNumber().equals(inheritance.getSequenceNumber())) {
        Utility.throwErrorMessage("RoleInheritanceSequenceNumberDuplicated");
      }
      if (!deleting && !added
          && rh.getSequenceNumber().longValue() > inheritance.getSequenceNumber().longValue()) {
        roleInheritancesList.add(inheritance);
        added = true;
      }
      roleInheritancesList.add(rh);
    }
    if (!deleting && !added) {
      roleInheritancesList.add(inheritance);
    }
    return roleInheritancesList;
  }

  /**
   * Returns the list of role template ids from an inheritance list.
   * 
   * @param roleInheritanceList
   *          a list of inheritances
   * @return the list of template role ids
   */
  private static List<String> getRoleInheritancesInheritFromIdList(
      List<RoleInheritance> roleInheritanceList) {
    final ArrayList<String> roleIdsList = new ArrayList<String>();
    for (RoleInheritance roleInheritance : roleInheritanceList) {
      roleIdsList.add((String) DalUtil.getId(roleInheritance.getInheritFrom()));
    }
    return roleIdsList;
  }

  /**
   * Returns the list of access types ordered by their priority value
   * 
   * @return the list of template access types
   */
  private static List<AccessTypeInjector> getAccessTypeOrderByPriority(boolean ascending) {
    RoleInheritanceManager manager = WeldUtils
        .getInstanceFromStaticBeanManager(RoleInheritanceManager.class);
    List<AccessTypeInjector> list = new ArrayList<AccessTypeInjector>();
    for (AccessTypeInjector injector : manager.accessTypeInjectors) {
      if (injector.hasValidAccess()) {
        list.add(injector);
      }
    }
    Collections.sort(list);
    if (!ascending) {
      Collections.reverse(list);
    }
    return list;
  }

  /**
   * Returns the injector for the access type related to the canonical name of the class entered as
   * parameter
   * 
   * @return the AccessTypeInjector used to retrieve the access type to be handled by the manager
   */
  private AccessTypeInjector getInjector(String classCanonicalName) {
    for (AccessTypeInjector injector : accessTypeInjectors) {
      if (injector.hasValidAccess() && classCanonicalName.equals(injector.getClassName())) {
        return injector;
      }
    }
    return null;
  }
}
