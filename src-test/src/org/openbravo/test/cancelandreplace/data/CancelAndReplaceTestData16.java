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
 * All portions are Copyright (C) 2019 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.test.cancelandreplace.data;

import java.math.BigDecimal;
import java.util.Arrays;

import org.openbravo.test.cancelandreplace.data.CancelAndReplaceOrderTestData.Line;

public class CancelAndReplaceTestData16 extends CancelAndReplaceTestData {

  @Override
  public void initialize() {
    setTestNumber("CANCELREPLACE016");
    setTestDescription(
        "Cancel and Multiple Replace of a fully paid Order. Increase quantity of a line. Netting shipment is not created");
    setBpartnerId(BP_CUSTOMER_A);
    setOrderPaid(true);
    setCloneOrderId(SALESORDER_50011_ID);
    setActivateNettingGoodsShipmentPref(false);
    setActivateAssociateNettingGoodsShipmentPref(false);
    setOldOrder(new CancelAndReplaceOrderTestData().with(oldOrder -> {
      oldOrder.delivered = false;
      oldOrder.totalAmount = new BigDecimal("293.70");
      oldOrder.status = "CL";
      oldOrder.paidAmount = new BigDecimal("293.70");
      oldOrder.outstandingAmount = BigDecimal.ZERO;
      oldOrder.lines = new Line[] { oldOrder.new Line().with(line -> {
        line.deliveredQty = new BigDecimal("6");
        line.shipmentLines = BigDecimal.ZERO;
      }), oldOrder.new Line().with(line -> {
        line.deliveredQty = new BigDecimal("9");
        line.shipmentLines = BigDecimal.ZERO;
      }) };
    }));

    setInverseOrder(new CancelAndReplaceOrderTestData().with(inverseOrder -> {
      inverseOrder.totalAmount = new BigDecimal("-293.70");
      inverseOrder.status = "CL";
      inverseOrder.paidAmount = new BigDecimal("-293.70");
      inverseOrder.outstandingAmount = BigDecimal.ZERO;
      inverseOrder.lines = new Line[] { inverseOrder.new Line().with(line -> {
        line.deliveredQty = new BigDecimal("-6");
        line.shipmentLines = BigDecimal.ZERO;
      }), inverseOrder.new Line().with(line -> {
        line.deliveredQty = new BigDecimal("-9");
        line.shipmentLines = BigDecimal.ZERO;
      }) };
    }));

    setNewOrders(Arrays.asList(new CancelAndReplaceOrderTestData().with(newOrder -> {
      newOrder.totalAmount = new BigDecimal("492.90");
      newOrder.status = "CO";
      newOrder.paidAmount = new BigDecimal("293.70");
      newOrder.outstandingAmount = new BigDecimal("199.20");
      newOrder.lines = new Line[] { newOrder.new Line().with(line -> {
        line.deliveredQty = BigDecimal.ZERO;
        line.shipmentLines = BigDecimal.ZERO;
        line.orderedQuantity = new BigDecimal("12");
      }) };
    }), new CancelAndReplaceOrderTestData().with(newOrder -> {
      newOrder.totalAmount = new BigDecimal("121.20");
      newOrder.status = "CO";
      newOrder.paidAmount = new BigDecimal("293.70");
      newOrder.outstandingAmount = new BigDecimal("-172.50");
      newOrder.lines = new Line[] { newOrder.new Line().with(line -> {
        line.deliveredQty = BigDecimal.ZERO;
        line.shipmentLines = BigDecimal.ZERO;
        line.orderedQuantity = new BigDecimal("18");
      }) };
    })));
  }
}
