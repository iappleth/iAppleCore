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
import java.math.RoundingMode;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;

import javax.enterprise.inject.Any;
import javax.enterprise.inject.Instance;
import javax.inject.Inject;

import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.model.Property;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.client.kernel.RequestContext;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.erpCommon.utility.SequenceIdData;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.ad.access.InvoiceLineTax;
import org.openbravo.model.ad.access.OrderLineTax;
import org.openbravo.model.common.businesspartner.BusinessPartner;
import org.openbravo.model.common.enterprise.DocumentType;
import org.openbravo.model.common.invoice.Invoice;
import org.openbravo.model.common.invoice.InvoiceLine;
import org.openbravo.model.common.invoice.InvoiceLineOffer;
import org.openbravo.model.common.invoice.InvoiceTax;
import org.openbravo.model.common.order.Order;
import org.openbravo.model.common.order.OrderLine;
import org.openbravo.model.common.order.OrderLineOffer;
import org.openbravo.model.financialmgmt.payment.FIN_OrigPaymentScheduleDetail;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentSchedule;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentScheduleDetail;
import org.openbravo.model.financialmgmt.payment.Fin_OrigPaymentSchedule;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOutLine;
import org.openbravo.service.db.DalConnectionProvider;
import org.openbravo.service.json.JsonConstants;

public class OrderGroupingProcessor {

  @Inject
  @Any
  private Instance<FinishInvoiceHook> invoiceProcesses;

  private static final Logger log = Logger.getLogger(OrderGroupingProcessor.class);

