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
 * All portions are Copyright (C) 2016 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.common.actionhandler;

import java.math.BigDecimal;
import java.util.Map;

import org.codehaus.jettison.json.JSONObject;
import org.openbravo.client.kernel.BaseActionHandler;
import org.openbravo.client.kernel.RequestContext;
import org.openbravo.dal.core.OBContext;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.materialmgmt.CentralBroker;
import org.openbravo.service.db.DalConnectionProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CreateLinesFromPOConvertAUM extends BaseActionHandler {

  private static final Logger log = LoggerFactory.getLogger(CreateLinesFromPOConvertAUM.class);

  @Override
  protected JSONObject execute(Map<String, Object> parameters, String content) {
    JSONObject jsonRequest = null;
    OBContext.setAdminMode(true);
    JSONObject errorMessage = new JSONObject();
    JSONObject result = new JSONObject();
    try {
      jsonRequest = new JSONObject(content);
      log.debug("{}", jsonRequest);

      final String strProductId = jsonRequest.getString("productId");
      final BigDecimal quantity = new BigDecimal(jsonRequest.getString("quantity"));
      final String toUOM = jsonRequest.getString("toUOM");
      final boolean reverse = "Y".equals(jsonRequest.getString("reverse"));

      result.put("amount",
          CentralBroker.getInstance().getConvertedQty(strProductId, quantity, toUOM, reverse)
              .toString());
    } catch (Exception e) {
      log.error("Error in RFCServiceReturnableActionHandler Action Handler", e);
      try {
        result = new JSONObject();
        String message = OBMessageUtils.parseTranslation(new DalConnectionProvider(false),
            RequestContext.get().getVariablesSecureApp(), OBContext.getOBContext().getLanguage()
                .getLanguage(), e.getMessage());
        errorMessage = new JSONObject();
        errorMessage.put("severity", "error");
        errorMessage.put("title", "Error");
        errorMessage.put("text", message);
        result.put("message", errorMessage);
      } catch (Exception e2) {
        log.error(e.getMessage(), e2);
      }
    } finally {
      OBContext.restorePreviousMode();
    }
    return result;
  }

}
