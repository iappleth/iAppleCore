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
 ************************************************************************
 */

package org.openbravo.erpCommon.ad_forms;

import java.math.BigDecimal;
import java.sql.Connection;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import javax.servlet.ServletException;

import org.apache.log4j.Logger;
import org.hibernate.criterion.Expression;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.base.session.OBPropertiesProvider;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.data.FieldProvider;
import org.openbravo.database.ConnectionProvider;
import org.openbravo.erpCommon.utility.FieldProviderFactory;
import org.openbravo.erpCommon.utility.SequenceIdData;
import org.openbravo.model.common.enterprise.AcctSchemaTableDocType;
import org.openbravo.model.financialmgmt.accounting.FIN_FinancialAccountAccounting;
import org.openbravo.model.financialmgmt.accounting.coa.AcctSchemaTable;
import org.openbravo.model.financialmgmt.gl.GLItem;
import org.openbravo.model.financialmgmt.gl.GLItemAccounts;
import org.openbravo.model.financialmgmt.payment.FIN_FinaccTransaction;
import org.openbravo.model.financialmgmt.payment.FIN_FinancialAccount;
import org.openbravo.model.financialmgmt.payment.FIN_Payment;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentDetail;
import org.openbravo.model.financialmgmt.payment.FIN_Reconciliation;

public class DocFINReconciliation extends AcctServer {
  /** Transaction type - Financial Account */
  public static final String TRXTYPE_BPDeposit = "BPD";
  public static final String TRXTYPE_BPWithdrawal = "BPW";
  public static final String TRXTYPE_BankFee = "BF";

  private static final long serialVersionUID = 1L;
  private static final Logger log4j = Logger.getLogger(DocFINReconciliation.class);

  String SeqNo = "0";

  public DocFINReconciliation() {
  }

  public DocFINReconciliation(String AD_Client_ID, String AD_Org_ID,
      ConnectionProvider connectionProvider) {
    super(AD_Client_ID, AD_Org_ID, connectionProvider);
  }

  public boolean loadDocumentDetails(FieldProvider[] data, ConnectionProvider conn) {
    DocumentType = AcctServer.DOCTYPE_Reconciliation;
    DateDoc = data[0].getField("statementDate");
    C_DocType_ID = data[0].getField("C_Doctype_ID");
    DocumentNo = data[0].getField("DocumentNo");
    boolean wasAdministrator = OBContext.getOBContext().setInAdministratorMode(true);
    try {
      FIN_Reconciliation reconciliation = OBDal.getInstance().get(FIN_Reconciliation.class,
          Record_ID);
      Amounts[0] = reconciliation.getEndingBalance().subtract(reconciliation.getStartingbalance())
          .toString();
    } finally {
      OBContext.getOBContext().setInAdministratorMode(wasAdministrator);
    }
    loadDocumentType();
    p_lines = loadLines();
    return true;
  }

  public FieldProviderFactory[] loadLinesFieldProvider(String Id) {
    FieldProviderFactory[] linesInfo = null;
    boolean wasAdministrator = OBContext.getOBContext().setInAdministratorMode(true);
    try {
      FIN_Reconciliation reconciliation = OBDal.getInstance().get(FIN_Reconciliation.class, Id);
      List<FIN_FinaccTransaction> transactions = getTransactionList(reconciliation);
      for (FIN_FinaccTransaction transaction : transactions) {
        FIN_Payment payment = transaction.getFinPayment();
        // If payment exists the payment details are loaded, if not the GLItem info is loaded
        if (payment != null)
          linesInfo = add(linesInfo, loadLinesPaymentDetailsFieldProvider(transaction));
        else if (transaction.getGLItem() != null)
          linesInfo = add(linesInfo, loadLinesGLItemFieldProvider(transaction));
      }
    } finally {
      OBContext.getOBContext().setInAdministratorMode(wasAdministrator);
    }
    return linesInfo;
  }

  FieldProviderFactory[] add(FieldProviderFactory[] one, FieldProviderFactory[] two) {
    if (one == null)
      return two;
    if (two == null)
      return one;
    FieldProviderFactory[] result = new FieldProviderFactory[one.length + two.length];
    for (int i = 0; i < one.length; i++) {
      if (one[i] != null)
        result[i] = one[i];
    }
    for (int i = 0; i < two.length; i++) {
      if (two[i] != null)
        result[i + one.length] = two[i];
    }
    return result;
  }

