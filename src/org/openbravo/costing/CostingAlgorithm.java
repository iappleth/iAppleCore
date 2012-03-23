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
import java.util.Date;
import java.util.HashMap;
import java.util.List;

import org.apache.log4j.Logger;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.costing.CostingServer.TrxType;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.erpCommon.utility.OBDateUtils;
import org.openbravo.financial.FinancialUtils;
import org.openbravo.model.common.businesspartner.BusinessPartner;
import org.openbravo.model.common.currency.Currency;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.common.order.OrderLine;
import org.openbravo.model.materialmgmt.cost.Costing;
import org.openbravo.model.materialmgmt.transaction.MaterialTransaction;
import org.openbravo.model.materialmgmt.transaction.ProductionLine;
import org.openbravo.model.pricing.pricelist.PriceList;
import org.openbravo.model.pricing.pricelist.ProductPrice;

public abstract class CostingAlgorithm {
  protected MaterialTransaction transaction;
  protected HashMap<CostDimension, BaseOBObject> costDimensions = new HashMap<CostDimension, BaseOBObject>();
  protected Organization costOrg;
  protected Currency costCurrency;
  protected TrxType trxType;
  protected static Logger log4j = Logger.getLogger(CostingAlgorithm.class);

  /**
   * Initializes the instance of the CostingAlgorith with the MaterailTransaction that is being to
   * be calculated and the cost dimensions values in case they have to be used.
   * 
   * It initializes several values: <list><li>Organization, it's used the Legal Entity dimension. If
   * this is null Asterisk organization is used. <li>Currency, it takes the currency defined for the
   * Organization. If this is null it uses the currency defined for the Client. <li>Transaction
   * Type, it calculates its type. </list>
   * 
   * @param _transaction
   *          MaterialTransaction to calculate its cost.
   * @param costingRule
   * @param currency
   * @param organization
   * @param _costDimensions
   *          Dimension values to calculate the cost based on them. A null value means that the
   *          dimension is not used.
   */
  public void init(CostingServer costingServer) {
    transaction = costingServer.getTransaction();
    costOrg = costingServer.getOrganization();
    costCurrency = costingServer.getCostCurrency();
    trxType = TrxType.getTrxType(this.transaction);

    org.openbravo.model.materialmgmt.cost.CostingRule costingRule = costingServer.getCostingRule();
    costDimensions = CostingUtils.getEmptyDimensions();
    if (costingRule.isWarehouseDimension()) {
      costDimensions.put(CostDimension.Warehouse, transaction.getStorageBin().getWarehouse());
    }

  }

  /**
   * Based on the transaction type, calls the corresponding method to calculate and return the total
   * cost amount of the transaction.
   * 
   * @return the total cost amount of the transaction.
   * @throws OBException
   *           when the transaction type is unknown.
   */
  public BigDecimal getTransactionCost() throws OBException {
    log4j.debug("Get transactions cost.");
    if (transaction.getMovementQuantity().compareTo(BigDecimal.ZERO) == 0
        && getZeroMovementQtyCost() != null) {
      return getZeroMovementQtyCost();
    }
    switch (trxType) {
    case Shipment:
      return getShipmentCost();
    case ShipmentReturn:
      return getShipmentReturnCost();
    case ShipmentVoid:
      return getShipmentVoidCost();
    case ShipmentNegative:
      return getShipmentNegativeCost();
    case Receipt:
      return getReceiptCost();
    case ReceiptReturn:
      return getReceiptReturnCost();
    case ReceiptVoid:
      return getReceiptVoidCost();
    case ReceiptNegative:
      return getReceiptNegativeCost();
    case InventoryDecrease:
      return getInventoryDecreaseCost();
    case InventoryIncrease:
      return getInventoryIncreaseCost();
    case IntMovementFrom:
      return getIntMovementFromCost();
    case IntMovementTo:
      return getIntMovementToCost();
    case InternalCons:
      return getInternalConsCost();
    case InternalConsNegative:
      return getInternalConsNegativeCost();
    case InternalConsVoid:
      return getInternalConsVoidCost();
    case BOMPart:
      return getBOMPartCost();
    case BOMProduct:
      return getBOMProductCost();
    case Manufacturing:
      // Manufacturing transactions are not implemented.
      return BigDecimal.ZERO;
    case Unknown:
      throw new OBException("@UnknownTrxType@: " + transaction.getIdentifier());
    default:
      throw new OBException("@UnknownTrxType@: " + transaction.getIdentifier());
    }
  }