  /**
   * Creates invoices for the order lines which are part of a cashup. Groups order lines of the same
   * bp in one invoice, depending on the create invoices for order setting in the (
   * {@link TerminalType#isGroupingOrders}).
   * 
   */
  public JSONObject groupOrders(OBPOSApplications posTerminal, String cashUpId, Date currentDate)
      throws JSONException, SQLException {
    // Obtaining order lines that have been created in current terminal and have not already been
    // reconciled. This query must be kept in sync with the one in CashCloseReport

    String hqlWhereClause = "as line"
        + " where line.salesOrder.obposApplications = :terminal and line.salesOrder.obposAppCashup=:cashUpId and line.deliveredQuantity=line.orderedQuantity and line.orderedQuantity <> 0"
        + " and line.salesOrder.documentType.id in ('"
        + posTerminal.getObposTerminaltype().getDocumentType().getId()
        + "', '"
        + posTerminal.getObposTerminaltype().getDocumentTypeForReturns().getId()
        + "') and not exists (select 1 from OrderLine as ord where invoicedQuantity<>0 and ord.salesOrder = line.salesOrder)"
        + " and line.salesOrder.oBPOSNotInvoiceOnCashUp = false"
        + " order by line.businessPartner.id, line.salesOrder.id";

    OBQuery<OrderLine> query = OBDal.getInstance().createQuery(OrderLine.class, hqlWhereClause);
    query.setNamedParameter("terminal", posTerminal);
    query.setNamedParameter("cashUpId", cashUpId);

    List<String> invoicesToSetDocumentNos = new ArrayList<String>();

    ScrollableResults orderLines = query.scroll(ScrollMode.FORWARD_ONLY);
    Invoice invoice = null;
    FIN_PaymentSchedule paymentSchedule = null;
    Fin_OrigPaymentSchedule origPaymentSchedule = null;
    String currentOrderId = "";
    Order currentOrder = null;
    String currentbpId = "";
    BusinessPartner currentBp = null;
    HashMap<String, InvoiceTax> invoiceTaxes = null;
    BigDecimal totalNetAmount = BigDecimal.ZERO;
    List<String> processedOrders = new ArrayList<String>();
    boolean isMultiShipmentLine;
    long lineno = 10;
    long taxLineNo = 0;
    try {
      while (orderLines.next()) {
        isMultiShipmentLine = false;
        OrderLine orderLine = (OrderLine) orderLines.get(0);
        log.debug("Line id:" + orderLine.getId());

        String orderId = (String) DalUtil.getId(orderLine.getSalesOrder());
        if (!orderId.equals(currentOrderId)
            && !posTerminal.getObposTerminaltype().isGroupingOrders()) {

          // New Order. We need to finish current invoice, and create a new one
          finishInvoice(invoice, totalNetAmount, invoiceTaxes, paymentSchedule,
              origPaymentSchedule, currentDate);

          if (invoice != null) {
            invoicesToSetDocumentNos.add(invoice.getId());
          }

          currentOrderId = orderId;
          Order order = OBDal.getInstance().get(Order.class, orderId);
          currentOrder = OBDal.getInstance().get(Order.class, orderId);
          invoice = createNewInvoice(posTerminal, currentOrder, orderLine, currentDate);
          paymentSchedule = createNewPaymentSchedule(invoice, currentDate);
          if (!posTerminal.getObposTerminaltype().isGroupingOrders()) {

            String language = RequestContext.get().getVariablesSecureApp().getLanguage();
            String description = Utility.messageBD(new DalConnectionProvider(false),
                "OrderDocumentno", language) + ": " + order.getDocumentNo() + "\n";
            invoice.setDescription(description);
          }
          origPaymentSchedule = createOriginalPaymentSchedule(invoice, paymentSchedule);
          invoiceTaxes = new HashMap<String, InvoiceTax>();
          totalNetAmount = BigDecimal.ZERO;
          taxLineNo = 10;
          lineno = 10;
          OBDal.getInstance().save(invoice);
          OBDal.getInstance().save(paymentSchedule);
          OBDal.getInstance().save(origPaymentSchedule);
        }

        String bpId = (String) DalUtil.getId(orderLine.getBusinessPartner());
        if (bpId == null) {
          bpId = (String) DalUtil.getId(orderLine.getSalesOrder().getBusinessPartner());
        }
        if (!bpId.equals(currentbpId) && posTerminal.getObposTerminaltype().isGroupingOrders()) {
          // New business partner. We need to finish current invoice, and create a new one
          finishInvoice(invoice, totalNetAmount, invoiceTaxes, paymentSchedule,
              origPaymentSchedule, currentDate);

          if (invoice != null) {
            invoicesToSetDocumentNos.add(invoice.getId());
          }

          currentbpId = bpId;
          currentBp = OBDal.getInstance().get(BusinessPartner.class, bpId);
          invoice = createNewInvoice(posTerminal, currentBp, orderLine, currentDate);
          paymentSchedule = createNewPaymentSchedule(invoice, currentDate);
          origPaymentSchedule = createOriginalPaymentSchedule(invoice, paymentSchedule);
          invoiceTaxes = new HashMap<String, InvoiceTax>();
          totalNetAmount = BigDecimal.ZERO;
          taxLineNo = 10;
          lineno = 10;
          OBDal.getInstance().save(invoice);
          OBDal.getInstance().save(paymentSchedule);
          OBDal.getInstance().save(origPaymentSchedule);
        }

        List<FIN_PaymentSchedule> finPaymentScheduleList = orderLine.getSalesOrder()
            .getFINPaymentScheduleList();
        if (!processedOrders.contains((String) DalUtil.getId(orderLine.getSalesOrder()))
            && !finPaymentScheduleList.isEmpty()
            && finPaymentScheduleList.get(0).getFINPaymentScheduleDetailOrderPaymentScheduleList()
                .size() > 0) {
          boolean success = processPaymentsFromOrder(invoice, orderLine.getSalesOrder(),
              paymentSchedule, origPaymentSchedule);
          if (!success) {
            continue;
          }
          processedOrders.add((String) DalUtil.getId(orderLine.getSalesOrder()));
          log.debug("processed payment");
        }

        // the line is split in goods shipment lines
        OrderLine[] orderLinesSplittedByShipmentLine = splitOrderLineByShipmentLine(orderLine);
        if (orderLinesSplittedByShipmentLine.length > 1) {
          isMultiShipmentLine = true;
        }
        for (int i = 0; i < orderLinesSplittedByShipmentLine.length; i++) {
          OrderLine olSplitted = orderLinesSplittedByShipmentLine[i];

          InvoiceLine invoiceLine = createInvoiceLine(olSplitted, orderLine, isMultiShipmentLine);
          invoiceLine.setLineNo(lineno);
          lineno += 10;
          invoiceLine.setInvoice(invoice);
          totalNetAmount = totalNetAmount.add(invoiceLine.getLineNetAmount());

          List<InvoiceLineTax> lineTaxes = createInvoiceLineTaxes(olSplitted);
          for (InvoiceLineTax tax : lineTaxes) {
            String taxId = (String) DalUtil.getId(tax.getTax());
            InvoiceTax invoiceTax = null;
            if (invoiceTaxes.containsKey(taxId)) {
              invoiceTax = invoiceTaxes.get(taxId);
            } else {
              invoiceTax = OBProvider.getInstance().get(InvoiceTax.class);
              invoiceTax.setTax(tax.getTax());
              invoiceTax.setTaxableAmount(BigDecimal.ZERO);
              invoiceTax.setTaxAmount(BigDecimal.ZERO);
              invoiceTax.setLineNo(taxLineNo);
              taxLineNo += 10;
              invoiceTaxes.put(taxId, invoiceTax);
            }
            invoiceTax.setTaxableAmount(invoiceTax.getTaxableAmount().add(tax.getTaxableAmount()));
            invoiceTax.setTaxAmount(invoiceTax.getTaxAmount().add(tax.getTaxAmount()));

            tax.setInvoiceLine(invoiceLine);
            tax.setInvoice(invoice);
            invoiceLine.getInvoiceLineTaxList().add(tax);
            invoice.getInvoiceLineTaxList().add(tax);
            invoiceLine.setTaxableAmount(invoiceLine.getTaxableAmount() == null ? BigDecimal.ZERO
                : invoiceLine.getTaxableAmount().add(tax.getTaxableAmount()));
          }
          OBDal.getInstance().save(invoiceLine);
        }
      }
    } finally {
      orderLines.close();
    }
    finishInvoice(invoice, totalNetAmount, invoiceTaxes, paymentSchedule, origPaymentSchedule,
        currentDate);

    if (invoice != null) {
      invoicesToSetDocumentNos.add(invoice.getId());
    }

    OBDal.getInstance().flush();

    // set the document nos in a separate loop and flush
    // now set all the document nos
    for (String invoiceId : invoicesToSetDocumentNos) {
      invoice = OBDal.getInstance().get(Invoice.class, invoiceId);
      invoice.setDocumentNo(getInvoiceDocumentNo(invoice.getTransactionDocument(),
          invoice.getDocumentType()));
      executeHooks(invoice, cashUpId);
    }
    OBDal.getInstance().flush();

    JSONObject jsonResponse = new JSONObject();
    jsonResponse.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
    return jsonResponse;
  }

