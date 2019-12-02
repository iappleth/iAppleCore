/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal.master;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import javax.enterprise.inject.Any;
import javax.enterprise.inject.Instance;
import javax.inject.Inject;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.mobile.core.master.MasterDataProcessHQLQuery;
import org.openbravo.mobile.core.master.MasterDataProcessHQLQuery.MasterDataModel;
import org.openbravo.mobile.core.model.HQLProperty;
import org.openbravo.mobile.core.model.HQLPropertyList;
import org.openbravo.mobile.core.model.ModelExtension;
import org.openbravo.mobile.core.model.ModelExtensionUtils;

@MasterDataModel("BPCategory")
public class BPCategory extends MasterDataProcessHQLQuery {
  public static final String bpcategoryPropertyExtension = "OBPOS_BPCategoryExtension";

  @Inject
  @Any
  @Qualifier(bpcategoryPropertyExtension)
  private Instance<ModelExtension> extensions;

  @Override
  protected List<String> getQuery(JSONObject jsonsent) throws JSONException {

    List<String> hqlQueries = new ArrayList<String>();

    HQLPropertyList regularBPCategoryHQLProperties = ModelExtensionUtils
        .getPropertyExtensions(extensions);

    hqlQueries.add("select " + regularBPCategoryHQLProperties.getHqlSelect()
        + "from BusinessPartnerCategory bpcat " + "where "
        + "bpcat.$readableSimpleClientCriteria AND " + "bpcat.$naturalOrgCriteria AND "
        + "(bpcat.$incrementalUpdateCriteria) " + " order by bpcat.name, bpcat.id");

    return hqlQueries;
  }

  @Override
  protected boolean bypassPreferenceCheck() {
    return true;
  }

  @Override
  public List<String> getMasterDataModelProperties() {
    return ModelExtensionUtils.getPropertyExtensions(extensions)
        .getProperties()
        .stream()
        .map(HQLProperty::getHqlProperty)
        .collect(Collectors.toList());
  }
}