  public List<FIN_FinaccTransaction> getTransactionList(FIN_Reconciliation reconciliation) {
    boolean wasAdministrator = OBContext.getOBContext().setInAdministratorMode(true);
    List<FIN_FinaccTransaction> transactions = null;
    try {
      OBCriteria<FIN_FinaccTransaction> trans = OBDal.getInstance().createCriteria(
          FIN_FinaccTransaction.class);
      trans.add(Expression.eq(FIN_FinaccTransaction.PROPERTY_RECONCILIATION, reconciliation));
      trans.setFilterOnReadableClients(false);
      trans.setFilterOnReadableOrganization(false);
      transactions = trans.list();
    } finally {
      OBContext.getOBContext().setInAdministratorMode(wasAdministrator);
    }
    return transactions;
  }

  public FieldProviderFactory[] loadLinesPaymentDetailsFieldProvider(
      FIN_FinaccTransaction transaction) {
    FIN_Payment payment = OBDal.getInstance().get(FIN_Payment.class,
        transaction.getFinPayment().getId());
    List<FIN_PaymentDetail> paymentDetails = payment.getFINPaymentDetailList();
    FieldProviderFactory[] data = new FieldProviderFactory[paymentDetails.size()];
    boolean wasAdministrator = OBContext.getOBContext().setInAdministratorMode(true);
    try {
      for (int i = 0; i < data.length; i++) {
        data[i] = new FieldProviderFactory(new HashMap());
        FieldProviderFactory.setField(data[0], "FIN_Reconciliation_ID", transaction
            .getReconciliation().getId());
        FieldProviderFactory.setField(data[i], "FIN_Finacc_Transaction_ID", transaction.getId());
        FieldProviderFactory.setField(data[i], "AD_Client_ID", paymentDetails.get(i).getClient()
            .getId());
        FieldProviderFactory.setField(data[i], "AD_Org_ID", paymentDetails.get(i).getOrganization()
            .getId());
        FieldProviderFactory.setField(data[i], "FIN_Payment_Detail_ID", paymentDetails.get(i)
            .getId());
        FieldProviderFactory.setField(data[i], "FIN_Payment_ID", payment.getId());
        FieldProviderFactory.setField(data[0], "DepositAmount", transaction.getDepositAmount()
            .toString());
        FieldProviderFactory.setField(data[0], "PaymentAmount", transaction.getPaymentAmount()
            .toString());
        FieldProviderFactory.setField(data[i], "Amount", paymentDetails.get(i).getAmount()
            .toString());
        FieldProviderFactory.setField(data[i], "isprepayment",
            paymentDetails.get(i).isPrepayment() ? "Y" : "N");
        FieldProviderFactory.setField(data[i], "WriteOffAmt", paymentDetails.get(i)
            .getWriteoffAmount().toString());
        FieldProviderFactory.setField(data[i], "cGlItemId",
            paymentDetails.get(i).getGLItem() != null ? paymentDetails.get(i).getGLItem().getId()
                : "");
        FieldProviderFactory.setField(data[i], "cBpartnerId", payment.getBusinessPartner().getId());
        FieldProviderFactory.setField(data[i], "Refund", paymentDetails.get(i).isRefund() ? "Y"
            : "N");
        FieldProviderFactory.setField(data[0], "adOrgId", transaction.getOrganization().getId());
        FieldProviderFactory.setField(data[0], "cGlItemId",
            transaction.getGLItem() != null ? transaction.getGLItem().getId() : data[i]
                .getField("cGlItemId"));
        FieldProviderFactory.setField(data[0], "description", transaction.getDescription());
        FieldProviderFactory.setField(data[0], "cCurrencyId", transaction.getCurrency().getId());
        if (transaction.getActivity() != null)
          FieldProviderFactory.setField(data[0], "cActivityId", transaction.getActivity().getId());
        if (transaction.getProject() != null)
          FieldProviderFactory.setField(data[0], "cProjectId", transaction.getProject().getId());
        if (transaction.getSalesCampaign() != null)
          FieldProviderFactory.setField(data[0], "cCampaignId", transaction.getSalesCampaign()
              .getId());
        FieldProviderFactory.setField(data[0], "lineno", transaction.getLineNo().toString());
      }
    } finally {
      OBContext.getOBContext().setInAdministratorMode(wasAdministrator);
    }
    return data;
  }

