/*
 ************************************************************************************
 * Copyright (C) 2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal.process;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import javax.enterprise.context.Dependent;

import org.apache.commons.lang.StringUtils;
import org.hibernate.ScrollableResults;
import org.openbravo.advpaymentmngt.utility.FIN_Utility;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.util.Check;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.materialmgmt.InvoiceGeneratorFromGoodsShipment;
import org.openbravo.materialmgmt.StockUtils;
import org.openbravo.model.ad.process.ProcessInstance;
import org.openbravo.model.common.businesspartner.BusinessPartner;
import org.openbravo.model.common.enterprise.Locator;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.common.enterprise.Warehouse;
import org.openbravo.model.common.order.Order;
import org.openbravo.model.common.order.OrderLine;
import org.openbravo.model.common.plm.Product;
import org.openbravo.model.materialmgmt.onhandquantity.StockProposed;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOut;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOutLine;
import org.openbravo.service.db.CallProcess;

/**
 * Helper class to generate, process and invoice Goods Shipment
 */

@Dependent
class GoodsShipmentGenerator {

  private static final String PROCESS_M_MINOUT_POST = "109";
  private static final String DOCBASETYPE_MATERIAL_SHIPMENT = "MMS";

  private ShipmentInOut shipment;
  private long lineNo = 10L;

  /**
   * Creates a new Shipment header
   * 
   * @param organization
   *          The organization
   * @param warehouse
   *          The warehouse
   * @param businessPartner
   *          The Business Partner
   * @param salesOrder
   *          The Sales Order the shipping address will taken from
   * 
   * @return the shipment header
   */
  ShipmentInOut createNewGoodsShipment(final Organization organization, final Warehouse warehouse,
      final BusinessPartner businessPartner, Order salesOrder) {
    this.shipment = OBProvider.getInstance().get(ShipmentInOut.class);
    this.shipment.setNewOBObject(true);
    this.shipment.setClient(organization.getClient());
    this.shipment.setOrganization(organization);
    this.shipment.setTrxOrganization(salesOrder.getTrxOrganization());
    this.shipment.setSalesTransaction(true);
    this.shipment
        .setDocumentType(FIN_Utility.getDocumentType(organization, DOCBASETYPE_MATERIAL_SHIPMENT));
    this.shipment.setDocumentNo(FIN_Utility.getDocumentNo(this.shipment.getDocumentType(),
        this.shipment.getDocumentType().getTable() != null
            ? "DocumentNo_" + this.shipment.getDocumentType().getTable().getDBTableName()
            : ""));
    this.shipment.setWarehouse(warehouse);
    this.shipment.setBusinessPartner(businessPartner);
    this.shipment.setPartnerAddress(salesOrder.getPartnerAddress());
    this.shipment.setMovementDate(Date.valueOf(LocalDate.now()));
    this.shipment.setAccountingDate(Date.valueOf(LocalDate.now()));

    OBDal.getInstance().save(this.shipment);

    return this.shipment;
  }

  /**
   * Creates as many shipment lines as required linked to the shipment header. Generates as many
   * lines as number of bins required to fulfill the quantity to deliver. Those bins are being
   * proposed by StockUtils.getStockProposed
   * 
   * @param product
   *          The product
   * @param qtyToDeliver
   *          The movement quantity
   * @param salesOrderLine
   *          The sales order line
   * @return the shipment line created
   */
  List<ShipmentInOutLine> createShipmentLines(final Product product, final BigDecimal qtyToDeliver,
      final OrderLine salesOrderLine) {
    List<ShipmentInOutLine> result = new ArrayList<>();
    BigDecimal quantityPending = qtyToDeliver;
    ScrollableResults proposedBins = null;
    try {
      proposedBins = StockUtils.getStockProposed(salesOrderLine, qtyToDeliver,
          this.shipment.getWarehouse());
      while (quantityPending.compareTo(BigDecimal.ZERO) > 0 && proposedBins.next()) {
        StockProposed stockProposed = (StockProposed) proposedBins.get(0);
        BigDecimal shipmentlineQty;
        BigDecimal stockProposedQty = stockProposed.getQuantity();
        if (quantityPending.compareTo(stockProposedQty) > 0) {
          shipmentlineQty = stockProposedQty;
          quantityPending = quantityPending.subtract(shipmentlineQty);
        } else {
          shipmentlineQty = quantityPending;
          quantityPending = BigDecimal.ZERO;
        }
        result.add(createShipmentLine(product, shipmentlineQty, salesOrderLine,
            stockProposed.getStorageDetail().getStorageBin()));
      }
    } finally {
      if (proposedBins != null) {
        proposedBins.close();
      }
    }
    if (result.isEmpty()) {
      throw new OBException(
          String.format(OBMessageUtils.messageBD("OBRDM_UnableToGetStock"), product.getName()));
    }
    return result;
  }

  /**
   * Creates a new shipment line linked to the shipment header
   * 
   * @param product
   *          The product
   * @param quantity
   *          The movement quantity
   * @param salesOrderLine
   *          The sales order line
   * @param bin
   *          The storage bin the item is delivered from
   * @return the shipment line created
   */
  ShipmentInOutLine createShipmentLine(final Product product, final BigDecimal quantity,
      final OrderLine salesOrderLine, Locator bin) {
    Check.isNotNull(this.shipment, "Shipment should not be null");
    Check.isNotNull(product, "Product should not be null");
    Check.isNotNull(salesOrderLine, "Sales Order Line should not be null");
    BigDecimal movementQuantity = quantity;
    if (movementQuantity == null) {
      movementQuantity = BigDecimal.ZERO;
    }
    final ShipmentInOutLine shipmentLine = OBProvider.getInstance().get(ShipmentInOutLine.class);
    shipmentLine.setNewOBObject(true);
    shipmentLine.setLineNo(lineNo);
    shipmentLine.setShipmentReceipt(this.shipment);
    shipmentLine.setOrganization(this.shipment.getOrganization());
    shipmentLine.setClient(this.shipment.getClient());
    shipmentLine.setProduct(product);
    shipmentLine.setMovementQuantity(movementQuantity);
    shipmentLine.setUOM(product.getUOM());
    shipmentLine.setStorageBin(bin);
    shipmentLine.setSalesOrderLine(salesOrderLine);
    shipmentLine.setAttributeSetValue(salesOrderLine.getAttributeSetValue());

    OBDal.getInstance().save(shipmentLine);
    this.shipment.getMaterialMgmtShipmentInOutLineList().add(shipmentLine);
    lineNo += 10;
    return shipmentLine;
  }

  /**
   * Automatically generate invoice from Goods Shipment, if possible
   */
  void invoiceShipmentIfPossible() {
    OBDal.getInstance().refresh(this.shipment);
    InvoiceGeneratorFromGoodsShipment invoiceGenerator = new InvoiceGeneratorFromGoodsShipment(
        this.shipment.getId());
    invoiceGenerator.setAllowInvoicePOSOrder(true);
    invoiceGenerator.createInvoiceConsideringInvoiceTerms(true);

  }

  /**
   * Process the Goods Shipment
   */
  void processShipment() {
    final org.openbravo.model.ad.ui.Process process = OBDal.getInstance()
        .get(org.openbravo.model.ad.ui.Process.class, PROCESS_M_MINOUT_POST);
    final ProcessInstance pinstance = CallProcess.getInstance()
        .call(process, this.shipment.getId(), null);
    final OBError result = OBMessageUtils.getProcessInstanceMessage(pinstance);
    if (StringUtils.equals("Error", result.getType())) {
      throw new OBException(result.getMessage());
    }
  }
}
