/*
 ************************************************************************************
 * Copyright (C) 2012-2015 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal.term;

import java.math.BigDecimal;

import javax.servlet.ServletException;

import org.apache.commons.codec.binary.Base64;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.Query;
import org.hibernate.Session;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.client.kernel.RequestContext;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.businessUtility.Preferences;
import org.openbravo.erpCommon.utility.PropertyException;
import org.openbravo.mobile.core.process.SimpleQueryBuilder;
import org.openbravo.retail.posterminal.OBPOSAppPayment;
import org.openbravo.service.json.DataResolvingMode;
import org.openbravo.service.json.DataToJsonConverter;
import org.openbravo.service.json.JsonConstants;

public class Payments extends JSONTerminalProperty {

  @Override
  public JSONObject exec(JSONObject jsonsent) throws JSONException, ServletException {
    JSONObject result = new JSONObject();
    OBContext.setAdminMode(true);

    try {
      JSONArray respArray = new JSONArray();
      String posId = RequestContext.get().getSessionAttribute("POSTerminal").toString();
      String hqlPayments = "select p as payment, p.paymentMethod as paymentMethod, "
          + "c_currency_rate(coalesce(c, p.paymentMethod.currency), p.obposApplications.organization.currency, null, null, p.obposApplications.client.id, p.obposApplications.organization.id) as rate, c_currency_rate(p.obposApplications.organization.currency, coalesce(c, p.paymentMethod.currency), null, null, p.obposApplications.client.id, p.obposApplications.organization.id) as mulrate, "
          + "coalesce(c.iSOCode, p.paymentMethod.currency.iSOCode) as isocode, "
          + "coalesce(c.symbol, p.paymentMethod.currency.symbol) as symbol, coalesce(c.currencySymbolAtTheRight, p.paymentMethod.currency.currencySymbolAtTheRight) as currencySymbolAtTheRight, "
          + "coalesce(f.currentBalance, 0) as currentBalance, "
          + "coalesce(c.obposPosprecision, null) as obposPosprecision, "
          + "img.bindaryData as image, img.mimetype as mimetype "
          + "from OBPOS_App_Payment as p left join p.financialAccount as f left join f.currency as c "
          + "left outer join p.paymentMethod as pm left outer join pm.image as img "
          + "where p.obposApplications.id = :posID  "
          + "and p.$readableSimpleCriteria and p.$activeCriteria "
          + "order by p.line, p.commercialName";

      SimpleQueryBuilder querybuilder = new SimpleQueryBuilder(hqlPayments, OBContext
          .getOBContext().getCurrentClient().getId(), OBContext.getOBContext()
          .getCurrentOrganization().getId(), null, null, null);

      final Session session = OBDal.getInstance().getSession();
      final Query paymentsquery = session.createQuery(querybuilder.getHQLQuery());
      paymentsquery.setString("posID", posId);

      DataToJsonConverter converter = new DataToJsonConverter();

      for (Object objLine : paymentsquery.list()) {
        Object[] objPayment = (Object[]) objLine;
        OBPOSAppPayment appPayment = (OBPOSAppPayment) objPayment[0];
        boolean preferenveValue = true;
        try {
          preferenveValue = "Y".equals(Preferences.getPreferenceValue(appPayment.getSearchKey(),
              true, OBContext.getOBContext().getCurrentClient(), OBContext.getOBContext()
                  .getCurrentOrganization(), OBContext.getOBContext().getUser(), OBContext
                  .getOBContext().getRole(), null));
        } catch (PropertyException e) {
          // There is no preference for the payment method, load them with all permission
        }

        if (preferenveValue) {
          JSONObject payment = new JSONObject();
          JSONObject pay = converter.toJsonObject(appPayment, DataResolvingMode.FULL);
          JSONObject pMethod = converter.toJsonObject((BaseOBObject) objPayment[1],
              DataResolvingMode.FULL);
          if (pay.getBoolean("overrideconfiguration")) {
            pMethod.put("cashDifferences", pay.get("cashDifferences"));
            pMethod.put("cashDifferences$_identifier", pay.get("cashDifferences$_identifier"));
            pMethod.put("glitemDropdep", pay.get("gLItemForCashDropDeposit"));
            pMethod.put("glitemDropdep$_identifier",
                pay.get("gLItemForCashDropDeposit$_identifier"));
            pMethod.put("automatemovementtoother", pay.get("automateMovementToOtherAccount"));
            pMethod.put("keepfixedamount", pay.get("keepFixedAmount"));
            pMethod.put("amount", pay.get("amount"));
            pMethod.put("allowvariableamount", pay.get("allowVariableAmount"));
            pMethod.put("allowdontmove", pay.get("allowNotToMove"));
            pMethod.put("allowmoveeverything", pay.get("allowMoveEverything"));
            pMethod.put("countcash", pay.get("countCash"));
          }
          payment.put("payment", pay);
          payment.put("paymentMethod", pMethod);

          payment.put("rate", objPayment[2]);
          BigDecimal mulrate = BigDecimal.ZERO;
          BigDecimal rate = new BigDecimal((String) objPayment[2]);
          if (rate.compareTo(BigDecimal.ZERO) != 0) {
            mulrate = BigDecimal.ONE.divide(rate, 12, 4);
          }
          payment.put("mulrate", mulrate.toPlainString());

          payment.put("isocode", objPayment[4]);
          payment.put("symbol", objPayment[5]);
          payment.put("currencySymbolAtTheRight", objPayment[6]);
          payment.put("currentBalance", objPayment[7]);
          payment.put("obposPosprecision", objPayment[8]);
          if (objPayment[9] != null && objPayment[10] != null) {
            payment.put(
                "image",
                "data:" + objPayment[10] + ";base64,"
                    + Base64.encodeBase64String((byte[]) objPayment[9]));
          } else {
            payment.put("image", objPayment[9]);
          }

          respArray.put(payment);
        }
      }

      result.put(JsonConstants.RESPONSE_DATA, respArray);
      result.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);

      return result;

    } finally {
      OBContext.restorePreviousMode();
    }
  }

  @Override
  public String getProperty() {
    return "payments";
  }

}
