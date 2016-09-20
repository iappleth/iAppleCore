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
 * All portions are Copyright (C) 2014-2016 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 *************************************************************************
 */
package org.openbravo.costing;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Set;

import org.apache.commons.lang.StringUtils;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
import org.hibernate.criterion.Restrictions;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.client.kernel.ComponentProvider;
import org.openbravo.costing.CostingAlgorithm.CostDimension;
import org.openbravo.costing.CostingServer.TrxType;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.security.OrganizationStructureProvider;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.erpCommon.utility.OBDateUtils;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.financial.FinancialUtils;
import org.openbravo.model.ad.system.Client;
import org.openbravo.model.common.currency.Currency;
import org.openbravo.model.common.enterprise.Locator;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.common.enterprise.Warehouse;
import org.openbravo.model.materialmgmt.cost.CostAdjustmentLine;
import org.openbravo.model.materialmgmt.cost.Costing;
import org.openbravo.model.materialmgmt.cost.CostingRule;
import org.openbravo.model.materialmgmt.cost.TransactionCost;
import org.openbravo.model.materialmgmt.transaction.MaterialTransaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@ComponentProvider.Qualifier("org.openbravo.costing.AverageAlgorithm")
public class AverageCostAdjustment extends CostingAlgorithmAdjustmentImp {
  private static final Logger log = LoggerFactory.getLogger(CostAdjustmentProcess.class);
  private String bdCostingId;

  @Override
  protected void init(CostAdjustmentLine costAdjLine) {
    super.init(costAdjLine);
    bdCostingId = "";
  }

