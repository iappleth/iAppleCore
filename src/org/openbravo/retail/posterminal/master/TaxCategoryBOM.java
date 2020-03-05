/*
 ************************************************************************************
 * Copyright (C) 2014-2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal.master;

import java.util.Arrays;
import java.util.List;

import javax.enterprise.inject.Any;
import javax.enterprise.inject.Instance;
import javax.inject.Inject;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.mobile.core.master.MasterDataProcessHQLQuery;
import org.openbravo.mobile.core.master.MasterDataProcessHQLQuery.MasterDataModel;
import org.openbravo.mobile.core.model.ModelExtension;
import org.openbravo.mobile.core.model.ModelExtensionUtils;

@MasterDataModel("TaxCategoryBOM")
public class TaxCategoryBOM extends MasterDataProcessHQLQuery {
  public static final String taxCategoryBOMPropertyExtension = "OBPOS_TaxCategoryBOMExtension";

  @Inject
  @Any
  @Qualifier(taxCategoryBOMPropertyExtension)
  private Instance<ModelExtension> extensions;

  @Override
  protected List<String> getQuery(JSONObject jsonsent) throws JSONException {
    final StringBuilder queryBuilder = new StringBuilder();
    queryBuilder
        .append(" select " + ModelExtensionUtils.getPropertyExtensions(extensions).getHqlSelect());
    queryBuilder.append(" from FinancialMgmtTaxCategory as taxcategory");
    queryBuilder.append(" where (taxcategory.$incrementalUpdateCriteria)");
    queryBuilder.append(" and ($naturalOrgCriteria)");
    queryBuilder.append(" and $readableClientCriteria");
    queryBuilder.append(" and taxcategory.asbom = true");
    queryBuilder.append(" and taxcategory.active = true");
    queryBuilder.append(" order by default desc, name, id");

    return Arrays.asList(queryBuilder.toString());
  }

  @Override
  protected boolean bypassPreferenceCheck() {
    return true;
  }

  @Override
  public List<String> getMasterDataModelProperties() {
    return getPropertiesFrom(org.openbravo.model.financialmgmt.tax.TaxCategory.class);
  }
}
