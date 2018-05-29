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
 * All portions are Copyright (C) 2018 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.common.actionhandler.createlinesfromprocess;

import java.math.BigDecimal;
import java.util.List;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.model.common.invoice.Invoice;
import org.openbravo.model.common.order.OrderLine;
import org.openbravo.model.common.uom.UOM;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOutLine;
import org.openbravo.service.db.DbUtility;
import org.openbravo.service.json.JsonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

class CreateLinesFromUtil {
  private static final Logger log = LoggerFactory.getLogger(CreateLinesFromUtil.class);

  public static final String MESSAGE = "message";
  private static final String MESSAGE_SEVERITY = "severity";
  private static final String MESSAGE_TEXT = "text";
  private static final String MESSAGE_TITLE = "title";
  private static final String MESSAGE_SUCCESS = "success";
  private static final String MESSAGE_ERROR = "error";

  static JSONObject getSuccessMessage() throws JSONException {
    JSONObject errorMessage = new JSONObject();
    errorMessage.put(MESSAGE_SEVERITY, MESSAGE_SUCCESS);
    errorMessage.put(MESSAGE_TITLE, "Success");
    errorMessage.put(MESSAGE_TEXT, OBMessageUtils.messageBD(MESSAGE_SUCCESS));
    return errorMessage;
  }

  static JSONObject getErrorMessage(final Exception e) throws JSONException {
    Throwable ex = DbUtility.getUnderlyingSQLException(e);
    String message = OBMessageUtils.translateError(ex.getMessage()).getMessage();
    JSONObject errorMessage = new JSONObject();
    errorMessage.put(MESSAGE_SEVERITY, MESSAGE_ERROR);
    errorMessage.put(MESSAGE_TITLE, "Error");
    errorMessage.put(MESSAGE_TEXT, message);
    return errorMessage;
  }

  static boolean isOrderLine(BaseOBObject line) {
    return line instanceof OrderLine;
  }

  static boolean isShipmentReceiptLine(BaseOBObject line) {
    return line instanceof ShipmentInOutLine;
  }

  static Invoice getCurrentInvoice(JSONObject jsonRequest) {
    try {
      final String invoiceId = jsonRequest.getString("inpcInvoiceId");
      return OBDal.getInstance().get(Invoice.class, invoiceId);
    } catch (JSONException e) {
      log.error("Error getting the invoice.", e);
      throw new OBException(e);
    }
  }

  static JSONArray getSelectedLines(final JSONObject jsonRequest) throws JSONException {
    return jsonRequest.getJSONObject("_params").getJSONObject("grid").getJSONArray("_selection");
  }

  static BigDecimal getOrderedQuantity(BaseOBObject line, JSONObject selectedPEValuesInLine) {
    if (isOrderLine(line) && ((OrderLine) line).getGoodsShipmentLine() != null) {
      return ((OrderLine) line).getGoodsShipmentLine().getMovementQuantity();
    } else {
      return getOrderedQuantity(selectedPEValuesInLine);
    }
  }

  private static BigDecimal getOrderedQuantity(JSONObject selectedPEValuesInLine) {
    try {
      return new BigDecimal(selectedPEValuesInLine.getString(selectedPEValuesInLine
          .has("orderedQuantity") ? "orderedQuantity" : "movementQuantity"));
    } catch (JSONException e) {
      log.error("Error getting the Ordered Quantity.", e);
      throw new OBException(e);
    }
  }

  static BigDecimal getOperativeQuantity(BaseOBObject line, JSONObject selectedPEValuesInLine) {
    if (isOrderLine(line) && ((OrderLine) line).getGoodsShipmentLine() != null) {
      return ((OrderLine) line).getGoodsShipmentLine().getOperativeQuantity();
    } else {
      return getOperativeQuantity(selectedPEValuesInLine);
    }
  }

  private static BigDecimal getOperativeQuantity(JSONObject selectedPEValuesInLine) {
    try {
      return hasNotEmptyValue(selectedPEValuesInLine, "operativeQuantity") ? new BigDecimal(
          selectedPEValuesInLine.getString("operativeQuantity")) : null;
    } catch (JSONException e) {
      log.error("Error getting the Operative Quantity.", e);
      throw new OBException(e);
    }
  }

  static BigDecimal getOrderQuantity(JSONObject selectedPEValuesInLine) {
    try {
      return hasNotEmptyValue(selectedPEValuesInLine, "orderQuantity") ? new BigDecimal(
          selectedPEValuesInLine.getString("orderQuantity")) : null;
    } catch (JSONException e) {
      log.error("Error getting the Order Quantity.", e);
      throw new OBException(e);
    }
  }

  static ShipmentInOutLine getShipmentInOutLine(JSONObject selectedPEValuesInLine) {
    ShipmentInOutLine inOutLine = null;
    try {
      if (hasNotEmptyValue(selectedPEValuesInLine, "shipmentInOutLine")) {
        inOutLine = OBDal.getInstance().get(ShipmentInOutLine.class,
            selectedPEValuesInLine.getString("shipmentInOutLine"));
      }
    } catch (JSONException e) {
      log.error("Error getting the Shipment/Receipt.", e);
      throw new OBException(e);
    }
    return inOutLine;
  }

  static UOM getAUM(BaseOBObject line) {
    if (isOrderLine(line)) {
      return ((OrderLine) line).getGoodsShipmentLine() != null ? ((OrderLine) line)
          .getGoodsShipmentLine().getOperativeUOM() : ((OrderLine) line).getOperativeUOM();
    } else {
      return ((ShipmentInOutLine) line).getOperativeUOM();
    }
  }

  static boolean isOrderLineWithRelatedShipmentReceiptLines(BaseOBObject line,
      JSONObject selectedPEValuesInLine) {
    try {
      return isOrderLine(line)
          && !((OrderLine) line).getMaterialMgmtShipmentInOutLineList().isEmpty()
          && !hasNotEmptyValue(selectedPEValuesInLine, "shipmentInOutLine");
    } catch (JSONException e) {
      log.error("Error getting is an order line and has related shipment/receipt.", e);
      throw new OBException(e);
    }
  }

  static boolean hasRelatedOrderLine(final ShipmentInOutLine inOutLine) {
    return inOutLine.getSalesOrderLine() != null;
  }

  private static boolean hasNotEmptyValue(JSONObject selectedPEValuesInLine, String propertyName)
      throws JSONException {
    return selectedPEValuesInLine.has(propertyName)
        && !JsonUtils.isValueEmpty(selectedPEValuesInLine.getString(propertyName));
  }

  static List<ShipmentInOutLine> getRelatedShipmentLines(final OrderLine orderLine) {
    StringBuilder shipmentHQLQuery = new StringBuilder(" as il");
    shipmentHQLQuery.append(" join il.shipmentReceipt sh");
    shipmentHQLQuery.append(" where il.salesOrderLine.id = :orderLineId");
    shipmentHQLQuery.append("  and sh.processed = :processed");
    shipmentHQLQuery.append("  and sh.documentStatus in ('CO', 'CL')");
    shipmentHQLQuery.append("  and sh.completelyInvoiced = 'N'"); // This actually is a good filter
                                                                  // for sales flow only

    OBQuery<ShipmentInOutLine> shipmentQuery = OBDal.getInstance().createQuery(
        ShipmentInOutLine.class, shipmentHQLQuery.toString());
    shipmentQuery.setNamedParameter("orderLineId", orderLine.getId());
    shipmentQuery.setNamedParameter("processed", true);
    return shipmentQuery.list();
  }
}