  /**
   * Calculates the total cost amount of an outgoing transaction.
   */
  abstract protected BigDecimal getOutgoingTransactionCost();

  /**
   * Auxiliary method for transactions with 0 Movement quantity. It can be overwritten by Costing
   * Algorithms to return null if further actions are needed.
   */
  protected BigDecimal getZeroMovementQtyCost() {
    return BigDecimal.ZERO;
  }

  /**
   * Calculates the cost of a Shipment line using by default the
   * {@link #getOutgoingTransactionCost()} method as a regular outgoing transaction.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   */
  protected BigDecimal getShipmentCost() {
    return getOutgoingTransactionCost();
  }

  /**
   * Method to calculate cost of Returned Shipments. Cost is calculated based on the proportional
   * cost of the original receipt. If no original receipt is found the default cost is returned.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   */
  protected BigDecimal getShipmentReturnCost() {
    if (transaction.getGoodsShipmentLine().getSalesOrderLine() != null
        && transaction.getGoodsShipmentLine().getSalesOrderLine().getGoodsShipmentLine() != null) {
      return getReturnedInOutLineCost();
    } else {
      return getDefaultCost();
    }
  }

  /**
   * Method to calculate the cost of Voided Shipments. By default the cost is calculated getting the
   * cost of the original shipment. If no original shipment is found the Default Cost is returned.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   */
  protected BigDecimal getShipmentVoidCost() {
    if (transaction.getGoodsShipmentLine().getCanceledInoutLine() == null) {
      return getDefaultCost();
    }
    return getOriginalInOutLineCost();
  }

  /**
   * Calculates the cost of a negative Shipment line. By default if the product is purchased the
   * cost is based on its purchase price. If it is not purchased its Standard Cost is used.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   */
  protected BigDecimal getShipmentNegativeCost() {
    return getDefaultCost();
  }

  /*
   * Calculates the cost of a Receipt line based on its related order price. When no related order
   * is found its returned the cost based on the newer of the following three values: 1. Last
   * purchase order price of the receipt's vendor for the product, 2. Purchase pricelist of the
   * product and 3. Default Cost of the product.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   */
  protected BigDecimal getReceiptCost() {
    BigDecimal trxCost = BigDecimal.ZERO;
    org.openbravo.model.materialmgmt.transaction.ShipmentInOutLine receiptline = transaction
        .getGoodsShipmentLine();
    if (receiptline.getSalesOrderLine() == null) {
      // FIXME: Try also searching a recent purchase order of the vendor for the same product
      return getReceiptDefaultCost();
    }
    for (org.openbravo.model.procurement.POInvoiceMatch matchPO : receiptline
        .getProcurementPOInvoiceMatchList()) {
      BigDecimal orderAmt = matchPO.getQuantity().multiply(
          matchPO.getSalesOrderLine().getUnitPrice());
      trxCost = trxCost.add(FinancialUtils.getConvertedAmount(orderAmt, matchPO.getSalesOrderLine()
          .getSalesOrder().getCurrency(), costCurrency, transaction.getMovementDate(), costOrg,
          FinancialUtils.PRECISION_STANDARD));
    }
    return trxCost;
  }

  /**
   * Calculates the cost of a Returned Receipt line as a regular outgoing transaction.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   */
  protected BigDecimal getReceiptReturnCost() {
    return getOutgoingTransactionCost();
  }

