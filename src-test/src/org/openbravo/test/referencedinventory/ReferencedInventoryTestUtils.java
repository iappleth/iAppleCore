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
 * All portions are Copyright (C) 2018 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.test.referencedinventory;

import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.Assert.assertThat;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import javax.servlet.ServletException;

import org.apache.commons.lang.StringUtils;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.criterion.Restrictions;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBDao;
import org.openbravo.erpCommon.utility.SequenceIdData;
import org.openbravo.exception.NoConnectionAvailableException;
import org.openbravo.materialmgmt.ReservationUtils;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.common.order.OrderLine;
import org.openbravo.model.common.plm.AttributeSetInstance;
import org.openbravo.model.common.plm.Product;
import org.openbravo.model.materialmgmt.onhandquantity.ReferencedInventory;
import org.openbravo.model.materialmgmt.onhandquantity.ReferencedInventoryType;
import org.openbravo.model.materialmgmt.onhandquantity.Reservation;
import org.openbravo.model.materialmgmt.onhandquantity.ReservationStock;
import org.openbravo.model.materialmgmt.onhandquantity.StorageDetail;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOut;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOutLine;
import org.openbravo.service.db.CallStoredProcedure;

/**
 * Utils class for Referenced Inventory tests
 */
class ReferencedInventoryTestUtils {

  private static final String COMPLETE_ACTION = "CO";
  private static final String DRAFT_STATUS = "DR";

  // Goods Receipt '10000012'
  private static final String MINOUT_TEMPLATE_ID = "0450583047434254835B2B36B2E5B018";
  private static final String M_INOUT_POST = "m_inout_post";

  static final String QA_SPAIN_ORG_ID = "357947E87C284935AD1D783CF6F099A1";
  static final String QA_SPAIN_WAREHOUSE_ID = "4028E6C72959682B01295ECFEF4502A0";
  static final String QA_CLIENT_ID = "4028E6C72959682B01295A070852010D";
  static final String PRODUCT_TSHIRT_ID = "0CF7C882B8BD4D249F3BCC8727A736D1";
  static final String PRODUCT_BALL_COLORATTRIBUTE = "EBCD272DC37B4ABBB12B96139E5837BF";
  static final String ATTRIBUTE_COLOR_YELLOW = "BC4F469EE90445AA8D6F41DE8523FA63";
  static final String BIN_SPAIN_L01 = "193476BDD14E4A11B651B4E3E8D767C8";
  static final String BIN_SPAIN_L02 = "1A11102F318D4720957B52C8719A34F2";
  static final String BIN_SPAIN_L03 = "FB4D5926A1B443E68CC2DB2BBAE3315D";
  static final String PRODUCT_LAPTOP_SERIALATTRIBUTE = "901CAFF074954746970719E6A2910638";
  static final String ATTRIBUTE_LAPTOP_SERIALNO = "2AC97E906A744C6E96EDE2E27A124818";
  static final String PRODUCT_RAWMATERIAL_LOTATTRIBUTE = "4028E6C72959682B01295ADC1AD40222";
  static final String ATTRIBUTE_RAWMATERIAL_LOT = "4028E6C72959682B01295ECFE4C60272";

  static ReferencedInventoryType createReferencedInventoryType() {
    final ReferencedInventoryType refInvType = OBProvider.getInstance().get(
        ReferencedInventoryType.class);
    refInvType.setClient(OBContext.getOBContext().getCurrentClient());
    refInvType.setOrganization(OBDal.getInstance().getProxy(Organization.class, "0"));
    refInvType.setName(UUID.randomUUID().toString());
    refInvType.setShared(true);
    OBDal.getInstance().save(refInvType);
    assertThat("Referenced Inventory Type is successfully created", refInvType, notNullValue());
    return refInvType;
  }

  static ReferencedInventory createReferencedInventory(final String orgId,
      final ReferencedInventoryType refInvType) {
    final ReferencedInventory refInv = OBProvider.getInstance().get(ReferencedInventory.class);
    refInv.setClient(OBContext.getOBContext().getCurrentClient());
    refInv.setOrganization(OBDal.getInstance().getProxy(Organization.class, orgId));
    refInv.setReferencedInventoryType(refInvType);
    refInv.setSearchKey(refInvType.getSequence() == null ? StringUtils.left(UUID.randomUUID()
        .toString(), 30) : "<to be replaced>");
    OBDal.getInstance().save(refInv);
    assertThat("Referenced Inventory is successfully created", refInv, notNullValue());
    assertThat("Referenced Inventory is empty", refInv.getMaterialMgmtStorageDetailList(), empty());
    return refInv;
  }

