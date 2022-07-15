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
 * All portions are Copyright (C) 2022 Openbravo SLU 
 * All Rights Reserved. 
 ************************************************************************
 */
package org.openbravo.financial;

import java.util.Map;

import org.openbravo.client.kernel.ComponentProvider;
import org.openbravo.dal.security.OrganizationStructureProvider;
import org.openbravo.erpCommon.utility.StringCollectionUtils;
import org.openbravo.service.datasource.hql.HqlQueryTransformer;
import org.openbravo.service.json.JsonUtils;

@ComponentProvider.Qualifier("2E64F551C7C4470C80C29DBA24B34A5F")
public class ProductByPriceAndWarehouseSelectorTransformer extends HqlQueryTransformer {

  @Override
  public String transformHqlQuery(String hqlQuery, Map<String, String> requestParameters,
      Map<String, Object> queryNamedParameters) {

    String clientId = requestParameters.get("inpadClientId");
    String organizationId = requestParameters.get("inpadOrgId");
    String documentDate = getDocumentDate(requestParameters);
    String orgList = getOrganizationsList(requestParameters, organizationId);

    String transformedHql = hqlQuery.replace("@documentDate@", documentDate);
    transformedHql = transformedHql.replace("@orgList@", orgList);
    transformedHql = transformedHql.replace("@AD_Client_Id@", "'" + clientId + "'");
    transformedHql = transformedHql.replace("@AD_Org_Id@", "'" + organizationId + "'");

    return transformedHql;
  }

  private String getDocumentDate(Map<String, String> requestParameters) {
    String documentDate = requestParameters.containsKey("documentDate")
        ? "TO_DATE('" + requestParameters.get("documentDate") + "','"
            + JsonUtils.createDateFormat().toPattern() + "')"
        : "null";
    return documentDate;
  }

  private String getOrganizationsList(Map<String, String> requestParameters,
      String organizationId) {
    return StringCollectionUtils.commaSeparated(
        new OrganizationStructureProvider().getParentList(organizationId, true), true);
  }

}