  protected void executeHooks(Invoice invoice, String cashUpId) {
    for (Iterator<FinishInvoiceHook> processIterator = invoiceProcesses.iterator(); processIterator
        .hasNext();) {
      FinishInvoiceHook process = processIterator.next();
      process.exec(invoice, cashUpId);
    }
  }

  protected FIN_PaymentSchedule createNewPaymentSchedule(Invoice invoice, Date currentDate) {
    FIN_PaymentSchedule paymentScheduleInvoice = OBProvider.getInstance().get(
        FIN_PaymentSchedule.class);
    paymentScheduleInvoice.setCurrency(invoice.getCurrency());
    paymentScheduleInvoice.setInvoice(invoice);
    paymentScheduleInvoice.setOrganization(invoice.getOrganization());
    paymentScheduleInvoice.setFinPaymentmethod(invoice.getPaymentMethod());
    paymentScheduleInvoice.setAmount(BigDecimal.ZERO);
    paymentScheduleInvoice.setOutstandingAmount(BigDecimal.ZERO);
    paymentScheduleInvoice.setDueDate(currentDate);
    paymentScheduleInvoice.setExpectedDate(currentDate);
    if (ModelProvider.getInstance().getEntity(FIN_PaymentSchedule.class).hasProperty("origDueDate")) {
      // This property is checked and set this way to force compatibility with both MP13, MP14
      // and
      // later releases of Openbravo. This property is mandatory and must be set. Check issue
      paymentScheduleInvoice.set("origDueDate", paymentScheduleInvoice.getDueDate());
    }
    paymentScheduleInvoice.setFINPaymentPriority(invoice.getFINPaymentPriority());
    return paymentScheduleInvoice;
  }

  protected Fin_OrigPaymentSchedule createOriginalPaymentSchedule(Invoice invoice,
      FIN_PaymentSchedule paymentScheduleInvoice) {

    Fin_OrigPaymentSchedule origPaymentSchedule = OBProvider.getInstance().get(
        Fin_OrigPaymentSchedule.class);
    origPaymentSchedule.setCurrency(invoice.getCurrency());
    origPaymentSchedule.setInvoice(invoice);
    origPaymentSchedule.setOrganization(invoice.getOrganization());
    origPaymentSchedule.setPaymentMethod(invoice.getPaymentMethod());
    origPaymentSchedule.setAmount(BigDecimal.ZERO);
    origPaymentSchedule.setDueDate(invoice.getOrderDate());
    origPaymentSchedule.setPaymentPriority(paymentScheduleInvoice.getFINPaymentPriority());
    return origPaymentSchedule;

  }

