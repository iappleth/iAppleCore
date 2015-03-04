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
 * All portions are Copyright (C) 2012-2015 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 *************************************************************************
 */
package org.openbravo.costing;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.servlet.ServletException;

import org.apache.log4j.Logger;
import org.hibernate.Query;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.database.ConnectionProvider;
import org.openbravo.erpCommon.businessUtility.Preferences;
import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.erpCommon.utility.PropertyException;
import org.openbravo.exception.NoConnectionAvailableException;
import org.openbravo.model.ad.domain.Preference;
import org.openbravo.model.ad.system.Client;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.common.plm.Product;
import org.openbravo.model.materialmgmt.cost.CostingRule;
import org.openbravo.model.materialmgmt.transaction.MaterialTransaction;
import org.openbravo.scheduling.ProcessBundle;
import org.openbravo.scheduling.ProcessLogger;
import org.openbravo.service.db.DalBaseProcess;
import org.openbravo.service.db.DalConnectionProvider;

/**
 * @author gorkaion
 * 
 */
public class CostingBackground extends DalBaseProcess {
  private static final Logger log4j = Logger.getLogger(CostingBackground.class);
  public static final String AD_PROCESS_ID = "3F2B4AAC707B4CE7B98D2005CF7310B5";
  private ProcessLogger logger;
  private int maxTransactions = 0;
  public static final String TRANSACTION_COST_DATEACCT_INITIALIZED = "TransactionCostDateacctInitialized";

  @Override
  protected void doExecute(ProcessBundle bundle) throws Exception {

    logger = bundle.getLogger();
    OBError result = new OBError();
    List<String> orgsWithRule = new ArrayList<String>();
    try {
      OBContext.setAdminMode(false);
      result.setType("Success");
      result.setTitle(OBMessageUtils.messageBD("Success"));

      // Initialize Transaction Cost Date Acct
      initializeMtransCostDateAcct();

      // Get organizations with costing rules.
      StringBuffer where = new StringBuffer();
      where.append(" as o");
      where.append(" where exists (");
      where.append("    select 1 from " + CostingRule.ENTITY_NAME + " as cr");
      where.append("    where ad_isorgincluded(o.id, cr." + CostingRule.PROPERTY_ORGANIZATION
          + ".id, " + CostingRule.PROPERTY_CLIENT + ".id) <> -1 ");
      where.append("      and cr." + CostingRule.PROPERTY_VALIDATED + " is true");
      where.append(" )");
      where.append("    and ad_isorgincluded(o.id, '" + bundle.getContext().getOrganization()
          + "', '" + bundle.getContext().getClient() + "') <> -1 ");
      OBQuery<Organization> orgQry = OBDal.getInstance().createQuery(Organization.class,
          where.toString());
      List<Organization> orgs = orgQry.list();
      if (orgs.size() == 0) {
        log4j.debug("No organizations with Costing Rule defined");
        logger.logln(OBMessageUtils.messageBD("Success"));
        bundle.setResult(result);
        return;
      }
      for (Organization org : orgs) {
        orgsWithRule.add(org.getId());
      }

      // Fix the Not Processed flag for those Transactions with Cost Not Calculated
      setNotProcessedWhenNotCalculatedTransactions(orgsWithRule);

      ScrollableResults trxs = getTransactions(orgsWithRule);
      int counter = 0;
      try {
        while (trxs.next()) {
          MaterialTransaction transaction = (MaterialTransaction) trxs.get()[0];
          counter++;
          if ("S".equals(transaction.getCostingStatus())) {
            // Do not calculate trx in skip status.
            continue;
          }
          log4j.debug("Start transaction process: " + transaction.getId());
          OBDal.getInstance().refresh(transaction);
          CostingServer transactionCost = new CostingServer(transaction);
          transactionCost.process();
          log4j.debug("Transaction processed: " + counter + "/" + maxTransactions);
          // If cost has been calculated successfully do a commit.
          OBDal.getInstance().getConnection(true).commit();
          if (counter % 1 == 0) {
            OBDal.getInstance().getSession().clear();
          }
        }
      } finally {
        try {
          trxs.close();
        } catch (Exception ignore) {
        }
      }

      logger.logln(OBMessageUtils.messageBD("Success"));
      bundle.setResult(result);
    } catch (OBException e) {
      OBDal.getInstance().rollbackAndClose();
      String message = OBMessageUtils.parseTranslation(bundle.getConnection(), bundle.getContext()
          .toVars(), OBContext.getOBContext().getLanguage().getLanguage(), e.getMessage());
      result.setMessage(message);
      result.setType("Error");
      log4j.error(message, e);
      logger.logln(message);
      bundle.setResult(result);
      return;
    } catch (Exception e) {
      OBDal.getInstance().rollbackAndClose();
      result = OBMessageUtils.translateError(bundle.getConnection(), bundle.getContext().toVars(),
          OBContext.getOBContext().getLanguage().getLanguage(), e.getMessage());
      result.setType("Error");
      result.setTitle(OBMessageUtils.messageBD("Error"));
      log4j.error(result.getMessage(), e);
      logger.logln(result.getMessage());
      bundle.setResult(result);
      return;
    } finally {
      // Set the processed flag to true to those transactions whose cost has been calculated.
      if (!orgsWithRule.isEmpty()) {
        setCalculatedTransactionsAsProcessed(orgsWithRule);
      }
      OBContext.restorePreviousMode();
    }
  }