  @Override
  protected void getRelatedTransactionsByAlgorithm() {
    // Search all transactions after the date of the adjusted line and recalculate the costs of them
    // to adjust differences
    MaterialTransaction basetrx = getTransaction();
    // Transactions of closing inventories are managed by generic CostAdjustmentProcess adjusting
    // the cost of the related opening inventory.
    if (basetrx.getPhysicalInventoryLine() != null
        && basetrx.getPhysicalInventoryLine().getRelatedInventory() != null) {
      return;
    }
    BigDecimal signMultiplier = new BigDecimal(basetrx.getMovementQuantity().signum());
    Date trxDate = basetrx.getTransactionProcessDate();

    BigDecimal adjustmentBalance = BigDecimal.ZERO;
    BigDecimal unitCostAdjustmentBalance = BigDecimal.ZERO;
    // Initialize adjustment balance looping through all cost adjustment lines of current
    // transaction.
    log.debug("Initialize adjustment balance");
    CostAdjustmentLine baseCAL = getCostAdjLine();
    for (CostAdjustmentLine costAdjLine : getTrxAdjustmentLines(basetrx)) {
      if (costAdjLine.isSource() && !costAdjLine.isRelatedTransactionAdjusted()
          && !costAdjLine.getId().equals(strCostAdjLineId)) {
        searchRelatedTransactionCosts(costAdjLine);
      }

      costAdjLine.setRelatedTransactionAdjusted(Boolean.TRUE);
      if (!costAdjLine.getId().equals(strCostAdjLineId)) {
        costAdjLine.setParentCostAdjustmentLine(baseCAL);
      }
      OBDal.getInstance().save(costAdjLine);
      // If the cost adjustment line has Transaction Costs those adjustment amount are included
      // in the Current Value Amount and not in the Adjustment Balance
      if (!costAdjLine.getTransactionCostList().isEmpty()) {
        continue;
      }
      BigDecimal adjustmentAmt = costAdjLine.getAdjustmentAmount();
      if (!strCostCurrencyId.equals(costAdjLine.getCurrency().getId())) {
        adjustmentAmt = FinancialUtils.getConvertedAmount(adjustmentAmt, costAdjLine.getCurrency(),
            getCostCurrency(), costAdjLine.getAccountingDate(), getCostOrg(),
            FinancialUtils.PRECISION_STANDARD);
      }
      adjustmentBalance = adjustmentBalance.add(adjustmentAmt.multiply(signMultiplier));
      if (costAdjLine.isUnitCost()) {
        unitCostAdjustmentBalance = unitCostAdjustmentBalance.add(adjustmentAmt);
      }
    }

    // Initialize current stock qty and value amt.
    BigDecimal currentStock = CostAdjustmentUtils.getStockOnTransactionDate(getCostOrg(), basetrx,
        getCostDimensions(), isManufacturingProduct, areBackdatedTrxFixed);
    BigDecimal currentValueAmt = CostAdjustmentUtils.getValuedStockOnTransactionDate(getCostOrg(),
        basetrx, getCostDimensions(), isManufacturingProduct, areBackdatedTrxFixed,
        getCostCurrency());
    log.debug("Adjustment balance: " + adjustmentBalance.toPlainString()
        + ", current stock {}, current value {}", currentStock.toPlainString(),
        currentValueAmt.toPlainString());

    // Initialize current unit cost including the cost adjustments.
    Costing costing = AverageAlgorithm.getProductCost(trxDate, basetrx.getProduct(),
        getCostDimensions(), getCostOrg());
    if (costing == null) {
      throw new OBException("@NoAvgCostDefined@ @Organization@: " + getCostOrg().getName()
          + ", @Product@: " + basetrx.getProduct().getName() + ", @Date@: "
          + OBDateUtils.formatDate(trxDate));
    }
    BigDecimal cost = null;
    // If current stock is zero the cost is not modified until a related transaction that modifies
    // the stock is found.
    if (currentStock.signum() != 0) {
      cost = currentValueAmt.add(adjustmentBalance).divide(currentStock, costCurPrecission,
          RoundingMode.HALF_UP);
    }
    log.debug("Starting average cost {}", cost == null ? "not cost" : cost.toPlainString());
    if (AverageAlgorithm.modifiesAverage(trxType) || !baseCAL.isBackdatedTrx()) {
      BigDecimal trxUnitCost = CostAdjustmentUtils.getTrxCost(basetrx, true, getCostCurrency());
      BigDecimal trxPrice = null;
      if (basetrx.getMovementQuantity().signum() == 0) {
        trxPrice = BigDecimal.ZERO;
      } else {
        trxPrice = trxUnitCost.add(unitCostAdjustmentBalance).divide(
            basetrx.getMovementQuantity().abs(), costCurPrecission, RoundingMode.HALF_UP);
      }
      if (cost == null) {
        cost = trxPrice;
      }
      if (checkNegativeStockCorrection && currentStock.compareTo(basetrx.getMovementQuantity()) < 0
          && cost.compareTo(trxPrice) != 0 && !baseCAL.isNegativeStockCorrection()
          && AverageAlgorithm.modifiesAverage(trxType)) {
        // stock was negative and cost different than trx price then Negative Stock Correction
        // is added
        BigDecimal trxSignMultiplier = new BigDecimal(basetrx.getMovementQuantity().signum());
        BigDecimal negCorrAmt = trxPrice.multiply(currentStock)
            .setScale(stdCurPrecission, RoundingMode.HALF_UP).subtract(currentValueAmt)
            .subtract(adjustmentBalance);
        adjustmentBalance = adjustmentBalance.add(negCorrAmt.multiply(trxSignMultiplier));
        // If there is a difference insert a cost adjustment line.
        CostAdjustmentLine newCAL = insertCostAdjustmentLine(basetrx, negCorrAmt, null);
        newCAL.setNegativeStockCorrection(Boolean.TRUE);
        newCAL.setRelatedTransactionAdjusted(Boolean.TRUE);
        newCAL.setUnitCost(Boolean.FALSE);
        OBDal.getInstance().save(newCAL);
        cost = trxPrice;
        log.debug("Negative stock correction. Amount: {}, new cost {}", negCorrAmt.toPlainString(),
            cost.toPlainString());
      }
      if (basetrx.getMaterialMgmtCostingList().isEmpty()) {
        Date newDate = new Date();
        Date dateTo = costing.getEndingDate();
        costing.setEndingDate(newDate);
        OBDal.getInstance().save(costing);
        Costing newCosting = OBProvider.getInstance().get(Costing.class);
        newCosting.setCost(cost);
        newCosting.setCurrency((Currency) OBDal.getInstance().getProxy(Currency.ENTITY_NAME,
            strCostCurrencyId));
        newCosting.setStartingDate(newDate);
        newCosting.setEndingDate(dateTo);
        newCosting.setInventoryTransaction(basetrx);
        newCosting.setProduct(basetrx.getProduct());
        if (isManufacturingProduct) {
          newCosting.setOrganization((Organization) OBDal.getInstance().getProxy(
              Organization.ENTITY_NAME, "0"));
        } else {
          newCosting.setOrganization((Organization) OBDal.getInstance().getProxy(
              Organization.ENTITY_NAME, strCostOrgId));
        }
        newCosting.setQuantity(basetrx.getMovementQuantity());
        newCosting.setTotalMovementQuantity(null);
        newCosting.setTotalStockValuation(null);
        newCosting.setPrice(cost);
        newCosting.setCostType("AVA");
        newCosting.setManual(Boolean.FALSE);
        newCosting.setPermanent(Boolean.TRUE);
        newCosting.setProduction(trxType == TrxType.ManufacturingProduced);
        newCosting.setWarehouse((Warehouse) getCostDimensions().get(CostDimension.Warehouse));
        OBDal.getInstance().save(newCosting);
        OBDal.getInstance().flush();
      } else {
        Costing curCosting = basetrx.getMaterialMgmtCostingList().get(0);

        if (curCosting.getCost().compareTo(cost) != 0
            || (curCosting.getTotalMovementQuantity() != null && curCosting
                .getTotalMovementQuantity().compareTo(currentStock) != 0)) {
          curCosting.setPermanent(Boolean.FALSE);
          OBDal.getInstance().save(curCosting);
          OBDal.getInstance().flush();
          // Update existing costing
          if (curCosting.getCost().compareTo(cost) != 0) {
            if (curCosting.getOriginalCost() == null) {
              curCosting.setOriginalCost(curCosting.getCost());
            }
            curCosting.setCost(cost);
            curCosting.setPrice(trxPrice);
          }
          curCosting.setTotalMovementQuantity(null);
          curCosting.setTotalStockValuation(null);
          curCosting.setPermanent(Boolean.TRUE);
          OBDal.getInstance().flush();
          OBDal.getInstance().save(curCosting);
        }
      }
    }

    // Modify isManufacturingProduct flag in case it has changed at some point.
    isManufacturingProduct = (costing.getOrganization().getId()).equals("0");

    ScrollableResults trxs = getRelatedTransactions();
    String strCurrentCurId = strCostCurrencyId;
    try {
      while (trxs.next()) {
        MaterialTransaction trx = (MaterialTransaction) trxs.get()[0];
        log.debug("Process related transaction {}", trx.getIdentifier());
        BigDecimal trxSignMultiplier = new BigDecimal(trx.getMovementQuantity().signum());
        BigDecimal trxAdjAmt = BigDecimal.ZERO;
        BigDecimal trxUnitCostAdjAmt = BigDecimal.ZERO;
        if (StringUtils.isNotEmpty(bdCostingId) && !isBackdatedTransaction(trx)) {
          // If there is a backdated source adjustment pending modify the dates of its m_costing.
          updateBDCostingTimeRange(trx);
          // This update is done only on the first related transaction.
          bdCostingId = "";
        }

        if (!strCurrentCurId.equals(trx.getCurrency().getId())) {
          Currency curCurrency = OBDal.getInstance().get(Currency.class, strCurrentCurId);
          Organization costOrg = getCostOrg();

          currentValueAmt = FinancialUtils.getConvertedAmount(currentValueAmt, curCurrency,
              trx.getCurrency(), trx.getMovementDate(), costOrg, FinancialUtils.PRECISION_STANDARD);
          if (cost != null) {
            cost = FinancialUtils.getConvertedAmount(cost, curCurrency, trx.getCurrency(),
                trx.getMovementDate(), costOrg, FinancialUtils.PRECISION_COSTING);
          }

          strCurrentCurId = trx.getCurrency().getId();
        }

        List<CostAdjustmentLine> existingAdjLines = getTrxAdjustmentLines(trx);
        for (CostAdjustmentLine existingCAL : existingAdjLines) {
          if (existingCAL.isSource() && !existingCAL.isRelatedTransactionAdjusted()) {
            searchRelatedTransactionCosts(existingCAL);
          }
          if (existingCAL.getTransactionCostList().isEmpty()
              && !existingCAL.isRelatedTransactionAdjusted()) {
            BigDecimal adjustmentAmt = existingCAL.getAdjustmentAmount();
            if (!strCurrentCurId.equals(existingCAL.getCurrency().getId())) {
              Currency curCurrency = OBDal.getInstance().get(Currency.class, strCurrentCurId);
              adjustmentAmt = FinancialUtils.getConvertedAmount(adjustmentAmt,
                  existingCAL.getCurrency(), curCurrency, existingCAL.getAccountingDate(),
                  getCostOrg(), FinancialUtils.PRECISION_STANDARD);
            }
            trxAdjAmt = trxAdjAmt.add(adjustmentAmt);
            adjustmentBalance = adjustmentBalance.add(adjustmentAmt.multiply(trxSignMultiplier));
            if (existingCAL.isUnitCost()) {
              trxUnitCostAdjAmt = trxUnitCostAdjAmt.add(adjustmentAmt);
            }
          }

          existingCAL.setRelatedTransactionAdjusted(Boolean.TRUE);
          existingCAL.setParentCostAdjustmentLine((CostAdjustmentLine) OBDal.getInstance()
              .getProxy(CostAdjustmentLine.ENTITY_NAME, strCostAdjLineId));

          OBDal.getInstance().save(existingCAL);
        }
        log.debug("Current trx adj amount of existing CALs {}", trxAdjAmt.toPlainString());

        BigDecimal trxCost = CostAdjustmentUtils.getTrxCost(trx, false,
            OBDal.getInstance().get(Currency.class, strCurrentCurId));
        BigDecimal trxUnitCost = CostAdjustmentUtils.getTrxCost(trx, true,
            OBDal.getInstance().get(Currency.class, strCurrentCurId));
        currentValueAmt = currentValueAmt.add(trxCost.multiply(trxSignMultiplier));
        currentStock = currentStock.add(trx.getMovementQuantity());
        log.debug("Updated current stock {} and, current value {}", currentStock.toPlainString(),
            currentValueAmt.toPlainString());

        TrxType currentTrxType = TrxType.getTrxType(trx);

        if (AverageAlgorithm.modifiesAverage(currentTrxType)) {
          // Recalculate average, if current stock is zero the average is not modified
          if (currentStock.signum() != 0) {
            cost = currentValueAmt.add(adjustmentBalance).divide(currentStock, costCurPrecission,
                RoundingMode.HALF_UP);
          }
          if (cost == null) {
            continue;
          }
          log.debug("New average cost: {}", cost.toPlainString());
          Costing curCosting = trx.getMaterialMgmtCostingList().get(0);
          BigDecimal trxPrice = null;
          if (trx.getMovementQuantity().signum() == 0) {
            trxPrice = BigDecimal.ZERO;
          } else {
            trxPrice = trxUnitCost.add(trxUnitCostAdjAmt).divide(trx.getMovementQuantity().abs(),
                costCurPrecission, RoundingMode.HALF_UP);
          }

          if (checkNegativeStockCorrection && currentStock.compareTo(trx.getMovementQuantity()) < 0
              && cost.compareTo(trxPrice) != 0) {
            // stock was negative and cost different than trx price then Negative Stock Correction
            // is added
            BigDecimal negCorrAmt = trxPrice.multiply(currentStock)
                .setScale(stdCurPrecission, RoundingMode.HALF_UP).subtract(currentValueAmt)
                .subtract(adjustmentBalance);
            adjustmentBalance = adjustmentBalance.add(negCorrAmt.multiply(trxSignMultiplier));
            trxAdjAmt = trxAdjAmt.add(negCorrAmt.multiply(trxSignMultiplier));
            // If there is a difference insert a cost adjustment line.
            CostAdjustmentLine newCAL = insertCostAdjustmentLine(trx, negCorrAmt, null);
            newCAL.setNegativeStockCorrection(Boolean.TRUE);
            newCAL.setRelatedTransactionAdjusted(Boolean.TRUE);
            newCAL.setUnitCost(Boolean.FALSE);
            OBDal.getInstance().save(newCAL);
            cost = trxPrice;
            log.debug("Negative stock correction. Amount: {}, new cost {}",
                negCorrAmt.toPlainString(), cost.toPlainString());
          } else if (checkNegativeStockCorrection
              && currentStock.compareTo(trx.getMovementQuantity()) >= 0) {
            List<CostAdjustmentLine> costAdjustmentLineList = getNegativeStockAdjustments(trx);
            BigDecimal revertedNegativeAdjustment = BigDecimal.ZERO;
            if (!costAdjustmentLineList.isEmpty()) {
              for (CostAdjustmentLine costAdjustmentLine : costAdjustmentLineList) {
                revertedNegativeAdjustment = revertedNegativeAdjustment.add(costAdjustmentLine
                    .getAdjustmentAmount().negate());
              }
              adjustmentBalance = adjustmentBalance.add(revertedNegativeAdjustment);
              trxAdjAmt = trxAdjAmt.add(revertedNegativeAdjustment);
              // If there is a difference insert a cost adjustment line.
              CostAdjustmentLine newCAL = insertCostAdjustmentLine(trx, revertedNegativeAdjustment,
                  null);
              newCAL.setNegativeStockCorrection(Boolean.TRUE);
              newCAL.setRelatedTransactionAdjusted(Boolean.TRUE);
              newCAL.setUnitCost(Boolean.FALSE);
              OBDal.getInstance().save(newCAL);
              cost = currentValueAmt.add(adjustmentBalance).divide(currentStock, costCurPrecission,
                  RoundingMode.HALF_UP);
              log.debug("Revert Negative stock correction. Amount: {}, new cost {}",
                  revertedNegativeAdjustment.toPlainString(), cost.toPlainString());
            }
          }

          if (curCosting.getCost().compareTo(cost) == 0
              && StringUtils.isEmpty(bdCostingId)
              && (curCosting.getTotalMovementQuantity() != null && curCosting
                  .getTotalMovementQuantity().compareTo(currentStock) == 0)) {
            // new cost hasn't changed and total movement qty is equal to current stock, following
            // transactions will have the same cost, so no more
            // related transactions are needed to include.
            // If bdCosting is not empty it is needed to loop through the next related transaction
            // to set the new time ringe of the costing.
            log.debug("New cost matches existing cost. Adjustment finished.");
            return;
          } else {
            // Update existing costing
            curCosting.setPermanent(Boolean.FALSE);
            OBDal.getInstance().save(curCosting);
            OBDal.getInstance().flush();
            if (curCosting.getCost().compareTo(cost) != 0) {
              if (curCosting.getOriginalCost() == null) {
                curCosting.setOriginalCost(curCosting.getCost());
              }
              curCosting.setPrice(trxPrice);
              curCosting.setCost(cost);
            }
            curCosting.setTotalMovementQuantity(null);
            curCosting.setTotalStockValuation(null);
            curCosting.setPermanent(Boolean.TRUE);
            OBDal.getInstance().save(curCosting);
          }
        } else if (cost != null && !isVoidedTrx(trx, currentTrxType)) {
          if (!trx.isCostPermanent()) {
            // Check current trx unit cost matches new expected cost
            BigDecimal expectedCost = cost.multiply(trx.getMovementQuantity().abs()).setScale(
                stdCurPrecission, RoundingMode.HALF_UP);
            BigDecimal unitCost = CostAdjustmentUtils.getTrxCost(trx, true, OBDal.getInstance()
                .get(Currency.class, strCurrentCurId));
            unitCost = unitCost.add(trxAdjAmt);
            log.debug("Is adjustment needed? Expected {} vs Current {}",
                expectedCost.toPlainString(), unitCost.toPlainString());
            if (expectedCost.compareTo(unitCost) != 0) {
              trxAdjAmt = trxAdjAmt
                  .add(expectedCost.subtract(unitCost).multiply(trxSignMultiplier));
              trxUnitCostAdjAmt = trxUnitCostAdjAmt.add(expectedCost.subtract(unitCost));
              adjustmentBalance = adjustmentBalance.add(expectedCost.subtract(unitCost).multiply(
                  trxSignMultiplier));
              // If there is a difference insert a cost adjustment line.
              CostAdjustmentLine newCAL = insertCostAdjustmentLine(trx,
                  expectedCost.subtract(unitCost), null);
              newCAL.setRelatedTransactionAdjusted(Boolean.TRUE);
              OBDal.getInstance().save(newCAL);
              log.debug("Adjustment added. Amount {}.", expectedCost.subtract(unitCost)
                  .toPlainString());
            }
          }
          if (!trx.getMaterialMgmtCostingList().isEmpty()) {
            Costing curCosting = trx.getMaterialMgmtCostingList().get(0);
            if (currentStock.signum() != 0) {
              cost = currentValueAmt.add(adjustmentBalance).divide(currentStock, costCurPrecission,
                  RoundingMode.HALF_UP);
            }
            BigDecimal trxPrice = null;
            if (trx.getMovementQuantity().signum() == 0) {
              trxPrice = BigDecimal.ZERO;
            } else {
              trxPrice = trxUnitCost.add(trxUnitCostAdjAmt).divide(trx.getMovementQuantity().abs(),
                  costCurPrecission, RoundingMode.HALF_UP);
            }
            if (curCosting.getCost().compareTo(cost) != 0
                || (curCosting.getTotalMovementQuantity() != null && curCosting
                    .getTotalMovementQuantity().compareTo(currentStock) != 0)) {
              curCosting.setPermanent(Boolean.FALSE);
              OBDal.getInstance().save(curCosting);
              OBDal.getInstance().flush();
              if (curCosting.getCost().compareTo(cost) != 0) {
                if (curCosting.getOriginalCost() == null) {
                  curCosting.setOriginalCost(curCosting.getCost());
                }
                curCosting.setPrice(trxPrice);
                curCosting.setCost(cost);
              }
              curCosting.setTotalMovementQuantity(null);
              curCosting.setTotalStockValuation(null);
              curCosting.setPermanent(Boolean.TRUE);
              OBDal.getInstance().save(curCosting);
            }
          }
        }

        OBDal.getInstance().flush();
        OBDal.getInstance().getSession().clear();
      }
    } finally {
      trxs.close();
    }

    if (getCostingRule().getEndingDate() == null && cost != null) {
      // This is the current costing rule. Check if current average cost needs to be updated.
      Costing currentCosting = AverageAlgorithm.getProductCost(new Date(), basetrx.getProduct(),
          getCostDimensions(), getCostOrg());
      if (currentCosting == null) {
        throw new OBException("@NoAvgCostDefined@ @Organization@: " + getCostOrg().getName()
            + ", @Product@: " + basetrx.getProduct().getName() + ", @Date@: "
            + OBDateUtils.formatDate(new Date()));
      }
      if (currentCosting.getCost().compareTo(cost) != 0) {
        // Update existing costing
        currentCosting.setPermanent(Boolean.FALSE);
        OBDal.getInstance().save(currentCosting);
        OBDal.getInstance().flush();

        if (currentCosting.getOriginalCost() == null) {
          currentCosting.setOriginalCost(currentCosting.getCost());
        }
        currentCosting.setPrice(cost);
        currentCosting.setCost(cost);
        currentCosting.setTotalMovementQuantity(null);
        currentCosting.setTotalStockValuation(null);
        currentCosting.setManual(Boolean.FALSE);
        currentCosting.setPermanent(Boolean.TRUE);
        OBDal.getInstance().save(currentCosting);
      }
    }
  }

