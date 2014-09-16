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
import java.util.HashMap;

import javax.enterprise.inject.Any;
import javax.enterprise.inject.Instance;
import javax.inject.Inject;
import javax.servlet.ServletException;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
import org.hibernate.criterion.Order;
import org.hibernate.criterion.Restrictions;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.weld.WeldUtils;
import org.openbravo.client.kernel.ComponentProvider;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.financial.FinancialUtils;
import org.openbravo.model.financialmgmt.calendar.Period;
import org.openbravo.model.materialmgmt.cost.CostAdjustment;
import org.openbravo.model.materialmgmt.cost.CostAdjustmentLine;
import org.openbravo.model.materialmgmt.cost.TransactionCost;
import org.openbravo.model.materialmgmt.transaction.MaterialTransaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CostAdjustmentProcess {
  private static final Logger log = LoggerFactory.getLogger(CostAdjustmentProcess.class);
  @Inject
  @Any
  private Instance<CostingAlgorithmAdjustmentImp> costAdjustmentAlgorithms;
  @Inject
  @Any
  private Instance<CostAdjusmentProcessCheck> costAdjustmentProcessChecks;

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
  private JSONObject processCostAdjustment(CostAdjustment _costAdjustment) throws OBException,
      JSONException {
    CostAdjustment costAdjustment = _costAdjustment;
    JSONObject message = new JSONObject();
    message.put("severity", "success");
    message.put("title", "");
    message.put("text", OBMessageUtils.messageBD("Success"));
    OBContext.setAdminMode(true);
    try {
      long t1 = System.currentTimeMillis();
      doChecks(costAdjustment, message);
      long t2 = System.currentTimeMillis();
      log.debug("Checks done: time {}", t2 - t1);
      initializeLines(costAdjustment);
      long t3 = System.currentTimeMillis();
      log.debug("Lines initialized: time {}", t3 - t2);
      calculateAdjustmentAmount(costAdjustment.getId(), message);
      long t4 = System.currentTimeMillis();
      log.debug("Adjustments done: time {} - total time {}", t4 - t3, t4 - t1);

      costAdjustment = OBDal.getInstance().get(CostAdjustment.class, costAdjustment.getId());
      costAdjustment.setProcessed(true);
      costAdjustment.setDocumentStatus("CO");
      OBDal.getInstance().save(costAdjustment);
    } finally {
      OBContext.restorePreviousMode();
    }

    return message;
  }

  private void doChecks(CostAdjustment costAdjustment, JSONObject message) {

    // check if there is period closed between reference date and max transaction date
    Date minDate = null;
    costAdjustment = OBDal.getInstance().get(CostAdjustment.class, costAdjustment.getId());
    OBDal.getInstance().refresh(costAdjustment);
    for (CostAdjustmentLine cal : costAdjustment.getCostAdjustmentLineList()) {
      if (cal.isSource() && (minDate == null || minDate.after(cal.getTransactionDate()))) {
        minDate = (cal.getTransactionDate() == null ? cal.getAccountingDate() : cal
            .getTransactionDate());
      }
    }

    try {
      Date maxDate = CostingUtils.getMaxTransactionDate(costAdjustment.getOrganization());
      Period periodClosed = CostingUtils.periodClosed(costAdjustment.getOrganization(), minDate,
          maxDate, "CAD");
      if (periodClosed != null) {
        String errorMsg = OBMessageUtils.getI18NMessage("DocumentTypePeriodClosed", new String[] {
            "CAD", periodClosed.getIdentifier() });
        throw new OBException(errorMsg);
      }
    } catch (ServletException e) {
      throw new OBException(e.getMessage());
    }

    // Check that there are not permanently adjusted transactions in the sources.
    OBCriteria<CostAdjustmentLine> critLines = OBDal.getInstance().createCriteria(
        CostAdjustmentLine.class);
    critLines.createAlias(CostAdjustmentLine.PROPERTY_INVENTORYTRANSACTION, "trx");
    critLines.add(Restrictions.eq(CostAdjustmentLine.PROPERTY_COSTADJUSTMENT, costAdjustment));
    critLines.add(Restrictions.eq("trx." + MaterialTransaction.PROPERTY_ISCOSTPERMANENT, true));
    critLines.addOrder(Order.asc(CostAdjustmentLine.PROPERTY_LINENO));

    ScrollableResults lines = critLines.scroll(ScrollMode.FORWARD_ONLY);
    long count = 1L;
    try {
      String strLines = "";
      while (lines.next()) {
        CostAdjustmentLine line = (CostAdjustmentLine) lines.get(0);
        strLines += line.getLineNo() + ", ";

        if (count % 1000 == 0) {
          OBDal.getInstance().flush();
          OBDal.getInstance().getSession().clear();
        }
        count++;
      }
      if (!strLines.isEmpty()) {
        strLines = strLines.substring(0, strLines.length() - 2);
        String errorMessage = OBMessageUtils.messageBD("CostAdjustmentWithPermanentLines");
        HashMap<String, String> map = new HashMap<String, String>();
        map.put("lines", strLines);
        throw new OBException(OBMessageUtils.parseTranslation(errorMessage, map));
      }
      OBDal.getInstance().flush();
      OBDal.getInstance().getSession().clear();
    } finally {
      lines.close();
    }

    // Execute checks added implementing costAdjustmentProcess interface.
    for (CostAdjusmentProcessCheck checksInstance : costAdjustmentProcessChecks) {
      checksInstance.doCheck(costAdjustment, message);
    }
  }

  private void initializeLines(CostAdjustment costAdjustment) {
    // initialize is related transaction adjusted flag to false
    OBCriteria<CostAdjustmentLine> critLines = OBDal.getInstance().createCriteria(
        CostAdjustmentLine.class);
    critLines.add(Restrictions.eq(CostAdjustmentLine.PROPERTY_COSTADJUSTMENT, costAdjustment));
    critLines.add(Restrictions.eq(CostAdjustmentLine.PROPERTY_ISRELATEDTRANSACTIONADJUSTED, true));
    ScrollableResults lines = critLines.scroll(ScrollMode.FORWARD_ONLY);
    long count = 1L;
    try {
      while (lines.next()) {
        CostAdjustmentLine line = (CostAdjustmentLine) lines.get(0);
        line.setRelatedTransactionAdjusted(false);
        OBDal.getInstance().save(line);

        if (count % 1000 == 0) {
          OBDal.getInstance().flush();
          OBDal.getInstance().getSession().clear();
        }
        count++;
      }
      OBDal.getInstance().flush();
      OBDal.getInstance().getSession().clear();
    } finally {
      lines.close();
    }
  }

  private void calculateAdjustmentAmount(String strCostAdjustmentId, JSONObject message) {
    CostAdjustmentLine line = getNextLine(strCostAdjustmentId);
    while (line != null) {
      MaterialTransaction trx = line.getInventoryTransaction();
      log.debug("Start processing line: {}, transaction: {}", line.getLineNo(), trx.getIdentifier());
      if (trx.getCostingAlgorithm() == null) {
        log.error("Transaction is cost calculated with legacy cost engine.");
        throw new OBException("Cannot adjust transactions calculated with legacy cost engine.");
      }
      final String strCostAdjLineId = line.getId();

      // Add transactions that depend on the transaction being adjusted.
      CostingAlgorithmAdjustmentImp costAdjImp = getAlgorithmAdjustmentImp(trx
          .getCostingAlgorithm().getId());

      if (costAdjImp == null) {
        throw new OBException(
            "The algorithm used to calculate the cost of the transaction does not implement cost adjustments.");
      }
      log.debug("costing algorithm imp loaded {}", costAdjImp.getClass().getName());
      costAdjImp.init(line);
      costAdjImp.searchRelatedTransactionCosts(null);
      // Reload cost adjustment object in case the costing algorithm has cleared the session.
      line = OBDal.getInstance().get(CostAdjustmentLine.class, strCostAdjLineId);
      line.setRelatedTransactionAdjusted(true);
      OBDal.getInstance().save(line);
      OBDal.getInstance().flush();
      generateTransactionCosts(line);
      OBDal.getInstance().flush();
      OBDal.getInstance().getSession().clear();
      line = getNextLine(strCostAdjustmentId);
    }
  }

  private CostAdjustmentLine getNextLine(String strCostAdjustmentId) {
    OBCriteria<CostAdjustmentLine> critLines = OBDal.getInstance().createCriteria(
        CostAdjustmentLine.class);
    critLines.createAlias(CostAdjustmentLine.PROPERTY_INVENTORYTRANSACTION, "trx");
    critLines.createAlias(CostAdjustmentLine.PROPERTY_COSTADJUSTMENT, "ca");
    critLines.add(Restrictions.eq("ca.id", strCostAdjustmentId));
    critLines.add(Restrictions.eq(CostAdjustmentLine.PROPERTY_ISRELATEDTRANSACTIONADJUSTED, false));
    critLines.addOrder(Order.asc("trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE));
    critLines.addOrder(Order.asc("trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE));
    critLines.setMaxResults(1);
    return (CostAdjustmentLine) critLines.uniqueResult();
  }

  private void generateTransactionCosts(CostAdjustmentLine costAdjustmentLine) {
    log.debug("Generate transaction costs of line: {}", costAdjustmentLine.getLineNo());
    long t1 = System.currentTimeMillis();
    OBCriteria<CostAdjustmentLine> critLines = OBDal.getInstance().createCriteria(
        CostAdjustmentLine.class);
    Date referenceDate = costAdjustmentLine.getCostAdjustment().getReferenceDate();
    critLines.add(Restrictions.or(
        Restrictions.eq(CostAdjustmentLine.PROPERTY_PARENTCOSTADJUSTMENTLINE, costAdjustmentLine),
        Restrictions.eq("id", costAdjustmentLine.getId())));
    ScrollableResults lines = critLines.scroll(ScrollMode.FORWARD_ONLY);

    try {
      while (lines.next()) {
        CostAdjustmentLine line = (CostAdjustmentLine) lines.get(0);
        if (!line.getTransactionCostList().isEmpty()) {
          continue;
        }
        TransactionCost trxCost = OBProvider.getInstance().get(TransactionCost.class);
        MaterialTransaction trx = line.getInventoryTransaction();
        trxCost.setInventoryTransaction(trx);
        trxCost.setOrganization(trx.getOrganization());
        trxCost.setCostDate(referenceDate);
        trxCost.setCostAdjustmentLine(line);
        trxCost.setUnitCost(line.isUnitCost());
        trxCost.setInvoiceCorrection(line.isInvoiceCorrection());
        Date accountingDate = line.getAccountingDate();
        if (accountingDate == null) {
          accountingDate = trx.getMovementDate();
        }
        trxCost.setAccountingDate(accountingDate);
        BigDecimal convertedAmt = line.getAdjustmentAmount();
        if (!line.getCurrency().getId().equals(trx.getCurrency().getId())) {
          convertedAmt = FinancialUtils.getConvertedAmount(convertedAmt, line.getCurrency(),
              trx.getCurrency(), accountingDate, trx.getOrganization(), "C");
        }
        trxCost.setCost(convertedAmt);
        trxCost.setCurrency(line.getCurrency());

        OBDal.getInstance().save(trxCost);
        OBDal.getInstance().flush();
        OBDal.getInstance().getSession().clear();
      }
    } finally {
      lines.close();
    }
    log.debug("Transaction costs created. Time {}", System.currentTimeMillis() - t1);
  }

  private CostingAlgorithmAdjustmentImp getAlgorithmAdjustmentImp(String strCostingAlgorithmId) {
    CostingAlgorithmAdjustmentImp implementor = null;
    for (CostingAlgorithmAdjustmentImp nextImplementor : costAdjustmentAlgorithms
        .select(new ComponentProvider.Selector(strCostingAlgorithmId))) {
      if (implementor == null) {
        implementor = nextImplementor;
      } else {
        log.warn("More than one class found implementing cost adjustment for algorithm with id {}",
            strCostingAlgorithmId);
      }
    }
    return implementor;
  }

  public static synchronized JSONObject doProcessCostAdjustment(CostAdjustment costAdjustment)
      throws OBException, JSONException {
    String docNo = costAdjustment.getDocumentNo();
    log.debug("Starts process cost adjustment: {}", docNo);
    long t1 = System.currentTimeMillis();
    CostAdjustmentProcess cap = WeldUtils
        .getInstanceFromStaticBeanManager(CostAdjustmentProcess.class);
    JSONObject message = cap.processCostAdjustment(costAdjustment);
    log.debug("Ends process cost adjustment: {}, took {} ms.", docNo,
        (System.currentTimeMillis() - t1));
    return message;
  }
}
