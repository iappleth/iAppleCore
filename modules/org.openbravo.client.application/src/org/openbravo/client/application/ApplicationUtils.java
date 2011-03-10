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
 * All portions are Copyright (C) 2010-2011 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.client.application;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.apache.log4j.Logger;
import org.hibernate.criterion.Expression;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.model.Property;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.model.ad.access.Role;
import org.openbravo.model.ad.access.RoleOrganization;
import org.openbravo.model.ad.access.User;
import org.openbravo.model.ad.access.UserRoles;
import org.openbravo.model.ad.ui.Field;
import org.openbravo.model.ad.ui.Tab;
import org.openbravo.model.ad.ui.Window;

/**
 * Utility class for common operations
 * 
 * @author iperdomo
 */
public class ApplicationUtils {

  private static Logger log = Logger.getLogger(ApplicationUtils.class);

  static boolean showWindowInClassicMode(Window window) {
    List<String> reasonsToBeShownInClassic = new ArrayList<String>();
    showWindowInClassicMode(window, reasonsToBeShownInClassic);
    return reasonsToBeShownInClassic.size() > 0;
  }

  static void showWindowInClassicMode(Window window, List<String> reasonsToBeShownInClassic) {
    // FIXME Remove this once ImageBLOB is implemented
    // Currently, windows with ImageBLOB reference columns will be shown in classic mode
    String qryStr = "as f where f.column.reference.id = '4AA6C3BE9D3B4D84A3B80489505A23E5' "
        + "and f.tab.window.id = :windowId ";
    List<String> reasonsOfWindow = new ArrayList<String>();
    OBQuery<Field> qry = OBDal.getInstance().createQuery(Field.class, qryStr);
    qry.setNamedParameter("windowId", window.getId());
    if (qry.count() > 0) {
      String reason = "   One or more columns in the window " + window.getName()
          + " have an ImageBLOB reference ";
      reasonsOfWindow.add(reason);
    }

    for (Tab tab : window.getADTabList()) {
      if (tab.getSQLWhereClause() != null && tab.getHqlwhereclause() == null) {
        // There is a tab with a SQL whereclause, but without a defined HQL whereclause
        reasonsOfWindow.add("   The tab " + tab.getName() + " of the window " + window.getName()
            + " has a SQLWhereClause, but not an HQLWhereClause");
      }
      if (tab.getSQLOrderByClause() != null && tab.getHqlorderbyclause() == null) {
        // There is a tab with a SQL order by clause, but without a defined HQL order by clause
        reasonsOfWindow.add("   The tab " + tab.getName() + " of the window " + window.getName()
            + " has a SQLOrderByClause, but not an HQLOrderByClause");
      }
      if (tab.getFilterClause() != null && tab.getHqlfilterclause() == null) {
        // There is a tab with a SQL filter clause, but without a defined HQL filter clause
        reasonsOfWindow.add("   The tab " + tab.getName() + " of the window " + window.getName()
            + " has a FilterClause, but not an HQLFilterClause");
      }
      if (tab.getMasterDetailForm() != null) {
        // There is a tab which is a manual form
        reasonsOfWindow.add("   The tab " + tab.getName() + " of the window " + window.getName()
            + " is a manual form");
      }
    }
    if (reasonsOfWindow.size() > 0) {
      reasonsToBeShownInClassic.add("Window: " + window.getName());
      reasonsToBeShownInClassic.addAll(reasonsOfWindow);
    }
  }

  /**
   * Computes the parent property for a certain tab and its parent tab. The parentProperty is the
   * property in the entity of the tab pointing to the parent tab.
   * 
   * @param tab
   *          the child tab
   * @param parentTab
   *          the parent tab
   * @return the parentproperty in the source entity pointing to the parent
   */
  public static String getParentProperty(Tab tab, Tab parentTab) {
    final Entity thisEntity = ModelProvider.getInstance().getEntity(tab.getTable().getName());
    final Entity parentEntity = ModelProvider.getInstance().getEntity(
        parentTab.getTable().getName());
    Property returnProperty = null;
    // first try the real parent properties
    for (Property property : thisEntity.getProperties()) {
      if (property.isPrimitive() || property.isOneToMany()) {
        continue;
      }
      if (property.isParent() && property.getTargetEntity() == parentEntity) {
        returnProperty = property;
        break;
      }
    }
    // not found try any property
    if (returnProperty == null) {
      for (Property property : thisEntity.getProperties()) {
        if (property.isPrimitive() || property.isOneToMany()) {
          continue;
        }
        if (property.getTargetEntity() == parentEntity) {
          returnProperty = property;
          break;
        }
      }
    }
    // handle a special case, the property is an id, in that case
    // use the related foreign key column to the parent
    if (returnProperty.isId()) {
      for (Property property : thisEntity.getProperties()) {
        if (property.isOneToOne() && property.getTargetEntity() == parentEntity) {
          returnProperty = property;
          break;
        }
      }
    }
    return (returnProperty != null ? returnProperty.getName() : "");
  }

  public static boolean isClientAdmin() {
    return OBContext.getOBContext().getRole().isClientAdmin();
  }

  public static boolean isOrgAdmin() {
    return getAdminOrgs().size() > 0;
  }

  public static boolean isRoleAdmin() {
    return getAdminRoles().size() > 0;
  }

  public static List<RoleOrganization> getAdminOrgs() {
    final Role role = OBContext.getOBContext().getRole();
    try {
      OBContext.setAdminMode();

      final OBCriteria<RoleOrganization> roleOrgs = OBDal.getInstance().createCriteria(
          RoleOrganization.class);
      roleOrgs.add(Expression.eq(RoleOrganization.PROPERTY_ROLE, role));
      roleOrgs.add(Expression.eq(RoleOrganization.PROPERTY_ORGADMIN, true));

      return roleOrgs.list();

    } catch (Exception e) {
      log.error("Error checking Role is organization admin: " + e.getMessage(), e);
    } finally {
      OBContext.restorePreviousMode();
    }
    return Collections.emptyList();
  }

  public static List<UserRoles> getAdminRoles() {
    final User user = OBContext.getOBContext().getUser();
    try {
      OBContext.setAdminMode();

      final OBCriteria<UserRoles> userRoles = OBDal.getInstance().createCriteria(UserRoles.class);
      userRoles.add(Expression.eq(UserRoles.PROPERTY_USERCONTACT, user));
      userRoles.add(Expression.eq(UserRoles.PROPERTY_ROLEADMIN, true));

      return userRoles.list();

    } catch (Exception e) {
      log.error("Error checking if User is role admin: " + e.getMessage(), e);
    } finally {
      OBContext.restorePreviousMode();
    }
    return Collections.emptyList();
  }

  /**
   * Checks whether the reference of a field is button.
   * 
   * Caution: this check is done by checking hardcoded reference ID 28.
   * 
   * @param field
   *          Field to check
   * @return true in case it is button, false if not
   */
  public static boolean isUIButton(Field field) {
    return "28".equals(field.getColumn().getReference().getId());
  }
}
