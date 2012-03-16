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
 * All portions are Copyright (C) 2012 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 *************************************************************************
 */
package org.openbravo.costing;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.apache.log4j.Logger;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.util.OBClassLoader;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.OBDateUtils;
import org.openbravo.model.common.currency.Currency;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.materialmgmt.cost.CostingRule;
import org.openbravo.model.materialmgmt.cost.CostingRuleProductV;
import org.openbravo.model.materialmgmt.cost.TransactionCost;
import org.openbravo.model.materialmgmt.transaction.MaterialTransaction;

/**
 * @author gorkaion
 * 
 */
public class CostingServer {
  private MaterialTransaction transaction;
  private BigDecimal trxCost;
  protected static Logger log4j = Logger.getLogger(CostingServer.class);
  private CostingRule costingRule;
  private Currency currency;
  private Organization organization;

  public CostingServer(MaterialTransaction transaction) {
    this.transaction = transaction;
    init();
  }

  private void init() {
    costingRule = getCostDimensionRule();
    organization = getOrganization();
    currency = getCostCurrency();
    trxCost = transaction.getTransactionCost();
  }

  /**
   * Calculates and stores in the database the cost of the transaction.
   * 
   */
  public void process() throws OBException {
    if (trxCost != null) {
      // Transaction cost has already been calculated. Nothing to do.
      return;
    }
    try {
      OBContext.setAdminMode(false);
      // Get needed algorithm. And set it in the M_Transaction.
      CostingAlgorithm costingAlgorithm = getCostingAlgorithm();
      costingAlgorithm.init(this);
      log4j.debug("Algorithm initializated: " + costingAlgorithm.getClass());

      trxCost = costingAlgorithm.getTransactionCost();
      if (trxCost == null) {
        throw new OBException("@NoCostCalculated@: " + transaction.getIdentifier());
      }

      trxCost.setScale(costingAlgorithm.getCostCurrency().getStandardPrecision().intValue(),
          RoundingMode.HALF_UP);
      log4j.debug("Transaction cost: " + trxCost.toString());
      // Save calculated cost on M_Transaction.
      transaction.setTransactionCost(trxCost);
      transaction.setCostCalculated(true);
      // insert on m_transaction_cost
      createTransactionCost();
      OBDal.getInstance().save(transaction);
      OBDal.getInstance().flush();
    } finally {
      OBContext.restorePreviousMode();
    }
    return;
  }

  private CostingAlgorithm getCostingAlgorithm() {
    // Algorithm class is retrieved from costDimensionRule
    org.openbravo.model.materialmgmt.cost.CostingAlgorithm costAlgorithm = costingRule
        .getCostingAlgorithm();
    transaction.setCostingAlgorithm(costAlgorithm);

    try {
      final Class<?> clz = OBClassLoader.getInstance().loadClass(costAlgorithm.getJavaClassName());
      return (CostingAlgorithm) clz.newInstance();
    } catch (Exception e) {
      log4j.error("Exception loading Algorithm class: " + costAlgorithm.getJavaClassName()
          + " algorithm: " + costAlgorithm.getIdentifier());
      throw new OBException("@AlgorithmClassNotLoaded@: " + costAlgorithm.getName(), e);
    }
  }

  private void createTransactionCost() {
    TransactionCost transactionCost = OBProvider.getInstance().get(TransactionCost.class);
    transactionCost.setInventoryTransaction(transaction);
    transactionCost.setCost(trxCost);
    transactionCost.setCostDate(transaction.getTransactionProcessDate());
    OBDal.getInstance().save(transactionCost);
  }

  public BigDecimal getTransactionCost() {
    return trxCost;
  }

  private CostingRule getCostDimensionRule() {
    List<CostingRuleProductV> crps = transaction.getProduct()
        .getCostingRuleProductVApplyProductList();
    if (crps.size() == 0) {
      throw new OBException("@NoCostingRuleFoundForProductAndDate@ @Product@: "
          + transaction.getProduct().getName() + ", @Date@: "
          + OBDateUtils.formatDate(transaction.getTransactionProcessDate()));
    }
    CostingRule returncr = null;
    boolean noProdCat = true;
    for (CostingRuleProductV crp : crps) {
      // Date range check if not correct continue with next CostingRuleProduct
      CostingRule cr = crp.getCostingRule();
      if (cr.getStartingDate().after(transaction.getTransactionProcessDate())
          || (cr.getEndingDate() != null && !transaction.getTransactionProcessDate().before(
              cr.getEndingDate()))) {
        continue;
      }
      if (cr.getProduct() != null) {
        return cr;
      }
      if (noProdCat) {
        returncr = cr;
        if (cr.getProductCategory() != null) {
          noProdCat = false;
        }
      }
    }
    if (returncr == null) {
      throw new OBException("@NoCostingRuleFoundForProductAndDate@ @Product@: "
          + transaction.getProduct().getName() + ", @Date@: "
          + OBDateUtils.formatDate(transaction.getTransactionProcessDate()));
    }
    return returncr;
  }

  public Currency getCostCurrency() {
    if (currency != null) {
      return currency;
    }
    if (organization != null) {
      if (!organization.getId().equals("0") && organization.getCurrency() != null) {
        return organization.getCurrency();
      }
      return OBContext.getOBContext().getCurrentClient().getCurrency();
    } else {
      init();
      return getCostCurrency();
    }
  }