  private List<CostAdjustmentLine> getNegativeStockAdjustments(MaterialTransaction trx) {
    OBCriteria<CostAdjustmentLine> critLines = OBDal.getInstance().createCriteria(
        CostAdjustmentLine.class);
    critLines.add(Restrictions.eq(CostAdjustmentLine.PROPERTY_INVENTORYTRANSACTION, trx));
    critLines.add(Restrictions.eq(CostAdjustmentLine.PROPERTY_ISNEGATIVESTOCKCORRECTION, true));

    return critLines.list();
  }

  @Override
  protected void calculateBackdatedTrxAdjustment(CostAdjustmentLine costAdjLine) {
    MaterialTransaction trx = costAdjLine.getInventoryTransaction();
    TrxType calTrxType = TrxType.getTrxType(trx);
    if (AverageAlgorithm.modifiesAverage(calTrxType)) {
      // The bdCosting average related to the backdated transaction needs to be moved to its correct
      // date range, the last costing is the average cost that currently finishes when the costing
      // that needs to be moved starts. The "lastCosting" ending date needs to be updated to end in
      // the same date than the backdated costing so there is no gap between average costs.
      // The bdCosting dates are updated later when the first related transaction is checked.
      Costing bdCosting = trx.getMaterialMgmtCostingList().get(0);
      extendPreviousCosting(bdCosting);
    }
    super.calculateBackdatedTrxAdjustment(costAdjLine);
  }

