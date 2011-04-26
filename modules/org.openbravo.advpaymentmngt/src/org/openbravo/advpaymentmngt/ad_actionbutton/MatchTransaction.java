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
 * All portions are Copyright (C) 2010 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 *************************************************************************
 */

package org.openbravo.advpaymentmngt.ad_actionbutton;

import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.criterion.Restrictions;
import org.openbravo.advpaymentmngt.dao.AdvPaymentMngtDao;
import org.openbravo.advpaymentmngt.dao.MatchTransactionDao;
import org.openbravo.advpaymentmngt.dao.TransactionsDao;
import org.openbravo.advpaymentmngt.process.FIN_AddPayment;
import org.openbravo.advpaymentmngt.utility.FIN_MatchedTransaction;
import org.openbravo.advpaymentmngt.utility.FIN_MatchingTransaction;
import org.openbravo.advpaymentmngt.utility.FIN_Utility;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.filter.IsIDFilter;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.base.session.OBPropertiesProvider;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.data.FieldProvider;
import org.openbravo.database.ConnectionProvider;
import org.openbravo.erpCommon.utility.ComboTableData;
import org.openbravo.erpCommon.utility.FieldProviderFactory;
import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.common.businesspartner.BusinessPartner;
import org.openbravo.model.common.enterprise.DocumentType;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.financialmgmt.payment.FIN_BankStatementLine;
import org.openbravo.model.financialmgmt.payment.FIN_FinaccTransaction;
import org.openbravo.model.financialmgmt.payment.FIN_FinancialAccount;
import org.openbravo.model.financialmgmt.payment.FIN_Payment;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentMethod;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentScheduleDetail;
import org.openbravo.model.financialmgmt.payment.FIN_Reconciliation;
import org.openbravo.model.financialmgmt.payment.FIN_ReconciliationLineTemp;
import org.openbravo.model.financialmgmt.payment.FIN_ReconciliationLine_v;
import org.openbravo.model.financialmgmt.payment.MatchingAlgorithm;
import org.openbravo.service.db.DalConnectionProvider;
import org.openbravo.xmlEngine.XmlDocument;

