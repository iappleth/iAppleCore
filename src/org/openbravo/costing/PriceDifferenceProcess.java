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
import java.math.RoundingMode;
import java.util.Date;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
import org.hibernate.criterion.Restrictions;
import org.openbravo.base.exception.OBException;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.financial.FinancialUtils;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.common.order.OrderLine;
import org.openbravo.model.common.plm.Product;
import org.openbravo.model.materialmgmt.cost.CostAdjustment;
import org.openbravo.model.materialmgmt.cost.CostAdjustmentLine;
import org.openbravo.model.materialmgmt.cost.TransactionCost;
import org.openbravo.model.materialmgmt.transaction.MaterialTransaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class PriceDifferenceProcess {
  private static final Logger log = LoggerFactory.getLogger(PriceDifferenceProcess.class);
  private static CostAdjustment costAdjHeader = null;

  private static void calculateTransactionPriceDifference(MaterialTransaction materialTransaction)
      throws OBException {

    Date costAdjDateAcct = null;
    BigDecimal orderAmt = BigDecimal.ZERO;
    BigDecimal invoiceAmt = BigDecimal.ZERO;
    BigDecimal invoiceAmtConverted = BigDecimal.ZERO;
    BigDecimal invoiceQty = BigDecimal.ZERO;
    BigDecimal adjustAmtMatchInv = BigDecimal.ZERO;
    BigDecimal adjustAmtOther = BigDecimal.ZERO;
    BigDecimal newAmountCost = BigDecimal.ZERO;
    BigDecimal invoiceCorrectionAmt = BigDecimal.ZERO;
    BigDecimal amtPendingInvoice = BigDecimal.ZERO;
    BigDecimal amtPendingInvoiceConverted = BigDecimal.ZERO;
    BigDecimal otherCorrectionAmt = BigDecimal.ZERO;
    BigDecimal amtProportionalInitialCost = BigDecimal.ZERO;
    int costCurPrecission = materialTransaction.getCurrency().getCostingPrecision().intValue();

    BigDecimal priceUnitCost = materialTransaction.getTransactionCost().divide(
        materialTransaction.getMovementQuantity(), costCurPrecission, RoundingMode.HALF_UP);

    for (org.openbravo.model.procurement.ReceiptInvoiceMatch matchInv : materialTransaction
        .getGoodsShipmentLine().getProcurementReceiptInvoiceMatchList()) {
      invoiceQty = invoiceQty.add(matchInv.getQuantity());
      invoiceAmt = matchInv.getQuantity().multiply(matchInv.getInvoiceLine().getUnitPrice());
      invoiceAmtConverted = FinancialUtils.getConvertedAmount(invoiceAmt, matchInv.getInvoiceLine()
          .getInvoice().getCurrency(), materialTransaction.getCurrency(),
          materialTransaction.getMovementDate(), materialTransaction.getOrganization(),
          FinancialUtils.PRECISION_STANDARD);
      orderAmt = matchInv.getQuantity().multiply(priceUnitCost);
      adjustAmtMatchInv = adjustAmtMatchInv.add(invoiceAmtConverted.subtract(orderAmt));

      newAmountCost = newAmountCost.add(adjustAmtMatchInv);
      if ((costAdjDateAcct == null)
          || (costAdjDateAcct.before(matchInv.getInvoiceLine().getInvoice().getInvoiceDate()))) {
        costAdjDateAcct = matchInv.getInvoiceLine().getInvoice().getInvoiceDate();
      }
    }
    for (TransactionCost trxCosts : materialTransaction.getTransactionCostList()) {
      // if (trxCosts.isInvoiceCorrection()) {
      if (true) {
        invoiceCorrectionAmt = invoiceCorrectionAmt.add(trxCosts.getCost());
      } else if (trxCosts.isUnitCost()) {
        otherCorrectionAmt = otherCorrectionAmt.add(trxCosts.getCost());
      }
    }

    // if the sum of trx costs with flag "isInvoiceCorrection" is distinct that the amount cost
    // generated by Match Invoice then New Cost Adjustment line is created by the difference
    if (invoiceCorrectionAmt.compareTo(adjustAmtMatchInv) != 0) {
      createCostAdjustmenHeader(materialTransaction.getOrganization());
      CostAdjustmentLine costAdjLine = CostAdjustmentUtils.insertCostAdjustmentLine(
          materialTransaction, costAdjHeader, adjustAmtMatchInv.subtract(invoiceCorrectionAmt),
          Boolean.TRUE, null, costAdjDateAcct);
      costAdjLine.setNeedsPosting(Boolean.TRUE);
      // costAdjLine.setInvoiceCorrection(Boolean.TRUE);
      OBDal.getInstance().save(costAdjLine);
    }

    // check if there is some difference in the qty ordered not invoiced
    if (materialTransaction.getGoodsShipmentLine().getSalesOrderLine() != null) {
      OrderLine ol = materialTransaction.getGoodsShipmentLine().getSalesOrderLine();

      amtPendingInvoice = ol.getOrderedQuantity().subtract(invoiceQty).multiply(ol.getUnitPrice());
      amtPendingInvoiceConverted = FinancialUtils.getConvertedAmount(amtPendingInvoice, ol
          .getSalesOrder().getCurrency(), materialTransaction.getCurrency(), materialTransaction
          .getMovementDate(), materialTransaction.getOrganization(),
          FinancialUtils.PRECISION_STANDARD);

      amtProportionalInitialCost = materialTransaction.getTransactionCost()
          .divide(ol.getOrderedQuantity(), 32, RoundingMode.HALF_UP)
          .multiply(ol.getOrderedQuantity().subtract(invoiceQty));

      adjustAmtOther = amtPendingInvoiceConverted.subtract(
          amtProportionalInitialCost.setScale(costCurPrecission, RoundingMode.HALF_UP)).subtract(
          otherCorrectionAmt.subtract(materialTransaction.getTransactionCost()));

      if (adjustAmtOther.compareTo(BigDecimal.ZERO) != 0) {
        createCostAdjustmenHeader(materialTransaction.getOrganization());
        CostAdjustmentLine costAdjLine = CostAdjustmentUtils.insertCostAdjustmentLine(
            materialTransaction, costAdjHeader, adjustAmtOther, Boolean.TRUE, null,
            materialTransaction.getGoodsShipmentLine().getShipmentReceipt().getMovementDate());
        costAdjLine.setNeedsPosting(Boolean.TRUE);
        OBDal.getInstance().save(costAdjLine);
      }
    }

    materialTransaction.setCheckpricedifference(false);
    OBDal.getInstance().save(materialTransaction);

  }

  public static JSONObject processPriceDifferenceTransaction(MaterialTransaction materialTransaction)
      throws OBException {
    costAdjHeader = null;

    calculateTransactionPriceDifference(materialTransaction);

    if (costAdjHeader != null) {
      try {
        OBDal.getInstance().flush();
        JSONObject message = CostAdjustmentProcess.doProcessCostAdjustment(costAdjHeader);

        if (message.get("severity") != "success") {
          throw new OBException(OBMessageUtils.parseTranslation("@ErrorProcessingCostAdj@") + ": "
              + costAdjHeader.getDocumentNo() + " - " + message.getString("text"));
        }
        return message;
      } catch (JSONException e) {
        throw new OBException(OBMessageUtils.parseTranslation("@ErrorProcessingCostAdj@"));
      }
    } else {
      JSONObject message = new JSONObject();
      try {
        message.put("severity", "success");
        message.put("title", "");
        message.put("text", OBMessageUtils.messageBD("Success"));
      } catch (JSONException ignore) {
      }
      return message;
    }
  }

  /**
   * Method to process a cost adjustment.
   * 
   * @param costAdj
   *          the cost adjustment to be processed.
   * @return the message to be shown to the user properly formatted and translated to the user
   *         language.
   * @throws OBException
   *           when there is an error that prevents the cost adjustment to be processed.
   * @throws JSONException
   */
  public static JSONObject processPriceDifference(Date date, Product product) throws OBException {

    costAdjHeader = null;

    OBCriteria<MaterialTransaction> mTrxs = OBDal.getInstance().createCriteria(
        MaterialTransaction.class);
    if (date != null) {
      mTrxs.add(Restrictions.le(MaterialTransaction.PROPERTY_MOVEMENTDATE, date));
    }
    if (product != null) {
      mTrxs.add(Restrictions.eq(MaterialTransaction.PROPERTY_PRODUCT, product));
    }
    mTrxs.add(Restrictions.eq(MaterialTransaction.PROPERTY_CHECKPRICEDIFFERENCE, true));
    mTrxs.addOrderBy(MaterialTransaction.PROPERTY_MOVEMENTDATE, true);
    mTrxs.addOrderBy(MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE, true);
    ScrollableResults lines = mTrxs.scroll(ScrollMode.FORWARD_ONLY);

    try {
      while (lines.next()) {
        MaterialTransaction line = (MaterialTransaction) lines.get(0);
        calculateTransactionPriceDifference(line);
      }
    } finally {
      lines.close();
    }
    if (costAdjHeader != null) {
      try {
        OBDal.getInstance().flush();
        JSONObject message = CostAdjustmentProcess.doProcessCostAdjustment(costAdjHeader);

        if (message.get("severity") != "success") {
          throw new OBException(OBMessageUtils.parseTranslation("@ErrorProcessingCostAdj@") + ": "
              + costAdjHeader.getDocumentNo() + " - " + message.getString("text"));
        }
        return message;
      } catch (JSONException e) {
        throw new OBException(OBMessageUtils.parseTranslation("@ErrorProcessingCostAdj@"));
      }
    } else {
      JSONObject message = new JSONObject();
      try {
        message.put("severity", "success");
        message.put("title", "");
        message.put("text", OBMessageUtils.messageBD("Success"));
      } catch (JSONException ignore) {
      }
      return message;
    }
  }

  private static void createCostAdjustmenHeader(Organization org) {
    if (costAdjHeader == null) {
      costAdjHeader = CostAdjustmentUtils.insertCostAdjustmentHeader(org, "PDC"); // Price Dif
                                                                                  // Correction
    }
  }
}
