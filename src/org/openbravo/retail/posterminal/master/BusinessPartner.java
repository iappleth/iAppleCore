/*
 ************************************************************************************
 * Copyright (C) 2012-2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal.master;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import javax.enterprise.inject.Any;
import javax.enterprise.inject.Instance;
import javax.inject.Inject;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.dal.core.OBContext;
import org.openbravo.erpCommon.businessUtility.Preferences;
import org.openbravo.erpCommon.utility.PropertyException;
import org.openbravo.mobile.core.model.HQLEntity;
import org.openbravo.mobile.core.model.HQLProperty;
import org.openbravo.mobile.core.model.HQLPropertyList;
import org.openbravo.mobile.core.model.ModelExtension;
import org.openbravo.mobile.core.model.ModelExtensionUtils;
import org.openbravo.retail.posterminal.ProcessHQLQuery;

public class BusinessPartner extends ProcessHQLQuery {
  public static final String businessPartnerPropertyExtension = "OBPOS_BusinessPartnerExtension";

  @Inject
  @Any
  @Qualifier(businessPartnerPropertyExtension)
  private Instance<ModelExtension> extensions;

  @Override
  protected List<HQLPropertyList> getHqlProperties(JSONObject jsonsent) {
    List<HQLPropertyList> propertiesList = new ArrayList<HQLPropertyList>();
    HQLPropertyList regularBusinessPartnerHQLProperties = ModelExtensionUtils
        .getPropertyExtensions(extensions);

    propertiesList.add(regularBusinessPartnerHQLProperties);
    propertiesList.add(regularBusinessPartnerHQLProperties);

    return propertiesList;
  }

  @Override
  protected List<String> getQuery(JSONObject jsonsent) throws JSONException {

    boolean isRemote = false;
    boolean useGroupBy = false;
    String entitiesJoined, groupByExpression = "";
    try {
      OBContext.setAdminMode(false);
      isRemote = "Y".equals(Preferences.getPreferenceValue("OBPOS_remote.customer", true,
          OBContext.getOBContext().getCurrentClient(),
          OBContext.getOBContext().getCurrentOrganization(), OBContext.getOBContext().getUser(),
          OBContext.getOBContext().getRole(), null));
    } catch (PropertyException e) {
      isRemote = false;
    } finally {
      OBContext.restorePreviousMode();
    }

    HQLPropertyList regularBusinessPartnerHQLProperties = ModelExtensionUtils
        .getPropertyExtensions(extensions);
    List<HQLEntity> entityExtensions = ModelExtensionUtils.getEntityExtensions(extensions);
    entitiesJoined = ModelExtensionUtils.getHQLEntitiesJoined(entityExtensions);
    for (HQLProperty property : regularBusinessPartnerHQLProperties.getProperties()) {
      if (property.isIncludeInGroupBy()) {
        groupByExpression = regularBusinessPartnerHQLProperties.getHqlGroupBy();
        useGroupBy = true;
        break;
      }
    }

    String hql = "SELECT " + regularBusinessPartnerHQLProperties.getHqlSelect() //
        + "FROM BusinessPartner AS bp " //
        + "join bp.priceList AS plist " //
        + "left outer join bp.language AS lang " //
        + "left outer join bp.greeting AS grt " //
        + "left outer join bp.aDUserList AS ulist " //
        + entitiesJoined //
        + "WHERE $filtersCriteria AND " //
        + "bp.customer = true AND " + "(bp.$incrementalUpdateCriteria) AND "
        + "bp.$readableSimpleClientCriteria AND " + "bp.$naturalOrgCriteria AND "
        + "(not exists (select 1 from ADUser usr where usr.businessPartner = bp)) ";
    if (useGroupBy) {
      hql += "GROUP BY " + groupByExpression;
      hql += "HAVING $havingCriteria ";
    }
    if (isRemote) {
      hql += "ORDER BY bp.name, bp.id";
    } else {
      hql += "ORDER BY bp.id";
    }

    String hql2 = "SELECT" + regularBusinessPartnerHQLProperties.getHqlSelect() //
        + "FROM BusinessPartner AS bp " //
        + "join bp.priceList AS plist " //
        + "left outer join bp.language AS lang " //
        + "left outer join bp.greeting AS grt " //
        + "left outer join bp.aDUserList AS ulist " //
        + entitiesJoined //
        + "WHERE $filtersCriteria AND " //
        + "bp.customer = true AND " + "bp.$readableSimpleClientCriteria AND "
        + "bp.$naturalOrgCriteria AND " + "(bp.$incrementalUpdateCriteria) AND "
        + "(ulist.id in (select max(ulist2.id) from ADUser as ulist2 where ulist2.businessPartner=bp)) ";
    if (useGroupBy) {
      hql2 += "GROUP BY " + groupByExpression;
      hql2 += "HAVING $havingCriteria ";
    }
    if (isRemote) {
      hql2 += "ORDER BY bp.name, bp.id";
    } else {
      hql2 += "ORDER BY bp.id";
    }
    return Arrays.asList(new String[] { hql, hql2 });
  }

  @Override
  protected boolean bypassPreferenceCheck() {
    return true;
  }
}
