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
 * All portions are Copyright (C) 2015-2019 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.materialmgmt;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.ParseException;
import java.util.Date;
import java.util.HashMap;

import org.apache.commons.lang.time.DateUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.query.Query;
import org.openbravo.base.exception.OBException;
import org.openbravo.client.kernel.RequestContext;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.erpCommon.utility.OBDateUtils;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.model.common.order.OrderLine;
import org.openbravo.model.common.order.OrderlineServiceRelation;
import org.openbravo.model.common.plm.Product;
import org.openbravo.model.common.plm.ServicePriceRuleVersion;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOutLine;
import org.openbravo.model.pricing.pricelist.PriceList;
import org.openbravo.model.pricing.pricelist.PriceListVersion;
import org.openbravo.model.pricing.pricelist.ProductPrice;
import org.openbravo.model.pricing.pricelist.ServicePriceRule;
import org.openbravo.model.pricing.pricelist.ServicePriceRuleRange;
import org.openbravo.service.db.DalConnectionProvider;

public class ServicePriceUtils {
  private static final Logger log = LogManager.getLogger();
  private static final String PERCENTAGE = "P";
  public static final String UNIQUE_QUANTITY = "UQ";

  /**
   * Method to obtain Service Amount to be added for a certain service order line based on selected
   * product lines amount
   */
  public static BigDecimal getServiceAmount(OrderLine orderline, BigDecimal linesTotalAmount,
      BigDecimal totalDiscounts, BigDecimal totalPrice, BigDecimal relatedQty,
      BigDecimal unitDiscountsAmt) {
    JSONObject relatedInfo = new JSONObject();
    JSONArray relatedLines = new JSONArray();
    JSONArray relatedAmounts = new JSONArray();
    JSONArray relatedDiscounts = new JSONArray();
    JSONArray relatedPrices = new JSONArray();
    JSONArray relatedQuantities = new JSONArray();
    JSONArray relatedUnitDiscounts = new JSONArray();
    try {
      for (OrderlineServiceRelation olsr : orderline.getOrderlineServiceRelationList()) {
        relatedLines.put(olsr.getOrderlineRelated().getId());
        relatedAmounts.put(olsr.getAmount());
        relatedDiscounts.put(JSONObject.NULL);
        relatedPrices.put(olsr.getQuantity().compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO
            : olsr.getAmount().divide(olsr.getQuantity()));
        relatedQuantities.put(olsr.getQuantity());
        relatedUnitDiscounts.put(JSONObject.NULL);
      }

      if (relatedLines.length() == 0) {
        return getServiceAmount(orderline, linesTotalAmount, totalDiscounts, totalPrice, relatedQty,
            unitDiscountsAmt, null);

      } else {
        relatedInfo.put("relatedLines", relatedLines);
        relatedInfo.put("lineAmount", relatedAmounts);
        relatedInfo.put("lineDiscounts", relatedDiscounts);
        relatedInfo.put("linePriceamount", relatedPrices);
        relatedInfo.put("lineRelatedqty", relatedQuantities);
        relatedInfo.put("lineUnitdiscountsamt", relatedUnitDiscounts);

        return getServiceAmount(orderline, linesTotalAmount, totalDiscounts, totalPrice, relatedQty,
            unitDiscountsAmt, relatedInfo);
      }
    } catch (JSONException e) {
      throw new OBException(e);
    }
  }

