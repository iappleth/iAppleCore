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
 * All portions are Copyright (C) 2014-2015 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.erpCommon.ad_callouts;

import java.math.BigDecimal;

import javax.servlet.ServletException;

import org.openbravo.advpaymentmngt.utility.FIN_Utility;
import org.openbravo.base.filter.IsIDFilter;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.financialmgmt.payment.FIN_Payment;

public class SE_Payment_Transaction extends SimpleCallout {

  private static final long serialVersionUID = 1L;

  @Override
  protected void execute(CalloutInfo info) throws ServletException {
    try {
      final String strPaymentId = info.getStringParameter("inpfinPaymentId", IsIDFilter.instance);
      final String strcGlitemId = info.getStringParameter("inpcGlitemId", IsIDFilter.instance);
      String description = info.getStringParameter("inpdescription", null);
      if ("".equals(strPaymentId) && "".equals(strcGlitemId)) {
        description = FIN_Utility.getFinAccTransactionDescription(description, "", "");
        info.addResult("inpdescription", description);
        info.addResult("inpdepositamt", BigDecimal.ZERO);
        info.addResult("inppaymentamt", BigDecimal.ZERO);
      }
      FIN_Payment payment = OBDal.getInstance().get(FIN_Payment.class, strPaymentId);
      if ((payment.isReceipt() && payment.getAmount().compareTo(BigDecimal.ZERO) > 0)
          || (!payment.isReceipt() && payment.getAmount().compareTo(BigDecimal.ZERO) < 0)) {
        info.addResult("inpdepositamt", payment.getFinancialTransactionAmount().abs());
        info.addResult("inppaymentamt", BigDecimal.ZERO);
      } else {
        info.addResult("inpdepositamt", BigDecimal.ZERO);
        info.addResult("inppaymentamt", payment.getFinancialTransactionAmount().abs());
      }
      String strWindowId = info.getStringParameter("inpwindowId", null);
      if (payment.isReceipt()) {
        info.vars.setSessionValue(strWindowId + "|IsSOTrx", "Y");
      } else {
        info.vars.setSessionValue(strWindowId + "|IsSOTrx", "N");
      }
      if (payment.getBusinessPartner() != null) {
        info.addResult("inpcBpartnerId", payment.getBusinessPartner().getId());
      }
      if (payment.getDescription() != null) {
        description = FIN_Utility.getFinAccTransactionDescription(description, "",
            payment.getDescription());
        info.addResult("inpdescription", description);
      }
    } catch (Exception e) {
      return;
    }
  }
}
