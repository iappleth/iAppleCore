/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.0  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License.
 * The Original Code is Openbravo ERP.
 * The Initial Developer of the Original Code is Openbravo SLU
 * All portions are Copyright (C) 2016 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 *************************************************************************
 */
package org.openbravo.common.actionhandler;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.client.application.process.BaseProcessActionHandler;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.financial.ResetAccounting;
import org.openbravo.service.db.DbUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ResetAccountingHandler extends BaseProcessActionHandler {

  private static final Logger log = LoggerFactory.getLogger(ResetAccountingHandler.class);

  @Override
  protected JSONObject doExecute(Map<String, Object> parameters, String content) {

    JSONObject result = new JSONObject();

    try {
      JSONObject request = new JSONObject(content);
      JSONObject params = request.getJSONObject("_params");

      String adClientId = params.getString("AD_Client_ID");
      String adOrgId = params.getString("AD_Org_ID");
      String deletePosting = params.getString("DeletePosting");
      String recordId = params.has("recordId") ? params.getString("recordId") : null;
      String datefrom = params.getString("datefrom").equals("null") ? ""
          : params.getString("datefrom");
      String dateto = params.getString("dateto").equals("null") ? "" : params.getString("dateto");
      JSONArray tableIds = params.getJSONArray("AD_Table_ID");
      List<String> tableIdsList = new ArrayList<String>();
      for (int i = 0; i < tableIds.length(); i++) {
        String tableId = tableIds.getString(i);
        tableIdsList.add(tableId);
      }
      HashMap<String, Integer> results = new HashMap<String, Integer>();
      if ("true".equals(deletePosting)) {
        results = ResetAccounting.delete(adClientId, adOrgId, tableIdsList, recordId, datefrom,
            dateto);
      } else {
        results = ResetAccounting.restore(adClientId, adOrgId, tableIdsList, datefrom, dateto);
      }
      int counter = results.get("updated");
      int counterDeleted = results.get("deleted");
      JSONObject successMessage = new JSONObject();
      successMessage.put("severity", "success");
      StringBuilder message = new StringBuilder();
      message.append(OBMessageUtils.parseTranslation("@UnpostedDocuments@")).append(" = ")
          .append(counter).append(", ").append(OBMessageUtils.parseTranslation("@DeletedEntries@"))
          .append(" = ").append(counterDeleted);
      successMessage.put("text", message);
      result.put("message", successMessage);
    } catch (Exception e) {
      log.error("Error in Reset Accounting Action Handler", e);

      try {
        Throwable ex = DbUtility.getUnderlyingSQLException(e);
        String message = OBMessageUtils.translateError(ex.getMessage()).getMessage();
        JSONObject errorMessage = new JSONObject();
        errorMessage.put("severity", "error");
        errorMessage.put("text", message);
        result.put("message", errorMessage);

      } catch (Exception e2) {
        log.error(e.getMessage(), e2);
      }
    }
    return result;
  }
}