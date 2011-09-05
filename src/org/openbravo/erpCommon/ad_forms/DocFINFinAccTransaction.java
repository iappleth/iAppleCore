/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.1  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License.
 * The Original Code is Openbravo ERP.
 * The Initial Developer of the Original Code is Openbravo SLU
 * All portions are Copyright (C) 2010-2011 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.erpCommon.ad_forms;

import java.math.BigDecimal;
import java.math.MathContext;
import java.sql.Connection;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.ServletException;

import org.apache.log4j.Logger;
import org.hibernate.criterion.Restrictions;
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
import org.openbravo.model.common.businesspartner.BusinessPartner;
import org.openbravo.model.common.enterprise.AcctSchemaTableDocType;
import org.openbravo.model.financialmgmt.accounting.FIN_FinancialAccountAccounting;
import org.openbravo.model.financialmgmt.accounting.coa.AccountingCombination;
import org.openbravo.model.financialmgmt.accounting.coa.AcctSchemaDefault;
import org.openbravo.model.financialmgmt.accounting.coa.AcctSchemaTable;
import org.openbravo.model.financialmgmt.gl.GLItem;
import org.openbravo.model.financialmgmt.payment.FIN_FinaccTransaction;
import org.openbravo.model.financialmgmt.payment.FIN_FinancialAccount;
import org.openbravo.model.financialmgmt.payment.FIN_Payment;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentDetail;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentMethod;
import org.openbravo.model.financialmgmt.payment.FinAccPaymentMethod;

public class DocFINFinAccTransaction extends AcctServer {
  /** Transaction type - Financial Account */
  public static final String TRXTYPE_BPDeposit = "BPD";
  public static final String TRXTYPE_BPWithdrawal = "BPW";
  public static final String TRXTYPE_BankFee = "BF";
  BigDecimal usedCredit = ZERO;
  BigDecimal generatedCredit = ZERO;
  String paymentDate = null;

  private static final long serialVersionUID = 1L;
  private static final Logger log4j = Logger.getLogger(DocFINFinAccTransaction.class);

  String SeqNo = "0";

  public DocFINFinAccTransaction() {
  }

  public DocFINFinAccTransaction(String AD_Client_ID, String AD_Org_ID,
      ConnectionProvider connectionProvider) {
    super(AD_Client_ID, AD_Org_ID, connectionProvider);
  }

  @Override
  public boolean loadDocumentDetails(FieldProvider[] data, ConnectionProvider conn) {
    DocumentType = AcctServer.DOCTYPE_FinAccTransaction;
    DateDoc = data[0].getField("trxdate");
    BigDecimal paymentAmount = "".equals(data[0].getField("PaymentAmount")) ? ZERO
        : new BigDecimal(data[0].getField("PaymentAmount"));
    BigDecimal depositAmount = "".equals(data[0].getField("DepositAmount")) ? ZERO
        : new BigDecimal(data[0].getField("DepositAmount"));
    usedCredit = "".equals(data[0].getField("UsedCredit")) ? ZERO : new BigDecimal(
        data[0].getField("UsedCredit"));
    generatedCredit = "".equals(data[0].getField("GeneratedCredit")) ? ZERO : new BigDecimal(
        data[0].getField("GeneratedCredit"));
    Amounts[AMTTYPE_Gross] = depositAmount.subtract(paymentAmount).toString();
    paymentDate = data[0].getField("paymentDate");
    loadDocumentType();
    p_lines = loadLines();
    return true;
  }

  public FieldProviderFactory[] loadLinesFieldProvider(String Id) {
    FIN_FinaccTransaction transaction = OBDal.getInstance().get(FIN_FinaccTransaction.class, Id);
    FIN_Payment payment = transaction.getFinPayment();
    // If payment exists the payment details are loaded, if not the GLItem info is loaded
    if (payment != null)
      return loadLinesPaymentDetailsFieldProvider(transaction);
    else
      return loadLinesGLItemFieldProvider(transaction);
  }

