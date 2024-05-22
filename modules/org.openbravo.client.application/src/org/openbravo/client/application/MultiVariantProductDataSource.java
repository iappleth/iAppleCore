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
 * All portions are Copyright (C) 2024 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.client.application;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.common.order.Order;
import org.openbravo.model.common.order.OrderLine;
import org.openbravo.model.common.plm.Product;
import org.openbravo.model.common.plm.ProductCharacteristic;
import org.openbravo.model.common.plm.ProductCharacteristicValue;
import org.openbravo.service.datasource.ReadOnlyDataSourceService;

/**
 * Datasource used by the Purchase Order view "Model Mode" process TODO: Requires further
 * development
 */
public class MultiVariantProductDataSource extends ReadOnlyDataSourceService {

  @Override
  public void checkFetchDatasourceAccess(Map<String, String> parameter) {
    // Product datasource is accessible by all roles.
    // TODO: Might need rechecking
  }

  @Override
  protected int getCount(Map<String, String> parameters) {
    return getData(parameters, 0, Integer.MAX_VALUE).size();
  }

  @Override
  protected List<Map<String, Object>> getData(Map<String, String> parameters, int startRow,
      int endRow) {
    String orderRecordId = parameters.get("recordId");
    Order order = OBDal.getInstance().get(Order.class, orderRecordId);
    List<OrderLine> orderLineList = order.getOrderLineList();

    Set<String> genericProductIds = new HashSet<>();
    Map<String, Map<String, Object>> genericProducts = new HashMap<>();
    Map<String, JSONArray> variantInfoByGenericProductId = new HashMap<>();
    Map<String, Integer> quantityByGenericProductId = new HashMap<>();

    orderLineList.forEach(orderLine -> {
      Product orderLineProduct = orderLine.getProduct();
      Product genericProduct = orderLineProduct.getGenericProduct();
      if (genericProduct != null && (genericProduct.getRowCharacteristic() != null
          || genericProduct.getColumnCharacteristic() != null)) {
        String genericProductId = genericProduct.getId();
        List<ProductCharacteristicValue> orderLineProductCharacteristicValues = orderLineProduct
            .getProductCharacteristicValueList();

        // Calculate the variant quantities for initialValues
        if (!genericProductIds.contains(genericProductId)) {
          genericProductIds.add(genericProductId);
          JSONObject variantInfo = new JSONObject();
          try {
            if (genericProduct.getRowCharacteristic() != null) {
              String characteristicValueId = getCharacteristicValueId(
                  genericProduct.getRowCharacteristic().getId(),
                  orderLineProductCharacteristicValues);
              variantInfo.put("rowCharacteristicValue", characteristicValueId);
            }
            if (genericProduct.getColumnCharacteristic() != null) {
              String characteristicValueId = getCharacteristicValueId(
                  genericProduct.getColumnCharacteristic().getId(),
                  orderLineProductCharacteristicValues);
              variantInfo.put("columnCharacteristicValue", characteristicValueId);
            }
            variantInfo.put("quantity", orderLine.getOrderedQuantity().intValue());
          } catch (JSONException ignored) {
            // Ignored exception, shouldn't happen
            // TODO: Maybe add some log
          }

          variantInfoByGenericProductId.put(genericProductId, new JSONArray(List.of(variantInfo)));
          quantityByGenericProductId.put(genericProductId,
              orderLine.getOrderedQuantity().intValue());

          // Calculate row and column characteristics and initial quantities
          JSONObject characteristicValues = getProductCharacteristicValuesForRowAndColumnCharacteristic(
              genericProduct);

          try {
            JSONArray rowCharacteristics = characteristicValues.getJSONArray("rowCharacteristics");

            JSONArray columnCharacteristics = characteristicValues
                .getJSONArray("columnCharacteristics");

            genericProducts.put(genericProductId, //
                new HashMap<>(Map.of("product", genericProduct, //
                    "quantity", 0, //
                    "rowCharacteristics", rowCharacteristics, //
                    "columnCharacteristics", columnCharacteristics, //
                    "initialValues", variantInfoByGenericProductId.get(genericProductId)))); //

            // TODO: Include initialValues for each row/column present as variant
          } catch (JSONException e) {
            // TODO: maybe add a message here
            throw new RuntimeException(e);
          }
        } else {
          // Generic product was already added, quantities and initial values must be updated with
          // the variant product info
          try {
            JSONArray variantQuantities = variantInfoByGenericProductId.get(genericProductId);

            int matchIdx = getMatchingVariantIdx(variantQuantities, genericProduct,
                orderLineProductCharacteristicValues);

            if (matchIdx != -1) {
              // Add extra quantities to the variant
              JSONObject variantQuantity = variantQuantities.getJSONObject(matchIdx);
              int priorQuantity = variantQuantity.getInt("quantity");
              variantQuantity.put("quantity",
                  priorQuantity + orderLine.getOrderedQuantity().intValue());
            } else {
              // No match was found, so a new entry will be added
              JSONObject variantInfo = new JSONObject();
              if (genericProduct.getRowCharacteristic() != null) {
                String characteristicValueId = getCharacteristicValueId(
                    genericProduct.getRowCharacteristic().getId(),
                    orderLineProductCharacteristicValues);
                variantInfo.put("rowCharacteristicValue", characteristicValueId);
              }
              if (genericProduct.getColumnCharacteristic() != null) {
                String characteristicValueId = getCharacteristicValueId(
                    genericProduct.getColumnCharacteristic().getId(),
                    orderLineProductCharacteristicValues);
                variantInfo.put("columnCharacteristicValue", characteristicValueId);
              }
              variantInfo.put("quantity", orderLine.getOrderedQuantity().intValue());

              variantQuantities.put(variantInfo);
            }

            quantityByGenericProductId.put(genericProductId,
                quantityByGenericProductId.get(genericProductId)
                    + orderLine.getOrderedQuantity().intValue());
          } catch (JSONException e) {
            // TODO: Throw informative error explaining why json could not be retrieved or added
          }
        }
      }
    });

    // Adds initial values to resulting product info
    variantInfoByGenericProductId.forEach((genericProductId, variantQuantity) -> {
      Map<String, Object> genericProductInfo = genericProducts.get(genericProductId);
      genericProductInfo.put("initialValues", variantQuantity);
    });

    // Adds quantity to resulting product info
    quantityByGenericProductId.forEach((genericProductId, variantQuantity) -> {
      Map<String, Object> genericProductInfo = genericProducts.get(genericProductId);
      genericProductInfo.put("quantity", quantityByGenericProductId.get(genericProductId));
    });

    return new ArrayList<>(genericProducts.values());
  }