  protected boolean processPaymentsFromOrder(Invoice invoice, Order order,
      FIN_PaymentSchedule paymentScheduleInvoice, Fin_OrigPaymentSchedule originalPaymentSchedule) {
    FIN_PaymentSchedule orderPaymentSchedule = null;
    // In case order is payed using different payment methods, payment schedule list size will be >1
    for (FIN_PaymentSchedule sched : order.getFINPaymentScheduleList()) {
      orderPaymentSchedule = sched;

      FIN_PaymentScheduleDetail paymentScheduleDetail = null;
      for (FIN_PaymentScheduleDetail detail : sched
          .getFINPaymentScheduleDetailOrderPaymentScheduleList()) {
        paymentScheduleDetail = detail;

        paymentScheduleInvoice.getFINPaymentScheduleDetailInvoicePaymentScheduleList().add(
            paymentScheduleDetail);
        paymentScheduleDetail.setInvoicePaymentSchedule(paymentScheduleInvoice);
        paymentScheduleDetail.setInvoicePaid(Boolean.TRUE);

        paymentScheduleInvoice.setAmount(paymentScheduleInvoice.getAmount().add(
            paymentScheduleDetail.getAmount()));

        FIN_OrigPaymentScheduleDetail origDetail = OBProvider.getInstance().get(
            FIN_OrigPaymentScheduleDetail.class);
        origDetail.setArchivedPaymentPlan(originalPaymentSchedule);
        origDetail.setPaymentScheduleDetail(paymentScheduleDetail);
        origDetail.setAmount(paymentScheduleDetail.getAmount());
        origDetail.setWriteoffAmount(paymentScheduleDetail.getWriteoffAmount());

        OBDal.getInstance().save(origDetail);
      }

      if (paymentScheduleDetail == null) {
        log.error("Couldn't find payment schedule detail for order : " + order.getDocumentNo()
            + ". Ignoring order");
        return false;
      }
    }

    if (orderPaymentSchedule == null) {
      log.error("Couldn't find payment schedule for order: " + order.getDocumentNo()
          + ". Ignoring order");
      return false;
    } else {
      return true;
    }
  }

  protected List<InvoiceLineTax> createInvoiceLineTaxes(OrderLine orderLine) {
    List<InvoiceLineTax> taxes = new ArrayList<InvoiceLineTax>();
    for (OrderLineTax orgTax : orderLine.getOrderLineTaxList()) {
      InvoiceLineTax tax = OBProvider.getInstance().get(InvoiceLineTax.class);
      tax.setTax(orgTax.getTax());
      tax.setTaxableAmount(orgTax.getTaxableAmount());
      tax.setTaxAmount(orgTax.getTaxAmount());
      tax.setRecalculate(true);
      taxes.add(tax);
    }
    return taxes;
  }

  protected InvoiceLine createInvoiceLine(OrderLine orderLine, OrderLine origOrderLine,
      boolean isMultiShipmentLine) {
    InvoiceLine invoiceLine = OBProvider.getInstance().get(InvoiceLine.class);
    copyObject(orderLine, invoiceLine);
    invoiceLine.setTaxableAmount(BigDecimal.ZERO);
    invoiceLine.setInvoicedQuantity(orderLine.getOrderedQuantity());
    if (orderLine.getSalesOrder().getPriceList().isPriceIncludesTax()) {
      invoiceLine.setGrossAmount(orderLine.getLineGrossAmount());
    }
    invoiceLine.setSalesOrderLine(origOrderLine);
    origOrderLine.getInvoiceLineList().add(invoiceLine);
    origOrderLine.setInvoicedQuantity(origOrderLine.getOrderedQuantity());

    if (orderLine.getGoodsShipmentLine() != null) {
      invoiceLine.setGoodsShipmentLine(orderLine.getGoodsShipmentLine());
    } else {
      invoiceLine.setGoodsShipmentLine(getShipmentLine(orderLine));
    }

    // Promotions. Loading all together as there shoudn't be many promotions per line
    List<OrderLineOffer> promotions = orderLine.getOrderLineOfferList();
    for (OrderLineOffer orderLinePromotion : promotions) {
      InvoiceLineOffer promotion = OBProvider.getInstance().get(InvoiceLineOffer.class);
      copyObject(orderLinePromotion, promotion);

      promotion.setInvoiceLine(invoiceLine);
      invoiceLine.getInvoiceLineOfferList().add(promotion);
    }

    return invoiceLine;
  }

