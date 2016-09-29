/*
 ************************************************************************************
 * Copyright (C) 2013 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

package org.openbravo.retail.posterminal;

import java.util.ArrayList;
import java.util.List;

import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.mobile.core.model.HQLProperty;
import org.openbravo.mobile.core.model.ModelExtension;

@Qualifier(PaidReceipts.paidReceiptsPaymentsPropertyExtension)
public class PaidReceiptsPaymentsProperties extends ModelExtension {

  @Override
  public List<HQLProperty> getHQLProperties(Object params) {
    ArrayList<HQLProperty> list = new ArrayList<HQLProperty>() {
      private static final long serialVersionUID = 1L;
      {
        add(new HQLProperty("scheduleDetail.amount", "amount"));
        add(new HQLProperty("finPayment.account.id", "account"));
        add(new HQLProperty("finPayment.paymentDate", "paymentDate"));
        add(new HQLProperty("finPayment.id", "paymentId"));
        add(new HQLProperty("finPayment.amount", "paymentAmount"));
        add(new HQLProperty("finPayment.obposPaymentdata", "paymentData"));
        add(new HQLProperty("reversedPayment.id", "reversedPaymentId"));
        add(new HQLProperty(
            "(select f.id from FIN_Payment as f where f.reversedPayment.id = finPayment.id)",
            "reversalPayment"));
      }
    };

    return list;
  }
}
