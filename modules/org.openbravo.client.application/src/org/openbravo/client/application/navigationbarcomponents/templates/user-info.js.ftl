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

OB.User.UserInfo = {
  language: {
    value: '${data.contextLanguageId}',
    valueMap: [
      <#list data.languages as language>
        {
          id: '${language.id}',
          _identifier: '${language.identifier}'
        } <#if language_has_next>,</#if>
      </#list>
    ]
  },
  initialValues: {
    language: '${data.contextLanguageId}',
    role: '${data.contextRoleId}',
    client: '${data.contextClientId}',
    organization: '${data.contextOrganizationId}'<#if data.contextWarehouseId != "">,
    warehouse: '${data.contextWarehouseId}'
    </#if>
  },
  role: {
    value: '${data.contextRoleId}',
    valueMap: [
      <#list data.userRolesSorted as role>
        {
          id: '${role.id}',
          _identifier: '${role.identifier} - ${role.client.identifier}'
        } <#if role_has_next>,</#if>
      </#list>
    ],
    roles: [
      <#list data.userRolesInfo as roleInfo>
      {
        id: '${roleInfo.roleId}',
        client: '${roleInfo.client}',
        organizationValueMap: [
        <#list roleInfo.organizations as organization>
          {
            id: '${organization.id}',
            _identifier: '${organization.identifier}'
          } <#if organization_has_next>,</#if>
          </#list>
        ],
        warehouseOrgMap: [
          <#list roleInfo.organizationWarehouses?keys as key>
          {
            orgId: '${key}',
            warehouseMap: [
            <#list roleInfo.organizationWarehouses[key] as warehouse>
              {
                id: '${warehouse.id}',
                _identifier: '${warehouse.identifier}'
              } <#if warehouse_has_next>,</#if>
              </#list>
            ]
          } <#if key_has_next>,</#if>
          </#list>
        ]
      } <#if roleInfo_has_next>,</#if>
      </#list>
    ]
  }
}
