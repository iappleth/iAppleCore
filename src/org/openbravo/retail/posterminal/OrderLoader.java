/*
 ************************************************************************************
 * Copyright (C) 2012-2016 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.CallableStatement;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map.Entry;

import javax.enterprise.inject.Any;
import javax.enterprise.inject.Instance;
import javax.inject.Inject;

import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.Query;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
import org.hibernate.criterion.Restrictions;
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
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.erpCommon.ad_forms.AcctServer;
import org.openbravo.erpCommon.businessUtility.Preferences;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.erpCommon.utility.PropertyException;
import org.openbravo.erpCommon.utility.SequenceIdData;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.materialmgmt.StockUtils;
import org.openbravo.mobile.core.process.DataSynchronizationImportProcess;
import org.openbravo.mobile.core.process.DataSynchronizationProcess.DataSynchronization;
import org.openbravo.mobile.core.process.JSONPropertyToEntity;
import org.openbravo.mobile.core.process.PropertyByType;
import org.openbravo.mobile.core.utils.OBMOBCUtils;
import org.openbravo.model.ad.access.InvoiceLineTax;
import org.openbravo.model.ad.access.OrderLineTax;
import org.openbravo.model.ad.access.User;
import org.openbravo.model.common.businesspartner.BusinessPartner;
import org.openbravo.model.common.businesspartner.Location;
import org.openbravo.model.common.enterprise.DocumentType;
import org.openbravo.model.common.enterprise.Locator;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.common.enterprise.Warehouse;
import org.openbravo.model.common.invoice.Invoice;
import org.openbravo.model.common.invoice.InvoiceLine;
import org.openbravo.model.common.invoice.InvoiceLineOffer;
import org.openbravo.model.common.invoice.InvoiceTax;
import org.openbravo.model.common.order.Order;
import org.openbravo.model.common.order.OrderLine;
import org.openbravo.model.common.order.OrderLineOffer;
import org.openbravo.model.common.order.OrderTax;
import org.openbravo.model.common.order.OrderlineServiceRelation;
import org.openbravo.model.common.plm.AttributeSetInstance;
import org.openbravo.model.financialmgmt.payment.FIN_FinaccTransaction;
import org.openbravo.model.financialmgmt.payment.FIN_FinancialAccount;
import org.openbravo.model.financialmgmt.payment.FIN_OrigPaymentScheduleDetail;
import org.openbravo.model.financialmgmt.payment.FIN_Payment;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentDetail;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentDetailV;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentMethod;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentSchedOrdV;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentSchedule;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentScheduleDetail;
import org.openbravo.model.financialmgmt.payment.Fin_OrigPaymentSchedule;
import org.openbravo.model.financialmgmt.payment.PaymentTerm;
import org.openbravo.model.financialmgmt.tax.TaxRate;
import org.openbravo.model.materialmgmt.onhandquantity.StockProposed;
import org.openbravo.model.materialmgmt.transaction.MaterialTransaction;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOut;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOutLine;
import org.openbravo.service.db.CallStoredProcedure;
import org.openbravo.service.db.DalConnectionProvider;
import org.openbravo.service.importprocess.ImportEntryManager;
import org.openbravo.service.json.JsonConstants;
import org.openbravo.service.json.JsonToDataConverter;

@DataSynchronization(entity = "Order")
public class OrderLoader extends POSDataSynchronizationProcess implements
    DataSynchronizationImportProcess {

  private static final Logger log = Logger.getLogger(OrderLoader.class);

  private static final BigDecimal NEGATIVE_ONE = new BigDecimal(-1);

  // DocumentNo Handler are used to collect all needed document numbers and create and set
  // them as late in the process as possible
  private static ThreadLocal<List<DocumentNoHandler>> documentNoHandlers = new ThreadLocal<List<DocumentNoHandler>>();

  private static void addDocumentNoHandler(BaseOBObject bob, Entity entity,
      DocumentType docTypeTarget, DocumentType docType) {
    documentNoHandlers.get().add(new DocumentNoHandler(bob, entity, docTypeTarget, docType));
  }

  HashMap<String, DocumentType> paymentDocTypes = new HashMap<String, DocumentType>();
  HashMap<String, DocumentType> invoiceDocTypes = new HashMap<String, DocumentType>();
  HashMap<String, DocumentType> shipmentDocTypes = new HashMap<String, DocumentType>();
  HashMap<String, JSONArray> orderLineServiceList;
  String paymentDescription = null;
  private boolean newLayaway = false;
  private boolean notpaidLayaway = false;
  private boolean creditpaidLayaway = false;
  private boolean partialpaidLayaway = false;
  private boolean fullypaidLayaway = false;
  private boolean createShipment = true;
  private Locator binForRetuns = null;
  private boolean isQuotation = false;

  @Inject
  @Any
  private Instance<OrderLoaderHook> orderProcesses;

  @Inject
  @Any
  private Instance<OrderLoaderPreProcessHook> orderPreProcesses;

  @Inject
  @Any
  private Instance<OrderLoaderHookForQuotations> quotationProcesses;

  private boolean useOrderDocumentNoForRelatedDocs = false;

  protected String getImportQualifier() {
    return "Order";
  }

  /**
   * Method to initialize the global variables needed during the synchronization process
   * 
   * @param jsonorder
   *          JSONObject which contains the order to be synchronized. This object is generated in
   *          Web POS
   * @return
   */
  public void initializeVariables(JSONObject jsonorder) throws JSONException {
    try {
      useOrderDocumentNoForRelatedDocs = "Y".equals(Preferences.getPreferenceValue(
          "OBPOS_UseOrderDocumentNoForRelatedDocs", true, OBContext.getOBContext()
              .getCurrentClient(), OBContext.getOBContext().getCurrentOrganization(), OBContext
              .getOBContext().getUser(), OBContext.getOBContext().getRole(), null));
    } catch (PropertyException e1) {
      log.error(
          "Error getting OBPOS_UseOrderDocumentNoForRelatedDocs preference: " + e1.getMessage(), e1);
    }

    documentNoHandlers.set(new ArrayList<OrderLoader.DocumentNoHandler>());

    isQuotation = jsonorder.has("isQuotation") && jsonorder.getBoolean("isQuotation");

    newLayaway = jsonorder.has("orderType") && jsonorder.getLong("orderType") == 2;
    notpaidLayaway = (jsonorder.getBoolean("isLayaway") || jsonorder.optLong("orderType") == 2)
        && jsonorder.getDouble("payment") < jsonorder.getDouble("gross")
        && !jsonorder.optBoolean("paidOnCredit");
    creditpaidLayaway = (jsonorder.getBoolean("isLayaway") || jsonorder.optLong("orderType") == 2)
        && jsonorder.getDouble("payment") < jsonorder.getDouble("gross")
        && jsonorder.optBoolean("paidOnCredit");
    partialpaidLayaway = jsonorder.getBoolean("isLayaway")
        && jsonorder.getDouble("payment") < jsonorder.getDouble("gross");
    fullypaidLayaway = (jsonorder.getBoolean("isLayaway") || jsonorder.optLong("orderType") == 2)
        && jsonorder.getDouble("payment") >= jsonorder.getDouble("gross");

    createShipment = !isQuotation && !notpaidLayaway;
    if (jsonorder.has("generateShipment")) {
      createShipment &= jsonorder.getBoolean("generateShipment");
    }
  }

  @Override
  public JSONObject saveRecord(JSONObject jsonorder) throws Exception {
    long t0 = 0, t1 = 0, t11 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t111 = 0, t112 = 0, t113 = 0, t115 = 0, t116 = 0;

    orderLineServiceList = new HashMap<String, JSONArray>();
    try {
      initializeVariables(jsonorder);
      executeHooks(orderPreProcesses, jsonorder, null, null, null);
      boolean wasPaidOnCredit = false;
      boolean isDeleted = false;

      if (jsonorder.has("deletedLines")) {
        mergeDeletedLines(jsonorder);
      }

      if (jsonorder.getLong("orderType") != 2 && !jsonorder.getBoolean("isLayaway") && !isQuotation
          && verifyOrderExistance(jsonorder)
          && (!jsonorder.has("preserveId") || jsonorder.getBoolean("preserveId"))) {
        return successMessage(jsonorder);
      }

      if (!isQuotation && !jsonorder.getBoolean("isLayaway")) {
        verifyCashupStatus(jsonorder);
      }

      t0 = System.currentTimeMillis();
      Order order = null;
      OrderLine orderLine = null;
      ShipmentInOut shipment = null;
      Invoice invoice = null;
      boolean createInvoice = false;
      TriggerHandler.getInstance().disable();
      try {
        if (jsonorder.has("oldId") && !jsonorder.getString("oldId").equals("null")
            && jsonorder.has("isQuotation") && jsonorder.getBoolean("isQuotation")) {
          try {
            deleteOldDocument(jsonorder);
          } catch (Exception e) {
            log.warn("Error to delete old quotation with id: " + jsonorder.getString("oldId"));
          }
        }

        if (log.isDebugEnabled()) {
          t1 = System.currentTimeMillis();
        }
        // Getting if the order is deleted or not
        isDeleted = jsonorder.has("obposIsDeleted") && jsonorder.getBoolean("obposIsDeleted");
        // An invoice will be automatically created if:
        // - The order is not a layaway and is not completely paid (ie. it's paid on credit)
        // - Or, the order is a normal order or a fully paid layaway, and has the "generateInvoice"
        // flag
        wasPaidOnCredit = !isQuotation
            && !isDeleted
            && !notpaidLayaway
            && Math.abs(jsonorder.getDouble("payment")) < Math.abs(new Double(jsonorder
                .getDouble("gross")));
        if (jsonorder.has("oBPOSNotInvoiceOnCashUp")
            && jsonorder.getBoolean("oBPOSNotInvoiceOnCashUp")) {
          createInvoice = false;
        } else {
          createInvoice = wasPaidOnCredit
              || (!isQuotation && !notpaidLayaway && (jsonorder.has("generateInvoice") && jsonorder
                  .getBoolean("generateInvoice")));
        }

        if (jsonorder.has("generateShipment")) {
          createInvoice &= jsonorder.getBoolean("generateShipment");
        }

        // We have to check if there is any line in the order which have been already invoiced. If
        // it is the case we will not create the invoice.
        List<Invoice> lstInvoice = getInvoicesRelatedToOrder(jsonorder.getString("id"));
        if (lstInvoice != null) {
          // We have found and invoice, so it will be used to assign payments
          // TODO several invoices involved
          invoice = lstInvoice.get(0);
          createInvoice = false;
        }

        // Order header
        if (log.isDebugEnabled()) {
          t111 = System.currentTimeMillis();
        }
        ArrayList<OrderLine> lineReferences = new ArrayList<OrderLine>();
        JSONArray orderlines = jsonorder.getJSONArray("lines");
        if (!newLayaway && notpaidLayaway) {
          order = OBDal.getInstance().get(Order.class, jsonorder.getString("id"));
          order.setObposAppCashup(jsonorder.getString("obposAppCashup"));
        } else if (!newLayaway && (creditpaidLayaway || fullypaidLayaway)) {
          order = OBDal.getInstance().get(Order.class, jsonorder.getString("id"));
          order.setObposAppCashup(jsonorder.getString("obposAppCashup"));
          order.setDelivered(true);

          String olsHqlWhereClause = " ol where ol.salesOrder.id = :orderId order by lineNo";
          OBQuery<OrderLine> queryOls = OBDal.getInstance().createQuery(OrderLine.class,
              olsHqlWhereClause);
          queryOls.setNamedParameter("orderId", order.getId());
          List<OrderLine> lstResultOL = queryOls.list();

          for (int i = 0; i < lstResultOL.size(); i++) {
            orderLine = lstResultOL.get(i);
            orderLine.setDeliveredQuantity(orderLine.getOrderedQuantity());
            lineReferences.add(orderLine);
          }
        } else if (partialpaidLayaway) {
          order = OBDal.getInstance().get(Order.class, jsonorder.getString("id"));
          if (!jsonorder.has("channel")) {
            order.setObposAppCashup(jsonorder.getString("obposAppCashup"));
          }
        } else {
          order = OBProvider.getInstance().get(Order.class);
          createOrder(order, jsonorder);
          OBDal.getInstance().save(order);
          lineReferences = new ArrayList<OrderLine>();
          createOrderLines(order, jsonorder, orderlines, lineReferences);
          if (orderLineServiceList.size() > 0) {
            createLinesForServiceProduct();
          }
        }
        if (log.isDebugEnabled()) {
          t112 = System.currentTimeMillis();
        }

        // Order lines
        if (jsonorder.has("oldId") && !jsonorder.getString("oldId").equals("null")
            && (!jsonorder.has("isQuotation") || !jsonorder.getBoolean("isQuotation"))) {
          try {
            // This order comes from a quotation, we need to associate both
            associateOrderToQuotation(jsonorder, order);
          } catch (Exception e) {
            log.warn("Error to associate order to quotation with id: "
                + jsonorder.getString("oldId"));
          }
        }

        if (log.isDebugEnabled()) {
          t113 = System.currentTimeMillis();
        }
        if (createShipment) {

          OBCriteria<Locator> locators = OBDal.getInstance().createCriteria(Locator.class);
          locators.add(Restrictions.eq(Locator.PROPERTY_ACTIVE, true));
          locators.add(Restrictions.eq(Locator.PROPERTY_WAREHOUSE, order.getWarehouse()));
          locators.setMaxResults(2);
          List<Locator> locatorList = locators.list();

          if (locatorList.isEmpty()) {
            throw new OBException(Utility.messageBD(new DalConnectionProvider(false),
                "OBPOS_WarehouseNotStorageBin", OBContext.getOBContext().getLanguage()
                    .getLanguage()));
          }

          shipment = OBProvider.getInstance().get(ShipmentInOut.class);
          createShipment(shipment, order, jsonorder);
          OBDal.getInstance().save(shipment);
          createShipmentLines(shipment, order, jsonorder, orderlines, lineReferences, locatorList);
        }
        if (log.isDebugEnabled()) {
          t115 = System.currentTimeMillis();
        }
        if (createInvoice) {
          // Invoice header
          invoice = OBProvider.getInstance().get(Invoice.class);
          createInvoice(invoice, order, jsonorder);
          OBDal.getInstance().save(invoice);

          // Invoice lines
          createInvoiceLines(invoice, order, jsonorder, orderlines, lineReferences);
        }

        if (log.isDebugEnabled()) {
          t116 = System.currentTimeMillis();
        }
        createApprovals(order, jsonorder);

        if (log.isDebugEnabled()) {
          t11 = System.currentTimeMillis();
          t2 = System.currentTimeMillis();
        }
        updateAuditInfo(order, invoice, jsonorder);
        if (log.isDebugEnabled()) {
          t3 = System.currentTimeMillis();
        }

        if (createShipment) {
          // Stock manipulation
          org.openbravo.database.ConnectionProvider cp = new DalConnectionProvider(false);
          CallableStatement updateStockStatement = cp.getConnection().prepareCall(
              "{call M_UPDATE_INVENTORY (?,?,?,?,?,?,?,?,?,?,?,?,?)}");
          try {
            // Stock manipulation
            handleStock(shipment, updateStockStatement);
          } finally {
            updateStockStatement.close();
          }
        }
        if (log.isDebugEnabled()) {
          t4 = System.currentTimeMillis();

          log.debug("Creation of bobs. Order: " + (t112 - t111) + "; Orderlines: " + (t113 - t112)
              + "; Shipment: " + (t115 - t113) + "; Invoice: " + (t116 - t115) + "; Approvals"
              + (t11 - t116) + "; stock" + (t4 - t3));
        }

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

      } catch (Exception ex) {
        throw new OBException("Error in OrderLoader: ", ex);
      } finally {
        // flush and enable triggers, the rest of this method needs enabled
        // triggers
        try {
          OBDal.getInstance().flush();
          TriggerHandler.getInstance().enable();
        } catch (Throwable ignored) {
        }
      }

      if (log.isDebugEnabled()) {
        t5 = System.currentTimeMillis();
      }

      if (!isQuotation && !isDeleted) {
        // Payment
        JSONObject paymentResponse = handlePayments(jsonorder, order, invoice, wasPaidOnCredit);
        if (paymentResponse != null) {
          return paymentResponse;
        }

        // Call all OrderProcess injected.
        executeHooks(orderProcesses, jsonorder, order, shipment, invoice);
      } else {
        // Call all OrderProcess injected when order is a quotation
        executeHooks(quotationProcesses, jsonorder, order, shipment, invoice);
      }

      if (log.isDebugEnabled()) {
        t6 = System.currentTimeMillis();
      }
      OBDal.getInstance().flush();

      if (log.isDebugEnabled()) {
        log.debug("Order with docno: " + order.getDocumentNo() + " (uuid: " + order.getId()
            + ") saved correctly. Initial flush: " + (t1 - t0) + "; Generate bobs:" + (t11 - t1)
            + "; Save bobs:" + (t2 - t11) + "; First flush:" + (t3 - t2) + "; Process Payments:"
            + (t6 - t5) + " Final flush: " + (System.currentTimeMillis() - t6));
      }

      ImportEntryManager.getInstance()
          .reportStats("orderLoader", (System.currentTimeMillis() - t0));

      return successMessage(jsonorder);
    } finally {
      documentNoHandlers.set(null);
    }
  }

  private void mergeDeletedLines(JSONObject jsonorder) {
    try {
      JSONArray deletedLines = jsonorder.getJSONArray("deletedLines");
      JSONArray lines = jsonorder.getJSONArray("lines");
      for (int i = 0; i < deletedLines.length(); i++) {
        lines.put(deletedLines.get(i));
      }
      jsonorder.put("lines", lines);
    } catch (JSONException e) {
      log.error("JSON information couldn't be read when merging deleted lines", e);
      return;
    }
  }

  @Override
  protected boolean additionalCheckForDuplicates(JSONObject record) {
    try {
      Order orderInDatabase = OBDal.getInstance().get(Order.class, record.getString("id"));
      String docNoInDatabase = orderInDatabase.getDocumentNo();
      String docNoInJSON = "";
      docNoInJSON = record.getString("documentNo");
      return docNoInDatabase.equals(docNoInJSON);
    } catch (JSONException e) {
      log.error("JSON information couldn't be read when verifying duplicate", e);
      return false;
    }
  }

  protected void executeHooks(Instance<? extends Object> hooks, JSONObject jsonorder, Order order,
      ShipmentInOut shipment, Invoice invoice) throws Exception {

    for (Iterator<? extends Object> procIter = hooks.iterator(); procIter.hasNext();) {
      Object proc = procIter.next();
      if (proc instanceof OrderLoaderHook) {
        ((OrderLoaderHook) proc).exec(jsonorder, order, shipment, invoice);
      } else {
        ((OrderLoaderPreProcessHook) proc).exec(jsonorder);
      }
    }
  }

  private void updateAuditInfo(Order order, Invoice invoice, JSONObject jsonorder)
      throws JSONException {
    Long value = jsonorder.getLong("created");
    order.set("creationDate", new Date(value));
    if (invoice != null) {
      invoice.set("creationDate", new Date(value));
    }
  }

  protected void associateOrderToQuotation(JSONObject jsonorder, Order order) throws JSONException {
    String quotationId = jsonorder.getString("oldId");
    Order quotation = OBDal.getInstance().get(Order.class, quotationId);
    order.setQuotation(quotation);
    List<OrderLine> orderLines = order.getOrderLineList();
    List<OrderLine> quotationLines = quotation.getOrderLineList();
    for (int i = 0; (i < orderLines.size() && i < quotationLines.size()); i++) {
      orderLines.get(i).setQuotationLine(quotationLines.get(i));
    }
    quotation.setDocumentStatus("CA");

  }

  protected Locator getBinForReturns(String posTerminalId) {
    if (binForRetuns == null) {
      OBPOSApplications posTerminal = OBDal.getInstance().get(OBPOSApplications.class,
          posTerminalId);
      binForRetuns = POSUtils.getBinForReturns(posTerminal);
    }
    return binForRetuns;
  }

  protected JSONObject successMessage(JSONObject jsonorder) throws Exception {
    final JSONObject jsonResponse = new JSONObject();

    jsonResponse.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
    jsonResponse.put("result", "0");
    return jsonResponse;
  }

  protected void deleteOldDocument(JSONObject jsonorder) throws JSONException {
    /*
     * Issue 0029953 Instead of remove old order, we set it as rejected (CJ). The new quotation will
     * be linked to the rejected one
     */
    Order oldOrder = OBDal.getInstance().get(Order.class, jsonorder.getString("oldId"));
    oldOrder.setDocumentStatus("CJ");
    // Order Loader will automatically store this field into c_order table based on Json
    jsonorder.put("obposRejectedQuotation", jsonorder.getString("oldId"));
  }

  protected boolean verifyOrderExistance(JSONObject jsonorder) throws Exception {
    OBContext.setAdminMode(false);
    try {
      if (jsonorder.has("id") && jsonorder.getString("id") != null
          && !jsonorder.getString("id").equals("")) {
        Order order = OBDal.getInstance().get(Order.class, jsonorder.getString("id"));
        if (order != null) {
          // Additional check to verify that the order is indeed a duplicate
          if (!additionalCheckForDuplicates(jsonorder)) {
            throw new OBException(
                "An order has the same id, but it's not a duplicate. Existing order id:"
                    + order.getId() + ". Existing order documentNo:" + order.getDocumentNo()
                    + ". New documentNo:" + jsonorder.getString("documentNo"));
          } else {
            return true;
          }
        }
      }
      if ((!jsonorder.has("obposIsDeleted") || !jsonorder.getBoolean("obposIsDeleted"))
          && (!jsonorder.has("gross") || jsonorder.getString("gross").equals("0"))
          && (jsonorder.isNull("lines") || (jsonorder.getJSONArray("lines") != null && jsonorder
              .getJSONArray("lines").length() == 0))) {
        log.error("Detected order without lines and total amount zero. Document number "
            + jsonorder.getString("documentNo"));
        return true;
      }
    } finally {
      OBContext.restorePreviousMode();
    }
    return false;
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

  protected void createInvoiceLine(Invoice invoice, Order order, JSONObject jsonorder,
      JSONArray orderlines, ArrayList<OrderLine> lineReferences, int numIter, int pricePrecision,
      ShipmentInOutLine inOutLine, int lineNo, int numLines, int actualLine) throws JSONException {

    BigDecimal movQty = null;
    if (inOutLine != null && inOutLine.getMovementQuantity() != null) {
      movQty = inOutLine.getMovementQuantity();
    } else {
      movQty = lineReferences.get(numIter).getOrderedQuantity();
    }

    BigDecimal ratio = movQty.divide(lineReferences.get(numIter).getOrderedQuantity(), 32,
        RoundingMode.HALF_UP);

    Entity promotionLineEntity = ModelProvider.getInstance().getEntity(InvoiceLineOffer.class);
    InvoiceLine line = OBProvider.getInstance().get(InvoiceLine.class);
    Entity inlineEntity = ModelProvider.getInstance().getEntity(InvoiceLine.class);
    JSONPropertyToEntity.fillBobFromJSON(inlineEntity, line, orderlines.getJSONObject(numIter),
        jsonorder.getLong("timezoneOffset"));
    JSONPropertyToEntity.fillBobFromJSON(ModelProvider.getInstance().getEntity(InvoiceLine.class),
        line, jsonorder, jsonorder.getLong("timezoneOffset"));
    line.setId(inOutLine.getId());
    line.setNewOBObject(true);
    line.setLineNo((long) lineNo);
    line.setDescription(orderlines.getJSONObject(numIter).has("description") ? orderlines
        .getJSONObject(numIter).getString("description") : "");
    BigDecimal qty = movQty;

    // if ratio equals to one, then only one shipment line is related to orderline, then lineNetAmt
    // and gross is populated from JSON
    if (ratio.compareTo(BigDecimal.ONE) != 0) {
      // if there are several shipments line to the same orderline, in the last line of the invoice
      // of this sales order line, the line net amt will be the pending line net amount
      if (numLines > actualLine) {
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
        line.setLineNetAmount(lineReferences.get(numIter).getLineNetAmount()
            .subtract(partialLineNetAmount).setScale(pricePrecision, RoundingMode.HALF_UP));
        line.setGrossAmount(lineReferences.get(numIter).getLineGrossAmount()
            .subtract(partialGrossAmount).setScale(pricePrecision, RoundingMode.HALF_UP));
      }
    } else {
      line.setLineNetAmount(BigDecimal.valueOf(orderlines.getJSONObject(numIter).getDouble("net"))
          .setScale(pricePrecision, RoundingMode.HALF_UP));
      line.setGrossAmount(lineReferences.get(numIter).getLineGrossAmount()
          .setScale(pricePrecision, RoundingMode.HALF_UP));
    }

    line.setInvoicedQuantity(qty);
    lineReferences.get(numIter).setInvoicedQuantity(
        (lineReferences.get(numIter).getInvoicedQuantity() != null ? lineReferences.get(numIter)
            .getInvoicedQuantity().add(qty) : qty));
    line.setInvoice(invoice);
    line.setSalesOrderLine(lineReferences.get(numIter));
    line.setGoodsShipmentLine(inOutLine);
    invoice.getInvoiceLineList().add(line);
    OBDal.getInstance().save(line);

    JSONObject taxes = orderlines.getJSONObject(numIter).getJSONObject("taxLines");
    @SuppressWarnings("unchecked")
    Iterator<String> itKeys = taxes.keys();
    BigDecimal totalTaxAmount = BigDecimal.ZERO;
    int ind = 0;
    while (itKeys.hasNext()) {
      String taxId = itKeys.next();
      JSONObject jsonOrderTax = taxes.getJSONObject(taxId);
      InvoiceLineTax invoicelinetax = OBProvider.getInstance().get(InvoiceLineTax.class);
      TaxRate tax = (TaxRate) OBDal.getInstance().getProxy(
          ModelProvider.getInstance().getEntity(TaxRate.class).getName(), taxId);
      invoicelinetax.setTax(tax);

      // if ratio equals to one, then only one shipment line is related to orderline, then
      // lineNetAmt and gross is populated from JSON
      if (ratio.compareTo(BigDecimal.ONE) != 0) {
        // if there are several shipments line to the same orderline, in the last line of the
        // splited lines, the tax amount will be calculated as the pending tax amount
        if (numLines > actualLine) {
          invoicelinetax.setTaxableAmount(BigDecimal.valueOf(jsonOrderTax.getDouble("net"))
              .multiply(ratio).setScale(pricePrecision, RoundingMode.HALF_UP));
          invoicelinetax.setTaxAmount(BigDecimal.valueOf(jsonOrderTax.getDouble("amount"))
              .multiply(ratio).setScale(pricePrecision, RoundingMode.HALF_UP));
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
          invoicelinetax.setTaxableAmount(BigDecimal.valueOf(jsonOrderTax.getDouble("net"))
              .subtract(partialTaxableAmount).setScale(pricePrecision, RoundingMode.HALF_UP));
          invoicelinetax.setTaxAmount(BigDecimal.valueOf(jsonOrderTax.getDouble("amount"))
              .subtract(partialTaxAmount).setScale(pricePrecision, RoundingMode.HALF_UP));
        }
      } else {
        invoicelinetax.setTaxableAmount(BigDecimal.valueOf(jsonOrderTax.getDouble("net")).setScale(
            pricePrecision, RoundingMode.HALF_UP));
        invoicelinetax.setTaxAmount(BigDecimal.valueOf(jsonOrderTax.getDouble("amount")).setScale(
            pricePrecision, RoundingMode.HALF_UP));
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
    if (orderlines.getJSONObject(numIter).has("promotions")
        && !orderlines.getJSONObject(numIter).isNull("promotions")
        && !orderlines.getJSONObject(numIter).getString("promotions").equals("null")) {
      JSONArray jsonPromotions = orderlines.getJSONObject(numIter).getJSONArray("promotions");
      for (int p = 0; p < jsonPromotions.length(); p++) {
        JSONObject jsonPromotion = jsonPromotions.getJSONObject(p);
        boolean hasActualAmt = jsonPromotion.has("actualAmt");
        if (hasActualAmt && jsonPromotion.getDouble("actualAmt") == 0) {
          continue;
        }

        InvoiceLineOffer promotion = OBProvider.getInstance().get(InvoiceLineOffer.class);
        JSONPropertyToEntity.fillBobFromJSON(promotionLineEntity, promotion, jsonPromotion,
            jsonorder.getLong("timezoneOffset"));

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

  protected void createInvoiceLines(Invoice invoice, Order order, JSONObject jsonorder,
      JSONArray orderlines, ArrayList<OrderLine> lineReferences) throws JSONException {
    int pricePrecision = order.getCurrency().getObposPosprecision() == null ? order.getCurrency()
        .getPricePrecision().intValue() : order.getCurrency().getObposPosprecision().intValue();

    boolean multipleShipmentsLines = false;
    int lineNo = 0;
    for (int i = 0; i < orderlines.length(); i++) {
      List<ShipmentInOutLine> iolList = lineReferences.get(i)
          .getMaterialMgmtShipmentInOutLineList();
      if (iolList.size() > 1) {
        multipleShipmentsLines = true;
      }
      if (iolList.size() == 0) {
        lineNo = lineNo + 10;
        createInvoiceLine(invoice, order, jsonorder, orderlines, lineReferences, i, pricePrecision,
            null, lineNo, iolList.size(), 1);
      } else {
        int numIter = 0;
        for (ShipmentInOutLine iol : iolList) {
          numIter++;
          lineNo = lineNo + 10;
          createInvoiceLine(invoice, order, jsonorder, orderlines, lineReferences, i,
              pricePrecision, iol, lineNo, iolList.size(), numIter);
        }
      }
    }
    if (multipleShipmentsLines) {
      updateTaxes(invoice);
    }
  }

  protected List<Invoice> getInvoicesRelatedToOrder(String orderId) {
    List<String> lstInvoicesIds = new ArrayList<String>();
    List<Invoice> lstInvoices = new ArrayList<Invoice>();
    StringBuffer involvedInvoicedHqlQueryWhereStr = new StringBuffer();
    involvedInvoicedHqlQueryWhereStr
        .append("SELECT il.invoice.id FROM InvoiceLine il WHERE il.salesOrderLine.salesOrder.id = :orderid ORDER BY il.invoice.creationDate ASC");
    Query qryRelatedInvoices = OBDal.getInstance().getSession()
        .createQuery(involvedInvoicedHqlQueryWhereStr.toString());
    qryRelatedInvoices.setParameter("orderid", orderId);

    ScrollableResults relatedInvoices = qryRelatedInvoices.scroll(ScrollMode.FORWARD_ONLY);

    while (relatedInvoices.next()) {
      lstInvoicesIds.add((String) relatedInvoices.get(0));
    }

    if (lstInvoicesIds.size() > 0 && lstInvoicesIds.size() <= 1) {
      lstInvoices.add(OBDal.getInstance().get(Invoice.class, lstInvoicesIds.get(0)));
      return lstInvoices;
    } else if (lstInvoices.size() > 1) {
      // TODO several invoices
      return null;
    } else {
      return null;
    }
  }

  protected void createInvoice(Invoice invoice, Order order, JSONObject jsonorder)
      throws JSONException {
    Entity invoiceEntity = ModelProvider.getInstance().getEntity(Invoice.class);
    JSONPropertyToEntity.fillBobFromJSON(invoiceEntity, invoice, jsonorder,
        jsonorder.getLong("timezoneOffset"));
    if (jsonorder.has("id")) {
      invoice.setId(jsonorder.getString("id"));
      invoice.setNewOBObject(true);
    }
    int pricePrecision = order.getCurrency().getObposPosprecision() == null ? order.getCurrency()
        .getPricePrecision().intValue() : order.getCurrency().getObposPosprecision().intValue();

    String description;
    if (jsonorder.has("Invoice.description")) {
      // in case the description is directly set to Invoice entity, preserve it
      description = jsonorder.getString("Invoice.description");
    } else {
      // other case use generic description if present and add relationship to order
      if (jsonorder.has("description") && !jsonorder.getString("description").equals("")) {
        description = jsonorder.getString("description") + "\n";
      } else {
        description = "";
      }
      description += OBMessageUtils.getI18NMessage("OBPOS_InvoiceRelatedToOrder", null)
          + jsonorder.getString("documentNo");
    }

    invoice.setDescription(description);
    invoice
        .setDocumentType(getInvoiceDocumentType((String) DalUtil.getId(order.getDocumentType())));
    invoice.setTransactionDocument(getInvoiceDocumentType((String) DalUtil.getId(order
        .getDocumentType())));

    if (useOrderDocumentNoForRelatedDocs) {
      invoice.setDocumentNo(order.getDocumentNo());
    } else {
      invoice.setDocumentNo(getDummyDocumentNo());
      addDocumentNoHandler(invoice, invoiceEntity, invoice.getTransactionDocument(),
          invoice.getDocumentType());
    }

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
    invoice.setGrandTotalAmount(BigDecimal.valueOf(jsonorder.getDouble("gross")).setScale(
        pricePrecision, RoundingMode.HALF_UP));
    invoice.setSummedLineAmount(BigDecimal.valueOf(jsonorder.getDouble("net")).setScale(
        pricePrecision, RoundingMode.HALF_UP));
    invoice.setTotalPaid(BigDecimal.ZERO);
    invoice.setOutstandingAmount((BigDecimal.valueOf(jsonorder.getDouble("gross"))).setScale(
        pricePrecision, RoundingMode.HALF_UP));
    invoice.setDueAmount((BigDecimal.valueOf(jsonorder.getDouble("gross"))).setScale(
        pricePrecision, RoundingMode.HALF_UP));
    invoice.setUserContact(order.getUserContact());

    // Create invoice tax lines
    JSONObject taxes = jsonorder.getJSONObject("taxes");
    @SuppressWarnings("unchecked")
    Iterator<String> itKeys = taxes.keys();
    int i = 0;
    while (itKeys.hasNext()) {
      String taxId = itKeys.next();
      JSONObject jsonOrderTax = taxes.getJSONObject(taxId);
      InvoiceTax invoiceTax = OBProvider.getInstance().get(InvoiceTax.class);
      TaxRate tax = (TaxRate) OBDal.getInstance().getProxy(
          ModelProvider.getInstance().getEntity(TaxRate.class).getName(), taxId);
      invoiceTax.setTax(tax);
      invoiceTax.setTaxableAmount(BigDecimal.valueOf(jsonOrderTax.getDouble("net")).setScale(
          pricePrecision, RoundingMode.HALF_UP));
      invoiceTax.setTaxAmount(BigDecimal.valueOf(jsonOrderTax.getDouble("amount")).setScale(
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
    BigDecimal total = invoice.getGrandTotalAmount().setScale(pricePrecision, RoundingMode.HALF_UP);

    if (!invoice.getCurrency().equals(invoice.getBusinessPartner().getPriceList().getCurrency())) {
      total = convertCurrencyInvoice(invoice);
    }
    OBContext.setAdminMode(false);
    try {
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

  protected boolean isMultipleShipmentLine(Invoice invoice) {
    OrderLine ol = null;
    for (InvoiceLine il : invoice.getInvoiceLineList()) {
      if (ol != null && ol.equals(il.getSalesOrderLine())) {
        return true;
      }
      ol = il.getSalesOrderLine();
    }
    return false;
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

  protected void createShipmentLines(ShipmentInOut shipment, Order order, JSONObject jsonorder,
      JSONArray orderlines, ArrayList<OrderLine> lineReferences, List<Locator> locatorList)
      throws JSONException {
    int lineNo = 0;
    Locator foundSingleBin = null;
    Entity shplineentity = ModelProvider.getInstance().getEntity(ShipmentInOutLine.class);

    if (locatorList.size() == 1) {
      foundSingleBin = locatorList.get(0);
    }
    for (int i = 0; i < orderlines.length(); i++) {
      String hqlWhereClause;

      OrderLine orderLine = lineReferences.get(i);
      BigDecimal pendingQty = orderLine.getOrderedQuantity().abs();
      boolean negativeLine = orderLine.getOrderedQuantity().compareTo(BigDecimal.ZERO) < 0;

      final Warehouse warehouse = (orderLine.getWarehouse() != null ? orderLine.getWarehouse()
          : order.getWarehouse());

      boolean useSingleBin = foundSingleBin != null && orderLine.getAttributeSetValue() == null
          && orderLine.getProduct().getAttributeSet() == null
          && orderLine.getWarehouseRule() == null
          && (DalUtil.getId(order.getWarehouse()).equals(DalUtil.getId(warehouse)));

      AttributeSetInstance oldAttributeSetValues = null;

      if (negativeLine) {
        lineNo += 10;
        Locator binForReturn = null;
        if (orderLine.getWarehouse() != null && orderLine.getWarehouse().getReturnlocator() != null) {
          binForReturn = orderLine.getWarehouse().getReturnlocator();
        } else {
          binForReturn = getBinForReturns(jsonorder.getString("posTerminal"));
        }
        addShipmentline(shipment, shplineentity, orderlines.getJSONObject(i), orderLine, jsonorder,
            lineNo, pendingQty.negate(), binForReturn, null, i);
      } else if (useSingleBin) {
        lineNo += 10;
        addShipmentline(shipment, shplineentity, orderlines.getJSONObject(i), orderLine, jsonorder,
            lineNo, pendingQty, foundSingleBin, null, i);
      } else {
        HashMap<String, ShipmentInOutLine> usedBins = new HashMap<String, ShipmentInOutLine>();
        if (pendingQty.compareTo(BigDecimal.ZERO) > 0) {

          String id = callProcessGetStock(
              orderLine.getId(),
              (String) DalUtil.getId(orderLine.getClient()),
              (String) DalUtil.getId(orderLine.getOrganization()),
              (String) DalUtil.getId(orderLine.getProduct()),
              (String) DalUtil.getId(orderLine.getUOM()),
              (String) DalUtil.getId(warehouse),
              orderLine.getAttributeSetValue() != null ? (String) DalUtil.getId(orderLine
                  .getAttributeSetValue()) : null,
              pendingQty,
              orderLine.getWarehouseRule() != null ? (String) DalUtil.getId(orderLine
                  .getWarehouseRule()) : null, null);

          OBCriteria<StockProposed> stockProposed = OBDal.getInstance().createCriteria(
              StockProposed.class);
          stockProposed.add(Restrictions.eq(StockProposed.PROPERTY_PROCESSINSTANCE, id));
          stockProposed.addOrderBy(StockProposed.PROPERTY_PRIORITY, true);

          ScrollableResults bins = stockProposed.scroll(ScrollMode.FORWARD_ONLY);

          boolean foundStockProposed = false;
          try {
            while (pendingQty.compareTo(BigDecimal.ZERO) > 0 && bins.next()) {
              foundStockProposed = true;
              // TODO: Can we safely clear session here?
              StockProposed stock = (StockProposed) bins.get(0);
              BigDecimal qty;

              Object stockQty = stock.get("quantity");
              if (stockQty instanceof Long) {
                stockQty = new BigDecimal((Long) stockQty);
              }
              if (pendingQty.compareTo((BigDecimal) stockQty) > 0) {
                qty = (BigDecimal) stockQty;
                pendingQty = pendingQty.subtract(qty);
              } else {
                qty = pendingQty;
                pendingQty = BigDecimal.ZERO;
              }
              lineNo += 10;
              if (negativeLine) {
                qty = qty.negate();
              }
              ShipmentInOutLine objShipmentLine = addShipmentline(shipment, shplineentity,
                  orderlines.getJSONObject(i), orderLine, jsonorder, lineNo, qty, stock
                      .getStorageDetail().getStorageBin(), stock.getStorageDetail()
                      .getAttributeSetValue(), i);

              usedBins.put(stock.getStorageDetail().getStorageBin().getId(), objShipmentLine);

            }
          } finally {
            bins.close();
          }
          if (!foundStockProposed && orderLine.getProduct().getAttributeSet() != null) {
            // M_GetStock couldn't find any valid stock, and the product has an attribute set. We
            // will
            // attempt to find an old transaction for this product, and get the attribute values
            // from
            // there
            OBCriteria<ShipmentInOutLine> oldLines = OBDal.getInstance().createCriteria(
                ShipmentInOutLine.class);
            oldLines
                .add(Restrictions.eq(ShipmentInOutLine.PROPERTY_PRODUCT, orderLine.getProduct()));
            oldLines.setMaxResults(1);
            oldLines.addOrderBy(ShipmentInOutLine.PROPERTY_CREATIONDATE, false);
            List<ShipmentInOutLine> oldLine = oldLines.list();
            if (oldLine.size() > 0) {
              oldAttributeSetValues = oldLine.get(0).getAttributeSetValue();
            }

          }
        }

        if (pendingQty.compareTo(BigDecimal.ZERO) != 0) {
          // still qty to ship or return: let's use the bin with highest prio
          hqlWhereClause = " l where l.warehouse = :warehouse order by l.relativePriority, l.id";
          OBQuery<Locator> queryLoc = OBDal.getInstance()
              .createQuery(Locator.class, hqlWhereClause);
          queryLoc.setNamedParameter("warehouse", warehouse);
          queryLoc.setMaxResult(1);
          lineNo += 10;
          if (jsonorder.getLong("orderType") == 1) {
            pendingQty = pendingQty.negate();
          }
          ShipmentInOutLine objShipmentInOutLine = usedBins.get(queryLoc.list().get(0).getId());
          if (objShipmentInOutLine != null) {
            objShipmentInOutLine.setMovementQuantity(objShipmentInOutLine.getMovementQuantity()
                .add(pendingQty));
            OBDal.getInstance().save(objShipmentInOutLine);
          } else {
            addShipmentline(shipment, shplineentity, orderlines.getJSONObject(i), orderLine,
                jsonorder, lineNo, pendingQty, queryLoc.list().get(0), oldAttributeSetValues, i);
          }
        }
      }
    }
  }

  private ShipmentInOutLine addShipmentline(ShipmentInOut shipment, Entity shplineentity,
      JSONObject jsonOrderLine, OrderLine orderLine, JSONObject jsonorder, long lineNo,
      BigDecimal qty, Locator bin, AttributeSetInstance attributeSetInstance, int i)
      throws JSONException {
    ShipmentInOutLine line = OBProvider.getInstance().get(ShipmentInOutLine.class);
    String shipmentLineId = OBMOBCUtils.getUUIDbyString(orderLine.getId() + lineNo + i);
    JSONPropertyToEntity.fillBobFromJSON(shplineentity, line, jsonOrderLine,
        jsonorder.getLong("timezoneOffset"));
    JSONPropertyToEntity.fillBobFromJSON(
        ModelProvider.getInstance().getEntity(ShipmentInOutLine.class), line, jsonorder,
        jsonorder.getLong("timezoneOffset"));
    line.setId(shipmentLineId);
    line.setNewOBObject(true);
    line.setLineNo(lineNo);
    line.setShipmentReceipt(shipment);
    line.setSalesOrderLine(orderLine);

    orderLine.getMaterialMgmtShipmentInOutLineList().add(line);

    line.setMovementQuantity(qty);
    line.setStorageBin(bin);
    if (attributeSetInstance != null) {
      line.setAttributeSetValue(attributeSetInstance);
    }
    shipment.getMaterialMgmtShipmentInOutLineList().add(line);
    OBDal.getInstance().save(line);
    return line;
  }

  protected void createShipment(ShipmentInOut shipment, Order order, JSONObject jsonorder)
      throws JSONException {
    Entity shpEntity = ModelProvider.getInstance().getEntity(ShipmentInOut.class);
    JSONPropertyToEntity.fillBobFromJSON(shpEntity, shipment, jsonorder,
        jsonorder.getLong("timezoneOffset"));
    if (jsonorder.has("id")) {
      shipment.setId(jsonorder.getString("id"));
      shipment.setNewOBObject(true);
    }
    shipment
        .setDocumentType(getShipmentDocumentType((String) DalUtil.getId(order.getDocumentType())));

    if (useOrderDocumentNoForRelatedDocs) {
      String docNum = order.getDocumentNo();
      if (order.getMaterialMgmtShipmentInOutList().size() > 0) {
        docNum += "-" + order.getMaterialMgmtShipmentInOutList().size();
      }
      shipment.setDocumentNo(docNum);
    } else {
      addDocumentNoHandler(shipment, shpEntity, null, shipment.getDocumentType());
    }

    if (shipment.getMovementDate() == null) {
      shipment.setMovementDate(order.getOrderDate());
    }
    if (shipment.getAccountingDate() == null) {
      shipment.setAccountingDate(order.getOrderDate());
    }

    shipment.setPartnerAddress(OBDal.getInstance().get(Location.class,
        jsonorder.getJSONObject("bp").getString("locId")));
    shipment.setSalesTransaction(true);
    shipment.setDocumentStatus("CO");
    shipment.setDocumentAction("--");
    shipment.setMovementType("C-");
    shipment.setProcessNow(false);
    shipment.setProcessed(true);
    shipment.setSalesOrder(order);
    shipment.setProcessGoodsJava("--");
  }

  protected void createOrderLines(Order order, JSONObject jsonorder, JSONArray orderlines,
      ArrayList<OrderLine> lineReferences) throws JSONException {
    Entity orderLineEntity = ModelProvider.getInstance().getEntity(OrderLine.class);
    Entity promotionLineEntity = ModelProvider.getInstance().getEntity(OrderLineOffer.class);
    int pricePrecision = order.getCurrency().getObposPosprecision() == null ? order.getCurrency()
        .getPricePrecision().intValue() : order.getCurrency().getObposPosprecision().intValue();

    for (int i = 0; i < orderlines.length(); i++) {

      OrderLine orderline = OBProvider.getInstance().get(OrderLine.class);
      JSONObject jsonOrderLine = orderlines.getJSONObject(i);
      if (!jsonOrderLine.has("preserveId") || jsonOrderLine.getBoolean("preserveId")) {
        orderline.setId(jsonOrderLine.getString("id"));
        orderline.setNewOBObject(true);
      }

      JSONPropertyToEntity.fillBobFromJSON(ModelProvider.getInstance().getEntity(OrderLine.class),
          orderline, jsonorder, jsonorder.getLong("timezoneOffset"));
      JSONPropertyToEntity.fillBobFromJSON(orderLineEntity, orderline, jsonOrderLine,
          jsonorder.getLong("timezoneOffset"));
      if (jsonOrderLine.has("id")) {
        orderline.setId(jsonOrderLine.getString("id"));
        orderline.setNewOBObject(true);
      }
      orderline.setActive(true);
      orderline.setSalesOrder(order);
      if (jsonOrderLine.has("obposIsDeleted") && jsonOrderLine.getBoolean("obposIsDeleted")) {
        orderline.setObposQtyDeleted(orderline.getOrderedQuantity());
        orderline.setOrderedQuantity(BigDecimal.ZERO);
      }
      orderline.setLineNetAmount(BigDecimal.valueOf(jsonOrderLine.getDouble("net")).setScale(
          pricePrecision, RoundingMode.HALF_UP));

      if (createShipment) {
        // shipment is created, so all is delivered
        orderline.setDeliveredQuantity(orderline.getOrderedQuantity());
      }

      lineReferences.add(orderline);
      orderline.setLineNo((long) ((i + 1) * 10));
      order.getOrderLineList().add(orderline);
      OBDal.getInstance().save(orderline);

      if ("S".equals(orderline.getProduct().getProductType())) {
        // related can be null
        if (jsonOrderLine.has("relatedLines")) {
          orderLineServiceList.put(orderline.getId(), jsonOrderLine.getJSONArray("relatedLines"));
        } else {
          orderLineServiceList.put(orderline.getId(), null);
        }
      }

      JSONObject taxes = jsonOrderLine.getJSONObject("taxLines");
      @SuppressWarnings("unchecked")
      Iterator<String> itKeys = taxes.keys();
      int ind = 0;
      while (itKeys.hasNext()) {
        String taxId = itKeys.next();
        JSONObject jsonOrderTax = taxes.getJSONObject(taxId);
        OrderLineTax orderlinetax = OBProvider.getInstance().get(OrderLineTax.class);
        TaxRate tax = (TaxRate) OBDal.getInstance().getProxy(
            ModelProvider.getInstance().getEntity(TaxRate.class).getName(), taxId);
        orderlinetax.setTax(tax);
        orderlinetax.setTaxableAmount(BigDecimal.valueOf(jsonOrderTax.getDouble("net")).setScale(
            pricePrecision, RoundingMode.HALF_UP));
        orderlinetax.setTaxAmount(BigDecimal.valueOf(jsonOrderTax.getDouble("amount")).setScale(
            pricePrecision, RoundingMode.HALF_UP));
        orderlinetax.setSalesOrder(order);
        orderlinetax.setSalesOrderLine(orderline);
        orderlinetax.setLineNo((long) ((ind + 1) * 10));
        ind++;
        orderline.getOrderLineTaxList().add(orderlinetax);
        order.getOrderLineTaxList().add(orderlinetax);
        orderlinetax.setId(OBMOBCUtils.getUUIDbyString(orderlinetax.getSalesOrderLine().getId()
            + orderlinetax.getLineNo()));
        orderlinetax.setNewOBObject(true);
        OBDal.getInstance().save(orderlinetax);
      }

      // Discounts & Promotions
      if (jsonOrderLine.has("promotions") && !jsonOrderLine.isNull("promotions")
          && !jsonOrderLine.getString("promotions").equals("null")) {
        JSONArray jsonPromotions = jsonOrderLine.getJSONArray("promotions");
        for (int p = 0; p < jsonPromotions.length(); p++) {
          JSONObject jsonPromotion = jsonPromotions.getJSONObject(p);
          boolean hasActualAmt = jsonPromotion.has("actualAmt");
          if ((hasActualAmt && jsonPromotion.getDouble("actualAmt") == 0)
              || (!hasActualAmt && jsonPromotion.getDouble("amt") == 0)) {
            continue;
          }

          OrderLineOffer promotion = OBProvider.getInstance().get(OrderLineOffer.class);
          JSONPropertyToEntity.fillBobFromJSON(promotionLineEntity, promotion, jsonPromotion,
              jsonorder.getLong("timezoneOffset"));

          if (hasActualAmt) {
            promotion.setTotalAmount(BigDecimal.valueOf(jsonPromotion.getDouble("actualAmt"))
                .setScale(pricePrecision, RoundingMode.HALF_UP));
          } else {
            promotion.setTotalAmount(BigDecimal.valueOf(jsonPromotion.getDouble("amt")).setScale(
                pricePrecision, RoundingMode.HALF_UP));
          }
          promotion.setLineNo((long) ((p + 1) * 10));
          promotion.setSalesOrderLine(orderline);
          if (jsonPromotion.has("identifier") && !jsonPromotion.isNull("identifier")) {
            promotion.setObdiscIdentifier(jsonPromotion.getString("identifier"));
          }
          promotion.setId(OBMOBCUtils.getUUIDbyString(orderline.getId() + p));
          promotion.setNewOBObject(true);
          orderline.getOrderLineOfferList().add(promotion);
        }
      }
    }
  }

  protected void createLinesForServiceProduct() throws JSONException {
    Iterator<Entry<String, JSONArray>> orderLineIterator = orderLineServiceList.entrySet()
        .iterator();
    while (orderLineIterator.hasNext()) {
      Entry<String, JSONArray> olservice = orderLineIterator.next();
      OrderLine orderLine = OBDal.getInstance().get(OrderLine.class, olservice.getKey());
      JSONArray relatedLines = olservice.getValue();
      if (relatedLines != null) {
        for (int i = 0; i < relatedLines.length(); i++) {
          OrderlineServiceRelation olServiceRelation = OBProvider.getInstance().get(
              OrderlineServiceRelation.class);
          JSONObject relatedJsonOrderLine = relatedLines.getJSONObject(i);
          OrderLine rol = OBDal.getInstance().get(OrderLine.class,
              relatedJsonOrderLine.get("orderlineId"));
          if (rol != null) {
            olServiceRelation.setActive(true);
            olServiceRelation.setOrganization(orderLine.getOrganization());
            olServiceRelation.setCreatedBy(orderLine.getCreatedBy());
            olServiceRelation.setCreationDate(orderLine.getCreationDate());
            if ("UQ".equals(orderLine.getProduct().getQuantityRule())) {
              if (orderLine.getOrderedQuantity().compareTo(BigDecimal.ZERO) > 0) {
                olServiceRelation.setQuantity(BigDecimal.ONE);
              } else {
                olServiceRelation.setQuantity(new BigDecimal(-1));
              }
            } else {
              if (rol.getOrderedQuantity().signum() != orderLine.getOrderedQuantity().signum()) {
                olServiceRelation.setQuantity(rol.getOrderedQuantity().negate());
              } else {
                olServiceRelation.setQuantity(rol.getOrderedQuantity());
              }

            }
            olServiceRelation.setAmount(rol.getBaseGrossUnitPrice().multiply(
                olServiceRelation.getQuantity()));
            olServiceRelation.setUpdated(orderLine.getUpdated());
            olServiceRelation.setUpdatedBy(orderLine.getUpdatedBy());
            olServiceRelation.setSalesOrderLine(orderLine);
            olServiceRelation.setOrderlineRelated(rol);
            olServiceRelation.setId(OBMOBCUtils.getUUIDbyString(orderLine.getId()
                + orderLine.getLineNo() + i));
            olServiceRelation.setNewOBObject(true);
            OBDal.getInstance().save(olServiceRelation);
          }
        }
      }
    }
  }

  protected void createOrder(Order order, JSONObject jsonorder) throws JSONException {
    Entity orderEntity = ModelProvider.getInstance().getEntity(Order.class);
    if (jsonorder.has("description")
        && StringUtils.length(jsonorder.getString("description")) > 255) {
      jsonorder.put("description",
          StringUtils.substring(jsonorder.getString("description"), 0, 255));
    }
    JSONPropertyToEntity.fillBobFromJSON(orderEntity, order, jsonorder,
        jsonorder.getLong("timezoneOffset"));
    if (jsonorder.has("id")) {
      order.setId(jsonorder.getString("id"));
      order.setNewOBObject(true);
    }
    int pricePrecision = order.getCurrency().getObposPosprecision() == null ? order.getCurrency()
        .getPricePrecision().intValue() : order.getCurrency().getObposPosprecision().intValue();
    BusinessPartner bp = order.getBusinessPartner();
    order.setTransactionDocument((DocumentType) OBDal.getInstance().getProxy("DocumentType",
        jsonorder.getString("documentType")));
    order.setAccountingDate(order.getOrderDate());
    order.setScheduledDeliveryDate(order.getOrderDate());
    order.setPartnerAddress(OBDal.getInstance().get(Location.class,
        jsonorder.getJSONObject("bp").getString("locId")));
    order.setInvoiceAddress(order.getPartnerAddress());
    order.setPaymentMethod((FIN_PaymentMethod) bp.getPaymentMethod());
    if (bp.getPaymentTerms() != null) {
      order.setPaymentTerms((PaymentTerm) bp.getPaymentTerms());
    } else {
      order.setPaymentTerms(OBDal.getInstance().get(PaymentTerm.class,
          jsonorder.getJSONObject("bp").getString("paymentTerms")));
    }
    order.setInvoiceTerms(bp.getInvoiceTerms());
    order.setGrandTotalAmount(BigDecimal.valueOf(jsonorder.getDouble("gross")).setScale(
        pricePrecision, RoundingMode.HALF_UP));
    order.setSummedLineAmount(BigDecimal.valueOf(jsonorder.getDouble("net")).setScale(
        pricePrecision, RoundingMode.HALF_UP));

    order.setSalesTransaction(true);
    if (jsonorder.has("obposIsDeleted") && jsonorder.has("isQuotation")
        && jsonorder.getBoolean("obposIsDeleted")) {
      order.setDocumentStatus("CL");
      order.setGrandTotalAmount(BigDecimal.ZERO);
      order.setSummedLineAmount(BigDecimal.ZERO);
    } else if (jsonorder.getBoolean("isQuotation")) {
      order.setDocumentStatus("UE");
    } else {
      order.setDocumentStatus("CO");
    }
    order.setDocumentAction("--");
    order.setProcessed(true);
    order.setProcessNow(false);
    order.setObposSendemail((jsonorder.has("sendEmail") && jsonorder.getBoolean("sendEmail")));

    if (order.getDocumentNo().indexOf("/") > -1) {
      long documentno = Long.parseLong(order.getDocumentNo().substring(
          order.getDocumentNo().lastIndexOf("/") + 1));

      if (jsonorder.has("isQuotation") && jsonorder.getBoolean("isQuotation")) {
        if (order.getObposApplications().getQuotationslastassignednum() == null
            || documentno > order.getObposApplications().getQuotationslastassignednum()) {
          OBPOSApplications terminal = order.getObposApplications();
          terminal.setQuotationslastassignednum(documentno);
          OBDal.getInstance().save(terminal);
        }
      } else {
        if (order.getObposApplications().getLastassignednum() == null
            || documentno > order.getObposApplications().getLastassignednum()) {
          OBPOSApplications terminal = order.getObposApplications();
          terminal.setLastassignednum(documentno);
          OBDal.getInstance().save(terminal);
        }
      }
    }

    if (!bp.getADUserList().isEmpty()) {
      String userHqlWhereClause = " usr where usr.businessPartner = :bp and usr.organization.id in (:orgs) order by username";
      OBQuery<User> queryUser = OBDal.getInstance().createQuery(User.class, userHqlWhereClause);
      queryUser.setNamedParameter("bp", order.getBusinessPartner());
      queryUser.setNamedParameter("orgs", OBContext.getOBContext()
          .getOrganizationStructureProvider().getNaturalTree(order.getOrganization().getId()));
      // already filtered
      queryUser.setFilterOnReadableOrganization(false);
      queryUser.setMaxResult(1);
      List<User> lstResultUsers = queryUser.list();
      if (lstResultUsers != null && lstResultUsers.size() > 0) {
        order.setUserContact(lstResultUsers.get(0));
      }
    }

    JSONObject taxes = jsonorder.getJSONObject("taxes");
    @SuppressWarnings("unchecked")
    Iterator<String> itKeys = taxes.keys();
    int i = 0;
    while (itKeys.hasNext()) {
      String taxId = itKeys.next();
      JSONObject jsonOrderTax = taxes.getJSONObject(taxId);
      OrderTax orderTax = OBProvider.getInstance().get(OrderTax.class);
      TaxRate tax = (TaxRate) OBDal.getInstance().getProxy(
          ModelProvider.getInstance().getEntity(TaxRate.class).getName(), taxId);
      orderTax.setTax(tax);
      orderTax.setTaxableAmount(BigDecimal.valueOf(jsonOrderTax.getDouble("net")).setScale(
          pricePrecision, RoundingMode.HALF_UP));
      orderTax.setTaxAmount(BigDecimal.valueOf(jsonOrderTax.getDouble("amount")).setScale(
          pricePrecision, RoundingMode.HALF_UP));
      orderTax.setSalesOrder(order);
      orderTax.setLineNo((long) ((i + 1) * 10));
      orderTax.setId(OBMOBCUtils.getUUIDbyString(orderTax.getSalesOrder().getId()
          + orderTax.getLineNo()));
      orderTax.setNewOBObject(true);
      i++;
      order.getOrderTaxList().add(orderTax);
    }
  }

  protected void handleStock(ShipmentInOut shipment, CallableStatement updateStockStatement) {
    for (ShipmentInOutLine line : shipment.getMaterialMgmtShipmentInOutLineList()) {
      if (line.getProduct().getProductType().equals("I") && line.getProduct().isStocked()) {
        // Stock is changed only for stocked products of type "Item"
        MaterialTransaction transaction = OBProvider.getInstance().get(MaterialTransaction.class);
        transaction.setOrganization(line.getOrganization());
        transaction.setMovementType(shipment.getMovementType());
        transaction.setProduct(line.getProduct());
        transaction.setStorageBin(line.getStorageBin());
        transaction.setOrderUOM(line.getOrderUOM());
        transaction.setUOM(line.getUOM());
        transaction.setOrderQuantity(line.getOrderQuantity());
        transaction.setMovementQuantity(line.getMovementQuantity().multiply(NEGATIVE_ONE));
        transaction.setMovementDate(shipment.getMovementDate());
        transaction.setGoodsShipmentLine(line);
        transaction.setAttributeSetValue(line.getAttributeSetValue());
        transaction.setId(line.getId());
        transaction.setNewOBObject(true);

        updateInventory(transaction, updateStockStatement);

        OBDal.getInstance().save(transaction);
      }
    }
  }

  protected void updateInventory(MaterialTransaction transaction,
      CallableStatement updateStockStatement) {
    try {
      // client
      updateStockStatement.setString(1, OBContext.getOBContext().getCurrentClient().getId());
      // org
      updateStockStatement.setString(2, OBContext.getOBContext().getCurrentOrganization().getId());
      // user
      updateStockStatement.setString(3, OBContext.getOBContext().getUser().getId());
      // product
      updateStockStatement.setString(4, transaction.getProduct().getId());
      // locator
      updateStockStatement.setString(5, transaction.getStorageBin().getId());
      // attributesetinstance
      updateStockStatement.setString(6, transaction.getAttributeSetValue() != null ? transaction
          .getAttributeSetValue().getId() : null);
      // uom
      updateStockStatement.setString(7, transaction.getUOM().getId());
      // product uom
      updateStockStatement.setString(8, null);
      // p_qty
      updateStockStatement.setBigDecimal(9,
          transaction.getMovementQuantity() != null ? transaction.getMovementQuantity() : null);
      // p_qtyorder
      updateStockStatement.setBigDecimal(10,
          transaction.getOrderQuantity() != null ? transaction.getOrderQuantity() : null);
      // p_dateLastInventory --- **
      updateStockStatement.setDate(11, null);
      // p_preqty
      updateStockStatement.setBigDecimal(12, BigDecimal.ZERO);
      // p_preqtyorder
      updateStockStatement.setBigDecimal(13, transaction.getOrderQuantity() != null ? transaction
          .getOrderQuantity().multiply(NEGATIVE_ONE) : null);

      updateStockStatement.execute();

    } catch (Exception e) {
      throw new OBException(e.getMessage(), e);
    }
  }

  protected Date getCalculatedDueDateBasedOnPaymentTerms(Date startingDate, PaymentTerm paymentTerms) {
    // TODO Take into account the flag "Next business date"
    // TODO Take into account the flag "Fixed due date"
    long daysToAdd = paymentTerms.getOverduePaymentDaysRule();
    long MonthOffset = paymentTerms.getOffsetMonthDue();
    String dayToPay = paymentTerms.getOverduePaymentDayRule();
    Calendar calculatedDueDate = new GregorianCalendar();
    calculatedDueDate.setTime(startingDate);
    if (MonthOffset > 0) {
      calculatedDueDate.add(Calendar.MONTH, (int) MonthOffset);
    }
    if (daysToAdd > 0) {
      calculatedDueDate.add(Calendar.DATE, (int) daysToAdd);
    }
    if (dayToPay != null && !dayToPay.equals("")) {
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

  public JSONObject handlePayments(JSONObject jsonorder, Order order, Invoice invoice,
      Boolean wasPaidOnCredit) throws Exception {
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
      int pricePrecision = order.getCurrency().getObposPosprecision() == null ? order.getCurrency()
          .getPricePrecision().intValue() : order.getCurrency().getObposPosprecision().intValue();
      if ((!newLayaway && (notpaidLayaway || creditpaidLayaway || fullypaidLayaway))
          || partialpaidLayaway) {
        paymentSchedule = order.getFINPaymentScheduleList().get(0);
      } else {
        paymentSchedule = OBProvider.getInstance().get(FIN_PaymentSchedule.class);
        paymentSchedule.setId(order.getId());
        paymentSchedule.setNewOBObject(true);
        paymentSchedule.setCurrency(order.getCurrency());
        paymentSchedule.setOrder(order);
        paymentSchedule.setFinPaymentmethod(order.getBusinessPartner().getPaymentMethod());
        // paymentSchedule.setPaidAmount(new BigDecimal(0));
        paymentSchedule.setAmount(BigDecimal.valueOf(jsonorder.getDouble("gross")).setScale(
            pricePrecision, RoundingMode.HALF_UP));
        // Sept 2012 -> gross because outstanding is not allowed in Openbravo Web POS
        paymentSchedule.setOutstandingAmount(BigDecimal.valueOf(jsonorder.getDouble("gross"))
            .setScale(pricePrecision, RoundingMode.HALF_UP));
        paymentSchedule.setDueDate(order.getOrderDate());
        paymentSchedule.setExpectedDate(order.getOrderDate());
        if (ModelProvider.getInstance().getEntity(FIN_PaymentSchedule.class)
            .hasProperty("origDueDate")) {
          // This property is checked and set this way to force compatibility with both MP13, MP14
          // and
          // later releases of Openbravo. This property is mandatory and must be set. Check issue
          paymentSchedule.set("origDueDate", paymentSchedule.getDueDate());
        }
        paymentSchedule.setFINPaymentPriority(order.getFINPaymentPriority());
        OBDal.getInstance().save(paymentSchedule);
      }
      Boolean isInvoicePaymentScheduleNew = false;
      FIN_PaymentSchedule paymentScheduleInvoice = null;
      if (invoice != null && invoice.getGrandTotalAmount().compareTo(BigDecimal.ZERO) != 0) {
        List<FIN_PaymentSchedule> invoicePaymentSchedules = invoice.getFINPaymentScheduleList();
        if (invoicePaymentSchedules.size() > 0) {
          if (invoicePaymentSchedules.size() == 1) {
            paymentScheduleInvoice = invoicePaymentSchedules.get(0);
          } else {
            paymentScheduleInvoice = invoicePaymentSchedules.get(0);
            log.warn("Invoice have more than one payment schedule. First one was selected");
          }
        } else {
          paymentScheduleInvoice = OBProvider.getInstance().get(FIN_PaymentSchedule.class);
          isInvoicePaymentScheduleNew = true;
        }
        paymentScheduleInvoice.setCurrency(order.getCurrency());
        paymentScheduleInvoice.setInvoice(invoice);
        paymentScheduleInvoice.setFinPaymentmethod(order.getBusinessPartner().getPaymentMethod());
        paymentScheduleInvoice.setAmount(BigDecimal.valueOf(jsonorder.getDouble("gross")).setScale(
            pricePrecision, RoundingMode.HALF_UP));
        paymentScheduleInvoice.setOutstandingAmount(BigDecimal
            .valueOf(jsonorder.getDouble("gross")).setScale(pricePrecision, RoundingMode.HALF_UP));
        // TODO: If the payment terms is configured to work with fractionated payments, we should
        // generate several payment schedules
        if (wasPaidOnCredit) {
          paymentScheduleInvoice.setDueDate(getCalculatedDueDateBasedOnPaymentTerms(
              order.getOrderDate(), order.getPaymentTerms()));
          paymentScheduleInvoice.setExpectedDate(paymentScheduleInvoice.getDueDate());
        } else {
          paymentScheduleInvoice.setDueDate(order.getOrderDate());
          paymentScheduleInvoice.setExpectedDate(order.getOrderDate());
        }

        if (ModelProvider.getInstance().getEntity(FIN_PaymentSchedule.class)
            .hasProperty("origDueDate")) {
          // This property is checked and set this way to force compatibility with both MP13, MP14
          // and
          // later releases of Openbravo. This property is mandatory and must be set. Check issue
          paymentScheduleInvoice.set("origDueDate", paymentScheduleInvoice.getDueDate());
        }
        paymentScheduleInvoice.setFINPaymentPriority(order.getFINPaymentPriority());
        if (isInvoicePaymentScheduleNew) {
          invoice.getFINPaymentScheduleList().add(paymentScheduleInvoice);
          OBDal.getInstance().save(paymentScheduleInvoice);
        }
      }

      BigDecimal gross = BigDecimal.valueOf(jsonorder.getDouble("gross"));
      BigDecimal writeoffAmt = amt.subtract(gross.abs());

      for (int i = 0; i < payments.length(); i++) {
        JSONObject payment = payments.getJSONObject(i);
        OBPOSAppPayment paymentType = null;
        if (payment.has("isPrePayment") && payment.getBoolean("isPrePayment")) {
          continue;
        }
        BigDecimal paid = BigDecimal.valueOf(payment.getDouble("paid"));
        if (paid.compareTo(BigDecimal.ZERO) == 0) {
          continue;
        }
        String paymentTypeName = payment.getString("kind");
        for (OBPOSAppPayment type : posTerminal.getOBPOSAppPaymentList()) {
          if (type.getSearchKey().equals(paymentTypeName)) {
            paymentType = type;
          }
        }
        if (paymentType == null) {
          @SuppressWarnings("unchecked")
          Class<PaymentProcessor> paymentclazz = (Class<PaymentProcessor>) Class
              .forName(paymentTypeName);
          PaymentProcessor paymentinst = paymentclazz.newInstance();
          paymentinst.process(payment, order, invoice, writeoffAmt);
        } else {
          if (paymentType.getFinancialAccount() == null) {
            continue;
          }
          BigDecimal amount = BigDecimal.valueOf(payment.getDouble("origAmount")).setScale(
              pricePrecision, RoundingMode.HALF_UP);
          BigDecimal tempWriteoffAmt = new BigDecimal(writeoffAmt.toString());
          if (writeoffAmt.compareTo(BigDecimal.ZERO) != 0
              && writeoffAmt.compareTo(amount.abs()) == 1) {
            // In case writeoff is higher than amount, we put 1 as payment and rest as overpayment
            // because the payment cannot be 0 (It wouldn't be created)
            tempWriteoffAmt = amount.abs().subtract(BigDecimal.ONE);
          }
          processPayments(paymentSchedule, paymentScheduleInvoice, order, invoice, paymentType,
              payment, tempWriteoffAmt, jsonorder);
          writeoffAmt = writeoffAmt.subtract(tempWriteoffAmt);
        }
      }
      if (invoice != null && (creditpaidLayaway || fullypaidLayaway)) {
        for (int j = 0; j < paymentSchedule.getFINPaymentScheduleDetailOrderPaymentScheduleList()
            .size(); j++) {
          if (paymentSchedule.getFINPaymentScheduleDetailOrderPaymentScheduleList().get(j)
              .getInvoicePaymentSchedule() == null) {
            paymentSchedule.getFINPaymentScheduleDetailOrderPaymentScheduleList().get(j)
                .setInvoicePaymentSchedule(paymentScheduleInvoice);
          }
        }

        BigDecimal amountPaidWithCredit = (BigDecimal.valueOf(jsonorder.getDouble("gross"))
            .subtract(BigDecimal.valueOf(jsonorder.getDouble("payment")))).setScale(pricePrecision,
            RoundingMode.HALF_UP);

        invoice.setTotalPaid(invoice.getGrandTotalAmount().subtract(amountPaidWithCredit));
        invoice.setOutstandingAmount(amountPaidWithCredit);
        invoice.setDueAmount(amountPaidWithCredit);
        invoice.setPaymentComplete(amountPaidWithCredit.compareTo(BigDecimal.ZERO) == 0);
        paymentScheduleInvoice.setOutstandingAmount(amountPaidWithCredit);
        paymentScheduleInvoice.setPaidAmount(invoice.getGrandTotalAmount().subtract(
            amountPaidWithCredit));
        invoice.getFINPaymentScheduleList().add(paymentScheduleInvoice);
        OBDal.getInstance().save(paymentScheduleInvoice);
        OBDal.getInstance().save(invoice);
      }

      BigDecimal diffPaid = BigDecimal.ZERO;
      if ((gross.compareTo(BigDecimal.ZERO) > 0) && (gross.compareTo(amt) > 0)) {
        diffPaid = gross.subtract(amt);
      } else if ((gross.compareTo(BigDecimal.ZERO) < 0)
          && (gross.compareTo(amt.multiply(new BigDecimal("-1"))) < 0)) {
        diffPaid = gross.subtract(amt.multiply(new BigDecimal("-1")));
      }
      // if (payments.length() == 0 ) or (writeoffAmt<0) means that use credit was used
      if ((payments.length() == 0 || diffPaid.compareTo(BigDecimal.ZERO) != 0) && invoice != null
          && invoice.getGrandTotalAmount().compareTo(BigDecimal.ZERO) != 0) {
        FIN_PaymentScheduleDetail paymentScheduleDetail = OBProvider.getInstance().get(
            FIN_PaymentScheduleDetail.class);
        paymentScheduleDetail.setOrderPaymentSchedule(paymentSchedule);
        paymentScheduleDetail.setAmount(diffPaid);
        paymentScheduleDetail.setBusinessPartner(order.getBusinessPartner());
        if (paymentScheduleInvoice != null) {
          paymentScheduleDetail.setInvoicePaymentSchedule(paymentScheduleInvoice);
        }
        paymentScheduleDetail.setId(paymentScheduleInvoice.getId());
        paymentScheduleDetail.setNewOBObject(true);
        OBDal.getInstance().save(paymentScheduleDetail);
      } else if (notpaidLayaway || fullypaidLayaway) {
        // Unlinked PaymentScheduleDetail records will be recreated
        // First all non linked PaymentScheduleDetail records are deleted
        List<FIN_PaymentScheduleDetail> pScheduleDetails = new ArrayList<FIN_PaymentScheduleDetail>();
        pScheduleDetails.addAll(paymentSchedule
            .getFINPaymentScheduleDetailOrderPaymentScheduleList());
        for (FIN_PaymentScheduleDetail pSched : pScheduleDetails) {
          if (pSched.getPaymentDetails() == null) {
            paymentSchedule.getFINPaymentScheduleDetailOrderPaymentScheduleList().remove(pSched);
            if (paymentScheduleInvoice != null
                && paymentScheduleInvoice.getFINPaymentScheduleDetailInvoicePaymentScheduleList() != null
                && paymentScheduleInvoice.getFINPaymentScheduleDetailInvoicePaymentScheduleList()
                    .size() > 0) {
              paymentScheduleInvoice.getFINPaymentScheduleDetailInvoicePaymentScheduleList()
                  .remove(pSched);
            }

            OBDal.getInstance().remove(pSched);
          }
        }
        // Then a new one for the amount remaining to be paid is created if there is still something
        // to be paid
        if (diffPaid.compareTo(BigDecimal.ZERO) != 0) {
          FIN_PaymentScheduleDetail paymentScheduleDetail = OBProvider.getInstance().get(
              FIN_PaymentScheduleDetail.class);
          paymentScheduleDetail.setOrderPaymentSchedule(paymentSchedule);
          paymentScheduleDetail.setAmount(diffPaid);
          paymentScheduleDetail.setBusinessPartner(order.getBusinessPartner());
          if (paymentScheduleInvoice != null) {
            paymentScheduleDetail.setInvoicePaymentSchedule(paymentScheduleInvoice);
          }
          paymentScheduleDetail.setId(paymentSchedule.getId());
          paymentScheduleDetail.setNewOBObject(true);
          OBDal.getInstance().save(paymentScheduleDetail);
        }
      }

      return null;
    }

  }

  protected void processPayments(FIN_PaymentSchedule paymentSchedule,
      FIN_PaymentSchedule paymentScheduleInvoice, Order order, Invoice invoice,
      OBPOSAppPayment paymentType, JSONObject payment, BigDecimal writeoffAmt, JSONObject jsonorder)
      throws Exception {
    OBContext.setAdminMode(true);
    try {
      boolean totalIsNegative = jsonorder.getDouble("gross") < 0;
      boolean checkPaidOnCreditChecked = (jsonorder.has("paidOnCredit") && jsonorder
          .getBoolean("paidOnCredit"));
      int pricePrecision = order.getCurrency().getObposPosprecision() == null ? order.getCurrency()
          .getPricePrecision().intValue() : order.getCurrency().getObposPosprecision().intValue();
      BigDecimal amount = BigDecimal.valueOf(payment.getDouble("origAmount")).setScale(
          pricePrecision, RoundingMode.HALF_UP);
      BigDecimal origAmount = amount;
      BigDecimal mulrate = new BigDecimal(1);
      // FIXME: Coversion should be only in one direction: (USD-->EUR)
      if (payment.has("mulrate") && payment.getDouble("mulrate") != 1) {
        mulrate = BigDecimal.valueOf(payment.getDouble("mulrate"));
        if (payment.has("amount")) {
          origAmount = BigDecimal.valueOf(payment.getDouble("amount")).setScale(pricePrecision,
              RoundingMode.HALF_UP);
        } else {
          origAmount = amount.multiply(mulrate).setScale(pricePrecision, RoundingMode.HALF_UP);
        }
      }

      // writeoffAmt.divide(BigDecimal.valueOf(payment.getDouble("rate")));
      if (amount.signum() == 0) {
        return;
      }
      if (writeoffAmt.signum() == 1) {
        // there was an overpayment, we need to take into account the writeoffamt
        if (totalIsNegative) {
          amount = amount.subtract(writeoffAmt.negate()).setScale(pricePrecision,
              RoundingMode.HALF_UP);
        } else {
          amount = amount.subtract(writeoffAmt.abs())
              .setScale(pricePrecision, RoundingMode.HALF_UP);
        }
      } else if (writeoffAmt.signum() == -1
          && (!notpaidLayaway && !creditpaidLayaway && !fullypaidLayaway && !checkPaidOnCreditChecked)) {
        if (totalIsNegative) {
          amount = amount.add(writeoffAmt).setScale(pricePrecision, RoundingMode.HALF_UP);
        } else {
          amount = amount.add(writeoffAmt.abs()).setScale(pricePrecision, RoundingMode.HALF_UP);
        }
        origAmount = amount;
        if (payment.has("mulrate") && payment.getDouble("mulrate") != 1) {
          mulrate = BigDecimal.valueOf(payment.getDouble("mulrate"));
          origAmount = amount.multiply(BigDecimal.valueOf(payment.getDouble("mulrate"))).setScale(
              pricePrecision, RoundingMode.HALF_UP);
        }
      }

      FIN_PaymentScheduleDetail paymentScheduleDetail = OBProvider.getInstance().get(
          FIN_PaymentScheduleDetail.class);
      paymentScheduleDetail.setOrderPaymentSchedule(paymentSchedule);
      paymentScheduleDetail.setAmount(amount);
      paymentScheduleDetail.setBusinessPartner(order.getBusinessPartner());
      paymentSchedule.getFINPaymentScheduleDetailOrderPaymentScheduleList().add(
          paymentScheduleDetail);
      if (payment.has("id")) {
        paymentScheduleDetail.setId(payment.getString("id"));
        paymentScheduleDetail.setNewOBObject(true);
      }
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
        origDetail.setWriteoffAmount(paymentScheduleDetail.getWriteoffAmount().setScale(
            pricePrecision, RoundingMode.HALF_UP));

        OBDal.getInstance().save(origDetail);
      }

      HashMap<String, BigDecimal> paymentAmount = new HashMap<String, BigDecimal>();
      paymentAmount.put(paymentScheduleDetail.getId(), amount);

      FIN_FinancialAccount account = paymentType.getFinancialAccount();

      // Save Payment
      List<FIN_PaymentScheduleDetail> detail = new ArrayList<FIN_PaymentScheduleDetail>();
      detail.add(paymentScheduleDetail);

      DocumentType paymentDocType = getPaymentDocumentType(order.getOrganization());
      Entity paymentEntity = ModelProvider.getInstance().getEntity(FIN_Payment.class);

      String paymentDocNo;
      if (useOrderDocumentNoForRelatedDocs) {
        final int paymentCount = countPayments(order);
        paymentDocNo = order.getDocumentNo();
        if (paymentCount > 0) {
          paymentDocNo = paymentDocNo + "-" + paymentCount;
        }
      } else {
        paymentDocNo = getDocumentNo(paymentEntity, null, paymentDocType);
      }

      // get date
      Date calculatedDate = (payment.has("date") && !payment.isNull("date")) ? OBMOBCUtils
          .calculateServerDate((String) payment.get("date"), jsonorder.getLong("timezoneOffset"))
          : OBMOBCUtils.stripTime(new Date());

      // insert the payment
      FIN_Payment finPayment = FIN_AddPayment.savePayment(null, true, paymentDocType, paymentDocNo,
          order.getBusinessPartner(), paymentType.getPaymentMethod().getPaymentMethod(), account,
          amount.toString(), calculatedDate, order.getOrganization(), null, detail, paymentAmount,
          false, false, order.getCurrency(), mulrate, origAmount, true,
          payment.has("id") ? payment.getString("id") : null);

      if (writeoffAmt.signum() == 1) {
        if (totalIsNegative) {
          FIN_AddPayment.saveGLItem(finPayment, writeoffAmt.negate(), paymentType
              .getPaymentMethod().getGlitemWriteoff(),
              payment.has("id") ? OBMOBCUtils.getUUIDbyString(payment.getString("id")) : null);
        } else {
          FIN_AddPayment.saveGLItem(finPayment, writeoffAmt, paymentType.getPaymentMethod()
              .getGlitemWriteoff(),
              payment.has("id") ? OBMOBCUtils.getUUIDbyString(payment.getString("id")) : null);
        }
        // Update Payment In amount after adding GLItem
        finPayment.setAmount(origAmount.setScale(pricePrecision, RoundingMode.HALF_UP));
      }

      if (checkPaidOnCreditChecked) {
        List<FIN_PaymentDetail> paymentDetailList = finPayment.getFINPaymentDetailList();
        if (paymentDetailList.size() > 0) {
          for (FIN_PaymentDetail paymentDetail : paymentDetailList) {
            paymentDetail.setPrepayment(true);
          }
          OBDal.getInstance().flush();
        }
      }

      if (payment.has("paymentData") && payment.getString("paymentData").length() > 0
          && !("null".equals(payment.getString("paymentData")))) {
        // ensure that it is a valid JSON Object prior to save it
        try {
          JSONObject jsonPaymentData = payment.getJSONObject("paymentData");
          finPayment.setObposPaymentdata(jsonPaymentData.toString());
        } catch (Exception e) {
          throw new OBException("paymentData attached to payment " + finPayment.getIdentifier()
              + " is not a valid JSON.");
        }
      }

      OBDal.getInstance().save(finPayment);

      String description = getPaymentDescription();
      description += ": " + order.getDocumentNo() + "\n";
      finPayment.setDescription(description);

      long t1 = System.currentTimeMillis();
      FIN_PaymentProcess.doProcessPayment(finPayment, "D", true, null, null);
      ImportEntryManager.getInstance().reportStats("processPayments",
          (System.currentTimeMillis() - t1));

      VariablesSecureApp vars = RequestContext.get().getVariablesSecureApp();
      vars.setSessionValue("POSOrder", "Y");

      // retrieve the transactions of this payment and set the cashupId to those transactions
      if (!jsonorder.has("channel")) {
        OBDal.getInstance().refresh(finPayment);
        final List<FIN_FinaccTransaction> transactions = finPayment.getFINFinaccTransactionList();
        final String cashupId = jsonorder.getString("obposAppCashup");
        final OBPOSAppCashup cashup = OBDal.getInstance().get(OBPOSAppCashup.class, cashupId);
        for (FIN_FinaccTransaction transaction : transactions) {
          transaction.setObposAppCashup(cashup);
        }
      }

    } finally {
      OBContext.restorePreviousMode();
    }

  }

  private int countPayments(Order order) {
    final String countHql = "select count(*) from FIN_Payment_Detail_V where "
        + FIN_PaymentDetailV.PROPERTY_ORDERPAYMENTPLAN + "."
        + FIN_PaymentSchedOrdV.PROPERTY_SALESORDER + "=:order";
    final Query qry = OBDal.getInstance().getSession().createQuery(countHql);
    qry.setEntity("order", order);
    return ((Number) qry.uniqueResult()).intValue();
  }

  protected void verifyCashupStatus(JSONObject jsonorder) throws JSONException, OBException {
    OBContext.setAdminMode(false);
    try {
      if (jsonorder.has("obposAppCashup") && jsonorder.getString("obposAppCashup") != null
          && !jsonorder.getString("obposAppCashup").equals("")) {
        OBPOSAppCashup cashUp = OBDal.getInstance().get(OBPOSAppCashup.class,
            jsonorder.getString("obposAppCashup"));
        if (cashUp != null && cashUp.isProcessedbo()) {
          // Additional check to verify that the cashup related to the order has not been processed
          throw new OBException("The cashup related to this order has been processed");
        }
      }
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  protected void createApprovals(Order order, JSONObject jsonorder) {
    if (!jsonorder.has("approvals")) {
      return;
    }
    Entity approvalEntity = ModelProvider.getInstance().getEntity(OrderApproval.class);
    try {
      JSONArray approvals = jsonorder.getJSONArray("approvals");
      for (int i = 0; i < approvals.length(); i++) {
        JSONObject jsonApproval = approvals.getJSONObject(i);

        OrderApproval approval = OBProvider.getInstance().get(OrderApproval.class);

        JSONPropertyToEntity.fillBobFromJSON(approvalEntity, approval, jsonApproval,
            jsonorder.getLong("timezoneOffset"));

        approval.setSalesOrder(order);

        Long value = jsonorder.getLong("created");
        Date creationDate = new Date(value);
        approval.setCreationDate(creationDate);
        approval.setUpdated(creationDate);

        OBDal.getInstance().save(approval);
      }

    } catch (JSONException e) {
      log.error("Error creating approvals for order" + order, e);
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
        if (log.isDebugEnabled()) {
          log.debug("Found property: " + key + " in entity " + entity.getName());
        }
      } else {
        key = getEquivalentKey(key);
        if (key == null) {
          if (log.isDebugEnabled()) {
            log.debug("Did not find property: " + oldKey);
          }
          continue;
        } else {
          if (entity.hasProperty(key)) {
            if (log.isDebugEnabled()) {
              log.debug("Found equivalent key: " + key);
            }
          } else {
            if (log.isDebugEnabled()) {
              log.debug("Did not find property: " + oldKey);
            }
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

  protected String getDocumentNo(Entity entity, DocumentType doctypeTarget, DocumentType doctype) {
    return Utility.getDocumentNo(OBDal.getInstance().getConnection(false),
        new DalConnectionProvider(false), RequestContext.get().getVariablesSecureApp(), "", entity
            .getTableName(), doctypeTarget == null ? "" : doctypeTarget.getId(),
        doctype == null ? "" : doctype.getId(), false, true);
  }

  protected String getDummyDocumentNo() {
    return "DOCNO" + System.currentTimeMillis();
  }

  @Override
  protected boolean bypassPreferenceCheck() {
    return true;
  }

  private static class DocumentNoHandler {

    private Entity entity;
    private DocumentType doctypeTarget;
    private DocumentType doctype;
    private BaseOBObject bob;
    private String propertyName = "documentNo";

    DocumentNoHandler(BaseOBObject bob, Entity entity, DocumentType doctypeTarget,
        DocumentType doctype) {
      this.entity = entity;
      this.doctypeTarget = doctypeTarget;
      this.doctype = doctype;
      this.bob = bob;
    }

    public void setDocumentNoAndSave() {
      final String docNo = getDocumentNumber(entity, doctypeTarget, doctype);
      bob.setValue(propertyName, docNo);
      OBDal.getInstance().save(bob);
    }

    private String getDocumentNumber(Entity localEntity, DocumentType localDoctypeTarget,
        DocumentType localDoctype) {
      return Utility.getDocumentNo(OBDal.getInstance().getConnection(false),
          new DalConnectionProvider(false), RequestContext.get().getVariablesSecureApp(), "",
          localEntity.getTableName(), localDoctypeTarget == null ? "" : localDoctypeTarget.getId(),
          localDoctype == null ? "" : localDoctype.getId(), false, true);
    }

  }

  private static String callProcessGetStock(String recordID, String clientId, String orgId,
      String productId, String uomId, String warehouseId, String attributesetinstanceId,
      BigDecimal quantity, String warehouseRuleId, String reservationId) {
    String processId = SequenceIdData.getUUID();
    OBContext.setAdminMode(false);
    try {
      if (log.isDebugEnabled()) {
        log.debug("Parameters : '" + processId + "', '" + recordID + "', " + quantity + ", '"
            + productId + "', null, '" + warehouseId + "', null, '" + orgId + "', '"
            + attributesetinstanceId + "', '" + OBContext.getOBContext().getUser().getId() + "', '"
            + clientId + "', '" + warehouseRuleId + "', '" + uomId
            + "', null, null, null, null, null, '" + reservationId + "', 'N'");
      }
      long initGetStockProcedureCall = System.currentTimeMillis();
      StockUtils.getStock(processId, recordID, quantity, productId, null, null, warehouseId, orgId,
          attributesetinstanceId, OBContext.getOBContext().getUser().getId(), clientId,
          warehouseRuleId, uomId, null, null, null, null, null, reservationId, "N");
      long elapsedGetStockProcedureCall = (System.currentTimeMillis() - initGetStockProcedureCall);
      if (log.isDebugEnabled()) {
        log.debug("Partial time to execute callGetStock Procedure Call() : "
            + elapsedGetStockProcedureCall);
      }
      return processId;
    } catch (Exception ex) {
      throw new OBException("Error in OrderLoader when getting stock for product " + productId
          + " order line " + recordID, ex);
    } finally {
      OBContext.restorePreviousMode();
    }
  }

}