  /**
   * Returns the index of a matching variant information in provided variantQuantities JSONArray
   * 
   * @param variantQuantities
   * @param genericProduct
   * @param orderLineProductCharacteristicValues
   * @return
   * @throws JSONException
   */
  private int getMatchingVariantIdx(JSONArray variantQuantities, Product genericProduct,
      List<ProductCharacteristicValue> orderLineProductCharacteristicValues) throws JSONException {
    boolean hasRowCharacteristic = genericProduct.getRowCharacteristic() != null;
    boolean hasColumnCharacteristic = genericProduct.getColumnCharacteristic() != null;
    int matchIdx = -1;
    for (int i = 0; i < variantQuantities.length(); i++) {
      JSONObject variantQuantity = variantQuantities.getJSONObject(i);
      if (hasRowCharacteristic) {
        String rowCharacteristicId = genericProduct.getRowCharacteristic().getId();
        String rowCharacteristicValueId = getCharacteristicValueId(rowCharacteristicId,
            orderLineProductCharacteristicValues);
        if (hasColumnCharacteristic) {
          String columnCharacteristicId = genericProduct.getColumnCharacteristic().getId();
          String columnCharacteristicValueId = getCharacteristicValueId(columnCharacteristicId,
              orderLineProductCharacteristicValues);

          if (variantQuantity.getString("rowCharacteristicValue").equals(rowCharacteristicValueId)
              && variantQuantity.getString("columnCharacteristicValue")
                  .equals(columnCharacteristicValueId)) {
            matchIdx = i;
            break;
          }
        } else {
          if (variantQuantity.getString("rowCharacteristicValue")
              .equals(rowCharacteristicValueId)) {
            matchIdx = i;
            break;
          }
        }
      } else if (hasColumnCharacteristic) {
        String columnCharacteristicId = genericProduct.getColumnCharacteristic().getId();
        String columnCharacteristicValueId = getCharacteristicValueId(columnCharacteristicId,
            orderLineProductCharacteristicValues);
        if (variantQuantity.getString("columnCharacteristicValue")
            .equals(columnCharacteristicValueId)) {
          matchIdx = i;
          break;
        }
      }
    }
    return matchIdx;
  }

  private JSONObject getProductCharacteristicValuesForRowAndColumnCharacteristic(Product product) {
    String prodRowCharacteristicId = product.getRowCharacteristic() != null
        ? product.getRowCharacteristic().getId()
        : null;
    String prodColumnCharacteristicId = product.getColumnCharacteristic() != null
        ? product.getColumnCharacteristic().getId()
        : null;

    List<ProductCharacteristic> productCharacteristics = product.getProductCharacteristicList();
    JSONArray rowCharacteristics = new JSONArray();
    JSONArray columnCharacteristics = new JSONArray();

    for (ProductCharacteristic productCharacteristic : productCharacteristics) {
      if (productCharacteristic.getCharacteristic().getId().equals(prodRowCharacteristicId)) {
        productCharacteristic.getProductCharacteristicConfList().forEach(chConf -> {
          rowCharacteristics
              .put(new JSONObject(Map.of("id", chConf.getCharacteristicValue().getId(),
                  "_identifier", chConf.getCharacteristicValue().getIdentifier())));
        });
      } else if (productCharacteristic.getCharacteristic()
          .getId()
          .equals(prodColumnCharacteristicId)) {
        productCharacteristic.getProductCharacteristicConfList().forEach(chConf -> {
          columnCharacteristics
              .put(new JSONObject(Map.of("id", chConf.getCharacteristicValue().getId(),
                  "_identifier", chConf.getCharacteristicValue().getIdentifier())));
        });
      }
    }

    return new JSONObject(Map.of("rowCharacteristics", rowCharacteristics, "columnCharacteristics",
        columnCharacteristics));
  }

  String getCharacteristicValueId(String characteristicId,
      List<ProductCharacteristicValue> productCharacteristicValues) {
    for (ProductCharacteristicValue productCharacteristicValue : productCharacteristicValues) {
      if (productCharacteristicValue.getCharacteristic().getId().equals(characteristicId)) {
        return productCharacteristicValue.getCharacteristicValue().getId();
      }
    }
    return null;
  }
}
