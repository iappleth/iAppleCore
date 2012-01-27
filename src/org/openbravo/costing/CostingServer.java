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
import java.util.HashMap;

import org.apache.log4j.Logger;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.base.util.OBClassLoader;
import org.openbravo.costing.CostingAlgorithm.CostDimension;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.materialmgmt.cost.TransactionCost;
import org.openbravo.model.materialmgmt.transaction.MaterialTransaction;

/**
 * @author gorkaion
 * 
 */
public class CostingServer {
  private MaterialTransaction transaction;
  private HashMap<CostDimension, BaseOBObject> costDimensions = new HashMap<CostDimension, BaseOBObject>();
  private BigDecimal trxCost;
  protected static Logger log4j = Logger.getLogger(CostingServer.class);

  // private String costDimensionRule;

  public CostingServer(MaterialTransaction transaction) {
    this.transaction = transaction;
    init();
  }

  private void init() {
    // costDimensionRule = getCostDimensionRule();
    // FIXME: dimensions need to be assigned based on costDimensionRule.
    costDimensions.put(CostDimension.LegalEntity, OBContext.getOBContext()
        .getOrganizationStructureProvider().getLegalEntity(transaction.getOrganization()));
    costDimensions.put(CostDimension.Warehouse, transaction.getStorageBin().getWarehouse());
    trxCost = transaction.getTransactionCost();
  }

  public void process() throws OBException {
    if (trxCost != null) {
      // Transaction cost has already been calculated. Nothing to do.
      return;
    }
    try {
      OBContext.setAdminMode(false);
      // Get needed algorithm. And set it in the M_Transaction.
      CostingAlgorithm costingAlgorithm = getCostingAlgorithm();
      costingAlgorithm.init(transaction, costDimensions);
      log4j.debug("Algorithm initializated: " + costingAlgorithm.getClass());

      trxCost = costingAlgorithm.getTransactionCost();
      if (trxCost == null) {
        trxCost = CostingUtils.getStandardCost(transaction.getProduct(),
            transaction.getCreationDate(), costDimensions);
      }
      // FIXME: Check why is still null and throw an error message stopping the processes
      if (trxCost == null) {
        trxCost = BigDecimal.ZERO;
      }

      trxCost.setScale(costingAlgorithm.getCostCurrency().getStandardPrecision().intValue(),
          RoundingMode.HALF_UP);
      log4j.debug("Transaction cost: " + trxCost.toString());
      // Save calculated cost on M_Transaction.
      transaction.setTransactionCost(trxCost);
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
    try {
      // Algorithm class is retrieved from costDimensionRule
      String strAlgorithmClass = "org.openbravo.costing.DummyAlgorithm";

      final Class<?> clz = OBClassLoader.getInstance().loadClass(strAlgorithmClass);
      return (CostingAlgorithm) clz.newInstance();
    } catch (Exception e) {
      throw new OBException(e);
    }
  }

  private void createTransactionCost() {
    TransactionCost transactionCost = OBProvider.getInstance().get(TransactionCost.class);
    transactionCost.setInventoryTransaction(transaction);
    transactionCost.setCost(trxCost);
    // FIXME: review which date should be used
    transactionCost.setCostDate(transaction.getCreationDate());
    OBDal.getInstance().save(transactionCost);
  }

  public BigDecimal getTrxCost() {
    return trxCost;
  }
}
