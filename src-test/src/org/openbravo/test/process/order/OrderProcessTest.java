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

package org.openbravo.test.process.order;

import static org.hamcrest.Matchers.comparesEqualTo;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertThat;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.Parameterized;
import org.junit.runners.Parameterized.Parameters;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.common.order.Order;
import org.openbravo.model.common.order.OrderLine;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentSchedule;
import org.openbravo.model.financialmgmt.tax.TaxRate;
import org.openbravo.model.pricing.pricelist.PriceList;
import org.openbravo.service.db.CallStoredProcedure;
import org.openbravo.test.base.OBBaseTest;

/**
 * Tests cases to check c_order_post1 executions
 * 
 * 
 */
@RunWith(Parameterized.class)
public class OrderProcessTest extends OBBaseTest {
  private static final Logger log = LogManager.getLogger();

  // Sales Order: 50012
  private static final String SALESORDER_ID = "8B53B7E6CF3B4D8D9BCF3A49EED6FCB4";
  // PriceList: Price Including Taxes Sales
  private static final String PRICEINCLUDINGTAXES_PRICELIST_SALES = "62C67BFD306C4BEF9F2738C27353380B";
  // Exempt 10%
  private static final String LINE_TAX = "BA7059430C0A43A9B86A21C4EECF3A21";

  private static final String ORDER_COMPLETE_PROCEDURE_NAME = "c_order_post1";

  private String testNumber;
  private String testDescription;
  private String documentStatus;
  private String documentAction;

  public OrderProcessTest(String testNumber, String testDescription, String documentStatus,
      String documentAction) {
    this.testNumber = testNumber;
    this.testDescription = testDescription;
    this.documentStatus = documentStatus;
    this.documentAction = documentAction;
  }

  /** parameterized possible combinations for taxes computation */
  @Parameters(name = "idx:{0} name:{1}")
  public static Collection<Object[]> params() {
    Object[][] params = new Object[][] {
        { "01", "Check Order in Not Confirmed can be Closed", "NC", "CL" }, //
        { "02", "Check Order in Not Confirmed can be Booked", "NC", "CO" }, //
        { "03", "Check Order in Not Confirmed can be updated to Automatic Evaluation", "NC", "AE" }, //
        { "04", "Check Order in Automatic Evaluation can be Closed", "AE", "CL" }, //
        { "05", "Check Order in Automatic Evaluation can be Not Confirmed", "AE", "NC" }, //
        { "06", "Check Order in Automatic Evaluation updated to Manual Evaluation", "AE", "ME" },
        { "07", "Check Order in Manual Evaluation can be Closed", "ME", "CL" }, //
        { "08", "Check Order in Manual Evaluation can be Booked", "ME", "CO" }, //
        { "09", "Check Order in Manual Evaluation can be updated to Automatic Evaluation", "ME",
            "AE" }, //
    };
    return Arrays.asList(params);
  }

  @Test
  public void testCOrderPostProcess() {
    setQAAdminContext();
    Order testOrder = createOrder();
    processOrder(testOrder);
    assertOrder(testOrder);
  }

  private Order createOrder() {
    Order order = OBDal.getInstance().get(Order.class, SALESORDER_ID);
    Order testOrder = (Order) DalUtil.copy(order, false);
    testOrder.setDocumentNo("OrderPostTest " + testNumber);
    testOrder.setSummedLineAmount(BigDecimal.ZERO);
    testOrder.setGrandTotalAmount(BigDecimal.ZERO);
    testOrder.setPriceIncludesTax(true);
    testOrder.setPriceList(
        OBDal.getInstance().getProxy(PriceList.class, PRICEINCLUDINGTAXES_PRICELIST_SALES));
    OBDal.getInstance().save(testOrder);

    order.getOrderLineList().forEach(line -> {
      OrderLine newLine = (OrderLine) DalUtil.copy(line, false);
      newLine.setSalesOrder(testOrder);
      newLine.setBusinessPartner(testOrder.getBusinessPartner());
      newLine.setGrossUnitPrice(BigDecimal.TEN);
      newLine.setGrossListPrice(BigDecimal.TEN);
      newLine.setBaseGrossUnitPrice(BigDecimal.TEN);

      newLine.setTax(OBDal.getInstance().getProxy(TaxRate.class, LINE_TAX));
      newLine.setLineGrossAmount(newLine.getOrderedQuantity().multiply(BigDecimal.TEN));
      newLine.setLineNetAmount(newLine.getOrderedQuantity().multiply(BigDecimal.TEN));

      testOrder.getOrderLineList().add(newLine);
      newLine.setSalesOrder(testOrder);
      testOrder.getOrderLineList().add(newLine);
      OBDal.getInstance().save(newLine);
      OBDal.getInstance().flush();
    });

    testOrder.setDocumentStatus(documentStatus);
    testOrder.setDocumentAction(documentAction);
    OBDal.getInstance().save(testOrder);
    OBDal.getInstance().flush();
    OBDal.getInstance().refresh(testOrder);

    log.debug("Order Created: %s", testOrder.getDocumentNo());
    log.debug(testDescription);

    return testOrder;
  }

