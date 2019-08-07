/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal.process;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Date;
import javax.servlet.ServletException;

import org.apache.commons.lang.StringUtils;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.Session;
import org.hibernate.query.Query;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.model.common.businesspartner.BusinessPartner;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.retail.posterminal.JSONProcessSimple;
import org.openbravo.retail.posterminal.utility.CustomerStatisticsUtils;
import org.openbravo.service.json.JsonConstants;

public class CustomerStatistics extends JSONProcessSimple {

  @Override
  public JSONObject exec(JSONObject jsonsent) throws JSONException, ServletException {
    JSONObject response = new JSONObject();
    JSONObject result = new JSONObject();

    try {
      OBContext.setAdminMode(true);
      String orgId = jsonsent.getString("organization");
      String bpId = jsonsent.getString("bpId");
      String recencyMsg = null, frequencyMsg = null, monetaryValMsg = null, averageBasketMsg = null;

      // Get Timings from Org
      Organization organization = OBDal.getInstance().get(Organization.class, orgId);
      String recencyTiming = organization.getObposRecencytiming();
      String frequencyTiming = organization.getObposFrecuencytiming();
      BigDecimal frequencyTimingUnit = organization.getObposFrecuencytimingunit();
      String monetaryValueTiming = organization.getObposMonetarytiming();
      BigDecimal monetaryValueTimingUnit = organization.getObposMonetarytimingunit();
      String averageBasketTiming = organization.getObposAvgbaskettiming();
      BigDecimal averageBasketTimingUnit = organization.getObposAvgbaskettimingunit();

      // Get BPartner
      BusinessPartner bp = OBDal.getInstance().get(BusinessPartner.class, bpId);

      // Recency Calculation
      if (!StringUtils.isEmpty(recencyTiming)) {
        recencyMsg = getRecencyStatistics(recencyTiming, bp, organization);
      }

      // Frequency Calculation
      if (!StringUtils.isEmpty(frequencyTiming)) {
        frequencyMsg = getFrequencyStatistics(frequencyTiming, frequencyTimingUnit, bp,
            organization);
      }

      // Monetary Value Calculation
      if (!StringUtils.isEmpty(monetaryValueTiming)) {
        monetaryValMsg = getMonetaryValueStatistics(monetaryValueTiming, monetaryValueTimingUnit,
            bp, organization);
      }

      // Average Basket Calculation
      if (!StringUtils.isEmpty(averageBasketTiming)) {
        averageBasketMsg = getAverageBasketStatistics(averageBasketTiming, averageBasketTimingUnit,
            bp, organization);
      }

      response.put("recencyMsg", recencyMsg);
      response.put("frequencyMsg", frequencyMsg);
      response.put("monetaryValMsg", monetaryValMsg);
      response.put("averageBasketMsg", averageBasketMsg);

      result.put(JsonConstants.RESPONSE_DATA, response);
      result.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
      return result;
    } catch (Exception e) {
      e.printStackTrace();
      JSONObject jsonError = new JSONObject();
      String errorMsg = "Error while calculating statistics value : " + e.getMessage();
      jsonError.put("message", errorMsg);
      result.put(JsonConstants.RESPONSE_ERROR, jsonError);
      result.put(JsonConstants.RESPONSE_ERRORMESSAGE, errorMsg);
      result.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_FAILURE);
      return result;
    } finally {
      OBContext.restorePreviousMode();
    }

  }

  private String getTimingText(BigDecimal timingUnit, String timing) {
    String timingText = "";
    if (timingUnit.compareTo(new BigDecimal("1")) > 0) {
      if (timing.equalsIgnoreCase("H")) {
        timingText = OBMessageUtils.messageBD("OBPOS_Hours");
      } else if (timing.equalsIgnoreCase("D")) {
        timingText = OBMessageUtils.messageBD("OBPOS_Days");
      } else if (timing.equalsIgnoreCase("W")) {
        timingText = OBMessageUtils.messageBD("OBPOS_Weeks");
      } else if (timing.equalsIgnoreCase("M")) {
        timingText = OBMessageUtils.messageBD("OBPOS_Months");
      } else if (timing.equalsIgnoreCase("Y")) {
        timingText = OBMessageUtils.messageBD("OBPOS_Years");
      }
    } else {
      if (timing.equalsIgnoreCase("H")) {
        timingText = OBMessageUtils.messageBD("OBPOS_Hour");
      } else if (timing.equalsIgnoreCase("D")) {
        timingText = OBMessageUtils.messageBD("OBPOS_Day");
      } else if (timing.equalsIgnoreCase("W")) {
        timingText = OBMessageUtils.messageBD("OBPOS_Week");
      } else if (timing.equalsIgnoreCase("M")) {
        timingText = OBMessageUtils.messageBD("OBPOS_Month");
      } else if (timing.equalsIgnoreCase("Y")) {
        timingText = OBMessageUtils.messageBD("OBPOS_Year");
      }
    }
    return timingText;
  }

  private String getRecencyStatistics(String recencyTiming, BusinessPartner bp, Organization org) {
    String timingText = null, recencyMsg = null;
    BigDecimal noofRecency = BigDecimal.ZERO;

    String recencyHQLQuery = "select EXTRACT(DAY FROM (Date(now()) - coalesce(max(orderDate), now()))) "
        + " from Order where businessPartner.id=:bpartnerId and organization.id=:orgId";

    final Session recencySession = OBDal.getInstance().getSession();
    final Query<Integer> recencyQuery = recencySession.createQuery(recencyHQLQuery, Integer.class);
    recencyQuery.setParameter("bpartnerId", bp.getId());
    recencyQuery.setParameter("orgId", org.getId());
    int recency = recencyQuery.uniqueResult();
    BigDecimal recencyDays = new BigDecimal(recency);

    if (recencyDays != null) {
      if (recencyTiming.equalsIgnoreCase("H")) {
        noofRecency = recencyDays.multiply(new BigDecimal("24")).setScale(2, RoundingMode.HALF_UP);
      } else if (recencyTiming.equalsIgnoreCase("D")) {
        noofRecency = recencyDays.setScale(2, RoundingMode.HALF_UP);
      } else if (recencyTiming.equalsIgnoreCase("W")) {
        noofRecency = recencyDays.divide(new BigDecimal("7"), 2, RoundingMode.HALF_UP);
      } else if (recencyTiming.equalsIgnoreCase("M")) {
        noofRecency = recencyDays.divide(new BigDecimal("30"), 2, RoundingMode.HALF_UP);
      } else if (recencyTiming.equalsIgnoreCase("Y")) {
        noofRecency = recencyDays.divide(new BigDecimal("365"), 2, RoundingMode.HALF_UP);
      }

      timingText = getTimingText(noofRecency, recencyTiming);

      recencyMsg = String.format(OBMessageUtils.messageBD("OBPOS_Recency_Text"), noofRecency,
          timingText);
    }
    return recencyMsg;
  }

  private String getFrequencyStatistics(String frequencyTiming, BigDecimal frequencyTimingUnit,
      BusinessPartner bp, Organization org) {
    Date startDate = null;
    String timingText = null, frequencyMsg = null;

    // Get Start Date
    if (frequencyTimingUnit != null && frequencyTimingUnit.compareTo(BigDecimal.ZERO) > 0) {
      startDate = CustomerStatisticsUtils.getStartDateFromTimingUnit(frequencyTiming,
          frequencyTimingUnit);
    } else {
      startDate = bp.getCreationDate();
    }

    if (startDate != null) {
      String frequencyHQLQuery = "select count(*) as frequency from Order "
          + " where businessPartner.id=:bpartnerId and organization.id=:orgId "
          + " and orderDate>=to_date(:startDate, 'YYYY-mm-dd') " + " and orderDate < now() ";

      final Session frequencySession = OBDal.getInstance().getSession();
      final Query<Long> frequencyQuery = frequencySession.createQuery(frequencyHQLQuery,
          Long.class);
      frequencyQuery.setParameter("bpartnerId", bp.getId());
      frequencyQuery.setParameter("orgId", org.getId());
      frequencyQuery.setParameter("startDate", startDate);
      long freq = frequencyQuery.uniqueResult();
      BigDecimal frequency = new BigDecimal(freq).setScale(2, RoundingMode.HALF_UP);

      if (frequencyTimingUnit != null) {
        timingText = getTimingText(frequencyTimingUnit, frequencyTiming);

        if (frequencyTimingUnit.compareTo(new BigDecimal("1")) > 0) {
          frequencyMsg = String.format(OBMessageUtils.messageBD("OBPOS_Frequency_Text"), frequency,
              frequencyTimingUnit, timingText);
        } else {
          frequencyMsg = String.format(OBMessageUtils.messageBD("OBPOS_Frequency_Text_Unit"),
              frequency, timingText);
        }
      } else {
        frequencyMsg = String.format(OBMessageUtils.messageBD("OBPOS_Frequency_Text_NoTiming"),
            frequency);
      }
    }
    return frequencyMsg;
  }

  private String getMonetaryValueStatistics(String monetaryValueTiming,
      BigDecimal monetaryValueTimingUnit, BusinessPartner bp, Organization org) {
    Date startDate = null;
    String timingText = null, monetaryValMsg = null, currencySymbol = "";

    // Get Start Date
    startDate = null;
    if (monetaryValueTimingUnit != null && monetaryValueTimingUnit.compareTo(BigDecimal.ZERO) > 0) {
      startDate = CustomerStatisticsUtils.getStartDateFromTimingUnit(monetaryValueTiming,
          monetaryValueTimingUnit);
    } else {
      startDate = bp.getCreationDate();
    }

    // Currency
    if (org.getCurrency() != null) {
      currencySymbol = org.getCurrency().getSymbol();
    }

    if (startDate != null) {
      String monetaryValueHQLQuery = "select coalesce(sum(o.grandTotalAmount), 0) from Order o "
          + " join o.documentType as dt "
          + " where o.businessPartner.id = :bpartnerId and dt.sOSubType <> 'OB' "
          + " and o.organization.id= :orgId "
          + " and o.orderDate>=to_date(:startDate, 'YYYY-mm-dd') " + " and o.orderDate < now() ";

      final Session monetaryValueSession = OBDal.getInstance().getSession();
      final Query<BigDecimal> monetaryValueQuery = monetaryValueSession
          .createQuery(monetaryValueHQLQuery, BigDecimal.class);
      monetaryValueQuery.setParameter("bpartnerId", bp.getId());
      monetaryValueQuery.setParameter("orgId", org.getId());
      monetaryValueQuery.setParameter("startDate", startDate);
      BigDecimal monetaryValue = monetaryValueQuery.uniqueResult()
          .setScale(2, RoundingMode.HALF_UP);

      if (monetaryValueTimingUnit != null) {
        timingText = getTimingText(monetaryValueTimingUnit, monetaryValueTiming);

        if (monetaryValueTimingUnit.compareTo(new BigDecimal("1")) > 0) {
          monetaryValMsg = String.format(OBMessageUtils.messageBD("OBPOS_MonetaryText"),
              monetaryValue, currencySymbol, monetaryValueTimingUnit, timingText);
        } else {
          monetaryValMsg = String.format(OBMessageUtils.messageBD("OBPOS_MonetaryText_Unit"),
              monetaryValue, currencySymbol, timingText);
        }
      } else {
        monetaryValMsg = String.format(OBMessageUtils.messageBD("OBPOS_MonetaryText_NoTiming"),
            monetaryValue, currencySymbol);
      }
    }
    return monetaryValMsg;
  }

  private String getAverageBasketStatistics(String averageBasketTiming,
      BigDecimal averageBasketTimingUnit, BusinessPartner bp, Organization org) {
    Date startDate = null;
    String timingText = null, averageBasketMsg = null, currencySymbol = "";

    // Get Start Date
    startDate = null;
    if (averageBasketTimingUnit != null && averageBasketTimingUnit.compareTo(BigDecimal.ZERO) > 0) {
      startDate = CustomerStatisticsUtils.getStartDateFromTimingUnit(averageBasketTiming,
          averageBasketTimingUnit);
    } else {
      startDate = bp.getCreationDate();
    }

    // Currency
    if (org.getCurrency() != null) {
      currencySymbol = org.getCurrency().getSymbol();
    }

    if (startDate != null) {
      String averageBasketHQLQuery = "select coalesce(TRUNC((sum(o.grandTotalAmount)/count(o.id)),2), 0) from Order o "
          + " join o.documentType as dt "
          + " where o.businessPartner.id = :bpartnerId and dt.sOSubType <> 'OB' "
          + " and o.organization.id= :orgId and dt.return = 'N' "
          + " and o.orderDate>=to_date(:startDate, 'YYYY-mm-dd') " + " and o.orderDate < now()";

      final Session averageBasketSession = OBDal.getInstance().getSession();
      final Query<BigDecimal> averageBasketQuery = averageBasketSession
          .createQuery(averageBasketHQLQuery, BigDecimal.class);
      averageBasketQuery.setParameter("bpartnerId", bp.getId());
      averageBasketQuery.setParameter("orgId", org.getId());
      averageBasketQuery.setParameter("startDate", startDate);
      BigDecimal averageBasketValue = averageBasketQuery.uniqueResult()
          .setScale(2, RoundingMode.HALF_UP);

      if (averageBasketTimingUnit != null) {
        timingText = getTimingText(averageBasketTimingUnit, averageBasketTiming);

        if (averageBasketTimingUnit.compareTo(new BigDecimal("1")) > 0) {
          averageBasketMsg = String.format(OBMessageUtils.messageBD("OBPOS_AverageBasket"),
              averageBasketValue, currencySymbol, averageBasketTimingUnit, timingText);
        } else {
          averageBasketMsg = String.format(OBMessageUtils.messageBD("OBPOS_AverageBasket_Unit"),
              averageBasketValue, currencySymbol, timingText);
        }
      } else {
        averageBasketMsg = String.format(OBMessageUtils.messageBD("OBPOS_AverageBasket_NoTiming"),
            averageBasketValue, currencySymbol);
      }
    }
    return averageBasketMsg;
  }

}
