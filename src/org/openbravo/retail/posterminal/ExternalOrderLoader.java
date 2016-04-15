/*
 ************************************************************************************
 * Copyright (C) 2015 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal;

import java.io.IOException;
import java.io.StringWriter;
import java.io.Writer;
import java.math.BigDecimal;
import java.text.SimpleDateFormat;
import java.util.Date;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.Query;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.client.kernel.RequestContext;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.core.SessionHandler;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.SequenceIdData;
import org.openbravo.model.ad.access.User;
import org.openbravo.model.common.businesspartner.BusinessPartner;
import org.openbravo.model.common.businesspartner.Location;
import org.openbravo.model.common.currency.Currency;
import org.openbravo.model.common.enterprise.DocumentType;
import org.openbravo.model.common.enterprise.Warehouse;
import org.openbravo.model.common.invoice.Invoice;
import org.openbravo.model.common.order.Order;
import org.openbravo.model.common.plm.Product;
import org.openbravo.model.common.uom.UOM;
import org.openbravo.model.financialmgmt.tax.TaxRate;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOut;
import org.openbravo.model.pricing.priceadjustment.PriceAdjustment;
import org.openbravo.service.db.DbUtility;
import org.openbravo.service.importprocess.ImportEntry;
import org.openbravo.service.importprocess.ImportEntryArchive;
import org.openbravo.service.json.DataResolvingMode;
import org.openbravo.service.json.DataToJsonConverter;
import org.openbravo.service.json.JsonConstants;
import org.openbravo.service.json.JsonUtils;

/**
 * Order loader which translates a json which is more externally friendly to a json which can be
 * processed by the order loader. It also will make sure that any errors are returned to the caller
 * in the expected json format.
 */
public class ExternalOrderLoader extends OrderLoader {

  public static final String APP_NAME = "External";

  private static final Logger log = Logger.getLogger(ExternalOrderLoader.class);

  private static ThreadLocal<JSONArray> processedOrders = new ThreadLocal<JSONArray>();
  private static ThreadLocal<Throwable> exception = new ThreadLocal<Throwable>();

  protected static Throwable getCurrentException() {
    return exception.get();
  }

  protected static void setCurrentException(Throwable t) {
    exception.set(t);
  }

  protected static SimpleDateFormat createOrderLoaderDateTimeFormat() {
    final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.sssZZZZZ");
    dateFormat.setLenient(true);
    return dateFormat;
  }

  protected static boolean isSynchronizedRequest() {
    final String param = (String) RequestContext.get().getRequest()
        .getParameter("synchronizedProcessing");
    return param != null && param.toLowerCase().equals("true");
  }

  @Override
  public String getAppName() {
    return "External";
  }

  public Entity getEntity() {
    return ModelProvider.getInstance().getEntity(Order.ENTITY_NAME);
  }

  public void executeCreateImportEntry(Writer w, JSONObject jsonObject) {
    JSONObject message = null;
    try {
      // start with a fresh set
      exception.set(null);
      processedOrders.set(new JSONArray());

      message = transformMessage(jsonObject);
      if (messageAlreadyReceived(jsonObject.getString("messageId"))) {
        log.debug("Message already received, ignoring it " + jsonObject);

        JSONObject jsonResponse = new JSONObject();
        jsonResponse.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
        jsonResponse.put("result", "0");
        jsonResponse.put("message", "Message with id " + jsonObject.getString("messageId")
            + " already received, ignoring second request");
        // write only the properties, brackets are written outside.
        writeJson(w, jsonResponse);
        return;
      }

      if (isSynchronizedRequest()) {
        // also for synchronized requests create an import entry for syncing
        // and tracking
        try {
          OBContext.setAdminMode(false);
          // create the entry but don't commit
          final String id = jsonObject.getString("messageId");
          getImportEntryManager().createImportEntry(id, getImportQualifier(), message.toString(),
              false);

          // set to processed, if error occurs it will not be saved but rolled back
          final ImportEntry importEntry = OBDal.getInstance().get(ImportEntry.class, id);
          importEntry.setImported(new Date());
          importEntry.setImportStatus("Processed");
          setImportEntryId(id);
        } finally {
          OBContext.restorePreviousMode();
        }
        // pass in a dummy writer, we will create our own successmessage in the next step
        super.exec(new StringWriter(), message);
        if (exception.get() != null) {
          writeJson(w, createErrorJSON(message, exception.get()));
        } else {
          // we got here, no error, write a successmessage with all the orders
          writeSuccessMessage(w);
        }
      } else {
        super.executeCreateImportEntry(w, message);
      }
    } catch (Throwable t) {
      Throwable cause = DbUtility.getUnderlyingSQLException(t);
      log.error(t.getMessage() + " --> " + (message != null ? message : jsonObject), cause);
      writeJson(w, createErrorJSON(jsonObject, cause));
    } finally {
      exception.set(null);
      processedOrders.set(null);
    }
  }

