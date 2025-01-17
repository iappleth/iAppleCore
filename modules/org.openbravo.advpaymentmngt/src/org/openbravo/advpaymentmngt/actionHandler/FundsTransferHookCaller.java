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
 * All portions are Copyright (C) 2016-2024 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.advpaymentmngt.actionHandler;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import javax.enterprise.inject.Any;
import javax.enterprise.inject.Instance;
import javax.inject.Inject;

import org.openbravo.advpaymentmngt.FundsTransferPostProcessHook;
import org.openbravo.model.financialmgmt.payment.FIN_FinaccTransaction;

public class FundsTransferHookCaller {

  @Inject
  @Any
  private Instance<FundsTransferPostProcessHook> hooks;

  public void executeHook(List<FIN_FinaccTransaction> transactions) throws Exception {
    executeHooks(transactions);
  }

  private void executeHooks(List<FIN_FinaccTransaction> transactions) throws Exception {
    List<FundsTransferPostProcessHook> unsortedHooks = new ArrayList<FundsTransferPostProcessHook>();
    for (final FundsTransferPostProcessHook fundTransferHook : hooks) {
      unsortedHooks.add(fundTransferHook);
    }

    // Less priority means that it is executed before
    List<FundsTransferPostProcessHook> sortedHooks = unsortedHooks.stream()
        .sorted(Comparator.comparing(FundsTransferPostProcessHook::getPriority))
        .collect(Collectors.toList());

    for (final FundsTransferPostProcessHook fundTransferHook : sortedHooks) {
      fundTransferHook.exec(transactions);
    }
  }
}
