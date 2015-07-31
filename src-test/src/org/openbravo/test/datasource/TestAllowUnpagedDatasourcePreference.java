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

package org.openbravo.test.datasource;

import static org.hamcrest.Matchers.is;
import static org.junit.Assert.assertThat;

import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.criterion.Restrictions;
import org.junit.Test;
import org.openbravo.base.exception.OBException;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.model.ad.domain.Preference;
import org.openbravo.model.ad.system.Client;
import org.openbravo.model.common.enterprise.Organization;

/**
 * Test case for 'Allow Unpaged Datasource In Manual Request' preference
 * 
 * See issue http://issues.openbravo.com/view.php?id=30204
 */
public class TestAllowUnpagedDatasourcePreference extends BaseDataSourceTestDal {

  protected Logger logger = Logger.getLogger(this.getClass());

  @Test
  public void testErrorThrown() throws Exception {
    OBContext.setAdminMode();
    try {
      // Get the 'Allow Unpaged Datasource In Manual Request' preference value
      Preference preference = getPreference();
      // Create a manual request to the datasource
      String response = "";
      Map<String, String> params = new HashMap<String, String>();
      params.put("_operationType", "fetch");
      try {
        response = doRequest("/org.openbravo.service.datasource/UOM", params, 200, "POST");
      } catch (OBException ex) {
        logger.debug("Exception in request:" + ex.getMessage());
      }
      if (preference != null && "Y".equals(preference.getSearchKey())) {
        // Manual request should be completed without errors
        assertThat("Manual datasource request done without errors",
            StringUtils.isEmpty(getResponseErrorMessage(response)), is(true));
      } else {
        // Manual request should not be performed
        assertThat(
            "Manual datasource request not performed",
            OBMessageUtils.messageBD("OBJSON_NoPagedFetchManual").equals(
                getResponseErrorMessage(response)), is(true));
      }
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  private Preference getPreference() {
    Preference preference;
    OBCriteria<Preference> obCriteria = OBDal.getInstance().createCriteria(Preference.class);
    obCriteria.add(Restrictions.eq(Preference.PROPERTY_PROPERTY,
        "OBJSON_AllowUnpagedDatasourceManualRequest"));
    obCriteria.add(Restrictions.eq(Preference.PROPERTY_PROPERTYLIST, true));
    obCriteria.add(Restrictions.eq(Preference.PROPERTY_ACTIVE, true));
    obCriteria.add(Restrictions.eq(Preference.PROPERTY_VISIBLEATCLIENT,
        OBDal.getInstance().get(Client.class, "0")));
    obCriteria.add(Restrictions.eq(Preference.PROPERTY_VISIBLEATORGANIZATION, OBDal.getInstance()
        .get(Organization.class, "0")));
    obCriteria.add(Restrictions.isNull(Preference.PROPERTY_VISIBLEATROLE));
    obCriteria.add(Restrictions.isNull(Preference.PROPERTY_USERCONTACT));
    obCriteria.add(Restrictions.isNull(Preference.PROPERTY_WINDOW));
    obCriteria.setFilterOnReadableClients(false);
    obCriteria.setFilterOnReadableOrganization(false);
    obCriteria.setMaxResults(1);
    preference = (Preference) obCriteria.uniqueResult();

    return preference;
  }

  private String getResponseErrorMessage(String response) {
    try {
      JSONObject jsonResponse = new JSONObject(response).getJSONObject("response");
      if (jsonResponse.has("error")) {
        JSONObject error = jsonResponse.getJSONObject("error");
        return error.getString("message");
      }
      return "";
    } catch (Exception ex) {
      return "";
    }
  }
}