  public FieldProviderFactory[] loadLinesPaymentDetailsFieldProvider(
      FIN_FinaccTransaction transaction) {
    FIN_Payment payment = transaction.getFinPayment();
    List<FIN_PaymentDetail> paymentDetails = payment.getFINPaymentDetailList();
    FieldProviderFactory[] data = new FieldProviderFactory[paymentDetails.size()];
    OBContext.setAdminMode();
    try {
      for (int i = 0; i < data.length; i++) {
        /*
         * if (!getPaymentConfirmation(payment)) continue;
         */
        // Details refunded used credit are excluded as the entry will be created using the credit
        // used
        if (paymentDetails.get(i).isRefund() && paymentDetails.get(i).isPrepayment())
          continue;
        data[i] = new FieldProviderFactory(null);
        FieldProviderFactory.setField(data[i], "FIN_Finacc_Transaction_ID", transaction.getId());
        FieldProviderFactory.setField(data[i], "AD_Client_ID", paymentDetails.get(i).getClient()
            .getId());
        FieldProviderFactory.setField(data[i], "AD_Org_ID", paymentDetails.get(i).getOrganization()
            .getId());
        FieldProviderFactory.setField(data[i], "FIN_Payment_Detail_ID", paymentDetails.get(i)
            .getId());
        FieldProviderFactory.setField(data[i], "FIN_Payment_ID", payment.getId());
        FieldProviderFactory.setField(data[i], "DepositAmount", transaction.getDepositAmount()
            .toString());
        FieldProviderFactory.setField(data[i], "PaymentAmount", transaction.getPaymentAmount()
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
        FieldProviderFactory.setField(data[i], "cInvoiceId", paymentDetails.get(i)
            .getFINPaymentScheduleDetailList().get(0).getInvoicePaymentSchedule() != null
            && paymentDetails.get(i).getFINPaymentScheduleDetailList().get(0)
                .getInvoicePaymentSchedule().getInvoice() != null ? paymentDetails.get(i)
            .getFINPaymentScheduleDetailList().get(0).getInvoicePaymentSchedule().getInvoice()
            .getId() : "");
        // Calculate Business Partner from payment header or from details if header is null
        BusinessPartner bPartner = payment.getBusinessPartner() != null ? payment
            .getBusinessPartner() : (paymentDetails.get(i).getFINPaymentScheduleDetailList().get(0)
            .getInvoicePaymentSchedule() != null ? paymentDetails.get(i)
            .getFINPaymentScheduleDetailList().get(0).getInvoicePaymentSchedule().getInvoice()
            .getBusinessPartner() : (paymentDetails.get(i).getFINPaymentScheduleDetailList().get(0)
            .getOrderPaymentSchedule() != null ? paymentDetails.get(i)
            .getFINPaymentScheduleDetailList().get(0).getOrderPaymentSchedule().getOrder()
            .getBusinessPartner() : null));
        FieldProviderFactory.setField(data[i], "cBpartnerId", bPartner != null ? bPartner.getId()
            : "");
        FieldProviderFactory.setField(data[i], "Refund", paymentDetails.get(i).isRefund() ? "Y"
            : "N");
        FieldProviderFactory.setField(data[i], "adOrgId", paymentDetails.get(i).getOrganization()
            .getId());
        FieldProviderFactory.setField(data[i], "description", transaction.getDescription());
        FieldProviderFactory.setField(data[i], "cCurrencyId", transaction.getCurrency().getId());
        FieldProviderFactory.setField(data[i], "cProjectId", paymentDetails.get(i)
            .getFINPaymentScheduleDetailList().get(0).getInvoicePaymentSchedule() != null
            && paymentDetails.get(i).getFINPaymentScheduleDetailList().get(0)
                .getInvoicePaymentSchedule().getInvoice().getProject() != null ? paymentDetails
            .get(i).getFINPaymentScheduleDetailList().get(0).getInvoicePaymentSchedule()
            .getInvoice().getProject().getId() : (paymentDetails.get(i)
            .getFINPaymentScheduleDetailList().get(0).getOrderPaymentSchedule() != null
            && paymentDetails.get(i).getFINPaymentScheduleDetailList().get(0)
                .getOrderPaymentSchedule().getOrder().getProject() != null ? paymentDetails.get(i)
            .getFINPaymentScheduleDetailList().get(0).getOrderPaymentSchedule().getOrder()
            .getProject().getId() : ""));
        FieldProviderFactory
            .setField(
                data[i],
                "cCampaignId",
                paymentDetails.get(i).getFINPaymentScheduleDetailList().get(0)
                    .getInvoicePaymentSchedule() != null
                    && paymentDetails.get(i).getFINPaymentScheduleDetailList().get(0)
                        .getInvoicePaymentSchedule().getInvoice().getSalesCampaign() != null ? paymentDetails
                    .get(i).getFINPaymentScheduleDetailList().get(0).getInvoicePaymentSchedule()
                    .getInvoice().getSalesCampaign().getId()
                    : (paymentDetails.get(i).getFINPaymentScheduleDetailList().get(0)
                        .getOrderPaymentSchedule() != null
                        && paymentDetails.get(i).getFINPaymentScheduleDetailList().get(0)
                            .getOrderPaymentSchedule().getOrder().getSalesCampaign() != null ? paymentDetails
                        .get(i).getFINPaymentScheduleDetailList().get(0).getOrderPaymentSchedule()
                        .getOrder().getSalesCampaign().getId()
                        : ""));
        FieldProviderFactory.setField(data[i], "cActivityId", paymentDetails.get(i)
            .getFINPaymentScheduleDetailList().get(0).getInvoicePaymentSchedule() != null
            && paymentDetails.get(i).getFINPaymentScheduleDetailList().get(0)
                .getInvoicePaymentSchedule().getInvoice().getActivity() != null ? paymentDetails
            .get(i).getFINPaymentScheduleDetailList().get(0).getInvoicePaymentSchedule()
            .getInvoice().getActivity().getId() : (paymentDetails.get(i)
            .getFINPaymentScheduleDetailList().get(0).getOrderPaymentSchedule() != null
            && paymentDetails.get(i).getFINPaymentScheduleDetailList().get(0)
                .getOrderPaymentSchedule().getOrder().getActivity() != null ? paymentDetails.get(i)
            .getFINPaymentScheduleDetailList().get(0).getOrderPaymentSchedule().getOrder()
            .getActivity().getId() : ""));
        FieldProviderFactory.setField(data[i], "lineno", transaction.getLineNo().toString());
      }
    } finally {
      OBContext.restorePreviousMode();
    }
    return data;
  }

  public FieldProviderFactory[] loadLinesGLItemFieldProvider(FIN_FinaccTransaction transaction) {
    FieldProviderFactory[] data = new FieldProviderFactory[1];
    OBContext.setAdminMode();
    try {
      data[0] = new FieldProviderFactory(null);
      FieldProviderFactory.setField(data[0], "FIN_Finacc_Transaction_ID", transaction.getId());
      FieldProviderFactory.setField(data[0], "AD_Client_ID", transaction.getClient().getId());
      FieldProviderFactory.setField(data[0], "adOrgId", transaction.getOrganization().getId());
      FieldProviderFactory.setField(data[0], "cGlItemId",
          transaction.getGLItem() != null ? transaction.getGLItem().getId() : "");
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
      OBContext.restorePreviousMode();
    }
    return data;
  }

  private DocLine[] loadLines() {
    ArrayList<Object> list = new ArrayList<Object>();
    FieldProviderFactory[] data = loadLinesFieldProvider(Record_ID);
    if (data == null || data.length == 0)
      return null;
    for (int i = 0; i < data.length; i++) {
      if (data[i] == null)
        continue;
      String Line_ID = data[i].getField("FIN_Finacc_Transaction_ID");
      DocLine_FINFinAccTransaction docLine = new DocLine_FINFinAccTransaction(DocumentType,
          Record_ID, Line_ID);
      String strPaymentId = data[i].getField("FIN_Payment_ID");
      if (strPaymentId != null && !strPaymentId.equals(""))
        docLine.setFinPaymentId(strPaymentId);
      docLine.m_Record_Id2 = strPaymentId;
      docLine.setIsPrepayment(data[i].getField("isprepayment"));
      docLine.setCGlItemId(data[i].getField("cGlItemId"));
      docLine.setPaymentAmount(data[i].getField("PaymentAmount"));
      docLine.setDepositAmount(data[i].getField("DepositAmount"));
      docLine.setAmount(data[i].getField("Amount"));
      docLine.setWriteOffAmt(data[i].getField("WriteOffAmt"));
      docLine.setAmount(data[i].getField("Amount"));
      docLine.setInvoice_ID(data[i].getField("cInvoiceId"));
      docLine.loadAttributes(data[i], this);
      list.add(docLine);
    }
    // Return Array
    DocLine_FINFinAccTransaction[] dl = new DocLine_FINFinAccTransaction[list.size()];
    list.toArray(dl);
    return dl;
  } // loadLines

  @Override
  public Fact createFact(AcctSchema as, ConnectionProvider conn, Connection con,
      VariablesSecureApp vars) throws ServletException {
    // Select specific definition
    String strClassname = "";
    final StringBuilder whereClause = new StringBuilder();
    Fact fact = new Fact(this, as, Fact.POST_Actual);
    OBContext.setAdminMode();
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
          DocFINFinAccTransactionTemplate newTemplate = (DocFINFinAccTransactionTemplate) Class
              .forName(strClassname).newInstance();
          return newTemplate.createFact(this, as, conn, con, vars);
        } catch (Exception e) {
          log4j.error("Error while creating new instance for DocFINFinAccTransactionTemplate - "
              + e);
        }
      }
      FIN_FinaccTransaction transaction = OBDal.getInstance().get(FIN_FinaccTransaction.class,
          Record_ID);
      // 3 Scenarios: 1st Bank fee 2nd payment related transaction 3rd glitem transaction
      if (TRXTYPE_BankFee.equals(transaction.getTransactionType()))
        fact = createFactFee(transaction, as, conn, fact);
      else if (transaction.getFinPayment() != null)
        fact = createFactPaymentDetails(as, conn, fact);
      else
        fact = createFactGLItem(as, conn, fact);
    } finally {
      OBContext.restorePreviousMode();
    }
    return fact;
  }

  /*
   * Creates accounting related to a bank fee transaction
   */
  public Fact createFactFee(FIN_FinaccTransaction transaction, AcctSchema as,
      ConnectionProvider conn, Fact fact) throws ServletException {
    String Fact_Acct_Group_ID = SequenceIdData.getUUID();
    for (int i = 0; p_lines != null && i < p_lines.length; i++) {
      DocLine_FINFinAccTransaction line = (DocLine_FINFinAccTransaction) p_lines[i];
      fact.createLine(line, getAccountFee(as, transaction.getAccount(), conn), C_Currency_ID,
          line.getPaymentAmount(), line.getDepositAmount(), Fact_Acct_Group_ID, nextSeqNo(SeqNo),
          DocumentType, conn);
      fact.createLine(line, getWithdrawalAccount(as, null, transaction.getAccount(), conn),
          C_Currency_ID, line.getDepositAmount(), line.getPaymentAmount(), Fact_Acct_Group_ID,
          nextSeqNo(SeqNo), DocumentType, conn);
    }
    SeqNo = "0";
    return fact;
  }

  /*
   * Creates accounting related to a bank fee transaction
   */
  @Deprecated
  public Fact createFactFee(DocLine_FINFinAccTransaction docline,
      FIN_FinaccTransaction transaction, AcctSchema as, ConnectionProvider conn, Fact fact)
      throws ServletException {
    return createFactFee(transaction, as, conn, fact);
  }

  public Fact createFactPaymentDetails(AcctSchema as, ConnectionProvider conn, Fact fact)
      throws ServletException {
    FIN_FinaccTransaction transaction = OBDal.getInstance().get(FIN_FinaccTransaction.class,
        Record_ID);
    String Fact_Acct_Group_ID = SequenceIdData.getUUID();
    final FIN_Payment txnFinPayment = transaction.getFinPayment();

    BigDecimal docToSchemaConversionRate = null;
    // See if we can use the conversion rate specified in the transcaction
    if (transaction.getForeignCurrency() != null && !as.getC_Currency_ID().equals(C_Currency_ID)
        && as.getC_Currency_ID().equals(transaction.getForeignCurrency().getId())) {
      // txn conversion rate is from foreign currency to txn currency
      // So need to invert to convert from doc currency to schema currency
      docToSchemaConversionRate = BigDecimal.ONE.divide(transaction.getForeignConversionRate(),
          MathContext.DECIMAL64);
    }

    if (!getDocumentPaymentConfirmation(txnFinPayment)) {
      // Multicurrency balancing
      BigDecimal paymentToSchemaConversionRate = null;
      String paymentCurrencyId = C_Currency_ID;
      if (!C_Currency_ID.equals(txnFinPayment.getCurrency().getId())) {
        // If payment currency different from account currency, flag as multicurrency so that
        // source balancing doesn't try match amounts in different currencies
        MultiCurrency = true;
        paymentCurrencyId = txnFinPayment.getCurrency().getId();
        // See if we can use the conversion rate specified in the payment
        if (!as.getC_Currency_ID().equals(paymentCurrencyId)
            && as.getC_Currency_ID().equals(C_Currency_ID)) {
          // Payment financial txn conversion rate is from payment currency to account currency
          // Can use this rate when schema currency is same as financial account currency
          paymentToSchemaConversionRate = txnFinPayment.getFinancialTransactionConvertRate();
        }
      }

      for (int i = 0; p_lines != null && i < p_lines.length; i++) {
        DocLine_FINFinAccTransaction line = (DocLine_FINFinAccTransaction) p_lines[i];
        boolean isPrepayment = "Y".equals(line.getIsPrepayment());
        boolean isReceipt = txnFinPayment.isReceipt();
        BigDecimal bpamount = new BigDecimal(line.getAmount());
        if (!"".equals(line.getWriteOffAmt())
            && ZERO.compareTo(new BigDecimal(line.getWriteOffAmt())) != 0) {
          // Writeoff uses same exchange rate as original invoice
          Account account = isReceipt ? getAccount(AcctServer.ACCTTYPE_WriteOff, as, conn)
              : getAccount(AcctServer.ACCTTYPE_WriteOff_Revenue, as, conn);
          if (account == null) {
            account = isReceipt ? getAccount(AcctServer.ACCTTYPE_WriteOffDefault, as, conn)
                : getAccount(AcctServer.ACCTTYPE_WriteOffDefault_Revenue, as, conn);
          }
          fact.createLine(line, account, paymentCurrencyId,
              (isReceipt ? line.getWriteOffAmt() : ""), (isReceipt ? "" : line.getWriteOffAmt()),
              Fact_Acct_Group_ID, nextSeqNo(SeqNo), DocumentType, paymentDate, conn);
          bpamount = bpamount.add(new BigDecimal(line.getWriteOffAmt()));
        }
        // Bug critical: Before GL Item was not taken into account
        if (!"".equals(line.cGlItemId)) {
          fact.createLine(
              line,
              getAccountGLItem(OBDal.getInstance().get(GLItem.class, line.getCGlItemId()), as,
                  isReceipt, conn), paymentCurrencyId, isReceipt ? "" : line.getAmount(),
              isReceipt ? line.getAmount() : "", Fact_Acct_Group_ID, nextSeqNo(SeqNo),
              DocumentType, null, paymentToSchemaConversionRate, conn);
        } else {
          fact.createLine(
              line,
              getAccountBPartner(
                  (line.m_C_BPartner_ID == null || line.m_C_BPartner_ID.equals("")) ? this.C_BPartner_ID
                      : line.m_C_BPartner_ID, as, isReceipt, isPrepayment, conn),
              paymentCurrencyId, !isReceipt ? bpamount.toString() : "",
              isReceipt ? bpamount.toString() : "", Fact_Acct_Group_ID, nextSeqNo(SeqNo),
              DocumentType, paymentDate, conn);
        }
      }
      // Pre-payment is consumed when Used Credit Amount not equals Zero. When consuming Credit no
      // credit is generated
      if (txnFinPayment.getUsedCredit().compareTo(ZERO) != 0
          && txnFinPayment.getGeneratedCredit().compareTo(ZERO) == 0) {
        fact.createLine(null,
            getAccountBPartner(C_BPartner_ID, as, txnFinPayment.isReceipt(), true, conn),
            paymentCurrencyId, (txnFinPayment.isReceipt() ? txnFinPayment.getUsedCredit()
                .toString() : ""), (txnFinPayment.isReceipt() ? "" : txnFinPayment.getUsedCredit()
                .toString()), Fact_Acct_Group_ID, nextSeqNo(SeqNo), DocumentType, null,
            paymentToSchemaConversionRate, conn);
      }
    } else {
      fact.createLine(
          null,
          getAccountPayment(conn, txnFinPayment.getPaymentMethod(), txnFinPayment.getAccount(), as,
              txnFinPayment.isReceipt()), txnFinPayment.getCurrency().getId(), !txnFinPayment
              .isReceipt() ? txnFinPayment.getAmount().toString() : "",
          txnFinPayment.isReceipt() ? txnFinPayment.getAmount().toString() : "",
          Fact_Acct_Group_ID, nextSeqNo(SeqNo), DocumentType, paymentDate,
          docToSchemaConversionRate, EXCHANGE_DOCTYPE_Payment, txnFinPayment.getId(), conn);
    }
    fact.createLine(
        null,
        getAccountUponDepositWithdrawal(conn, txnFinPayment.getPaymentMethod(),
            transaction.getAccount(), as, txnFinPayment.isReceipt()), C_Currency_ID, transaction
            .getDepositAmount().toString(), transaction.getPaymentAmount().toString(),
        Fact_Acct_Group_ID, nextSeqNo(SeqNo), DocumentType, null, docToSchemaConversionRate,
        EXCHANGE_DOCTYPE_Transaction, transaction.getId(), conn);
    if (!as.getC_Currency_ID().equals(transaction.getForeignCurrency())) {
      MultiCurrency = true;
      createFactCurrencyBalancing(as, conn, fact, Fact_Acct_Group_ID, transaction);
    }
    SeqNo = "0";
    return fact;
  }

  @Deprecated
  public Fact createFactPaymentDetails(DocLine_FINFinAccTransaction docline, AcctSchema as,
      ConnectionProvider conn, Fact fact) throws ServletException {
    return createFactPaymentDetails(as, conn, fact);
  }

  /*
   * Creates the accounting for a transaction related directly with a GLItem
   */
  public Fact createFactGLItem(AcctSchema as, ConnectionProvider conn, Fact fact)
      throws ServletException {
    for (int i = 0; p_lines != null && i < p_lines.length; i++) {
      DocLine_FINFinAccTransaction line = (DocLine_FINFinAccTransaction) p_lines[i];
      BigDecimal paymentAmount = new BigDecimal(line.getPaymentAmount());
      BigDecimal depositAmount = new BigDecimal(line.getDepositAmount());
      boolean isReceipt = paymentAmount.compareTo(depositAmount) < 0;
      String Fact_Acct_Group_ID = SequenceIdData.getUUID();
      if (!"".equals(line.getCGlItemId()))
        fact.createLine(
            line,
            getAccountGLItem(OBDal.getInstance().get(GLItem.class, line.getCGlItemId()), as,
                isReceipt, conn), C_Currency_ID, line.getPaymentAmount(), line.getDepositAmount(),
            Fact_Acct_Group_ID, nextSeqNo(SeqNo), DocumentType, conn);
      FIN_FinaccTransaction transaction = OBDal.getInstance().get(FIN_FinaccTransaction.class,
          Record_ID);
      fact.createLine(
          line,
          getAccountUponDepositWithdrawal(conn, transaction.getFinPayment() != null ? transaction
              .getFinPayment().getPaymentMethod() : null, transaction.getAccount(), as, isReceipt),
          C_Currency_ID, line.getDepositAmount(), line.getPaymentAmount(), Fact_Acct_Group_ID,
          "999999", DocumentType, conn);
    }
    SeqNo = "0";
    return fact;
  }

  /*
   * Creates the accounting for a transaction related directly with a GLItem
   */
  @Deprecated
  public Fact createFactGLItem(DocLine_FINFinAccTransaction docline, AcctSchema as,
      ConnectionProvider conn, Fact fact) throws ServletException {
    return createFactGLItem(as, conn, fact);
  }

  private void createFactCurrencyBalancing(AcctSchema as, ConnectionProvider conn, Fact fact,
      String fact_Acct_Group_ID, FIN_FinaccTransaction finaccTransaction) throws ServletException {
    final BigDecimal acctBalance = fact.getAcctBalance();
    if (BigDecimal.ZERO.compareTo(acctBalance) != 0) {
      // Need to add balancing entry
      // Balance == AcctDr - AcctCr
      String currencyLossDR = "0";
      String currencyGainCR = "0";
      boolean isGain = acctBalance.compareTo(BigDecimal.ZERO) > 0;
      if (isGain) {
        // debit > credit = need to credit
        currencyGainCR = acctBalance == null ? "" : acctBalance.toPlainString();
      } else {
        // debit < credit = need to debit
        currencyLossDR = acctBalance.negate() == null ? "" : acctBalance.negate().toPlainString();
      }

      String currencyLossGainAcctComboId = null;
      // Find gain / loss accounts from account
      for (FIN_FinancialAccountAccounting accounting : finaccTransaction.getAccount()
          .getFINFinancialAccountAcctList()) {
        if (accounting.getAccountingSchema().getId().equals(as.getC_AcctSchema_ID())) {
          AccountingCombination revaluationAcct;
          if (isGain) {
            revaluationAcct = accounting.getFINBankrevaluationgainAcct();
          } else {
            revaluationAcct = accounting.getFINBankrevaluationlossAcct();
          }
          if (revaluationAcct != null) {
            currencyLossGainAcctComboId = revaluationAcct.getId();
          }
          break;
        }
      }
      if (currencyLossGainAcctComboId == null) {
        // Find default gain/loss accounts from schema
        final OBQuery<AcctSchemaDefault> obqAcctSchemDefault = OBDal.getInstance().createQuery(
            AcctSchemaDefault.class, " where accountingSchema.id = '" + as.m_C_AcctSchema_ID + "'");
        final AcctSchemaDefault acctSchemaDefault = obqAcctSchemDefault.list().get(0);
        AccountingCombination defaultRevaluationAcct;
        if (isGain) {
          defaultRevaluationAcct = acctSchemaDefault.getBankRevaluationGain();
        } else {
          defaultRevaluationAcct = acctSchemaDefault.getBankRevaluationLoss();
        }
        if (currencyLossGainAcctComboId == null && defaultRevaluationAcct != null) {
          currencyLossGainAcctComboId = defaultRevaluationAcct.getId();
        }
      }
      Account accountGainLoss = Account.getAccount(conn, currencyLossGainAcctComboId);
      if (accountGainLoss == null) {
        // Fall back to currency balancing
        accountGainLoss = as.getCurrencyBalancing_Acct();
      }

      if (accountGainLoss != null) {
        final FactLine line = fact.createLine(null, accountGainLoss, as.getC_Currency_ID(),
            currencyLossDR, currencyGainCR, fact_Acct_Group_ID, nextSeqNo(SeqNo), DocumentType,
            conn);
        line.setAmtSource(C_Currency_ID, "0", "0"); // Mimic normal currency balancing
      }
    }
  }

  public String nextSeqNo(String oldSeqNo) {
    BigDecimal seqNo = new BigDecimal(oldSeqNo);
    SeqNo = (seqNo.add(new BigDecimal("10"))).toString();
    return SeqNo;
  }

  /**
   * Get Source Currency Balance - subtracts line amounts from total + usedCredit - no rounding
   * 
   * @return positive amount, if total is bigger than lines
   */
  @Override
  public BigDecimal getBalance() {
    BigDecimal retValue = ZERO;
    StringBuffer sb = new StringBuffer(" [");
    // Total
    retValue = retValue.add(new BigDecimal(getAmount(AcctServer.AMTTYPE_Gross)));
    if (usedCredit.compareTo(ZERO) != 0 && generatedCredit.compareTo(ZERO) == 0)
      retValue.add(usedCredit);
    sb.append(retValue);
    FIN_Payment payment = OBDal.getInstance().get(FIN_FinaccTransaction.class, Record_ID)
        .getFinPayment();
    // - Lines
    for (int i = 0; i < p_lines.length; i++) {
      if (payment == null) {
        BigDecimal lineBalance = new BigDecimal(
            ((DocLine_FINFinAccTransaction) p_lines[i]).DepositAmount);
        lineBalance = lineBalance.subtract(new BigDecimal(
            ((DocLine_FINFinAccTransaction) p_lines[i]).PaymentAmount));
        retValue = retValue.subtract(lineBalance);
      } else {
        BigDecimal lineBalance = payment.isReceipt() ? new BigDecimal(
            ((DocLine_FINFinAccTransaction) p_lines[i]).getAmount()) : new BigDecimal(
            ((DocLine_FINFinAccTransaction) p_lines[i]).getAmount()).negate();
        BigDecimal lineWriteoff = payment.isReceipt() ? new BigDecimal(
            ((DocLine_FINFinAccTransaction) p_lines[i]).getWriteOffAmt()) : new BigDecimal(
            ((DocLine_FINFinAccTransaction) p_lines[i]).getWriteOffAmt()).negate();
        retValue = retValue.subtract(lineBalance).subtract(lineWriteoff);
      }
    }
    sb.append("]");
    //
    log4j.debug(" Balance=" + retValue + sb.toString());
    return retValue;
  } // getBalance

  /*
   * Checks if Accounting for payments are enabled for the given payment
   */
  public boolean getDocumentPaymentConfirmation(FIN_Payment payment) {
    boolean confirmation = false;
    OBContext.setAdminMode();
    try {
      OBCriteria<FinAccPaymentMethod> obCriteria = OBDal.getInstance().createCriteria(
          FinAccPaymentMethod.class);
      obCriteria.add(Restrictions.eq(FinAccPaymentMethod.PROPERTY_ACCOUNT, payment.getAccount()));
      obCriteria.add(Restrictions.eq(FinAccPaymentMethod.PROPERTY_PAYMENTMETHOD,
          payment.getPaymentMethod()));
      obCriteria.setFilterOnReadableClients(false);
      obCriteria.setFilterOnReadableOrganization(false);
      List<FinAccPaymentMethod> lines = obCriteria.list();
      List<FIN_FinancialAccountAccounting> accounts = payment.getAccount()
          .getFINFinancialAccountAcctList();
      for (FIN_FinancialAccountAccounting account : accounts) {
        if (payment.isReceipt()) {
          if (("INT").equals(lines.get(0).getUponReceiptUse())
              && account.getInTransitPaymentAccountIN() != null)
            confirmation = true;
          else if (("DEP").equals(lines.get(0).getUponReceiptUse())
              && account.getDepositAccount() != null)
            confirmation = true;
          else if (("CLE").equals(lines.get(0).getUponReceiptUse())
              && account.getClearedPaymentAccount() != null)
            confirmation = true;
        } else {
          if (("INT").equals(lines.get(0).getUponPaymentUse())
              && account.getFINOutIntransitAcct() != null)
            confirmation = true;
          else if (("WIT").equals(lines.get(0).getUponPaymentUse())
              && account.getWithdrawalAccount() != null)
            confirmation = true;
          else if (("CLE").equals(lines.get(0).getUponPaymentUse())
              && account.getClearedPaymentAccountOUT() != null)
            confirmation = true;
        }
      }
    } catch (Exception e) {
      return confirmation;
    } finally {
      OBContext.restorePreviousMode();
    }
    return confirmation;
  }

  /*
   * Checks if Accounting for payments in transactions are enabled for the given payments
   */
  @Deprecated
  public boolean getPaymentConfirmation(FIN_Payment payment) {
    boolean confirmation = false;
    OBContext.setAdminMode();
    try {
      OBCriteria<FinAccPaymentMethod> obCriteria = OBDal.getInstance().createCriteria(
          FinAccPaymentMethod.class);
      obCriteria.add(Restrictions.eq(FinAccPaymentMethod.PROPERTY_ACCOUNT, payment.getAccount()));
      obCriteria.add(Restrictions.eq(FinAccPaymentMethod.PROPERTY_PAYMENTMETHOD,
          payment.getPaymentMethod()));
      obCriteria.setFilterOnReadableClients(false);
      obCriteria.setFilterOnReadableOrganization(false);
      List<FinAccPaymentMethod> lines = obCriteria.list();
      List<FIN_FinancialAccountAccounting> accounts = payment.getAccount()
          .getFINFinancialAccountAcctList();
      for (FIN_FinancialAccountAccounting account : accounts) {
        if (confirmation)
          return confirmation;
        if (payment.isReceipt()) {
          if (("INT").equals(lines.get(0).getUponDepositUse())
              && account.getInTransitPaymentAccountIN() != null)
            confirmation = true;
          else if (("DEP").equals(lines.get(0).getUponDepositUse())
              && account.getDepositAccount() != null)
            confirmation = true;
          else if (("CLE").equals(lines.get(0).getUponDepositUse())
              && account.getClearedPaymentAccount() != null)
            confirmation = true;
        } else {
          if (("INT").equals(lines.get(0).getUponWithdrawalUse())
              && account.getFINOutIntransitAcct() != null)
            confirmation = true;
          else if (("WIT").equals(lines.get(0).getUponWithdrawalUse())
              && account.getWithdrawalAccount() != null)
            confirmation = true;
          else if (("CLE").equals(lines.get(0).getUponWithdrawalUse())
              && account.getClearedPaymentAccountOUT() != null)
            confirmation = true;
        }
      }
    } catch (Exception e) {
      return confirmation;
    } finally {
      OBContext.restorePreviousMode();
    }
    return confirmation;
  }

  /*
   * Checks if this step is configured to generate accounting for the selected financial account
   */
  @Override
  public boolean getDocumentConfirmation(ConnectionProvider conn, String strRecordId) {
    boolean confirmation = false;
    OBContext.setAdminMode();
    try {
      FIN_FinaccTransaction transaction = OBDal.getInstance().get(FIN_FinaccTransaction.class,
          strRecordId);
      List<FIN_FinancialAccountAccounting> accounts = transaction.getAccount()
          .getFINFinancialAccountAcctList();
      FIN_Payment payment = transaction.getFinPayment();
      if (payment != null) {
        OBCriteria<FinAccPaymentMethod> obCriteria = OBDal.getInstance().createCriteria(
            FinAccPaymentMethod.class);
        obCriteria.add(Restrictions.eq(FinAccPaymentMethod.PROPERTY_ACCOUNT, payment.getAccount()));
        obCriteria.add(Restrictions.eq(FinAccPaymentMethod.PROPERTY_PAYMENTMETHOD,
            payment.getPaymentMethod()));
        obCriteria.setFilterOnReadableClients(false);
        obCriteria.setFilterOnReadableOrganization(false);
        List<FinAccPaymentMethod> lines = obCriteria.list();
        for (FIN_FinancialAccountAccounting account : accounts) {
          if (confirmation)
            return confirmation;
          if (payment.isReceipt()) {
            if (("INT").equals(lines.get(0).getUponDepositUse())
                && account.getInTransitPaymentAccountIN() != null)
              confirmation = true;
            else if (("DEP").equals(lines.get(0).getUponDepositUse())
                && account.getDepositAccount() != null)
              confirmation = true;
            else if (("CLE").equals(lines.get(0).getUponDepositUse())
                && account.getClearedPaymentAccount() != null)
              confirmation = true;
          } else {
            if (("INT").equals(lines.get(0).getUponWithdrawalUse())
                && account.getFINOutIntransitAcct() != null)
              confirmation = true;
            else if (("WIT").equals(lines.get(0).getUponWithdrawalUse())
                && account.getWithdrawalAccount() != null)
              confirmation = true;
            else if (("CLE").equals(lines.get(0).getUponWithdrawalUse())
                && account.getClearedPaymentAccountOUT() != null)
              confirmation = true;
          }
        }
      } else {
        for (FIN_FinancialAccountAccounting account : accounts) {
          if (confirmation)
            return confirmation;
          if ((TRXTYPE_BPDeposit.equals(transaction.getTransactionType()) && account
              .getDepositAccount() != null)
              || (TRXTYPE_BPWithdrawal.equals(transaction.getTransactionType()) && account
                  .getWithdrawalAccount() != null)
              || (TRXTYPE_BankFee.equals(transaction.getTransactionType()) && account
                  .getWithdrawalAccount() != null))
            confirmation = true;
        }
      }
    } catch (Exception e) {
      setStatus(STATUS_DocumentDisabled);
      return confirmation;
    } finally {
      OBContext.restorePreviousMode();
    }
    if (!confirmation)
      setStatus(STATUS_DocumentDisabled);
    return confirmation;
  }

  /*
   * Retrieves Account for deposit / Withdrawal for the given payment method + Financial Account
   */
  public Account getAccount(ConnectionProvider conn, FIN_PaymentMethod paymentMethod,
      FIN_FinancialAccount finAccount, AcctSchema as, boolean bIsReceipt) throws ServletException {
    OBContext.setAdminMode();
    Account account = null;
    try {
      OBCriteria<FIN_FinancialAccountAccounting> accounts = OBDal.getInstance().createCriteria(
          FIN_FinancialAccountAccounting.class);
      accounts.add(Restrictions.eq(FIN_FinancialAccountAccounting.PROPERTY_ACCOUNT, finAccount));
      accounts.add(Restrictions.eq(
          FIN_FinancialAccountAccounting.PROPERTY_ACCOUNTINGSCHEMA,
          OBDal.getInstance().get(
              org.openbravo.model.financialmgmt.accounting.coa.AcctSchema.class,
              as.m_C_AcctSchema_ID)));
      accounts.add(Restrictions.eq(FIN_FinancialAccountAccounting.PROPERTY_ACTIVE, true));
      accounts.setFilterOnReadableClients(false);
      accounts.setFilterOnReadableOrganization(false);
      List<FIN_FinancialAccountAccounting> accountList = accounts.list();
      if (accountList == null || accountList.size() == 0)
        return null;
      if (paymentMethod != null) {
        OBCriteria<FinAccPaymentMethod> obCriteria = OBDal.getInstance().createCriteria(
            FinAccPaymentMethod.class);
        obCriteria.add(Restrictions.eq(FinAccPaymentMethod.PROPERTY_ACCOUNT, finAccount));
        obCriteria.add(Restrictions.eq(FinAccPaymentMethod.PROPERTY_PAYMENTMETHOD, paymentMethod));
        obCriteria.setFilterOnReadableClients(false);
        obCriteria.setFilterOnReadableOrganization(false);
        List<FinAccPaymentMethod> lines = obCriteria.list();
        if (bIsReceipt) {
          account = getAccount(conn, lines.get(0).getUponDepositUse(), accountList.get(0),
              bIsReceipt);
        } else {
          account = getAccount(conn, lines.get(0).getUponWithdrawalUse(), accountList.get(0),
              bIsReceipt);
        }
      } else {
        if (bIsReceipt) {
          account = new Account(conn, accountList.get(0).getDepositAccount().getId());
        } else {
          account = new Account(conn, accountList.get(0).getWithdrawalAccount().getId());
        }
      }
    } finally {
      OBContext.restorePreviousMode();
    }
    return account;
  }

  @Override
  public void loadObjectFieldProvider(ConnectionProvider conn, String strAD_Client_ID, String Id)
      throws ServletException {
    FIN_FinaccTransaction transaction = OBDal.getInstance().get(FIN_FinaccTransaction.class, Id);

    FieldProviderFactory[] data = new FieldProviderFactory[1];
    OBContext.setAdminMode();
    try {
      data[0] = new FieldProviderFactory(null);
      FieldProviderFactory.setField(data[0], "AD_Client_ID", transaction.getClient().getId());
      FieldProviderFactory.setField(data[0], "AD_Org_ID", transaction.getOrganization().getId());
      FieldProviderFactory.setField(data[0], "FIN_Finacc_Transaction_ID", transaction.getId());
      FieldProviderFactory.setField(data[0], "DepositAmount", transaction.getDepositAmount()
          .toString());
      FieldProviderFactory.setField(data[0], "PaymentAmount", transaction.getPaymentAmount()
          .toString());
      FieldProviderFactory.setField(data[0], "description", transaction.getDescription());
      FieldProviderFactory.setField(data[0], "C_Currency_ID", transaction.getCurrency().getId());
      FieldProviderFactory.setField(data[0], "C_GLItem_ID",
          transaction.getGLItem() != null ? transaction.getGLItem().getId() : "");
      FieldProviderFactory.setField(data[0], "C_Activity_ID",
          transaction.getActivity() != null ? transaction.getActivity().getId() : "");
      FieldProviderFactory.setField(data[0], "C_Project_ID",
          transaction.getProject() != null ? transaction.getProject().getId() : "");
      FieldProviderFactory.setField(data[0], "C_Campaign_ID",
          transaction.getSalesCampaign() != null ? transaction.getSalesCampaign().getId() : "");
      FieldProviderFactory.setField(data[0], "M_Product_ID",
          transaction.getProduct() != null ? transaction.getProduct().getId() : "");
      FieldProviderFactory.setField(data[0], "C_SalesRegion_ID",
          transaction.getSalesRegion() != null ? transaction.getSalesRegion().getId() : "");
      FieldProviderFactory.setField(data[0], "lineno", transaction.getLineNo().toString());
      // This lines can be uncommented when User1 and User2 are implemented
      // FieldProviderFactory.setField(data[0], "User1_ID", transaction.getNdDimension().getId());
      // FieldProviderFactory.setField(data[0], "User2_ID", transaction.getNdDimension().getId());
      FieldProviderFactory.setField(data[0], "FIN_Payment_ID",
          transaction.getFinPayment() != null ? transaction.getFinPayment().getId() : "");
      final String cBPartnerId;
      if (transaction.getFinPayment() != null
          && transaction.getFinPayment().getBusinessPartner() != null) {
        cBPartnerId = transaction.getFinPayment().getBusinessPartner().getId();
      } else if (transaction.getBusinessPartner() != null) {
        cBPartnerId = transaction.getBusinessPartner().getId();
      } else {
        cBPartnerId = "";
      }
      FieldProviderFactory.setField(data[0], "C_BPartner_ID", cBPartnerId);
      FieldProviderFactory.setField(data[0], "UsedCredit",
          transaction.getFinPayment() != null ? transaction.getFinPayment().getUsedCredit()
              .toString() : "");
      FieldProviderFactory.setField(data[0], "GeneratedCredit",
          transaction.getFinPayment() != null ? transaction.getFinPayment().getGeneratedCredit()
              .toString() : "");
      String dateFormat = OBPropertiesProvider.getInstance().getOpenbravoProperties()
          .getProperty("dateFormat.java");
      SimpleDateFormat outputFormat = new SimpleDateFormat(dateFormat);
      FieldProviderFactory.setField(data[0], "DateAcct",
          outputFormat.format(transaction.getDateAcct()));
      FieldProviderFactory.setField(data[0], "trxdate",
          outputFormat.format(transaction.getTransactionDate()));
      FieldProviderFactory.setField(
          data[0],
          "paymentDate",
          transaction.getFinPayment() != null ? outputFormat.format(transaction.getFinPayment()
              .getPaymentDate()) : "");
      FieldProviderFactory.setField(data[0], "Posted", transaction.getPosted());
      FieldProviderFactory.setField(data[0], "Processed", transaction.isProcessed() ? "Y" : "N");
      FieldProviderFactory.setField(data[0], "Processing", transaction.isProcessNow() ? "Y" : "N");
    } finally {
      OBContext.restorePreviousMode();
    }
    setObjectFieldProvider(data);
  }

  public Account getWithdrawalAccount(AcctSchema as, FIN_PaymentMethod paymentMethod,
      FIN_FinancialAccount finAccount, ConnectionProvider conn) throws ServletException {
    return getAccountUponDepositWithdrawal(conn, paymentMethod, finAccount, as, false);
  }

  public Account getDepositAccount(AcctSchema as, FIN_PaymentMethod paymentMethod,
      FIN_FinancialAccount finAccount, ConnectionProvider conn) throws ServletException {
    return getAccountUponDepositWithdrawal(conn, paymentMethod, finAccount, as, true);
  }

  public Account getAccountUponDepositWithdrawal(ConnectionProvider conn,
      FIN_PaymentMethod paymentMethod, FIN_FinancialAccount finAccount, AcctSchema as,
      boolean bIsReceipt) throws ServletException {
    Account account = null;
    OBContext.setAdminMode();
    try {
      OBCriteria<FIN_FinancialAccountAccounting> accounts = OBDal.getInstance().createCriteria(
          FIN_FinancialAccountAccounting.class);
      accounts.add(Restrictions.eq(FIN_FinancialAccountAccounting.PROPERTY_ACCOUNT, finAccount));
      accounts.add(Restrictions.eq(
          FIN_FinancialAccountAccounting.PROPERTY_ACCOUNTINGSCHEMA,
          OBDal.getInstance().get(
              org.openbravo.model.financialmgmt.accounting.coa.AcctSchema.class,
              as.m_C_AcctSchema_ID)));
      accounts.add(Restrictions.eq(FIN_FinancialAccountAccounting.PROPERTY_ACTIVE, true));
      accounts.setFilterOnReadableClients(false);
      accounts.setFilterOnReadableOrganization(false);
      List<FIN_FinancialAccountAccounting> accountList = accounts.list();
      if (accountList == null || accountList.size() == 0)
        return null;
      if (paymentMethod != null) {
        OBCriteria<FinAccPaymentMethod> accPaymentMethod = OBDal.getInstance().createCriteria(
            FinAccPaymentMethod.class);
        accPaymentMethod.add(Restrictions.eq(FinAccPaymentMethod.PROPERTY_ACCOUNT, finAccount));
        accPaymentMethod.add(Restrictions.eq(FinAccPaymentMethod.PROPERTY_PAYMENTMETHOD,
            paymentMethod));
        accPaymentMethod.setFilterOnReadableClients(false);
        accPaymentMethod.setFilterOnReadableOrganization(false);
        List<FinAccPaymentMethod> lines = accPaymentMethod.list();
        if (bIsReceipt)
          account = getAccount(conn, lines.get(0).getUponDepositUse(), accountList.get(0),
              bIsReceipt);
        else
          account = getAccount(conn, lines.get(0).getUponWithdrawalUse(), accountList.get(0),
              bIsReceipt);
      } else {
        if (bIsReceipt)
          account = new Account(conn, accountList.get(0).getDepositAccount().getId());
        else
          account = new Account(conn, accountList.get(0).getWithdrawalAccount().getId());
      }
    } finally {
      OBContext.restorePreviousMode();
    }
    return account;
  }

  public Account getAccountPayment(ConnectionProvider conn, FIN_PaymentMethod paymentMethod,
      FIN_FinancialAccount finAccount, AcctSchema as, boolean bIsReceipt) throws ServletException {
    OBContext.setAdminMode();
    Account account = null;
    try {
      OBCriteria<FIN_FinancialAccountAccounting> accounts = OBDal.getInstance().createCriteria(
          FIN_FinancialAccountAccounting.class);
      accounts.add(Restrictions.eq(FIN_FinancialAccountAccounting.PROPERTY_ACCOUNT, finAccount));
      accounts.add(Restrictions.eq(
          FIN_FinancialAccountAccounting.PROPERTY_ACCOUNTINGSCHEMA,
          OBDal.getInstance().get(
              org.openbravo.model.financialmgmt.accounting.coa.AcctSchema.class,
              as.m_C_AcctSchema_ID)));
      accounts.add(Restrictions.eq(FIN_FinancialAccountAccounting.PROPERTY_ACTIVE, true));
      accounts.setFilterOnReadableClients(false);
      accounts.setFilterOnReadableOrganization(false);
      List<FIN_FinancialAccountAccounting> accountList = accounts.list();
      if (accountList == null || accountList.size() == 0)
        return null;
      OBCriteria<FinAccPaymentMethod> accPaymentMethod = OBDal.getInstance().createCriteria(
          FinAccPaymentMethod.class);
      accPaymentMethod.add(Restrictions.eq(FinAccPaymentMethod.PROPERTY_ACCOUNT, finAccount));
      accPaymentMethod.add(Restrictions.eq(FinAccPaymentMethod.PROPERTY_PAYMENTMETHOD,
          paymentMethod));
      accPaymentMethod.setFilterOnReadableClients(false);
      accPaymentMethod.setFilterOnReadableOrganization(false);
      List<FinAccPaymentMethod> lines = accPaymentMethod.list();
      if (bIsReceipt)
        account = getAccount(conn, lines.get(0).getUponReceiptUse(), accountList.get(0), bIsReceipt);
      else
        account = getAccount(conn, lines.get(0).getUponPaymentUse(), accountList.get(0), bIsReceipt);
    } finally {
      OBContext.restorePreviousMode();
    }
    return account;
  }

  public Account getAccountReconciliation(ConnectionProvider conn, FIN_FinancialAccount finAccount,
      AcctSchema as) throws ServletException {
    OBContext.setAdminMode();
    Account account = null;
    try {
      OBCriteria<FIN_FinancialAccountAccounting> accounts = OBDal.getInstance().createCriteria(
          FIN_FinancialAccountAccounting.class);
      accounts.add(Restrictions.eq(FIN_FinancialAccountAccounting.PROPERTY_ACCOUNT, finAccount));
      accounts.add(Restrictions.eq(
          FIN_FinancialAccountAccounting.PROPERTY_ACCOUNTINGSCHEMA,
          OBDal.getInstance().get(
              org.openbravo.model.financialmgmt.accounting.coa.AcctSchema.class,
              as.m_C_AcctSchema_ID)));
      accounts.add(Restrictions.eq(FIN_FinancialAccountAccounting.PROPERTY_ACTIVE, true));
      accounts.setFilterOnReadableClients(false);
      accounts.setFilterOnReadableOrganization(false);
      List<FIN_FinancialAccountAccounting> accountList = accounts.list();
      if (accountList == null || accountList.size() == 0)
        return null;
      account = new Account(conn, accountList.get(0).getDebitAccount().getId());
    } finally {
      OBContext.restorePreviousMode();
    }
    return account;
  }

}