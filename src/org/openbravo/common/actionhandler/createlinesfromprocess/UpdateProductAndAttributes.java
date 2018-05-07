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

import java.util.List;

import javax.enterprise.context.Dependent;

import org.codehaus.jettison.json.JSONObject;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.common.actionhandler.createlinesfromprocess.util.CreateLinesFromUtil;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.common.invoice.Invoice;
import org.openbravo.model.common.invoice.InvoiceLine;
import org.openbravo.model.common.order.OrderLine;
import org.openbravo.model.common.plm.AttributeInstance;
import org.openbravo.model.common.plm.AttributeSet;
import org.openbravo.model.common.plm.AttributeSetInstance;
import org.openbravo.model.common.plm.AttributeUse;
import org.openbravo.model.common.plm.Product;
import org.openbravo.model.materialmgmt.transaction.ShipmentInOutLine;

@Dependent
@Qualifier(CreateLinesFromProcessImplementationInterface.CREATE_LINES_FROM_PROCESS_HOOK_QUALIFIER)
class UpdateProductAndAttributes implements CreateLinesFromProcessImplementationInterface {
  private BaseOBObject copiedLine;
  private boolean isOrderLine;

  @Override
  public int getOrder() {
    return -40;
  }

  /**
   * Update the product and attribute set to the new invoice line
   */
  @Override
  public void exec(final Invoice currentInvoice, final JSONObject pickExecuteLineValues,
      final BaseOBObject selectedLine, InvoiceLine newInvoiceLine) {
    this.copiedLine = selectedLine;
    this.isOrderLine = CreateLinesFromUtil.isOrderLine(selectedLine);

    // Update the product
    newInvoiceLine.setProduct((Product) copiedLine.get(isOrderLine ? OrderLine.PROPERTY_PRODUCT
        : ShipmentInOutLine.PROPERTY_PRODUCT));

    // Update the attributes
    AttributeSetInstance attributeSetValue = (AttributeSetInstance) copiedLine
        .get(isOrderLine ? OrderLine.PROPERTY_ATTRIBUTESETVALUE
            : ShipmentInOutLine.PROPERTY_ATTRIBUTESETVALUE);
    if (isInstanceAttribute(attributeSetValue)) {
      AttributeSetInstance newAttributeSetInstance = copyAttributeSetValue(attributeSetValue);
      newInvoiceLine.setAttributeSetValue(newAttributeSetInstance);
    }
  }

  /**
   * Return if an attribute set is instance. It returns TRUE if the attribute set is Lot, Serial No.
   * or Expiration Date or if any of it attributes is an instance attribute
   * 
   * @param attributeSetInstance
   *          The attribute set instance to be validated
   * @return True if it is instance or False if not
   */
  private boolean isInstanceAttribute(final AttributeSetInstance attributeSetInstance) {
    if (attributeSetInstance == null) {
      return Boolean.FALSE;
    }
    AttributeSet attributeSet = attributeSetInstance.getAttributeSet();
    List<AttributeUse> attributeUses = attributeSet.getAttributeUseList();
    boolean hasInstanceAttribute = false;
    for (AttributeUse attributeUse : attributeUses) {
      if (attributeUse.getAttribute().isInstanceAttribute()) {
        hasInstanceAttribute = Boolean.TRUE;
        break;
      }
    }
    return (attributeSet.isLot() || attributeSet.isSerialNo() || attributeSet.isExpirationDate() || hasInstanceAttribute);
  }

  private AttributeSetInstance copyAttributeSetValue(final AttributeSetInstance attributeSetValue) {
    AttributeSetInstance newAttributeSetInstance = copyAttributeSetInstance(attributeSetValue);
    copyAttributes(attributeSetValue, newAttributeSetInstance);

    return newAttributeSetInstance;
  }

  private AttributeSetInstance copyAttributeSetInstance(final AttributeSetInstance attributeSetValue) {
    AttributeSetInstance newAttributeSetInstance = OBProvider.getInstance().get(
        AttributeSetInstance.class);
    newAttributeSetInstance.setAttributeSet(attributeSetValue.getAttributeSet());
    newAttributeSetInstance.setSerialNo(attributeSetValue.getSerialNo());
    newAttributeSetInstance.setLot(attributeSetValue.getLot());
    newAttributeSetInstance.setExpirationDate(attributeSetValue.getExpirationDate());
    newAttributeSetInstance.setDescription(attributeSetValue.getDescription());
    newAttributeSetInstance.setLotName(attributeSetValue.getLotName());
    newAttributeSetInstance.setLocked(attributeSetValue.isLocked());
    newAttributeSetInstance.setLockDescription(attributeSetValue.getLockDescription());
    OBDal.getInstance().save(newAttributeSetInstance);
    return newAttributeSetInstance;
  }

  private void copyAttributes(final AttributeSetInstance attributeSetValueFrom,
      final AttributeSetInstance attributeSetInstanceTo) {
    for (AttributeInstance attrInstance : attributeSetValueFrom.getAttributeInstanceList()) {
      AttributeInstance newAttributeInstance = OBProvider.getInstance()
          .get(AttributeInstance.class);
      newAttributeInstance.setAttributeSetValue(attributeSetInstanceTo);
      newAttributeInstance.setAttribute(attrInstance.getAttribute());
      attrInstance.setAttributeValue(attrInstance.getAttributeValue());

      attributeSetInstanceTo.getAttributeInstanceList().add(newAttributeInstance);
      OBDal.getInstance().save(newAttributeInstance);
      OBDal.getInstance().save(attributeSetInstanceTo);
    }
  }
}
