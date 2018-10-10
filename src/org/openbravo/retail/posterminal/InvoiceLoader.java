/*
 ************************************************************************************
 * Copyright (C) 2018 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.enterprise.inject.Any;
import javax.enterprise.inject.Instance;
import javax.inject.Inject;

import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.criterion.Restrictions;
import org.openbravo.advpaymentmngt.utility.FIN_Utility;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.core.TriggerHandler;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.businessUtility.Preferences;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.erpCommon.utility.PropertyException;
import org.openbravo.mobile.core.process.DataSynchronizationImportProcess;
import org.openbravo.mobile.core.process.JSONPropertyToEntity;
import org.openbravo.mobile.core.utils.OBMOBCUtils;
import org.openbravo.model.ad.access.InvoiceLineTax;
import org.openbravo.model.common.businesspartner.Location;
import org.openbravo.model.common.enterprise.DocumentType;
import org.openbravo.model.common.invoice.Invoice;
import org.openbravo.model.common.invoice.InvoiceLine;
import org.openbravo.model.common.invoice.InvoiceLineOffer;
import org.openbravo.model.common.invoice.InvoiceTax;
import org.openbravo.model.common.order.Order;
import org.openbravo.model.common.order.OrderLine;
import org.openbravo.model.financialmgmt.payment.FIN_Payment;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentSchedule;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentScheduleDetail;
import org.openbravo.model.financialmgmt.payment.PaymentTerm;
import org.openbravo.model.financialmgmt.payment.PaymentTermLine;
import org.openbravo.model.financialmgmt.tax.TaxRate;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOut;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOutLine;
import org.openbravo.retail.posterminal.utility.DocumentNoHandler;
import org.openbravo.service.db.CallStoredProcedure;
import org.openbravo.service.json.JsonConstants;

public class InvoiceLoader extends POSDataSynchronizationProcess implements
    DataSynchronizationImportProcess {

  private static final String STATUS_PAYMENT_RECEIVED = "RPR";

  private static final Logger log = Logger.getLogger(InvoiceLoader.class);

  // DocumentNo Handlers are used to collect all needed document numbers and create and set
  // them as late in the process as possible
  private static ThreadLocal<List<DocumentNoHandler>> documentNoHandlers = new ThreadLocal<List<DocumentNoHandler>>();

  private static void addDocumentNoHandler(BaseOBObject bob, Entity entity,
      DocumentType docTypeTarget, DocumentType docType) {
    documentNoHandlers.get().add(new DocumentNoHandler(bob, entity, docTypeTarget, docType));
  }

  HashMap<String, DocumentType> paymentDocTypes = new HashMap<String, DocumentType>();
  HashMap<String, DocumentType> invoiceDocTypes = new HashMap<String, DocumentType>();
  HashMap<String, DocumentType> shipmentDocTypes = new HashMap<String, DocumentType>();
  HashMap<String, JSONArray> invoicelineserviceList;
  String paymentDescription = null;

  @Inject
  @Any
  private Instance<InvoiceLoaderHook> invoiceProcesses;

  @Inject
  @Any
  private Instance<InvoiceLoaderPreProcessHook> invoicePreProcesses;

  @Inject
  @Any
  private Instance<InvoiceLoaderCreateInvoicelineHook> createInvoiceLineProcesses;

  private boolean useOrderDocumentNoForRelatedDocs = false;

  protected String getImportQualifier() {
    return "OBPOS_Invoice";
  }

  @Override
  public JSONObject saveRecord(JSONObject jsoninvoice) throws Exception {

    try {
      try {
        useOrderDocumentNoForRelatedDocs = "Y".equals(Preferences.getPreferenceValue(
            "OBPOS_UseOrderDocumentNoForRelatedDocs", true, OBContext.getOBContext()
                .getCurrentClient(), OBContext.getOBContext().getCurrentOrganization(), OBContext
                .getOBContext().getUser(), OBContext.getOBContext().getRole(), null));
      } catch (PropertyException e1) {
        log.error(
            "Error getting OBPOS_UseOrderDocumentNoForRelatedDocs preference: " + e1.getMessage(),
            e1);
      }

      documentNoHandlers.set(new ArrayList<DocumentNoHandler>());

      executeHooks(invoicePreProcesses, jsoninvoice, null, null, null, null);
      boolean wasPaidOnCredit = Math.abs(jsoninvoice.getDouble("payment")) < Math.abs(new Double(
          jsoninvoice.getDouble("gross")));

      Order order = null;
      ShipmentInOut shipment = null;
      Invoice invoice = null;

      TriggerHandler.getInstance().disable();
      try {

        ArrayList<OrderLine> lineReferences = new ArrayList<OrderLine>();
        JSONArray invoicelines = jsoninvoice.getJSONArray("lines");

        order = OBDal.getInstance().get(Order.class, jsoninvoice.getString("orderId"));

        for (int i = 0; i < invoicelines.length(); i++) {
          lineReferences.add(OBDal.getInstance().get(OrderLine.class,
              invoicelines.getJSONObject(i).getString("orderLineId")));
        }

        // Invoice header
        invoice = OBProvider.getInstance().get(Invoice.class);
        createInvoice(invoice, order, jsoninvoice);
        OBDal.getInstance().save(invoice);

        // Invoice lines
        createInvoiceLines(invoice, order, jsoninvoice, invoicelines, lineReferences);

        updateAuditInfo(invoice, jsoninvoice);

        // if (!paidReceipt) {
        // do the docnumbers at the end
        OBContext.setAdminMode(false);
        try {
          for (DocumentNoHandler documentNoHandler : documentNoHandlers.get()) {
            documentNoHandler.setDocumentNoAndSave();
          }
          OBDal.getInstance().flush();
        } finally {
          // set to null, should not be used anymore after this.
          documentNoHandlers.set(null);
          OBContext.restorePreviousMode();
        }
        // }

      } catch (Exception ex) {
        throw new OBException("Error in InvoiceLoader: ", ex);
      } finally {
        // flush and enable triggers, the rest of this method needs enabled
        // triggers
        try {
          OBDal.getInstance().flush();
          TriggerHandler.getInstance().enable();
        } catch (Throwable ignored) {
        }
      }

      // Payment
      JSONObject paymentResponse = handlePayments(jsoninvoice, order, invoice, wasPaidOnCredit);
      if (paymentResponse.getInt(JsonConstants.RESPONSE_STATUS) == JsonConstants.RPCREQUEST_STATUS_FAILURE) {
        return paymentResponse;
      }

      // Call all OrderProcess injected.
      executeHooks(invoiceProcesses, jsoninvoice, order, shipment, invoice, null);

      OBDal.getInstance().flush();

      return successMessage(jsoninvoice);
    } finally {
      documentNoHandlers.set(null);
    }
  }

  protected void executeHooks(Instance<? extends Object> hooks, JSONObject jsoninvoice,
      Order order, ShipmentInOut shipment, Invoice invoice, InvoiceLine invoiceLine)
      throws Exception {

    for (Iterator<? extends Object> procIter = hooks.iterator(); procIter.hasNext();) {
      Object proc = procIter.next();
      if (proc instanceof OrderLoaderHook) {
        ((InvoiceLoaderHook) proc).exec(jsoninvoice, order, shipment, invoice);
      } else if (proc instanceof OrderLoaderCreateOrderlineHook) {
        ((InvoiceLoaderCreateInvoicelineHook) proc).exec(jsoninvoice, invoiceLine);
      } else {
        ((InvoiceLoaderPreProcessHook) proc).exec(jsoninvoice);
      }
    }
  }

  private void updateAuditInfo(Invoice invoice, JSONObject jsoninvoice) throws JSONException {
    Long value = jsoninvoice.getLong("created");
    invoice.set("creationDate", new Date(value));
  }

  protected JSONObject successMessage(JSONObject jsoninvoice) throws Exception {
    final JSONObject jsonResponse = new JSONObject();

    jsonResponse.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
    jsonResponse.put("result", "0");
    return jsonResponse;
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

  private void createInvoiceLine(Invoice invoice, Order order, JSONObject jsoninvoice,
      JSONArray invoicelines, ArrayList<OrderLine> lineReferences, int numIter, int pricePrecision,
      ShipmentInOutLine inOutLine, int lineNo, int numLines, int actualLine,
      BigDecimal movementQtyTotal) throws JSONException {

    if (lineReferences.get(numIter).getObposQtyDeleted() != null
        && lineReferences.get(numIter).getObposQtyDeleted().compareTo(BigDecimal.ZERO) != 0) {
      return;
    }

    boolean deliveredQtyEqualsToMovementQty = movementQtyTotal.compareTo(lineReferences
        .get(numIter).getOrderedQuantity()) == 0;

    Entity promotionLineEntity = ModelProvider.getInstance().getEntity(InvoiceLineOffer.class);
    InvoiceLine line = OBProvider.getInstance().get(InvoiceLine.class);
    Entity inlineEntity = ModelProvider.getInstance().getEntity(InvoiceLine.class);
    JSONPropertyToEntity.fillBobFromJSON(inlineEntity, line, invoicelines.getJSONObject(numIter),
        jsoninvoice.getLong("timezoneOffset"));
    JSONPropertyToEntity.fillBobFromJSON(ModelProvider.getInstance().getEntity(InvoiceLine.class),
        line, jsoninvoice, jsoninvoice.getLong("timezoneOffset"));
    line.setNewOBObject(true);
    line.set("creationDate", invoice.getCreationDate());
    line.setLineNo((long) lineNo);
    line.setDescription(invoicelines.getJSONObject(numIter).has("description") ? invoicelines
        .getJSONObject(numIter).getString("description") : "");

    final BigDecimal orderedQuantity = BigDecimal.valueOf(invoicelines.getJSONObject(numIter)
        .getDouble("qty"));
    final BigDecimal lineGrossAmount = BigDecimal.valueOf(invoicelines.getJSONObject(numIter)
        .getDouble("lineGrossAmount"));
    final BigDecimal lineNetAmount = BigDecimal.valueOf(invoicelines.getJSONObject(numIter)
        .getDouble("net"));

    BigDecimal movQty = null;
    if (inOutLine != null && inOutLine.getMovementQuantity() != null) {
      movQty = inOutLine.getMovementQuantity();
    } else if (inOutLine == null && movementQtyTotal.compareTo(BigDecimal.ZERO) != 0) {
      movQty = orderedQuantity.subtract(movementQtyTotal);
    } else {
      movQty = orderedQuantity;
    }

    BigDecimal ratio = movQty.divide(orderedQuantity, 32, RoundingMode.HALF_UP);

    BigDecimal qty = movQty;

    // if ratio equals to one, then only one shipment line is related to orderline, then lineNetAmt
    // and gross is populated from JSON
    if (ratio.compareTo(BigDecimal.ONE) != 0) {
      // if there are several shipments line to the same orderline, in the last line of the invoice
      // of this sales order line, the line net amt will be the pending line net amount
      if (numLines > actualLine || (numLines == actualLine && !deliveredQtyEqualsToMovementQty)) {
        line.setLineNetAmount(lineReferences.get(numIter).getUnitPrice().multiply(qty)
            .setScale(pricePrecision, RoundingMode.HALF_UP));
        line.setGrossAmount(lineReferences.get(numIter).getGrossUnitPrice().multiply(qty)
            .setScale(pricePrecision, RoundingMode.HALF_UP));
      } else {
        BigDecimal partialGrossAmount = BigDecimal.ZERO;
        BigDecimal partialLineNetAmount = BigDecimal.ZERO;
        for (InvoiceLine il : invoice.getInvoiceLineList()) {
          if (il.getSalesOrderLine() != null
              && il.getSalesOrderLine().getId() == lineReferences.get(numIter).getId()) {
            partialGrossAmount = partialGrossAmount.add(il.getGrossAmount());
            partialLineNetAmount = partialLineNetAmount.add(il.getLineNetAmount());
          }
        }
        line.setLineNetAmount(lineNetAmount.subtract(partialLineNetAmount).setScale(pricePrecision,
            RoundingMode.HALF_UP));
        line.setGrossAmount(lineGrossAmount.subtract(partialGrossAmount).setScale(pricePrecision,
            RoundingMode.HALF_UP));
      }
    } else {
      line.setLineNetAmount(lineNetAmount.setScale(pricePrecision, RoundingMode.HALF_UP));
      line.setGrossAmount(lineGrossAmount.setScale(pricePrecision, RoundingMode.HALF_UP));
    }

    line.setInvoicedQuantity(qty);
    lineReferences.get(numIter).setInvoicedQuantity(
        (lineReferences.get(numIter).getInvoicedQuantity() != null ? lineReferences.get(numIter)
            .getInvoicedQuantity().add(qty) : qty));
    line.setInvoice(invoice);
    line.setSalesOrderLine(lineReferences.get(numIter));
    line.setGoodsShipmentLine(inOutLine);
    line.setAttributeSetValue(lineReferences.get(numIter).getAttributeSetValue());
    invoice.getInvoiceLineList().add(line);
    OBDal.getInstance().save(line);

    try {
      executeHooks(createInvoiceLineProcesses, invoicelines.getJSONObject(numIter), null, null,
          null, line);
    } catch (Exception e) {
      throw new OBException("Error in OrderLoader Create invoicelines Hook: ", e);
    }

    JSONObject taxes = invoicelines.getJSONObject(numIter).getJSONObject("taxLines");
    @SuppressWarnings("unchecked")
    Iterator<String> itKeys = taxes.keys();
    BigDecimal totalTaxAmount = BigDecimal.ZERO;
    int ind = 0;
    while (itKeys.hasNext()) {
      String taxId = itKeys.next();
      JSONObject jsoninvoiceTax = taxes.getJSONObject(taxId);
      InvoiceLineTax invoicelinetax = OBProvider.getInstance().get(InvoiceLineTax.class);
      TaxRate tax = (TaxRate) OBDal.getInstance().getProxy(
          ModelProvider.getInstance().getEntity(TaxRate.class).getName(), taxId);
      invoicelinetax.setTax(tax);

      final BigDecimal taxNetAmt = BigDecimal.valueOf(jsoninvoiceTax.getDouble("net"));
      final BigDecimal taxAmt = BigDecimal.valueOf(jsoninvoiceTax.getDouble("amount"));
      // if ratio equals to one, then only one shipment line is related to orderline, then
      // lineNetAmt and gross is populated from JSON
      if (ratio.compareTo(BigDecimal.ONE) != 0) {
        // if there are several shipments line to the same orderline, in the last line of the
        // splited lines, the tax amount will be calculated as the pending tax amount
        if (numLines > actualLine || (numLines == actualLine && !deliveredQtyEqualsToMovementQty)) {
          invoicelinetax.setTaxableAmount(taxNetAmt.multiply(ratio).setScale(pricePrecision,
              RoundingMode.HALF_UP));
          invoicelinetax.setTaxAmount(taxAmt.multiply(ratio).setScale(pricePrecision,
              RoundingMode.HALF_UP));
          totalTaxAmount = totalTaxAmount.add(invoicelinetax.getTaxAmount());
        } else {
          BigDecimal partialTaxableAmount = BigDecimal.ZERO;
          BigDecimal partialTaxAmount = BigDecimal.ZERO;
          for (InvoiceLineTax ilt : invoice.getInvoiceLineTaxList()) {
            if (ilt.getInvoiceLine().getSalesOrderLine() != null
                && ilt.getInvoiceLine().getSalesOrderLine().getId() == lineReferences.get(numIter)
                    .getId() && ilt.getTax() != null && ilt.getTax().getId() == tax.getId()) {
              partialTaxableAmount = partialTaxableAmount.add(ilt.getTaxableAmount());
              partialTaxAmount = partialTaxAmount.add(ilt.getTaxAmount());
            }
          }
          invoicelinetax.setTaxableAmount(taxNetAmt.subtract(partialTaxableAmount).setScale(
              pricePrecision, RoundingMode.HALF_UP));
          invoicelinetax.setTaxAmount(taxAmt.subtract(partialTaxAmount).setScale(pricePrecision,
              RoundingMode.HALF_UP));
        }
      } else {
        invoicelinetax.setTaxableAmount(taxNetAmt.setScale(pricePrecision, RoundingMode.HALF_UP));
        invoicelinetax.setTaxAmount(taxAmt.setScale(pricePrecision, RoundingMode.HALF_UP));
      }
      invoicelinetax.setInvoice(invoice);
      invoicelinetax.setInvoiceLine(line);
      invoicelinetax.setRecalculate(true);
      invoicelinetax.setLineNo((long) ((ind + 1) * 10));
      ind++;
      invoice.getInvoiceLineTaxList().add(invoicelinetax);
      line.getInvoiceLineTaxList().add(invoicelinetax);
      invoicelinetax.setId(OBMOBCUtils.getUUIDbyString(line.getSalesOrderLine().getId() + lineNo
          + (long) ((ind + 1) * 10)));
      invoicelinetax.setNewOBObject(true);
      OBDal.getInstance().save(invoicelinetax);
    }

    // Discounts & Promotions
    if (invoicelines.getJSONObject(numIter).has("promotions")
        && !invoicelines.getJSONObject(numIter).isNull("promotions")
        && !invoicelines.getJSONObject(numIter).getString("promotions").equals("null")) {
      JSONArray jsonPromotions = invoicelines.getJSONObject(numIter).getJSONArray("promotions");
      for (int p = 0; p < jsonPromotions.length(); p++) {
        JSONObject jsonPromotion = jsonPromotions.getJSONObject(p);
        boolean hasActualAmt = jsonPromotion.has("actualAmt");
        if (hasActualAmt && jsonPromotion.getDouble("actualAmt") == 0) {
          continue;
        }

        InvoiceLineOffer promotion = OBProvider.getInstance().get(InvoiceLineOffer.class);
        JSONPropertyToEntity.fillBobFromJSON(promotionLineEntity, promotion, jsonPromotion,
            jsoninvoice.getLong("timezoneOffset"));

        if (hasActualAmt) {
          promotion.setTotalAmount(BigDecimal.valueOf(jsonPromotion.getDouble("actualAmt"))
              .multiply(ratio).setScale(pricePrecision, RoundingMode.HALF_UP));
        } else {
          promotion.setTotalAmount(BigDecimal.valueOf(jsonPromotion.getDouble("amt"))
              .multiply(ratio).setScale(pricePrecision, RoundingMode.HALF_UP));
        }
        promotion.setLineNo((long) ((p + 1) * 10));
        promotion.setId(OBMOBCUtils.getUUIDbyString(line.getId() + p));
        promotion.setNewOBObject(true);
        promotion.setInvoiceLine(line);
        line.getInvoiceLineOfferList().add(promotion);
      }
    }

  }

  private void createInvoiceLines(Invoice invoice, Order order, JSONObject jsoninvoice,
      JSONArray invoicelines, ArrayList<OrderLine> lineReferences) throws JSONException {
    int pricePrecision = order.getCurrency().getObposPosprecision() == null ? order.getCurrency()
        .getPricePrecision().intValue() : order.getCurrency().getObposPosprecision().intValue();

    boolean multipleShipmentsLines = false;
    int lineNo = 0;
    for (int i = 0; i < invoicelines.length(); i++) {
      final OBCriteria<ShipmentInOutLine> iolCriteria = OBDal.getInstance().createCriteria(
          ShipmentInOutLine.class);
      iolCriteria.add(Restrictions.eq(ShipmentInOutLine.PROPERTY_SALESORDERLINE,
          lineReferences.get(i)));
      iolCriteria.addOrder(org.hibernate.criterion.Order.asc(ShipmentInOutLine.PROPERTY_LINENO));
      final List<ShipmentInOutLine> iolList = iolCriteria.list();
      if (iolList.size() > 1) {
        multipleShipmentsLines = true;
      }
      if (iolList.size() == 0) {
        lineNo = lineNo + 10;
        createInvoiceLine(invoice, order, jsoninvoice, invoicelines, lineReferences, i,
            pricePrecision, null, lineNo, iolList.size(), 1, BigDecimal.ZERO);
      } else {
        int numIter = 0;
        BigDecimal movementQtyTotal = BigDecimal.ZERO;
        for (ShipmentInOutLine iol : iolList) {
          movementQtyTotal = movementQtyTotal.add(iol.getMovementQuantity());
        }
        for (ShipmentInOutLine iol : iolList) {
          numIter++;
          lineNo = lineNo + 10;
          createInvoiceLine(invoice, order, jsoninvoice, invoicelines, lineReferences, i,
              pricePrecision, iol, lineNo, iolList.size(), numIter, movementQtyTotal);
        }
        if (movementQtyTotal.compareTo(BigDecimal.valueOf(invoicelines.getJSONObject(i).getDouble(
            "qty"))) == -1) {
          lineNo = lineNo + 10;
          createInvoiceLine(invoice, order, jsoninvoice, invoicelines, lineReferences, i,
              pricePrecision, null, lineNo, iolList.size(), iolList.size() + 1, movementQtyTotal);
        }
      }
    }
    if (multipleShipmentsLines) {
      updateTaxes(invoice);
    }
  }

  protected void createInvoice(Invoice invoice, Order order, JSONObject jsoninvoice)
      throws JSONException {
    Entity invoiceEntity = ModelProvider.getInstance().getEntity(Invoice.class);
    JSONPropertyToEntity.fillBobFromJSON(invoiceEntity, invoice, jsoninvoice,
        jsoninvoice.getLong("timezoneOffset"));
    if (jsoninvoice.has("id")) {
      invoice.setId(jsoninvoice.getString("id"));
      invoice.setNewOBObject(true);
    }
    int pricePrecision = order.getCurrency().getObposPosprecision() == null ? order.getCurrency()
        .getPricePrecision().intValue() : order.getCurrency().getObposPosprecision().intValue();

    String description = null;
    if (jsoninvoice.has("Invoice.description")) {
      // in case the description is directly set to Invoice entity, preserve it
      description = jsoninvoice.getString("Invoice.description");
    } else {
      // other case use generic description if present and add relationship to order
      description = OBMessageUtils.getI18NMessage("OBPOS_InvoiceRelatedToOrder", null)
          + jsoninvoice.getString("documentNo");
      if (jsoninvoice.has("description")
          && !StringUtils.isEmpty(jsoninvoice.getString("description"))) {
        description = StringUtils.substring(jsoninvoice.getString("description"), 0,
            255 - description.length() - 1) + "\n" + description;
      }
    }

    invoice.setDescription(description);
    invoice.setDocumentType(getInvoiceDocumentType(order.getDocumentType().getId()));
    invoice.setTransactionDocument(getInvoiceDocumentType(order.getDocumentType().getId()));

    if (useOrderDocumentNoForRelatedDocs) {
      invoice.setDocumentNo(order.getDocumentNo());
    } else {
      invoice.setDocumentNo(getDummyDocumentNo());
      addDocumentNoHandler(invoice, invoiceEntity, invoice.getTransactionDocument(),
          invoice.getDocumentType());
    }
    final Date orderDate = OBMOBCUtils.calculateServerDatetime(jsoninvoice.getString("orderDate"),
        Long.parseLong(jsoninvoice.getString("timezoneOffset")));
    Date now = new Date();
    invoice.set("creationDate", orderDate.after(now) ? now : orderDate);
    final Date invoiceDate = OBMOBCUtils.stripTime(orderDate);
    invoice.setAccountingDate(invoiceDate);
    invoice.setInvoiceDate(invoiceDate);
    invoice.setSalesTransaction(true);
    invoice.setDocumentStatus("CO");
    invoice.setDocumentAction("RE");
    invoice.setAPRMProcessinvoice("RE");
    invoice.setSalesOrder(order);
    invoice.setPartnerAddress(OBDal.getInstance().getProxy(Location.class,
        jsoninvoice.getJSONObject("bp").getString("locId")));
    invoice.setProcessed(true);
    invoice.setPaymentMethod(order.getPaymentMethod());
    invoice.setPaymentTerms(order.getPaymentTerms());
    invoice.setGrandTotalAmount(BigDecimal.valueOf(jsoninvoice.getDouble("gross")).setScale(
        pricePrecision, RoundingMode.HALF_UP));
    invoice.setSummedLineAmount(BigDecimal.valueOf(jsoninvoice.getDouble("net")).setScale(
        pricePrecision, RoundingMode.HALF_UP));
    invoice.setTotalPaid(BigDecimal.ZERO);
    invoice.setOutstandingAmount((BigDecimal.valueOf(jsoninvoice.getDouble("gross"))).setScale(
        pricePrecision, RoundingMode.HALF_UP));
    invoice.setDueAmount((BigDecimal.valueOf(jsoninvoice.getDouble("gross"))).setScale(
        pricePrecision, RoundingMode.HALF_UP));
    invoice.setUserContact(order.getUserContact());

    // Create invoice tax lines
    JSONObject taxes = jsoninvoice.getJSONObject("taxes");
    @SuppressWarnings("unchecked")
    Iterator<String> itKeys = taxes.keys();
    int i = 0;
    while (itKeys.hasNext()) {
      String taxId = itKeys.next();
      JSONObject jsoninvoiceTax = taxes.getJSONObject(taxId);
      InvoiceTax invoiceTax = OBProvider.getInstance().get(InvoiceTax.class);
      TaxRate tax = (TaxRate) OBDal.getInstance().getProxy(
          ModelProvider.getInstance().getEntity(TaxRate.class).getName(), taxId);
      invoiceTax.setTax(tax);
      invoiceTax.setTaxableAmount(BigDecimal.valueOf(jsoninvoiceTax.getDouble("net")).setScale(
          pricePrecision, RoundingMode.HALF_UP));
      invoiceTax.setTaxAmount(BigDecimal.valueOf(jsoninvoiceTax.getDouble("amount")).setScale(
          pricePrecision, RoundingMode.HALF_UP));
      invoiceTax.setInvoice(invoice);
      invoiceTax.setLineNo((long) ((i + 1) * 10));
      invoiceTax.setRecalculate(true);
      invoiceTax.setId(OBMOBCUtils.getUUIDbyString(invoiceTax.getInvoice().getId()
          + invoiceTax.getLineNo()));
      invoiceTax.setNewOBObject(true);
      i++;
      invoice.getInvoiceTaxList().add(invoiceTax);
    }

    // Update customer credit
    OBContext.setAdminMode(false);
    try {
      BigDecimal total = invoice.getGrandTotalAmount().setScale(pricePrecision,
          RoundingMode.HALF_UP);

      JSONArray payments = jsoninvoice.getJSONArray("payments");
      for (i = 0; i < payments.length(); i++) {
        JSONObject payment = payments.getJSONObject(i);
        if (payment.has("isPrePayment") && payment.getBoolean("isPrePayment")) {
          total = total.subtract(BigDecimal.valueOf(payment.getDouble("origAmount")).setScale(
              pricePrecision, RoundingMode.HALF_UP));
        }
      }

      if (!invoice.getCurrency().equals(invoice.getBusinessPartner().getPriceList().getCurrency())) {
        total = convertCurrencyInvoice(invoice);
      }

      // Same currency, no conversion required
      invoice.getBusinessPartner().setCreditUsed(
          invoice.getBusinessPartner().getCreditUsed().add(total));
      OBDal.getInstance().flush();
    } finally {
      OBContext.restorePreviousMode();
    }

  }

  protected void updateTaxes(Invoice invoice) throws JSONException {
    int pricePrecision = invoice.getCurrency().getObposPosprecision() == null ? invoice
        .getCurrency().getPricePrecision().intValue() : invoice.getCurrency()
        .getObposPosprecision().intValue();
    for (InvoiceTax taxInv : invoice.getInvoiceTaxList()) {
      BigDecimal taxAmt = BigDecimal.ZERO;
      BigDecimal taxableAmt = BigDecimal.ZERO;
      for (InvoiceLineTax taxLine : invoice.getInvoiceLineTaxList()) {
        if (taxLine.getTax() == taxInv.getTax()) {
          taxAmt = taxAmt.add(taxLine.getTaxAmount());
          taxableAmt = taxableAmt.add(taxLine.getTaxableAmount());
        }
      }
      taxInv.setTaxableAmount(taxableAmt.setScale(pricePrecision, RoundingMode.HALF_UP));
      taxInv.setTaxAmount(taxAmt.setScale(pricePrecision, RoundingMode.HALF_UP));
      OBDal.getInstance().save(taxInv);
    }
  }

  public static BigDecimal convertCurrencyInvoice(Invoice invoice) {
    int pricePrecision = invoice.getCurrency().getObposPosprecision() == null ? invoice
        .getCurrency().getPricePrecision().intValue() : invoice.getCurrency()
        .getObposPosprecision().intValue();
    List<Object> parameters = new ArrayList<Object>();
    List<Class<?>> types = new ArrayList<Class<?>>();
    parameters.add(invoice.getGrandTotalAmount().setScale(pricePrecision, RoundingMode.HALF_UP));
    types.add(BigDecimal.class);
    parameters.add(invoice.getCurrency());
    types.add(BaseOBObject.class);
    parameters.add(invoice.getBusinessPartner().getPriceList().getCurrency());
    types.add(BaseOBObject.class);
    parameters.add(invoice.getInvoiceDate());
    types.add(Timestamp.class);
    parameters.add("S");
    types.add(String.class);
    parameters.add(OBContext.getOBContext().getCurrentClient());
    types.add(BaseOBObject.class);
    parameters.add(OBContext.getOBContext().getCurrentOrganization());
    types.add(BaseOBObject.class);
    parameters.add('A');
    types.add(Character.class);

    return (BigDecimal) CallStoredProcedure.getInstance().call("c_currency_convert_precision",
        parameters, types);
  }

  private Date getCalculatedDueDateBasedOnPaymentTerms(Date startingDate, PaymentTerm paymentTerm,
      PaymentTermLine paymentTermLine) {
    // TODO Take into account the flag "Next business date"
    // TODO Take into account the flag "Fixed due date"
    Calendar calculatedDueDate = new GregorianCalendar();
    calculatedDueDate.setTime(startingDate);
    calculatedDueDate.set(Calendar.HOUR_OF_DAY, 0);
    calculatedDueDate.set(Calendar.MINUTE, 0);
    calculatedDueDate.set(Calendar.SECOND, 0);
    calculatedDueDate.set(Calendar.MILLISECOND, 0);
    long daysToAdd, monthOffset, maturityDate1 = 0, maturityDate2 = 0, maturityDate3 = 0;
    String dayToPay;

    if (paymentTerm != null) {
      daysToAdd = paymentTerm.getOverduePaymentDaysRule();
      monthOffset = paymentTerm.getOffsetMonthDue();
      dayToPay = paymentTerm.getOverduePaymentDayRule();
      if (paymentTerm.isFixedDueDate()) {
        maturityDate1 = paymentTerm.getMaturityDate1() == null ? 0 : paymentTerm.getMaturityDate1();
        maturityDate2 = paymentTerm.getMaturityDate2() == null ? 0 : paymentTerm.getMaturityDate2();
        maturityDate3 = paymentTerm.getMaturityDate3() == null ? 0 : paymentTerm.getMaturityDate3();
      }
    } else if (paymentTermLine != null) {
      daysToAdd = paymentTermLine.getOverduePaymentDaysRule();
      monthOffset = paymentTermLine.getOffsetMonthDue() == null ? 0 : paymentTermLine
          .getOffsetMonthDue();
      dayToPay = paymentTermLine.getOverduePaymentDayRule();
      if (paymentTermLine.isFixedDueDate()) {
        maturityDate1 = paymentTermLine.getMaturityDate1() == null ? 0 : paymentTermLine
            .getMaturityDate1();
        maturityDate2 = paymentTermLine.getMaturityDate2() == null ? 0 : paymentTermLine
            .getMaturityDate2();
        maturityDate3 = paymentTermLine.getMaturityDate3() == null ? 0 : paymentTermLine
            .getMaturityDate3();
      }
    } else {
      return calculatedDueDate.getTime();
    }
    if (monthOffset > 0) {
      calculatedDueDate.add(Calendar.MONTH, (int) monthOffset);
    }
    if (daysToAdd > 0) {
      calculatedDueDate.add(Calendar.DATE, (int) daysToAdd);
    }
    // Calculating due date based on "Fixed due date"
    if ((paymentTerm != null && paymentTerm.isFixedDueDate())
        || (paymentTermLine != null && paymentTermLine.isFixedDueDate())) {
      long dueDateDay = calculatedDueDate.get(Calendar.DAY_OF_MONTH), finalDueDateDay = 0;
      if (maturityDate3 > 0 && maturityDate2 > 0 && maturityDate2 < dueDateDay
          && maturityDate3 >= dueDateDay) {
        finalDueDateDay = maturityDate3;
      } else if (maturityDate2 > 0 && maturityDate1 > 0 && maturityDate1 < dueDateDay
          && maturityDate2 >= dueDateDay) {
        finalDueDateDay = maturityDate2;
      } else if (maturityDate1 > 0) {
        finalDueDateDay = maturityDate1;
      } else {
        // Due Date day should be maximum of Month's Last day
        finalDueDateDay = 1;
      }

      if ((int) finalDueDateDay > calculatedDueDate.getActualMaximum(Calendar.DAY_OF_MONTH)) {
        finalDueDateDay = calculatedDueDate.getActualMaximum(Calendar.DAY_OF_MONTH);
      }
      calculatedDueDate.set(Calendar.DAY_OF_MONTH, (int) finalDueDateDay);
      if (finalDueDateDay < dueDateDay) {
        calculatedDueDate.add(Calendar.MONTH, 1);
      }
    }
    if (!StringUtils.isEmpty(dayToPay)) {
      // for us: 1 -> Monday
      // for Calendar: 1 -> Sunday
      int dayOfTheWeekToPay = Integer.parseInt(dayToPay);
      dayOfTheWeekToPay += 1;
      if (dayOfTheWeekToPay == 8) {
        dayOfTheWeekToPay = 1;
      }
      if (calculatedDueDate.get(Calendar.DAY_OF_WEEK) == dayOfTheWeekToPay) {
        return calculatedDueDate.getTime();
      } else {
        Boolean dayFound = false;
        while (dayFound == false) {
          calculatedDueDate.add(Calendar.DATE, 1);
          if (calculatedDueDate.get(Calendar.DAY_OF_WEEK) == dayOfTheWeekToPay) {
            dayFound = true;
          }
        }
      }
    }
    return calculatedDueDate.getTime();
  }

  public JSONObject handlePayments(JSONObject jsoninvoice, Order order, Invoice invoice,
      Boolean wasPaidOnCredit) throws JSONException {
    final JSONObject jsonResponse = new JSONObject();

    FIN_PaymentSchedule paymentSchedule = order.getFINPaymentScheduleList().get(0);
    FIN_PaymentSchedule paymentScheduleInvoice = OBProvider.getInstance().get(
        FIN_PaymentSchedule.class);

    int pricePrecision = order.getCurrency().getObposPosprecision() == null ? order.getCurrency()
        .getPricePrecision().intValue() : order.getCurrency().getObposPosprecision().intValue();
    try {
      paymentScheduleInvoice.setCurrency(order.getCurrency());
      paymentScheduleInvoice.setInvoice(invoice);
      paymentScheduleInvoice.setFinPaymentmethod(order.getPaymentMethod());
      paymentScheduleInvoice.setAmount(BigDecimal.valueOf(jsoninvoice.getDouble("gross")).setScale(
          pricePrecision, RoundingMode.HALF_UP));
      paymentScheduleInvoice.setOutstandingAmount(BigDecimal
          .valueOf(jsoninvoice.getDouble("gross")).setScale(pricePrecision, RoundingMode.HALF_UP));

      final BigDecimal gross = BigDecimal.valueOf(jsoninvoice.getDouble("gross"));

      if (wasPaidOnCredit) {
        OBCriteria<PaymentTermLine> lineCriteria = OBDal.getInstance().createCriteria(
            PaymentTermLine.class);
        lineCriteria.add(Restrictions.eq(PaymentTermLine.PROPERTY_PAYMENTTERMS,
            order.getPaymentTerms()));
        lineCriteria.add(Restrictions.eq(PaymentTermLine.PROPERTY_ACTIVE, true));
        lineCriteria.addOrderBy(PaymentTermLine.PROPERTY_LINENO, true);
        List<PaymentTermLine> termLineList = lineCriteria.list();
        if (termLineList.size() > 0) {
          BigDecimal pendingGrossAmount = gross;
          int i = 0;
          for (PaymentTermLine paymentTermLine : termLineList) {
            if (pendingGrossAmount.compareTo(BigDecimal.ZERO) == 0) {
              break;
            }
            BigDecimal amount = BigDecimal.ZERO;
            if (paymentTermLine.isExcludeTax()) {
              amount = (order.getSummedLineAmount().multiply(paymentTermLine.getPercentageDue()
                  .divide(BigDecimal.valueOf(100)))).setScale(pricePrecision, RoundingMode.HALF_UP);
            } else if (!paymentTermLine.isRest()) {
              amount = (gross.multiply(paymentTermLine.getPercentageDue().divide(
                  BigDecimal.valueOf(100)))).setScale(pricePrecision, RoundingMode.HALF_UP);
            } else {
              amount = (pendingGrossAmount.multiply(paymentTermLine.getPercentageDue().divide(
                  BigDecimal.valueOf(100)))).setScale(pricePrecision, RoundingMode.HALF_UP);
              pendingGrossAmount = BigDecimal.ZERO;
            }

            if (amount.compareTo(BigDecimal.ZERO) == 0) {
              continue;
            }
            pendingGrossAmount = pendingGrossAmount.subtract(amount);

            Date dueDate = getCalculatedDueDateBasedOnPaymentTerms(order.getOrderDate(), null,
                paymentTermLine);

            if (i == 0) {
              paymentScheduleInvoice.setAmount(amount);
              paymentScheduleInvoice.setOutstandingAmount(amount);
              paymentScheduleInvoice.setDueDate(dueDate);
              paymentScheduleInvoice.setExpectedDate(dueDate);
              i++;
            } else {
              addPaymentSchedule(order, invoice, amount, amount, dueDate);
              i++;
            }
            if (termLineList.size() == i) {
              if (pendingGrossAmount.compareTo(BigDecimal.ZERO) != 0) {
                dueDate = getCalculatedDueDateBasedOnPaymentTerms(order.getOrderDate(),
                    order.getPaymentTerms(), null);

                addPaymentSchedule(order, invoice, pendingGrossAmount, pendingGrossAmount, dueDate);
                i++;
              }
            }
          }
        } else {
          Date dueDate = getCalculatedDueDateBasedOnPaymentTerms(order.getOrderDate(),
              order.getPaymentTerms(), null);
          paymentScheduleInvoice.setDueDate(dueDate);
          paymentScheduleInvoice.setExpectedDate(dueDate);
        }
      } else {
        paymentScheduleInvoice.setDueDate(order.getOrderDate());
        paymentScheduleInvoice.setExpectedDate(order.getOrderDate());
      }
      if (ModelProvider.getInstance().getEntity(FIN_PaymentSchedule.class)
          .hasProperty("origDueDate")) {
        // This property is checked and set this way to force compatibility with both MP13, MP14
        // and later releases of Openbravo. This property is mandatory and must be set. Check
        // issue
        paymentScheduleInvoice.set("origDueDate", paymentScheduleInvoice.getDueDate());
      }

      paymentScheduleInvoice.setFINPaymentPriority(order.getFINPaymentPriority());
      invoice.getFINPaymentScheduleList().add(paymentScheduleInvoice);
      OBDal.getInstance().save(paymentScheduleInvoice);

      Date finalSettlementDate = null;

      final OBCriteria<FIN_PaymentScheduleDetail> paymentScheduleCriteria = OBDal.getInstance()
          .createCriteria(FIN_PaymentScheduleDetail.class);
      paymentScheduleCriteria.add(Restrictions.eq(
          FIN_PaymentScheduleDetail.PROPERTY_ORDERPAYMENTSCHEDULE, paymentSchedule));
      paymentScheduleCriteria.add(Restrictions
          .isNotNull(FIN_PaymentScheduleDetail.PROPERTY_PAYMENTDETAILS));
      if (jsoninvoice.optBoolean("doCancelAndReplace", false)) {
        paymentScheduleCriteria.addOrder(org.hibernate.criterion.Order
            .asc(FIN_PaymentScheduleDetail.PROPERTY_AMOUNT));
      }
      final List<FIN_PaymentScheduleDetail> paymentScheduleList = paymentScheduleCriteria.list();
      // The reversal payments must be added to the same invoice to which are assigned the reversed
      // payment, so is necessary to put out of the list and add to the invoice each time a reversed
      // payment is added
      final List<FIN_PaymentScheduleDetail> reversalPSDList = new ArrayList<>();
      final Map<String, String> reverseRelation = new HashMap<>();
      for (final FIN_PaymentScheduleDetail psd : paymentScheduleList) {
        if (psd.getPaymentDetails().getFinPayment().getReversedPayment() != null) {
          for (final FIN_PaymentScheduleDetail psd2 : paymentScheduleList) {
            if (psd.getPaymentDetails().getFinPayment().getId()
                .equals(psd.getPaymentDetails().getFinPayment().getReversedPayment().getId())) {
              reversalPSDList.add(psd2);
              reverseRelation.put(psd.getPaymentDetails().getFinPayment().getId(), psd
                  .getPaymentDetails().getFinPayment().getReversedPayment().getId());
              break;
            }
          }
        }
      }
      for (final FIN_PaymentScheduleDetail reversalPSD : reversalPSDList) {
        paymentScheduleList.remove(reversalPSD);
      }

      BigDecimal paidAmt = BigDecimal.ZERO;
      BigDecimal paymentsAmt = BigDecimal.ZERO;
      for (final FIN_PaymentScheduleDetail remainingPSD : paymentScheduleList) {
        paymentsAmt = paymentsAmt.add(remainingPSD.getAmount());
      }
      BigDecimal amtToDistribute = gross.compareTo(paymentsAmt) == 1 ? paymentsAmt : gross;
      // Create invoice payment schedule details:
      for (int i = 0; i < paymentScheduleList.size(); i++) {
        FIN_PaymentScheduleDetail psd = paymentScheduleList.get(i);
        if (amtToDistribute.compareTo(BigDecimal.ZERO) == 0) {
          break;
        }

        if ((finalSettlementDate == null)
            || (psd.getPaymentDetails().getFinPayment().getPaymentDate() != null && psd
                .getPaymentDetails().getFinPayment().getPaymentDate()
                .compareTo(finalSettlementDate) > 0)) {
          finalSettlementDate = psd.getPaymentDetails().getFinPayment().getPaymentDate();
        }
        // Do not consider as paid amount if the payment is in a not valid status
        boolean invoicePaidAmounts = isPaidStatus(psd.getPaymentDetails().getFinPayment());

        int amtSign = amtToDistribute.signum();
        FIN_PaymentScheduleDetail reversalPSD = null;
        if (psd.getPaymentDetails().getFinPayment().getReversedPayment() != null) {
          reversalPSD = OBDal.getInstance().get(
              FIN_PaymentScheduleDetail.class,
              reverseRelation.get(psd.getPaymentDetails().getFinPayment().getReversedPayment()
                  .getId()));
        }
        if ((amtSign >= 0 && psd.getAmount().compareTo(amtToDistribute) <= 0)
            || (amtSign == -1 && psd.getAmount().compareTo(amtToDistribute) >= 0)) {
          psd.setInvoicePaymentSchedule(paymentScheduleInvoice);
          if (reversalPSD == null) {
            amtToDistribute = amtToDistribute.subtract(psd.getAmount());
            paidAmt = paidAmt.add(invoicePaidAmounts ? psd.getAmount() : BigDecimal.ZERO);
          } else {
            reversalPSD.setInvoicePaymentSchedule(paymentScheduleInvoice);
          }
        } else {
          // Create new paymentScheduleDetail:
          final FIN_PaymentScheduleDetail paymentScheduleDetail = OBProvider.getInstance().get(
              FIN_PaymentScheduleDetail.class);
          paymentScheduleDetail.setNewOBObject(true);
          paymentScheduleDetail.setOrderPaymentSchedule(paymentSchedule);
          paymentScheduleDetail.setPaymentDetails(psd.getPaymentDetails());
          paymentScheduleDetail.setInvoicePaymentSchedule(paymentScheduleInvoice);
          paymentScheduleDetail.setAmount(amtToDistribute);
          paymentScheduleDetail.setBusinessPartner(paymentSchedule.getOrder().getBusinessPartner());
          OBDal.getInstance().save(paymentScheduleDetail);
          paymentSchedule.getFINPaymentScheduleDetailOrderPaymentScheduleList().add(
              paymentScheduleDetail);
          paymentScheduleInvoice.getFINPaymentScheduleDetailInvoicePaymentScheduleList().add(
              paymentScheduleDetail);

          // Adjust the original payment schedule detail to match the new amount
          psd.setAmount(psd.getAmount().subtract(amtToDistribute));
          OBDal.getInstance().save(psd);

          if (reversalPSD == null) {
            paidAmt = paidAmt.add(invoicePaidAmounts ? amtToDistribute : BigDecimal.ZERO);
            amtToDistribute = BigDecimal.ZERO;
          } else {
            // Create new paymentScheduleDetail for the reverse payment:
            final FIN_PaymentScheduleDetail newReversalPSD = OBProvider.getInstance().get(
                FIN_PaymentScheduleDetail.class);
            newReversalPSD.setNewOBObject(true);
            newReversalPSD.setOrderPaymentSchedule(paymentSchedule);
            newReversalPSD.setPaymentDetails(psd.getPaymentDetails());
            newReversalPSD.setInvoicePaymentSchedule(paymentScheduleInvoice);
            newReversalPSD.setAmount(amtToDistribute);
            newReversalPSD.setBusinessPartner(paymentSchedule.getOrder().getBusinessPartner());
            OBDal.getInstance().save(paymentScheduleDetail);
            paymentSchedule.getFINPaymentScheduleDetailOrderPaymentScheduleList().add(
                newReversalPSD);
            paymentScheduleInvoice.getFINPaymentScheduleDetailInvoicePaymentScheduleList().add(
                newReversalPSD);

            // Adjust the original payment schedule detail to match the new amount
            reversalPSD.setAmount(reversalPSD.getAmount().add(amtToDistribute));
            OBDal.getInstance().save(reversalPSD);
          }
        }
      }

      // If the invoice haven't been completely paid, add the remaining payment
      final BigDecimal remainingAmt = gross.subtract(paymentsAmt);
      if (remainingAmt.compareTo(BigDecimal.ZERO) == 1) {
        assignRemainingAmount(order, paymentSchedule, paymentScheduleInvoice, remainingAmt);
      }

      if (paidAmt.compareTo(invoice.getGrandTotalAmount()) == 0) {
        invoice.setFinalSettlementDate(finalSettlementDate);
      }

      invoice.setTotalPaid(paidAmt);
      invoice.setOutstandingAmount(invoice.getGrandTotalAmount().subtract(paidAmt));
      invoice.setDueAmount(invoice.getGrandTotalAmount().subtract(paidAmt));
      invoice.setDaysTillDue(FIN_Utility.getDaysToDue(paymentScheduleInvoice.getDueDate()));
      invoice.setPaymentComplete(paidAmt.compareTo(invoice.getGrandTotalAmount()) == 0);
      invoice.setLastCalculatedOnDate(new Date());
      paymentScheduleInvoice.setOutstandingAmount(invoice.getGrandTotalAmount().subtract(paidAmt));
      paymentScheduleInvoice.setPaidAmount(paidAmt);
      OBDal.getInstance().save(paymentScheduleInvoice);
      OBDal.getInstance().save(invoice);

    } catch (Exception e) {
      jsonResponse.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_FAILURE);
      jsonResponse.put(JsonConstants.RESPONSE_ERRORMESSAGE, e.getMessage());
      return jsonResponse;
    }

    jsonResponse.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
    jsonResponse.put("paymentSchedule", paymentSchedule);
    jsonResponse.put("paymentScheduleInvoice", paymentScheduleInvoice);

    return jsonResponse;
  }

  private void addPaymentSchedule(Order order, Invoice invoice, BigDecimal amount,
      BigDecimal outstandingAmount, Date dueDate) {
    FIN_PaymentSchedule pymtSchedule = OBProvider.getInstance().get(FIN_PaymentSchedule.class);
    pymtSchedule.setCurrency(order.getCurrency());
    pymtSchedule.setInvoice(invoice);
    pymtSchedule.setFinPaymentmethod(order.getPaymentMethod());
    pymtSchedule.setFINPaymentPriority(order.getFINPaymentPriority());
    pymtSchedule.setAmount(amount);
    pymtSchedule.setOutstandingAmount(outstandingAmount);
    pymtSchedule.setDueDate(dueDate);
    pymtSchedule.setExpectedDate(dueDate);
    if (ModelProvider.getInstance().getEntity(FIN_PaymentSchedule.class).hasProperty("origDueDate")) {
      pymtSchedule.set("origDueDate", dueDate);
    }
    invoice.getFINPaymentScheduleList().add(pymtSchedule);
    OBDal.getInstance().save(pymtSchedule);
  }

  private void assignRemainingAmount(Order order, FIN_PaymentSchedule paymentSchedule,
      FIN_PaymentSchedule paymentScheduleInvoice, final BigDecimal remainingAmt) {
    final OBCriteria<FIN_PaymentScheduleDetail> remainingPSDCriteria = OBDal.getInstance()
        .createCriteria(FIN_PaymentScheduleDetail.class);
    remainingPSDCriteria.add(Restrictions.eq(
        FIN_PaymentScheduleDetail.PROPERTY_ORDERPAYMENTSCHEDULE, paymentSchedule));
    remainingPSDCriteria.add(Restrictions
        .isNull(FIN_PaymentScheduleDetail.PROPERTY_INVOICEPAYMENTSCHEDULE));
    remainingPSDCriteria
        .add(Restrictions.isNull(FIN_PaymentScheduleDetail.PROPERTY_PAYMENTDETAILS));
    remainingPSDCriteria.setMaxResults(1);
    final FIN_PaymentScheduleDetail remainingPSD = (FIN_PaymentScheduleDetail) remainingPSDCriteria
        .uniqueResult();
    if (remainingPSD == null) {
      return;
    }
    if (remainingPSD.getAmount().compareTo(remainingAmt) == 0) {
      remainingPSD.setInvoicePaymentSchedule(paymentScheduleInvoice);
      paymentScheduleInvoice.getFINPaymentScheduleDetailInvoicePaymentScheduleList().add(
          remainingPSD);
    } else {
      // The PSD must be splitted in two PSD, one that belongs to the invoice with the remaining
      // amount for the invoice and the other only to the order with the remaining amount for
      // the order that not belongs to an invoice
      remainingPSD.setAmount(remainingPSD.getAmount().subtract(remainingAmt));
      final FIN_PaymentScheduleDetail newRemainingPSD = OBProvider.getInstance().get(
          FIN_PaymentScheduleDetail.class);
      newRemainingPSD.setNewOBObject(true);
      newRemainingPSD.setOrderPaymentSchedule(paymentSchedule);
      newRemainingPSD.setInvoicePaymentSchedule(paymentScheduleInvoice);
      newRemainingPSD.setAmount(remainingAmt);
      newRemainingPSD.setBusinessPartner(order.getBusinessPartner());
      paymentSchedule.getFINPaymentScheduleDetailOrderPaymentScheduleList().add(newRemainingPSD);
      OBDal.getInstance().save(newRemainingPSD);
      paymentScheduleInvoice.getFINPaymentScheduleDetailInvoicePaymentScheduleList().add(
          newRemainingPSD);
    }
    OBDal.getInstance().save(remainingPSD);
  }

  private boolean isPaidStatus(FIN_Payment payment) {
    return (FIN_Utility.seqnumberpaymentstatus(STATUS_PAYMENT_RECEIVED)) >= (FIN_Utility
        .seqnumberpaymentstatus(FIN_Utility.invoicePaymentStatus(payment)));
  }

  protected String getDummyDocumentNo() {
    return "DOCNO" + System.currentTimeMillis();
  }

}
