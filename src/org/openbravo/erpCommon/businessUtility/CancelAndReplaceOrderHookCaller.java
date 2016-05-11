/*
 ************************************************************************************
 * Copyright (C) 2016 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.erpCommon.businessUtility;

import java.util.Iterator;

import javax.enterprise.inject.Any;
import javax.enterprise.inject.Instance;
import javax.inject.Inject;

import org.openbravo.model.common.order.Order;

public class CancelAndReplaceOrderHookCaller {
  @Inject
  @Any
  private Instance<CancelAndReplaceOrderHook> cancelAndReplaceOrderHookProcesses;

  public void executeHook(boolean triggersDisabled, Order oldOrder, Order newOrder)
      throws Exception {
    executeHooks(triggersDisabled, oldOrder, newOrder);
  }

  protected void executeHooks(boolean triggersDisabled, Order oldOrder, Order newOrder)
      throws Exception {
    for (Iterator<CancelAndReplaceOrderHook> processIterator = cancelAndReplaceOrderHookProcesses
        .iterator(); processIterator.hasNext();) {
      CancelAndReplaceOrderHook process = processIterator.next();
      process.exec(triggersDisabled, oldOrder, newOrder);
    }
  }
}
