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
 * All portions are Copyright (C) 2014-2020 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.erpCommon.businessUtility;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import javax.enterprise.inject.Any;
import javax.enterprise.inject.Instance;
import javax.inject.Inject;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.base.weld.WeldUtils;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.model.ad.system.Client;
import org.openbravo.model.common.businesspartner.BusinessPartner;
import org.openbravo.model.common.currency.Currency;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.common.invoice.Invoice;
import org.openbravo.model.common.order.Order;
import org.openbravo.model.common.plm.Product;
import org.openbravo.model.pricing.pricelist.PriceList;

/**
 * This class is in charge of calculating prices for Discounts &amp; Promotions of Price Adjustment
 * type. It is intended to be used from callouts so final price can be seen in advance when
 * editing/creating the line, opposite to the rest of promotions that are not calculated until the
 * document is posted. This is done in this way to keep backwards compatibility.
 * 
 * @author alostale
 * 
 */
public class PriceAdjustment {
  private static final Logger log = LogManager.getLogger();

  @Inject
  @Any
  private Instance<PriceAdjustmentHqlExtension> extensions;

  /**
   * Calculates price actual from price standard applying the Price Adjustments that fit the rules.
   * 
   */
  public static BigDecimal calculatePriceActual(BaseOBObject orderOrInvoice, Product product,
      BigDecimal qty, BigDecimal priceStd) {
    BigDecimal priceActual = priceStd;
    try {
      int precision = ((Currency) orderOrInvoice.get(Invoice.PROPERTY_CURRENCY)).getPricePrecision()
          .intValue();
      for (org.openbravo.model.pricing.priceadjustment.PriceAdjustment promo : getApplicablePriceAdjustments(
          orderOrInvoice, qty, product, false)) {
        log.debug("promo: " + promo + "- " + promo.getDiscount());
        boolean applyDiscount = true;
        if (promo.isMultiple() && promo.getMultiple() != null
            && qty.remainder(promo.getMultiple()).compareTo(BigDecimal.ZERO) != 0) {
          applyDiscount = false;
        }
        if (promo.getFixedPrice() != null && applyDiscount) {
          priceActual = promo.getFixedPrice();
        } else {
          if (applyDiscount) {
            priceActual = priceActual.subtract(promo.getDiscountAmount())
                .multiply(
                    BigDecimal.ONE.subtract(promo.getDiscount().divide(BigDecimal.valueOf(100))))
                .setScale(precision, RoundingMode.HALF_UP);
          }
        }
        if (!promo.isApplyNext()) {
          break;
        }
      }
      log.debug("Actual:" + priceStd + "->" + priceActual);
      return priceActual;
    } catch (Throwable t) {
      log.error("Error calculating price actual with adjustments, returning price std (" + priceStd
          + ") order/invoice:" + orderOrInvoice + " - product: " + product + " - qty:" + qty);
      return priceStd;
    }
  }

  /**
   * Calculates price standard from price actual reverse applying the Price Adjustments that fit the
   * rules.
   * 
   */
  public static BigDecimal calculatePriceStd(BaseOBObject orderOrInvoice, Product product,
      BigDecimal qty, BigDecimal priceActual) {
    BigDecimal priceStd = priceActual;
    try {
      int precision = ((Currency) orderOrInvoice.get(Invoice.PROPERTY_CURRENCY)).getPricePrecision()
          .intValue();
      for (org.openbravo.model.pricing.priceadjustment.PriceAdjustment promo : getApplicablePriceAdjustments(
          orderOrInvoice, qty, product, true)) {
        boolean applyDiscount = true;
        if (promo.isMultiple() && promo.getMultiple() != null
            && qty.remainder(promo.getMultiple()).compareTo(BigDecimal.ZERO) != 0) {
          applyDiscount = false;
        }
        log.debug("promo: " + promo + "- " + promo.getDiscount());
        if (applyDiscount) {
          // Avoids divide by zero error
          if (BigDecimal.ONE.subtract(promo.getDiscount().divide(BigDecimal.valueOf(100)))
              .compareTo(BigDecimal.ZERO) != 0) {
            priceStd = priceStd.add(promo.getDiscountAmount())
                .divide(
                    BigDecimal.ONE.subtract(promo.getDiscount().divide(BigDecimal.valueOf(100))),
                    precision, RoundingMode.HALF_UP);
          } else {
            // 100 % Discount in price adjustment results in priceStd = Zero
            priceStd = BigDecimal.ZERO;
          }

        }

      }

      log.debug("Std:" + priceActual + "->" + priceStd);
      return priceStd;
    } catch (Throwable t) {
      log.error(
          "Error calculating price std with adjustments, returning price actual (" + priceActual
              + ") order/invoice:" + orderOrInvoice + " - product: " + product + " - qty:" + qty);
      return priceActual;
    }
  }

