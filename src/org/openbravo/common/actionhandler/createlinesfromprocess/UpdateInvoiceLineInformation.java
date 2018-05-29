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

package org.openbravo.common.actionhandler.createlinesfromprocess;

import java.math.BigDecimal;
import java.util.Set;

import javax.enterprise.context.Dependent;

import org.hibernate.criterion.Restrictions;
import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.dal.security.OrganizationStructureProvider;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.common.invoice.InvoiceLine;
import org.openbravo.model.common.order.Order;
import org.openbravo.model.common.order.OrderLine;
import org.openbravo.model.financialmgmt.accounting.Costcenter;
import org.openbravo.model.financialmgmt.accounting.UserDimension1;
import org.openbravo.model.financialmgmt.accounting.UserDimension2;
import org.openbravo.model.financialmgmt.assetmgmt.Asset;
import org.openbravo.model.financialmgmt.payment.FIN_PaymentSchedule;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOutLine;
import org.openbravo.model.project.Project;

@Dependent
@Qualifier(CreateLinesFromProcessHook.CREATE_LINES_FROM_PROCESS_HOOK_QUALIFIER)
class UpdateInvoiceLineInformation extends CreateLinesFromProcessHook {
  @Override
  public int getOrder() {
    return -60;
  }

  /**
   * Updates the Information of the new Invoice Line that is related with the Invoice Header and the
   * copied order line.
   */
  @Override
  public void exec() {
    // Create to the new invoice line the reference to the order line from it is created
    updateOrderLineReference();

    // Information updated from invoice header: Client, Description and Business Partner
    updateInformationFromInvoice();

    // Information updated from orderLine: Organization, Project, CostCenter, Asset, User1
    // Dimension and User2 Dimension
    udpateInformationFromOrderLine();

    // Update the BOM Parent of the invoice line
    updateBOMParent();

    // Update Invoice prepayment amount
    updateInvoicePrepaymentAmount();

    // Update Invoice's order reference
    updateOrderReference();
  }

  /**
   * Creates to the new invoice line the reference to the order line from it is created.
   */
  private void updateOrderLineReference() {
    if (isCopiedFromOrderLine()) {
      getInvoiceLine().setSalesOrderLine((OrderLine) getCopiedFromLine());
      getInvoiceLine().setGoodsShipmentLine(
          CreateLinesFromUtil.getShipmentInOutLine(getPickExecJSONObject()));
    } else if (CreateLinesFromUtil.isShipmentReceiptLine(getCopiedFromLine())) {
      getInvoiceLine().setGoodsShipmentLine((ShipmentInOutLine) getCopiedFromLine());
      getInvoiceLine().setSalesOrderLine(
          ((ShipmentInOutLine) getCopiedFromLine()).getSalesOrderLine());
    }
  }

  /**
   * Updates some invoice line information from the invoice header
   */
  private void updateInformationFromInvoice() {
    getInvoiceLine().setClient(getInvoice().getClient());
    getInvoiceLine().setDescription(getInvoice().getDescription());
  }

  private void udpateInformationFromOrderLine() {
    getInvoiceLine().setOrganization(getOrganizationForNewLine());
    getInvoiceLine().setProject(
        (Project) getCopiedFromLine().get(
            isCopiedFromOrderLine() ? OrderLine.PROPERTY_PROJECT : ShipmentInOutLine.PROPERTY_PROJECT));
    getInvoiceLine().setCostcenter(
        (Costcenter) getCopiedFromLine().get(
            isCopiedFromOrderLine() ? OrderLine.PROPERTY_COSTCENTER : ShipmentInOutLine.PROPERTY_COSTCENTER));
    getInvoiceLine().setAsset(
        (Asset) getCopiedFromLine().get(
            isCopiedFromOrderLine() ? OrderLine.PROPERTY_ASSET : ShipmentInOutLine.PROPERTY_ASSET));
    getInvoiceLine().setStDimension(
        (UserDimension1) getCopiedFromLine()
            .get(
                isCopiedFromOrderLine() ? OrderLine.PROPERTY_STDIMENSION
                    : ShipmentInOutLine.PROPERTY_STDIMENSION));
    getInvoiceLine().setNdDimension(
        (UserDimension2) getCopiedFromLine()
            .get(
                isCopiedFromOrderLine() ? OrderLine.PROPERTY_NDDIMENSION
                    : ShipmentInOutLine.PROPERTY_NDDIMENSION));
  }