  @Override
  protected BigDecimal getOutgoingBackdatedTrxAdjAmt(CostAdjustmentLine costAdjLine) {
    // Calculate the average cost on the transaction's movement date and adjust the cost if needed.
    MaterialTransaction trx = costAdjLine.getInventoryTransaction();
    Costing costing = getAvgCostOnMovementDate(trx, getCostDimensions(), getCostOrg(),
        areBackdatedTrxFixed);

    if (costing == null) {
      // In case the backdated transaction is on a date where the stock was not initialized there
      // isn't any costing entry related to an inventory transaction which results in a null
      // costing.
      // Try again with average algorithm getProductCost method using the movement date as
      // parameter.
      costing = AverageAlgorithm.getProductCost(trx.getMovementDate(), trx.getProduct(),
          getCostDimensions(), getCostOrg());
    }

    if (costing == null) {
      String errorMessage = OBMessageUtils.parseTranslation("@NoAvgCostDefined@ @Organization@: "
          + getCostOrg().getName() + ", @Product@: " + trx.getProduct().getName() + ", @Date@: "
          + OBDateUtils.formatDate(trx.getMovementDate()));
      throw new OBException(errorMessage);
    }
    BigDecimal cost = costing.getCost();
    Currency costCurrency = getCostCurrency();
    if (costing.getCurrency() != costCurrency) {
      cost = FinancialUtils.getConvertedAmount(costing.getCost(), costing.getCurrency(),
          costCurrency, trx.getTransactionProcessDate(), getCostOrg(),
          FinancialUtils.PRECISION_COSTING);
    }
    BigDecimal expectedCostAmt = trx.getMovementQuantity().abs().multiply(cost)
        .setScale(stdCurPrecission, RoundingMode.HALF_UP);
    BigDecimal currentCost = trx.getTransactionCost();
    return expectedCostAmt.subtract(currentCost);
  }