  /**
   * Get Transactions with Processed flag = 'Y' and it's cost is Not Calculated and set Processed
   * flag = 'N'
   */
  private void setNotProcessedWhenNotCalculatedTransactions(List<String> orgsWithRule) {
    final StringBuilder hqlTransactions = new StringBuilder();
    hqlTransactions.append(" update " + MaterialTransaction.ENTITY_NAME + " as trx set trx."
        + MaterialTransaction.PROPERTY_ISPROCESSED + " = false ");
    hqlTransactions.append(" where trx." + MaterialTransaction.PROPERTY_ISPROCESSED + " = true");
    hqlTransactions.append("   and trx." + MaterialTransaction.PROPERTY_ISCOSTCALCULATED
        + " = false");
    hqlTransactions.append("   and trx." + MaterialTransaction.PROPERTY_ORGANIZATION
        + ".id in (:orgs)");
    Query updateTransactions = OBDal.getInstance().getSession()
        .createQuery(hqlTransactions.toString());
    updateTransactions.setParameterList("orgs", orgsWithRule);
    updateTransactions.executeUpdate();

    OBDal.getInstance().flush();
  }

  /**
   * Get Transactions with Processed flag = 'N' and it's cost is Calculated and set Processed flag =
   * 'Y'
   */
  private void setCalculatedTransactionsAsProcessed(List<String> orgsWithRule) {
    final StringBuilder hqlTransactions = new StringBuilder();
    hqlTransactions.append(" update " + MaterialTransaction.ENTITY_NAME + " as trx set trx."
        + MaterialTransaction.PROPERTY_ISPROCESSED + " = true ");
    hqlTransactions.append(" where trx." + MaterialTransaction.PROPERTY_ISPROCESSED + " = false");
    hqlTransactions.append("   and trx." + MaterialTransaction.PROPERTY_ISCOSTCALCULATED
        + " = true");
    hqlTransactions.append("   and trx." + MaterialTransaction.PROPERTY_ORGANIZATION
        + ".id in (:orgs)");
    Query updateTransactions = OBDal.getInstance().getSession()
        .createQuery(hqlTransactions.toString());
    updateTransactions.setParameterList("orgs", orgsWithRule);
    updateTransactions.executeUpdate();

    OBDal.getInstance().flush();
  }

