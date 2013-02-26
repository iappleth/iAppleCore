/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal;

import java.util.Arrays;
import java.util.List;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.dal.core.OBContext;

public class PaidReceiptsHeader extends ProcessHQLQuery {

  @Override
  protected List<String> getQuery(JSONObject jsonsent) throws JSONException {

    OBContext.setAdminMode(true);
    JSONObject json = jsonsent.getJSONObject("filters");
    String hqlPaidReceipts = "select ord.id as id, ord.documentNo as documentNo, ord.orderDate as orderDate, "
        + "ord.businessPartner.name as businessPartner, ord.grandTotalAmount as totalamount from Order as ord "
        + "where ord.client='"
        + json.getString("client")
        + "' and ord.organization='"
        + json.getString("organization") + "' and ord.obposApplications is not null";

    if (!json.getString("filterText").isEmpty()) {
      hqlPaidReceipts += " and (ord.documentNo like '%" + json.getString("filterText")
          + "%' or upper(ord.businessPartner.name) like upper('%" + json.getString("filterText")
          + "%')) ";
    }
    if (!json.getString("documentType").isEmpty()) {
      hqlPaidReceipts += " and ord.documentType.id='" + json.getString("documentType") + "'";
    }
    if (!json.getString("docstatus").isEmpty() && !json.getString("docstatus").equals("null")) {
      hqlPaidReceipts += " and ord.documentStatus='" + json.getString("docstatus") + "'";
    }
    if (!json.getString("startDate").isEmpty()) {
      hqlPaidReceipts += " and ord.orderDate >='" + json.getString("startDate") + "'";
    }
    if (!json.getString("endDate").isEmpty()) {
      hqlPaidReceipts += " and ord.orderDate <='" + json.getString("endDate") + "'";
    }
    if (json.getBoolean("isLayaway")) {
      hqlPaidReceipts += " and ord.deliveryStatus = 0 and ord.documentStatus = 'CO' ";
    } else {
      hqlPaidReceipts += " and ord.deliveryStatus > 0 ";
    }
    hqlPaidReceipts += " order by ord.orderDate asc, ord.documentNo asc";
    return Arrays.asList(new String[] { hqlPaidReceipts });
  }
}