  private ShipmentInOutLine getShipmentLine(OrderLine orderLine) {
    List<ShipmentInOutLine> result = orderLine.getMaterialMgmtShipmentInOutLineList();
    if (result.size() == 0) {
      return null;
    } else {
      return result.get(0);
    }
  }

  private void copyObject(BaseOBObject sourceObj, BaseOBObject targetObj) {
    Entity sourceEntity = sourceObj.getEntity();
    Entity targetEntity = targetObj.getEntity();
    for (Property p : sourceEntity.getProperties()) {
      if (targetEntity.hasProperty(p.getName()) && !p.isOneToMany() && !p.isId()
          && !p.getName().equals(Entity.COMPUTED_COLUMNS_PROXY_PROPERTY) && !p.isComputedColumn()) {
        targetObj.set(p.getName(), sourceObj.get(p.getName()));
      }
    }

  }

  protected String getInvoiceDocumentNo(DocumentType doctypeTarget, DocumentType doctype) {
    return Utility.getDocumentNo(OBDal.getInstance().getConnection(false),
        new DalConnectionProvider(false), RequestContext.get().getVariablesSecureApp(), "",
        "C_Invoice", doctypeTarget == null ? "" : doctypeTarget.getId(), doctype == null ? ""
            : doctype.getId(), false, true);
  }

  protected Invoice createNewInvoice(OBPOSApplications terminal, BusinessPartner bp,
      OrderLine firstLine, Date currentDate) {
    Invoice invoice = OBProvider.getInstance().get(Invoice.class);
    invoice.setBusinessPartner(bp);
    if (bp.getBusinessPartnerLocationList().size() == 0) {
      throw new OBException("No addresses defined for the business partner " + bp.getName());
    }
    invoice.setPartnerAddress(bp.getBusinessPartnerLocationList().get(0));
    invoice.setCurrency(firstLine.getCurrency());
    invoice.setOrganization(terminal.getOrganization());
    invoice.setSalesTransaction(true);
    invoice.setDocumentStatus("CO");
    invoice.setDocumentAction("RE");
    invoice.setAPRMProcessinvoice("RE");
    invoice.setProcessed(true);
    invoice.setPaymentMethod(bp.getPaymentMethod());
    invoice.setPaymentTerms(bp.getPaymentTerms());
    invoice.setDocumentType(terminal.getObposTerminaltype().getDocumentType()
        .getDocumentTypeForInvoice());
    invoice.setTransactionDocument(terminal.getObposTerminaltype().getDocumentType()
        .getDocumentTypeForInvoice());
    // set to a dummy value, will be set at the end to prevent locking
    invoice.setDocumentNo("9999");
    invoice.setAccountingDate(currentDate);
    invoice.setInvoiceDate(currentDate);
    invoice.setPriceList(firstLine.getSalesOrder().getPriceList());
    invoice.setSalesRepresentative(firstLine.getSalesOrder().getSalesRepresentative());
    invoice.setUserContact(firstLine.getSalesOrder().getUserContact());
    return invoice;
  }

