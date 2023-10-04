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
 * All portions are Copyright (C) 2023 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.role;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.apache.commons.lang.StringUtils;
import org.hibernate.query.Query;
import org.openbravo.dal.core.SessionHandler;
import org.openbravo.model.ad.access.Role;

public class RoleAccessUtils {

  private static Map<String, List<String>> ACCESS_LEVEL_FOR_USER_LEVEL = Map.of( //
      "S", List.of("4", "7", "6"), //
      " CO", List.of("7", "6", "3", "1"), //
      " C", List.of("7", "6", "3", "1"), //
      "  O", List.of("3", "1", "7"));

  public static boolean isAutoRole(String role) {
    // @formatter:off
    final String roleQryStr = "select r.manual"
    + " from ADRole r"
    + " where r.id= :targetRoleId"
    + " and r.active= 'Y'";
    // @formatter:on
    final Query<Boolean> qry = SessionHandler.getInstance()
        .createQuery(roleQryStr, Boolean.class)
        .setParameter("targetRoleId", role);
    return !qry.uniqueResult();
  }

  public static String getUserLevel(String role) {
    // @formatter:off
    final String roleQryStr = "select r.userLevel"
    + " from ADRole r"
    + " where r.id= :targetRoleId"
    + " and r.active= 'Y'";
    // @formatter:on
    final Query<String> qry = SessionHandler.getInstance()
        .createQuery(roleQryStr, String.class)
        .setParameter("targetRoleId", role);
    return qry.uniqueResult();
  }

  /**
   * Returns the expected table access levels for a given user level
   *
   * <pre>
   * Table Access Level:
   * "6" -> "System/Client"
   * "1" -> "Organization"
   * "3" -> "Client/Organization"
   * "4" -> "System only"
   * "7" -> "All"
   *
   * User level:
   * "S"    ->  "System"
   * " C"   ->  "Client"
   * "  O"   ->  "Organization"
   * " CO"  ->  "Client+Organization"
   * </pre>
   *
   * @param userLevel
   *          User Level ("S", " C", " O", " CO")
   * @return List of access levels corresponding to the user level
   */
  public static List<String> getAccessLevelForUserLevel(String userLevel) {
    return ACCESS_LEVEL_FOR_USER_LEVEL.get(userLevel);
  }

  public static List<String> getOrganizationsForAutoRoleByClient(Role role) {
    return getOrganizationsForAutoRoleByClient(role.getClient().getId(), role.getId());
  }

  public static List<String> getOrganizationsForAutoRoleByClient(String clientId, String roleId) {
    String userLevel = getUserLevel(roleId);
    List<String> organizations = new ArrayList<>();

    // " CO" Client/Organization level: *, other Orgs (but *)
    // " O" Organization level: Orgs (but *) [isOrgAdmin=Y]
    if (StringUtils.equals(userLevel, " CO") || StringUtils.equals(userLevel, "  O")) {
      // @formatter:off
      final String orgsQryStr = "select o.id"
          + " from Organization o"
          + " where o.client.id= :clientId"
          + "   and o.id <>'0'"
          + "   and o.active= 'Y' "
          + "   and not exists ( select 1 "
          + "   from ADRoleOrganization roa where (o.id=roa.organization.id)"
          + "   and roa.role.id= :roleId"
          + "   and roa.active= 'N')"
          + " order by o.id desc";
      // @formatter:on
      final Query<String> qry = SessionHandler.getInstance()
          .createQuery(orgsQryStr, String.class)
          .setParameter("clientId", clientId)
          .setParameter("roleId", roleId);
      organizations.addAll(qry.list());
    }

    // Client or System level: Only *
    if (StringUtils.equals(userLevel, " C") || StringUtils.equals(userLevel, "S")
        || StringUtils.equals(userLevel, " CO")) {
      organizations.add("0");
    }
    return organizations;
  }
}
