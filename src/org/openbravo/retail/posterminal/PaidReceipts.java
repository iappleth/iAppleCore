/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal;

import javax.servlet.ServletException;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.Query;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.service.json.JsonConstants;

public class PaidReceipts extends JSONProcessSimple {

  @Override
  public JSONObject exec(JSONObject jsonsent) throws JSONException, ServletException {

    JSONArray respArray = new JSONArray();
    OBContext.setAdminMode(true);
    JSONObject json = jsonsent.getJSONObject("filters");
    String pos = json.getString("pos");
    String client = json.getString("client");
    String organization = json.getString("organization");

    String hqlPaidReceipts = "select ord.id as id, ord.documentNo as documentNo, ord.orderDate as orderDate, "
        + "ord.businessPartner.name as businessPartner from Order as ord where ord.client=? and ord.organization=? and ord.obposApplications is not null";
    if (!json.getString("documentNo").isEmpty()) {
      hqlPaidReceipts += " and ord.documentNo like '%" + json.getString("documentNo") + "%' ";
    }
    if (!json.getString("startDate").isEmpty()) {
      hqlPaidReceipts += " and ord.orderDate >='" + json.getString("startDate") + "'";
    }
    if (!json.getString("endDate").isEmpty()) {
      hqlPaidReceipts += " and ord.orderDate <='" + json.getString("endDate") + "'";
    }
    Query paidReceiptsQuery = OBDal.getInstance().getSession().createQuery(hqlPaidReceipts);
    paidReceiptsQuery.setString(0, client);
    paidReceiptsQuery.setString(1, organization);

    for (Object obj : paidReceiptsQuery.list()) {
      Object[] objpaidReceipts = (Object[]) obj;
      JSONObject paidReceipt = new JSONObject();
      paidReceipt.put("documentNo", objpaidReceipts[1]);
      paidReceipt.put("orderDate", (objpaidReceipts[2]));
      paidReceipt.put("businessPartner", objpaidReceipts[3]);

      JSONArray listpaidReceiptsLines = new JSONArray();
      String hqlPaidReceiptsLines = "select ordLine.product.id as id, ordLine.product.name as name, ordLine.product.uOM.id as uOM, ordLine.orderedQuantity as quantity, "
          + "ordLine.unitPrice as unitPrice from OrderLine as ordLine where ordLine.salesOrder.id=?";
      Query paidReceiptsLinesQuery = OBDal.getInstance().getSession()
          .createQuery(hqlPaidReceiptsLines);
      // // paidReceiptsQuery.setString(0, id);
      paidReceiptsLinesQuery.setString(0, (String) objpaidReceipts[0]);
      for (Object objLine : paidReceiptsLinesQuery.list()) {
        Object[] objpaidReceiptsLines = (Object[]) objLine;
        JSONObject paidReceiptLine = new JSONObject();
        paidReceiptLine.put("id", objpaidReceiptsLines[0]);
        paidReceiptLine.put("name", objpaidReceiptsLines[1]);
        paidReceiptLine.put("uOM", objpaidReceiptsLines[2]);
        paidReceiptLine.put("quantity", objpaidReceiptsLines[3]);
        paidReceiptLine.put("unitPrice", objpaidReceiptsLines[4]);
        listpaidReceiptsLines.put(paidReceiptLine);
      }
      paidReceipt.put("receiptLines", listpaidReceiptsLines);

      JSONArray listPaymentsIn = new JSONArray();
      String hqlPaymentsIn = "select scheduleDetail.paymentDetails.finPayment.amount, scheduleDetail.paymentDetails.finPayment.account.id "
          + "from FIN_Payment_ScheduleDetail as scheduleDetail where scheduleDetail.orderPaymentSchedule.order.id=?";
      Query paymentsInQuery = OBDal.getInstance().getSession().createQuery(hqlPaymentsIn);
      // paidReceiptsQuery.setString(0, id);
      paymentsInQuery.setString(0, (String) objpaidReceipts[0]);
      for (Object objPaymentIn : paymentsInQuery.list()) {
        Object[] objPaymentsIn = (Object[]) objPaymentIn;
        JSONObject paymentsIn = new JSONObject();
        paymentsIn.put("amount", objPaymentsIn[0]);
        paymentsIn.put("account", objPaymentsIn[1]);
        listPaymentsIn.put(paymentsIn);
      }

      JSONArray listpaidReceiptsPayments = new JSONArray();

      JSONArray listPaymentsType = new JSONArray();
      String hqlPaymentsType = "select p.commercialName as name, p.financialAccount.id as account"
          + " from OBPOS_App_Payment as p where p.obposApplications.id=? ";
      Query paymentsTypeQuery = OBDal.getInstance().getSession().createQuery(hqlPaymentsType);
      // paidReceiptsQuery.setString(0, id);
      paymentsTypeQuery.setString(0, pos);
      for (Object objPaymentType : paymentsTypeQuery.list()) {
        Object[] objPaymentsType = (Object[]) objPaymentType;
        JSONObject paymentsType = new JSONObject();
        paymentsType.put("name", objPaymentsType[0]);
        paymentsType.put("account", objPaymentsType[1]);
        listPaymentsType.put(paymentsType);
      }
      for (int i = 0; i < listPaymentsIn.length(); i++) {
        JSONObject objectIn = (JSONObject) listPaymentsIn.get(i);
        for (int j = 0; j < listPaymentsType.length(); j++) {
          JSONObject objectType = (JSONObject) listPaymentsType.get(j);
          if (objectIn.get("account").equals(objectType.get("account"))) {
            JSONObject paidReceiptPayment = new JSONObject();
            // FIXME: Multicurrency problem, amount always in terminal currency
            paidReceiptPayment.put("amount", objectIn.get("amount"));
            paidReceiptPayment.put("name", objectType.get("name"));
            listpaidReceiptsPayments.put(paidReceiptPayment);
          }
        }
      }

      paidReceipt.put("receiptPayments", listpaidReceiptsPayments);

      respArray.put(paidReceipt);
    }

    JSONObject result = new JSONObject();
    result.put(JsonConstants.RESPONSE_DATA, respArray);
    result.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
    return result;

  }
}