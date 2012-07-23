/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;

import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
import org.openbravo.advpaymentmngt.process.FIN_AddPayment;
import org.openbravo.advpaymentmngt.process.FIN_PaymentProcess;
import org.openbravo.advpaymentmngt.utility.FIN_Utility;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.model.Property;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.client.kernel.RequestContext;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.core.TriggerHandler;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.erpCommon.ad_forms.AcctServer;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.ad.access.InvoiceLineTax;
import org.openbravo.model.ad.access.OrderLineTax;
import org.openbravo.model.common.businesspartner.Location;
import org.openbravo.model.common.enterprise.DocumentType;
import org.openbravo.model.common.enterprise.Locator;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.common.invoice.Invoice;
import org.openbravo.model.common.invoice.InvoiceLine;
import org.openbravo.model.common.invoice.InvoiceTax;
import org.openbravo.model.common.order.Order;
import org.openbravo.model.common.order.OrderLine;
import org.openbravo.model.common.order.OrderTax;
import org.openbravo.model.financialmgmt.payment.FIN_FinancialAccount;
import org.openbravo.model.financialmgmt.payment.FIN_OrigPaymentScheduleDetail;
import org.openbravo.model.financialmgmt.payment.FIN_Payment;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentMethod;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentSchedule;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentScheduleDetail;
import org.openbravo.model.financialmgmt.payment.Fin_OrigPaymentSchedule;
import org.openbravo.model.financialmgmt.payment.PaymentTerm;
import org.openbravo.model.financialmgmt.tax.TaxRate;
import org.openbravo.model.materialmgmt.onhandquantity.StorageDetail;
import org.openbravo.model.materialmgmt.transaction.MaterialTransaction;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOut;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOutLine;
import org.openbravo.scheduling.ProcessBundle;
import org.openbravo.service.db.DalConnectionProvider;
import org.openbravo.service.json.JsonConstants;
import org.openbravo.service.json.JsonToDataConverter;

public class OrderLoader {

  HashMap<String, DocumentType> paymentDocTypes = new HashMap<String, DocumentType>();
  HashMap<String, DocumentType> invoiceDocTypes = new HashMap<String, DocumentType>();
  HashMap<String, DocumentType> shipmentDocTypes = new HashMap<String, DocumentType>();
  String paymentDescription = null;

  private static final Logger log = Logger.getLogger(OrderLoader.class);

  private static final BigDecimal NEGATIVE_ONE = new BigDecimal(-1);

