/*
 ************************************************************************************
 * Copyright (C) 2012-2015 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal;

import org.codehaus.jettison.json.JSONException;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;

public class InitialValidations {

  public static void validateTerminal(OBPOSApplications posTerminal) throws JSONException {

    if (posTerminal == null || null == POSUtils.getTerminal(posTerminal.getSearchKey())) {
      throw new JSONException("OBPOS_TerminalNotFound");
    }

    // Make sure the store is associated with a PriceList.
    if (POSUtils.getPriceListByTerminal(posTerminal.getSearchKey()) == null) {
      throw new JSONException("OBPOS_errorLoadingPriceList");
    }

    // Make sure the store is associated with an Assortment.
    if (POSUtils.getProductListByOrgId(posTerminal.getOrganization().getId()) == null) {
      throw new JSONException("OBPOS_errorLoadingProductList");
    }

    if (POSUtils.getWarehouseForTerminal(posTerminal) == null) {
      throw new JSONException("OBPOS_WarehouseNotConfigured");
    }

    // Make sure the currency has conversion rate.
    if (!POSUtils.hasCurrencyRate(posTerminal.getId())) {
      throw new JSONException("OBPOS_ConversionRateNotConfigured");
    }

    if (posTerminal.getOrganization().getCurrency() == null) {
      throw new JSONException("OBPOS_OrgCurrencyConfigured");
    }

    if (posTerminal.getOrganization().getOrganizationInformationList().get(0).getLocationAddress() == null) {
      throw new JSONException("OBPOS_OrgLocationConfigured");
    }

    if (!posTerminal.getOrganization().getId()
        .equals(OBContext.getOBContext().getCurrentOrganization().getId())) {
      throw new JSONException("OBPOS_OrgDesynchronization");
    }

    String whereclausePM = " as e where e.obposApplications=:terminal and e.financialAccount is not null "
        + "and not exists (select 1 from FinancialMgmtFinAccPaymentMethod as pmacc where "
        + "pmacc.paymentMethod = e.paymentMethod.paymentMethod and pmacc.account = e.financialAccount"
        + ")";
    OBQuery<OBPOSAppPayment> queryFinAccounts = OBDal.getInstance().createQuery(
        OBPOSAppPayment.class, whereclausePM);
    queryFinAccounts.setNamedParameter("terminal", posTerminal);
    if (queryFinAccounts.list().size() > 0) {
      throw new JSONException("OBPOS_PayMethodNotConfiguredInAccount");
    }

    String whereclauseCMEV = " as e where e.obposApplications=:terminal and e.financialAccount is not null and exists "
        + "(select 1 from OBRETCO_CashManagementEvents as cmev where "
        + "cmev.financialAccount = e.financialAccount)";
    OBQuery<OBPOSAppPayment> queryEventAccounts = OBDal.getInstance().createQuery(
        OBPOSAppPayment.class, whereclauseCMEV);
    queryEventAccounts.setNamedParameter("terminal", posTerminal);
    if (queryEventAccounts.list().size() > 0) {
      throw new JSONException("OBPOS_CMEVAccountIsUsedInPayMethod");
    }

    String whereclauseLAC = " as e where e.obposApplications=:terminal and ((e.financialAccount is null "
        + "and e.paymentMethod.leaveascredit = false) or (e.financialAccount is not null and e.paymentMethod.leaveascredit = true))";
    OBQuery<OBPOSAppPayment> queryLeaveAsCredit = OBDal.getInstance().createQuery(
        OBPOSAppPayment.class, whereclauseLAC);
    queryLeaveAsCredit.setNamedParameter("terminal", posTerminal);
    if (queryLeaveAsCredit.list().size() > 0) {
      throw new JSONException("OBPOS_LeaveAsCreditNotConfigured");
    }
  }
}