  public Organization getOrganization() {
    if (costingRule.isOrganizationDimension()) {
      return OBContext.getOBContext().getOrganizationStructureProvider()
          .getLegalEntity(transaction.getOrganization());
    }
    return OBDal.getInstance().get(Organization.class, "0");
  }

  public CostingRule getCostingRule() {
    return costingRule;
  }

  public MaterialTransaction getTransaction() {
    return transaction;
  }

  /**
   * Transaction types implemented on the cost engine.
   */
  public enum TrxType {
    Shipment, ShipmentReturn, ShipmentVoid, ShipmentNegative, Receipt, ReceiptReturn, ReceiptVoid, ReceiptNegative, InventoryIncrease, InventoryDecrease, IntMovementFrom, IntMovementTo, InternalCons, InternalConsNegative, InternalConsVoid, BOMPart, BOMProduct, Manufacturing, Unknown;
    /**
     * Given a Material Management transaction returns its type.
     */
    static TrxType getTrxType(MaterialTransaction transaction) {
      if (transaction.getGoodsShipmentLine() != null) {
        // Receipt / Shipment
        org.openbravo.model.materialmgmt.transaction.ShipmentInOut inout = transaction
            .getGoodsShipmentLine().getShipmentReceipt();
        if (inout.isSalesTransaction()) {
          // Shipment
          if (inout.getDocumentType().isReturn()) {
            log4j.debug("Reversal shipment: " + transaction.getGoodsShipmentLine().getIdentifier());
            return ShipmentReturn;
          } else if (inout.getDocumentStatus().equals("VO")
              && transaction.getGoodsShipmentLine().getMovementQuantity()
                  .compareTo(BigDecimal.ZERO) < 0) {
            log4j.debug("Void shipment: " + transaction.getGoodsShipmentLine().getIdentifier());
            return ShipmentVoid;
          } else if (transaction.getGoodsShipmentLine().getMovementQuantity()
              .compareTo(BigDecimal.ZERO) < 0) {
            log4j.debug("Negative Shipment: " + transaction.getGoodsShipmentLine().getIdentifier());
            return ShipmentNegative;
          } else {
            log4j.debug("Shipment: " + transaction.getGoodsShipmentLine().getIdentifier());
            return Shipment;
          }
        } else {
          // Receipt
          if (inout.getDocumentType().isReturn()) {
            log4j.debug("Reversal Receipt: " + transaction.getGoodsShipmentLine().getIdentifier());
            return ReceiptReturn;
          } else if (inout.getDocumentStatus().equals("VO")
              && transaction.getGoodsShipmentLine().getMovementQuantity()
                  .compareTo(BigDecimal.ZERO) < 0) {
            log4j.debug("Void receipt: " + transaction.getGoodsShipmentLine().getIdentifier());
            return ReceiptVoid;
          } else if (transaction.getGoodsShipmentLine().getMovementQuantity()
              .compareTo(BigDecimal.ZERO) < 0) {
            log4j.debug("Negative Receipt: " + transaction.getGoodsShipmentLine().getIdentifier());
            return ReceiptNegative;
          } else {
            log4j.debug("Receipt: " + transaction.getGoodsShipmentLine().getIdentifier());
            return Receipt;
          }
        }
      } else if (transaction.getPhysicalInventoryLine() != null) {
        // Physical Inventory
        if (transaction.getMovementQuantity().compareTo(BigDecimal.ZERO) > 0) {
          log4j.debug("Physical inventory, increments stock: "
              + transaction.getPhysicalInventoryLine().getIdentifier());
          return InventoryIncrease;
        } else {
          log4j.debug("Physical inventory, decreases stock "
              + transaction.getPhysicalInventoryLine().getIdentifier());
          return InventoryDecrease;
        }
      } else if (transaction.getMovementLine() != null) {
        // Internal movement
        if (transaction.getMovementQuantity().compareTo(BigDecimal.ZERO) > 0) {
          log4j.debug("Internal Movement to: " + transaction.getMovementLine().getIdentifier());
          return IntMovementTo;
        } else {
          log4j.debug("Internal Movement from: " + transaction.getMovementLine().getIdentifier());
          return IntMovementFrom;
        }
      } else if (transaction.getInternalConsumptionLine() != null) {
        if (transaction.getInternalConsumptionLine().getVoidedInternalConsumptionLine() != null) {
          return InternalConsVoid;
        } else if (transaction.getMovementQuantity().compareTo(BigDecimal.ZERO) > 0) {
          log4j.debug("Negative Internal Consumption: "
              + transaction.getInternalConsumptionLine().getIdentifier());
          return InternalConsNegative;
        } else {
          log4j.debug("Internal Consumption: "
              + transaction.getInternalConsumptionLine().getIdentifier());
          return InternalCons;
        }
      } else if (transaction.getProductionLine() != null) {
        // Production Line
        if (transaction.getProductionLine().getProductionPlan().getProduction()
            .isSalesTransaction()) {
          // BOM Production
          if (transaction.getMovementQuantity().compareTo(BigDecimal.ZERO) > 0) {
            log4j.debug("Produced BOM product: " + transaction.getProductionLine().getIdentifier());
            return BOMProduct;
          } else {
            log4j.debug("Used BOM Part: " + transaction.getProductionLine().getIdentifier());
            // Used parts
            return BOMPart;
          }
        } else {
          log4j.debug("Manufacturing Product");
          // Work Effort
          // TODO: Pending to implement manufacturing cost management.
          return Manufacturing;
        }
      }
      return Unknown;
    }

  }
}