  static Product cloneProduct(String productId) {
    Product oldProduct = OBDal.getInstance().get(Product.class, productId);
    Product newProduct = (Product) DalUtil.copy(oldProduct, false);
    newProduct.setSearchKey(StringUtils.left(UUID.randomUUID().toString(), 40));
    newProduct.setName(newProduct.getSearchKey());
    newProduct.setId(SequenceIdData.getUUID());
    newProduct.setNewOBObject(true);
    OBDal.getInstance().save(newProduct);
    return newProduct;
  }

  static ShipmentInOut receiveProduct(final Product product, final BigDecimal movementQty,
      final String attributeSetInstanceId) {
    final ShipmentInOut inOut = cloneReceiptShipment(MINOUT_TEMPLATE_ID);
    final ShipmentInOutLine inOutLine = inOut.getMaterialMgmtShipmentInOutLineList().get(0);
    inOutLine.setProduct(product);
    inOutLine.setMovementQuantity(movementQty);
    if (StringUtils.isNotBlank(attributeSetInstanceId)) {
      inOutLine.setAttributeSetValue(OBDal.getInstance().getProxy(AttributeSetInstance.class,
          attributeSetInstanceId));
    }
    callMInoutPost(inOut);
    OBDal.getInstance().flush();
    OBDal.getInstance().refresh(inOut);
    assertThat("Goods Receipt must be processed: ", inOut.isProcessed(), equalTo(true));
    return inOut;
  }

  static ShipmentInOut cloneReceiptShipment(String mInoutTemplateId) {
    ShipmentInOut oldInOut = OBDal.getInstance().get(ShipmentInOut.class, mInoutTemplateId);
    ShipmentInOut newInOut = (ShipmentInOut) DalUtil.copy(oldInOut, false);

    newInOut.setId(SequenceIdData.getUUID());
    newInOut.setDocumentNo("<>"); // Automatically filled later on
    newInOut.setDocumentStatus(DRAFT_STATUS);
    newInOut.setDocumentAction(COMPLETE_ACTION);
    newInOut.setProcessed(false);
    newInOut.setMovementDate(new Date());
    newInOut.setOrderDate(new Date());
    newInOut.setNewOBObject(true);
    newInOut.setSalesOrder(null);

    OBDal.getInstance().save(newInOut);

    for (ShipmentInOutLine line : oldInOut.getMaterialMgmtShipmentInOutLineList()) {
      cloneReceiptShipmentLine(line, newInOut);
    }

    OBDal.getInstance().flush();
    return newInOut;
  }

  private static ShipmentInOutLine cloneReceiptShipmentLine(ShipmentInOutLine oldLine,
      ShipmentInOut newInOut) {
    ShipmentInOutLine newLine = (ShipmentInOutLine) DalUtil.copy(oldLine, false);

    newLine.setId(SequenceIdData.getUUID());
    newLine.setShipmentReceipt(newInOut);
    newLine.setNewOBObject(true);
    newLine.setSalesOrderLine(null);

    OBDal.getInstance().save(newLine);
    newInOut.getMaterialMgmtShipmentInOutLineList().add(newLine);

    return newLine;
  }

  static void callMInoutPost(final ShipmentInOut shipmentReceipt) throws OBException {
    final List<Object> parameters = new ArrayList<Object>();
    parameters.add(null);
    parameters.add(shipmentReceipt.getId());
    CallStoredProcedure.getInstance().call(M_INOUT_POST, parameters, null, true, false);
  }

  static JSONArray getStorageDetailsToBoxJSArray(final StorageDetail storageDetail,
      final BigDecimal qty) throws JSONException {
    final JSONObject storageDetailJS = new JSONObject();
    storageDetailJS.put("id", storageDetail.getId());
    storageDetailJS.put("quantityOnHand", qty == null ? storageDetail.getQuantityOnHand() : qty);
    final JSONArray storageDetailsJS = new JSONArray();
    storageDetailsJS.put(storageDetailJS);
    return storageDetailsJS;
  }

  static JSONArray getUnboxStorageDetailsJSArray(final StorageDetail storageDetail,
      final BigDecimal qty, final String unBoxStorageBinId) throws JSONException {
    final JSONObject storageDetailJS = new JSONObject();
    storageDetailJS.put("id", storageDetail.getId());
    storageDetailJS.put("quantityOnHand", qty == null ? storageDetail.getQuantityOnHand() : qty);
    storageDetailJS.put("storageBin", unBoxStorageBinId);
    final JSONArray storageDetailsJS = new JSONArray();
    storageDetailsJS.put(storageDetailJS);
    return storageDetailsJS;
  }