  /**
   * Method to calculate the cost of Voided Receipts. By default the cost is calculated getting the
   * cost of the original payment. If no original Receipt is found cost is calculated as a regular
   * outgoing transaction.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   */
  protected BigDecimal getReceiptVoidCost() {
    if (transaction.getGoodsShipmentLine().getCanceledInoutLine() == null) {
      return getOutgoingTransactionCost();
    }
    return getOriginalInOutLineCost();
  }

  /**
   * Calculates the cost of a Negative Receipt line using by default the
   * {@link #getOutgoingTransactionCost()} method as a regular outgoing transaction.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   */
  protected BigDecimal getReceiptNegativeCost() {
    return getOutgoingTransactionCost();
  }

  protected BigDecimal getReceiptDefaultCost() {
    Costing stdCost = CostingUtils.getStandardCostDefinition(transaction.getProduct(), costOrg,
        transaction.getTransactionProcessDate(), costDimensions);
    BusinessPartner bp = transaction.getGoodsShipmentLine().getShipmentReceipt()
        .getBusinessPartner();

    PriceList pricelist = bp.getPurchasePricelist();
    ProductPrice pp = FinancialUtils.getProductPrice(transaction.getProduct(),
        transaction.getMovementDate(), false, pricelist, false);
    OrderLine orderLine = CostingUtils.getOrderLine(transaction.getProduct(), bp, costOrg);

    if (stdCost == null && pp == null && orderLine == null) {
      throw new OBException("@NoPriceListOrStandardCostForProduct@ @Organization@: "
          + costOrg.getName() + ", @Product@: " + transaction.getProduct().getName() + ", @Date@: "
          + OBDateUtils.formatDate(transaction.getTransactionProcessDate()));
    }
    Date stdCostDate = new Date(0L);
    if (stdCost != null) {
      stdCostDate = stdCost.getStartingDate();
    }
    Date ppDate = new Date(0L);
    if (pp != null) {
      ppDate = pp.getPriceListVersion().getValidFromDate();
    }
    Date olDate = new Date(0L);
    if (orderLine != null) {
      olDate = orderLine.getSalesOrder().getOrderDate();
    }

    if (ppDate.before(olDate) && stdCostDate.before(olDate)) {
      // purchase order
      @SuppressWarnings("null")
      BigDecimal cost = transaction.getMovementQuantity().abs().multiply(orderLine.getUnitPrice());
      if (costCurrency.getId().equals(orderLine.getSalesOrder().getCurrency().getId())) {
        return cost;
      } else {
        return FinancialUtils
            .getConvertedAmount(cost, orderLine.getSalesOrder().getCurrency(), costCurrency,
                transaction.getMovementDate(), costOrg, FinancialUtils.PRECISION_STANDARD);
      }
    } else {
      return getDefaultCost();
    }
  }

  /**
   * Returns the cost of the canceled Shipment/Receipt line on the date it is canceled.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   * @throws OBException
   *           when no original in out line is found.
   */
  protected BigDecimal getOriginalInOutLineCost() throws OBException {
    if (transaction.getGoodsShipmentLine().getCanceledInoutLine() == null) {
      log4j.error("No canceled line found for transaction: " + transaction.getId());
      throw new OBException("@NoCanceledLineFoundForTrx@ @Transaction@: "
          + transaction.getIdentifier());
    }
    MaterialTransaction origInOutLineTrx = transaction.getGoodsShipmentLine()
        .getCanceledInoutLine().getMaterialMgmtMaterialTransactionList().get(0);

    return CostingUtils.getTransactionCost(origInOutLineTrx,
        transaction.getTransactionProcessDate());
  }