public class MatchTransaction extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  public void doPost(HttpServletRequest request, HttpServletResponse response)
      throws ServletException, IOException {
    VariablesSecureApp vars = new VariablesSecureApp(request);

    if (vars.commandIn("DEFAULT")) {
      String strOrgId = vars.getRequestGlobalVariable("inpadOrgId", "MatchTransaction.adOrgId");
      String strWindowId = vars.getGlobalVariable("inpwindowId", "MatchTransaction.adWindowId");
      String strTabId = vars.getGlobalVariable("inpTabId", "MatchTransaction.adTabId");
      String strFinancialAccountId = vars.getGlobalVariable("inpfinFinancialAccountId",
          "MatchTransaction.finFinancialAccountId");
      String strPaymentTypeFilter = vars.getGlobalVariable("inpPaymentTypeFilter",
          "MatchTransaction.paymentTypeFilter", "ALL");
      String strShowCleared = vars.getGlobalVariable("inpShowCleared",
          "MatchTransaction.showCleared", "N");
      String strHideDate = vars.getGlobalVariable("inpHideDate", "MatchTransaction.hideDate", "Y");
      FIN_FinancialAccount account = OBDal.getInstance().get(FIN_FinancialAccount.class,
          strFinancialAccountId);
      FIN_Reconciliation reconciliation = TransactionsDao.getLastReconciliation(OBDal.getInstance()
          .get(FIN_FinancialAccount.class, strFinancialAccountId), "N");
      int reconciledItems = 0;
      if (reconciliation != null) {
        if (isManualReconciliation(reconciliation)) {
          OBDal.getInstance().rollbackAndClose();
          OBError message = Utility.translateError(this, vars, vars.getLanguage(), Utility
              .parseTranslation(this, vars, vars.getLanguage(), "@APRM_ReconciliationMixed@"));
          vars.setMessage(strTabId, message);
          printPageClosePopUp(response, vars, Utility.getTabURL(strTabId, "R", true));
          return;
        }
        OBContext.setAdminMode();
        try {
          getSnapShot(reconciliation);
          reconciledItems = reconciliation.getFINReconciliationLineVList().size();
        } finally {
          OBContext.restorePreviousMode();
        }
      }
      if (MatchTransactionDao.getUnMatchedBankStatementLines(account).size() == 0
          && reconciledItems == 0) {
        OBError message = Utility.translateError(this, vars, vars.getLanguage(), Utility
            .parseTranslation(this, vars, vars.getLanguage(), "@APRM_NoStatementsToMatch@"));
        vars.setMessage(strTabId, message);
        printPageClosePopUp(response, vars, Utility.getTabURL(strTabId, "R", true));
      } else {
        if (reconciliation == null) {
          reconciliation = MatchTransactionDao.addNewReconciliation(this, vars,
              strFinancialAccountId);
          getSnapShot(reconciliation);
        } else {
          updateReconciliation(vars, reconciliation.getId(), strFinancialAccountId, strTabId, false);
        }

        printPage(response, vars, strOrgId, strWindowId, strTabId, strPaymentTypeFilter,
            strFinancialAccountId, reconciliation.getId(), strShowCleared, strHideDate);
      }
    } else if (vars.commandIn("GRID")) {
      String strFinancialAccountId = vars.getRequestGlobalVariable("inpfinFinancialAccountId",
          "MatchTransaction.finFinancialAccountId");
      String strReconciliationId = vars.getRequestGlobalVariable("inpfinReconciliationId",
          "MatchTransaction.finReconciliationId");
      String strPaymentTypeFilter = vars.getRequestGlobalVariable("inpPaymentTypeFilter",
          "MatchTransaction.paymentTypeFilter");
      String strShowCleared = vars.getRequestGlobalVariable("inpShowCleared",
          "MatchTransaction.showCleared");
      if (strShowCleared.equals("")) {
        strShowCleared = "N";
        vars.setSessionValue("MatchTransaction.showCleared", strShowCleared);
      }
      String strHideDate = vars
          .getRequestGlobalVariable("inphideDate", "MatchTransaction.hideDate");
      if (strHideDate.equals("")) {
        strHideDate = "N";
        vars.setSessionValue("MatchTransaction.hideDate", strHideDate);
      }
      String showJSMessage = vars.getSessionValue("AddTransaction|ShowJSMessage");
      vars.setSessionValue("AddTransaction|ShowJSMessage", "N");

      printGrid(response, vars, strPaymentTypeFilter, strFinancialAccountId, strReconciliationId,
          strShowCleared, strHideDate, showJSMessage);
    } else if (vars.commandIn("UNMATCH")) {
      String strUnmatchBankStatementLineId = vars
          .getRequiredStringParameter("inpFinBankStatementLineId");
      unMatchBankStatementLine(response, strUnmatchBankStatementLineId);

    } else if (vars.commandIn("CANCEL")) {
      String strReconciliationId = vars.getRequiredStringParameter("inpfinReconciliationId");
      restoreSnapShot(OBDal.getInstance().get(FIN_Reconciliation.class, strReconciliationId));
      String strTabId = vars.getGlobalVariable("inpTabId", "MatchTransaction.adTabId");
      String strWindowPath = Utility.getTabURL(strTabId, "R", true);
      if (strWindowPath.equals(""))
        strWindowPath = strDefaultServlet;

      printPageClosePopUp(response, vars, strWindowPath);
    } else if (vars.commandIn("SAVE", "RECONCILE")) {
      OBContext.setAdminMode();
      try {
        String strFinancialAccountId = vars.getRequiredStringParameter("inpfinFinancialAccountId");
        // String strRecords = vars.getRequiredInParameter("inpRecordId", IsIDFilter.instance);
        String strReconciliationId = vars.getRequiredStringParameter("inpfinReconciliationId");
        String strTabId = vars.getGlobalVariable("inpTabId", "MatchTransaction.adTabId");
        String message = "";
        // checkReconciliationPending(vars, strReconciliationId, strTabId);
        if (message == null || message.length() == 0) {

          String strRecordsChecked = vars.getInParameter("inpBankStatementLineId",
              IsIDFilter.instance);
          List<FIN_BankStatementLine> items = FIN_Utility.getOBObjectList(
              FIN_BankStatementLine.class, strRecordsChecked);

          for (FIN_BankStatementLine item : items) {
            String strTransaction = vars.getStringParameter("inpFinancialTransactionId_"
                + item.getId(), "");
            String strMatchingType = vars.getStringParameter("inpMatchingType_" + item.getId(),
                FIN_MatchedTransaction.NOMATCH);
            if (strTransaction == null || strTransaction.equalsIgnoreCase("")) {
              item.setFinancialAccountTransaction(null);
              item.setMatchingtype(FIN_MatchedTransaction.NOMATCH);
            } else {
              FIN_FinaccTransaction transactionLine = MatchTransactionDao.getObject(
                  FIN_FinaccTransaction.class, strTransaction);
              transactionLine.setReconciliation(MatchTransactionDao.getObject(
                  FIN_Reconciliation.class, strReconciliationId));
              item.getBankStatement().setFINReconciliation(
                  MatchTransactionDao.getObject(FIN_Reconciliation.class, strReconciliationId));
              if (isInArray(strRecordsChecked, item.getId())) {
                transactionLine.setStatus("RPPC");
                if (transactionLine.getFinPayment() != null) {
                  transactionLine.getFinPayment().setStatus("RPPC");
                }
                if (item.getTransactionDate().compareTo(transactionLine.getTransactionDate()) < 0) {
                  // Set processed to false before changing dates to avoid trigger exception
                  boolean posted = "Y".equals(transactionLine.getPosted());
                  if (posted) {
                    transactionLine.setPosted("N");
                    OBDal.getInstance().save(transactionLine);
                    OBDal.getInstance().flush();
                  }
                  transactionLine.setProcessed(false);
                  OBDal.getInstance().save(transactionLine);
                  OBDal.getInstance().flush();
                  transactionLine.setTransactionDate(item.getTransactionDate());
                  transactionLine.setDateAcct(item.getTransactionDate());
                  OBDal.getInstance().save(transactionLine);
                  OBDal.getInstance().flush();
                  // Set processed to true afterwards
                  transactionLine.setProcessed(true);
                  OBDal.getInstance().save(transactionLine);
                  OBDal.getInstance().flush();
                  if (posted) {
                    transactionLine.setPosted("Y");
                    OBDal.getInstance().save(transactionLine);
                    OBDal.getInstance().flush();
                  }
                  // Changing dates for accounting entries as well
                  TransactionsDao.updateAccountingDate(transactionLine);
                }
              } else {
                boolean isReceipt = true;
                if (transactionLine.getFinPayment() != null)
                  isReceipt = transactionLine.getFinPayment().isReceipt();
                else
                  isReceipt = (transactionLine.getDepositAmount().compareTo(
                      transactionLine.getPaymentAmount()) >= 0);
                transactionLine.setStatus((isReceipt) ? "RDNC" : "PWNC");
              }
              OBDal.getInstance().save(transactionLine);
              OBDal.getInstance().flush();
              item.setFinancialAccountTransaction(transactionLine);
              item.setMatchingtype(strMatchingType);
              if (transactionLine.getFinPayment() != null)
                item.setBusinessPartner(transactionLine.getFinPayment().getBusinessPartner());
            }
            OBDal.getInstance().save(item);
            OBDal.getInstance().flush();
          }
          if (updateReconciliation(vars, strReconciliationId, strFinancialAccountId, strTabId, vars
              .commandIn("RECONCILE"))) {
            OBError msg = new OBError();
            msg.setType("Success");
            msg.setTitle(Utility.messageBD(this, "Success", vars.getLanguage()));
            vars.setMessage(strTabId, msg);
          }
        }
        String strWindowPath = Utility.getTabURL(strTabId, "R", true);
        if (strWindowPath.equals(""))
          strWindowPath = strDefaultServlet;

        printPageClosePopUp(response, vars, strWindowPath);
      } finally {
        OBContext.restorePreviousMode();
      }
    }
  }

  private boolean updateReconciliation(VariablesSecureApp vars, String strReconciliationId,
      String strFinancialAccountId, String strTabId, boolean process) {
    OBContext.setAdminMode(true);
    try {
      FIN_Reconciliation reconciliation = MatchTransactionDao.getObject(FIN_Reconciliation.class,
          strReconciliationId);
      FIN_FinancialAccount financialAccount = MatchTransactionDao.getObject(
          FIN_FinancialAccount.class, strFinancialAccountId);
      FIN_Reconciliation lastReconciliation = TransactionsDao.getLastReconciliation(OBDal
          .getInstance().get(FIN_FinancialAccount.class, strFinancialAccountId), "Y");
      BigDecimal unreconciledInLastReconciliation = BigDecimal.ZERO;
      if (lastReconciliation != null) {
        unreconciledInLastReconciliation = MatchTransactionDao
            .getLastReconciliationUnmatchedBalance(lastReconciliation);
      }
      // This is needed to allow completing a reconciliation with unmatched bank statement lines
      reconciliation.setEndingBalance(reconciliation.getStartingbalance().subtract(
          unreconciledInLastReconciliation).add(
          MatchTransactionDao.getReconciliationEndingBalance(reconciliation)));
      reconciliation.setEndingDate(MatchTransactionDao
          .getBankStatementLineMaxDate(financialAccount));
      reconciliation.setTransactionDate(MatchTransactionDao
          .getBankStatementLineMaxDate(financialAccount));
      reconciliation.setProcessed(process);
      reconciliation.setDocumentStatus(process ? "CO" : "DR");
      reconciliation.setAPRMProcessReconciliation(process ? "R" : "P");
      OBDal.getInstance().save(reconciliation);
      OBDal.getInstance().flush();
    } catch (Exception ex) {
      OBError menssage = Utility.translateError(this, vars, vars.getLanguage(), ex.getMessage());
      vars.setMessage(strTabId, menssage);
      return false;
    } finally {
      OBContext.restorePreviousMode();
    }
    return true;
  }

  private boolean isInArray(String inString, String value) {
    if (inString.indexOf(value) == -1)
      return false;
    return true;
  }

  private void printPage(HttpServletResponse response, VariablesSecureApp vars, String strOrgId,
      String strWindowId, String strTabId, String strPaymentTypeFilter,
      String strFinancialAccountId, String reconciliationId, String strShowCleared,
      String strHideDate) throws IOException, ServletException {
    log4j
        .debug("Output: Match using imported Bank Statement Lines pressed on Financial Account || Transaction tab");

    XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/advpaymentmngt/ad_actionbutton/MatchTransaction").createXmlDocument();

    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("theme", vars.getTheme());
    final String MATCHED_AGAINST_TRANSACTION = FIN_Utility.messageBD("APRM_Transaction");

    FIN_Reconciliation reconciliation = OBDal.getInstance().get(FIN_Reconciliation.class,
        reconciliationId);

    xmlDocument.setParameter("windowId", strWindowId);
    xmlDocument.setParameter("tabId", strTabId);
    xmlDocument.setParameter("orgId", strOrgId);
    xmlDocument.setParameter("financialAccountId", strFinancialAccountId);
    xmlDocument.setParameter("reconciliationId", reconciliationId);
    xmlDocument.setParameter("matchedAgainstTransaction", MATCHED_AGAINST_TRANSACTION);

    String dateFormat = OBPropertiesProvider.getInstance().getOpenbravoProperties().getProperty(
        "dateFormat.java");
    SimpleDateFormat dateFormater = new SimpleDateFormat(dateFormat);
    OBContext.setAdminMode();
    try {
      xmlDocument.setParameter("dateTo", dateFormater.format(reconciliation.getEndingDate()));
    } finally {
      OBContext.restorePreviousMode();
    }

    xmlDocument.setParameter("paramPaymentTypeFilter", strPaymentTypeFilter);
    xmlDocument.setParameter("showCleared", strShowCleared);
    xmlDocument.setParameter("hideDate", strHideDate);
    xmlDocument.setParameter("jsDateFormat", "var sc_JsDateFormat =\"" + vars.getJsDateFormat()
        + "\";");
    // Check if There is a matching algorithm for the given financial account
    FIN_FinancialAccount financial = OBDal.getInstance().get(FIN_FinancialAccount.class,
        strFinancialAccountId);
    try {
      new FIN_MatchingTransaction(financial.getMatchingAlgorithm().getJavaClassName());
    } catch (Exception ex) {
      OBDal.getInstance().rollbackAndClose();
      OBError message = Utility.translateError(this, vars, vars.getLanguage(), Utility
          .parseTranslation(this, vars, vars.getLanguage(), "@APRM_MissingMatchingAlgorithm@"));
      vars.setMessage(strTabId, message);
      printPageClosePopUp(response, vars, Utility.getTabURL(strTabId, "R", true));
      return;
    }
    try {
      ComboTableData comboTableData = new ComboTableData(vars, this, "LIST", "",
          "0CC268ED2E8D4B0397A0DCBBFA2237DE", "", Utility.getContext(this, vars,
              "#AccessibleOrgTree", "MatchTransaction"), Utility.getContext(this, vars,
              "#User_Client", "MatchTransaction"), 0);
      Utility.fillSQLParameters(this, vars, null, comboTableData, "MatchTransaction", "");
      xmlDocument.setData("reportPaymentTypeFilter", "liststructure", comboTableData.select(false));
      comboTableData = null;
    } catch (Exception ex) {
      throw new ServletException(ex);
    }

    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  private void printGrid(HttpServletResponse response, VariablesSecureApp vars,
      String strPaymentTypeFilter, String strFinancialAccountId, String strReconciliationId,
      String strShowCleared, String strHideDate, String showJSMessage) throws IOException,
      ServletException {
    log4j.debug("Output: Grid Match using imported Bank Statement Lines");

    XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/advpaymentmngt/ad_actionbutton/MatchTransactionGrid").createXmlDocument();

    FieldProvider[] data = getMatchedBankStatementLinesData(vars, strFinancialAccountId,
        strReconciliationId, strPaymentTypeFilter, strShowCleared, strHideDate);

    xmlDocument.setData("structure", data);

    JSONObject table = new JSONObject();
    try {
      table.put("grid", xmlDocument.print());
      table.put("showJSMessage", showJSMessage);
    } catch (JSONException e) {
      log4j.debug("JSON object error" + table.toString());
    }
    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println("data = " + table.toString());
    out.close();
  }

  private void unMatchBankStatementLine(HttpServletResponse response,
      String strUnmatchBankStatementLineId) throws IOException, ServletException {
    try {
      unmatch(OBDal.getInstance().get(FIN_BankStatementLine.class, strUnmatchBankStatementLineId));
      response.setContentType("text/html; charset=UTF-8");
      PrintWriter out = response.getWriter();
      out.println("");
      out.close();
    } catch (Exception e) {
      throw new OBException(e);
    }
  }

  private FieldProvider[] getMatchedBankStatementLinesData(VariablesSecureApp vars,
      String strFinancialAccountId, String strReconciliationId, String strPaymentTypeFilter,
      String strShowCleared, String strHideDate) throws ServletException {
    FIN_FinancialAccount financial = new AdvPaymentMngtDao().getObject(FIN_FinancialAccount.class,
        strFinancialAccountId);
    MatchingAlgorithm ma = financial.getMatchingAlgorithm();
    FIN_MatchingTransaction matchingTransaction = new FIN_MatchingTransaction(ma.getJavaClassName());

    List<FIN_BankStatementLine> bankLines = MatchTransactionDao.getMatchingBankStatementLines(
        strFinancialAccountId, strReconciliationId, strPaymentTypeFilter, strShowCleared);
    FIN_Reconciliation reconciliation = OBDal.getInstance().get(FIN_Reconciliation.class,
        strReconciliationId);
    FIN_BankStatementLine[] FIN_BankStatementLines = new FIN_BankStatementLine[0];
    FIN_BankStatementLines = bankLines.toArray(FIN_BankStatementLines);
    FieldProvider[] data = FieldProviderFactory.getFieldProviderArray(bankLines);

    OBContext.setAdminMode();
    try {
      List<FIN_FinaccTransaction> excluded = new ArrayList<FIN_FinaccTransaction>();
      for (int i = 0; i < data.length; i++) {
        final String COLOR_STRONG = "#66CC00";
        final String COLOR_WEAK = "#99CC66";
        final String COLOR_WHITE = "white";
        boolean alreadyMatched = false;

        String matchingType = FIN_BankStatementLines[i].getMatchingtype();
        FIN_FinaccTransaction transaction = FIN_BankStatementLines[i]
            .getFinancialAccountTransaction();
        if (transaction == null) {
          FIN_MatchedTransaction matched = matchingTransaction.match(FIN_BankStatementLines[i],
              excluded);
          // When hide flag checked then exclude matchings for transactions out of date range
          if ("Y".equals(strHideDate)
              && matched.getTransaction() != null
              && matched.getTransaction().getTransactionDate().compareTo(
                  reconciliation.getEndingDate()) > 0) {
            matched = new FIN_MatchedTransaction(null, FIN_MatchedTransaction.NOMATCH);
          }
          transaction = matched.getTransaction();
          if (transaction != null && FIN_MatchedTransaction.STRONG.equals(matched.getMatchLevel())) {
            FIN_BankStatementLine bsl = FIN_BankStatementLines[i];
            bsl.setFinancialAccountTransaction(transaction);
            bsl.setMatchingtype(matched.getMatchLevel());
            transaction.setStatus("RPPC");
            transaction.setReconciliation(MatchTransactionDao.getObject(FIN_Reconciliation.class,
                strReconciliationId));
            if (transaction.getFinPayment() != null) {
              transaction.getFinPayment().setStatus("RPPC");
            }
            OBDal.getInstance().save(transaction);
            OBDal.getInstance().save(bsl);
            OBDal.getInstance().flush();
          }
          if (transaction != null) {
            excluded.add(transaction);
          }
          matchingType = matched.getMatchLevel();

        } else {
          alreadyMatched = true;
        }

        FieldProviderFactory.setField(data[i], "rownum", Integer.toString(i + 1));
        FieldProviderFactory.setField(data[i], "yes", "Y");
        FieldProviderFactory.setField(data[i], "finBankLineId", FIN_BankStatementLines[i].getId());
        FieldProviderFactory.setField(data[i], "bankLineTransactionDate", Utility.formatDate(
            FIN_BankStatementLines[i].getTransactionDate(), vars.getJavaDateFormat()));
        FieldProviderFactory.setField(data[i], "bankLineBusinessPartner", FIN_BankStatementLines[i]
            .getBpartnername());
        FieldProviderFactory.setField(data[i], "bankLineReferenceNo", FIN_BankStatementLines[i]
            .getReferenceNo());
        // CREDIT - DEBIT
        FieldProviderFactory.setField(data[i], "bankLineAmount", FIN_BankStatementLines[i]
            .getCramount().subtract(FIN_BankStatementLines[i].getDramount()).toString());
        FieldProviderFactory
            .setField(
                data[i],
                "matchStyle",
                FIN_MatchedTransaction.STRONG.equals(matchingType) ? COLOR_STRONG
                    : ((FIN_MatchedTransaction.WEAK.equals(matchingType)) ? COLOR_WEAK
                        : ((FIN_MatchedTransaction.NOMATCH.equals(matchingType) || FIN_MatchedTransaction.MANUALMATCH
                            .equals(matchingType)) ? COLOR_WHITE : matchingType)));
        FieldProviderFactory.setField(data[i], "matchingType", matchingType);

        if (transaction != null) {
          final String MATCHED_AGAINST_TRANSACTION = FIN_Utility.messageBD("APRM_Transaction");
          final String MATCHED_AGAINST_PAYMENT = FIN_Utility.messageBD("APRM_Payment");
          final String MATCHED_AGAINST_INVOICE = FIN_Utility.messageBD("APRM_Invoice");
          final String MATCHED_AGAINST_ORDER = FIN_Utility.messageBD("APRM_Order");
          final String MATCHED_AGAINST_CREDIT = FIN_Utility.messageBD("APRM_Credit");
          FieldProviderFactory.setField(data[i], "disabled", "N");
          // Auto Matching or already matched
          FieldProviderFactory.setField(data[i], "checked", FIN_MatchedTransaction.STRONG
              .equals(matchingType)
              || alreadyMatched ? "Y" : "N");
          FieldProviderFactory.setField(data[i], "finTransactionId", transaction.getId());
          FieldProviderFactory.setField(data[i], "transactionDate", Utility.formatDate(transaction
              .getTransactionDate().compareTo(reconciliation.getEndingDate()) > 0 ? reconciliation
              .getEndingDate() : transaction.getTransactionDate(), vars.getJavaDateFormat()));
          FieldProviderFactory.setField(data[i], "matchedDocument", !transaction
              .isCreatedByAlgorithm() ? MATCHED_AGAINST_TRANSACTION : (!transaction.getFinPayment()
              .isCreatedByAlgorithm() ? MATCHED_AGAINST_PAYMENT : (transaction.getFinPayment()
              .getFINPaymentDetailList().get(0).getFINPaymentScheduleDetailList().get(0)
              .getInvoicePaymentSchedule() == null && transaction.getFinPayment()
              .getFINPaymentDetailList().get(0).getFINPaymentScheduleDetailList().get(0)
              .getOrderPaymentSchedule() == null) ? MATCHED_AGAINST_CREDIT : (transaction
              .getFinPayment().getFINPaymentDetailList().get(0).getFINPaymentScheduleDetailList()
              .get(0).getInvoicePaymentSchedule() != null ? MATCHED_AGAINST_INVOICE
              : MATCHED_AGAINST_ORDER)));
          FieldProviderFactory.setField(data[i], "transactionBPartner",
              transaction.getFinPayment() != null ? transaction.getFinPayment()
                  .getBusinessPartner().getName() : "");
          FieldProviderFactory
              .setField(
                  data[i],
                  "transactionReferenceNo",
                  transaction.getFinPayment() != null ? (transaction.getFinPayment().isReceipt() ? transaction
                      .getFinPayment().getDocumentNo()
                      : transaction.getFinPayment().getReferenceNo())
                      : "");
          FieldProviderFactory.setField(data[i], "transactionAmount", transaction
              .getDepositAmount().subtract(transaction.getPaymentAmount()).toString());
        } else {
          FieldProviderFactory.setField(data[i], "disabled", "Y");
          FieldProviderFactory.setField(data[i], "checked", "N");
          FieldProviderFactory.setField(data[i], "finTransactionId", "");
          FieldProviderFactory.setField(data[i], "transactionDate", "");
          FieldProviderFactory.setField(data[i], "transactionBPartner", "");
          FieldProviderFactory.setField(data[i], "transactionReferenceNo", "");
          FieldProviderFactory.setField(data[i], "transactionAmount", "");
        }
      }
    } finally {
      OBContext.restorePreviousMode();
    }
    return data;
  }

  public String checkReconciliationNotProcessed(VariablesSecureApp vars,
      String strReconciliationId, String strTabId) {
    FIN_Reconciliation reconciliation = MatchTransactionDao.getObject(FIN_Reconciliation.class,
        strReconciliationId);
    OBContext.setAdminMode();
    try {
      String text = "Closed or Invalid Reconciliation";
      if (reconciliation != null && !reconciliation.isNewOBObject() && reconciliation.isProcessed()) {
        OBError menssage = Utility.translateError(this, vars, vars.getLanguage(), text);
        vars.setMessage(strTabId, menssage);
        return text;
      }
      return "";
    } catch (Exception e) {
      throw new OBException(e);
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  private boolean isManualReconciliation(FIN_Reconciliation reconciliation) {
    OBContext.setAdminMode();
    try {
      final OBCriteria<FIN_ReconciliationLine_v> obc = OBDal.getInstance().createCriteria(
          FIN_ReconciliationLine_v.class);
      obc.add(Restrictions.eq(FIN_ReconciliationLine_v.PROPERTY_RECONCILIATION, reconciliation));
      obc.add(Restrictions.isNull(FIN_ReconciliationLine_v.PROPERTY_BANKSTATEMENTLINE));
      obc.setMaxResults(1);
      final List<FIN_ReconciliationLine_v> rec = obc.list();
      return (rec.size() != 0);
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  private void getSnapShot(FIN_Reconciliation reconciliation) {
    if (reconciliation == null)
      return;
    OBContext.setAdminMode();
    try {
      // First remove old temp info if exists
      List<FIN_ReconciliationLineTemp> oldTempLines = reconciliation
          .getFINReconciliationLineTempList();
      for (FIN_ReconciliationLineTemp oldtempLine : oldTempLines) {
        OBDal.getInstance().remove(oldtempLine);
        OBDal.getInstance().flush();
      }
      // Now copy info taken from the reconciliation when first opened
      List<FIN_ReconciliationLine_v> reconciledlines = reconciliation
          .getFINReconciliationLineVList();
      for (FIN_ReconciliationLine_v reconciledLine : reconciledlines) {
        FIN_ReconciliationLineTemp lineTemp = OBProvider.getInstance().get(
            FIN_ReconciliationLineTemp.class);
        lineTemp.setClient(reconciledLine.getClient());
        lineTemp.setOrganization(reconciledLine.getOrganization());
        lineTemp.setReconciliation(reconciledLine.getReconciliation());
        lineTemp.setBankStatementLine(reconciledLine.getBankStatementLine());
        if (reconciledLine.getFinancialAccountTransaction() != null
            && reconciledLine.getFinancialAccountTransaction().isCreatedByAlgorithm()) {
          if (reconciledLine.getFinancialAccountTransaction().getFinPayment() != null
              && !reconciledLine.getFinancialAccountTransaction().getFinPayment()
                  .isCreatedByAlgorithm()) {
            lineTemp.setPayment(reconciledLine.getPayment());
          } else if (reconciledLine.getFinancialAccountTransaction().getFinPayment()
              .getFINPaymentDetailList().get(0).getFINPaymentScheduleDetailList() != null
              && reconciledLine.getFinancialAccountTransaction().getFinPayment()
                  .getFINPaymentDetailList().get(0).getFINPaymentScheduleDetailList().size() > 0
              && (reconciledLine.getFinancialAccountTransaction().getFinPayment()
                  .getFINPaymentDetailList().get(0).getFINPaymentScheduleDetailList().get(0)
                  .getInvoicePaymentSchedule() != null || reconciledLine
                  .getFinancialAccountTransaction().getFinPayment().getFINPaymentDetailList()
                  .get(0).getFINPaymentScheduleDetailList().get(0).getOrderPaymentSchedule() != null)) {
            lineTemp.setPaymentScheduleDetail(reconciledLine.getFinancialAccountTransaction()
                .getFinPayment().getFINPaymentDetailList().get(0).getFINPaymentScheduleDetailList()
                .get(0));
          }
        } else {
          lineTemp.setFinancialAccountTransaction(reconciledLine.getFinancialAccountTransaction());
        }
        if (reconciledLine.getFinancialAccountTransaction().getFinPayment() != null) {
          lineTemp.setPaymentDocumentno(reconciledLine.getFinancialAccountTransaction()
              .getFinPayment().getDocumentNo());
        }
        lineTemp
            .setMatched(reconciledLine.getBankStatementLine().getFinancialAccountTransaction() != null);
        lineTemp.setMatchlevel(reconciledLine.getBankStatementLine().getMatchingtype());
        OBDal.getInstance().save(lineTemp);
        OBDal.getInstance().flush();
      }
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  private void restoreSnapShot(FIN_Reconciliation reconciliation) {
    OBContext.setAdminMode();
    List<FIN_BankStatementLine> tempBSL = new ArrayList<FIN_BankStatementLine>();
    List<FIN_BankStatementLine> finalBSL = new ArrayList<FIN_BankStatementLine>();
    try {
      // First get the list of BSL which were reconciled at the beginning (L1)
      List<FIN_ReconciliationLineTemp> oldTempLines = reconciliation
          .getFINReconciliationLineTempList();
      for (FIN_ReconciliationLineTemp oldTempLine : oldTempLines) {
        tempBSL.add(oldTempLine.getBankStatementLine());
      }
      // Then get the list of BSL reconciled at last (L2)
      List<FIN_ReconciliationLine_v> oldReconciliationLines = reconciliation
          .getFINReconciliationLineVList();
      for (FIN_ReconciliationLine_v oldReconciliationLine : oldReconciliationLines) {
        finalBSL.add(oldReconciliationLine.getBankStatementLine());
      }
      // Unmatch L2-L1
      finalBSL.removeAll(tempBSL);
      unmatch(finalBSL);
      // Match L1
      match(reconciliation);
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  private void unmatch(List<FIN_BankStatementLine> toUnmatch) {
    for (FIN_BankStatementLine bsl : toUnmatch) {
      unmatch(bsl);
    }
  }

  private void unmatch(FIN_BankStatementLine bsline) {
    OBContext.setAdminMode();
    try {
      FIN_FinaccTransaction finTrans = bsline.getFinancialAccountTransaction();
      if (finTrans != null) {
        finTrans.setReconciliation(null);
        bsline.setFinancialAccountTransaction(null);
        OBDal.getInstance().save(finTrans);
        OBDal.getInstance().flush();
      }
      bsline.setMatchingtype(null);
      OBDal.getInstance().save(bsline);
      OBDal.getInstance().flush();

      if (finTrans != null) {
        if (finTrans.getFinPayment() != null) {
          finTrans.getFinPayment().setStatus(
              (finTrans.getFinPayment().isReceipt()) ? "RDNC" : "PWNC");
        }
        boolean isReceipt = false;
        if (finTrans.getFinPayment() != null) {
          isReceipt = finTrans.getFinPayment().isReceipt();
        } else {
          isReceipt = finTrans.getDepositAmount().compareTo(finTrans.getPaymentAmount()) > 0;
        }
        finTrans.setStatus(isReceipt ? "RDNC" : "PWNC");
        finTrans.setReconciliation(null);
        OBDal.getInstance().save(finTrans);
        OBDal.getInstance().flush();
      }
      // Execute un-matching logic defined by algorithm
      MatchingAlgorithm ma = bsline.getBankStatement().getAccount().getMatchingAlgorithm();
      FIN_MatchingTransaction matchingTransaction = new FIN_MatchingTransaction(ma
          .getJavaClassName());
      matchingTransaction.unmatch(finTrans);
    } catch (Exception e) {
      throw new OBException(e);
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  private void match(FIN_Reconciliation reconciliation) {
    List<FIN_ReconciliationLineTemp> snapShotList = reconciliation
        .getFINReconciliationLineTempList();
    for (FIN_ReconciliationLineTemp toMatch : snapShotList) {
      FIN_BankStatementLine bsl = toMatch.getBankStatementLine();
      if (bsl.getFinancialAccountTransaction() != null) {
        continue;
      }
      FIN_FinaccTransaction transaction = getTransactionFromTemp(toMatch);
      bsl.setFinancialAccountTransaction(transaction);
      bsl.setMatchingtype(toMatch.getMatchlevel());
      transaction.setStatus("RPPC");
      transaction.setReconciliation(reconciliation);
      if (transaction.getFinPayment() != null) {
        transaction.getFinPayment().setStatus("RPPC");
      }
      OBDal.getInstance().save(transaction);
      OBDal.getInstance().save(bsl);
      OBDal.getInstance().flush();
    }
  }

  private FIN_FinaccTransaction getTransactionFromTemp(FIN_ReconciliationLineTemp toMatch) {
    if (toMatch.getFinancialAccountTransaction() != null) {
      return toMatch.getFinancialAccountTransaction();
    } else if (toMatch.getPayment() != null) {
      AdvPaymentMngtDao dao = new AdvPaymentMngtDao();
      return dao.getFinancialTransaction(toMatch.getPayment());
    } else {
      // get DocumentNo
      String strPaymentDocumentNo = toMatch.getPaymentDocumentno();
      // If the payment remains in the system, it is used
      FIN_Payment alreadyExistingPayment = getAlreadyExistingPayment(strPaymentDocumentNo, toMatch
          .getBankStatementLine().getOrganization());
      if (alreadyExistingPayment != null) {
        AdvPaymentMngtDao dao = new AdvPaymentMngtDao();
        return dao.getFinancialTransaction(alreadyExistingPayment);
      }
      // Create a payment and a transaction to match
      AdvPaymentMngtDao dao = new AdvPaymentMngtDao();
      FIN_PaymentScheduleDetail paymentScheduleDetail = toMatch.getPaymentScheduleDetail();
      BigDecimal amount = toMatch.getBankStatementLine().getCramount().subtract(
          toMatch.getBankStatementLine().getDramount());
      boolean isReceipt = amount.signum() > 0;
      BusinessPartner bp = paymentScheduleDetail == null ? toMatch.getBankStatementLine()
          .getBusinessPartner()
          : (paymentScheduleDetail.getInvoicePaymentSchedule() != null ? paymentScheduleDetail
              .getInvoicePaymentSchedule().getInvoice().getBusinessPartner()
              : (paymentScheduleDetail.getOrderPaymentSchedule() != null ? paymentScheduleDetail
                  .getOrderPaymentSchedule().getOrder().getBusinessPartner()
                  : paymentScheduleDetail.getPaymentDetails().getFinPayment().getBusinessPartner()));
      FIN_PaymentMethod pm = paymentScheduleDetail == null ? (isReceipt ? bp.getPaymentMethod()
          : bp.getPOPaymentMethod())
          : (paymentScheduleDetail.getInvoicePaymentSchedule() != null ? paymentScheduleDetail
              .getInvoicePaymentSchedule().getInvoice().getPaymentMethod() : (paymentScheduleDetail
              .getOrderPaymentSchedule() != null ? paymentScheduleDetail.getOrderPaymentSchedule()
              .getOrder().getPaymentMethod() : paymentScheduleDetail.getPaymentDetails()
              .getFinPayment().getPaymentMethod()));
      DocumentType docType = FIN_Utility.getDocumentType(toMatch.getBankStatementLine()
          .getOrganization(), isReceipt ? "ARR" : "APP");
      HashMap<String, BigDecimal> hm = new HashMap<String, BigDecimal>();
      List<FIN_PaymentScheduleDetail> psdList = new ArrayList<FIN_PaymentScheduleDetail>();
      if (paymentScheduleDetail != null) {
        hm.put(paymentScheduleDetail.getId(), amount);
        psdList.add(paymentScheduleDetail);
      }
      if ("".equals(strPaymentDocumentNo))
        strPaymentDocumentNo = FIN_Utility.getDocumentNo(docType,
            docType.getTable() != null ? docType.getTable().getDBTableName() : "");
      FIN_Payment payment = FIN_AddPayment.savePayment(null, isReceipt, docType,
          strPaymentDocumentNo, bp, pm, toMatch.getBankStatementLine().getBankStatement()
              .getAccount(), amount.abs().toString(), toMatch.getBankStatementLine()
              .getTransactionDate(), toMatch.getBankStatementLine().getOrganization(), toMatch
              .getBankStatementLine().getReferenceNo(), psdList, hm, false, false);
      // Flag payment as created by algorithm
      payment.setCreatedByAlgorithm(true);
      OBDal.getInstance().save(payment);
      OBDal.getInstance().flush();
      try {
        ConnectionProvider conn = new DalConnectionProvider();
        FIN_AddPayment.processPayment(new VariablesSecureApp(OBContext.getOBContext().getUser()
            .getId(), OBContext.getOBContext().getCurrentClient().getId(), OBContext.getOBContext()
            .getCurrentOrganization().getId(), OBContext.getOBContext().getRole().getId()), conn,
            "P", payment);
      } catch (Exception e) {
        return null;
      }
      FIN_FinaccTransaction transaction = dao.getFinancialTransaction(payment);
      // Flag transaction as created by algorithm
      transaction.setCreatedByAlgorithm(true);
      OBDal.getInstance().save(transaction);
      OBDal.getInstance().flush();
      TransactionsDao.process(transaction);
      return transaction;
    }
  }

  private FIN_Payment getAlreadyExistingPayment(String strPaymentDocumentNo,
      Organization organization) {
    final OBCriteria<FIN_Payment> obc = OBDal.getInstance().createCriteria(FIN_Payment.class);
    obc.add(Restrictions.eq(FIN_Payment.PROPERTY_DOCUMENTNO, strPaymentDocumentNo));
    obc.add(Restrictions.eq(FIN_Payment.PROPERTY_ORGANIZATION, organization));
    obc.setMaxResults(1);
    final List<FIN_Payment> payments = obc.list();
    if (payments.size() == 0) {
      return null;
    } else {
      return payments.get(0);
    }
  }

  public String getServletInfo() {
    return "This servlet match imported bank statement lines for a financial account";
  }
}