  public static BigDecimal getServiceAmount(OrderLine orderline, BigDecimal linesTotalAmount,
      BigDecimal totalDiscounts, BigDecimal totalPrice, BigDecimal relatedQty,
      BigDecimal unitDiscountsAmt, JSONObject relatedInfo) {
    if (relatedInfo == null || !relatedInfo.has("relatedLines")) {
      return getServiceAmountByLine(orderline, linesTotalAmount, totalDiscounts, totalPrice,
          relatedQty, unitDiscountsAmt, null, linesTotalAmount, totalDiscounts, totalPrice,
          unitDiscountsAmt);
    } else {
      try {
        JSONArray relatedLines = relatedInfo.getJSONArray("relatedLines");
        JSONArray relatedAmounts = relatedInfo.getJSONArray("lineAmount");
        JSONArray relatedDiscounts = relatedInfo.getJSONArray("lineDiscounts");
        JSONArray relatedPrices = relatedInfo.getJSONArray("linePriceamount");
        JSONArray relatedQuantities = relatedInfo.getJSONArray("lineRelatedqty");
        JSONArray relatedUnitDiscounts = relatedInfo.getJSONArray("lineUnitdiscountsamt");

        BigDecimal serviceAmount = BigDecimal.ZERO;
        BigDecimal partialAmount;
        for (int i = 0; i < relatedLines.length(); i++) {
          BigDecimal amount = BigDecimal.valueOf(relatedAmounts.optDouble(i, 0));
          if (amount.compareTo(BigDecimal.ZERO) == 0) {
            continue;
          }

          BigDecimal discount = BigDecimal.valueOf(relatedDiscounts.optDouble(i, 0));
          BigDecimal price = BigDecimal.valueOf(relatedPrices.optDouble(i, 0));
          BigDecimal relatedLineQty = BigDecimal.valueOf(relatedQuantities.optDouble(i, 0));
          BigDecimal unitDiscount = BigDecimal.valueOf(relatedUnitDiscounts.optDouble(i, 0));

          String relatedLineId = relatedLines.getString(i);

          partialAmount = getServiceAmountByLine(orderline, amount, discount, price, relatedLineQty,
              unitDiscount, relatedLineId, linesTotalAmount, totalDiscounts, totalPrice,
              unitDiscountsAmt);
          serviceAmount = serviceAmount.add(partialAmount);
        }

        return serviceAmount;
      } catch (JSONException e) {
        throw new OBException(e);
      }
    }
  }

