/*
 ************************************************************************************
 * Copyright (C) 2012-2015 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal;

import java.math.BigDecimal;
import java.util.Date;

import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.criterion.Restrictions;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.weld.WeldUtils;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.core.TriggerHandler;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.mobile.core.process.DataSynchronizationProcess.DataSynchronization;
import org.openbravo.mobile.core.process.JSONPropertyToEntity;
import org.openbravo.mobile.core.process.PropertyByType;
import org.openbravo.model.financialmgmt.payment.FIN_Reconciliation;
import org.openbravo.service.json.JsonConstants;
import org.openbravo.service.json.JsonToDataConverter;

@DataSynchronization(entity = "OBPOS_App_Cashup")
public class ProcessCashClose extends POSDataSynchronizationProcess {

  private static final Logger log = Logger.getLogger(ProcessCashClose.class);
  JSONObject jsonResponse = new JSONObject();
  boolean isCashupProcessed = false;

  public JSONObject saveRecord(JSONObject jsonCashup) throws Exception {
    try {
      return saveRecordCashUp(jsonCashup);
    } catch (Exception e) {
      // if the json cashup has processed=Y and the cashup in the backoffice has processed=N then we
      // throw the exception, in other case, we ignore the error
      if (jsonCashup.has("isprocessed") && jsonCashup.getString("isprocessed").equals("Y")) {
        String cashUpId = jsonCashup.getString("id");
        OBPOSAppCashup cashUp = OBDal.getInstance().get(OBPOSAppCashup.class, cashUpId);
        if (cashUp == null || !isCashupProcessed) {
          throw e;
        }
      }

      JSONObject jsonData = new JSONObject();
      jsonData.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
      return jsonData;
    }
  }

  public JSONObject saveRecordCashUp(JSONObject jsonCashup) throws Exception {
    String cashUpId = jsonCashup.getString("id");
    JSONObject jsonData = new JSONObject();
    Date cashUpDate = new Date();
    try {
      if (jsonCashup.has("cashUpDate") && jsonCashup.get("cashUpDate") != null
          && StringUtils.isNotEmpty(jsonCashup.getString("cashUpDate"))) {
        String strCashUpDate = (String) jsonCashup.getString("cashUpDate");
        cashUpDate = (Date) JsonToDataConverter.convertJsonToPropertyValue(PropertyByType.DATETIME,
            ((String) strCashUpDate).subSequence(0, ((String) strCashUpDate).lastIndexOf(".")));
      } else {
        log.debug("Error processing cash close: error retrieving cashUp date. Using current date");
      }
    } catch (Exception e) {
      log.debug("Error processing cash close: error retrieving cashUp date. Using current date");
    }

    if (cashUpId != null) {
      OBPOSAppCashup cashUpInitial = OBDal.getInstance().get(OBPOSAppCashup.class, cashUpId);
      if (cashUpInitial != null && cashUpInitial.isProcessed()) {
        isCashupProcessed = true;
      }
    }

    OBPOSApplications posTerminal = OBDal.getInstance().get(OBPOSApplications.class,
        jsonCashup.getString("posterminal"));
    OBContext.setOBContext(jsonCashup.getString("userId"), OBContext.getOBContext().getRole()
        .getId(), OBContext.getOBContext().getCurrentClient().getId(), posTerminal
        .getOrganization().getId());
    OBPOSAppCashup cashUp = getCashUp(cashUpId, jsonCashup, cashUpDate);

    if (cashUp.isProcessed() && !cashUp.isProcessedbo()) {
      // check if there is a reconciliation in draft status
      for (OBPOSAppPayment payment : posTerminal.getOBPOSAppPaymentList()) {
        if (payment.getFinancialAccount() == null) {
          continue;
        }
        final OBCriteria<FIN_Reconciliation> recconciliations = OBDal.getInstance().createCriteria(
            FIN_Reconciliation.class);
        recconciliations.add(Restrictions.eq(FIN_Reconciliation.PROPERTY_DOCUMENTSTATUS, "DR"));
        recconciliations.add(Restrictions.eq(FIN_Reconciliation.PROPERTY_ACCOUNT,
            payment.getFinancialAccount()));
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
        getOrderGroupingProcessor().groupOrders(posTerminal, cashUpId, cashUpDate);

        posTerminal = OBDal.getInstance().get(OBPOSApplications.class,
            jsonCashup.getString("posterminal"));

        CashCloseProcessor processor = getCashCloseProcessor();
        JSONArray cashMgmtIds = jsonCashup.getJSONArray("cashMgmtIds");
        JSONObject result = processor.processCashClose(posTerminal, jsonCashup, cashMgmtIds,
            cashUpDate);
        // add the messages returned by processCashClose...
        jsonData.put("messages", result.opt("messages"));
        jsonData.put("next", result.opt("next"));
        jsonData.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
      } finally {
        OBDal.getInstance().flush();
        TriggerHandler.getInstance().enable();
      }
    } else {
      // This cashup is a cash order. Nothing needs to be done
      jsonData.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);

    }
    return jsonData;
  }

  protected CashCloseProcessor getCashCloseProcessor() {
    return WeldUtils.getInstanceFromStaticBeanManager(CashCloseProcessor.class);
  }

  protected OrderGroupingProcessor getOrderGroupingProcessor() {
    return WeldUtils.getInstanceFromStaticBeanManager(OrderGroupingProcessor.class);
  }

  /**
   * Get a cashup. If cashup not exist it's created, otherwise update the cashup data into database.
   * 
   * @param cashUpId
   *          The cashUp identifier
   * @param jsonCashup
   *          The input object with cashup data
   * @param cashUpDate2
   * @return Cashup object
   * @throws JSONException
   */
  private OBPOSAppCashup getCashUp(String cashUpId, JSONObject jsonCashup, Date cashUpDate)
      throws JSONException {
    OBPOSAppCashup cashUp = OBDal.getInstance().get(OBPOSAppCashup.class, cashUpId);
    if (cashUp == null) {
      // create the cashup if no exists
      try {
        OBPOSApplications posTerminal = OBDal.getInstance().get(OBPOSApplications.class,
            jsonCashup.getString("posterminal"));
        cashUp = OBProvider.getInstance().get(OBPOSAppCashup.class);
        cashUp.setId(cashUpId);
        cashUp.setOrganization(posTerminal.getOrganization());
        cashUp.setCashUpDate(cashUpDate);
        cashUp.setPOSTerminal(posTerminal);
        cashUp.setUserContact(OBContext.getOBContext().getUser());
        cashUp.setBeingprocessed(jsonCashup.getString("isbeingprocessed").equalsIgnoreCase("Y"));
        cashUp.setNewOBObject(true);
        OBDal.getInstance().save(cashUp);
      } catch (JSONException e) {
        e.printStackTrace();
      } catch (Exception e) {
        e.printStackTrace();
      }
    }
    updateOrCreateCashupInfo(cashUpId, jsonCashup);
    return cashUp;
  }

  private void updateOrCreateCashupInfo(String cashUpId, JSONObject jsonCashup)
      throws JSONException {
    OBPOSAppCashup cashup = OBDal.getInstance().get(OBPOSAppCashup.class, cashUpId);
    // Update cashup info
    updateCashUpInfo(cashup, jsonCashup);

    // Update taxes
    if (jsonCashup.has("cashTaxInfo")) {
      JSONArray taxCashupInfo = jsonCashup.getJSONArray("cashTaxInfo");
      for (int i = 0; i < taxCashupInfo.length(); ++i) {
        JSONObject tax = taxCashupInfo.getJSONObject(i);
        createTaxCashUp(cashup, tax);
      }
    }

    // Update paymentmethodcashup
    if (jsonCashup.has("cashPaymentMethodInfo")) {
      JSONArray paymentCashupInfo = jsonCashup.getJSONArray("cashPaymentMethodInfo");
      for (int i = 0; i < paymentCashupInfo.length(); ++i) {
        JSONObject payment = paymentCashupInfo.getJSONObject(i);
        // Set Amount To Keep
        if (jsonCashup.has("cashCloseInfo")) {
          // Get the paymentMethod id
          JSONArray cashCloseInfo = jsonCashup.getJSONArray("cashCloseInfo");
          for (int j = 0; j < cashCloseInfo.length(); ++j) {
            JSONObject paymentMethod = cashCloseInfo.getJSONObject(j);
            if (paymentMethod.getString("paymentTypeId").equals(
                payment.getString("paymentMethodId"))) {
              payment.put("amountToKeep",
                  paymentMethod.getJSONObject("paymentMethod").getString("amountToKeep"));
            }
          }
        }
        createPaymentMethodCashUp(cashup, payment);
      }
    }
  }

  /**
   * Update the cashup info
   * 
   * @param cashup
   * @param jsonCashup
   * @throws JSONException
   */
  private void updateCashUpInfo(OBPOSAppCashup cashup, JSONObject jsonCashup) throws JSONException {

    cashup.setNetsales(new BigDecimal(jsonCashup.getString("netSales")));
    cashup.setGrosssales(new BigDecimal(jsonCashup.getString("grossSales")));
    cashup.setNetreturns(new BigDecimal(jsonCashup.getString("netReturns")));
    cashup.setGrossreturns(new BigDecimal(jsonCashup.getString("grossReturns")));
    cashup.setTotalretailtransactions(new BigDecimal(jsonCashup
        .getString("totalRetailTransactions")));
    cashup.setProcessed(jsonCashup.getString("isprocessed").equalsIgnoreCase("Y"));
    OBDal.getInstance().save(cashup);
  }

  /**
   * Create the OBPOSPaymentMethodCashup object from json
   * 
   * @param jsonCashup
   * @return
   * @throws JSONException
   */
  private void createPaymentMethodCashUp(OBPOSAppCashup cashup, JSONObject jsonCashup)
      throws JSONException {
    OBPOSPaymentMethodCashup newPaymentMethodCashUp = OBDal.getInstance().get(
        OBPOSPaymentMethodCashup.class, jsonCashup.get("id"));

    if (newPaymentMethodCashUp == null) {
      newPaymentMethodCashUp = OBProvider.getInstance().get(OBPOSPaymentMethodCashup.class);
      newPaymentMethodCashUp.setNewOBObject(true);
      newPaymentMethodCashUp.setId(jsonCashup.get("id"));
    }
    JSONPropertyToEntity.fillBobFromJSON(newPaymentMethodCashUp.getEntity(),
        newPaymentMethodCashUp, jsonCashup);
    newPaymentMethodCashUp.setCashUp(cashup);

    newPaymentMethodCashUp.setOrganization(cashup.getOrganization());

    newPaymentMethodCashUp.setClient(cashup.getClient());

    newPaymentMethodCashUp.setSearchkey((String) jsonCashup.get("searchKey"));
    newPaymentMethodCashUp.setStartingcash(new BigDecimal(jsonCashup.getString("startingCash")));

    newPaymentMethodCashUp.setTotalsales(new BigDecimal(jsonCashup.getString("totalSales")));
    newPaymentMethodCashUp.setTotalreturns(new BigDecimal(jsonCashup.getString("totalReturns")));
    newPaymentMethodCashUp.setTotalDeposits(new BigDecimal(jsonCashup.getString("totalDeposits")));
    newPaymentMethodCashUp.setTotalDrops(new BigDecimal(jsonCashup.getString("totalDrops")));

    if (jsonCashup.has("amountToKeep")) {
      newPaymentMethodCashUp.setAmountToKeep(new BigDecimal(jsonCashup.getString("amountToKeep")));
    }
    newPaymentMethodCashUp.setRate(new BigDecimal(jsonCashup.getString("rate")));
    newPaymentMethodCashUp.setIsocode((String) jsonCashup.get("isocode"));

    OBPOSAppPayment appPayment = OBDal.getInstance().get(OBPOSAppPayment.class,
        jsonCashup.getString("paymentMethodId"));
    newPaymentMethodCashUp.setPaymentType(appPayment);

    String name = appPayment.getPaymentMethod().getName();
    newPaymentMethodCashUp.setName(name);
    OBDal.getInstance().save(newPaymentMethodCashUp);
  }

  /**
   * Create the OBPOSTaxCashup object from json
   * 
   * @param jsonCashup
   * @return
   * @throws JSONException
   */
  private void createTaxCashUp(OBPOSAppCashup cashup, JSONObject jsonCashup) throws JSONException {
    OBPOSTaxCashup newTax = OBDal.getInstance().get(OBPOSTaxCashup.class,
        jsonCashup.getString("id"));
    if (newTax == null) {
      newTax = OBProvider.getInstance().get(OBPOSTaxCashup.class);
      newTax.setNewOBObject(true);
      newTax.setId(jsonCashup.get("id"));
    }
    JSONPropertyToEntity.fillBobFromJSON(newTax.getEntity(), newTax, jsonCashup);

    newTax.setCashup(cashup);
    newTax.setName((String) jsonCashup.get("name"));
    newTax.setAmount(new BigDecimal(jsonCashup.getString("amount")));
    newTax.setOrdertype((String) jsonCashup.get("orderType"));
    newTax.setOrganization(cashup.getOrganization());
    newTax.setClient(cashup.getClient());
    OBDal.getInstance().save(newTax);
  }

  // We do not have to check if the role has access because now, we update cashup with every order.
  @Override
  protected boolean bypassPreferenceCheck() {
    return true;
  }

  // The check of duplicates ids is done in this class
  @Override
  protected boolean additionalCheckForDuplicates(JSONObject record) {
    return false;
  }

  @Override
  protected void additionalProcessForRecordsSavedInErrorsWindow(JSONObject record) {
    try {
      String cashUpId = record.getString("id");
      OBPOSAppCashup cashUp = OBDal.getInstance().get(OBPOSAppCashup.class, cashUpId);
      if (cashUp != null
          && (record.has("isprocessed") && record.getString("isprocessed").equals("Y"))) {
        cashUp.setProcessed(Boolean.TRUE);
        OBDal.getInstance().save(cashUp);
      }
    } catch (Exception e) {
    }
  }
}
