/*
 ************************************************************************************
 * Copyright (C) 2012-2021 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

import org.apache.commons.lang.StringUtils;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.Session;
import org.hibernate.criterion.Order;
import org.hibernate.criterion.Restrictions;
import org.hibernate.query.Query;
import org.openbravo.advpaymentmngt.dao.TransactionsDao;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.weld.WeldUtils;
import org.openbravo.dal.core.TriggerHandler;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.mobile.core.process.DataSynchronizationImportProcess;
import org.openbravo.mobile.core.process.DataSynchronizationProcess.DataSynchronization;
import org.openbravo.mobile.core.process.PropertyByType;
import org.openbravo.mobile.core.utils.OBMOBCUtils;
import org.openbravo.model.ad.access.User;
import org.openbravo.model.financialmgmt.gl.GLItem;
import org.openbravo.model.financialmgmt.payment.FIN_FinaccTransaction;
import org.openbravo.model.financialmgmt.payment.FIN_FinancialAccount;
import org.openbravo.model.financialmgmt.payment.FIN_Reconciliation;
import org.openbravo.service.json.JsonConstants;
import org.openbravo.service.json.JsonToDataConverter;

@DataSynchronization(entity = "OBPOS_App_Cashup")
public class ProcessCashClose extends POSDataSynchronizationProcess
    implements DataSynchronizationImportProcess {

  private static final Logger log = LogManager.getLogger();
  JSONObject jsonResponse = new JSONObject();

  @Override
  protected String getImportQualifier() {
    return "OBPOS_App_Cashup";
  }

  @Override
  public JSONObject saveRecord(JSONObject jsonCashup) throws Exception {
    String cashUpId = jsonCashup.getString("id");
    JSONObject jsonData = new JSONObject();
    Date cashUpDate = new Date();
    OBPOSApplications posTerminal = OBDal.getInstance()
        .get(OBPOSApplications.class,
            jsonCashup.has("posTerminal") ? jsonCashup.getString("posTerminal")
                : jsonCashup.getString("posterminal"));

    // get and prepare the cashUpDate
    if (jsonCashup.has("cashUpDate") && jsonCashup.get("cashUpDate") != null
        && StringUtils.isNotEmpty(jsonCashup.getString("cashUpDate"))) {
      final String strCashUpDate = jsonCashup.getString("cashUpDate");
      if (!strCashUpDate.substring(strCashUpDate.length() - 1).equals("Z")) {
        log.error(String.format(
            "The cashup date must be provided in ISO 8601 format and be an UTC date (value: '%s')",
            strCashUpDate));
      }
      // get the timezoneOffset
      final long timezoneOffset;
      if (jsonCashup.has("timezoneOffset") && jsonCashup.get("timezoneOffset") != null
          && StringUtils.isNotEmpty(jsonCashup.getString("timezoneOffset"))) {
        timezoneOffset = Long.parseLong(jsonCashup.getString("timezoneOffset"));
      } else {
        timezoneOffset = -((Calendar.getInstance().get(Calendar.ZONE_OFFSET)
            + Calendar.getInstance().get(Calendar.DST_OFFSET)) / (60 * 1000));
        log.error(
            "Error processing cash close (1): error retrieving the timezoneOffset. Using the current timezoneOffset");
      }
      cashUpDate = OBMOBCUtils.calculateServerDatetime(strCashUpDate, timezoneOffset);
    } else {
      log.debug(
          "Error processing cash close (2): error retrieving cashUp date. Using current server date");
    }

    OBPOSAppCashup cashUp = UpdateCashup.getAndUpdateCashUp(cashUpId, jsonCashup, cashUpDate);

    if (cashUp.isProcessed() && !cashUp.isProcessedbo()) {
      // Get safe box defined in the terminal
      OBPOSSafeBox safeBox = null;
      if (jsonCashup.has("currentSafeBox")) {
        String safeBoxSK = jsonCashup.getString("currentSafeBox");
        OBCriteria<OBPOSSafeBox> safeBoxCriteria = OBDal.getInstance()
            .createCriteria(OBPOSSafeBox.class);
        safeBoxCriteria.add(Restrictions.eq(OBPOSSafeBox.PROPERTY_SEARCHKEY, safeBoxSK));
        safeBoxCriteria.add(
            Restrictions.eq(OBPOSSafeBox.PROPERTY_ORGANIZATION, posTerminal.getOrganization()));

        safeBox = (OBPOSSafeBox) safeBoxCriteria.uniqueResult();
      }
      if (jsonCashup.has("cashPaymentMethodInfo") && safeBox != null) {

        updateSafeboxHistoryRecord(cashUpDate, cashUp, safeBox);

        JSONArray paymentCashupInfo = jsonCashup.getJSONArray("cashPaymentMethodInfo");
        for (int i = 0; i < paymentCashupInfo.length(); ++i) {
          JSONObject payment = paymentCashupInfo.getJSONObject(i);
          OBPOSAppPayment appPayment = OBDal.getInstance()
              .get(OBPOSAppPayment.class, payment.getString("paymentMethodId"));
          if (appPayment.getPaymentMethod().isSafebox()) {
            createSafeBoxTransactions(cashUp, safeBox, payment);
          }
        }
      }
      if (jsonCashup.has("approvals")) {
        JSONObject jsonApprovals = jsonCashup.getJSONObject("approvals");
        OBPOSCashupApproval cashupApproval = OBProvider.getInstance()
            .get(OBPOSCashupApproval.class);
        cashupApproval.setId(cashUp.getId());
        cashupApproval.setNewOBObject(true);
        cashupApproval.setCashUp(cashUp);
        cashupApproval.setActive(true);
        cashupApproval.setApprovalType("OBPOS_CashupCountDiff");
        cashupApproval.setApprovalMessage(jsonApprovals.getString("message"));
        if (jsonApprovals.has("approvalReason")) {
          cashupApproval.setApprovalReason(OBDal.getInstance()
              .get(OBPOSApprovalReason.class, jsonApprovals.getString("approvalReason")));
        }
        cashupApproval.setSupervisor(
            OBDal.getInstance().get(User.class, jsonApprovals.getString("supervisor")));
        OBDal.getInstance().save(cashupApproval);
      }

      // Save the last cashup processed in obposApplication object
      posTerminal.setTerminalLastcashupcompleted(cashUp.getUpdated());

      cashUp.setJsoncashup(jsonCashup.toString());
      if (posTerminal.getMasterterminal() != null) {
        // On slave only mark as processed BO
        cashUp.setProcessedbo(Boolean.TRUE);
        jsonData.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
      } else if (posTerminal.isMaster()) {
        // Reconciliation and invoices of slaves
        String query = OBPOSAppCashup.PROPERTY_OBPOSPARENTCASHUP + ".id = :parantCashupId";
        OBQuery<OBPOSAppCashup> appCashupQuery = OBDal.getInstance()
            .createQuery(OBPOSAppCashup.class, query);
        appCashupQuery.setNamedParameter("parantCashupId", cashUpId);
        List<OBPOSAppCashup> slaveCashupList = appCashupQuery.list();
        List<String> slaveCashupIds = new ArrayList<String>();
        List<OBPOSApplications> posTerminalList = new ArrayList<OBPOSApplications>();
        for (int i = 0; i < slaveCashupList.size(); i++) {
          OBPOSApplications posTerm = slaveCashupList.get(i).getPOSTerminal();
          posTerm.getOBPOSAppPaymentList();
          posTerminalList.add(posTerm);
        }
        for (int i = 0; i < slaveCashupList.size(); i++) {
          OBPOSAppCashup slaveCashup = slaveCashupList.get(i);
          String dbJsoncashup = slaveCashup.getJsoncashup();
          if (StringUtils.isEmpty(dbJsoncashup)) {
            throw new OBException(
                "Cash up can not proceed, JSON data for shared Cash up not found: "
                    + slaveCashup.getIdentifier());
          }
          JSONObject slaveJsonCashup = new JSONObject(dbJsoncashup);
          doReconciliationAndInvoices(posTerminalList.get(i), slaveCashup.getId(),
              slaveCashup.getCashUpDate(), slaveJsonCashup, jsonData, false,
              new ArrayList<String>());
          slaveCashupIds.add(slaveCashup.getId());
        }
        // Reconciliation and invoices of master
        doReconciliationAndInvoices(posTerminal, cashUpId, cashUpDate, jsonCashup, jsonData, true,
            slaveCashupIds);
        // Accumulate slave Payment Method Cashup on Master
        doAccumulatePaymentMethodCashup(cashUpId);
      } else {
        doReconciliationAndInvoices(posTerminal, cashUpId, cashUpDate, jsonCashup, jsonData, true,
            new ArrayList<String>());
      }

    } else if (cashUp.isProcessed() && cashUp.isProcessedbo()) {
      // This record should go to error
      throw new OBException(
          "Cash up is processed and cannot be set as processed again. OBPOS_APP_CASHUP_ID: "
              + cashUp.getId());
    }

    jsonData.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);

    return jsonData;
  }

  private void updateSafeboxHistoryRecord(Date cashUpDate, OBPOSAppCashup cashUp,
      OBPOSSafeBox safeBox) {
    OBCriteria<OBPOSSafeboxTouchpoint> criteria = OBDal.getInstance()
        .createCriteria(OBPOSSafeboxTouchpoint.class);
    criteria.add(Restrictions.eq(OBPOSSafeboxTouchpoint.PROPERTY_OBPOSSAFEBOX, safeBox));
    criteria.add(Restrictions.isNull(OBPOSSafeboxTouchpoint.PROPERTY_DATEOUT));
    criteria.addOrder(Order.desc(OBPOSSafeboxTouchpoint.PROPERTY_DATEIN));
    criteria.setMaxResults(1);
    OBPOSSafeboxTouchpoint historyRecord = (OBPOSSafeboxTouchpoint) criteria.uniqueResult();
    /**
     * Check if the list is empty. This might happen if the [in] record was not created for some
     * reason.
     */
    if (historyRecord != null) {
      historyRecord.setCashUp(cashUp);
      historyRecord.setDateOut(cashUpDate);
    } else {
      log.info(String.format(
          "The dateOut property for the history record of the safebox %s has not been set because there are not history records created yet.",
          safeBox.getId()));
    }
  }

  /**
   * Create the adjust transactions for safe box from json
   *
   * @param jsonPayment
   * @throws JSONException
   */
  private static void createSafeBoxTransactions(OBPOSAppCashup cashup, OBPOSSafeBox safeBox,
      JSONObject jsonPayment) throws JSONException {
    // get POS Payment Method
    OBPOSAppPayment paymentMethod = OBDal.getInstance()
        .get(OBPOSAppPayment.class, jsonPayment.getString("paymentMethodId"));
    // Get SafeBox Payment Method
    OBCriteria<OBPOSSafeBoxPaymentMethod> safeBoxPaymentMethodCriteria = OBDal.getInstance()
        .createCriteria(OBPOSSafeBoxPaymentMethod.class);
    safeBoxPaymentMethodCriteria
        .add(Restrictions.eq(OBPOSSafeBoxPaymentMethod.PROPERTY_OBPOSSAFEBOX, safeBox));
    safeBoxPaymentMethodCriteria
        .add(Restrictions.eq(OBPOSSafeBoxPaymentMethod.PROPERTY_PAYMENTMETHOD,
            paymentMethod.getPaymentMethod().getPaymentMethod()));

    OBPOSSafeBoxPaymentMethod safeBoxPaymentMethod = null;
    final List<OBPOSSafeBoxPaymentMethod> paymentMethods = safeBoxPaymentMethodCriteria.list();
    if (paymentMethods.size() > 0) {
      for (OBPOSSafeBoxPaymentMethod obposSafeBoxPaymentMethod : paymentMethods) {
        if (obposSafeBoxPaymentMethod.getFINFinancialaccount()
            .getCurrency()
            .getId()
            .equals(paymentMethod.getPaymentMethod().getCurrency().getId())) {
          safeBoxPaymentMethod = obposSafeBoxPaymentMethod;
          break;
        }
      }
    }
    if (safeBoxPaymentMethod == null || paymentMethods.size() == 0) {
      return;
    }

    Date cashMgmtTrxDate = new Date();
    cashMgmtTrxDate = OBMOBCUtils.stripTime(cashMgmtTrxDate);

    // Calculate the amount to move
    BigDecimal totalSales = new BigDecimal(jsonPayment.getString("totalSales"));
    BigDecimal totalReturns = new BigDecimal(jsonPayment.getString("totalReturns"));
    BigDecimal totalDeposits = new BigDecimal(jsonPayment.getString("totalDeposits"));
    BigDecimal totalDrops = new BigDecimal(jsonPayment.getString("totalDrops"));

    BigDecimal amount = totalSales.add(totalDeposits).subtract(totalReturns).subtract(totalDrops);

    // Avoid to create transaction if the amount to move is 0
    if (amount == BigDecimal.ZERO) {
      return;
    }

    // Prepare some information for cash up event
    String isoCode = jsonPayment.getString("isocode");
    FIN_FinancialAccount account = paymentMethod.getFinancialAccount();
    FIN_FinancialAccount safeBoxAccount = safeBoxPaymentMethod.getFINFinancialaccount();
    FIN_FinaccTransaction transaction = OBProvider.getInstance().get(FIN_FinaccTransaction.class);

    TerminalTypePaymentMethod terminalPaymentMethod = paymentMethod.getPaymentMethod();
    GLItem terminalPaymentMethodGLItemForDrops = terminalPaymentMethod.getGLItemForDrops();
    GLItem terminalPaymentMethodGLItemForDeposits = terminalPaymentMethod.getGLItemForDeposits();
    GLItem safeBoxGLItemForDropDeposit = safeBoxPaymentMethod.getGLItemForCashDropDeposit();

    // Save cash up events for payment method status
    OBPOSPaymentcashupEvents paymentcashupEvent = null;

    OBPOSPaymentMethodCashup paymentmethodcashup = OBDal.getInstance()
        .get(OBPOSPaymentMethodCashup.class, jsonPayment.get("id"));

    paymentcashupEvent = OBProvider.getInstance().get(OBPOSPaymentcashupEvents.class);
    paymentcashupEvent.setObposPaymentmethodcashup(paymentmethodcashup);
    paymentcashupEvent.setAmount(amount);
    paymentcashupEvent.setName(OBMessageUtils.messageBD("OBPOS_SafeBoxCashUpEvent"));
    paymentcashupEvent.setType("drop");
    paymentcashupEvent.setCurrency(isoCode);
    paymentcashupEvent.setRate(paymentmethodcashup.getRate());
    OBDal.getInstance().save(paymentcashupEvent);

    // Create withdrawal movement from POS payment financial account
    GLItem glItemMain = terminalPaymentMethodGLItemForDrops == null ? safeBoxGLItemForDropDeposit
        : terminalPaymentMethodGLItemForDrops;
    transaction.setObposAppCashup(cashup);
    transaction.setCurrency(account.getCurrency());
    transaction.setAccount(account);
    transaction.setLineNo(TransactionsDao.getTransactionMaxLineNo(account) + 10);
    transaction.setGLItem(glItemMain);
    transaction.setPaymentAmount(amount);
    account.setCurrentBalance(account.getCurrentBalance().subtract(amount));
    transaction.setTransactionType("BPW");
    transaction.setStatus("PWNC");
    transaction.setProcessed(true);
    transaction.setDateAcct(cashMgmtTrxDate);
    transaction.setTransactionDate(cashMgmtTrxDate);

    OBDal.getInstance().save(transaction);
    paymentcashupEvent.setFINFinaccTransaction(transaction);

    // Create deposit movement to safe box payment financial account
    GLItem glItemSecondary = safeBoxGLItemForDropDeposit == null
        ? terminalPaymentMethodGLItemForDeposits
        : safeBoxGLItemForDropDeposit;
    FIN_FinaccTransaction safeBoxTransaction = OBProvider.getInstance()
        .get(FIN_FinaccTransaction.class);
    safeBoxTransaction.setObposAppCashup(cashup);
    safeBoxTransaction.setCurrency(safeBoxAccount.getCurrency());
    safeBoxTransaction.setAccount(safeBoxAccount);
    safeBoxTransaction.setLineNo(TransactionsDao.getTransactionMaxLineNo(safeBoxAccount) + 10);
    safeBoxTransaction.setGLItem(glItemSecondary);
    safeBoxTransaction.setDepositAmount(amount);
    safeBoxAccount.setCurrentBalance(safeBoxAccount.getCurrentBalance().add(amount));
    safeBoxTransaction.setTransactionType("BPD");
    safeBoxTransaction.setStatus("RDNC");
    safeBoxTransaction.setProcessed(true);
    safeBoxTransaction.setDateAcct(cashMgmtTrxDate);
    safeBoxTransaction.setTransactionDate(cashMgmtTrxDate);

    OBDal.getInstance().save(safeBoxTransaction);
    paymentcashupEvent.setRelatedTransaction(safeBoxTransaction);

    OBDal.getInstance().save(paymentcashupEvent);
  }

  private void doAccumulatePaymentMethodCashup(String cashUpId) {

    // Get slave OBPOSAppCashup
    OBCriteria<OBPOSAppCashup> obCriteria = OBDal.getInstance()
        .createCriteria(OBPOSAppCashup.class);
    obCriteria.add(Restrictions.eq(OBPOSAppCashup.PROPERTY_OBPOSPARENTCASHUP + ".id", cashUpId));
    List<OBPOSAppCashup> cashupList = obCriteria.list();
    List<String> cashUpIds = new ArrayList<String>();
    for (OBPOSAppCashup appCashup : cashupList) {
      cashUpIds.add(appCashup.getId());
    }
    if (!cashUpIds.isEmpty()) {
      // Sum shared PaymentMethodCashup
      String query = "select searchkey, sum(startingcash), sum(totalDeposits), sum(totalDrops), sum(totalreturns), sum(totalsales) "
          + "from OBPOS_Paymentmethodcashup "
          + "where cashUp.id in :cashUpIds and paymentType.paymentMethod.isshared = 'Y'"
          + "group by searchkey";
      final Session session = OBDal.getInstance().getSession();
      final Query<Object[]> paymentQuery = session.createQuery(query, Object[].class);
      paymentQuery.setParameterList("cashUpIds", cashUpIds);
      List<Object[]> paymentList = paymentQuery.list();
      for (int i = 0; i < paymentList.size(); i++) {
        Object[] item = paymentList.get(i);
        // Get master payment method cashup
        OBPOSPaymentMethodCashup masterCashup = getPaymentMethodCashup(cashUpId, (String) item[0]);
        if (masterCashup != null) {
          masterCashup.setStartingcash(masterCashup.getStartingcash().add((BigDecimal) item[1]));
          masterCashup.setTotalDeposits(masterCashup.getTotalDeposits().add((BigDecimal) item[2]));
          masterCashup.setTotalDrops(masterCashup.getTotalDrops().add((BigDecimal) item[3]));
          masterCashup.setTotalreturns(masterCashup.getTotalreturns().add((BigDecimal) item[4]));
          masterCashup.setTotalsales(masterCashup.getTotalsales().add((BigDecimal) item[5]));
          OBDal.getInstance().save(masterCashup);
        } else {
          throw new OBException(
              "Cash up can not proceed, not found all slave terminal shared payment methods on master terminal: "
                  + (String) item[0]);
        }
      }

      // Remove shared PaymentMethodCashup
      List<String> paymentMethodCashupIds = new ArrayList<String>();
      for (OBPOSAppCashup appCashup : cashupList) {
        List<OBPOSPaymentMethodCashup> paymentMethodCashupList = appCashup
            .getOBPOSPaymentmethodcashupList();
        for (OBPOSPaymentMethodCashup paymentMethodCashup : paymentMethodCashupList) {
          if (paymentMethodCashup.getPaymentType().getPaymentMethod().isShared()) {
            paymentMethodCashupIds.add(paymentMethodCashup.getId());
          }
        }
      }
      if (!paymentMethodCashupIds.isEmpty()) {
        String delete = "delete from OBPOS_Paymentmethodcashup where id in :paymentMethodCashupIds";
        @SuppressWarnings("rawtypes")
        final Query paymentDelete = session.createQuery(delete);
        paymentDelete.setParameterList("paymentMethodCashupIds", paymentMethodCashupIds);
        paymentDelete.executeUpdate();
      }
    }
  }

  private OBPOSPaymentMethodCashup getPaymentMethodCashup(String cashUpId, String searchKey) {
    final OBQuery<OBPOSPaymentMethodCashup> obQuery = OBDal.getInstance()
        .createQuery(OBPOSPaymentMethodCashup.class,
            "cashUp.id = :cashUpId and searchKey = :searchKey");
    obQuery.setNamedParameter("cashUpId", cashUpId);
    obQuery.setNamedParameter("searchKey", searchKey);
    final List<OBPOSPaymentMethodCashup> paymentMethodCashupList = obQuery.list();
    return paymentMethodCashupList.size() > 0 ? paymentMethodCashupList.get(0) : null;
  }

  private void doReconciliationAndInvoices(OBPOSApplications posTerminal, String cashUpId,
      Date currentDate, JSONObject jsonCashup, JSONObject jsonData, boolean skipSlave,
      List<String> slaveCashupIds) throws Exception {
    // check if there is a reconciliation in draft status
    for (OBPOSAppPayment payment : posTerminal.getOBPOSAppPaymentList()) {
      if (payment.getFinancialAccount() == null) {
        continue;
      }
      if (skipSlave && posTerminal.getMasterterminal() != null
          && payment.getPaymentMethod().isShared()) {
        // Skip share payment method on slave terminals
        continue;
      }
      final OBCriteria<FIN_Reconciliation> recconciliations = OBDal.getInstance()
          .createCriteria(FIN_Reconciliation.class);
      recconciliations.add(Restrictions.eq(FIN_Reconciliation.PROPERTY_DOCUMENTSTATUS, "DR"));
      recconciliations
          .add(Restrictions.eq(FIN_Reconciliation.PROPERTY_ACCOUNT, payment.getFinancialAccount()));
      for (final FIN_Reconciliation r : recconciliations.list()) {
        // will end up in the pos error window
        throw new OBException(
            "Cash up can not proceed, there is a reconcilliation in draft status, payment method: "
                + payment.getIdentifier() + ", reconcilliation: " + r.getDocumentNo() + " ("
                + r.getAccount().getName() + ")");
      }
    }

    OBCriteria<OBPOSErrors> errorsQuery = OBDal.getInstance().createCriteria(OBPOSErrors.class);
    errorsQuery.add(Restrictions.ne(OBPOSErrors.PROPERTY_TYPEOFDATA, "OBPOS_App_Cashup"));
    errorsQuery.add(Restrictions.eq(OBPOSErrors.PROPERTY_ORDERSTATUS, "N"));
    errorsQuery.add(Restrictions.eq(OBPOSErrors.PROPERTY_OBPOSAPPLICATIONS, posTerminal));
    if (errorsQuery.count() > 0) {
      throw new OBException(
          "There are errors related to non-created customers, orders, or cash management movements pending to be processed. Process them before processing the cash ups");
    }

    // This cashup is a closed box
    TriggerHandler.getInstance().disable();
    try {
      getOrderGroupingProcessor().groupOrders(posTerminal, cashUpId, currentDate);

      CashCloseProcessor processor = getCashCloseProcessor();
      JSONArray cashMgmtIds = jsonCashup.getJSONArray("cashMgmtIds");
      JSONObject result = processor.processCashClose(posTerminal, jsonCashup, cashMgmtIds,
          currentDate, slaveCashupIds);
      // add the messages returned by processCashClose...
      jsonData.put("messages", result.opt("messages"));
      jsonData.put("next", result.opt("next"));
      jsonData.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
    } finally {
      // enable triggers contains a flush in getConnection method
      TriggerHandler.getInstance().enable();
    }
  }

  protected CashCloseProcessor getCashCloseProcessor() {
    return WeldUtils.getInstanceFromStaticBeanManager(CashCloseProcessor.class);
  }

  protected OrderGroupingProcessor getOrderGroupingProcessor() {
    return WeldUtils.getInstanceFromStaticBeanManager(OrderGroupingProcessor.class);
  }

  // We do not have to check if the role has access because now, we update cashup with every order.
  @Override
  protected boolean bypassPreferenceCheck() {
    return true;
  }

  @Override
  protected void additionalProcessForRecordsSavedInErrorsWindow(JSONObject record) {
    try {
      String cashUpId = record.getString("id");
      OBPOSAppCashup cashUp = OBDal.getInstance().get(OBPOSAppCashup.class, cashUpId);
      if (cashUp != null
          && (record.has("isprocessed") && record.getString("isprocessed").equals("Y"))) {
        cashUp.setProcessed(Boolean.TRUE);
        if (record.has("lastcashupeportdate")) {
          String lastCashUpReportString = record.getString("lastcashupeportdate");
          Date lastCashUpReportDate = (Date) JsonToDataConverter.convertJsonToPropertyValue(
              PropertyByType.DATETIME,
              (lastCashUpReportString).subSequence(0, (lastCashUpReportString).lastIndexOf(".")));
          cashUp.setLastcashupreportdate(lastCashUpReportDate);
        }
        OBDal.getInstance().save(cashUp);
      }
    } catch (Exception e) {
    }
  }

  @Override
  protected String getProperty() {
    return "OBPOS_retail.cashup";
  }
}