  public FieldProviderFactory[] loadLinesGLItemFieldProvider(FIN_FinaccTransaction transaction) {
    FieldProviderFactory[] data = new FieldProviderFactory[1];
    boolean wasAdministrator = OBContext.getOBContext().setInAdministratorMode(true);
    try {
      data[0] = new FieldProviderFactory(new HashMap());
      FieldProviderFactory.setField(data[0], "FIN_Reconciliation_ID", transaction
          .getReconciliation().getId());
      FieldProviderFactory.setField(data[0], "FIN_Finacc_Transaction_ID", transaction.getId());
      FieldProviderFactory.setField(data[0], "AD_Client_ID", transaction.getClient().getId());
      FieldProviderFactory.setField(data[0], "adOrgId", transaction.getOrganization().getId());
      FieldProviderFactory.setField(data[0], "cGlItemId", transaction.getGLItem().getId());
      FieldProviderFactory.setField(data[0], "DepositAmount", transaction.getDepositAmount()
          .toString());
      FieldProviderFactory.setField(data[0], "PaymentAmount", transaction.getPaymentAmount()
          .toString());
      FieldProviderFactory.setField(data[0], "description", transaction.getDescription());
      FieldProviderFactory.setField(data[0], "cCurrencyId", transaction.getCurrency().getId());
      FieldProviderFactory
          .setField(data[0], "cBpartnerId", (transaction.getFinPayment() == null || transaction
              .getFinPayment().getBusinessPartner() == null) ? "" : transaction.getFinPayment()
              .getBusinessPartner().getId());
      if (transaction.getActivity() != null)
        FieldProviderFactory.setField(data[0], "cActivityId", transaction.getActivity().getId());
      if (transaction.getProject() != null)
        FieldProviderFactory.setField(data[0], "cProjectId", transaction.getProject().getId());
      if (transaction.getSalesCampaign() != null)
        FieldProviderFactory.setField(data[0], "cCampaignId", transaction.getSalesCampaign()
            .getId());
      FieldProviderFactory.setField(data[0], "lineno", transaction.getLineNo().toString());
    } finally {
      OBContext.getOBContext().setInAdministratorMode(wasAdministrator);
    }
    return data;
  }

  private DocLine[] loadLines() {
    ArrayList<Object> list = new ArrayList<Object>();
    FieldProviderFactory[] data = loadLinesFieldProvider(Record_ID);
    if (data == null || data.length == 0)
      return null;
    boolean wasAdministrator = OBContext.getOBContext().setInAdministratorMode(true);
    try {
      for (int i = 0; i < data.length; i++) {
        String Line_ID = data[i].getField("FIN_Finacc_Transaction_ID");
        DocLine_FINReconciliation docLine = new DocLine_FINReconciliation(DocumentType, Record_ID,
            Line_ID);
        String strPaymentId = data[i].getField("FIN_Payment_ID");
        if (strPaymentId != null && !strPaymentId.equals(""))
          docLine.setFinPaymentId(strPaymentId);
        docLine.m_Record_Id2 = strPaymentId;
        docLine.setIsPrepayment(data[i].getField("isprepayment"));
        docLine.setCGlItemId(data[i].getField("cGlItemId"));
        docLine.setPaymentAmount(data[i].getField("PaymentAmount"));
        docLine.setDepositAmount(data[i].getField("DepositAmount"));
        docLine.setWriteOffAmt(data[i].getField("WriteOffAmt"));
        docLine.setAmount(data[i].getField("Amount"));
        docLine.setFinFinAccTransactionId(data[i].getField("FIN_Finacc_Transaction_ID"));
        docLine.loadAttributes(data[i], this);
        list.add(docLine);
      }
    } finally {
      OBContext.getOBContext().setInAdministratorMode(wasAdministrator);
    }
    // Return Array
    DocLine_FINReconciliation[] dl = new DocLine_FINReconciliation[list.size()];
    list.toArray(dl);
    return dl;
  } // loadLines