  private ScrollableResults getTransactions(List<String> orgsWithRule) {
    StringBuffer where = new StringBuffer();
    where.append(" as trx");
    where.append(" join trx." + MaterialTransaction.PROPERTY_PRODUCT + " as p");
    where.append("\n , " + org.openbravo.model.ad.domain.List.ENTITY_NAME + " as trxtype");
    where.append("\n where trx." + MaterialTransaction.PROPERTY_ISPROCESSED + " = false");
    where.append("   and p." + Product.PROPERTY_PRODUCTTYPE + " = 'I'");
    where.append("   and p." + Product.PROPERTY_STOCKED + " = true");
    where.append("   and trxtype." + CostAdjustmentUtils.propADListReference + ".id = :refid");
    where.append("   and trxtype." + CostAdjustmentUtils.propADListValue + " = trx."
        + MaterialTransaction.PROPERTY_MOVEMENTTYPE);
    where.append("   and trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE + " <= :now");
    where.append("   and trx." + MaterialTransaction.PROPERTY_ORGANIZATION + ".id in (:orgs)");
    where.append(" order by trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE);
    where.append(" , trxtype." + CostAdjustmentUtils.propADListPriority);
    where.append(" , trx." + MaterialTransaction.PROPERTY_MOVEMENTQUANTITY + " desc");
    where.append(" , trx." + MaterialTransaction.PROPERTY_ID);
    OBQuery<MaterialTransaction> trxQry = OBDal.getInstance().createQuery(
        MaterialTransaction.class, where.toString());

    trxQry.setNamedParameter("refid", CostAdjustmentUtils.MovementTypeRefID);
    trxQry.setNamedParameter("now", new Date());
    trxQry.setFilterOnReadableOrganization(false);
    trxQry.setNamedParameter("orgs", orgsWithRule);

    if (maxTransactions == 0) {
      maxTransactions = trxQry.count();
    }
    try {
      OBDal.getInstance().getConnection().setHoldability(ResultSet.HOLD_CURSORS_OVER_COMMIT);
    } catch (SQLException e) {
      log4j.error("error: " + e.getMessage(), e);
      throw new OBException(e.getMessage());
    }

    return trxQry.scroll(ScrollMode.FORWARD_ONLY);
  }

  private void initializeMtransCostDateAcct() throws Exception {
    boolean transactionCostDateacctInitialized = false;
    Client client = OBDal.getInstance().get(Client.class, "0");
    Organization organization = OBDal.getInstance().get(Organization.class, "0");
    try {
      transactionCostDateacctInitialized = Preferences.getPreferenceValue(
          CostingBackground.TRANSACTION_COST_DATEACCT_INITIALIZED, false, client, organization,
          null, null, null).equals("Y");
    } catch (PropertyException e1) {
      transactionCostDateacctInitialized = false;
    }

    if (!transactionCostDateacctInitialized) {

      try {
        ConnectionProvider cp = new DalConnectionProvider();
        InitializeCostingMTransCostDateacctData.initializeCostingMTransCostDateacct(
            cp.getConnection(), cp);
        InitializeCostingMTransCostDateacctData.initializeCostingMTransCostDateacct2(
            cp.getConnection(), cp);

      } catch (ServletException e) {
        log4j
            .error("SQL error in Costing Backgroung Initializing Transaction Cost Date Acct: Exception:"
                + e);
        throw new OBException("@CODE=" + e.getCause() + "@" + e.getMessage());
      } catch (NoConnectionAvailableException e) {
        log4j.error("Connection error in query: Exception:" + e);
        throw new OBException("@CODE=NoConnectionAvailable");
      } finally {
        try {
        } catch (Exception ignore) {
        }
      }

      // Create the preference
      Preference transactionCostDateacctInitializedPreference = OBProvider.getInstance().get(
          Preference.class);
      transactionCostDateacctInitializedPreference.setClient(client);
      transactionCostDateacctInitializedPreference.setOrganization(organization);
      transactionCostDateacctInitializedPreference
          .setAttribute(CostingBackground.TRANSACTION_COST_DATEACCT_INITIALIZED);
      transactionCostDateacctInitializedPreference.setSearchKey("Y");
      transactionCostDateacctInitializedPreference.setPropertyList(false);
      OBDal.getInstance().save(transactionCostDateacctInitializedPreference);
      OBDal.getInstance().flush();
    }
  }
}
