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
package org.openbravo.test.security;

import static org.hamcrest.Matchers.equalTo;
import static org.junit.Assert.assertThat;

import java.util.HashMap;
import java.util.Map;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.criterion.Restrictions;
import org.junit.Test;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.ad.access.Role;
import org.openbravo.model.ad.access.RoleOrganization;
import org.openbravo.model.ad.access.UserRoles;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.common.enterprise.Warehouse;
import org.openbravo.test.datasource.BaseDataSourceTestDal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * These tests ensure that the information that is displayed in the user profile widget is updated
 * properly when roles, organization accesses or warehouses are activated/deactivated.
 */
public class UserInfoSessionDataTest extends BaseDataSourceTestDal {
  private static Logger log = LoggerFactory.getLogger(UserInfoSessionDataTest.class);

  private static final String USER_INFO_START = "OB.User.userInfo=";
  private static final String USER_INFO_FINISH = "};";

  // Role: F&B US, Inc. - Employee
  private static final String US_EMPLOYEE_ROLE_ID = "19AE26382A674FE8946D2B8070D10122";
  // User Role for Openbravo User - F&B US, Inc. - Employee Role
  private static final String US_EMPLOYEE_USER_ROLE_ID = "3B960D8A87CA4F77907DF2B7F9A77366";
  // Organization for Role: F&B US East Coast
  private static final String US_EASTCOAST_ORG_ID = "7BABA5FF80494CAFA54DEBD22EC46F01";
  // Warehouse for Role: F&B US East Coast
  private static final String US_EASTCOAST_WAREHOUSE_ID = "9CF98A18BC754B99998E421F91C5FE12";

  @Test
  public void deactivatedRoleNotShowInUserProfile() throws Exception {
    try {
      String response = doSessionDynamicRequest();
      JSONArray rolesInfo = getUserRoles(response);
      assertThat("Active role is available for the user.",
          isIdInUserProfileWidget(rolesInfo, US_EMPLOYEE_ROLE_ID), equalTo(true));

      setActiveUserRole(false);

      String responseDeactivatedUserRole = doSessionDynamicRequest();
      rolesInfo = getUserRoles(responseDeactivatedUserRole);
      assertThat("Deactivated role is not available for the user.",
          isIdInUserProfileWidget(rolesInfo, US_EMPLOYEE_ROLE_ID), equalTo(false));
    } finally {
      setActiveUserRole(true);
    }
  }

  @Test
  public void deactivatedOrganizationNotShowInUserProfile() throws Exception {
    try {
      String response = doSessionDynamicRequest();
      JSONArray orgs = getRoleOrganizations(response, US_EMPLOYEE_ROLE_ID);
      assertThat("Organization with active access is available for the user.",
          isIdInUserProfileWidget(orgs, US_EASTCOAST_ORG_ID), equalTo(true));

      setActiveOrganizationRoleAccess(false);

      String responseDeactivatedOrg = doSessionDynamicRequest();
      orgs = getRoleOrganizations(responseDeactivatedOrg, US_EMPLOYEE_ROLE_ID);
      assertThat("Organization with deactivated access is not available for the user.",
          isIdInUserProfileWidget(orgs, US_EASTCOAST_ORG_ID), equalTo(false));
    } finally {
      setActiveOrganizationRoleAccess(true);
    }
  }

  @Test
  public void deactivatedWarehouseNotShowInUserProfile() throws Exception {
    try {
      String response = doSessionDynamicRequest();
      JSONArray warehouses = getRoleWarehouses(response, US_EMPLOYEE_ROLE_ID);
      JSONArray organizationWarehouses = getOrganizationWarehouses(warehouses, US_EASTCOAST_ORG_ID);
      assertThat("Active warehouse is available for the user.",
          isIdInUserProfileWidget(organizationWarehouses, US_EASTCOAST_WAREHOUSE_ID), equalTo(true));

      setActiveWarehouse(false);

      String responseDeactivatedWarehouse = doSessionDynamicRequest();
      warehouses = getRoleWarehouses(responseDeactivatedWarehouse, US_EMPLOYEE_ROLE_ID);
      organizationWarehouses = getOrganizationWarehouses(warehouses, US_EASTCOAST_ORG_ID);
      assertThat("Deactivated warehouse is not available for the user.",
          isIdInUserProfileWidget(organizationWarehouses, US_EASTCOAST_WAREHOUSE_ID),
          equalTo(false));
    } finally {
      setActiveWarehouse(true);
    }
  }

  private String doSessionDynamicRequest() throws Exception {
    Map<String, String> params = new HashMap<String, String>();
    return doRequest("/org.openbravo.client.kernel/OBCLKER_Kernel/SessionDynamic", params, 200,
        "POST");
  }

  private JSONArray getUserRoles(String response) {
    try {
      return getRoles(response).getJSONArray("valueMap");
    } catch (JSONException e) {
      log.error("Could not retrieve the user roles", e);
    }
    return null;
  }