  public Fact createFact(AcctSchema as, ConnectionProvider conn, Connection con,
      VariablesSecureApp vars) throws ServletException {
    // Select specific definition
    String strClassname = "";
    final StringBuilder whereClause = new StringBuilder();
    Fact fact = new Fact(this, as, Fact.POST_Actual);
    boolean wasAdministrator = OBContext.getOBContext().setInAdministratorMode(true);
    try {
      whereClause.append(" as astdt ");
      whereClause.append(" where astdt.acctschemaTable.accountingSchema.id = '"
          + as.m_C_AcctSchema_ID + "'");
      whereClause.append(" and astdt.acctschemaTable.table.id = '" + AD_Table_ID + "'");
      whereClause.append(" and astdt.documentCategory = '" + DocumentType + "'");

      final OBQuery<AcctSchemaTableDocType> obqParameters = OBDal.getInstance().createQuery(
          AcctSchemaTableDocType.class, whereClause.toString());
      final List<AcctSchemaTableDocType> acctSchemaTableDocTypes = obqParameters.list();

      if (acctSchemaTableDocTypes != null && acctSchemaTableDocTypes.size() > 0)
        strClassname = acctSchemaTableDocTypes.get(0).getCreatefactTemplate().getClassname();

      if (strClassname.equals("")) {
        final StringBuilder whereClause2 = new StringBuilder();

        whereClause2.append(" as ast ");
        whereClause2.append(" where ast.accountingSchema.id = '" + as.m_C_AcctSchema_ID + "'");
        whereClause2.append(" and ast.table.id = '" + AD_Table_ID + "'");

        final OBQuery<AcctSchemaTable> obqParameters2 = OBDal.getInstance().createQuery(
            AcctSchemaTable.class, whereClause2.toString());
        final List<AcctSchemaTable> acctSchemaTables = obqParameters2.list();
        if (acctSchemaTables != null && acctSchemaTables.size() > 0
            && acctSchemaTables.get(0).getCreatefactTemplate() != null)
          strClassname = acctSchemaTables.get(0).getCreatefactTemplate().getClassname();
      }
      if (!strClassname.equals("")) {
        try {
          DocFINReconciliationTemplate newTemplate = (DocFINReconciliationTemplate) Class.forName(
              strClassname).newInstance();
          return newTemplate.createFact(this, as, conn, con, vars);
        } catch (Exception e) {
          log4j.error("Error while creating new instance for DocFINReconciliationTemplate - " + e);
        }
      }
      for (int i = 0; p_lines != null && i < p_lines.length; i++) {
        DocLine_FINReconciliation line = (DocLine_FINReconciliation) p_lines[i];
        FIN_FinaccTransaction transaction = OBDal.getInstance().get(FIN_FinaccTransaction.class,
            line.getFinFinAccTransactionId());
        // 3 Scenarios: 1st Bank fee 2nd glitem transaction 3rd payment related transaction
        String Fact_Acct_Group_ID = SequenceIdData.getUUID();
        if (transaction.getTransactionType().equals(TRXTYPE_BankFee))
          continue;
        else if (!"".equals(line.getFinPaymentId()))
          fact = createFactPaymentDetails(line, as, conn, fact, Fact_Acct_Group_ID);
        else
          fact = createFactGLItem(line, as, conn, fact, Fact_Acct_Group_ID);
      }
    } finally {
      OBContext.getOBContext().setInAdministratorMode(wasAdministrator);
    }
    return fact;
  }

