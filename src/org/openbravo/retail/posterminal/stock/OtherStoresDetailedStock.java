/*
 ************************************************************************************
 * Copyright (C) 2015-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

package org.openbravo.retail.posterminal.stock;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.ServletException;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
import org.hibernate.Session;
import org.hibernate.query.Query;
import org.openbravo.base.exception.OBException;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.retail.posterminal.JSONProcessSimple;
import org.openbravo.retail.posterminal.POSConstants;

public class OtherStoresDetailedStock extends JSONProcessSimple {
  @Override
  public JSONObject exec(JSONObject jsonData) throws JSONException, ServletException {
    String orgId, prodId, hqlQuery;
    OBContext.setAdminMode(true);
    JSONArray responseArray = new JSONArray();
    BigDecimal totalQtyCounter = BigDecimal.ZERO;
    List<String> countedWarehouses = new ArrayList<String>();
    try {

      orgId = jsonData.getString("organization");
      prodId = jsonData.getString("product");

      Organization organization = OBDal.getInstance().get(Organization.class, orgId);
      String hqlQueryGetWarehouseList;
      boolean requiresWarehouseTypeParam = false;
      if ("N".equals(organization.getObposIncludedCCWarehouses())) {
        hqlQueryGetWarehouseList = "EXISTS (SELECT 1 "
            + "FROM OBPOS_OrgWarehouseExtra AS ow WHERE ow.organization.id = :orgId AND ow.warehouseType = :warehouseType "
            + "AND w.id = ow.warehouse.id ) ";
        requiresWarehouseTypeParam = true;
      } else if ("Y".equals(organization.getObposIncludedCCWarehouses())) {
        hqlQueryGetWarehouseList = "NOT EXISTS (SELECT 1 FROM OBPOS_OrgWarehouseExtra AS ow WHERE ow.organization.id = :orgId AND ow.warehouseType = :warehouseType AND ow.warehouse.id = w.id) "
            + "AND NOT EXISTS (SELECT 1 FROM OrganizationWarehouse AS ow WHERE ow.organization.id = :orgId AND ow.warehouse.id = w.id) ";
        requiresWarehouseTypeParam = true;
      } else {
        hqlQueryGetWarehouseList = "NOT EXISTS (SELECT 1 FROM OrganizationWarehouse AS ow WHERE ow.organization.id = :orgId AND ow.warehouse.id = w.id) "
            + "AND EXISTS (SELECT 1 FROM OrganizationWarehouse AS ow WHERE ow.organization.id <> :orgId AND ow.warehouse.id = w.id) ";
      }

      hqlQuery = "SELECT w.id, w.name, sb.id, sb.searchKey, "
          + "SUM(ms.quantityOnHand - ms.reservedQty) AS qtyonhand " //
          + "FROM MaterialMgmtStorageDetail ms " //
          + "JOIN ms.storageBin sb " //
          + "JOIN sb.warehouse w " //
          + "WHERE " //
          + hqlQueryGetWarehouseList //
          + "AND ms.product.id = :prodId " //
          + "AND w.active = true " //
          + "GROUP BY w.id, w.name, sb.id, sb.searchKey " //
          + "ORDER BY w.name";

      final Session session = OBDal.getInstance().getSession();
      final Query<Object[]> query = session.createQuery(hqlQuery, Object[].class);
      if (requiresWarehouseTypeParam) {
        query.setParameter("warehouseType", POSConstants.CROSS_CHANNEL);
      }
      query.setParameter("orgId", orgId);
      query.setParameter("prodId", prodId);

      ScrollableResults results = query.scroll(ScrollMode.FORWARD_ONLY);
      boolean resultsAvailable = false;

      String curOrgId = null;
      BigDecimal qtyCounterPerOrg = BigDecimal.ZERO;
      String curOrgName = "";
      JSONObject orgInfo = new JSONObject();
      JSONArray arrWarehousesInfo = new JSONArray();
      try {
        while (results.next()) {
          if (curOrgId == null) {
            resultsAvailable = true;
            curOrgName = (String) results.get(1);
            curOrgId = (String) results.get(0);
            qtyCounterPerOrg = BigDecimal.ZERO;
          }
          if (!curOrgId.equals((String) results.get(0))) {
            orgInfo.put("organizationid", curOrgId);
            orgInfo.put("organizationname", curOrgName);
            orgInfo.put("organizationqty", qtyCounterPerOrg);
            orgInfo.put("warehouses", arrWarehousesInfo);
            responseArray.put(orgInfo);

            orgInfo = new JSONObject();
            arrWarehousesInfo = new JSONArray();

            curOrgName = (String) results.get(1);
            curOrgId = (String) results.get(0);
            qtyCounterPerOrg = BigDecimal.ZERO;
          }
          JSONObject warehouseInfo = new JSONObject();
          warehouseInfo.put("warehouseid", (String) results.get(2));
          if (!countedWarehouses.contains((String) results.get(2))) {
            countedWarehouses.add((String) results.get(2));
            totalQtyCounter = totalQtyCounter.add((BigDecimal) results.get(4));
          }
          warehouseInfo.put("warehousename", (String) results.get(3));
          warehouseInfo.put("warehouseqty", ((BigDecimal) results.get(4)).toString());

          arrWarehousesInfo.put(warehouseInfo);

          qtyCounterPerOrg = qtyCounterPerOrg.add((BigDecimal) results.get(4));
        }
      } finally {
        results.close();
      }

      if (resultsAvailable) {
        orgInfo.put("organizationid", curOrgId);
        orgInfo.put("organizationname", curOrgName);
        orgInfo.put("organizationqty", qtyCounterPerOrg.toString());
        orgInfo.put("warehouses", arrWarehousesInfo);
        responseArray.put(orgInfo);
      }

    } catch (Exception e) {
      throw new OBException();
    } finally {
      OBContext.restorePreviousMode();
    }

    JSONObject preFinalResult = new JSONObject();
    preFinalResult.put("product", prodId);
    preFinalResult.put("qty", totalQtyCounter);
    preFinalResult.put("organizations", responseArray);

    JSONObject finalResult = new JSONObject();
    finalResult.put("data", preFinalResult);
    finalResult.put("status", 0);
    return finalResult;
  }

  @Override
  protected boolean bypassPreferenceCheck() {
    return true;
  }
}