  private JSONObject getRoles(String response) {
    JSONObject userInfoResp = getUserInfo(response);
    try {
      return userInfoResp.getJSONObject("role");
    } catch (JSONException e) {
      log.error("Could not retrieve the information about the user roles.", e);
    }
    return null;
  }

  private JSONArray getRoleOrganizations(String response, String roleId) {
    return getRoleInformation(response, "organizationValueMap", roleId);
  }

  private JSONArray getRoleWarehouses(String response, String roleId) {
    return getRoleInformation(response, "warehouseOrgMap", roleId);
  }

  private JSONArray getRoleInformation(String response, String property, String roleId) {
    try {
      JSONArray rolesInfo = getRoles(response).getJSONArray("roles");
      for (int i = 0; i < rolesInfo.length(); i++) {
        JSONObject orgRole = rolesInfo.getJSONObject(i);
        if (roleId.equals(orgRole.getString("id"))) {
          return orgRole.getJSONArray(property);
        }
      }
    } catch (JSONException ex) {
      log.error("Could not retrieve property {}.", property, ex);
    }
    return null;
  }

  private JSONArray getOrganizationWarehouses(JSONArray warehouses, String orgId) {
    try {
      for (int i = 0; i < warehouses.length(); i++) {
        JSONObject warehousesRole = warehouses.getJSONObject(i);
        if (orgId.equals(warehousesRole.getString("orgId"))) {
          return warehousesRole.getJSONArray("warehouseMap");
        }
      }
    } catch (JSONException e) {
      log.error("Could not retrieve the warehouses for organization {}.", orgId, e);
    }
    return null;
  }

  private JSONObject getUserInfo(String resp) {
    String strResponse = resp.substring(resp.indexOf(USER_INFO_START) + USER_INFO_START.length());
    strResponse = strResponse.substring(0, strResponse.indexOf(USER_INFO_FINISH) + 1);
    JSONObject userInfo = null;
    try {
      userInfo = new JSONObject(removeCodeJsInTheResponse(strResponse));
    } catch (JSONException e) {
      log.error("Could not retrieve the userInfo from the response.", e);
    }
    return userInfo;
  }

  private String removeCodeJsInTheResponse(String response) {
    String regexCodeJs = "(\\.sortByProperty\\(\\')(.*?)(\\))";
    return response.replaceAll(regexCodeJs, "");
  }

  private boolean isIdInUserProfileWidget(JSONArray userProfileWidgetInfo, String targetId) {
    if (userProfileWidgetInfo == null) {
      return false;
    }
    try {
      for (int i = 0; i < userProfileWidgetInfo.length(); i++) {
        JSONObject info = userProfileWidgetInfo.getJSONObject(i);
        if (targetId.equals(info.getString("id"))) {
          return true;
        }
      }
    } catch (JSONException e) {
      log.error("Could not retrieve the target information with id {}.", targetId, e);
    }
    return false;
  }

  private void setActiveUserRole(boolean isActive) {
    OBContext.setAdminMode();
    try {
      UserRoles userRole = OBDal.getInstance().get(UserRoles.class, US_EMPLOYEE_USER_ROLE_ID);
      userRole.setActive(isActive);
      OBDal.getInstance().commitAndClose();
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  private void setActiveOrganizationRoleAccess(boolean isActive) {
    final OBCriteria<RoleOrganization> orgAccessCriteria = OBDal.getInstance().createCriteria(
        RoleOrganization.class);
    orgAccessCriteria.add(Restrictions.eq(RoleOrganization.PROPERTY_ROLE + "." + Role.PROPERTY_ID,
        US_EMPLOYEE_ROLE_ID));
    orgAccessCriteria.add(Restrictions.eq(RoleOrganization.PROPERTY_ORGANIZATION + "."
        + Organization.PROPERTY_ID, US_EASTCOAST_ORG_ID));
    orgAccessCriteria.setMaxResults(1);
    orgAccessCriteria.setFilterOnActive(false);
    RoleOrganization ro = (RoleOrganization) orgAccessCriteria.uniqueResult();
    ro.setActive(isActive);
    OBDal.getInstance().commitAndClose();
  }

  private void setActiveWarehouse(boolean isActive) {
    OBCriteria<Warehouse> waCriteria = OBDal.getInstance().createCriteria(Warehouse.class);
    waCriteria.add(Restrictions.eq(Warehouse.PROPERTY_ORGANIZATION,
        OBDal.getInstance().getProxy(Organization.class, US_EASTCOAST_ORG_ID)));
    waCriteria.setMaxResults(1);
    waCriteria.setFilterOnActive(false);
    Warehouse wa = (Warehouse) waCriteria.uniqueResult();
    wa.setActive(isActive);
    OBDal.getInstance().commitAndClose();
  }
}