  public Fact createFactPaymentDetails(DocLine_FINReconciliation line, AcctSchema as,
      ConnectionProvider conn, Fact fact, String Fact_Acct_Group_ID) throws ServletException {
    boolean isPrepayment = "Y".equals(line.getIsPrepayment());
    BigDecimal paymentAmount = new BigDecimal(line.getPaymentAmount());
    BigDecimal depositAmount = new BigDecimal(line.getDepositAmount());
    boolean isReceipt = paymentAmount.compareTo(depositAmount) < 0;
    FIN_Payment payment = OBDal.getInstance().get(FIN_Payment.class, line.getFinPaymentId());
    FIN_FinaccTransaction transaction = OBDal.getInstance().get(FIN_FinaccTransaction.class,
        line.getFinFinAccTransactionId());
    if (getDocumentTransactionConfirmation(conn, transaction))
      fact.createLine(line, getAccountTransaction(conn, payment.getAccount(), as, isReceipt),
          C_Currency_ID, !isReceipt ? line.getAmount() : "", isReceipt ? line.getAmount() : "",
          Fact_Acct_Group_ID, nextSeqNo(SeqNo), DocumentType, conn);
    else if (!getDocumentPaymentConfirmation(conn, payment))
      fact.createLine(line, getAccountBPartner(
          (line.m_C_BPartner_ID == null || line.m_C_BPartner_ID.equals("")) ? this.C_BPartner_ID
              : line.m_C_BPartner_ID, as, isReceipt, isPrepayment, conn), C_Currency_ID,
          !isReceipt ? line.getAmount() : "", isReceipt ? line.getAmount() : "",
          Fact_Acct_Group_ID, nextSeqNo(SeqNo), DocumentType, conn);
    else
      fact.createLine(line, getAccountPayment(conn, payment.getAccount(), as, isReceipt),
          C_Currency_ID, !isReceipt ? line.getAmount() : "", isReceipt ? line.getAmount() : "",
          Fact_Acct_Group_ID, nextSeqNo(SeqNo), DocumentType, conn);
    fact.createLine(line, getAccount(conn, payment.getAccount(), as, isReceipt), C_Currency_ID,
        isReceipt ? line.getAmount() : "", !isReceipt ? line.getAmount() : "", Fact_Acct_Group_ID,
        "999999", DocumentType, conn);

    if (payment.getWriteoffAmount() != null
        && payment.getWriteoffAmount().compareTo(BigDecimal.ZERO) != 0) {
      fact.createLine(line, getAccount(AcctServer.ACCTTYPE_WriteOffDefault, as, conn),
          C_Currency_ID, (isReceipt ? line.getWriteOffAmt() : ""), (isReceipt ? "" : line
              .getWriteOffAmt()), Fact_Acct_Group_ID, nextSeqNo(SeqNo), DocumentType, conn);
    }
    SeqNo = "0";
    return fact;
  }

  /*
   * Creates the accounting for a transaction related directly with a GLItem
   */
  public Fact createFactGLItem(DocLine_FINReconciliation line, AcctSchema as,
      ConnectionProvider conn, Fact fact, String Fact_Acct_Group_ID) throws ServletException {
    BigDecimal paymentAmount = new BigDecimal(line.getPaymentAmount());
    BigDecimal depositAmount = new BigDecimal(line.getDepositAmount());
    boolean isReceipt = paymentAmount.compareTo(depositAmount) < 0;
    FIN_FinaccTransaction transaction = OBDal.getInstance().get(FIN_FinaccTransaction.class,
        line.getFinFinAccTransactionId());
    if (getDocumentTransactionConfirmation(conn, transaction))
      fact.createLine(line, getAccountTransaction(conn, transaction.getAccount(), as, isReceipt),
          C_Currency_ID, line.getPaymentAmount(), line.getDepositAmount(), Fact_Acct_Group_ID,
          nextSeqNo(SeqNo), DocumentType, conn);
    else if (!"".equals(line.getCGlItemId()))
      fact.createLine(line, getAccountGLItem(OBDal.getInstance().get(GLItem.class,
          line.getCGlItemId()), as, isReceipt, conn), C_Currency_ID, line.getPaymentAmount(), line
          .getDepositAmount(), Fact_Acct_Group_ID, nextSeqNo(SeqNo), DocumentType, conn);
    fact.createLine(line, getAccount(conn, transaction.getAccount(), as, isReceipt), C_Currency_ID,
        line.getDepositAmount(), line.getPaymentAmount(), Fact_Acct_Group_ID, "999999",
        DocumentType, conn);
    SeqNo = "0";
    return fact;
  }

  public String nextSeqNo(String oldSeqNo) {
    BigDecimal seqNo = new BigDecimal(oldSeqNo);
    SeqNo = (seqNo.add(new BigDecimal("10"))).toString();
    return SeqNo;
  }

  public BigDecimal getBalance() {
    return null;
  }

  public boolean getDocumentPaymentConfirmation(ConnectionProvider conn, FIN_Payment payment) {
    // Checks if this step (Make receive payment) is configured to generate accounting for the
    // selected financial account
    boolean confirmation = false;
    boolean wasAdministrator = OBContext.getOBContext().setInAdministratorMode(true);
    try {
      List<FIN_FinancialAccountAccounting> accounts = payment.getAccount()
          .getFINFinancialAccountAcctList();
      for (FIN_FinancialAccountAccounting account : accounts) {
        if ((payment.isReceipt() && account.getReceivePaymentAccount() != null)
            || (!payment.isReceipt() && account.getMakePaymentAccount() != null))
          confirmation = true;
      }
    } finally {
      OBContext.getOBContext().setInAdministratorMode(wasAdministrator);
    }
    return confirmation;
  }