  static List<StorageDetail> getAvailableStorageDetailsOrderByQtyOnHand(final Product product) throws ServletException,
      NoConnectionAvailableException {
    final OBCriteria<StorageDetail> crit = OBDao.getFilteredCriteria(StorageDetail.class,
        Restrictions.eq(StorageDetail.PROPERTY_PRODUCT, product),
        Restrictions.gt(StorageDetail.PROPERTY_QUANTITYONHAND, BigDecimal.ZERO));
    crit.addOrderBy(StorageDetail.PROPERTY_QUANTITYONHAND, true);
    return crit.list();
  }

  static StorageDetail getUniqueStorageDetail(final Product product) throws ServletException,
      NoConnectionAvailableException {
    final List<StorageDetail> storageDetails = getAvailableStorageDetailsOrderByQtyOnHand(product);
    if (storageDetails.size() > 1) {
      throw new OBException(storageDetails.size()
          + " storage details were found but just 1 was expected");
    }
    return storageDetails.get(0);
  }

  static void sortStorageDetailsByQtyOnHand(List<StorageDetail> storageDetails) {
    Collections.sort(storageDetails, new Comparator<StorageDetail>() {
      @Override
      public int compare(StorageDetail o1, StorageDetail o2) {
        return o1.getQuantityOnHand().compareTo(o2.getQuantityOnHand());
      }
    });
  }

  static String getAnyStorageDetail() {
    OBCriteria<StorageDetail> storageDetailCriteria = OBDal.getInstance().createCriteria(
        StorageDetail.class);
    storageDetailCriteria.setMaxResults(1);
    return ((StorageDetail) storageDetailCriteria.uniqueResult()).getId();
  }

  static Reservation createProcessAndAssertReservation(final StorageDetail storageDetail,
      final BigDecimal reservationQty, final String orderLineId, final boolean isAllocated) {
    if (reservationQty != null && reservationQty.compareTo(BigDecimal.ZERO) > 0) {
      Reservation reservation = OBProvider.getInstance().get(Reservation.class);
      reservation.setOrganization(storageDetail.getOrganization());
      reservation.setQuantity(reservationQty);
      reservation.setProduct(storageDetail.getProduct());
      reservation.setUOM(storageDetail.getUOM());
      if (orderLineId != null) {
        reservation.setSalesOrderLine(OBDal.getInstance().getProxy(OrderLine.class, orderLineId));
      }
      reservation.setWarehouse(storageDetail.getStorageBin().getWarehouse());
      reservation.setStorageBin(storageDetail.getStorageBin());
      reservation.setAttributeSetValue(storageDetail.getAttributeSetValue());
      OBDal.getInstance().save(reservation);
      ReservationUtils.processReserve(reservation, "PR");
      OBDal.getInstance().refresh(reservation);

      assertsNewCreatedReservation(reservationQty, reservation);

      OBDal.getInstance().refresh(storageDetail);
      assertThat("Storage Detail qty reserved is updated", reservationQty,
          equalTo(storageDetail.getReservedQty()));

      if (isAllocated) {
        transformToAllocated(reservation);
        OBDal.getInstance().refresh(reservation);
        OBDal.getInstance().flush();
        OBDal.getInstance().refresh(storageDetail);
        assertThat("Storage Detail qty reserved is updated", reservationQty,
            equalTo(storageDetail.getReservedQty()));
      }

      return reservation;
    }
    return null;
  }

  private static void assertsNewCreatedReservation(final BigDecimal reservationQty,
      Reservation reservation) {
    assertThat("Reservation must be processed", reservation.getRESStatus(), equalTo("CO"));
    final List<ReservationStock> reservationStockLines = reservation
        .getMaterialMgmtReservationStockList();
    assertThat("Reservation has one line", reservationStockLines.size(), equalTo(1));
    final ReservationStock reservationStock = reservationStockLines.get(0);
    assertThat("Reservation qty is properly set in lines", reservationStock.getQuantity(),
        equalTo(reservationQty));
    assertThat("Reservation qty is properly set in header", reservation.getQuantity(),
        equalTo(reservationQty));
    assertThat("No released qty in lines", reservationStock.getReleased(), equalTo(BigDecimal.ZERO));
    assertThat("No released qty  in header", reservation.getReleased(), equalTo(BigDecimal.ZERO));
  }

  private static void transformToAllocated(final Reservation reservation) {
    for (final ReservationStock reservationStock : reservation
        .getMaterialMgmtReservationStockList()) {
      reservationStock.setAllocated(true);
      OBDal.getInstance().save(reservationStock);
    }

    OBDal.getInstance().flush(); // Necessary to flush
  }
}