  @Override
  public JSONObject exec(JSONObject json) throws JSONException, ServletException {
    JSONObject jsonIn = json;
    try {
      jsonIn = transformMessage(json);
      return super.exec(jsonIn);
    } catch (Throwable t) {
      return createErrorJSON(json, t);
    }
  }

  @Override
  public JSONObject exec(JSONObject json, boolean shouldFailWithError) throws JSONException,
      ServletException {
    JSONObject jsonIn = json;
    try {
      jsonIn = transformMessage(json);
      return super.exec(jsonIn, shouldFailWithError);
    } catch (Throwable t) {
      return createErrorJSON(json, t);
    }
  }

  protected void writeJson(Writer w, JSONObject j) {
    try {
      final String jStr = j.toString();
      w.write(jStr.substring(1, jStr.length() - 1));
    } catch (IOException e) {
      throw new OBException("Exception when writing: " + j.toString(), e);
    }
  }

  protected boolean messageAlreadyReceived(String id) {
    // check if it is not there already or already archived
    {
      final Query qry = SessionHandler.getInstance().getSession()
          .createQuery("select count(*) from " + ImportEntry.ENTITY_NAME + " where id=:id");
      qry.setParameter("id", id);
      if (((Number) qry.uniqueResult()).intValue() > 0) {
        return true;
      }
    }
    {
      final Query qry = SessionHandler.getInstance().getSession()
          .createQuery("select count(*) from " + ImportEntryArchive.ENTITY_NAME + " where id=:id");
      qry.setParameter("id", id);
      if (((Number) qry.uniqueResult()).intValue() > 0) {
        return true;
      }
    }
    return false;
  }