  public boolean getDocumentTransactionConfirmation(ConnectionProvider conn,
      FIN_FinaccTransaction transaction) {
    // Checks if this step (deposit or withdrawal) is configured to generate accounting for the
    // selected financial account
    boolean confirmation = false;
    boolean wasAdministrator = OBContext.getOBContext().setInAdministratorMode(true);
    try {
      List<FIN_FinancialAccountAccounting> accounts = transaction.getAccount()
          .getFINFinancialAccountAcctList();
      for (FIN_FinancialAccountAccounting account : accounts) {
        if ((transaction.getTransactionType().equals(TRXTYPE_BPDeposit) && account
            .getDepositAccount() != null)
            || (transaction.getTransactionType().equals(TRXTYPE_BPWithdrawal) && account
                .getWithdrawalAccount() != null)
            || (transaction.getTransactionType().equals(TRXTYPE_BankFee) && account
                .getFINBankfeeAcct() != null))
          confirmation = true;
      }
    } finally {
      OBContext.getOBContext().setInAdministratorMode(wasAdministrator);
    }
    if (!confirmation)
      setStatus(STATUS_DocumentDisabled);
    return confirmation;
  }

  public boolean getDocumentConfirmation(ConnectionProvider conn, String strRecordId) {
    // Checks if this step (Reconciliation) is configured to generate accounting for the selected
    // financial account
    boolean confirmation = false;
    boolean wasAdministrator = OBContext.getOBContext().setInAdministratorMode(true);
    try {
      FIN_Reconciliation reconciliation = OBDal.getInstance().get(FIN_Reconciliation.class,
          strRecordId);
      List<FIN_FinancialAccountAccounting> accounts = reconciliation.getAccount()
          .getFINFinancialAccountAcctList();
      for (FIN_FinancialAccountAccounting account : accounts) {
        if (account.getDebitAccount() != null || account.getCreditAccount() != null)
          confirmation = true;
      }
    } finally {
      OBContext.getOBContext().setInAdministratorMode(wasAdministrator);
    }
    if (!confirmation)
      setStatus(STATUS_DocumentDisabled);
    return confirmation;
  }

  public void loadObjectFieldProvider(ConnectionProvider conn, String strAD_Client_ID, String Id)
      throws ServletException {
    FIN_Reconciliation reconciliation = OBDal.getInstance().get(FIN_Reconciliation.class, Id);

    FieldProviderFactory[] data = new FieldProviderFactory[1];
    boolean wasAdministrator = OBContext.getOBContext().setInAdministratorMode(true);
    try {
      data[0] = new FieldProviderFactory(new HashMap());
      FieldProviderFactory.setField(data[0], "AD_Client_ID", reconciliation.getClient().getId());
      FieldProviderFactory.setField(data[0], "AD_Org_ID", reconciliation.getOrganization().getId());
      FieldProviderFactory.setField(data[0], "FIN_Finacc_Transaction_ID", reconciliation.getId());
      FieldProviderFactory.setField(data[0], "C_Currency_ID", reconciliation.getAccount()
          .getCurrency().getId());
      FieldProviderFactory.setField(data[0], "C_Doctype_ID", reconciliation.getDocumentType()
          .getId());
      FieldProviderFactory.setField(data[0], "DocumentNo", reconciliation.getDocumentNo());
      String dateFormat = OBPropertiesProvider.getInstance().getOpenbravoProperties().getProperty(
          "dateFormat.java");
      SimpleDateFormat outputFormat = new SimpleDateFormat(dateFormat);
      FieldProviderFactory.setField(data[0], "statementDate", outputFormat.format(reconciliation
          .getTransactionDate()));
      FieldProviderFactory.setField(data[0], "Posted", reconciliation.getPosted());
      FieldProviderFactory.setField(data[0], "Processed", reconciliation.isProcessed() ? "Y" : "N");
      FieldProviderFactory.setField(data[0], "Processing", reconciliation.isProcessNow() ? "Y"
          : "N");
    } finally {
      OBContext.getOBContext().setInAdministratorMode(wasAdministrator);
    }
    setObjectFieldProvider(data);
  }