  public JSONObject saveOrder(JSONArray jsonarray) throws JSONException {
    boolean error = false;
    OBContext.setAdminMode(true);
    try {
      for (int i = 0; i < jsonarray.length(); i++) {
        long t1 = System.currentTimeMillis();
        JSONObject jsonorder = jsonarray.getJSONObject(i);
        try {
          JSONObject result = saveOrder(jsonorder);
          if (!result.get(JsonConstants.RESPONSE_STATUS).equals(
              JsonConstants.RPCREQUEST_STATUS_SUCCESS)) {
            log.error("There was an error importing order: " + jsonorder.toString());
            error = true;
          }
          if (i % 1 == 0) {
            OBDal.getInstance().flush();
            OBDal.getInstance().getConnection().commit();
            OBDal.getInstance().getSession().clear();
          }
          log.info("Total order time: " + (System.currentTimeMillis() - t1));
        } catch (Exception e) {
          // Creation of the order failed. We will now store the order in the import errors table
          OBDal.getInstance().rollbackAndClose();
          if (TriggerHandler.getInstance().isDisabled()) {
            TriggerHandler.getInstance().enable();
          }
          OBPOSErrors errorEntry = OBProvider.getInstance().get(OBPOSErrors.class);
          errorEntry.setError(getErrorMessage(e));
          errorEntry.setOrderstatus("N");
          errorEntry.setJsoninfo(jsonorder.toString());
          OBDal.getInstance().save(errorEntry);
          OBDal.getInstance().flush();
          try {
            OBDal.getInstance().getConnection().commit();
          } catch (SQLException e1) {
            // this won't happen
          }

        }
      }

    } finally {
      OBContext.restorePreviousMode();
    }
    JSONObject jsonResponse = new JSONObject();
    if (!error) {
      jsonResponse.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
      jsonResponse.put("result", "0");
    } else {
      jsonResponse.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_FAILURE);
      jsonResponse.put("result", "0");
    }
    return jsonResponse;
  }

  public JSONObject saveOrder(JSONObject jsonorder) throws JSONException {

    long t0 = System.currentTimeMillis();
    long t1, t11, t2, t3;
    Order order = null;
    ShipmentInOut shipment = null;
    Invoice invoice = null;
    TriggerHandler.getInstance().disable();
    try {
      t1 = System.currentTimeMillis();
      boolean createInvoice = (jsonorder.has("generateInvoice") && jsonorder
          .getBoolean("generateInvoice"));
      // Order header
      order = OBProvider.getInstance().get(Order.class);
      long t111 = System.currentTimeMillis();
      createOrder(order, jsonorder);
      long t112 = System.currentTimeMillis();
      // Order lines
      ArrayList<OrderLine> lineReferences = new ArrayList<OrderLine>();
      JSONArray orderlines = jsonorder.getJSONArray("lines");
      createOrderLines(order, jsonorder, orderlines, lineReferences);

      long t113 = System.currentTimeMillis();
      // Shipment header
      shipment = OBProvider.getInstance().get(ShipmentInOut.class);
      createShipment(shipment, order, jsonorder);

      long t114 = System.currentTimeMillis();
      // Shipment lines
      createShipmentLines(shipment, order, jsonorder, orderlines, lineReferences);
      long t115 = System.currentTimeMillis();
      if (createInvoice) {
        // Invoice header
        invoice = OBProvider.getInstance().get(Invoice.class);
        createInvoice(invoice, order, jsonorder);

        // Invoice lines
        createInvoiceLines(invoice, order, jsonorder, orderlines, lineReferences);
      }
      t11 = System.currentTimeMillis();
      OBDal.getInstance().save(order);
      OBDal.getInstance().save(shipment);
      if (invoice != null) {
        OBDal.getInstance().save(invoice);
      }
      t2 = System.currentTimeMillis();
      OBDal.getInstance().flush();
      t3 = System.currentTimeMillis();
      log.debug("Creation of bobs. Order: " + (t112 - t111) + "; Orderlines: " + (t113 - t112)
          + "; Shipment: " + (t114 - t113) + "; Shipmentlines: " + (t115 - t114) + "; Invoice: "
          + (t11 - t115));

    } finally {
      TriggerHandler.getInstance().enable();
    }

    long t4 = System.currentTimeMillis();

    // Payment
    JSONObject paymentResponse = handlePayments(jsonorder, order, invoice);
    if (paymentResponse != null) {
      return paymentResponse;
    }

    // Stock manipulation
    handleStock(shipment);

    log.info("Initial flush: " + (t1 - t0) + "; Generate bobs:" + (t11 - t1) + "; Save bobs:"
        + (t2 - t11) + "; First flush:" + (t3 - t2) + "; Second flush: " + (t4 - t3)
        + "; Process Payments:" + (System.currentTimeMillis() - t4));

    final JSONObject jsonResponse = new JSONObject();

    jsonResponse.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
    jsonResponse.put("result", "0");
    jsonResponse.put("data", jsonorder);

    return jsonResponse;
  }

  protected String getPaymentDescription() {
    if (paymentDescription == null) {
      String language = RequestContext.get().getVariablesSecureApp().getLanguage();
      paymentDescription = Utility.messageBD(new DalConnectionProvider(false), "OrderDocumentno",
          language);
    }
    return paymentDescription;
  }

  protected DocumentType getPaymentDocumentType(Organization org) {
    if (paymentDocTypes.get(DalUtil.getId(org)) != null) {
      return paymentDocTypes.get(DalUtil.getId(org));
    }
    final DocumentType docType = FIN_Utility.getDocumentType(org, AcctServer.DOCTYPE_ARReceipt);
    paymentDocTypes.put((String) DalUtil.getId(org), docType);
    return docType;

  }

  protected DocumentType getInvoiceDocumentType(String documentTypeId) {
    if (invoiceDocTypes.get(documentTypeId) != null) {
      return invoiceDocTypes.get(documentTypeId);
    }
    DocumentType orderDocType = OBDal.getInstance().get(DocumentType.class, documentTypeId);
    final DocumentType docType = orderDocType.getDocumentTypeForInvoice();
    invoiceDocTypes.put(documentTypeId, docType);
    if (docType == null) {
      throw new OBException(
          "There is no 'Document type for Invoice' defined for the specified Document Type. The document type for invoices can be configured in the Document Type window, and it should be configured for the document type: "
              + orderDocType.getName());
    }
    return docType;
  }

  protected DocumentType getShipmentDocumentType(String documentTypeId) {
    if (shipmentDocTypes.get(documentTypeId) != null) {
      return shipmentDocTypes.get(documentTypeId);
    }
    DocumentType orderDocType = OBDal.getInstance().get(DocumentType.class, documentTypeId);
    final DocumentType docType = orderDocType.getDocumentTypeForShipment();
    shipmentDocTypes.put(documentTypeId, docType);
    if (docType == null) {
      throw new OBException(
          "There is no 'Document type for Shipment' defined for the specified Document Type. The document type for shipments can be configured in the Document Type window, and it should be configured for the document type: "
              + orderDocType.getName());
    }
    return docType;
  }

  protected void createInvoiceLines(Invoice invoice, Order order, JSONObject jsonorder,
      JSONArray orderlines, ArrayList<OrderLine> lineReferences) throws JSONException {

    for (int i = 0; i < orderlines.length(); i++) {
      InvoiceLine line = OBProvider.getInstance().get(InvoiceLine.class);
      Entity inlineEntity = ModelProvider.getInstance().getEntity(InvoiceLine.class);
      fillBobFromJSON(inlineEntity, line, orderlines.getJSONObject(i));
      fillBobFromJSON(ModelProvider.getInstance().getEntity(InvoiceLine.class), line, jsonorder);
      line.setLineNo((long) ((i + 1) * 10));
      line.setLineNetAmount(BigDecimal.valueOf(orderlines.getJSONObject(i).getDouble("net")));
      BigDecimal qty = lineReferences.get(i).getOrderedQuantity();
      line.setInvoicedQuantity(qty);
      lineReferences.get(i).setInvoicedQuantity(qty);
      line.setInvoice(invoice);
      line.setSalesOrderLine(lineReferences.get(i));
      line.setGrossAmount(lineReferences.get(i).getLineGrossAmount());
      invoice.getInvoiceLineList().add(line);

      InvoiceLineTax tax = OBProvider.getInstance().get(InvoiceLineTax.class);
      tax.setLineNo((long) ((i + 1) * 10));
      tax.setTax(line.getTax());
      tax.setTaxableAmount(line.getLineNetAmount());
      tax.setTaxAmount(BigDecimal.valueOf(orderlines.getJSONObject(i).getDouble("taxAmount")));
      tax.setInvoice(invoice);
      tax.setInvoiceLine(line);
      line.getInvoiceLineTaxList().add(tax);
      invoice.getInvoiceLineTaxList().add(tax);
    }

  }

  protected void createInvoice(Invoice invoice, Order order, JSONObject jsonorder)
      throws JSONException {
    Entity invoiceEntity = ModelProvider.getInstance().getEntity(Invoice.class);
    fillBobFromJSON(invoiceEntity, invoice, jsonorder);

    invoice.setDocumentNo(null);
    invoice
        .setDocumentType(getInvoiceDocumentType((String) DalUtil.getId(order.getDocumentType())));
    invoice.setTransactionDocument(getInvoiceDocumentType((String) DalUtil.getId(order
        .getDocumentType())));
    invoice.setAccountingDate(order.getOrderDate());
    invoice.setInvoiceDate(order.getOrderDate());
    invoice.setSalesTransaction(true);
    invoice.setDocumentStatus("CO");
    invoice.setDocumentAction("RE");
    invoice.setAPRMProcessinvoice("RE");
    invoice.setSalesOrder(order);
    invoice.setPartnerAddress(OBDal.getInstance().get(Location.class,
        jsonorder.getJSONObject("bp").getString("locId")));
    invoice.setProcessed(true);
    invoice.setPaymentMethod((FIN_PaymentMethod) OBDal.getInstance().getProxy("FIN_PaymentMethod",
        jsonorder.getJSONObject("bp").getString("paymentMethod")));
    invoice.setPaymentTerms((PaymentTerm) OBDal.getInstance().getProxy("FinancialMgmtPaymentTerm",
        jsonorder.getJSONObject("bp").getString("paymentTerms")));
    invoice.setGrandTotalAmount(BigDecimal.valueOf(jsonorder.getDouble("gross")));
    invoice.setSummedLineAmount(BigDecimal.valueOf(jsonorder.getDouble("net")));
    invoice.setTotalPaid(BigDecimal.ZERO);
    invoice.setOutstandingAmount((BigDecimal.valueOf(jsonorder.getDouble("gross"))));
    invoice.setDueAmount((BigDecimal.valueOf(jsonorder.getDouble("gross"))));

    // Create invoice tax lines
    JSONObject taxes = jsonorder.getJSONObject("taxes");
    @SuppressWarnings("unchecked")
    Iterator<String> itKeys = taxes.keys();
    int i = 0;
    while (itKeys.hasNext()) {
      String taxId = (String) itKeys.next();
      JSONObject jsonOrderTax = taxes.getJSONObject(taxId);
      InvoiceTax invoiceTax = OBProvider.getInstance().get(InvoiceTax.class);
      TaxRate tax = (TaxRate) OBDal.getInstance().getProxy(
          ModelProvider.getInstance().getEntity(TaxRate.class).getName(), taxId);
      invoiceTax.setTax(tax);
      invoiceTax.setTaxableAmount(BigDecimal.valueOf(jsonOrderTax.getDouble("net")));
      invoiceTax.setTaxAmount(BigDecimal.valueOf(jsonOrderTax.getDouble("amount")));
      invoiceTax.setInvoice(invoice);
      invoiceTax.setLineNo((long) ((i + 1) * 10));
      i++;
      invoice.getInvoiceTaxList().add(invoiceTax);
    }

  }

  protected void createShipmentLines(ShipmentInOut shipment, Order order, JSONObject jsonorder,
      JSONArray orderlines, ArrayList<OrderLine> lineReferences) throws JSONException {
    int lineNo = 0;
    Entity shplineentity = ModelProvider.getInstance().getEntity(ShipmentInOutLine.class);
    for (int i = 0; i < orderlines.length(); i++) {
      String hqlWhereClause;

      OrderLine orderLine = lineReferences.get(i);
      BigDecimal pendingQty = orderLine.getOrderedQuantity();

      if (pendingQty.compareTo(BigDecimal.ZERO) > 0) {
        // Returns have qty<0
        // In case of standard sales (no return), take bins with product ordered by prio. Using same
        // logic as in M_InOut_Create PL code
        hqlWhereClause = " as t, Locator as l" + " where t.product = :product"
            + "   and t.uOM = :uom" + "   and l.warehouse = :warehouse" + "   and t.storageBin = l"
            + "   and l.active = true" + "   and coalesce(t.quantityOnHand,0)>0"
            + " order by l.relativePriority, t.creationDate";

        OBQuery<StorageDetail> query = OBDal.getInstance().createQuery(StorageDetail.class,
            hqlWhereClause);
        query.setNamedParameter("product", orderLine.getProduct());
        query.setNamedParameter("uom", orderLine.getUOM());
        query.setNamedParameter("warehouse", order.getWarehouse());

        ScrollableResults bins = query.scroll(ScrollMode.FORWARD_ONLY);
        while (pendingQty.compareTo(BigDecimal.ZERO) > 0 && bins.next()) {
          StorageDetail storage = (StorageDetail) bins.get(0);
          BigDecimal qty;

          if (pendingQty.compareTo(storage.getQuantityOnHand()) > 0) {
            qty = storage.getQuantityOnHand();
            pendingQty = pendingQty.subtract(qty);
          } else {
            qty = pendingQty;
            pendingQty = BigDecimal.ZERO;
          }
          lineNo += 10;
          addShipemntline(shipment, shplineentity, orderlines.getJSONObject(i), orderLine,
              jsonorder, lineNo, qty, storage.getStorageBin());
        }
      }

      if (pendingQty.compareTo(BigDecimal.ZERO) != 0) {
        // still qty to ship or return: let's use the bin with highest prio
        hqlWhereClause = " l where l.warehouse = :warehouse order by l.relativePriority, l.id";
        OBQuery<Locator> queryLoc = OBDal.getInstance().createQuery(Locator.class, hqlWhereClause);
        queryLoc.setNamedParameter("warehouse", order.getWarehouse());
        queryLoc.setMaxResult(1);
        lineNo += 10;
        addShipemntline(shipment, shplineentity, orderlines.getJSONObject(i), orderLine, jsonorder,
            lineNo, pendingQty, queryLoc.list().get(0));
      }
    }
  }

  private void addShipemntline(ShipmentInOut shipment, Entity shplineentity,
      JSONObject jsonOrderLine, OrderLine orderLine, JSONObject jsonorder, long lineNo,
      BigDecimal qty, Locator bin) throws JSONException {
    ShipmentInOutLine line = OBProvider.getInstance().get(ShipmentInOutLine.class);

    fillBobFromJSON(shplineentity, line, jsonOrderLine);
    fillBobFromJSON(ModelProvider.getInstance().getEntity(ShipmentInOutLine.class), line, jsonorder);
    line.setLineNo(lineNo);
    line.setShipmentReceipt(shipment);
    line.setSalesOrderLine(orderLine);

    line.setMovementQuantity(qty);
    line.setStorageBin(bin);
    shipment.getMaterialMgmtShipmentInOutLineList().add(line);
  }

  protected void createShipment(ShipmentInOut shipment, Order order, JSONObject jsonorder)
      throws JSONException {
    Entity shpEntity = ModelProvider.getInstance().getEntity(ShipmentInOut.class);
    fillBobFromJSON(shpEntity, shipment, jsonorder);
    shipment.setDocumentNo(null);
    shipment
        .setDocumentType(getShipmentDocumentType((String) DalUtil.getId(order.getDocumentType())));
    shipment.setAccountingDate(order.getOrderDate());
    shipment.setMovementDate(order.getOrderDate());
    shipment.setPartnerAddress(OBDal.getInstance().get(Location.class,
        jsonorder.getJSONObject("bp").getString("locId")));
    shipment.setSalesTransaction(true);
    shipment.setDocumentStatus("CO");
    shipment.setDocumentAction("--");
    shipment.setMovementType("C-");
    shipment.setProcessNow(false);
    shipment.setProcessed(true);
    shipment.setSalesOrder(order);

  }

  protected void createOrderLines(Order order, JSONObject jsonorder, JSONArray orderlines,
      ArrayList<OrderLine> lineReferences) throws JSONException {
    for (int i = 0; i < orderlines.length(); i++) {

      OrderLine orderline = OBProvider.getInstance().get(OrderLine.class);
      Entity orderLineEntity = ModelProvider.getInstance().getEntity(OrderLine.class);
      JSONObject jsonOrderLine = orderlines.getJSONObject(i);

      fillBobFromJSON(orderLineEntity, orderline, jsonOrderLine);
      fillBobFromJSON(ModelProvider.getInstance().getEntity(OrderLine.class), orderline, jsonorder);
      orderline.setActive(true);
      orderline.setSalesOrder(order);
      orderline.setLineNetAmount(BigDecimal.valueOf(jsonOrderLine.getDouble("net")));
      orderline.setListPrice(orderline.getUnitPrice());

      orderline.setLineGrossAmount(BigDecimal.valueOf(jsonOrderLine.getDouble("gross")));

      // shipment is created, so all is delivered
      orderline.setDeliveredQuantity(orderline.getOrderedQuantity());

      BigDecimal discount = BigDecimal.ZERO;
      if (!orderline.getGrossListPrice().equals(orderline.getGrossUnitPrice())) {
        discount = orderline.getGrossListPrice().subtract(orderline.getGrossUnitPrice())
            .multiply(new BigDecimal("100"))
            .divide(orderline.getGrossListPrice(), 2, BigDecimal.ROUND_HALF_EVEN);
      }
      orderline.setDiscount(discount);

      lineReferences.add(orderline);
      orderline.setLineNo((long) ((i + 1) * 10));
      order.getOrderLineList().add(orderline);

      OrderLineTax tax = OBProvider.getInstance().get(OrderLineTax.class);
      tax.setLineNo((long) ((i + 1) * 10));
      tax.setTax(orderline.getTax());
      tax.setTaxableAmount(orderline.getLineNetAmount());
      tax.setTaxAmount(BigDecimal.valueOf(orderlines.getJSONObject(i).getDouble("taxAmount")));
      tax.setSalesOrder(order);
      tax.setSalesOrderLine(orderline);
      orderline.getOrderLineTaxList().add(tax);
      order.getOrderLineTaxList().add(tax);

    }
  }

  protected void createOrder(Order order, JSONObject jsonorder) throws JSONException {
    Entity orderEntity = ModelProvider.getInstance().getEntity(Order.class);
    fillBobFromJSON(orderEntity, order, jsonorder);

    order.setTransactionDocument((DocumentType) OBDal.getInstance().getProxy("DocumentType",
        jsonorder.getString("documentType")));
    order.setAccountingDate(order.getOrderDate());
    order.setScheduledDeliveryDate(order.getOrderDate());
    order.setPartnerAddress(OBDal.getInstance().get(Location.class,
        jsonorder.getJSONObject("bp").getString("locId")));
    order.setInvoiceAddress(order.getPartnerAddress());
    order.setPaymentMethod((FIN_PaymentMethod) OBDal.getInstance().getProxy("FIN_PaymentMethod",
        jsonorder.getJSONObject("bp").getString("paymentMethod")));
    order.setPaymentTerms((PaymentTerm) OBDal.getInstance().getProxy("FinancialMgmtPaymentTerm",
        jsonorder.getJSONObject("bp").getString("paymentTerms")));
    order.setInvoiceTerms(jsonorder.getJSONObject("bp").getString("invoiceTerms"));
    order.setGrandTotalAmount(BigDecimal.valueOf(jsonorder.getDouble("gross")));
    order.setSummedLineAmount(BigDecimal.valueOf(jsonorder.getDouble("net")));

    order.setSalesTransaction(true);
    order.setDocumentStatus("CO");
    order.setDocumentAction("--");
    order.setProcessed(true);
    order.setProcessNow(false);

    JSONObject taxes = jsonorder.getJSONObject("taxes");
    @SuppressWarnings("unchecked")
    Iterator<String> itKeys = taxes.keys();
    int i = 0;
    while (itKeys.hasNext()) {
      String taxId = (String) itKeys.next();
      JSONObject jsonOrderTax = taxes.getJSONObject(taxId);
      OrderTax orderTax = OBProvider.getInstance().get(OrderTax.class);
      TaxRate tax = (TaxRate) OBDal.getInstance().getProxy(
          ModelProvider.getInstance().getEntity(TaxRate.class).getName(), taxId);
      orderTax.setTax(tax);
      orderTax.setTaxableAmount(BigDecimal.valueOf(jsonOrderTax.getDouble("net")));
      orderTax.setTaxAmount(BigDecimal.valueOf(jsonOrderTax.getDouble("amount")));
      orderTax.setSalesOrder(order);
      orderTax.setLineNo((long) ((i + 1) * 10));
      i++;
      order.getOrderTaxList().add(orderTax);
    }
  }

  protected void handleStock(ShipmentInOut shipment) {
    for (ShipmentInOutLine line : shipment.getMaterialMgmtShipmentInOutLineList()) {
      MaterialTransaction transaction = OBProvider.getInstance().get(MaterialTransaction.class);
      transaction.setMovementType(shipment.getMovementType());
      transaction.setProduct(line.getProduct());
      transaction.setStorageBin(line.getStorageBin());
      transaction.setOrderUOM(line.getOrderUOM());
      transaction.setUOM(line.getUOM());
      transaction.setOrderQuantity(line.getOrderQuantity());
      transaction.setMovementQuantity(line.getMovementQuantity().multiply(NEGATIVE_ONE));
      transaction.setMovementDate(shipment.getMovementDate());
      transaction.setGoodsShipmentLine(line);

      OBDal.getInstance().save(transaction);
    }
  }

  protected JSONObject handlePayments(JSONObject jsonorder, Order order, Invoice invoice)
      throws JSONException {
    String posTerminalId = jsonorder.getString("posTerminal");
    OBPOSApplications posTerminal = OBDal.getInstance().get(OBPOSApplications.class, posTerminalId);
    if (posTerminal == null) {
      final JSONObject jsonResponse = new JSONObject();
      jsonResponse.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_FAILURE);
      jsonResponse.put(JsonConstants.RESPONSE_ERRORMESSAGE, "The POS terminal with id "
          + posTerminalId + " couldn't be found");
      return jsonResponse;
    } else {
      JSONArray payments = jsonorder.getJSONArray("payments");

      // Create a unique payment schedule for all payments
      BigDecimal amt = BigDecimal.valueOf(jsonorder.getDouble("payment"));
      FIN_PaymentSchedule paymentSchedule = OBProvider.getInstance().get(FIN_PaymentSchedule.class);
      paymentSchedule.setCurrency(order.getCurrency());
      paymentSchedule.setOrder(order);
      paymentSchedule.setFinPaymentmethod(order.getBusinessPartner().getPaymentMethod());
      paymentSchedule.setAmount(amt);
      paymentSchedule.setOutstandingAmount(amt);
      paymentSchedule.setDueDate(order.getOrderDate());
      paymentSchedule.setFINPaymentPriority(order.getFINPaymentPriority());
      OBDal.getInstance().save(paymentSchedule);

      FIN_PaymentSchedule paymentScheduleInvoice = null;
      if (invoice != null) {
        paymentScheduleInvoice = OBProvider.getInstance().get(FIN_PaymentSchedule.class);
        paymentScheduleInvoice.setCurrency(order.getCurrency());
        paymentScheduleInvoice.setInvoice(invoice);
        paymentScheduleInvoice.setFinPaymentmethod(order.getBusinessPartner().getPaymentMethod());
        paymentScheduleInvoice.setAmount(amt);
        paymentScheduleInvoice.setOutstandingAmount(amt);
        paymentScheduleInvoice.setDueDate(order.getOrderDate());
        paymentScheduleInvoice.setFINPaymentPriority(order.getFINPaymentPriority());

        OBDal.getInstance().save(paymentScheduleInvoice);
      }

      for (int i = 0; i < payments.length(); i++) {
        JSONObject payment = payments.getJSONObject(i);
        OBPOSAppPayment paymentType = null;
        String paymentTypeName = payment.getString("kind");
        for (OBPOSAppPayment type : posTerminal.getOBPOSAppPaymentList()) {
          if (type.getSearchKey().equals(paymentTypeName)) {
            paymentType = type;
          }
        }
        if (paymentType == null) {
          final JSONObject jsonResponse = new JSONObject();
          jsonResponse.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_FAILURE);
          jsonResponse.put(JsonConstants.RESPONSE_ERRORMESSAGE, "The POS terminal with id "
              + posTerminalId + " didn't have a payment defined with name: " + paymentTypeName);
          return jsonResponse;
        } else {
          processPayments(paymentSchedule, paymentScheduleInvoice, order, invoice, paymentType,
              payment);
        }
      }

      return null;
    }

  }

  protected void processPayments(FIN_PaymentSchedule paymentSchedule,
      FIN_PaymentSchedule paymentScheduleInvoice, Order order, Invoice invoice,
      OBPOSAppPayment paymentType, JSONObject payment) throws JSONException {
    long t1 = System.currentTimeMillis();
    OBContext.setAdminMode(true);
    try {
      BigDecimal amount = BigDecimal.valueOf(payment.getDouble("paid"));

      FIN_PaymentScheduleDetail paymentScheduleDetail = OBProvider.getInstance().get(
          FIN_PaymentScheduleDetail.class);
      paymentScheduleDetail.setOrderPaymentSchedule(paymentSchedule);
      paymentScheduleDetail.setAmount(amount);
      paymentSchedule.getFINPaymentScheduleDetailOrderPaymentScheduleList().add(
          paymentScheduleDetail);

      OBDal.getInstance().save(paymentScheduleDetail);
      if (paymentScheduleInvoice != null) {
        paymentScheduleInvoice.getFINPaymentScheduleDetailInvoicePaymentScheduleList().add(
            paymentScheduleDetail);
        paymentScheduleDetail.setInvoicePaymentSchedule(paymentScheduleInvoice);

        Fin_OrigPaymentSchedule origPaymentSchedule = OBProvider.getInstance().get(
            Fin_OrigPaymentSchedule.class);
        origPaymentSchedule.setCurrency(order.getCurrency());
        origPaymentSchedule.setInvoice(invoice);
        origPaymentSchedule.setPaymentMethod(paymentSchedule.getFinPaymentmethod());
        origPaymentSchedule.setAmount(amount);
        origPaymentSchedule.setDueDate(order.getOrderDate());
        origPaymentSchedule.setPaymentPriority(paymentScheduleInvoice.getFINPaymentPriority());

        OBDal.getInstance().save(origPaymentSchedule);

        FIN_OrigPaymentScheduleDetail origDetail = OBProvider.getInstance().get(
            FIN_OrigPaymentScheduleDetail.class);
        origDetail.setArchivedPaymentPlan(origPaymentSchedule);
        origDetail.setPaymentScheduleDetail(paymentScheduleDetail);
        origDetail.setAmount(amount);
        origDetail.setWriteoffAmount(paymentScheduleDetail.getWriteoffAmount());

        OBDal.getInstance().save(origDetail);

      }

      HashMap<String, BigDecimal> paymentAmount = new HashMap<String, BigDecimal>();
      paymentAmount.put(paymentScheduleDetail.getId(), amount);

      FIN_FinancialAccount account = paymentType.getFinancialAccount();

      long t2 = System.currentTimeMillis();
      // Save Payment

      List<FIN_PaymentScheduleDetail> detail = new ArrayList<FIN_PaymentScheduleDetail>();
      detail.add(paymentScheduleDetail);

      FIN_Payment finPayment = FIN_AddPayment.savePayment(null, true,
          getPaymentDocumentType(order.getOrganization()), order.getDocumentNo(),
          order.getBusinessPartner(), paymentType.getPaymentMethod().getPaymentMethod(), account,
          amount.toString(), order.getOrderDate(), order.getOrganization(), null, detail,
          paymentAmount, false, false);
      String description = getPaymentDescription();
      description += ": " + order.getDocumentNo().substring(1, order.getDocumentNo().length() - 1)
          + "\n";
      finPayment.setDescription(description);

      long t3 = System.currentTimeMillis();
      // Process Payment

      VariablesSecureApp vars = RequestContext.get().getVariablesSecureApp();
      ProcessBundle pb = new ProcessBundle("6255BE488882480599C81284B70CD9B3", vars)
          .init(new DalConnectionProvider(false));
      HashMap<String, Object> parameters = new HashMap<String, Object>();
      parameters.put("action", "D");
      parameters.put("Fin_Payment_ID", finPayment.getId());
      parameters.put("isPOSOrder", "Y");
      pb.setParams(parameters);
      new FIN_PaymentProcess().execute(pb);
      vars.setSessionValue("POSOrder", "Y");
      log.debug("Payment. Create entities: " + (t2 - t1) + "; Save payment: " + (t3 - t2)
          + "; Process payment: " + (System.currentTimeMillis() - t3));
    } catch (Exception e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
    } finally {
      OBContext.restorePreviousMode();
    }

  }

  protected void fillBobFromJSON(Entity entity, BaseOBObject bob, JSONObject json)
      throws JSONException {
    @SuppressWarnings("unchecked")
    Iterator<String> keys = json.keys();
    while (keys.hasNext()) {
      String key = keys.next();
      if (key.equals("id")) {
        continue;
      }
      String oldKey = key;
      if (entity.hasProperty(key)) {
        log.debug("Found property: " + key + " in entity " + entity.getName());
      } else {
        key = getEquivalentKey(key);
        if (key == null) {
          log.debug("Did not find property: " + oldKey);
          continue;
        } else {
          if (entity.hasProperty(key)) {
            log.debug("Found equivalent key: " + key);
          } else {
            log.debug("Did not find property: " + oldKey);
            continue;
          }
        }
      }

      Property p = entity.getProperty(key);
      Object value = json.get(oldKey);
      if (p.isPrimitive()) {
        if (p.isDate()) {
          bob.set(p.getName(),
              (Date) JsonToDataConverter.convertJsonToPropertyValue(PropertyByType.DATE, value));
        } else if (p.isNumericType()) {
          value = json.getString(oldKey);
          bob.set(key, new BigDecimal((String) value));
        } else {
          bob.set(p.getName(), value);
        }
      } else {
        Property refProp = p.getReferencedProperty();
        Entity refEntity = refProp.getEntity();
        if (value instanceof JSONObject) {
          value = ((JSONObject) value).getString("id");
        }
        BaseOBObject refBob = OBDal.getInstance().getProxy(refEntity.getName(), value.toString());
        bob.set(p.getName(), refBob);
      }

    }
  }

  public static String getErrorMessage(Exception e) {
    StringBuffer sb = new StringBuffer();
    Throwable et = e;
    while (et != null) {
      sb.append(et.getMessage() + "\n");
      if (et instanceof SQLException) {
        et = ((SQLException) et).getNextException();
      } else {
        et = et.getCause();
      }
    }
    return sb.toString();
  }

  private static String getEquivalentKey(String key) {
    if (key.equals("bp")) {
      return "businessPartner";
    } else if (key.equals("bploc")) {
      return "partnerAddress";
    } else if (key.equals("qty")) {
      return "orderedQuantity";
    } else if (key.equals("price")) {
      return "grossUnitPrice";
    } else if (key.equals("posTerminal")) {
      return "obposApplications";
    } else if (key.equals("pricenet")) {
      return "unitPrice";
    }
    return null;
  }
}