  protected Invoice createNewInvoice(OBPOSApplications terminal, Order order, OrderLine firstLine,
      Date currentDate) {
    Invoice invoice = OBProvider.getInstance().get(Invoice.class);
    invoice.setBusinessPartner(order.getBusinessPartner());
    if (order.getBusinessPartner().getBusinessPartnerLocationList().size() == 0) {
      throw new OBException("No addresses defined for the business partner "
          + order.getBusinessPartner().getName());
    }
    invoice.setPartnerAddress(order.getBusinessPartner().getBusinessPartnerLocationList().get(0));
    invoice.setCurrency(firstLine.getCurrency());
    invoice.setSalesTransaction(true);
    invoice.setOrganization(terminal.getOrganization());
    invoice.setDocumentStatus("CO");
    invoice.setDocumentAction("RE");
    invoice.setAPRMProcessinvoice("RE");
    invoice.setProcessed(true);
    invoice.setPaymentMethod(order.getBusinessPartner().getPaymentMethod());
    invoice.setPaymentTerms(order.getBusinessPartner().getPaymentTerms());
    invoice.setDocumentType(terminal.getObposTerminaltype().getDocumentType()
        .getDocumentTypeForInvoice());
    invoice.setTransactionDocument(terminal.getObposTerminaltype().getDocumentType()
        .getDocumentTypeForInvoice());
    // set to a dummy value, will be set at the end to prevent locking
    invoice.setDocumentNo("9999");
    invoice.setAccountingDate(currentDate);
    invoice.setInvoiceDate(currentDate);
    invoice.setPriceList(firstLine.getSalesOrder().getPriceList());
    invoice.setSalesOrder(order);
    invoice.setSalesRepresentative(firstLine.getSalesOrder().getSalesRepresentative());
    invoice.setUserContact(firstLine.getSalesOrder().getUserContact());
    return invoice;
  }

  protected void finishInvoice(Invoice oriInvoice, BigDecimal totalNetAmount,
      HashMap<String, InvoiceTax> invoiceTaxes, FIN_PaymentSchedule paymentSchedule,
      Fin_OrigPaymentSchedule origPaymentSchedule, Date currentDate) throws SQLException {
    if (oriInvoice == null) {
      return;
    }
    Invoice invoice = OBDal.getInstance().get(Invoice.class, oriInvoice.getId());

    OBDal.getInstance().save(invoice);
    BigDecimal grossamount = totalNetAmount;
    for (InvoiceTax tax : invoiceTaxes.values()) {
      tax.setRecalculate(true);
      tax.setInvoice(invoice);
      invoice.getInvoiceTaxList().add(tax);
      OBDal.getInstance().save(tax);
      grossamount = grossamount.add(tax.getTaxAmount());
    }

    BigDecimal totalPaid = BigDecimal.ZERO;
    for (FIN_PaymentScheduleDetail psd : paymentSchedule
        .getFINPaymentScheduleDetailInvoicePaymentScheduleList()) {
      totalPaid = totalPaid.add(psd.getAmount());
    }

    // if the total paid is distinct that grossamount, we should create a new sched detail with the
    // difference
    if (grossamount.compareTo(totalPaid) != 0 && grossamount.compareTo(BigDecimal.ZERO) != 0) {
      FIN_PaymentScheduleDetail newDetail = OBProvider.getInstance().get(
          FIN_PaymentScheduleDetail.class);
      newDetail.setAmount(grossamount.subtract(totalPaid));
      newDetail.setInvoicePaymentSchedule(paymentSchedule);
      paymentSchedule.getFINPaymentScheduleDetailInvoicePaymentScheduleList().add(newDetail);
      paymentSchedule.setOutstandingAmount(grossamount.subtract(totalPaid));

    }

    if (grossamount.compareTo(BigDecimal.ZERO) == 0) {
      totalPaid = BigDecimal.ZERO;
    }

    invoice.setGrandTotalAmount(grossamount);
    invoice.setSummedLineAmount(totalNetAmount);
    invoice.setPaymentComplete(grossamount.compareTo(totalPaid) == 0);
    invoice.setTotalPaid(totalPaid);
    invoice.setPercentageOverdue(new Long(0));
    invoice.setFinalSettlementDate(grossamount.compareTo(totalPaid) == 0 ? currentDate : null);
    invoice.setDaysSalesOutstanding(new Long(0));
    invoice.setOutstandingAmount(grossamount.subtract(totalPaid));

    paymentSchedule.setAmount(grossamount);
    paymentSchedule.setPaidAmount(totalPaid);
    origPaymentSchedule.setAmount(grossamount);

    if (grossamount.compareTo(BigDecimal.ZERO) == 0) {
      for (FIN_PaymentScheduleDetail detail : paymentSchedule
          .getFINPaymentScheduleDetailInvoicePaymentScheduleList()) {
        detail.setInvoicePaymentSchedule(null);
      }
      paymentSchedule.getFINPaymentScheduleDetailInvoicePaymentScheduleList().clear();
      paymentSchedule.setActive(false);
      OBDal.getInstance().remove(paymentSchedule);
      OBDal.getInstance().remove(origPaymentSchedule);
    }
  }