  private static BigDecimal getServiceAmountByLine(OrderLine orderline, BigDecimal lineAmount,
      BigDecimal lineDiscounts, BigDecimal linePrice, BigDecimal relatedQty,
      BigDecimal lineUnitDiscount, String relatedLineId, BigDecimal totalLineAmount,
      BigDecimal totalDiscounts, BigDecimal totalLinePrice, BigDecimal totalUnitDiscounts) {
    BigDecimal localRelatedQty = relatedQty;
    final Product serviceProduct = orderline.getProduct();
    OBContext.setAdminMode(true);
    try {
      if (lineAmount != null && lineAmount.compareTo(BigDecimal.ZERO) == 0) {
        return BigDecimal.ZERO;
      }
      BigDecimal serviceBasePrice = getProductPrice(orderline.getOrderDate(),
          orderline.getSalesOrder().getPriceList(), serviceProduct);
      if (serviceBasePrice == null) {
        throw new OBException(
            "@ServiceProductPriceListVersionNotFound@ " + serviceProduct.getIdentifier()
                + ", @Date@: " + OBDateUtils.formatDate(orderline.getOrderDate()));
      }
      BigDecimal serviceRelatedPrice = BigDecimal.ZERO;
      boolean isPriceRuleBased = serviceProduct.isPricerulebased();
      if (!isPriceRuleBased) {
        return BigDecimal.ZERO;
      } else {
        ServicePriceRule servicePriceRule = getServicePriceRule(serviceProduct,
            orderline.getOrderDate(), relatedLineId);
        if (servicePriceRule == null) {
          throw new OBException(
              "@ServicePriceRuleVersionNotFound@ " + orderline.getProduct().getIdentifier()
                  + ", @Date@: " + OBDateUtils.formatDate(orderline.getOrderDate()));
        }
        BigDecimal relatedAmount = BigDecimal.ZERO;
        BigDecimal findRangeAmount = BigDecimal.ZERO;
        if (lineAmount != null) {
          relatedAmount = lineAmount;
        } else {
          HashMap<String, BigDecimal> relatedAmountAndQuatity = getRelatedAmountAndQty(orderline);
          relatedAmount = relatedAmountAndQuatity.get("amount");
          localRelatedQty = relatedAmountAndQuatity.get("quantity");
        }

        if (PERCENTAGE.equals(servicePriceRule.getRuletype())) {
          if (!servicePriceRule.isAfterdiscounts() && lineDiscounts != null
              && lineUnitDiscount != null) {
            relatedAmount = UNIQUE_QUANTITY.equals(serviceProduct.getQuantityRule())
                ? relatedAmount.add(lineDiscounts)
                : relatedAmount.add(lineUnitDiscount);
          }
          serviceRelatedPrice = relatedAmount.multiply(
              new BigDecimal(servicePriceRule.getPercentage()).divide(new BigDecimal("100.00")));
        } else {
          if (!servicePriceRule.isAfterdiscounts() && totalDiscounts != null
              && totalUnitDiscounts != null) {
            findRangeAmount = UNIQUE_QUANTITY.equals(serviceProduct.getQuantityRule())
                ? totalLineAmount.add(totalDiscounts)
                : totalLinePrice.add(totalUnitDiscounts);
          } else {
            findRangeAmount = UNIQUE_QUANTITY.equals(serviceProduct.getQuantityRule())
                ? totalLineAmount
                : totalLinePrice;
          }
          ServicePriceRuleRange range = getRange(servicePriceRule, findRangeAmount);
          if (range == null) {
            throw new OBException("@ServicePriceRuleRangeNotFound@. @ServicePriceRule@: "
                + servicePriceRule.getIdentifier() + ", @AmountUpTo@: " + lineAmount);
          }
          if (PERCENTAGE.equals(range.getRuleType())) {
            if (!range.isAfterDiscounts() && lineDiscounts != null && lineUnitDiscount != null) {
              relatedAmount = UNIQUE_QUANTITY.equals(serviceProduct.getQuantityRule())
                  ? lineAmount.add(lineDiscounts)
                  : linePrice.add(lineUnitDiscount);
            } else {
              relatedAmount = UNIQUE_QUANTITY.equals(serviceProduct.getQuantityRule()) ? lineAmount
                  : linePrice;
            }
            serviceRelatedPrice = relatedAmount
                .multiply(new BigDecimal(range.getPercentage()).divide(new BigDecimal("100.00")));
          } else {
            serviceRelatedPrice = getProductPrice(orderline.getOrderDate(), range.getPriceList(),
                serviceProduct);
            if (serviceRelatedPrice == null) {
              throw new OBException(
                  "@ServiceProductPriceListVersionNotFound@ " + serviceProduct.getIdentifier()
                      + ", @Date@: " + OBDateUtils.formatDate(orderline.getOrderDate()));
            }
          }
          if (!UNIQUE_QUANTITY.equals(serviceProduct.getQuantityRule())) {
            serviceRelatedPrice = serviceRelatedPrice.multiply(localRelatedQty);
          }
        }
        return serviceRelatedPrice.setScale(orderline.getCurrency().getPricePrecision().intValue(),
            RoundingMode.HALF_UP);
      }
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  /**
   * Method that returns a range for a certain Service Price Rule for the given amount
   * 
   * @param servicePriceRule
   *          Service Price Rule
   * @param relatedAmount
   *          Amount
   */
  private static ServicePriceRuleRange getRange(ServicePriceRule servicePriceRule,
      BigDecimal relatedAmount) {
    OBContext.setAdminMode(true);
    try {
      StringBuffer where = new StringBuffer();
      where.append("  as sprr");
      where.append(" where " + ServicePriceRuleRange.PROPERTY_SERVICEPRICERULE
          + ".id = :servicePriceRuleId");
      where.append(" and (" + ServicePriceRuleRange.PROPERTY_AMOUNTUPTO + " >= :amount or "
          + ServicePriceRuleRange.PROPERTY_AMOUNTUPTO + " is null)");
      where.append(" order by " + ServicePriceRuleRange.PROPERTY_AMOUNTUPTO + ", "
          + ServicePriceRuleVersion.PROPERTY_CREATIONDATE + " desc");
      OBQuery<ServicePriceRuleRange> sprrQry = OBDal.getInstance()
          .createQuery(ServicePriceRuleRange.class, where.toString());
      sprrQry.setNamedParameter("servicePriceRuleId", servicePriceRule.getId());
      sprrQry.setNamedParameter("amount", relatedAmount);
      sprrQry.setMaxResult(1);
      return sprrQry.uniqueResult();
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  /**
   * Method that returns the total amount, quantity and price of all lines related to the given line
   */
  public static HashMap<String, BigDecimal> getRelatedAmountAndQty(OrderLine orderLine) {
    OBContext.setAdminMode(true);
    try {
      StringBuffer strQuery = new StringBuffer();
      strQuery.append(
          "select coalesce(sum(e.amount),0), coalesce(sum(e.quantity),0), coalesce(sum(case when pl.priceIncludesTax = false then ol.unitPrice else ol.grossUnitPrice end), 0)");
      strQuery.append(" from OrderlineServiceRelation as e");
      strQuery.append(" join e.orderlineRelated as ol");
      strQuery.append(" join ol.salesOrder as o");
      strQuery.append(" join o.priceList as pl");
      strQuery.append(" where e.salesOrderLine.id = :orderLineId");
      Query<Object[]> query = OBDal.getInstance()
          .getSession()
          .createQuery(strQuery.toString(), Object[].class);
      query.setParameter("orderLineId", orderLine.getId());
      query.setMaxResults(1);
      HashMap<String, BigDecimal> result = new HashMap<String, BigDecimal>();
      Object[] values = query.uniqueResult();
      result.put("amount", (BigDecimal) values[0]);
      result.put("quantity", (BigDecimal) values[1]);
      result.put("price", (BigDecimal) values[2]);
      return result;
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  /**
   * Method that returns the listPrice of a product in a Price List on a given date
   * 
   * @param date
   *          Order Date of the Sales Order
   * @param priceList
   *          Price List assigned in the Service Price Rule Range
   * @param product
   *          Product to search in Price List
   */
  public static BigDecimal getProductPrice(Date date, PriceList priceList, Product product)
      throws OBException {
    OBContext.setAdminMode(true);
    try {
      StringBuffer where = new StringBuffer();
      where.append(" select pp." + ProductPrice.PROPERTY_LISTPRICE + " as listPrice");
      where.append(" from " + ProductPrice.ENTITY_NAME + " as pp");
      where.append("   join pp." + ProductPrice.PROPERTY_PRICELISTVERSION + " as plv");
      where.append("   join plv." + PriceListVersion.PROPERTY_PRICELIST + " as pl");
      where.append(" where pp." + ProductPrice.PROPERTY_PRODUCT + ".id = :productId");
      where.append("   and plv." + PriceListVersion.PROPERTY_VALIDFROMDATE + " <= :date");
      where.append("   and pl.id = :pricelistId");
      where.append("   and pl." + PriceList.PROPERTY_ACTIVE + " = true");
      where.append("   and pp." + ProductPrice.PROPERTY_ACTIVE + " = true");
      where.append("   and plv." + PriceListVersion.PROPERTY_ACTIVE + " = true");
      where.append(" order by pl." + PriceList.PROPERTY_DEFAULT + " desc, plv."
          + PriceListVersion.PROPERTY_VALIDFROMDATE + " desc");

      Query<BigDecimal> ppQry = OBDal.getInstance()
          .getSession()
          .createQuery(where.toString(), BigDecimal.class);
      ppQry.setParameter("productId", product.getId());
      ppQry.setParameter("date", date);
      ppQry.setParameter("pricelistId", priceList.getId());

      ppQry.setMaxResults(1);
      return (BigDecimal) ppQry.uniqueResult();
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  /**
   * Method that returns for a "Price Rule Based" Service product the Service Price Rule on the
   * given date
   * 
   * @param serviceProduct
   *          Service Product
   * @param orderDate
   *          Order Date of the Sales Order
   */
  public static ServicePriceRule getServicePriceRule(Product serviceProduct, Date orderDate) {
    return getServicePriceRule(serviceProduct, orderDate, null);
  }

  /**
   * Method that returns for a "Price Rule Based" Service product the Service Price Rule on the
   * given date
   * 
   * @param serviceProduct
   *          Service Product
   * @param orderDate
   *          Order Date of the Sales Order
   * @param relatedLine
   *          Line related to the service
   */
  public static ServicePriceRule getServicePriceRule(Product serviceProduct, Date orderDate,
      String relatedLine) {
    OrderLine ol = null;
    OBContext.setAdminMode(true);
    try {
      if (relatedLine != null) {
        ol = OBDal.getInstance().get(OrderLine.class, relatedLine);
      }
      StringBuffer where = new StringBuffer();
      where.append(" select sprv." + ServicePriceRuleVersion.PROPERTY_SERVICEPRICERULE);
      where.append(" from " + ServicePriceRuleVersion.ENTITY_NAME + " as sprv");
      where.append(" left join sprv.relatedProduct rp ");
      where.append(" left join sprv.relatedProductCategory rpc ");
      where.append(
          " where sprv." + ServicePriceRuleVersion.PROPERTY_PRODUCT + ".id = :serviceProductId");
      where
          .append(" and sprv." + ServicePriceRuleVersion.PROPERTY_VALIDFROMDATE + " <= :orderDate");
      where.append("   and sprv." + ServicePriceRuleVersion.PROPERTY_ACTIVE + " = true");

      if ("N".equals(serviceProduct.getIncludedProducts()) && relatedLine != null) {
        where.append(" and rp is null or rp.relatedProduct.id = :relatedProductId ");
      } else {
        where.append(" and rp is null ");
      }

      if ("N".equals(serviceProduct.getIncludedProductCategories()) && relatedLine != null) {
        where.append(" and rpc is null or rpc.productCategory.id = :relatedProdCatId ");
      } else {
        where.append(" and rpc is null ");
      }

      where.append(" order by case when rp is not null then 1 else 0 end desc, "
          + " case when rpc is not null then 1 else 0 end desc, sprv."
          + ServicePriceRuleVersion.PROPERTY_VALIDFROMDATE + " desc, sprv."
          + ServicePriceRuleVersion.PROPERTY_CREATIONDATE + " desc");
      Query<ServicePriceRule> sprvQry = OBDal.getInstance()
          .getSession()
          .createQuery(where.toString(), ServicePriceRule.class);
      sprvQry.setParameter("serviceProductId", serviceProduct.getId());
      sprvQry.setParameter("orderDate", orderDate);
      if ("N".equals(serviceProduct.getIncludedProducts()) && relatedLine != null) {
        sprvQry.setParameter("relatedProductId", ol.getProduct().getId());
      }
      if ("N".equals(serviceProduct.getIncludedProductCategories()) && relatedLine != null) {
        sprvQry.setParameter("relatedProdCatId", ol.getProduct().getProductCategory().getId());
      }
      sprvQry.setMaxResults(1);
      return sprvQry.uniqueResult();
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  /**
   * Method that returns the next Line Number of a Sales Order
   * 
   * @param orderId
   *          Order
   */
  public static Long getNewLineNo(String orderId) {
    OBContext.setAdminMode(true);
    try {
      StringBuffer where = new StringBuffer();
      where.append(" as ol");
      where.append(" where ol." + OrderLine.PROPERTY_SALESORDER + ".id = :orderId");
      where.append(" order by ol." + OrderLine.PROPERTY_LINENO + " desc");
      OBQuery<OrderLine> olQry = OBDal.getInstance().createQuery(OrderLine.class, where.toString());
      olQry.setNamedParameter("orderId", orderId);
      olQry.setMaxResult(1);
      if (olQry.count() > 0) {
        OrderLine ol = olQry.list().get(0);
        return ol.getLineNo() + 10L;
      }
      return 10L;
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  /**
   * This method returns null json object if a deferred sale of a service can be done in orderline
   * related to orderLineToRelate. If it is not possible it will return the json object with the
   * error obtained.
   * 
   * @param orderline
   *          Order Line in which the service deferred it is wanted to be added
   * @param orderLineToRelate
   *          Order Line to which the service is related
   */
  public static JSONObject deferredSaleAllowed(OrderLine orderline, OrderLine orderLineToRelate) {
    JSONObject result = null;
    final Product serviceProduct = orderline.getProduct();
    OBContext.setAdminMode(true);
    try {
      if (orderLineToRelate != null
          && !orderline.getSalesOrder().getId().equals(orderLineToRelate.getSalesOrder().getId())) {
        if (!serviceProduct.isAllowDeferredSell()) {
          throw new OBException("@DeferredSaleNotAllowed@: " + serviceProduct.getIdentifier());
        } else {
          try {
            Date deferredSaleDate = OBDateUtils
                .getDate(OBDateUtils.formatDate(orderLineToRelate.getSalesOrder().getOrderDate()));
            Date orderDate = OBDateUtils
                .getDate(OBDateUtils.formatDate(orderline.getSalesOrder().getOrderDate()));
            if (orderline.getProduct().getDeferredSellMaxDays() != null) {
              deferredSaleDate = DateUtils.addDays(deferredSaleDate,
                  serviceProduct.getDeferredSellMaxDays().intValue());
              if (orderDate.after(deferredSaleDate)) {
                String message = OBMessageUtils.parseTranslation(new DalConnectionProvider(false),
                    RequestContext.get().getVariablesSecureApp(),
                    OBContext.getOBContext().getLanguage().getLanguage(),
                    "@DeferredSaleExpired@: (" + OBDateUtils.formatDate(deferredSaleDate)
                        + ") @ForService@ '" + serviceProduct.getIdentifier()
                        + "' @relatingTo@ @line@ " + orderLineToRelate.getLineNo()
                        + " @of@ @SalesOrderDocumentno@ "
                        + orderLineToRelate.getSalesOrder().getDocumentNo());
                result = new JSONObject();
                result.put("severity", "warning");
                result.put("title", "Warning");
                result.put("text", message);
              }
            }
          } catch (ParseException e) {
            // TODO Auto-generated catch block
            log.error(e.getMessage(), e);
          } catch (JSONException e) {
            // TODO Auto-generated catch block
            log.error(e.getMessage(), e);
          }
        }
      }
      return result;
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  /**
   * Method that returns a warning message if a service of a Return From Customer is not Returnable
   * of the return period is expired.
   * 
   * @deprecated Use
   *             {@link ProductPriceUtils#productReturnAllowedRFC(ShipmentInOutLine, Product, Date)}
   */
  @Deprecated
  public static JSONObject serviceReturnAllowedRFC(ShipmentInOutLine shipmentLine,
      Product serviceProduct, Date rfcOrderDate) {
    return ProductPriceUtils.productReturnAllowedRFC(shipmentLine, serviceProduct, rfcOrderDate);
  }

  /**
   * Check if certain Service Price Range for certain amount is 'After Discounts' or not
   * 
   * @param orderline
   *          OrderLine
   */
  public static boolean servicePriceRuleIsAfterDiscounts(OrderLine orderline,
      BigDecimal linesTotalAmount, BigDecimal totalPrice, BigDecimal totalDiscounts,
      BigDecimal unitDiscountsAmt) {

    OBContext.setAdminMode(true);
    try {
      final Product serviceProduct = orderline.getProduct();
      if (linesTotalAmount != null && linesTotalAmount.compareTo(BigDecimal.ZERO) == 0) {
        return true;
      }
      BigDecimal serviceBasePrice = getProductPrice(orderline.getOrderDate(),
          orderline.getSalesOrder().getPriceList(), serviceProduct);
      if (serviceBasePrice == null) {
        throw new OBException(
            "@ServiceProductPriceListVersionNotFound@ " + serviceProduct.getIdentifier()
                + ", @Date@: " + OBDateUtils.formatDate(orderline.getOrderDate()));
      }
      BigDecimal serviceRelatedPrice = BigDecimal.ZERO;
      boolean isPriceRuleBased = serviceProduct.isPricerulebased();
      if (!isPriceRuleBased) {
        return false;
      } else {
        ServicePriceRule servicePriceRule = getServicePriceRule(serviceProduct,
            orderline.getOrderDate());
        if (servicePriceRule == null) {
          throw new OBException(
              "@ServicePriceRuleVersionNotFound@ " + orderline.getProduct().getIdentifier()
                  + ", @Date@: " + OBDateUtils.formatDate(orderline.getOrderDate()));
        }
        BigDecimal findRangeAmount = BigDecimal.ZERO;

        if (PERCENTAGE.equals(servicePriceRule.getRuletype())) {
          if (servicePriceRule.isAfterdiscounts()) {
            return true;
          }
        } else {
          if (!servicePriceRule.isAfterdiscounts() && totalDiscounts != null
              && unitDiscountsAmt != null) {
            findRangeAmount = UNIQUE_QUANTITY.equals(serviceProduct.getQuantityRule())
                ? linesTotalAmount.add(totalDiscounts)
                : totalPrice.add(unitDiscountsAmt);
          } else {
            findRangeAmount = UNIQUE_QUANTITY.equals(serviceProduct.getQuantityRule())
                ? linesTotalAmount
                : totalPrice;
          }
          ServicePriceRuleRange range = getRange(servicePriceRule, findRangeAmount);
          if (range == null) {
            throw new OBException("@ServicePriceRuleRangeNotFound@. @ServicePriceRule@: "
                + servicePriceRule.getIdentifier() + ", @AmountUpTo@: " + linesTotalAmount);
          }
          if (PERCENTAGE.equals(range.getRuleType())) {
            if (servicePriceRule.isAfterdiscounts()) {
              return true;
            }
          } else {
            serviceRelatedPrice = getProductPrice(orderline.getOrderDate(), range.getPriceList(),
                serviceProduct);
            if (serviceRelatedPrice == null) {
              throw new OBException(
                  "@ServiceProductPriceListVersionNotFound@ " + serviceProduct.getIdentifier()
                      + ", @Date@: " + OBDateUtils.formatDate(orderline.getOrderDate()));
            }
          }
        }
        return false;
      }
    } finally {
      OBContext.restorePreviousMode();
    }
  }
}