  private static List<org.openbravo.model.pricing.priceadjustment.PriceAdjustment> getApplicablePriceAdjustments(
      BaseOBObject orderOrInvoice, BigDecimal qty, Product product, boolean reverse) {
    //@formatter:off
    String hql = 
            "as p " +
            " where active = true" +
            "   and client.id = :clientId" +
            "   and ad_isorgincluded(:orgId, p.organization.id, p.client.id) <> -1" +
            "   and (endingDate is null or trunc(endingDate) + 1 > :date)" +
            "   and trunc(startingDate)<=:date" +
            "   and p.discountType.id = '5D4BAF6BB86D4D2C9ED3D5A6FC051579'" +
            "   and (minQuantity is null or minQuantity <= :qty)" +
            "   and (maxQuantity is null or maxQuantity >= :qty)" +
            // price list
            "   and (" +
            "     (includePriceLists='Y'" +
            "     and not exists (" +
            "       select 1 " +
            "         from PricingAdjustmentPriceList pl" +
            "        where active = true" +
            "          and pl.priceAdjustment = p" +
            "          and pl.priceList.id = :priceListId" +
            "       )" +
            "     ) " +
            "     or (includePriceLists='N' and exists (" +
            "       select 1 " +
            "         from PricingAdjustmentPriceList pl" +
            "        where active = true" +
            "          and pl.priceAdjustment = p" +
            "          and pl.priceList.id = :priceListId" +
            "       )" +
            "   )) " +
            // Business Partner
            "   and (" +
            "     (includedBusinessPartners = 'Y' " +
            "     and not exists (" +
            "       select 1 " +
            "         from PricingAdjustmentBusinessPartner bp" +
            "        where active = true" +
            "          and bp.priceAdjustment = p" +
            "          and bp.businessPartner.id = :bpId" +
            "       )" +
            "     ) " +
            "     or (includedBusinessPartners = 'N' and exists (" +
            "       select 1" +
            "         from PricingAdjustmentBusinessPartner bp" +
            "        where active = true" +
            "          and bp.priceAdjustment = p" +
            "          and bp.businessPartner.id = :bpId" +
            "       ) " +
            "   ))" +
            // Business Partner Category
            "   and (" +
            "     (includedBPCategories = 'Y' and not exists (" +
            "       select 1 " +
            "         from BusinessPartner bp " +
            "           , PricingAdjustmentBusinessPartnerGroup bpc" +
            "        where bpc.active = true" +
            "          and bpc.priceAdjustment = p" +
            "          and bp.id = :bpId" +
            "          and bp.businessPartnerCategory = bpc.businessPartnerCategory" +
            "       )" +
            "     )" +
            "     or (includedBPCategories = 'N' and exists (" +
            "       select 1 " +
            "         from BusinessPartner bp" +
            "           , PricingAdjustmentBusinessPartnerGroup bpc" +
            "        where bpc.active = true" +
            "          and bpc.priceAdjustment = p" +
            "          and bp.id = :bpId" +
            "          and bp.businessPartnerCategory = bpc.businessPartnerCategory" +
            "       )" +
            "   ))" +
            // Product
            "   and (" +
            "     (includedProducts = 'Y' and not exists (" +
            "       select 1" +
            "         from PricingAdjustmentProduct pr" +
            "        where active = true" +
            "          and pr.priceAdjustment = p" +
            "          and pr.product.id = :productId" +
            "       )" +
            "     ) " +
            "     or (includedProducts = 'N' and exists (" +
            "       select 1" +
            "         from PricingAdjustmentProduct pr" +
            "        where active = true" +
            "          and pr.priceAdjustment = p" +
            "          and pr.product.id = :productId" +
            "       ) " +
            "   ))" +
            // Product Category
            "   and (" +
            "     (includedProductCategories ='Y' and not exists (" +
            "       select 1" +
            "         from PricingAdjustmentProductCategory pc" +
            "           , Product pr" +
            "        where pc.active = true" +
            "          and pc.priceAdjustment = p" +
            "          and pr.id = :productId" +
            "          and pc.productCategory = pr.productCategory" +
            "       )" +
            "     )" +
            "     or (includedProductCategories ='N' and exists (" +
            "       select 1" +
            "         from PricingAdjustmentProductCategory pc" +
            "           , Product pr" +
            "        where pc.active = true" +
            "          and pc.priceAdjustment = p" +
            "          and pr.id = :productId" +
            "          and pc.productCategory = pr.productCategory" +
            "       ) " +
            "   ))" +
            // Organization
            "   and (" +
            "     (includedOrganizations='Y' and not exists (" +
            "       select 1 " +
            "         from PricingAdjustmentOrganization o" +
            "        where active = true" +
            "          and o.priceAdjustment = p" +
            "          and o.organization.id = :orgId" +
            "       )" +
            "     )" +
            "     or (includedOrganizations='N' and exists (" +
            "       select 1 " +
            "         from PricingAdjustmentOrganization o" +
            "        where active = true" +
            "          and o.priceAdjustment = p" +
            "          and o.organization.id = :orgId" +
            "       )" +
            "   ))" +
            // Product characteristic
            "   and (" +
            "     (includedCharacteristics='Y' and not exists (" +
            "       select 1 " +
            "         from Characteristic c " +
            "           join c.pricingAdjustmentCharacteristicList pac " +
            "           join c.productCharacteristicValueList pcv " +
            "        where  pcv.product.id = :productId " +
            "          and pac.offer = p " +
            "          and m_isparent_ch_value(pcv.characteristicValue.id, pac.chValue.id, pac.characteristic.id) != -1 " +
            "       )" +
            "     ) " +
            "     or (includedCharacteristics='N' and exists("+
            "       select 1 " +
            "         from Characteristic c " +
            "           join c.pricingAdjustmentCharacteristicList pac " +
            "           join c.productCharacteristicValueList pcv " +
            "        where  pcv.product.id = :productId " +
            "          and pac.offer = p " +
            "          and m_isparent_ch_value(pcv.characteristicValue.id, pac.chValue.id, pac.characteristic.id) != -1 " +
            "       ) " +
            "   ))";
    //@formatter:on

    PriceAdjustment priceAdInstance = WeldUtils
        .getInstanceFromStaticBeanManager(PriceAdjustment.class);

    if (priceAdInstance.extensions != null) {
      for (Iterator<? extends Object> extIter = priceAdInstance.extensions.iterator(); extIter
          .hasNext();) {
        PriceAdjustmentHqlExtension ext = (PriceAdjustmentHqlExtension) extIter.next();
        hql += ext.getHQLStringExtension();
      }
    }
    //@formatter:off
    hql += 
            " order by priority, id";
    //@formatter:on

    OBQuery<org.openbravo.model.pricing.priceadjustment.PriceAdjustment> q = OBDal.getInstance()
        .createQuery(org.openbravo.model.pricing.priceadjustment.PriceAdjustment.class, hql)
        .setNamedParameter("clientId",
            ((Client) orderOrInvoice.get(Invoice.PROPERTY_CLIENT)).getId())
        .setNamedParameter("orgId",
            ((Organization) orderOrInvoice.get(Invoice.PROPERTY_ORGANIZATION)).getId())
        .setNamedParameter("priceListId",
            ((PriceList) orderOrInvoice.get(Invoice.PROPERTY_PRICELIST)).getId())
        .setNamedParameter("bpId",
            ((BusinessPartner) orderOrInvoice.get(Invoice.PROPERTY_BUSINESSPARTNER)).getId());

    if (orderOrInvoice instanceof Invoice) {
      q.setNamedParameter("date", ((Invoice) orderOrInvoice).getInvoiceDate());
    } else {
      q.setNamedParameter("date", ((Order) orderOrInvoice).getOrderDate());
    }

    List<org.openbravo.model.pricing.priceadjustment.PriceAdjustment> ql = q
        .setNamedParameter("qty", qty)
        .setNamedParameter("productId", product.getId())
        .list();
    List<org.openbravo.model.pricing.priceadjustment.PriceAdjustment> result = ql;
    if (reverse) {
      // when reversing the list, special care must be taken with cascades
      result = new ArrayList<org.openbravo.model.pricing.priceadjustment.PriceAdjustment>();
      for (int i = ql.size() - 1; i >= 0; i--) {
        org.openbravo.model.pricing.priceadjustment.PriceAdjustment promo = ql.get(i);
        if (!promo.isApplyNext()) {
          result = new ArrayList<org.openbravo.model.pricing.priceadjustment.PriceAdjustment>();
        }
        result.add(promo);
      }
    }
    return result;
  }
}