  private Organization getOrganizationForNewLine() {
    Organization organizationForNewLine = getInvoice().getOrganization();
    Set<String> parentOrgTree = new OrganizationStructureProvider().getChildTree(
        organizationForNewLine.getId(), true);
    // If the Organization of the line that is being copied belongs to the child tree of the
    // Organization of the document header of the new line, use the organization of the line being
    // copied, else use the organization of the document header of the new line
    Organization copiedLineOrg = ((Organization) getCopiedFromLine().get(
        isCopiedFromOrderLine() ? OrderLine.PROPERTY_ORGANIZATION : ShipmentInOutLine.PROPERTY_ORGANIZATION));
    if (parentOrgTree.contains(copiedLineOrg.getId())) {
      organizationForNewLine = copiedLineOrg;
    }
    return organizationForNewLine;
  }

  private void updateBOMParent() {
    getInvoiceLine().setBOMParent(getInvoiceLineBOMParent());
  }

  private InvoiceLine getInvoiceLineBOMParent() {
    if (!isCopiedFromOrderLine() && ((ShipmentInOutLine) getCopiedFromLine()).getBOMParent() == null) {
      return null;
    }

    OBCriteria<InvoiceLine> obc = OBDal.getInstance().createCriteria(InvoiceLine.class);
    obc.add(Restrictions.eq(InvoiceLine.PROPERTY_INVOICE, getInvoice()));
    if (isCopiedFromOrderLine()) {
      obc.add(Restrictions.eq(InvoiceLine.PROPERTY_SALESORDERLINE,
          ((OrderLine) getCopiedFromLine()).getBOMParent()));
    } else {
      obc.add(Restrictions.eq(InvoiceLine.PROPERTY_GOODSSHIPMENTLINE,
          ((ShipmentInOutLine) getCopiedFromLine()).getBOMParent()));
    }
    obc.setMaxResults(1);
    return (InvoiceLine) obc.uniqueResult();
  }

  /**
   * Update the prepayment amount of the Invoice
   */
  private void updateInvoicePrepaymentAmount() {
    if (CreateLinesFromUtil.isOrderLineOrHasRelatedOrderLine(isCopiedFromOrderLine(), getCopiedFromLine())) {
      BigDecimal invoicePrepaymentAmt = getInvoice().getPrepaymentamt();
      getInvoice().setPrepaymentamt(invoicePrepaymentAmt.add(getOrderPrepaymentAmt()));
    }
  }

  /**
   * Get the prepayment amount of the related order
   * 
   * @return The prepayment amount of related order
   */
  private BigDecimal getOrderPrepaymentAmt() {
    final OBCriteria<FIN_PaymentSchedule> obc = OBDal.getInstance().createCriteria(
        FIN_PaymentSchedule.class);
    Order processingOrder = getRelatedOrder();
    if (processingOrder == null) {
      return BigDecimal.ZERO;
    }
    obc.add(Restrictions.eq(FIN_PaymentSchedule.PROPERTY_ORDER, processingOrder));
    obc.setMaxResults(1);
    BigDecimal paidAmt = ((FIN_PaymentSchedule) obc.uniqueResult()).getPaidAmount();
    return paidAmt;
  }

  /**
   * Update the Order reference to the invoice
   */
  private void updateOrderReference() {
    Order processingOrder = getRelatedOrder();
    if (processingOrder != null) {
      int relatedOrderCount = getCountOfRelatedOrdersToInvoiceLinesDifferentThanOrder(processingOrder);
      getInvoice().setSalesOrder(relatedOrderCount != 0 ? null : processingOrder);
    }
  }

  private int getCountOfRelatedOrdersToInvoiceLinesDifferentThanOrder(Order processingOrder) {
    StringBuilder relatedOrdersHQL = new StringBuilder(" as il ");
    relatedOrdersHQL.append(" where il.invoice.id = :invId");
    relatedOrdersHQL.append("  and il.salesOrderLine.salesOrder.id <> :ordId");

    OBQuery<InvoiceLine> relatedOrdersQuery = OBDal.getInstance().createQuery(InvoiceLine.class,
        relatedOrdersHQL.toString());
    relatedOrdersQuery.setNamedParameter("invId", getInvoice().getId());
    relatedOrdersQuery.setNamedParameter("ordId", processingOrder.getId());
    return relatedOrdersQuery.count();
  }

  private Order getRelatedOrder() {
    Order processingOrder = null;
    if (isCopiedFromOrderLine()) {
      processingOrder = ((OrderLine) getCopiedFromLine()).getSalesOrder();
    } else if (((ShipmentInOutLine) getCopiedFromLine()).getSalesOrderLine() != null) {
      processingOrder = ((ShipmentInOutLine) getCopiedFromLine()).getSalesOrderLine()
          .getSalesOrder();
    }
    return processingOrder;
  }
}