  public Account getAccountGLItem(GLItem glItem, AcctSchema as, boolean bIsReceipt,
      ConnectionProvider conn) throws ServletException {
    boolean wasAdministrator = OBContext.getOBContext().setInAdministratorMode(true);
    Account account = null;
    try {
      OBCriteria<GLItemAccounts> accounts = OBDal.getInstance()
          .createCriteria(GLItemAccounts.class);
      accounts.add(Expression.eq(GLItemAccounts.PROPERTY_GLITEM, glItem));
      accounts
          .add(Expression.eq(GLItemAccounts.PROPERTY_ACCOUNTINGSCHEMA, OBDal.getInstance().get(
              org.openbravo.model.financialmgmt.accounting.coa.AcctSchema.class,
              as.m_C_AcctSchema_ID)));
      accounts.add(Expression.eq(GLItemAccounts.PROPERTY_ACTIVE, true));
      accounts.setFilterOnReadableClients(false);
      accounts.setFilterOnReadableOrganization(false);
      List<GLItemAccounts> accountList = accounts.list();
      if (accountList == null || accountList.size() == 0)
        return null;
      if (bIsReceipt)
        account = new Account(conn, accountList.get(0).getGlitemCreditAcct().getId());
      else
        account = new Account(conn, accountList.get(0).getGlitemDebitAcct().getId());
    } finally {
      OBContext.getOBContext().setInAdministratorMode(wasAdministrator);
    }
    return account;
  }

  public Account getAccountFee(AcctSchema as, FIN_FinancialAccount finAccount,
      ConnectionProvider conn) throws ServletException {
    Account account = null;
    boolean wasAdministrator = OBContext.getOBContext().setInAdministratorMode(true);
    try {
      OBCriteria<FIN_FinancialAccountAccounting> accounts = OBDal.getInstance().createCriteria(
          FIN_FinancialAccountAccounting.class);
      accounts.add(Expression.eq(FIN_FinancialAccountAccounting.PROPERTY_ACCOUNT, finAccount));
      accounts.add(Expression.eq(FIN_FinancialAccountAccounting.PROPERTY_ACCOUNTINGSCHEMA, OBDal
          .getInstance().get(org.openbravo.model.financialmgmt.accounting.coa.AcctSchema.class,
              as.m_C_AcctSchema_ID)));
      accounts.add(Expression.eq(FIN_FinancialAccountAccounting.PROPERTY_ACTIVE, true));
      accounts.setFilterOnReadableClients(false);
      accounts.setFilterOnReadableOrganization(false);
      List<FIN_FinancialAccountAccounting> accountList = accounts.list();
      if (accountList == null || accountList.size() == 0)
        return null;
      account = new Account(conn, accountList.get(0).getFINBankfeeAcct().getId());
    } finally {
      OBContext.getOBContext().setInAdministratorMode(wasAdministrator);
    }
    return account;
  }

  public Account getWithdrawalAccount(AcctSchema as, FIN_FinancialAccount finAccount,
      ConnectionProvider conn) throws ServletException {
    return getAccountTransaction(conn, finAccount, as, false);
  }

  public Account getDepositAccount(AcctSchema as, FIN_FinancialAccount finAccount,
      ConnectionProvider conn) throws ServletException {
    return getAccountTransaction(conn, finAccount, as, true);
  }

  public Account getAccountTransaction(ConnectionProvider conn, FIN_FinancialAccount finAccount,
      AcctSchema as, boolean bIsReceipt) throws ServletException {
    Account account = null;
    boolean wasAdministrator = OBContext.getOBContext().setInAdministratorMode(true);
    try {
      OBCriteria<FIN_FinancialAccountAccounting> accounts = OBDal.getInstance().createCriteria(
          FIN_FinancialAccountAccounting.class);
      accounts.add(Expression.eq(FIN_FinancialAccountAccounting.PROPERTY_ACCOUNT, finAccount));
      accounts.add(Expression.eq(FIN_FinancialAccountAccounting.PROPERTY_ACCOUNTINGSCHEMA, OBDal
          .getInstance().get(org.openbravo.model.financialmgmt.accounting.coa.AcctSchema.class,
              as.m_C_AcctSchema_ID)));
      accounts.add(Expression.eq(FIN_FinancialAccountAccounting.PROPERTY_ACTIVE, true));
      accounts.setFilterOnReadableClients(false);
      accounts.setFilterOnReadableOrganization(false);
      List<FIN_FinancialAccountAccounting> accountList = accounts.list();
      if (accountList == null || accountList.size() == 0)
        return null;
      if (bIsReceipt)
        account = new Account(conn, accountList.get(0).getDepositAccount().getId());
      else
        account = new Account(conn, accountList.get(0).getWithdrawalAccount().getId());
    } finally {
      OBContext.getOBContext().setInAdministratorMode(wasAdministrator);
    }
    return account;
  }