  @Override
  protected BigDecimal getDefaultCostDifference(TrxType calTrxType, CostAdjustmentLine costAdjLine) {
    MaterialTransaction trx = costAdjLine.getInventoryTransaction();
    Costing costing = getAvgCostOnMovementDate(trx, getCostDimensions(), getCostOrg(),
        areBackdatedTrxFixed);
    if (costing == null) {
      // In case the backdated transaction is on a date where the stock was not initialized there
      // isn't any costing entry related to an inventory transaction which results in a null
      // costing.
      // Try again with average algorithm getProductCost method using the movement date as
      // parameter.
      costing = AverageAlgorithm.getProductCost(trx.getMovementDate(), trx.getProduct(),
          getCostDimensions(), getCostOrg());
    }
    if (costing != null) {
      BigDecimal defaultCost = costing.getCost();
      Currency costCurrency = getCostCurrency();
      if (costing.getCurrency() != costCurrency) {
        defaultCost = FinancialUtils.getConvertedAmount(costing.getCost(), costing.getCurrency(),
            costCurrency, trx.getTransactionProcessDate(), getCostOrg(),
            FinancialUtils.PRECISION_COSTING);
      }
      BigDecimal trxCalculatedCost = CostAdjustmentUtils.getTrxCost(trx, true, getCostCurrency());
      defaultCost = trx.getMovementQuantity().abs().multiply(defaultCost)
          .setScale(stdCurPrecission, RoundingMode.HALF_UP);
      return defaultCost.subtract(trxCalculatedCost);
    }
    return super.getDefaultCostDifference(calTrxType, costAdjLine);
  }