  /**
   * Gets the returned in out line and returns the proportional cost amount based on the original
   * movement quantity and the returned movement quantity.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   * @throws OBException
   *           when no original in out line is found.
   */
  protected BigDecimal getReturnedInOutLineCost() throws OBException {
    MaterialTransaction originalTrx = null;
    try {
      originalTrx = transaction.getGoodsShipmentLine().getSalesOrderLine().getGoodsShipmentLine()
          .getMaterialMgmtMaterialTransactionList().get(0);
    } catch (Exception e) {
      throw new OBException("@NoReturnedLineFoundForTrx@ @Transaction@: "
          + transaction.getIdentifier());
    }
    BigDecimal originalCost = CostingUtils.getTransactionCost(originalTrx,
        transaction.getTransactionProcessDate());
    return originalCost.multiply(transaction.getMovementQuantity().abs()).divide(
        originalTrx.getMovementQuantity().abs(), costCurrency.getStandardPrecision().intValue(),
        RoundingMode.HALF_UP);
  }

  /**
   * Calculates the cost of a Inventory line that decrease the stock using by default the
   * {@link #getOutgoingTransactionCost()} method as a regular outgoing transaction.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   */
  protected BigDecimal getInventoryDecreaseCost() {
    return getOutgoingTransactionCost();
  }

  /**
   * Calculates the total cost amount of a physical inventory that results on an increment of stock.
   * Default Cost is used.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   */
  protected BigDecimal getInventoryIncreaseCost() {
    return getDefaultCost();
  }

  /**
   * Calculates the cost of the From transaction of an Internal Movement line using by default the
   * {@link #getOutgoingTransactionCost()} method as a regular outgoing transaction.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   */
  protected BigDecimal getIntMovementFromCost() {
    return getOutgoingTransactionCost();
  }

  /**
   * Calculates the total cost amount of an incoming internal movement. The cost amount is the same
   * than the related outgoing transaction. The outgoing transaction cost is calculated if it has
   * not been yet.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   * @throws OBException
   *           when no related internal movement is found.
   */
  protected BigDecimal getIntMovementToCost() {
    // Get transaction of From movement to retrieve it's cost.
    for (MaterialTransaction movementTransaction : transaction.getMovementLine()
        .getMaterialMgmtMaterialTransactionList()) {
      if (movementTransaction.getId().equals(transaction.getId())) {
        continue;
      }
      // Calculate transaction cost if it is not calculated yet.
      return CostingUtils.getTransactionCost(movementTransaction,
          transaction.getTransactionProcessDate(), true);
    }
    // If no transaction is found throw an exception.
    throw new OBException("@NoInternalMovementTransactionFound@ @Transaction@: "
        + transaction.getIdentifier());
  }

  /**
   * Calculates the cost of an Internal Consumption line using by default the
   * {@link #getOutgoingTransactionCost()} method as a regular outgoing transaction.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   */
  protected BigDecimal getInternalConsCost() {
    return getOutgoingTransactionCost();
  }

  /**
   * Calculates the cost of a negative internal consumption using the Default Cost.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   */
  protected BigDecimal getInternalConsNegativeCost() {
    return getDefaultCost();
  }

  /**
   * Returns the cost of the original internal consumption.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   */
  protected BigDecimal getInternalConsVoidCost() {
    return CostingUtils.getTransactionCost(transaction.getInternalConsumptionLine()
        .getVoidedInternalConsumptionLine().getMaterialMgmtMaterialTransactionList().get(0),
        transaction.getTransactionProcessDate(), true);
  }

  /**
   * Calculates the cost of a BOM Production used part using by default the
   * {@link #getOutgoingTransactionCost()} method as a regular outgoing transaction.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   */
  protected BigDecimal getBOMPartCost() {
    return getOutgoingTransactionCost();
  }