  protected JSONObject transformMessage(JSONObject messageIn) throws JSONException {
    if (!messageIn.has("channel") || !"External".equals(messageIn.get("channel"))) {
      return messageIn;
    }
    OBContext.setAdminMode(false);
    try {
      if (log.isDebugEnabled()) {
        log.debug("Transforming message from " + messageIn);
      }
      final JSONObject messageOut = new JSONObject(messageIn.toString());

      messageOut.put("channel", "FromExternal");
      messageOut.put("appName", APP_NAME);

      final OBPOSApplications posTerminal = getPOSTerminal(messageOut);

      if (!posTerminal.getOrganization().getId()
          .equals(OBContext.getOBContext().getCurrentOrganization().getId())) {
        throw new OBException("Organization ("
            + OBContext.getOBContext().getCurrentOrganization().getIdentifier() + ") of the user "
            + OBContext.getOBContext().getUser().getIdentifier()
            + " is unequal to the organization (" + posTerminal.getOrganization().getIdentifier()
            + ") of the pos terminal " + posTerminal.getIdentifier());
      }

      messageOut.put("posTerminal", posTerminal.getId());
      messageOut.put("pos", posTerminal.getId());
      setClientOrg(messageOut);

      if (!messageOut.has("messageId")) {
        messageOut.put("messageId", SequenceIdData.getUUID());
      }

      final JSONArray data = messageOut.getJSONArray("data");
      for (int i = 0; i < data.length(); i++) {
        // set the pos terminal to be sure
        final JSONObject order = data.getJSONObject(i);
        if (!order.has("posTerminal")) {
          order.put("posTerminal", posTerminal.getId());
        }
        transformOrder(data.getJSONObject(i));
      }
      if (log.isDebugEnabled()) {
        log.debug("Transformed message from " + messageIn + " ----------> " + messageOut);
      }
      return messageOut;
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  protected void copyPropertyValue(JSONObject json, String from, String to) throws JSONException {
    if (json.has(to)) {
      return;
    }
    json.put(to, json.get(from));
  }

  protected void writePropertyValue(JSONObject json, String property, Object value)
      throws JSONException {
    if (json.has(property)) {
      return;
    }
    json.put(property, value);
  }

  protected JSONObject createErrorJSON(JSONObject jsonOrder, Throwable t) {
    try {
      Throwable cause = DbUtility.getUnderlyingSQLException(t);
      HttpServletResponse response = RequestContext.get().getResponse();
      if (response != null) {
        response.setStatus(HttpServletResponse.SC_OK);
      }
      // TODO: we give the stacktrace in the json maybe not good to do
      // it like that...
      log.error("Error transforming/handling order " + jsonOrder, cause);
      JSONObject respJson = new JSONObject(JsonUtils.convertExceptionToJson(cause));
      // skip the response part, will be wrapped in a response anyway in the MobileService class
      return respJson.getJSONObject("response");
    } catch (JSONException e) {
      throw new OBException(e);
    }
  }

  protected void transformOrder(JSONObject orderJson) throws JSONException {
    handleOrderSteps(orderJson);

    setDefaults(orderJson);

    setClientOrg(orderJson);

    final OBPOSApplications posTerminal = getPOSTerminal(orderJson);

    orderJson.put("obposApplications", posTerminal.getId());

    if (!orderJson.has("id")) {
      orderJson.put("id", SequenceIdData.getUUID());
    }

    setDocumentType(orderJson, posTerminal);

    orderJson.put(
        "currency",
        resolveJsonValue(Currency.ENTITY_NAME, orderJson.getString("currency"), new String[] {
            "id", "iSOCode" }));

    setBusinessPartnerInformation(orderJson);

    if (orderJson.has("salesRepresentative")) {
      orderJson.put(
          "salesRepresentative",
          resolveJsonValue(User.ENTITY_NAME, orderJson.getString("salesRepresentative"),
              new String[] { "id", "name", "email", "userName" }));
    }

    setWarehouse(orderJson);

    if (!orderJson.has("priceList")) {
      orderJson.put("priceList", posTerminal.getOrganization().getObretcoPricelist().getId());
      orderJson.put("priceIncludesTax", posTerminal.getOrganization().getObretcoPricelist()
          .isPriceIncludesTax());
    }

    setDocumentNo(orderJson);

    setOrderType(orderJson);

    copyPropertyValue(orderJson, "grossAmount", "gross");
    copyPropertyValue(orderJson, "netAmount", "net");

    transformTaxes(orderJson.getJSONObject("taxes"));
    transformLines(orderJson);
    transformPayments(orderJson);
  }

  // set the special attributes which are needed to cover/handle create, pay and ship
  // separately, this needs to be improved.
  protected void handleOrderSteps(JSONObject orderJson) throws JSONException {
    if (!orderJson.has("step")) {
      orderJson.put("step", "all");
    }
    final String step = orderJson.getString("step");
    if ("create".equals(step)) {
      orderJson.put("payment", -1);
      orderJson.put("generateInvoice", false);
      orderJson.put("generateShipment", false);
      orderJson.put("isLayaway", false);
    } else if ("pay".equals(step)) {
      orderJson.put("payment", -1);
      orderJson.put("generateInvoice", false);
      orderJson.put("generateShipment", false);
      orderJson.put("isLayaway", true);
    } else if ("ship".equals(step)) {
      orderJson.put("payment", orderJson.getDouble("grossAmount"));
      orderJson.put("generateShipment", true);
      orderJson.put("isLayaway", true);
    } else if ("all".equals(step)) {
      copyPropertyValue(orderJson, "grossAmount", "payment");
      // do nothing
    } else {
      log.warn("Step value " + step + " not recognized, order " + orderJson + " assuming all");
      copyPropertyValue(orderJson, "grossAmount", "payment");
    }
  }

  protected void transformLines(JSONObject orderJson) throws JSONException {
    for (int i = 0; i < orderJson.getJSONArray("lines").length(); i++) {
      transformLine(orderJson, orderJson.getJSONArray("lines").getJSONObject(i));
    }
  }

  protected void transformLine(JSONObject orderJson, JSONObject lineJson) throws JSONException {
    setProduct(lineJson);

    copyPropertyValue(lineJson, "quantity", "qty");

    if (lineJson.has("warehouse")) {
      final String warehouseId = resolveJsonValue(Warehouse.ENTITY_NAME,
          lineJson.getString("warehouse"), new String[] { "id", "name", "searchKey" });
      final JSONObject whJson = new JSONObject();
      whJson.put("id", warehouseId);
      lineJson.put("warehouse", whJson);
    }

    if (!lineJson.has("promotions")) {
      lineJson.put("promotions", new JSONArray());
    } else {
      transformPromotions(lineJson.getJSONArray("promotions"));
    }

    writePropertyValue(lineJson, "promotionMessages", new JSONArray());
    writePropertyValue(lineJson, "promotionCandidates", new JSONArray());

    if (!lineJson.has("taxLines")) {
      lineJson.put("taxLines", new JSONObject());
    } else {
      transformTaxes(lineJson.getJSONObject("taxLines"));
    }
    setLineTaxInformation(lineJson);
    transformPriceInformation(lineJson);
  }

  protected void transformPriceInformation(JSONObject lineJson) throws JSONException {

    if (!lineJson.has("priceIncludesTax")) {
      lineJson.put("priceIncludesTax", false);
    }
    writePropertyValue(lineJson, "netListPrice",
        lineJson.getDouble("netAmount") / lineJson.getDouble("qty"));
    writePropertyValue(lineJson, "grossListPrice",
        lineJson.getDouble("grossAmount") / lineJson.getDouble("qty"));
    writePropertyValue(lineJson, "netPrice",
        lineJson.getDouble("netAmount") / lineJson.getDouble("qty"));
    writePropertyValue(lineJson, "grossPrice",
        lineJson.getDouble("grossAmount") / lineJson.getDouble("qty"));

    copyPropertyValue(lineJson, "netAmount", "discountedNet");
    copyPropertyValue(lineJson, "netPrice", "discountedLinePrice");
    writePropertyValue(lineJson, "discountPercentage", 0);
    copyPropertyValue(lineJson, "netListPrice", "listPrice");
    copyPropertyValue(lineJson, "grossListPrice", "priceList");
    copyPropertyValue(lineJson, "listPrice", "standardPrice");
    copyPropertyValue(lineJson, "grossAmount", "lineGrossAmount");
    copyPropertyValue(lineJson, "netPrice", "unitPrice");
    copyPropertyValue(lineJson, "netAmount", "net");
    copyPropertyValue(lineJson, "grossAmount", "gross");
  }

  protected void transformPayments(JSONObject orderJson) throws JSONException {
    final JSONArray payments = orderJson.getJSONArray("payments");
    for (int i = 0; i < payments.length(); i++) {
      final JSONObject payment = payments.getJSONObject(i);
      if (!payment.has("currency")) {
        payment.put("currency", orderJson.get("currency"));
      }
      if (!payment.has("rate")) {
        payment.put("rate", 1.0);
      }

      // check payment kind
      final OBPOSApplications posTerminal = getPOSTerminal(orderJson);
      boolean found = false;
      for (OBPOSAppPayment paymentType : posTerminal.getOBPOSAppPaymentList()) {
        if (paymentType.getSearchKey().equals(payment.getString("kind"))) {
          found = true;
          break;
        }
      }
      if (!found) {
        throw new OBException("Value " + payment.get("kind")
            + " does not resolve to a payment type for terminal " + posTerminal.getSearchKey());
      }
      transformPayment(payment);
    }
  }

  protected void transformPayment(JSONObject payment) throws JSONException {

    validatePayment(payment);

    copyPropertyValue(payment, "paidAmount", "amount");
    final boolean hasOriginalAmount = payment.has("origAmount");
    copyPropertyValue(payment, "paidAmount", "origAmount");
    copyPropertyValue(payment, "paidAmount", "paid");
    final Object rate = payment.get("rate");
    if (!(rate instanceof String)) {
      payment.put("rate", rate.toString());
    }
    if (!payment.has("mulrate")) {
      final BigDecimal rateBD = new BigDecimal(payment.getString("rate"));
      payment.put("mulrate", BigDecimal.ONE.divide(rateBD).toPlainString());
    } else {
      final Object mulRate = payment.get("mulrate");
      if (!(mulRate instanceof String)) {
        payment.put("mulrate", mulRate.toString());
      }
    }
    if (!hasOriginalAmount) {
      payment.put(
          "origAmount",
          new BigDecimal(payment.getString("mulrate")).multiply(
              new BigDecimal(payment.getDouble("origAmount"))).doubleValue());
    }
    if (!payment.has("date")) {
      payment.put("date", JsonUtils.createDateTimeFormat().format(new Date()));
    }
    payment.put("isocode", payment.getString("currency"));
  }

  protected void validateHeader(JSONObject json) {
    final String msg = "Checking order line: ";
    check(json, "netAmount", msg);
    check(json, "grossAmount", msg);
    check(json, "payment", msg);
    check(json, "currency", msg);
  }

  protected void validateLine(JSONObject json) {
    final String msg = "Checking order line: ";
    check(json, "qty", msg);
    check(json, "product", msg);
    check(json, "netAmount", msg);
    check(json, "grossAmount", msg);
    check(json, "taxAmount", msg);
  }

  protected void validatePayment(JSONObject json) throws JSONException {
    final String msg = "Checking payment: ";
    check(json, "paidAmount", msg);
    check(json, "kind", msg);
    check(json, "rate", msg);
    check(json, "currency", msg);
  }

  protected void validateTax(JSONObject json) {
    final String msg = "Checking tax: ";
    check(json, "taxAmount", msg);
    check(json, "netAmount", msg);
  }

  protected void validatePromotion(JSONObject json) {
    final String msg = "Checking promotion: ";
    check(json, "discountRule", msg);
    check(json, "quantity", msg);
    check(json, "amount", msg);
    check(json, "baseUnitPrice", msg);
    check(json, "unitDiscount", msg);
  }

  protected void check(JSONObject json, String property, String message) {
    if (!json.has(property)) {
      throw new OBException(message + " property not found " + property + " on json " + json);
    }
  }

  protected void setLineTaxInformation(JSONObject lineJson) throws JSONException {
    // "tax": "5235D8E99A2749EFA17A5C92A52AEFC6",
    // "taxAmount": 6.33,
    // "lineRate": 1.21
    final JSONObject taxes = lineJson.getJSONObject("taxLines");
    final JSONArray names = taxes.names();
    BigDecimal totalTax = BigDecimal.ZERO;
    for (int i = 0; i < names.length(); i++) {
      final String name = names.getString(i);
      final JSONObject taxInfo = taxes.getJSONObject(name);
      if (i == 0) {
        lineJson.put("tax", name);
      }
      if (!lineJson.has("lineRate") && taxInfo.has("rate")) {
        lineJson.put("lineRate", (double) ((100.0 + taxInfo.getInt("rate")) / 100.0));
      }
      totalTax = totalTax.add(new BigDecimal(taxInfo.getDouble("amount")));
    }
    if (!lineJson.has("taxAmount")) {
      lineJson.put("taxAmount", totalTax.doubleValue());
    }
  }

  protected void transformPromotions(JSONArray promotionsJson) throws JSONException {
    for (int i = 0; i < promotionsJson.length(); i++) {
      transformPromotion(promotionsJson.getJSONObject(i));
    }
  }

  protected void transformPromotion(JSONObject promotionJson) throws JSONException {
    validatePromotion(promotionJson);

    copyPropertyValue(promotionJson, "amount", "amt");
    copyPropertyValue(promotionJson, "amount", "fullAmt");
    copyPropertyValue(promotionJson, "amount", "displayedTotalAmount");
    promotionJson.put(
        "ruleId",
        resolveJsonValue(PriceAdjustment.ENTITY_NAME, promotionJson.getString("discountRule"),
            new String[] { "id", "name", "printName" }));
    copyPropertyValue(promotionJson, "quantity", "obdiscQtyoffer");
    copyPropertyValue(promotionJson, "quantity", "qtyOffer");
    copyPropertyValue(promotionJson, "quantity", "qtyOfferReserved");
    copyPropertyValue(promotionJson, "quantity", "pendingQtyOffer");
    copyPropertyValue(promotionJson, "quantity", "obdiscQtyoffer");
  }

  protected void setProduct(JSONObject lineJson) throws JSONException {
    final String productId = resolveJsonValue(Product.ENTITY_NAME, lineJson.getString("product"),
        new String[] { "id", "searchKey", "name", "uPCEAN" });
    final Product product = OBDal.getInstance().get(Product.class, productId);
    final JSONObject productJson = new JSONObject();
    productJson.put("id", productId);
    lineJson.put("product", productJson);
    if (lineJson.has("uom")) {
      lineJson.put(
          "uOM",
          resolveJsonValue(UOM.ENTITY_NAME, lineJson.getString("uom"), new String[] { "id", "name",
              "eDICode", "symbol" }));
    } else {
      lineJson.put("uOM", product.getUOM().getId());
    }
  }

  protected void transformTaxes(JSONObject taxes) throws JSONException {
    final JSONArray names = taxes.names();
    for (int i = 0; i < names.length(); i++) {
      final String name = names.getString(i);
      final JSONObject taxValue = taxes.getJSONObject(name);

      validateTax(taxValue);
      if (!taxValue.has("rate") && taxValue.getDouble("net") > 0) {
        taxValue.put("rate", taxValue.getDouble("amount") / taxValue.getDouble("net"));
      }
      copyPropertyValue(taxValue, "taxAmount", "amount");
      copyPropertyValue(taxValue, "netAmount", "net");

      taxes.remove(name);
      final String taxId = resolveJsonValue(TaxRate.ENTITY_NAME, name, new String[] { "id", "name",
          "taxSearchKey" });
      if (taxId == null) {
        throw new OBException("Tax " + name + " can not be translated to a tax " + taxes);
      }
      taxes.put(taxId, taxValue);
    }
  }

  protected void setOrderType(JSONObject orderJson) throws JSONException {
    if (orderJson.getBoolean("isReturn")) {
      orderJson.put("orderType", 1l);
    } else if (orderJson.getBoolean("isLayaway")) {
      // orderJson.put("orderType", 2l);
      orderJson.put("orderType", 0l);
    } else {
      orderJson.put("orderType", 0l);
    }
  }

  protected void setDefaults(JSONObject orderJson) throws JSONException {
    final JSONObject defaults = createOrderDefaults(orderJson);
    final JSONArray names = defaults.names();
    for (int i = 0; i < names.length(); i++) {
      final String name = names.getString(i);
      if (!orderJson.has(name)) {
        orderJson.put(name, defaults.get(name));
      }
    }
  }

  protected JSONObject createOrderDefaults(JSONObject orderJson) throws JSONException {
    final JSONObject defaultJson = new JSONObject();
    defaultJson.put("isQuotation", false);
    defaultJson.put("isLayaway", false);
    defaultJson.put("isReturn", false);
    defaultJson.put("obposAppCashup", "-1");
    defaultJson.put("created", new Date().getTime());
    defaultJson.put("approvals", new JSONArray());
    defaultJson.put("lines", new JSONArray());
    defaultJson.put("payments", new JSONArray());
    defaultJson.put("taxes", new JSONObject());
    defaultJson.put("change", 0);
    defaultJson.put("timezoneOffset", 0);
    defaultJson.put("generateInvoice", false);

    final SimpleDateFormat dtFormat = createOrderLoaderDateTimeFormat();
    defaultJson.put("orderDate", dtFormat.format(new Date()));
    defaultJson.put("creationDate", dtFormat.format(new Date()));
    defaultJson.put("obposCreatedabsolute", dtFormat.format(new Date()));

    return defaultJson;
  }

  protected void setDocumentNo(JSONObject orderJson) throws JSONException {
    if (!orderJson.has("documentNo")) {
      orderJson.put(
          "documentNo",
          getDocumentNo(ModelProvider.getInstance().getEntity(Order.ENTITY_NAME), null, OBDal
              .getInstance().get(DocumentType.class, orderJson.getString("documentType"))));
    }
  }

  protected void setBusinessPartnerInformation(JSONObject orderJson) throws JSONException {

    final OBPOSApplications posTerminal = getPOSTerminal(orderJson);

    String bpId = resolveJsonValue(BusinessPartner.ENTITY_NAME,
        orderJson.getString("businessPartner"), new String[] { "id", "searchKey", "name" });

    if (bpId == null) {
      if (posTerminal.getDefaultCustomer() != null) {
        bpId = posTerminal.getDefaultCustomer().getId();
      }
    }
    if (bpId == null && posTerminal.getOrganization().getObretcoCBpartner() != null) {
      bpId = posTerminal.getOrganization().getObretcoCBpartner().getId();
    }

    if (bpId == null) {
      throw new OBException("No customer info can be determined " + orderJson);
    }

    final BusinessPartner bp = OBDal.getInstance().get(BusinessPartner.class, bpId);
    final DataToJsonConverter jsonConverter = new DataToJsonConverter();
    final JSONObject bpJson = jsonConverter.toJsonObject(bp, DataResolvingMode.FULL);
    String addressId = null;
    if (orderJson.has("address")) {
      addressId = resolveJsonValue(Location.ENTITY_NAME, orderJson.getString("address"),
          new String[] { "id", "name" });

      if (addressId == null) {
        addressId = getAddressIdFromBP(bpId);
      }
    } else {
      addressId = getAddressIdFromBP(bpId);
    }
    if (addressId == null && posTerminal.getObposCBpartnerLoc() != null) {
      addressId = posTerminal.getObposCBpartnerLoc().getId();
    }
    if (addressId == null && posTerminal.getOrganization().getObretcoCBpLocation() != null) {
      addressId = posTerminal.getOrganization().getObretcoCBpLocation().getId();
    }
    if (addressId == null) {
      throw new OBException("No address information found for bp " + bpId + " for order json "
          + orderJson);
    }
    bpJson.put("locId", addressId);
    orderJson.put("bp", bpJson);

  }

  protected void setWarehouse(JSONObject orderJson) throws JSONException {

    final OBPOSApplications posTerminal = getPOSTerminal(orderJson);

    if (orderJson.has("warehouse")) {
      orderJson.put(
          "warehouse",
          resolveJsonValue(Warehouse.ENTITY_NAME, orderJson.getString("warehouse"), new String[] {
              "id", "name", "searchKey" }));
    } else {
      Warehouse wh = posTerminal.getOrganization().getObretcoMWarehouse();
      if (wh == null && !posTerminal.getOrganization().getOrganizationWarehouseList().isEmpty()) {
        // TODO: sort by prio, check for active...
        wh = posTerminal.getOrganization().getOrganizationWarehouseList().get(0).getWarehouse();
      }
      orderJson.put("warehouse", wh.getId());
    }

  }

  protected void setClientOrg(JSONObject orderJson) throws JSONException {
    final OBPOSApplications posTerminal = getPOSTerminal(orderJson);
    if (!orderJson.has("organization")) {
      orderJson.put("organization", posTerminal.getOrganization().getId());
      orderJson.put("client", posTerminal.getClient().getId());
    }

  }

  protected String getAddressIdFromBP(String bpId) {
    final BusinessPartner bp = OBDal.getInstance().get(BusinessPartner.class, bpId);
    for (Location location : bp.getBusinessPartnerLocationList()) {
      if (location.isActive() && location.isInvoiceToAddress()) {
        return location.getId();
      }
    }
    return null;
  }

  protected void setDocumentType(JSONObject orderJson, OBPOSApplications posTerminal)
      throws JSONException {
    if (orderJson.has("documentType")) {
      orderJson.put(
          "documentType",
          resolveJsonValue(DocumentType.ENTITY_NAME, orderJson.getString("documentType"),
              new String[] { "id", "name" }));
      return;
    }
    if (orderJson.has("isQuotation") && orderJson.getBoolean("isQuotation")) {
      orderJson.put("documentType", posTerminal.getObposTerminaltype()
          .getDocumentTypeForQuotations().getId());
    } else if (orderJson.has("isReturn") && orderJson.getBoolean("isReturn")) {
      orderJson.put("documentType", posTerminal.getObposTerminaltype().getDocumentTypeForReturns()
          .getId());
    } else {
      orderJson.put("documentType", posTerminal.getObposTerminaltype().getDocumentType().getId());
    }
  }

  protected OBPOSApplications getPOSTerminal(JSONObject jsonObject) throws JSONException {
    if (getImportEntryId() != null) {
      ImportEntry entry = OBDal.getInstance().get(ImportEntry.class, getImportEntryId());
      if (entry != null && entry.getOBPOSPOSTerminal() != null) {
        return entry.getOBPOSPOSTerminal();
      }
    }
    if (!jsonObject.has("posTerminal")) {
      new OBException("Property posTerminal not found in json " + jsonObject);
    }
    final String posId = resolveJsonValue(OBPOSApplications.ENTITY_NAME,
        jsonObject.getString("posTerminal"), new String[] { "id", "name", "searchKey" });
    final OBPOSApplications result = OBDal.getInstance().get(OBPOSApplications.class, posId);

    if (result == null) {
      throw new OBException("No pos terminal found using id " + posId + " json " + jsonObject);
    }
    return result;
  }

  protected String resolveJsonValue(String entityName, String searchValue, String... properties) {
    for (String property : properties) {
      String id = resolve(entityName, property, searchValue);
      if (id != null) {
        return id;
      }
    }
    throw new OBException("Value " + searchValue + " does not resolve to an instance of "
        + entityName);
  }

  protected String resolve(String entityName, String property, String value) {
    try {
      String qryStr = "select id from " + entityName + " where " + property + "=:value"
          + " and organization.id " + OBDal.getInstance().getReadableOrganizationsInClause();

      final Query qry = OBDal.getInstance().getSession().createQuery(qryStr);
      qry.setString("value", value);
      final java.util.List<?> values = qry.list();
      if (values.isEmpty() || values.size() > 1) {
        return null;
      }
      final String result = (String) values.get(0);
      return result;
    } catch (Throwable t) {
      final Throwable cause = DbUtility.getUnderlyingSQLException(t);
      log.error(cause.getMessage(), cause);
      return null;
    }
  }

  protected void writeSuccessMessage(Writer w) {
    try {
      final JSONObject jsonResponse = new JSONObject();
      jsonResponse.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
      jsonResponse.put("result", "0");
      jsonResponse.put("orders", processedOrders.get());
      if (RequestContext.get().getResponse() != null) {
        RequestContext.get().getResponse().setStatus(HttpServletResponse.SC_OK);
      }
      writeJson(w, jsonResponse);
    } catch (Exception e) {
      throw new OBException(e);
    }
  }

  // collect all the successfully created orders
  protected JSONObject successMessage(JSONObject jsonOrder) throws Exception {
    processedOrders.get().put(processedOrders.get().length(), jsonOrder);
    return super.successMessage(jsonOrder);
  }

  public class SetOrderIDHook implements OrderLoaderHook {
    @Override
    public void exec(JSONObject jsonorder, Order order, ShipmentInOut shipment, Invoice invoice)
        throws Exception {
      jsonorder.put("_createdOrderId", order.getId());
    }
  }
}