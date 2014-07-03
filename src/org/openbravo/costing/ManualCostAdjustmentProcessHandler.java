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
 * All portions are Copyright (C) 2014 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 *************************************************************************
 */
package org.openbravo.costing;

import java.math.BigDecimal;
import java.util.Date;
import java.util.Map;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.advpaymentmngt.utility.FIN_Utility;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.client.kernel.BaseActionHandler;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.model.common.enterprise.DocumentType;
import org.openbravo.model.materialmgmt.cost.CostAdjustment;
import org.openbravo.model.materialmgmt.cost.CostAdjustmentLine;
import org.openbravo.model.materialmgmt.cost.TransactionCost;
import org.openbravo.model.materialmgmt.transaction.MaterialTransaction;
import org.openbravo.service.db.DbUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ManualCostAdjustmentProcessHandler extends BaseActionHandler {
  private static final Logger log = LoggerFactory
      .getLogger(ManualCostAdjustmentProcessHandler.class);
  final String strCategoryCostAdj = "CAD";
  final String strTableCostAdj = "M_CostAdjustment";

  @Override
  protected JSONObject execute(Map<String, Object> parameters, String content) {
    JSONObject jsonResponse = new JSONObject();
    try {
      JSONObject jsonContent = new JSONObject(content);

      final String strTransactionId = jsonContent.getString("M_Transaction_ID");
      final JSONObject params = jsonContent.getJSONObject("_params");
      final BigDecimal newAmountCost = new BigDecimal(params.getString("Cost"));

      final MaterialTransaction transaction = OBDal.getInstance().get(MaterialTransaction.class,
          strTransactionId);

      if (transaction.getTransactionCost() == null) {
        JSONObject message = new JSONObject();
        message.put("severity", "error");
        message.put("title", OBMessageUtils.messageBD("Error"));
        message.put("text", OBMessageUtils.getI18NMessage("NoCostCalculated", null));
        jsonResponse.put("message", message);
        return jsonResponse;
      }

      final DocumentType docType = FIN_Utility.getDocumentType(transaction.getOrganization(),
          strCategoryCostAdj);
      final String docNo = FIN_Utility.getDocumentNo(docType, strTableCostAdj);

      CostAdjustment costAdjustment = OBProvider.getInstance().get(CostAdjustment.class);
      costAdjustment.setOrganization(transaction.getOrganization());
      costAdjustment.setDocumentType(docType);
      costAdjustment.setDocumentNo(docNo);
      costAdjustment.setReferenceDate(new Date());
      costAdjustment.setSourceProcess("MCC");
      costAdjustment.setProcessed(Boolean.FALSE);

      BigDecimal totalCost = BigDecimal.ZERO;
      for (TransactionCost transactionCost : transaction.getTransactionCostList()) {
        totalCost = totalCost.add(transactionCost.getCost());
      }
      BigDecimal costToAdjust = newAmountCost.subtract(totalCost);

      CostAdjustmentLine costAdjustmentLine = OBProvider.getInstance()
          .get(CostAdjustmentLine.class);
      costAdjustmentLine.setOrganization(transaction.getOrganization());
      costAdjustmentLine.setCostAdjustment(costAdjustment);
      costAdjustmentLine.setAdjustmentAmount(costToAdjust);
      costAdjustmentLine.setInventoryTransaction(transaction);
      costAdjustmentLine.setSource(Boolean.TRUE);

      OBDal.getInstance().save(costAdjustment);
      OBDal.getInstance().save(costAdjustmentLine);

      JSONObject message = CostAdjustmentProcess.processCostAdjustment(costAdjustment);
      jsonResponse.put("message", message);

    } catch (OBException e) {
      OBDal.getInstance().rollbackAndClose();
      log.error("Error in CostAdjustmentProcessHandler: " + e.getMessage(), e);
      try {
        JSONObject message = new JSONObject();
        message.put("severity", "error");
        message.put("title", OBMessageUtils.messageBD("Error"));
        message.put("text", e.getMessage());
        jsonResponse.put("message", message);
      } catch (JSONException ignore) {
      }
    } catch (JSONException e) {
      OBDal.getInstance().rollbackAndClose();
      log.error("Error parsing JSONObject: " + e.getMessage(), e);
      try {
        JSONObject errorMessage = new JSONObject();
        errorMessage.put("severity", "error");
        errorMessage.put("title", OBMessageUtils.messageBD("Error"));
        errorMessage.put("text", e.getMessage());
        jsonResponse.put("message", errorMessage);
      } catch (JSONException ignore) {
      }
    } catch (Exception e) {
      OBDal.getInstance().rollbackAndClose();
      log.error("Error in CostAdjustmentProcessHandler: " + e.getMessage(), e);
      try {
        Throwable ex = DbUtility.getUnderlyingSQLException(e);
        String strMessage = OBMessageUtils.translateError(ex.getMessage()).getMessage();
        JSONObject errorMessage = new JSONObject();
        errorMessage.put("severity", "error");
        errorMessage.put("title", OBMessageUtils.messageBD("Error"));
        errorMessage.put("text", strMessage);
        jsonResponse.put("message", errorMessage);
      } catch (Exception ignore) {
      }
    }
    return jsonResponse;
  }
}
