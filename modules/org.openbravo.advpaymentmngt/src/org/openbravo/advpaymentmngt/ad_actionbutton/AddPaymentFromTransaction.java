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
 * All portions are Copyright (C) 2010-2011 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s): Enterprise Intelligence Systems (http://www.eintel.com.au).
 *************************************************************************
 */
package org.openbravo.advpaymentmngt.ad_actionbutton;

import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.criterion.Restrictions;
import org.openbravo.advpaymentmngt.dao.AdvPaymentMngtDao;
import org.openbravo.advpaymentmngt.process.FIN_AddPayment;
import org.openbravo.advpaymentmngt.utility.FIN_Utility;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.filter.IsIDFilter;
import org.openbravo.base.filter.RequestFilter;
import org.openbravo.base.filter.ValueListFilter;
import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.data.FieldProvider;
import org.openbravo.erpCommon.utility.ComboTableData;
import org.openbravo.erpCommon.utility.DateTimeData;
import org.openbravo.erpCommon.utility.FieldProviderFactory;
import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.common.businesspartner.BusinessPartner;
import org.openbravo.model.common.currency.ConversionRate;
import org.openbravo.model.common.currency.Currency;
import org.openbravo.model.common.enterprise.DocumentType;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.financialmgmt.payment.FIN_BankStatementLine;
import org.openbravo.model.financialmgmt.payment.FIN_FinancialAccount;
import org.openbravo.model.financialmgmt.payment.FIN_Payment;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentMethod;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentScheduleDetail;
import org.openbravo.model.financialmgmt.payment.FinAccPaymentMethod;
import org.openbravo.service.db.CallStoredProcedure;
import org.openbravo.xmlEngine.XmlDocument;

public class AddPaymentFromTransaction extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;
  private AdvPaymentMngtDao dao;

  public void doPost(HttpServletRequest request, HttpServletResponse response)
      throws ServletException, IOException {
    VariablesSecureApp vars = new VariablesSecureApp(request);
    int conversionRatePrecision = FIN_Utility.getConversionRatePrecision(vars);

    if (vars.commandIn("DEFAULT")) {
      final RequestFilter docTypeFilter = new ValueListFilter("RCIN", "PDOUT");
      final boolean isReceipt = vars.getRequiredStringParameter("inpDocumentType", docTypeFilter)
          .equals("RCIN");
      final String strFinancialAccountId = vars.getRequiredStringParameter(
          "inpFinFinancialAccountId", IsIDFilter.instance);
      String strFinBankStatementLineId = vars.getStringParameter("inpFinBankStatementLineId", "",
          IsIDFilter.instance);
      String strCurrencyId = vars.getRequestGlobalVariable("inpCurrencyId", "");
      String strTransactionDate = vars.getStringParameter("inpMainDate", "");

      printPage(response, vars, strFinancialAccountId, isReceipt, strFinBankStatementLineId,
          strTransactionDate, strCurrencyId, conversionRatePrecision);

    } else if (vars.commandIn("GRIDLIST")) {
      final String strBusinessPartnerId = vars.getRequestGlobalVariable("inpcBpartnerId", "");
      final String strFinancialAccountId = vars.getRequiredStringParameter("inpFinancialAccountId",
          IsIDFilter.instance);
      final String strDueDateFrom = vars.getStringParameter("inpDueDateFrom", "");
      final String strDueDateTo = vars.getStringParameter("inpDueDateTo", "");
      final String strTransDateFrom = vars.getStringParameter("inpTransDateFrom", "");
      final String strTransDateTo = vars.getStringParameter("inpTransDateTo", "");
      final String strDocumentType = vars.getStringParameter("inpDocumentType", "");
      final String strCurrencyId = vars.getRequestGlobalVariable("inpCurrencyId", "");
      final String strDocumentNo = vars.getStringParameter("inpDocumentNo", "");
      final String strSelectedPaymentDetails = vars.getInStringParameter(
          "inpScheduledPaymentDetailId", IsIDFilter.instance);
      boolean isReceipt = vars.getRequiredStringParameter("isReceipt").equals("Y");

      printGrid(response, vars, strFinancialAccountId, strBusinessPartnerId, strDueDateFrom,
          strDueDateTo, strTransDateFrom, strTransDateTo, strDocumentType, strDocumentNo,
          strSelectedPaymentDetails, isReceipt, strCurrencyId);

    } else if (vars.commandIn("PAYMENTMETHODCOMBO")) {
      final String strBusinessPartnerId = vars.getRequestGlobalVariable("inpcBpartnerId", "");
      final String strFinancialAccountId = vars.getRequiredStringParameter("inpFinancialAccountId",
          IsIDFilter.instance);
      boolean isReceipt = "Y".equals(vars.getRequiredStringParameter("isReceipt"));
      refreshPaymentMethod(response, strBusinessPartnerId, strFinancialAccountId, isReceipt);

    } else if (vars.commandIn("LOADCREDIT")) {
      final String strBusinessPartnerId = vars.getRequiredStringParameter("inpcBpartnerId");
      final boolean isReceipt = "Y".equals(vars.getRequiredStringParameter("isReceipt"));
      String customerCredit = dao.getCustomerCredit(
          OBDal.getInstance().get(BusinessPartner.class, strBusinessPartnerId), isReceipt)
          .toString();
      response.setContentType("text/html; charset=UTF-8");
      response.setHeader("Cache-Control", "no-cache");
      PrintWriter out = response.getWriter();
      out.println(customerCredit);
      out.close();

    } else if (vars.commandIn("EXCHANGERATE")) {
      final String strCurrencyId = vars.getRequestGlobalVariable("inpCurrencyId", "");
      final String strFinancialAccountCurrencyId = vars.getRequestGlobalVariable(
          "inpFinancialAccountCurrencyId", "");
      final String strPaymentDate = vars.getRequestGlobalVariable("inpPaymentDate", "");
      final String strFinancialAccountId = vars.getRequiredStringParameter("inpFinancialAccountId");
      FIN_FinancialAccount fa = OBDal.getInstance().get(FIN_FinancialAccount.class,
          strFinancialAccountId);
      refreshExchangeRate(response, strCurrencyId, strFinancialAccountCurrencyId, strPaymentDate,
          fa.getOrganization(), conversionRatePrecision);
    } else if (vars.commandIn("SAVE") || vars.commandIn("SAVEANDPROCESS")) {
      boolean isReceipt = vars.getRequiredStringParameter("isReceipt").equals("Y");
      String strAction = null;
      if (vars.commandIn("SAVEANDPROCESS")) {
        // The default option is process
        strAction = (isReceipt ? "PRP" : "PPP");
      } else {
        strAction = vars.getRequiredStringParameter("inpActionDocument");
      }
      String strPaymentDocumentNo = vars.getRequiredStringParameter("inpDocNumber");
      String strReceivedFromId = vars.getStringParameter("inpcBpartnerId");
      String strPaymentMethodId = vars.getRequiredStringParameter("inpPaymentMethod");
      String strFinancialAccountId = vars.getRequiredStringParameter("inpFinancialAccountId");
      String strPaymentAmount = vars.getRequiredNumericParameter("inpActualPayment");
      String strPaymentDate = vars.getRequiredStringParameter("inpPaymentDate");
      String strSelectedScheduledPaymentDetailIds = vars.getInParameter(
          "inpScheduledPaymentDetailId", IsIDFilter.instance);
      if (strSelectedScheduledPaymentDetailIds == null) {
        strSelectedScheduledPaymentDetailIds = "";
      }
      String strDifferenceAction = vars.getStringParameter("inpDifferenceAction", "");
      BigDecimal refundAmount = BigDecimal.ZERO;
      if (strDifferenceAction.equals("refund"))
        refundAmount = new BigDecimal(vars.getRequiredNumericParameter("inpDifference"));
      String strReferenceNo = vars.getStringParameter("inpReferenceNo", "");
      String paymentCurrencyId = vars.getRequiredStringParameter("inpCurrencyId");
      BigDecimal exchangeRate = new BigDecimal(vars.getRequiredNumericParameter("inpExchangeRate",
          "1.0"));
      BigDecimal convertedAmount = new BigDecimal(vars.getRequiredNumericParameter(
          "inpActualConverted", strPaymentAmount));
      OBError message = null;
      // FIXME: added to access the FIN_PaymentSchedule and FIN_PaymentScheduleDetail tables to be
      // removed when new security implementation is done
      OBContext.setAdminMode();
      try {

        List<FIN_PaymentScheduleDetail> selectedPaymentDetails = FIN_Utility.getOBObjectList(
            FIN_PaymentScheduleDetail.class, strSelectedScheduledPaymentDetailIds);
        HashMap<String, BigDecimal> selectedPaymentDetailAmounts = FIN_AddPayment
            .getSelectedPaymentDetailsAndAmount(vars, selectedPaymentDetails);

        // When creating a payment for orders/invoices of different business partners (factoring)
        // the business partner must be empty
        BusinessPartner paymentBusinessPartner = null;
        if (selectedPaymentDetails.size() == 0 && !"".equals(strReceivedFromId)) {
          paymentBusinessPartner = OBDal.getInstance()
              .get(BusinessPartner.class, strReceivedFromId);
        } else {
          paymentBusinessPartner = getMultiBPartner(selectedPaymentDetails);
        }

        final List<Object> parameters = new ArrayList<Object>();
        parameters.add(vars.getClient());
        parameters.add(dao.getObject(FIN_FinancialAccount.class, strFinancialAccountId)
            .getOrganization().getId());
        parameters.add((isReceipt ? "ARR" : "APP"));
        // parameters.add(null);
        String strDocTypeId = (String) CallStoredProcedure.getInstance().call("AD_GET_DOCTYPE",
            parameters, null);

        if (strPaymentDocumentNo.startsWith("<")) {
          // get DocumentNo
          strPaymentDocumentNo = Utility.getDocumentNo(this, vars, "AddPaymentFromTransaction",
              "FIN_Payment", strDocTypeId, strDocTypeId, false, true);
        }

        FIN_Payment payment = FIN_AddPayment.savePayment(null, isReceipt, dao.getObject(
            DocumentType.class, strDocTypeId), strPaymentDocumentNo, paymentBusinessPartner, dao
            .getObject(FIN_PaymentMethod.class, strPaymentMethodId), dao.getObject(
            FIN_FinancialAccount.class, strFinancialAccountId), strPaymentAmount, FIN_Utility
            .getDate(strPaymentDate), dao.getObject(FIN_FinancialAccount.class,
            strFinancialAccountId).getOrganization(), strReferenceNo, selectedPaymentDetails,
            selectedPaymentDetailAmounts, strDifferenceAction.equals("writeoff"),
            strDifferenceAction.equals("refund"), dao.getObject(Currency.class, paymentCurrencyId),
            exchangeRate, convertedAmount);

        if (strAction.equals("PRP") || strAction.equals("PPP") || strAction.equals("PRD")
            || strAction.equals("PPW")) {
          message = FIN_AddPayment.processPayment(vars, this, (strAction.equals("PRP") || strAction
              .equals("PPP")) ? "P" : "D", payment);
          if (message != null && "Error".equals(message.getType())) {
            throw new OBException();
          }
          // PPW: process made payment and withdrawal
          // PRD: process made payment and deposit
          if ((strAction.equals("PRD") || strAction.equals("PPW"))
              && !"Error".equals(message.getType())) {
            vars.setSessionValue("AddPaymentFromTransaction|closeAutomatically", "Y");
            vars.setSessionValue("AddPaymentFromTransaction|PaymentId", payment.getId());
          }
          if (strDifferenceAction.equals("refund")) {
            Boolean newPayment = !payment.getFINPaymentDetailList().isEmpty();
            FIN_Payment refundPayment = FIN_AddPayment.createRefundPayment(this, vars, payment,
                refundAmount.negate());
            OBError auxMessage = FIN_AddPayment.processPayment(vars, this,
                (strAction.equals("PRP") || strAction.equals("PPP")) ? "P" : "D", refundPayment);
            if (newPayment) {
              final String strNewRefundPaymentMessage = Utility.parseTranslation(this, vars, vars
                  .getLanguage(), "@APRM_RefundPayment@" + ": " + refundPayment.getDocumentNo())
                  + ".";
              message.setMessage(strNewRefundPaymentMessage + " " + message.getMessage());
              if (payment.getGeneratedCredit().compareTo(BigDecimal.ZERO) != 0) {
                payment
                    .setDescription(payment.getDescription() + strNewRefundPaymentMessage + "\n");
                OBDal.getInstance().save(payment);
                OBDal.getInstance().flush();
              }
            } else {
              message = auxMessage;
            }
          }
        }

      } catch (Exception ex) {
        String strMessage = FIN_Utility.getExceptionMessage(ex);
        if (message != null && "Error".equals(message.getType())) {
          strMessage = message.getMessage();
        }
        bdErrorGeneralPopUp(request, response, "Error", strMessage);
        OBDal.getInstance().rollbackAndClose();
        return;
      } finally {
        OBContext.restorePreviousMode();
      }

      log4j.debug("Output: PopUp Response");
      final XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
          "org/openbravo/base/secureApp/PopUp_Close_Refresh").createXmlDocument();
      xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
      response.setContentType("text/html; charset=UTF-8");
      final PrintWriter out = response.getWriter();
      out.println(xmlDocument.print());
      out.close();

      // "../org.openbravo.advpaymentmngt.ad_actionbutton/AddTransaction.html");
    }

  }

  private void printPage(HttpServletResponse response, VariablesSecureApp vars,
      String strFinancialAccountId, boolean isReceipt, String strFinBankStatementLineId,
      String strTransactionDate, String strCurrencyId, int conversionRatePrecision)
      throws IOException, ServletException {
    log4j.debug("Output: Add Payment button pressed on Add Transaction popup.");
    dao = new AdvPaymentMngtDao();
    String defaultPaymentMethod = "";

    final FIN_FinancialAccount financialAccount = dao.getObject(FIN_FinancialAccount.class,
        strFinancialAccountId);

    XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/advpaymentmngt/ad_actionbutton/AddPaymentFromTransaction")
        .createXmlDocument();

    if (!strFinBankStatementLineId.isEmpty()) {
      FIN_BankStatementLine bsline = dao.getObject(FIN_BankStatementLine.class,
          strFinBankStatementLineId);
      xmlDocument.setParameter("actualPayment", (isReceipt) ? bsline.getCramount().subtract(
          bsline.getDramount()).toString() : bsline.getDramount().subtract(bsline.getCramount())
          .toString());
      if (bsline.getBusinessPartner() == null) {
        OBCriteria<BusinessPartner> obcBP = OBDal.getInstance().createCriteria(
            BusinessPartner.class);
        obcBP.add(Restrictions.eq(BusinessPartner.PROPERTY_NAME, bsline.getBpartnername()));
        if (obcBP.list() != null && obcBP.list().size() > 0) {
          xmlDocument.setParameter("businessPartner", obcBP.list().get(0).getId());
          defaultPaymentMethod = (obcBP.list().get(0).getPaymentMethod() != null) ? obcBP.list()
              .get(0).getPaymentMethod().getId() : "";
        }
      } else {
        xmlDocument.setParameter("businessPartner", bsline.getBusinessPartner().getId());
      }
    }
    // Take payment date from the add transaction popup
    xmlDocument.setParameter("paymentDate", strTransactionDate.isEmpty() ? DateTimeData.today(this)
        : strTransactionDate);

    if (isReceipt)
      xmlDocument.setParameter("title", Utility.messageBD(this, "APRM_AddPaymentIn", vars
          .getLanguage()));
    else
      xmlDocument.setParameter("title", Utility.messageBD(this, "APRM_AddPaymentOut", vars
          .getLanguage()));
    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("theme", vars.getTheme());
    xmlDocument.setParameter("isReceipt", (isReceipt) ? "Y" : "N");
    xmlDocument.setParameter("isSoTrx", (isReceipt) ? "Y" : "N");
    xmlDocument.setParameter("finBankStatementLineId", strFinBankStatementLineId);
    xmlDocument.setParameter("orgId", financialAccount.getOrganization().getId());
    xmlDocument.setParameter("inheritedActualPayment", strFinBankStatementLineId.isEmpty() ? "N"
        : "Y");

    // get DocumentNo
    final List<Object> parameters = new ArrayList<Object>();
    parameters.add(vars.getClient());
    parameters.add(financialAccount.getOrganization().getId());
    parameters.add((isReceipt ? "ARR" : "APP"));
    // parameters.add(null);
    String strDocTypeId = (String) CallStoredProcedure.getInstance().call("AD_GET_DOCTYPE",
        parameters, null);
    String strDocNo = Utility.getDocumentNo(this, vars, "AddPaymentFromTransaction", "FIN_Payment",
        strDocTypeId, strDocTypeId, false, false);
    xmlDocument.setParameter("documentNumber", "<" + strDocNo + ">");
    xmlDocument.setParameter("documentType", dao.getObject(DocumentType.class, strDocTypeId)
        .getName());

    Currency paymentCurrency;
    if (strCurrencyId == null || strCurrencyId.isEmpty()) {
      paymentCurrency = financialAccount.getCurrency();
    } else {
      paymentCurrency = dao.getObject(Currency.class, strCurrencyId);
    }

    xmlDocument.setParameter("currencyId", paymentCurrency.getId());
    try {
      ComboTableData comboTableData = new ComboTableData(vars, this, "TABLEDIR", "C_Currency_ID",
          "", "",
          Utility.getContext(this, vars, "#AccessibleOrgTree", "AddPaymentFromTransaction"),
          Utility.getContext(this, vars, "#User_Client", "AddPaymentFromTransaction"), 0);
      Utility.fillSQLParameters(this, vars, null, comboTableData, "AddPaymentFromTransaction",
          strCurrencyId);
      xmlDocument.setData("reportCurrencyId", "liststructure", comboTableData.select(false));
    } catch (Exception ex) {
      throw new ServletException(ex);
    }

    xmlDocument.setParameter("financialAccountId", strFinancialAccountId);
    xmlDocument.setParameter("financialAccount", financialAccount.getIdentifier());

    final Currency financialAccountCurrency = dao
        .getFinancialAccountCurrency(strFinancialAccountId);
    if (financialAccountCurrency != null) {
      xmlDocument.setParameter("financialAccountCurrencyId", financialAccountCurrency.getId());
      xmlDocument.setParameter("financialAccountCurrencyPrecision", financialAccountCurrency
          .getStandardPrecision().toString());
    }

    String exchangeRate = "1.0";
    if (financialAccountCurrency != null && !financialAccountCurrency.equals(paymentCurrency)) {
      exchangeRate = findExchangeRate(paymentCurrency, financialAccountCurrency, new Date(),
          financialAccount.getOrganization(), conversionRatePrecision);
    }
    xmlDocument.setParameter("exchangeRate", exchangeRate);

    // Payment Method combobox
    String paymentMethodComboHtml = FIN_Utility.getPaymentMethodList(defaultPaymentMethod,
        strFinancialAccountId, financialAccount.getOrganization().getId(), true, true, isReceipt);
    xmlDocument.setParameter("sectionDetailPaymentMethod", paymentMethodComboHtml);

    final List<FinAccPaymentMethod> paymentMethods = financialAccount
        .getFinancialMgmtFinAccPaymentMethodList();
    JSONObject json = new JSONObject();
    try {
      for (FinAccPaymentMethod method : paymentMethods) {
        if (isReceipt) {
          json.put(method.getPaymentMethod().getId(), method.isPayinIsMulticurrency());
        } else {
          json.put(method.getPaymentMethod().getId(), method.isPayoutIsMulticurrency());
        }
      }
    } catch (JSONException e) {
      log4j.error("JSON object error" + json.toString());
    }
    StringBuilder sb = new StringBuilder();
    sb.append("<script language='JavaScript' type='text/javascript'>");
    sb.append("var paymentMethodMulticurrency = ");
    sb.append(json.toString());
    sb.append(";");
    sb.append("</script>");
    xmlDocument.setParameter("sectionDetailPaymentMethodMulticurrency", sb.toString());

    xmlDocument.setParameter("dateDisplayFormat", vars.getSessionValue("#AD_SqlDateFormat"));

    // Action Regarding Document
    xmlDocument.setParameter("ActionDocument", (isReceipt ? "PRD" : "PPW"));
    try {
      ComboTableData comboTableData = new ComboTableData(vars, this, "LIST", "",
          (isReceipt ? "F903F726B41A49D3860243101CEEBA25" : "F15C13A199A748F1B0B00E985A64C036"),
          "", Utility.getContext(this, vars, "#AccessibleOrgTree", "AddPaymentFromTransaction"),
          Utility.getContext(this, vars, "#User_Client", "AddPaymentFromTransaction"), 0);
      Utility.fillSQLParameters(this, vars, null, comboTableData, "AddPaymentFromTransaction", "");

      xmlDocument.setData("reportActionDocument", "liststructure", comboTableData.select(false));
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
      String strFinancialAccountId, String strBusinessPartnerId, String strDueDateFrom,
      String strDueDateTo, String strTransDateFrom, String strTransDateTo, String strDocumentType,
      String strDocumentNo, String strSelectedPaymentDetails, boolean isReceipt,
      String strCurrencyId) throws IOException, ServletException {

    log4j.debug("Output: Grid with pending payments");

    dao = new AdvPaymentMngtDao();
    FIN_FinancialAccount financialAccount = dao.getObject(FIN_FinancialAccount.class,
        strFinancialAccountId);

    XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/advpaymentmngt/ad_actionbutton/AddPaymentFromTransactionGrid")
        .createXmlDocument();

    // Pending Payments from invoice
    final List<FIN_PaymentScheduleDetail> invoiceScheduledPaymentDetails = new ArrayList<FIN_PaymentScheduleDetail>();
    // selected scheduled payments list
    final List<FIN_PaymentScheduleDetail> selectedScheduledPaymentDetails = FIN_AddPayment
        .getSelectedPaymentDetails(invoiceScheduledPaymentDetails, strSelectedPaymentDetails);

    List<FIN_PaymentScheduleDetail> filteredScheduledPaymentDetails = new ArrayList<FIN_PaymentScheduleDetail>();

    // If business partner and document number are empty search for all filtered scheduled payments
    // list
    if (!"".equals(strBusinessPartnerId) || !"".equals(strDocumentNo)) {
      Currency paymentCurrency;
      if (strCurrencyId == null || strCurrencyId.isEmpty()) {
        paymentCurrency = financialAccount.getCurrency();
      } else {
        paymentCurrency = dao.getObject(Currency.class, strCurrencyId);
      }

      filteredScheduledPaymentDetails = dao.getFilteredScheduledPaymentDetails(financialAccount
          .getOrganization(), dao.getObject(BusinessPartner.class, strBusinessPartnerId),
          paymentCurrency, FIN_Utility.getDate(strDueDateFrom), FIN_Utility.getDate(DateTimeData
              .nDaysAfter(this, strDueDateTo, "1")), FIN_Utility.getDate(strTransDateFrom),
          FIN_Utility.getDate(DateTimeData.nDaysAfter(this, strTransDateTo, "1")), strDocumentType,
          strDocumentNo, null, selectedScheduledPaymentDetails, isReceipt);
    }
    final FieldProvider[] data = FIN_AddPayment.getShownScheduledPaymentDetails(vars,
        selectedScheduledPaymentDetails, filteredScheduledPaymentDetails, false, null);
    xmlDocument.setData("structure", (data == null) ? set() : data);

    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  private void refreshPaymentMethod(HttpServletResponse response, String strBusinessPartnerId,
      String strFinancialAccountId, boolean isReceipt) throws IOException, ServletException {
    log4j.debug("Callout: Business Partner has changed to" + strBusinessPartnerId);

    String paymentMethodComboHtml = "";
    FIN_FinancialAccount account = OBDal.getInstance().get(FIN_FinancialAccount.class,
        strFinancialAccountId);
    BusinessPartner bp = OBDal.getInstance().get(BusinessPartner.class, strBusinessPartnerId);
    paymentMethodComboHtml = FIN_Utility.getPaymentMethodList(
        (bp != null && bp.getPaymentMethod() != null) ? bp.getPaymentMethod().getId() : null,
        strFinancialAccountId, account.getOrganization().getId(), true, true, isReceipt);

    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(paymentMethodComboHtml.replaceAll("\"", "\\'"));
    out.close();
  }

  /**
   * Returns the business partner (if is the same for all the elements in the list) or null in other
   * case.
   * 
   * @param paymentScheduleDetailList
   *          List of payment schedule details.
   * @return Business Partner if the payment schedule details belong to the same business partner.
   *         Null if the list of payment schedule details are associated to more than one business
   *         partner.
   * 
   */
  private BusinessPartner getMultiBPartner(List<FIN_PaymentScheduleDetail> paymentScheduleDetailList) {
    String previousBPId = null;
    String currentBPId = null;
    for (FIN_PaymentScheduleDetail psd : paymentScheduleDetailList) {
      if (psd.getInvoicePaymentSchedule() != null) { // Invoice
        currentBPId = psd.getInvoicePaymentSchedule().getInvoice().getBusinessPartner().getId();
        if (!currentBPId.equals(previousBPId) && previousBPId != null) {
          return null;
        } else {
          previousBPId = currentBPId;
        }
      }
      if (psd.getOrderPaymentSchedule() != null) { // Order
        currentBPId = psd.getOrderPaymentSchedule().getOrder().getBusinessPartner().getId();
        if (!currentBPId.equals(previousBPId) && previousBPId != null) {
          return null;
        } else {
          previousBPId = currentBPId;
        }
      }
    }
    return currentBPId != null ? OBDal.getInstance().get(BusinessPartner.class, currentBPId) : null;
  }

  private void refreshExchangeRate(HttpServletResponse response, String strCurrencyId,
      String strFinancialAccountCurrencyId, String strPaymentDate, Organization organization,
      int conversionRatePrecision) throws IOException, ServletException {

    dao = new AdvPaymentMngtDao();

    final Currency financialAccountCurrency = dao.getObject(Currency.class,
        strFinancialAccountCurrencyId);
    final Currency paymentCurrency = dao.getObject(Currency.class, strCurrencyId);

    String exchangeRate = findExchangeRate(paymentCurrency, financialAccountCurrency, FIN_Utility
        .getDate(strPaymentDate), organization, conversionRatePrecision);

    JSONObject msg = new JSONObject();
    try {
      msg.put("exchangeRate", exchangeRate);
    } catch (JSONException e) {
      log4j.error("JSON object error" + msg.toString());
    }
    response.setContentType("application/json; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(msg.toString());
    out.close();
  }

  private String findExchangeRate(Currency paymentCurrency, Currency financialAccountCurrency,
      Date paymentDate, Organization organization, int conversionRatePrecision) {
    String exchangeRate = "1.0";
    if (!financialAccountCurrency.equals(paymentCurrency)) {
      final ConversionRate conversionRate = FIN_Utility.getConversionRate(paymentCurrency,
          financialAccountCurrency, paymentDate, organization);
      if (conversionRate == null) {
        exchangeRate = "";
      } else {
        exchangeRate = conversionRate.getMultipleRateBy().setScale(conversionRatePrecision,
            RoundingMode.HALF_UP).toPlainString();
      }
    }
    return exchangeRate;
  }

  private FieldProvider[] set() throws ServletException {
    HashMap<String, String> empty = new HashMap<String, String>();
    empty.put("finScheduledPaymentId", "");
    empty.put("salesOrderNr", "");
    empty.put("salesInvoiceNr", "");
    empty.put("dueDate", "");
    empty.put("invoicedAmount", "");
    empty.put("expectedAmount", "");
    empty.put("paymentAmount", "");
    ArrayList<HashMap<String, String>> result = new ArrayList<HashMap<String, String>>();
    result.add(empty);
    return FieldProviderFactory.getFieldProviderArray(result);
  }

  public String getServletInfo() {
    return "Servlet that presents the payment proposal";
    // end of getServletInfo() method
  }

}
