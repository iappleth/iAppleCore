package org.openbravo.common.actionhandler;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.client.application.process.BaseProcessActionHandler;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.common.enterprise.Locator;
import org.openbravo.model.common.order.OrderLine;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOut;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOutLine;

/**
 * 
 * @author gorkaion
 * 
 */
public class RMInOutPickEditLines extends BaseProcessActionHandler {

  @Override
  protected JSONObject doExecute(Map<String, Object> parameters, String content) {
    JSONObject jsonRequest = null;
    try {
      jsonRequest = new JSONObject(content);
      System.err.println(jsonRequest);
      final String strInOutId = jsonRequest.getString("inpmInoutId");
      ShipmentInOut inOut = OBDal.getInstance().get(ShipmentInOut.class, strInOutId);
      if (cleanInOutLines(inOut)) {
        createInOutLines(jsonRequest);
      }

    } catch (Exception e) {
      e.printStackTrace();
    }
    return jsonRequest;
  }

  private boolean cleanInOutLines(ShipmentInOut inOut) {
    if (inOut.getMaterialMgmtShipmentInOutLineList().isEmpty()) {
      // nothing to delete.
      return true;
    }
    try {
      inOut.getMaterialMgmtShipmentInOutLineList().clear();
      OBDal.getInstance().save(inOut);
      OBDal.getInstance().flush();
    } catch (Exception e) {
      e.printStackTrace();
      return false;
    }
    return true;
  }

  private void createInOutLines(JSONObject jsonRequest) throws JSONException {
    JSONArray selectedLines = jsonRequest.getJSONArray("_selection");
    // if no lines selected don't do anything.
    if (selectedLines.length() == 0) {
      return;
    }
    final String strInOutId = jsonRequest.getString("inpmInoutId");
    ShipmentInOut inOut = OBDal.getInstance().get(ShipmentInOut.class, strInOutId);
    for (long i = 0; i < selectedLines.length(); i++) {
      JSONObject selectedLine = selectedLines.getJSONObject((int) i);
      System.err.println(selectedLine);
      ShipmentInOutLine newInOutLine = OBProvider.getInstance().get(ShipmentInOutLine.class);
      newInOutLine.setShipmentReceipt(inOut);
      newInOutLine.setOrganization(inOut.getOrganization());
      newInOutLine.setLineNo((i + 1L) * 10L);

      OrderLine orderLine = OBDal.getInstance().get(OrderLine.class,
          selectedLine.getString("orderLine"));
      newInOutLine.setSalesOrderLine(orderLine);
      newInOutLine.setStorageBin(OBDal.getInstance().get(Locator.class,
          selectedLine.getString("storageBin")));
      newInOutLine.setProduct(orderLine.getProduct());
      newInOutLine.setAttributeSetValue(orderLine.getAttributeSetValue());
      newInOutLine.setUOM(orderLine.getUOM());
      // Ordered Quantity = returned quantity.
      BigDecimal qtyReceived = new BigDecimal(selectedLine.getString("receiving"));
      newInOutLine.setMovementQuantity(qtyReceived.negate());
      newInOutLine.setConditiongoods(selectedLine.getString("conditionOfTheGoods"));

      List<ShipmentInOutLine> inOutLines = inOut.getMaterialMgmtShipmentInOutLineList();
      inOutLines.add(newInOutLine);
      inOut.setMaterialMgmtShipmentInOutLineList(inOutLines);

      OBDal.getInstance().save(newInOutLine);
      OBDal.getInstance().save(inOut);
      OBDal.getInstance().flush();
    }
  }
}