  private void assertOrder(Order testOrder) {
    switch (documentAction) {
      case "CL":
        assertOrderIsClosed(testOrder);
        break;
      case "CO":
        assertOrderIsCompleted(testOrder, new BigDecimal("1000"), new BigDecimal("100"),
            BigDecimal.TEN, BigDecimal.TEN);
        break;
      case "NC":
      case "AE":
      case "ME":
        assertOrderStatus(testOrder, documentAction, new BigDecimal("1000"), new BigDecimal("100"),
            BigDecimal.TEN, BigDecimal.TEN);
        break;

      default:
        break;
    }
  }

  private void assertOrderIsClosed(Order testOrder) {
    assertOrderHeader(testOrder, BigDecimal.ZERO, "CL");
    assertOrderLines(testOrder, BigDecimal.ZERO, BigDecimal.TEN, BigDecimal.ZERO);
  }

  private void assertOrderIsCompleted(Order testOrder, BigDecimal totalAmount,
      BigDecimal orderedQuantity, BigDecimal grossPrice, BigDecimal unitPrice) {
    assertOrderHeader(testOrder, totalAmount, "CO");
    assertOrderLines(testOrder, orderedQuantity, grossPrice, unitPrice);

    assertThat("Should be one payment schedule", testOrder.getFINPaymentScheduleList().size(),
        comparesEqualTo(1));

    FIN_PaymentSchedule paymentSchedule = testOrder.getFINPaymentScheduleList().get(0);
    assertThat("Payment amount should be " + totalAmount, paymentSchedule.getAmount(),
        comparesEqualTo(totalAmount));
    assertThat("Payment outstanding amount should be 0", paymentSchedule.getOutstandingAmount(),
        comparesEqualTo(totalAmount));
  }

  private void assertOrderStatus(Order testOrder, String docStatus, BigDecimal totalAmount,
      BigDecimal orderedQuantity, BigDecimal grossPrice, BigDecimal unitPrice) {
    assertOrderHeader(testOrder, totalAmount, docStatus);
    assertOrderLines(testOrder, orderedQuantity, grossPrice, unitPrice);
  }

  private void assertOrderLines(Order testOrder, BigDecimal orderedQuantity, BigDecimal grossPrice,
      BigDecimal linePrice) {
    testOrder.getOrderLineList().forEach(line -> {
      OBDal.getInstance().refresh(line);
      assertThat("Line ordered quantity should be " + orderedQuantity, line.getOrderedQuantity(),
          comparesEqualTo(orderedQuantity));
      assertThat("Line gross unit price should be " + grossPrice, line.getGrossUnitPrice(),
          comparesEqualTo(grossPrice));
      assertThat("Line unit price should be " + linePrice, line.getUnitPrice(),
          comparesEqualTo(linePrice));
      assertThat("Line invoiced quantity should be 0", line.getInvoicedQuantity(),
          comparesEqualTo(BigDecimal.ZERO));
      assertThat("Line delivered quantity should be 0", line.getDeliveredQuantity(),
          comparesEqualTo(BigDecimal.ZERO));
    });
  }

  private void assertOrderHeader(Order testOrder, BigDecimal totalAmount,
      String expectedDocumentStatus) {
    assertThat("Order should be Booked", testOrder.getDocumentStatus(),
        comparesEqualTo(expectedDocumentStatus));
    assertThat("Order Total amount should be " + totalAmount, testOrder.getGrandTotalAmount(),
        comparesEqualTo(totalAmount));
    assertFalse("Order should not be delived", testOrder.isDelivered());
  }

  private Order processOrder(Order testOrder) {
    final List<Object> params = new ArrayList<>();
    params.add(null);
    params.add(testOrder.getId());
    CallStoredProcedure.getInstance()
        .call(ORDER_COMPLETE_PROCEDURE_NAME, params, null, true, false);
    OBDal.getInstance().refresh(testOrder);
    return testOrder;
  }
}
