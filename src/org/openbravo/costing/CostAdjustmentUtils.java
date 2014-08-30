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
import java.util.Set;

import org.apache.log4j.Logger;
import org.openbravo.advpaymentmngt.utility.FIN_Utility;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.financial.FinancialUtils;
import org.openbravo.model.common.currency.Currency;
import org.openbravo.model.common.enterprise.DocumentType;
import org.openbravo.model.common.enterprise.Locator;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.materialmgmt.cost.CostAdjustment;
import org.openbravo.model.materialmgmt.cost.CostAdjustmentLine;
import org.openbravo.model.materialmgmt.cost.TransactionCost;
import org.openbravo.model.materialmgmt.transaction.MaterialTransaction;

public class CostAdjustmentUtils {
  private static final Logger log4j = Logger.getLogger(CostAdjustmentUtils.class);
  final static String strCategoryCostAdj = "CAD";
  final static String strTableCostAdj = "M_CostAdjustment";

  /**
   * @param organization
   *          organization set in record
   * 
   * @param sourceProcess
   *          the process that origin the Cost Adjustment: - MCC: Manual Cost Correction - IAU:
   *          Inventory Amount Update - PDC: Price Difference Correction - LC: Landed Cost - BDT:
   *          Backdated Transaction
   */
  public static CostAdjustment insertCostAdjustmentHeader(Organization org, String sourceProcess) {

    final DocumentType docType = FIN_Utility.getDocumentType(org, strCategoryCostAdj);
    final String docNo = FIN_Utility.getDocumentNo(docType, strTableCostAdj);

    CostAdjustment costAdjustment = OBProvider.getInstance().get(CostAdjustment.class);
    costAdjustment.setOrganization(org);
    costAdjustment.setDocumentType(docType);
    costAdjustment.setDocumentNo(docNo);
    costAdjustment.setReferenceDate(new Date());
    costAdjustment.setSourceProcess(sourceProcess);
    costAdjustment.setProcessed(Boolean.FALSE);
    OBDal.getInstance().save(costAdjustment);

    return costAdjustment;
  }

  /**
   * @param transaction
   *          transaction to apply the cost adjustment
   * 
   * @param costAdjustmentHeader
   *          header of line
   * 
   * @param costAdjusted
   *          amount to adjust in the cost
   * 
   * @param transactionDate
   *          date to do the transaction
   * 
   * @param isSource
   */
  public static CostAdjustmentLine insertCostAdjustmentLine(MaterialTransaction transaction,
      CostAdjustment costAdjustmentHeader, BigDecimal costAdjusted, boolean isSource,
      Date transactionDate, Date accountingDate) {

    CostAdjustmentLine costAdjustmentLine = OBProvider.getInstance().get(CostAdjustmentLine.class);
    costAdjustmentLine.setOrganization(costAdjustmentHeader.getOrganization());
    costAdjustmentLine.setCostAdjustment(costAdjustmentHeader);
    costAdjustmentLine.setAdjustmentAmount(costAdjusted);
    costAdjustmentLine.setCurrency(transaction.getCurrency());
    costAdjustmentLine.setInventoryTransaction(transaction);
    costAdjustmentLine.setSource(isSource);
    costAdjustmentLine.setTransactionDate(transactionDate);
    costAdjustmentLine.setAccountingDate(accountingDate);
    costAdjustmentLine.setLineNo(getNewLineNo(costAdjustmentHeader));

    OBDal.getInstance().save(costAdjustmentLine);

    return costAdjustmentLine;
  }

  /**
   * @param transaction
   *          transaction to check if cost adjustment should be applied
   * 
   * @param costDimensions
   *          dimensions used in costs
   */
  public static boolean isNeededCostAdjustmentByBackDateTrx(MaterialTransaction transaction,
      boolean includeWarehouseDimension) {

    final String orgLegalId = OBContext.getOBContext()
        .getOrganizationStructureProvider(transaction.getClient().getId())
        .getLegalEntity(transaction.getOrganization()).getId();
    // Get child tree of organizations.
    Set<String> orgs = OBContext.getOBContext().getOrganizationStructureProvider()
        .getChildTree(orgLegalId, true);

    StringBuffer where = new StringBuffer();
    where.append(" as trx");
    where.append("   join trx." + MaterialTransaction.PROPERTY_STORAGEBIN + " as locator");
    where.append(" where trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE
        + " < :transactionProcessDate");
    where.append("   and trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE
        + " > :transactionMovementDate");
    where.append("   and trx." + MaterialTransaction.PROPERTY_PRODUCT
        + ".id = :transactionProductId");
    where.append("   and trx." + MaterialTransaction.PROPERTY_ORGANIZATION + ".id in (:orgs)");

    if (includeWarehouseDimension) {
      where.append("  and locator." + Locator.PROPERTY_WAREHOUSE + ".id = :warehouse");
    }

    OBQuery<MaterialTransaction> trxQry = OBDal.getInstance().createQuery(
        MaterialTransaction.class, where.toString());

    trxQry.setNamedParameter("transactionProcessDate", transaction.getTransactionProcessDate());
    trxQry.setNamedParameter("transactionMovementDate", transaction.getMovementDate());
    trxQry.setNamedParameter("transactionProductId", transaction.getProduct().getId());
    trxQry.setNamedParameter("orgs", orgs);
    if (includeWarehouseDimension) {
      trxQry.setNamedParameter("warehouse", transaction.getStorageBin().getWarehouse().getId());
    }
    trxQry.setMaxResult(1);
    Object res = trxQry.uniqueResult();

    return res != null;
  }

  private static Long getNewLineNo(CostAdjustment cadj) {
    StringBuffer where = new StringBuffer();
    where.append(" as cal");
    where.append(" where cal." + CostAdjustmentLine.PROPERTY_COSTADJUSTMENT
        + ".id = :costAdjustment");
    where.append(" order by cal." + CostAdjustmentLine.PROPERTY_LINENO + " desc");
    OBQuery<CostAdjustmentLine> calQry = OBDal.getInstance().createQuery(CostAdjustmentLine.class,
        where.toString());
    calQry.setNamedParameter("costAdjustment", cadj.getId());
    calQry.setMaxResult(1);

    if (calQry.uniqueResult() != null) {
      return calQry.uniqueResult().getLineNo() + 10L;
    }
    return 10L;
  }

  public static BigDecimal getTrxCost(MaterialTransaction trx, boolean justUnitCost,
      Currency currency) {
    // log4j.debug("Get Transaction Cost");
    if (!trx.isCostCalculated()) {
      // Transaction hasn't been calculated yet.
      log4j.error("  *** No cost found for transaction " + trx.getIdentifier() + " with id "
          + trx.getId());
      throw new OBException("@NoCostFoundForTrxOnDate@ @Transaction@: " + trx.getIdentifier());
    }
    BigDecimal cost = BigDecimal.ZERO;
    for (TransactionCost trxCost : trx.getTransactionCostList()) {
      if (!justUnitCost || trxCost.isUnitCost()) {
        if (trxCost.getCurrency().getId().equals(currency.getId())) {
          cost = cost.add(trxCost.getCost());
        } else {
          cost = cost.add(FinancialUtils.getConvertedAmount(trxCost.getCost(),
              trxCost.getCurrency(), currency, trxCost.getCostDate(), trxCost.getOrganization(),
              FinancialUtils.PRECISION_COSTING));
        }
      }
    }
    return cost;
  }
}
