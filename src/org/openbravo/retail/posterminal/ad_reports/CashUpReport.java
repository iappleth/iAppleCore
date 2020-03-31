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
 * All portions are Copyright (C) 2013-2020 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.retail.posterminal.ad_reports;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;

import javax.enterprise.inject.Any;
import javax.enterprise.inject.Instance;
import javax.inject.Inject;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.hibernate.query.Query;
import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.data.FieldProvider;
import org.openbravo.erpCommon.businessUtility.Preferences;
import org.openbravo.erpCommon.utility.FieldProviderFactory;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.erpCommon.utility.PropertyException;
import org.openbravo.retail.posterminal.OBPOSAppCashup;
import org.openbravo.retail.posterminal.OBPOSAppPayment;
import org.openbravo.retail.posterminal.OBPOSPaymentMethodCashup;
import org.openbravo.retail.posterminal.OBPOSPaymentcashupEvents;

import net.sf.jasperreports.engine.JRDataSource;
import net.sf.jasperreports.engine.data.ListOfArrayDataSource;

public class CashUpReport extends HttpSecureAppServlet {
  @Inject
  @Any
  private Instance<CashupReportHook> cashupReportHooks;

  private static final long serialVersionUID = 1L;

  public static final Logger log = LogManager.getLogger();

  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response)
      throws IOException, ServletException {
    FieldProvider[] data;
    VariablesSecureApp vars;
    HashMap<String, String> psData;
    String cashupId;
    String processId;
    String outputType;

    OBPOSAppCashup cashup;
    BigDecimal cashToDeposit;
    BigDecimal conversionRate;
    String isoCode;
    BigDecimal totalDrops;
    BigDecimal totalDeposits;
    BigDecimal expected;

    List<HashMap<String, String>> hashMapList;
    List<HashMap<String, String>> hashMapStartingsList;
    List<HashMap<String, String>> hashMapSalesList;
    List<HashMap<String, String>> hashMapWithdrawalsList;
    List<HashMap<String, String>> hashMapCountedList;
    List<HashMap<String, String>> hashMapExpectedList;
    List<HashMap<String, String>> hashMapDifferenceList;
    List<HashMap<String, String>> hashMapCashToKeepList;
    List<HashMap<String, String>> hashMapCashToDepositList;
    final HashMap<String, Object> parameters = new HashMap<String, Object>();
    cashToDeposit = BigDecimal.ZERO;
    conversionRate = BigDecimal.ONE;
    isoCode = new String();
    totalDrops = BigDecimal.ZERO;
    totalDeposits = BigDecimal.ZERO;

    hashMapList = new ArrayList<HashMap<String, String>>();
    hashMapStartingsList = new ArrayList<HashMap<String, String>>();
    hashMapSalesList = new ArrayList<HashMap<String, String>>();
    hashMapWithdrawalsList = new ArrayList<HashMap<String, String>>();
    hashMapCountedList = new ArrayList<HashMap<String, String>>();
    hashMapExpectedList = new ArrayList<HashMap<String, String>>();
    hashMapDifferenceList = new ArrayList<HashMap<String, String>>();
    hashMapCashToKeepList = new ArrayList<HashMap<String, String>>();
    hashMapCashToDepositList = new ArrayList<HashMap<String, String>>();

    vars = new VariablesSecureApp(request);
    cashupId = vars.getStringParameter("inpobposAppCashupId");
    processId = vars.getStringParameter("inpProcessId");
    if (processId.equals("7AB6243FC4764B85996E5B61DBCF7884")) {
      outputType = "xls";
    } else {
      outputType = "pdf";
    }

    OBContext.setAdminMode(false);
    try {
      cashup = OBDal.getReadOnlyInstance().get(OBPOSAppCashup.class, cashupId);
      final boolean isMaster = cashup.getPOSTerminal().isMaster();
      final boolean isSlave = cashup.getPOSTerminal().getMasterterminal() != null;
      // Check for slave
      if (isSlave) {
        // Check if master cashup is closed
        if (cashup.getObposParentCashup() == null
            || !cashup.getObposParentCashup().isProcessedbo()) {
          throw new ServletException(
              OBMessageUtils.messageBD("OBPOS_ErrCashupReportMasterNotFinish"));
        }
        // Check if all payment are shared
        final List<OBPOSAppPayment> paymentMethodList = cashup.getPOSTerminal()
            .getOBPOSAppPaymentList();
        boolean allShared = true;
        for (final OBPOSAppPayment payment : paymentMethodList) {
          if (!payment.getPaymentMethod().isShared()) {
            allShared = false;
            break;
          }
        }
        if (allShared) {
          throw new ServletException(OBMessageUtils.messageBD("OBPOS_ErrCashupReportSeeMaster"));
        }
      }
      List<OBPOSPaymentMethodCashup> paymentMethodCashupList = cashup
          .getOBPOSPaymentmethodcashupList();
      // Check for slave terminal and CashUp with all share payment
      if (isSlave && paymentMethodCashupList.size() == 0) {
        throw new ServletException(OBMessageUtils.messageBD("OBPOS_ErrCashupReportSeeMaster"));
      }

      Collections.sort(paymentMethodCashupList, new PaymentMethodComparator());
      for (int i = 0; i < paymentMethodCashupList.size(); i++) {
        OBPOSPaymentMethodCashup paymentMethodCashup = paymentMethodCashupList.get(i);
        if ((isMaster || (!isMaster && !isSlave)
            || !paymentMethodCashup.getPaymentType().getPaymentMethod().isShared())
            && paymentMethodCashup.getPaymentType().getPaymentMethod().isCountpaymentincashup()) {
          conversionRate = paymentMethodCashup.getRate() == null ? BigDecimal.ONE
              : paymentMethodCashup.getRate();
          isoCode = paymentMethodCashup.getIsocode();
          expected = BigDecimal.ZERO;
          String label = getPaymentNameLabel(
              paymentMethodCashup.getPaymentType().getCommercialName(), isMaster,
              paymentMethodCashup.getPaymentType().getPaymentMethod().isShared());

          /*******************************
           * STARTING CASH
           ***************************************************************/
          final BigDecimal startingbalance = paymentMethodCashup.getStartingcash();
          expected = expected
              .add(startingbalance.multiply(conversionRate).setScale(2, RoundingMode.HALF_UP));

          psData = fillReportRow("STARTING", paymentMethodCashup.getPaymentType().getSearchKey(),
              "OBPOS_LblStarting", label,
              startingbalance.multiply(conversionRate).setScale(2, RoundingMode.HALF_UP).toString(),
              startingbalance.toString(), "OBPOS_LblSTARTING", "OBPOS_LblTotalStarting",
              conversionRate, isoCode);
          hashMapStartingsList.add(psData);

          /*******************************
           * DROPS DEPOSIT
           ***************************************************************/
          final BigDecimal drop = paymentMethodCashup.getTotalreturns()
              .multiply(conversionRate)
              .setScale(2, RoundingMode.HALF_UP);
          final BigDecimal deposit = paymentMethodCashup.getTotalsales()
              .multiply(conversionRate)
              .setScale(2, RoundingMode.HALF_UP);

          // Withdrawals
          expected = expected.subtract(drop);
          totalDrops = totalDrops.add(drop);
          psData = fillReportRow("WITHDRAWAL", paymentMethodCashup.getPaymentType().getSearchKey(),
              null, label, drop.toString(), paymentMethodCashup.getTotalreturns().toString(),
              "OBPOS_LblWITHDRAWAL", "OBPOS_LblTotalWithdrawals", conversionRate, isoCode);
          hashMapWithdrawalsList.add(psData);

          // Deposits
          totalDeposits = totalDeposits.add(deposit);
          expected = expected.add(deposit);
          psData = fillReportRow("SALE", paymentMethodCashup.getPaymentType().getSearchKey(), null,
              label, deposit.toString(), paymentMethodCashup.getTotalsales().toString(),
              "OBPOS_LblDEPOSIT", "OBPOS_LblTotalDeposits", conversionRate, isoCode);
          hashMapSalesList.add(psData);

          List<OBPOSPaymentcashupEvents> paymentcashupEventsList = paymentMethodCashup
              .getOBPOSPaymentcashupEventsList();
          for (OBPOSPaymentcashupEvents paymentcashupEvent : paymentcashupEventsList) {
            BigDecimal amount = paymentcashupEvent.getAmount()
                .multiply(paymentcashupEvent.getRate())
                .setScale(2, RoundingMode.HALF_UP);
            if (paymentcashupEvent.getType().equals("drop")) {
              expected = expected.subtract(amount);
              totalDrops = totalDrops.add(amount);
              psData = fillReportRow("WITHDRAWAL",
                  paymentMethodCashup.getPaymentType().getSearchKey(), null,
                  paymentcashupEvent.getName(), amount.toString(),
                  paymentcashupEvent.getAmount().toString(), "OBPOS_LblWithdrawal",
                  "OBPOS_LblTotalWithdrawals", conversionRate, isoCode);
              hashMapWithdrawalsList.add(psData);
            } else {
              expected = expected.add(amount);
              totalDeposits = totalDeposits.add(amount);
              psData = fillReportRow("SALE", paymentMethodCashup.getPaymentType().getSearchKey(),
                  null, paymentcashupEvent.getName(), amount.toString(),
                  paymentcashupEvent.getAmount().toString(), "OBPOS_LblDeposit",
                  "OBPOS_LblTotalDeposits", conversionRate, isoCode);
              hashMapSalesList.add(psData);
            }
          }

          /*******************************
           * EXPECTED, COUNTED, DIFFERENCE
           ***************************************************************/
          // -- EXPECTED --
          psData = fillReportRow("EXPECTED", paymentMethodCashup.getPaymentType().getSearchKey(),
              "OBPOS_LblExpected", label, expected.toString(),
              expected.divide(conversionRate, 5, RoundingMode.HALF_UP)
                  .setScale(2, RoundingMode.HALF_UP)
                  .toString(),
              "OBPOS_LblEXPECTED", "OBPOS_LblTotalExpected", conversionRate, isoCode);
          hashMapExpectedList.add(psData);

          // -- COUNTED --
          psData = fillReportRow("COUNTED", paymentMethodCashup.getPaymentType().getSearchKey(),
              "OBPOS_LblCounted", label,
              paymentMethodCashup.getTotalCounted()
                  .multiply(conversionRate)
                  .setScale(2, RoundingMode.HALF_UP)
                  .toString(),
              paymentMethodCashup.getTotalCounted().toString(), "OBPOS_LblCOUNTED",
              "OBPOS_LblTotalCounted", conversionRate, isoCode);
          hashMapCountedList.add(psData);

          // -- DIFFERENCE --
          psData = fillReportRow("DIFFERENCE", paymentMethodCashup.getPaymentType().getSearchKey(),
              "OBPOS_LblDifference", label,
              paymentMethodCashup.getTotalCounted()
                  .multiply(conversionRate)
                  .setScale(2, RoundingMode.HALF_UP)
                  .subtract(expected)
                  .toString(),
              paymentMethodCashup.getTotalCounted()
                  .subtract(expected.divide(conversionRate, 5, RoundingMode.HALF_UP))
                  .toString(),
              "OBPOS_LblDIFFERENCE", "OBPOS_LblTotalDifference", conversionRate, isoCode);
          hashMapDifferenceList.add(psData);

          /*******************************
           * CASH TO KEEP,CASH TO DEPOSIT
           ***************************************************************/
          // -- TODEPOSIT --
          cashToDeposit = paymentMethodCashup.getTotalCounted()
              .subtract(paymentMethodCashup.getAmountToKeep());
          psData = fillReportRow("TODEPOSIT", paymentMethodCashup.getPaymentType().getSearchKey(),
              null, label,
              cashToDeposit.multiply(conversionRate).setScale(2, RoundingMode.HALF_UP).toString(),
              cashToDeposit.toString(), "OBPOS_LblTotal_To_Deposit", "OBPOS_LblTotalQtyToDepo",
              conversionRate, isoCode);
          hashMapCashToDepositList.add(psData);

          // -- TOKEEP --
          psData = fillReportRow("TOKEEP", paymentMethodCashup.getPaymentType().getSearchKey(),
              null, label,
              paymentMethodCashup.getAmountToKeep()
                  .multiply(conversionRate)
                  .setScale(2, RoundingMode.HALF_UP)
                  .toString(),
              paymentMethodCashup.getAmountToKeep().toString(), "OBPOS_LblTotal_To_Keep",
              "OBPOS_LblTotalQtyToKeep", conversionRate, isoCode);
          hashMapCashToKeepList.add(psData);

        }
      }

      /*******************************
       * SALES AREA
       ***************************************************************/
      final String hqlCashup = "SELECT netsales, grosssales, netreturns, grossreturns, totalretailtransactions " //
          + " FROM OBPOS_App_Cashup WHERE id = :cashupId ";
      final Query<Object[]> cashupQuery = OBDal.getReadOnlyInstance()
          .getSession()
          .createQuery(hqlCashup, Object[].class);
      cashupQuery.setParameter("cashupId", cashupId);

      final Object[] arrayOfCashupResults = cashupQuery.list().get(0);
      final BigDecimal totalNetSalesAmount = (BigDecimal) arrayOfCashupResults[0];
      final BigDecimal totalGrossSalesAmount = (BigDecimal) arrayOfCashupResults[1];
      final BigDecimal totalNetReturnsAmount = (BigDecimal) arrayOfCashupResults[2];
      final BigDecimal totalGrossReturnsAmount = (BigDecimal) arrayOfCashupResults[3];
      final BigDecimal totalRetailTransactions = (BigDecimal) arrayOfCashupResults[4];

      // SALES TAXES
      final Query<Object[]> salesTaxesQuery = OBDal.getReadOnlyInstance()
          .getSession()
          .createQuery(
              "SELECT name, STR(ABS(amount)) FROM OBPOS_Taxcashup "
                  + " WHERE obpos_app_cashup_id = :cashupId AND ordertype='0' ORDER BY name ",
              Object[].class);
      salesTaxesQuery.setParameter("cashupId", cashupId);
      final JRDataSource salesTaxesDataSource = new ListOfArrayDataSource(salesTaxesQuery.list(),
          new String[] { "LABEL", "VALUE" });

      // RETURNS TAXES
      final Query<Object[]> returnsTaxesQuery = OBDal.getReadOnlyInstance()
          .getSession()
          .createQuery(
              "SELECT name, STR(ABS(amount)) FROM OBPOS_Taxcashup "
                  + " WHERE obpos_app_cashup_id = :cashupId AND ordertype='1' ORDER BY name ",
              Object[].class);
      returnsTaxesQuery.setParameter("cashupId", cashupId);
      final JRDataSource returnTaxesDatasource = new ListOfArrayDataSource(returnsTaxesQuery.list(),
          new String[] { "LABEL", "VALUE" });

      /*******************************
       * BUILD REPORT
       ***************************************************************/

      parameters.put("STORE", OBMessageUtils.getI18NMessage("OBPOS_LblStore", new String[] {})
          + ": " + cashup.getPOSTerminal().getOrganization().getIdentifier());
      parameters.put("TERMINAL", OBMessageUtils.getI18NMessage("OBPOS_LblTerminal", new String[] {})
          + ": " + cashup.getPOSTerminal().getIdentifier());
      parameters.put("USER", OBMessageUtils.getI18NMessage("OBPOS_LblUser", new String[] {}) + ": "
          + cashup.getUserContact().getName());
      parameters.put("TERMINAL_ORGANIZATION", cashup.getPOSTerminal().getOrganization().getId());
      parameters.put("TIME", OBMessageUtils.getI18NMessage("OBPOS_LblTime", new String[] {}) + ": "
          + cashup.getCashUpDate().toString().substring(0, 16));
      parameters.put("NET_SALES_LABEL",
          OBMessageUtils.getI18NMessage("OBPOS_LblNetSales", new String[] {}));
      parameters.put("NET_SALES_VALUE", totalNetSalesAmount.toString());
      parameters.put("SALES_TAXES", salesTaxesDataSource);
      parameters.put("GROSS_SALES_LABEL",
          OBMessageUtils.getI18NMessage("OBPOS_LblGrossSales", new String[] {}));
      parameters.put("GROSS_SALES_VALUE", totalGrossSalesAmount.toString());
      parameters.put("NET_RETURNS_LABEL",
          OBMessageUtils.getI18NMessage("OBPOS_LblNetReturns", new String[] {}));
      parameters.put("NET_RETURNS_VALUE", totalNetReturnsAmount.toString());
      parameters.put("RETURNS_TAXES", returnTaxesDatasource);
      parameters.put("GROSS_RETURNS_LABEL",
          OBMessageUtils.getI18NMessage("OBPOS_LblGrossReturns", new String[] {}));
      parameters.put("GROSS_RETURNS_VALUE", totalGrossReturnsAmount.toString());
      parameters.put("TOTAL_RETAIL_TRANS_LABEL",
          OBMessageUtils.getI18NMessage("OBPOS_LblTotalRetailTrans", new String[] {}));
      parameters.put("TOTAL_RETAIL_TRANS_VALUE", totalRetailTransactions.toString());
      parameters.put("TOTAL_DROPS", totalDrops.toString());
      parameters.put("TOTAL_DEPOSITS", totalDeposits.toString());

    } finally {
      OBContext.restorePreviousMode();
    }

    final String strReportName = "@basedesign@/org/openbravo/retail/posterminal/ad_reports/CashUpReport.jrxml";
    response.setContentType("text/html; charset=UTF-8");
    hashMapList.addAll(hashMapStartingsList);
    hashMapList.addAll(hashMapWithdrawalsList);
    hashMapList.addAll(hashMapSalesList);
    hashMapList.addAll(hashMapExpectedList);
    hashMapList.addAll(hashMapCountedList);
    hashMapList.addAll(hashMapDifferenceList);
    hashMapList.addAll(hashMapCashToKeepList);
    hashMapList.addAll(hashMapCashToDepositList);

    // Hook for processing cashups..
    final JSONArray messages = new JSONArray(); // all messages returned by hooks
    String next = null; // the first next action of all hooks wins
    for (final CashupReportHook hook : cashupReportHooks) {
      CashupReportHookResult result;
      try {
        result = hook.exec(cashup, hashMapList, parameters);

        if (result != null) {
          if (result.getMessage() != null && !result.getMessage().equals("")) {
            messages.put(result.getMessage());
          }
          if (next == null && result.getNextAction() != null
              && !result.getNextAction().equals("")) {
            next = result.getNextAction();
          }
        }
      } catch (final Exception e) {
        log.error("Error in executing hooks", e);
      }
    }

    try {
      boolean removeUnusedPayment = "Y"
          .equals(Preferences.getPreferenceValue("OBPOS_retail.cashupRemoveUnusedPayment", true,
              OBContext.getOBContext().getCurrentClient(),
              OBContext.getOBContext().getCurrentOrganization(), OBContext.getOBContext().getUser(),
              OBContext.getOBContext().getRole(), null));
      if (removeUnusedPayment) {
        HashMap<String, String> usedPaymentMethod = new HashMap<String, String>();
        addUsedPayments(usedPaymentMethod, hashMapList);
        clearUnusedPayments(usedPaymentMethod, hashMapList);
      }
    } catch (PropertyException e1) {
      log.error(
          "Error getting OBPOS_retail.cashupRemoveUnusedPayment preference: " + e1.getMessage(),
          e1);
    }

    data = FieldProviderFactory.getFieldProviderArray(hashMapList);
    renderJR(vars, response, strReportName, outputType, parameters, data, null);

  }

  private void clearUnusedPayments(HashMap<String, String> usedPaymentMethod,
      List<HashMap<String, String>> list) {
    int i = 0;
    while (i < list.size()) {
      HashMap<String, String> item = list.get(i);
      String searchKey = item.get("SEARCHKEY");
      String value = item.get("VALUE");
      String prefix = item.get("GROUPFIELD");
      if (searchKey != null && value != null) {
        searchKey = searchKey.substring(prefix.length() + 1);
        if (!usedPaymentMethod.containsKey(searchKey)) {
          list.remove(item);
        } else {
          i++;
        }
      } else {
        i++;
      }
    }
  }

  private void addUsedPayments(HashMap<String, String> usedPaymentMethod,
      List<HashMap<String, String>> list) {
    for (int i = 0; i < list.size(); i++) {
      HashMap<String, String> item = list.get(i);
      String searchKey = item.get("SEARCHKEY");
      String value = item.get("VALUE");
      String prefix = item.get("GROUPFIELD");
      if (searchKey != null && value != null
          && new BigDecimal(value).compareTo(BigDecimal.ZERO) != 0) {
        searchKey = searchKey.substring(prefix.length() + 1);
        usedPaymentMethod.put(searchKey, "Used");
      }
    }
  }

  private HashMap<String, String> fillReportRow(String groupField, String searchKey,
      String i18nLabel, String label, String value, String foreignValue, String headingLabel,
      String totalLabel, BigDecimal conversionRate, String isoCode) {
    HashMap<String, String> result = new HashMap<String, String>();
    result.put("GROUPFIELD", groupField);
    result.put("SEARCHKEY", groupField + "_" + searchKey);
    result.put("LABEL",
        (i18nLabel != null ? OBMessageUtils.getI18NMessage(i18nLabel, new String[] {}) + " " : "")
            + label);
    result.put("VALUE", value);
    if (conversionRate.compareTo(BigDecimal.ONE) != 0) {
      result.put("FOREIGN_VALUE", foreignValue);
      result.put("ISOCODE", isoCode);
    } else {
      result.put("FOREIGN_VALUE", null);
      result.put("ISOCODE", null);
    }
    result.put("HEADING_LABEL", OBMessageUtils.getI18NMessage(headingLabel, new String[] {}));
    result.put("TOTAL_LABEL", OBMessageUtils.getI18NMessage(totalLabel, new String[] {}));
    return result;
  }

  private String getPaymentNameLabel(String name, boolean isMaster, boolean isShared) {
    String label = name;
    if (isMaster && isShared) {
      label += " " + OBMessageUtils.getI18NMessage("OBPOS_LblPaymentMethodShared", new String[] {});
    }
    return label;
  }

  private class PaymentMethodComparator implements Comparator<OBPOSPaymentMethodCashup> {
    @Override
    public int compare(OBPOSPaymentMethodCashup object1, OBPOSPaymentMethodCashup object2) {
      return object1.getName().compareTo(object2.getName());
    }
  }

}