  /**
   * Calculates the cost of a produced BOM product. Its cost is the sum of the used products
   * transactions costs. If these has not been calculated yet they are calculated.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   */
  protected BigDecimal getBOMProductCost() {
    List<ProductionLine> productionLines = transaction.getProductionLine().getProductionPlan()
        .getManufacturingProductionLineList();
    // Remove produced BOM line.
    productionLines.remove(transaction.getProductionLine());
    BigDecimal totalCost = BigDecimal.ZERO;
    for (ProductionLine prodLine : productionLines) {
      MaterialTransaction partTransaction = prodLine.getMaterialMgmtMaterialTransactionList()
          .get(0);
      // Calculate transaction cost if it is not calculated yet.
      totalCost = totalCost.add(CostingUtils.getTransactionCost(partTransaction,
          transaction.getTransactionProcessDate(), true));
    }
    return totalCost;
  }

  protected BigDecimal getDefaultCost() {
    Costing stdCost = CostingUtils.getStandardCostDefinition(transaction.getProduct(), costOrg,
        transaction.getTransactionProcessDate(), costDimensions);
    BusinessPartner bp = CostingUtils.getTrxBusinessPartner(transaction, trxType);
    PriceList pricelist = null;
    if (bp != null) {
      pricelist = bp.getPurchasePricelist();
    }
    ProductPrice pp = FinancialUtils.getProductPrice(transaction.getProduct(),
        transaction.getMovementDate(), false, pricelist, false);
    if (stdCost == null && pp == null) {
      throw new OBException("@NoPriceListOrStandardCostForProduct@ @Organization@: "
          + costOrg.getName() + ", @Product@: " + transaction.getProduct().getName() + ", @Date@: "
          + OBDateUtils.formatDate(transaction.getTransactionProcessDate()));
    } else if (stdCost != null && pp == null) {
      return getTransactionStandardCost();
    } else if (stdCost == null && pp != null) {
      return getPriceListCost();
    } else if (stdCost != null && pp != null
        && stdCost.getStartingDate().before(pp.getPriceListVersion().getValidFromDate())) {
      return getPriceListCost();
    } else {
      return getTransactionStandardCost();
    }
  }

  /**
   * Calculates the transaction cost based on the Standard Cost of the product on the Transaction
   * Process Date.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   */
  protected BigDecimal getTransactionStandardCost() {
    BigDecimal standardCost = CostingUtils.getStandardCost(transaction.getProduct(), costOrg,
        transaction.getTransactionProcessDate(), costDimensions);
    return transaction.getMovementQuantity().abs().multiply(standardCost);
  }

  /**
   * Calculates the transaction cost based on the purchase price list of the product. It searches
   * first for a default price list and if none exists takes one.
   * 
   * @return BigDecimal object representing the total cost amount of the transaction.
   * @throws OBException
   *           when no PriceList is found for the product.
   */
  protected BigDecimal getPriceListCost() {
    org.openbravo.model.common.businesspartner.BusinessPartner bp = CostingUtils
        .getTrxBusinessPartner(transaction, trxType);
    org.openbravo.model.pricing.pricelist.PriceList pricelist = null;
    if (bp != null) {
      pricelist = bp.getPurchasePricelist();
    }
    org.openbravo.model.pricing.pricelist.ProductPrice pp = FinancialUtils.getProductPrice(
        transaction.getProduct(), transaction.getMovementDate(), false, pricelist);
    BigDecimal cost = pp.getStandardPrice().multiply(transaction.getMovementQuantity().abs());
    if (DalUtil.getId(pp.getPriceListVersion().getPriceList().getCurrency()).equals(
        costCurrency.getId())) {
      // no conversion needed
      return cost;
    }
    return FinancialUtils.getConvertedAmount(cost, pp.getPriceListVersion().getPriceList()
        .getCurrency(), costCurrency, transaction.getMovementDate(), costOrg,
        FinancialUtils.PRECISION_STANDARD);
  }

  /**
   * @return the base currency used to calculate all the costs.
   */
  public Currency getCostCurrency() {
    return costCurrency;
  }

  /**
   * Dimensions available to manage the cost on an entity.
   */
  public enum CostDimension {
    Warehouse
  }
}
