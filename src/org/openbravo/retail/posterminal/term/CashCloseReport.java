/*
 ************************************************************************************
 * Copyright (C) 2012-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal.term;

import java.math.BigDecimal;
import java.math.RoundingMode;

import javax.servlet.ServletException;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.query.Query;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.retail.posterminal.JSONProcessSimple;
import org.openbravo.retail.posterminal.OBPOSApplications;
import org.openbravo.service.json.JsonConstants;

public class CashCloseReport extends JSONProcessSimple {

  private static final Logger log = LogManager.getLogger();

  @Override
  public JSONObject exec(JSONObject jsonsent) throws JSONException, ServletException {

    String posTerminalId = jsonsent.getString("pos");

    OBPOSApplications terminal;
    OBContext.setAdminMode(false);
    try {
      terminal = OBDal.getInstance().get(OBPOSApplications.class, posTerminalId);
    } finally {
      OBContext.restorePreviousMode();
    }
    Organization organization = terminal.getOrganization();

    JSONObject result = new JSONObject();

    // Total sales computation

    String hqlTaxes = "select olt.tax.name, sum(olt.taxAmount), sum(olt.taxableAmount)"
        + " from OrderLineTax as olt" + " where exists (select 1 "
        + "               from FIN_Payment_ScheduleDetail d"
        + "               where d.orderPaymentSchedule.order = olt.salesOrderLine.salesOrder"
        + "               and exists (select 1 "
        + "                           from FIN_Finacc_Transaction t"
        + "                           where t.reconciliation is null"
        + "                           and t.finPayment = d.paymentDetails.finPayment))"
        + " and olt.salesOrderLine.salesOrder.documentType.id=:docTypeId  and olt.salesOrderLine.salesOrder.obposApplications.id=:applicationId "
        + " group by olt.tax.name order by olt.tax.name asc";
    Query<Object[]> salesTaxesQuery = OBDal.getInstance()
        .getSession()
        .createQuery(hqlTaxes, Object[].class);
<<<<<<< local
    salesTaxesQuery.setParameter("docTypeId", organization.getObposCDoctype().getId());
=======
    salesTaxesQuery.setParameter("docTypeId",
        terminal.getObposTerminaltype().getDocumentType().getId());
>>>>>>> other
    salesTaxesQuery.setParameter("applicationId", posTerminalId);
    JSONArray salesTaxes = new JSONArray();
    BigDecimal totalSalesTax = BigDecimal.ZERO;
    for (Object[] sales : salesTaxesQuery.list()) {
      JSONObject salesTax = new JSONObject();
      salesTax.put("taxName", sales[0]);
      salesTax.put("taxAmount", sales[1]);
      salesTax.put("taxableAmount", sales[2]);
      salesTaxes.put(salesTax);
      totalSalesTax = totalSalesTax.add((BigDecimal) sales[1]);
    }

    String hqlSales = "select sum(ord.summedLineAmount) from Order as ord"
        + " where exists (select 1 from FIN_Payment_ScheduleDetail d"
        + "              where d.orderPaymentSchedule.order = ord"
        + "                 and exists (select 1 "
        + "                               from FIN_Finacc_Transaction t"
        + "                              where t.reconciliation is null"
        + "                                and t.finPayment = d.paymentDetails.finPayment))"
        + "and ord.documentType.id=:docTypeId and ord.obposApplications.id=:applicationId ";

    Query<BigDecimal> salesQuery = OBDal.getInstance()
        .getSession()
        .createQuery(hqlSales, BigDecimal.class);
    salesQuery.setParameter("docTypeId", organization.getObposCDoctype().getId());
    salesQuery.setParameter("applicationId", posTerminalId);
    BigDecimal totalNetAmount = salesQuery.uniqueResult();
    if (totalNetAmount == null) {
      totalNetAmount = BigDecimal.ZERO;
    }

    result.put("netSales", totalNetAmount);
    result.put("grossSales", totalNetAmount.add(totalSalesTax));
    result.put("salesTaxes", salesTaxes);
    // Total returns computation

    Query<Object[]> returnTaxesQuery = OBDal.getInstance()
        .getSession()
        .createQuery(hqlTaxes, Object[].class);
    returnTaxesQuery.setParameter("docTypeId", organization.getObposCDoctyperet().getId());
    returnTaxesQuery.setParameter("applicationId", posTerminalId);
    JSONArray returnTaxes = new JSONArray();
    BigDecimal totalReturnsTax = BigDecimal.ZERO;
    for (Object obj : returnTaxesQuery.list()) {
      Object[] returns = (Object[]) obj;
      JSONObject returnTax = new JSONObject();
      returnTax.put("taxName", returns[0]);
      returnTax.put("taxAmount", ((BigDecimal) returns[1]).abs());
      returnTax.put("taxableAmount", ((BigDecimal) returns[2]).abs());
      returnTaxes.put(returnTax);
      totalReturnsTax = totalReturnsTax.add(((BigDecimal) returns[1]).abs());
    }

    Query<BigDecimal> returnsQuery = OBDal.getInstance()
        .getSession()
        .createQuery(hqlSales, BigDecimal.class);
    returnsQuery.setParameter("docTypeId", organization.getObposCDoctyperet().getId());
    returnsQuery.setParameter("applicationId", posTerminalId);
    BigDecimal totalReturnsAmount = returnsQuery.uniqueResult();
    if (totalReturnsAmount == null) {
      totalReturnsAmount = BigDecimal.ZERO;
    } else {
      totalReturnsAmount = totalReturnsAmount.abs();
    }

    result.put("netReturns", totalReturnsAmount);
    result.put("grossReturns", totalReturnsAmount.add(totalReturnsTax.abs()));
    result.put("returnsTaxes", returnTaxes);

    result.put("totalRetailTransactions",
        totalNetAmount.add(totalSalesTax).subtract(totalReturnsAmount.add(totalReturnsTax.abs())));

    // Starting Cash
    JSONArray startings = new JSONArray();
    BigDecimal totalStartings = BigDecimal.ZERO;
    // Payment types
    String hqlPayments = "select p.financialAccount.id , p.financialAccount.currentBalance, p.commercialName,  obpos_currency_rate(p.financialAccount.currency, p.obposApplications.organization.currency, null, null, p.obposApplications.client.id, p.obposApplications.organization.id) as rate, p.financialAccount.currency.iSOCode as isocode from OBPOS_App_Payment as p "
        + "where obposApplications.id = :applicationId group by  p.commercialName, p.financialAccount.currency, p.financialAccount, p.financialAccount.currentBalance, p.obposApplications.organization.currency, p.obposApplications.client.id, p.obposApplications.organization.id, p.financialAccount.currency.iSOCode "
        + " order by p.commercialName";
    Query<Object[]> paymentsQuery = OBDal.getInstance()
        .getSession()
        .createQuery(hqlPayments, Object[].class);
    paymentsQuery.setParameter("applicationId", posTerminalId);
    for (Object[] objpayments : paymentsQuery.list()) {
      String hqlStartingCash = "select sum(depositAmount) , sum(paymentAmount) "
          + "from org.openbravo.model.financialmgmt.payment.FIN_FinaccTransaction as trans "
          + "where trans.account.id = :transAccountId and trans.reconciliation is null";
      Query<Object[]> startingCashQuery = OBDal.getInstance()
          .getSession()
          .createQuery(hqlStartingCash, Object[].class);
      startingCashQuery.setParameter("transAccountId", objpayments[0].toString());
      BigDecimal startingCash = BigDecimal.ZERO;
      for (Object[] objstartingCash : startingCashQuery.list()) {
        JSONObject jsonStarting = new JSONObject();
        if (objstartingCash[0] == null) {
          objstartingCash[0] = new BigDecimal(0);
        }
        if (objstartingCash[1] == null) {
          objstartingCash[1] = new BigDecimal(0);
        }
        startingCash = ((BigDecimal) objpayments[1])
            .subtract(((BigDecimal) objstartingCash[0]).subtract((BigDecimal) objstartingCash[1]));
        totalStartings = totalStartings
            .add((startingCash.multiply(new BigDecimal((String) objpayments[3]))).setScale(2,
                RoundingMode.HALF_EVEN));
        jsonStarting.put("amount", startingCash);
        jsonStarting.put("description",
            OBMessageUtils.getI18NMessage("OBPOS_LblStarting", new String[] {}) + " "
                + objpayments[2]);
        jsonStarting.put("rate", objpayments[3]);
        jsonStarting.put("isocode", objpayments[4]);
        startings.put(jsonStarting);
      }
    }
    result.put("startings", startings);
    result.put("totalStartings", totalStartings);

    // Total drops and deposits computation
    JSONArray drops = new JSONArray();
    JSONArray deposits = new JSONArray();
    BigDecimal totalDrops = BigDecimal.ZERO;
    BigDecimal totalDeposits = BigDecimal.ZERO;

    String hqlDropsDeposits = "select trans.description, trans.paymentAmount, trans.depositAmount , obpos_currency_rate(payment.financialAccount.currency, payment.obposApplications.organization.currency, null, null, payment.obposApplications.client.id, payment.obposApplications.organization.id) as rate, payment.financialAccount.currency.iSOCode as isocode "
        + "from org.openbravo.retail.posterminal.OBPOSAppPayment as payment, org.openbravo.model.financialmgmt.payment.FIN_FinaccTransaction as trans "
        + "where (trans.gLItem=payment.paymentMethod.gLItemForDrops or trans.gLItem=payment.paymentMethod.gLItemForDeposits) and trans.reconciliation is null "
        + "and payment.obposApplications=:applicationId and trans.account=payment.financialAccount order by payment.commercialName";
    Query<Object[]> dropsDepositsQuery = OBDal.getInstance()
        .getSession()
        .createQuery(hqlDropsDeposits, Object[].class);
    dropsDepositsQuery.setParameter("applicationId", posTerminalId);
    for (Object[] objdropdeposit : dropsDepositsQuery.list()) {
      JSONObject dropDeposit = new JSONObject();
      dropDeposit.put("description", objdropdeposit[0]);
      BigDecimal drop = (BigDecimal) objdropdeposit[1];
      BigDecimal deposit = (BigDecimal) objdropdeposit[2];
      if (drop.compareTo(deposit) > 0) {
        dropDeposit.put("amount", drop);
        drops.put(dropDeposit);
        totalDrops = totalDrops.add((drop.multiply(new BigDecimal((String) objdropdeposit[3])))
            .setScale(2, RoundingMode.HALF_EVEN));
      } else {
        dropDeposit.put("amount", deposit);
        deposits.put(dropDeposit);
        totalDeposits = totalDeposits
            .add((deposit.multiply(new BigDecimal((String) objdropdeposit[3]))).setScale(2,
                RoundingMode.HALF_EVEN));
      }
      dropDeposit.put("rate", objdropdeposit[3]);
      dropDeposit.put("isocode", objdropdeposit[4]);
    }

    String hqlSalesDeposits = "select obpay.commercialName, sum(trans.depositAmount), obpos_currency_rate(obpay.financialAccount.currency, obpay.obposApplications.organization.currency, null, null, obpay.obposApplications.client.id, obpay.obposApplications.organization.id) as rate, obpay.financialAccount.currency.iSOCode as isocode"
        + " from org.openbravo.model.financialmgmt.payment.FIN_FinaccTransaction as trans "
        + "inner join trans.finPayment as pay, "
        + "org.openbravo.retail.posterminal.OBPOSAppPayment as obpay "
        + "where pay.account=obpay.financialAccount and trans.gLItem is null "
        + "and trans.reconciliation is null and obpay.obposApplications.id=:applicationId "
        + "group by obpay.commercialName, obpay.financialAccount.currency, obpay.obposApplications.organization.currency, obpay.financialAccount.currency.iSOCode, obpay.obposApplications.client.id, obpay.obposApplications.organization.id "
        + " order by obpay.commercialName";

    Query<Object[]> salesDepositsQuery = OBDal.getInstance()
        .getSession()
        .createQuery(hqlSalesDeposits, Object[].class);
    salesDepositsQuery.setParameter("applicationId", posTerminalId);
    for (Object[] obja : salesDepositsQuery.list()) {
      JSONObject salesDep = new JSONObject();
      salesDep.put("description",
          OBMessageUtils.getI18NMessage("OBPOS_Sales", new String[] { (String) obja[0] }));
      salesDep.put("amount", obja[1]);
      salesDep.put("rate", obja[2]);
      salesDep.put("isocode", obja[3]);
      deposits.put(salesDep);
      totalDeposits = totalDeposits
          .add((((BigDecimal) obja[1]).multiply(new BigDecimal((String) obja[2]))).setScale(2,
              RoundingMode.HALF_EVEN));
    }

    String hqlReturnsDrop = "select obpay.commercialName, sum(trans.paymentAmount), obpos_currency_rate(obpay.financialAccount.currency, obpay.obposApplications.organization.currency, null, null, obpay.obposApplications.client.id, obpay.obposApplications.organization.id) as rate, obpay.financialAccount.currency.iSOCode as isocode"
        + " from org.openbravo.model.financialmgmt.payment.FIN_FinaccTransaction as trans "
        + "inner join trans.finPayment as pay, "
        + "org.openbravo.retail.posterminal.OBPOSAppPayment as obpay "
        + "where pay.account=obpay.financialAccount and trans.gLItem is null "
        + "and trans.reconciliation is null and obpay.obposApplications.id=:applicationId "
        + "group by obpay.commercialName, obpay.financialAccount.currency, obpay.obposApplications.organization.currency, obpay.financialAccount.currency.iSOCode, obpay.obposApplications.client.id, obpay.obposApplications.organization.id "
        + " order by obpay.commercialName";

    Query<Object[]> returnDropsQuery = OBDal.getInstance()
        .getSession()
        .createQuery(hqlReturnsDrop, Object[].class);
    returnDropsQuery.setParameter("applicationId", posTerminalId);
    for (Object[] obja : returnDropsQuery.list()) {
      JSONObject returnDrop = new JSONObject();
      returnDrop.put("description",
          OBMessageUtils.getI18NMessage("OBPOS_Returns", new String[] { (String) obja[0] }));
      returnDrop.put("amount", obja[1]);
      returnDrop.put("rate", obja[2]);
      returnDrop.put("isocode", obja[3]);
      drops.put(returnDrop);
      totalDrops = totalDrops
          .add((((BigDecimal) obja[1]).multiply(new BigDecimal((String) obja[2]))).setScale(2,
              RoundingMode.HALF_EVEN));
    }

    result.put("drops", drops);
    result.put("deposits", deposits);
    result.put("totalDrops", totalDrops);
    result.put("totalDeposits", totalDeposits);

    result.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
    JSONObject finalResult = new JSONObject();
    finalResult.put("data", new JSONArray().put(result));
    finalResult.put("status", 0);
    log.debug(result.toString());
    return finalResult;
  }

  @Override
  protected String getProperty() {
    return "OBPOS_retail.cashup";
  }
}