  OrderLine[] splitOrderLineByShipmentLine(OrderLine ol) {
    BigDecimal qtyTotal = ol.getOrderedQuantity();
    // if qtyOrdered is ZERO then the line can not be splitted
    if (qtyTotal.equals(BigDecimal.ZERO)) {
      return new OrderLine[] { ol };
    }

    List<ShipmentInOutLine> shipmentLines = ol.getMaterialMgmtShipmentInOutLineList();

    int stdPrecision = ol.getSalesOrder().getCurrency().getStandardPrecision().intValue();
    long lineNo = 0;

    // if there is one or none then only one record is returned with the original orderline
    if (shipmentLines.size() < 2) {
      return new OrderLine[] { ol };
    } else {
      BigDecimal partialGrossAmount = BigDecimal.ZERO;
      BigDecimal partialLineNetAmount = BigDecimal.ZERO;
      OrderLine[] arrayOlSplit = new OrderLine[shipmentLines.size()];
      for (int i = 0; i < shipmentLines.size(); i++) {
        lineNo += 10;
        BigDecimal ratio = shipmentLines.get(i).getMovementQuantity()
            .divide(qtyTotal, 32, RoundingMode.HALF_UP);
        OrderLine olSplit = OBProvider.getInstance().get(OrderLine.class);
        olSplit = (OrderLine) DalUtil.copy(ol);

        olSplit.setId(SequenceIdData.getUUID());
        olSplit.setOrderedQuantity(shipmentLines.get(i).getMovementQuantity());
        olSplit.setDeliveredQuantity(shipmentLines.get(i).getMovementQuantity());
        olSplit.setGoodsShipmentLine(shipmentLines.get(i));
        olSplit.setInvoicedQuantity(shipmentLines.get(i).getMovementQuantity());
        olSplit.setTaxableAmount(ol.getUnitPrice().multiply(olSplit.getOrderedQuantity())
            .setScale(stdPrecision, RoundingMode.HALF_UP));

        if (shipmentLines.size() > i + 1) {
          olSplit.setLineGrossAmount(ol.getGrossUnitPrice().multiply(olSplit.getOrderedQuantity())
              .setScale(stdPrecision, RoundingMode.HALF_UP));
          olSplit.setLineNetAmount(ol.getUnitPrice().multiply(olSplit.getOrderedQuantity())
              .setScale(stdPrecision, RoundingMode.HALF_UP));
          partialGrossAmount = partialGrossAmount.add(ol.getGrossUnitPrice()
              .multiply(olSplit.getOrderedQuantity()).setScale(stdPrecision, RoundingMode.HALF_UP));
          partialLineNetAmount = partialLineNetAmount.add(ol.getUnitPrice()
              .multiply(olSplit.getOrderedQuantity()).setScale(stdPrecision, RoundingMode.HALF_UP));
        } else {
          olSplit.setLineNetAmount(ol.getLineNetAmount().subtract(partialLineNetAmount)
              .setScale(stdPrecision, RoundingMode.HALF_UP));
          olSplit.setLineGrossAmount(ol.getLineGrossAmount().subtract(partialGrossAmount)
              .setScale(stdPrecision, RoundingMode.HALF_UP));
        }

        olSplit.setLineNo(lineNo);

        for (int j = 0; j < olSplit.getOrderLineTaxList().size(); j++) {
          OrderLineTax olt = olSplit.getOrderLineTaxList().get(j);
          olt.setTaxAmount(olt.getTaxAmount().multiply(ratio)
              .setScale(stdPrecision, RoundingMode.HALF_UP));
          olt.setTaxableAmount(olt.getTaxableAmount().multiply(ratio)
              .setScale(stdPrecision, RoundingMode.HALF_UP));
        }

        List<OrderLineOffer> promotions = olSplit.getOrderLineOfferList();
        for (OrderLineOffer olPromotion : promotions) {
          olPromotion.setAdjustedPrice(olPromotion.getAdjustedPrice().multiply(ratio));
          olPromotion.setBaseGrossUnitPrice(olPromotion.getBaseGrossUnitPrice().multiply(ratio));
          olPromotion.setPriceAdjustmentAmt(olPromotion.getPriceAdjustmentAmt().multiply(ratio));
          olPromotion.setTotalAmount(olPromotion.getTotalAmount().multiply(ratio));
        }

        arrayOlSplit[i] = olSplit;
      }
      return arrayOlSplit;
    }
  }

}
