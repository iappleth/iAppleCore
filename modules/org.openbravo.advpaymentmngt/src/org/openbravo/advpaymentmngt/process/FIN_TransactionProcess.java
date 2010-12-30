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
package org.openbravo.advpaymentmngt.process;

import org.openbravo.advpaymentmngt.dao.AdvPaymentMngtDao;
import org.openbravo.advpaymentmngt.utility.FIN_Utility;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.database.ConnectionProvider;
import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.financialmgmt.payment.FIN_FinaccTransaction;
import org.openbravo.model.financialmgmt.payment.FIN_FinancialAccount;
import org.openbravo.model.financialmgmt.payment.FIN_Payment;
import org.openbravo.scheduling.ProcessBundle;

public class FIN_TransactionProcess implements org.openbravo.scheduling.Process {
  private static AdvPaymentMngtDao dao;

  public void execute(ProcessBundle bundle) throws Exception {
    dao = new AdvPaymentMngtDao();
    OBError msg = new OBError();
    msg.setType("Success");
    msg.setTitle(Utility.messageBD(bundle.getConnection(), "Success", bundle.getContext()
        .getLanguage()));

    try {
      // retrieve custom params
      final String strAction = (String) bundle.getParams().get("action");

      // retrieve standard params
      final String recordID = (String) bundle.getParams().get("Fin_FinAcc_Transaction_ID");
      final FIN_FinaccTransaction transaction = dao
          .getObject(FIN_FinaccTransaction.class, recordID);
      final VariablesSecureApp vars = bundle.getContext().toVars();
      final ConnectionProvider conProvider = bundle.getConnection();
      OBContext.setAdminMode();
      try {
        transaction.setProcessNow(true);
        OBDal.getInstance().save(transaction);
        OBDal.getInstance().flush();
        if (strAction.equals("P")) {
          // ***********************
          // Process Transaction
          // ***********************
          final FIN_FinancialAccount financialAccount = transaction.getAccount();
          financialAccount.setCurrentBalance(financialAccount.getCurrentBalance().add(
              transaction.getDepositAmount().subtract(transaction.getPaymentAmount())));
          transaction.setProcessed(true);
          FIN_Payment payment = transaction.getFinPayment();
          if (payment != null) {
            payment.setStatus(payment.isReceipt() ? "RDNC" : "PWNC");
            transaction.setStatus(payment.isReceipt() ? "RDNC" : "PWNC");
            OBDal.getInstance().save(payment);
          } else {
            transaction.setStatus(transaction.getDepositAmount().compareTo(
                transaction.getPaymentAmount()) > 0 ? "RDNC" : "PWNC");
          }
          OBDal.getInstance().save(financialAccount);
          OBDal.getInstance().save(transaction);
          OBDal.getInstance().flush();
        } else if (strAction.equals("R")) {
          // ***********************
          // Reactivate Transaction
          // ***********************
          // Already Posted Document
          if ("Y".equals(transaction.getPosted())) {
            msg.setType("Error");
            msg.setTitle(Utility.messageBD(conProvider, "Error", vars.getLanguage()));
            msg.setMessage(Utility.parseTranslation(conProvider, vars, vars.getLanguage(),
                "@PostedDocument@" + ": " + transaction.getIdentifier()));
            bundle.setResult(msg);
            return;
          }
          // Already Reconciled
          if (transaction.getReconciliation() != null || "RPPC".equals(transaction.getStatus())) {
            msg.setType("Error");
            msg.setTitle(Utility.messageBD(conProvider, "Error", vars.getLanguage()));
            msg.setMessage(Utility.parseTranslation(conProvider, vars, vars.getLanguage(),
                "@APRM_ReconciledDocument@" + ": " + transaction.getIdentifier()));
            bundle.setResult(msg);
            return;
          }
          transaction.setProcessed(false);
          final FIN_FinancialAccount financialAccount = transaction.getAccount();
          financialAccount.setCurrentBalance(financialAccount.getCurrentBalance().subtract(
              transaction.getDepositAmount()).add(transaction.getPaymentAmount()));
          OBDal.getInstance().save(financialAccount);
          OBDal.getInstance().save(transaction);
          OBDal.getInstance().flush();
          FIN_Payment payment = transaction.getFinPayment();
          if (payment != null) {
            payment.setStatus(payment.isReceipt() ? "RPR" : "PPM");
            transaction.setStatus(payment.isReceipt() ? "RPR" : "PPM");
            OBDal.getInstance().save(payment);
          } else {
            transaction.setStatus(transaction.getDepositAmount().compareTo(
                transaction.getPaymentAmount()) > 0 ? "RPR" : "PPM");
          }
          OBDal.getInstance().save(transaction);
          OBDal.getInstance().flush();
          bundle.setResult(msg);
        }
        transaction.setProcessNow(false);
        OBDal.getInstance().save(transaction);
        OBDal.getInstance().flush();
      } finally {
        OBContext.restorePreviousMode();
      }
    } catch (final Exception e) {
      OBDal.getInstance().rollbackAndClose();
      e.printStackTrace(System.err);
      msg.setType("Error");
      msg.setTitle(Utility.messageBD(bundle.getConnection(), "Error", bundle.getContext()
          .getLanguage()));
      msg.setMessage(FIN_Utility.getExceptionMessage(e));
      bundle.setResult(msg);
    }
  }

}