  public Account getDebitAccount(AcctSchema as, FIN_FinancialAccount finAccount,
      ConnectionProvider conn) throws ServletException {
    return getAccount(conn, finAccount, as, false);
  }

  public Account getCreditAccount(AcctSchema as, FIN_FinancialAccount finAccount,
      ConnectionProvider conn) throws ServletException {
    return getAccount(conn, finAccount, as, true);
  }

  public Account getAccount(ConnectionProvider conn, FIN_FinancialAccount finAccount,
      AcctSchema as, boolean bIsReceipt) throws ServletException {
    Account account = null;
    boolean wasAdministrator = OBContext.getOBContext().setInAdministratorMode(true);
    try {
      OBCriteria<FIN_FinancialAccountAccounting> accounts = OBDal.getInstance().createCriteria(
          FIN_FinancialAccountAccounting.class);
      accounts.add(Expression.eq(FIN_FinancialAccountAccounting.PROPERTY_ACCOUNT, finAccount));
      accounts.add(Expression.eq(FIN_FinancialAccountAccounting.PROPERTY_ACCOUNTINGSCHEMA, OBDal
          .getInstance().get(org.openbravo.model.financialmgmt.accounting.coa.AcctSchema.class,
              as.m_C_AcctSchema_ID)));
      accounts.add(Expression.eq(FIN_FinancialAccountAccounting.PROPERTY_ACTIVE, true));
      accounts.setFilterOnReadableClients(false);
      accounts.setFilterOnReadableOrganization(false);
      List<FIN_FinancialAccountAccounting> accountList = accounts.list();
      if (accountList == null || accountList.size() == 0)
        return null;
      if (bIsReceipt)
        account = new Account(conn, accountList.get(0).getDebitAccount().getId());
      else
        account = new Account(conn, accountList.get(0).getCreditAccount().getId());
    } finally {
      OBContext.getOBContext().setInAdministratorMode(wasAdministrator);
    }
    return account;
  }

  public Account getAccountPayment(ConnectionProvider conn, FIN_FinancialAccount finAccount,
      AcctSchema as, boolean bIsReceipt) throws ServletException {
    boolean wasAdministrator = OBContext.getOBContext().setInAdministratorMode(true);
    Account account = null;
    try {
      OBCriteria<FIN_FinancialAccountAccounting> accounts = OBDal.getInstance().createCriteria(
          FIN_FinancialAccountAccounting.class);
      accounts.add(Expression.eq(FIN_FinancialAccountAccounting.PROPERTY_ACCOUNT, finAccount));
      accounts.add(Expression.eq(FIN_FinancialAccountAccounting.PROPERTY_ACCOUNTINGSCHEMA, OBDal
          .getInstance().get(org.openbravo.model.financialmgmt.accounting.coa.AcctSchema.class,
              as.m_C_AcctSchema_ID)));
      accounts.add(Expression.eq(FIN_FinancialAccountAccounting.PROPERTY_ACTIVE, true));
      accounts.setFilterOnReadableClients(false);
      accounts.setFilterOnReadableOrganization(false);
      List<FIN_FinancialAccountAccounting> accountList = accounts.list();
      if (accountList == null || accountList.size() == 0)
        return null;
      if (bIsReceipt)
        account = new Account(conn, accountList.get(0).getReceivePaymentAccount().getId());
      else
        account = new Account(conn, accountList.get(0).getMakePaymentAccount().getId());
    } finally {
      OBContext.getOBContext().setInAdministratorMode(wasAdministrator);
    }
    return account;
  }

}