  private ScrollableResults getRelatedTransactions() {
    CostingRule costingRule = getCostingRule();
    HashMap<CostDimension, BaseOBObject> costDimensions = getCostDimensions();
    OrganizationStructureProvider osp = OBContext.getOBContext().getOrganizationStructureProvider(
        costingRule.getClient().getId());
    Set<String> orgs = osp.getChildTree(strCostOrgId, true);
    if (isManufacturingProduct) {
      orgs = osp.getChildTree("0", false);
      costDimensions = CostingUtils.getEmptyDimensions();
    }
    MaterialTransaction trx = getTransaction();

    StringBuffer wh = new StringBuffer();
    wh.append(" as trx");
    if (costDimensions.get(CostDimension.Warehouse) != null) {
      wh.append("\n join trx." + MaterialTransaction.PROPERTY_STORAGEBIN + " as loc");
    }
    wh.append("\n , " + org.openbravo.model.ad.domain.List.ENTITY_NAME + " as trxtype");
    wh.append("\n where trxtype." + CostAdjustmentUtils.propADListReference + ".id = :refid");
    wh.append("  and trxtype." + CostAdjustmentUtils.propADListValue + " = trx."
        + MaterialTransaction.PROPERTY_MOVEMENTTYPE);

    wh.append("  and trx." + MaterialTransaction.PROPERTY_ISCOSTCALCULATED + " = true");
    wh.append("  and trx." + MaterialTransaction.PROPERTY_PRODUCT + " = :product");
    // Consider only transactions with movement date equal or later than the movement date of the
    // adjusted transaction. But for transactions with the same movement date only those with a
    // transaction date after the process date of the adjusted transaction.
    wh.append(" and (");

    if (costingRule.isBackdatedTransactionsFixed()) {
      wh.append("  (trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE + " < :fixbdt");
      wh.append("  and (");
    }

    wh.append("   trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE + " > :trxdate");
    wh.append("   or (");
    wh.append("    trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE + " = :trxdate");
    wh.append("    and (");
    wh.append("     trxtype." + CostAdjustmentUtils.propADListPriority + " > :trxtypeprio");
    wh.append("     or (");
    wh.append("      trxtype." + CostAdjustmentUtils.propADListPriority + " = :trxtypeprio");
    wh.append("      and trx." + MaterialTransaction.PROPERTY_MOVEMENTQUANTITY + " < :trxqty");
    wh.append("      or (");
    wh.append("        trx." + MaterialTransaction.PROPERTY_MOVEMENTQUANTITY + " = :trxqty");
    wh.append("        and trx." + MaterialTransaction.PROPERTY_ID + " > :trxid");
    wh.append("  )))))");

    if (costingRule.isBackdatedTransactionsFixed()) {
      wh.append(" ) or (");

      wh.append("  trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE + " >= :fixbdt");
      wh.append("  and (");
      wh.append("   trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE + " > :mvtdate");
      wh.append("   or (");
      wh.append("    trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE + " = :mvtdate");
      // If there are more than one trx on the same trx process date filter out those types with
      // less
      // priority and / or higher quantity.
      wh.append("    and (");
      wh.append("     trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE + " > :trxdate");
      wh.append("     or (");
      wh.append("      trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE + " = :trxdate");
      wh.append("      and (");
      wh.append("       trxtype." + CostAdjustmentUtils.propADListPriority + " > :trxtypeprio");
      wh.append("       or (");
      wh.append("        trxtype." + CostAdjustmentUtils.propADListPriority + " = :trxtypeprio");
      wh.append("        and trx." + MaterialTransaction.PROPERTY_MOVEMENTQUANTITY + " < :trxqty");
      wh.append("         or (");
      wh.append("          trx." + MaterialTransaction.PROPERTY_MOVEMENTQUANTITY + " = :trxqty");
      wh.append("          and trx." + MaterialTransaction.PROPERTY_ID + " > :trxid");
      wh.append("    )))))");
      wh.append(" ))))");
    }
    wh.append("  and trx." + MaterialTransaction.PROPERTY_ORGANIZATION + ".id in (:orgs)");
    if (costDimensions.get(CostDimension.Warehouse) != null) {
      wh.append("  and loc." + Locator.PROPERTY_WAREHOUSE + ".id = :warehouse");
    }
    if (costingRule.getEndingDate() != null) {
      wh.append("  and trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE + " <= :enddate");
    }
    wh.append("  and trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE + " > :startdate ");
    wh.append("\n order by ");
    if (areBackdatedTrxFixed) {
      // CASE WHEN trx.trxprocessdate < :fixfrom THEN 1-1-1900
      // ELSE trx.movmenetdate END
      wh.append(" trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE + ", ");
    }
    wh.append(" trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE);
    wh.append(" , trxtype." + CostAdjustmentUtils.propADListPriority);
    wh.append(" , trx." + MaterialTransaction.PROPERTY_MOVEMENTQUANTITY + " desc");
    wh.append(" , trx." + MaterialTransaction.PROPERTY_ID);

    OBQuery<MaterialTransaction> trxQry = OBDal.getInstance().createQuery(
        MaterialTransaction.class, wh.toString());
    trxQry.setFilterOnReadableOrganization(false);
    trxQry.setFilterOnReadableClients(false);
    trxQry.setNamedParameter("refid", CostAdjustmentUtils.MovementTypeRefID);
    trxQry.setNamedParameter("product", trx.getProduct());
    if (costingRule.isBackdatedTransactionsFixed()) {
      trxQry.setNamedParameter("mvtdate", trx.getMovementDate());
      trxQry.setNamedParameter("fixbdt", CostingUtils.getCostingRuleFixBackdatedFrom(costingRule));
    }
    trxQry.setNamedParameter("trxtypeprio",
        CostAdjustmentUtils.getTrxTypePrio(trx.getMovementType()));
    trxQry.setNamedParameter("trxdate", trx.getTransactionProcessDate());
    trxQry.setNamedParameter("trxqty", trx.getMovementQuantity());
    trxQry.setNamedParameter("trxid", trx.getId());
    trxQry.setNamedParameter("orgs", orgs);
    if (costDimensions.get(CostDimension.Warehouse) != null) {
      trxQry.setNamedParameter("warehouse", costDimensions.get(CostDimension.Warehouse).getId());
    }
    if (costingRule.getEndingDate() != null) {
      trxQry.setNamedParameter("enddate", costingRule.getEndingDate());
    }
    trxQry.setNamedParameter("startdate", CostingUtils.getCostingRuleStartingDate(costingRule));

    return trxQry.scroll(ScrollMode.FORWARD_ONLY);
  }

  private List<CostAdjustmentLine> getTrxAdjustmentLines(MaterialTransaction trx) {
    OBCriteria<CostAdjustmentLine> critLines = OBDal.getInstance().createCriteria(
        CostAdjustmentLine.class);
    critLines.add(Restrictions.eq(CostAdjustmentLine.PROPERTY_COSTADJUSTMENT, getCostAdj()));
    critLines.add(Restrictions.eq(CostAdjustmentLine.PROPERTY_INVENTORYTRANSACTION, trx));
    critLines.add(Restrictions.eq(CostAdjustmentLine.PROPERTY_ISRELATEDTRANSACTIONADJUSTED, false));

    return critLines.list();
  }

  @Override
  protected void calculateNegativeStockCorrectionAdjustmentAmount(CostAdjustmentLine costAdjLine) {
    MaterialTransaction basetrx = costAdjLine.getInventoryTransaction();
    boolean areBaseTrxBackdatedFixed = getCostingRule().isBackdatedTransactionsFixed()
        && !CostingUtils.getCostingRuleFixBackdatedFrom(getCostingRule()).before(
            basetrx.getTransactionProcessDate());
    BigDecimal currentStock = CostAdjustmentUtils.getStockOnTransactionDate(getCostOrg(), basetrx,
        getCostDimensions(), isManufacturingProduct, areBaseTrxBackdatedFixed);
    BigDecimal currentValueAmt = CostAdjustmentUtils.getValuedStockOnTransactionDate(getCostOrg(),
        basetrx, getCostDimensions(), isManufacturingProduct, areBaseTrxBackdatedFixed,
        getCostCurrency());

    Costing curCosting = basetrx.getMaterialMgmtCostingList().get(0);
    BigDecimal trxPrice = curCosting.getPrice();
    BigDecimal adjustAmt = currentStock.multiply(trxPrice)
        .setScale(stdCurPrecission, RoundingMode.HALF_UP).subtract(currentValueAmt);

    costAdjLine.setCurrency((Currency) OBDal.getInstance().getProxy(Currency.ENTITY_NAME,
        strCostCurrencyId));
    costAdjLine.setAdjustmentAmount(adjustAmt);
    OBDal.getInstance().save(costAdjLine);
  }

  /**
   * Calculates the average cost value of the transaction.
   */
  protected static Costing getAvgCostOnMovementDate(MaterialTransaction trx,
      HashMap<CostDimension, BaseOBObject> costDimensions, Organization costOrg,
      boolean areBackdatedTrxFixed) {

    // Get child tree of organizations.
    OrganizationStructureProvider osp = OBContext.getOBContext().getOrganizationStructureProvider(
        costOrg.getClient().getId());
    Set<String> orgs = osp.getChildTree(costOrg.getId(), true);

    StringBuffer where = new StringBuffer();
    where.append(" as c");
    where.append("\n  join c." + TransactionCost.PROPERTY_INVENTORYTRANSACTION + " as trx");
    if (costDimensions.get(CostDimension.Warehouse) != null) {
      where.append("\n  join trx." + MaterialTransaction.PROPERTY_STORAGEBIN + " as locator");
    }
    where.append("\n , " + org.openbravo.model.ad.domain.List.ENTITY_NAME + " as trxtype");
    where.append("\n where trxtype." + CostAdjustmentUtils.propADListReference + ".id = :refid");
    where.append("  and trxtype." + CostAdjustmentUtils.propADListValue + " = trx."
        + MaterialTransaction.PROPERTY_MOVEMENTTYPE);

    where.append("   and trx." + MaterialTransaction.PROPERTY_PRODUCT + ".id = :product");
    if (areBackdatedTrxFixed) {
      where.append("  and (");
      where.append("   trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE + " < :mvtdate");
      where.append("   or (");
      where.append("    trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE + " = :mvtdate");
    }
    // If there are more than one trx on the same trx process date filter out those types with less
    // priority and / or higher quantity.
    where.append(" and (");
    where.append("  trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE + " < :trxdate");
    where.append("  or (");
    where.append("   trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE + " = :trxdate");
    where.append("   and (");
    where.append("    trxtype." + CostAdjustmentUtils.propADListPriority + " < :trxtypeprio");
    where.append("    or (");
    where.append("     trxtype." + CostAdjustmentUtils.propADListPriority + " = :trxtypeprio");
    where.append("     and trx." + MaterialTransaction.PROPERTY_MOVEMENTQUANTITY + " >= :trxqty");
    where.append(" ))))");

    if (areBackdatedTrxFixed) {
      where.append("  ))");
    }
    // Include only transactions that have its cost calculated
    where.append("   and trx." + MaterialTransaction.PROPERTY_ISCOSTCALCULATED + " = true");
    if (costDimensions.get(CostDimension.Warehouse) != null) {
      where.append("  and locator." + Locator.PROPERTY_WAREHOUSE + ".id = :warehouse");
    }
    where.append("   and trx." + MaterialTransaction.PROPERTY_ORGANIZATION + ".id in (:orgs)");
    where.append(" order by ");
    if (areBackdatedTrxFixed) {
      where.append(" trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE + " desc, ");
    }
    where.append(" trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE + " desc ");
    where.append(" , trxtype." + CostAdjustmentUtils.propADListPriority + " desc ");
    where.append(" , trx." + MaterialTransaction.PROPERTY_MOVEMENTQUANTITY);
    where.append(" , trx." + MaterialTransaction.PROPERTY_ID);

    OBQuery<Costing> qryCost = OBDal.getInstance().createQuery(Costing.class, where.toString());
    qryCost.setNamedParameter("refid", CostAdjustmentUtils.MovementTypeRefID);
    qryCost.setNamedParameter("product", trx.getProduct().getId());
    qryCost.setNamedParameter("mvtdate", trx.getMovementDate());
    qryCost.setNamedParameter("trxdate", trx.getTransactionProcessDate());
    qryCost.setNamedParameter("trxtypeprio",
        CostAdjustmentUtils.getTrxTypePrio(trx.getMovementType()));
    qryCost.setNamedParameter("trxqty", trx.getMovementQuantity());

    if (costDimensions.get(CostDimension.Warehouse) != null) {
      qryCost.setNamedParameter("warehouse", costDimensions.get(CostDimension.Warehouse).getId());
    }
    qryCost.setNamedParameter("orgs", orgs);
    qryCost.setMaxResult(1);
    return qryCost.uniqueResult();
  }

  /**
   * Extends the Average Costing ending date to include the time range that leaves the given
   * backdated average costing when this is moved to the correct time range.
   * 
   * It stored the backdated costing id in a local field to be updated with the new time range when
   * the next related transaction is processed.
   * 
   * @param bdCosting
   *          the backdated costing
   */
  private void extendPreviousCosting(Costing bdCosting) {
    StringBuffer where = new StringBuffer();
    where.append(" as c");
    where.append("  left join c." + Costing.PROPERTY_INVENTORYTRANSACTION + " as trx");
    where.append(" where c." + Costing.PROPERTY_PRODUCT + " = :product");
    // FIXME: remove when manufacturing costs are fully migrated
    if (bdCosting.getProduct().isProduction()) {
      where.append("  and c." + Costing.PROPERTY_CLIENT + " = :client");
    } else {
      where.append("  and c." + Costing.PROPERTY_ORGANIZATION + " = :org");
    }
    where.append("   and c." + Costing.PROPERTY_COSTTYPE + " = 'AVA'");
    if (bdCosting.getWarehouse() == null) {
      where.append(" and c." + Costing.PROPERTY_WAREHOUSE + " is null");
    } else {
      where.append(" and c." + Costing.PROPERTY_WAREHOUSE + " = :warehouse");
    }
    where.append("   and c." + Costing.PROPERTY_ENDINGDATE + " = :endDate");

    where.append(" order by ");
    where.append(" trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE + " desc, ");
    where.append(" trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE + " desc");

    OBQuery<Costing> qryCosting = OBDal.getInstance().createQuery(Costing.class, where.toString());
    qryCosting.setNamedParameter("product", bdCosting.getProduct());
    // FIXME: remove when manufacturing costs are fully migrated
    if (bdCosting.getProduct().isProduction()) {
      qryCosting.setNamedParameter("client", bdCosting.getClient());
    } else {
      qryCosting.setNamedParameter("org", bdCosting.getOrganization());
    }
    if (bdCosting.getWarehouse() != null) {
      qryCosting.setNamedParameter("warehouse", bdCosting.getWarehouse());
    }
    qryCosting.setNamedParameter("endDate", bdCosting.getStartingDate());

    qryCosting.setMaxResult(1);

    Costing lastCosting = qryCosting.uniqueResult();
    bdCostingId = bdCosting.getId();
    lastCosting.setEndingDate(bdCosting.getEndingDate());
    OBDal.getInstance().save(lastCosting);
  }

  /**
   * Updates the backdated average costing time range.
   * 
   * <br>
   * The starting date of the bdCosting is the transaction process date of the given trx. The ending
   * date is defined by the average costing that is being shortened.
   * 
   * @param trx
   *          The material transaction that is used as a reference to set the new time range of the
   *          backdated average costing.
   */
  private void updateBDCostingTimeRange(MaterialTransaction trx) {
    Costing bdCosting = OBDal.getInstance().get(Costing.class, bdCostingId);
    bdCosting.setPermanent(Boolean.FALSE);
    OBDal.getInstance().save(bdCosting);
    // Fire trigger to allow to modify the average cost and starting date.
    OBDal.getInstance().flush();

    Costing curCosting = getTrxCurrentCosting(trx);
    if (curCosting != null) {
      bdCosting.setEndingDate(curCosting.getEndingDate());
      curCosting.setEndingDate(trx.getTransactionProcessDate());
      OBDal.getInstance().save(curCosting);
    } else {
      // There isn't any previous costing.
      bdCosting.setEndingDate(trx.getTransactionProcessDate());

    }
    bdCosting.setStartingDate(trx.getTransactionProcessDate());
    bdCosting.setPermanent(Boolean.TRUE);
    OBDal.getInstance().save(bdCosting);
  }

  /**
   * Returns the average costing that is valid on the given transaction process date.
   * 
   * @param trx
   *          MaterialTransaction to be used as time reference.
   * @return The average Costing
   */
  private Costing getTrxCurrentCosting(MaterialTransaction trx) {
    HashMap<CostDimension, BaseOBObject> costDimensions = getCostDimensions();
    StringBuffer where = new StringBuffer();
    where.append(" as c");
    where.append(" where c." + Costing.PROPERTY_PRODUCT + " = :product");
    // FIXME: remove when manufacturing costs are fully migrated
    if (isManufacturingProduct) {
      where.append("  and c." + Costing.PROPERTY_CLIENT + " = :client");
    } else {
      where.append("  and c." + Costing.PROPERTY_ORGANIZATION + " = :org");
    }
    if (costDimensions.get(CostDimension.Warehouse) == null) {
      where.append(" and c." + Costing.PROPERTY_WAREHOUSE + " is null");
    } else {
      where.append(" and c." + Costing.PROPERTY_WAREHOUSE + " = :warehouse");
    }
    where.append("   and c.id != :sourceid");
    where.append("   and c." + Costing.PROPERTY_ENDINGDATE + " >= :trxdate");
    // The starting date of the costing needs to be before the reference date to avoid the case when
    // the given transaction has a related average costing.
    where.append("   and c." + Costing.PROPERTY_STARTINGDATE + " < :trxdate");
    where.append(" order by c." + Costing.PROPERTY_STARTINGDATE + " desc");

    OBQuery<Costing> qryCosting = OBDal.getInstance().createQuery(Costing.class, where.toString());
    qryCosting.setNamedParameter("product", trx.getProduct());
    // FIXME: remove when manufacturing costs are fully migrated
    if (isManufacturingProduct) {
      qryCosting.setNamedParameter("client", OBDal.getInstance().get(Client.class, strClientId));
    } else {
      qryCosting.setNamedParameter("org", getCostOrg());
    }
    if (costDimensions.get(CostDimension.Warehouse) != null) {
      qryCosting.setNamedParameter("warehouse", costDimensions.get(CostDimension.Warehouse));
    }
    qryCosting.setNamedParameter("sourceid", bdCostingId);
    qryCosting.setNamedParameter("trxdate", trx.getTransactionProcessDate());

    qryCosting.setMaxResult(1);

    return qryCosting.uniqueResult();
  }

  private boolean isVoidedTrx(MaterialTransaction trx, TrxType currentTrxType) {
    // Transactions of voided documents do not need adjustment
    switch (currentTrxType) {
    case ReceiptVoid:
    case ShipmentVoid:
    case InternalConsVoid:
      return true;
    case Receipt:
    case ReceiptNegative:
    case ReceiptReturn:
    case Shipment:
    case ShipmentNegative:
    case ShipmentReturn:
      if (trx.getGoodsShipmentLine().getShipmentReceipt().getDocumentStatus().equals("VO")) {
        return true;
      }
      break;
    case InternalCons:
    case InternalConsNegative:
      if (trx.getInternalConsumptionLine().getInternalConsumption().getStatus().equals("VO")) {
        return true;
      }
      break;
    default:
      break;
    }
    return false;
  }

  /**
   * Returns true if a transaction is a backdated transaction (has related backdated transaction
   * adjustments).
   * 
   * @param trx
   *          MaterialTransaction to check if is backdated or not.
   * @return boolean
   */
  private boolean isBackdatedTransaction(MaterialTransaction trx) {
    OBCriteria<CostAdjustmentLine> critLines = OBDal.getInstance().createCriteria(
        CostAdjustmentLine.class);
    critLines.add(Restrictions.eq(CostAdjustmentLine.PROPERTY_INVENTORYTRANSACTION, trx));
    critLines.add(Restrictions.eq(CostAdjustmentLine.PROPERTY_ISBACKDATEDTRX, true));
    critLines.setMaxResults(1);
    return critLines.uniqueResult() != null;
  }
}
