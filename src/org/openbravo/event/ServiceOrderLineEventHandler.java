/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.0  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License.
 * The Original Code is Openbravo ERP.
 * The Initial Developer of the Original Code is Openbravo SLU
 * All portions are Copyright (C) 2013-2014 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 *************************************************************************
 */
package org.openbravo.event;

import java.math.BigDecimal;

import javax.enterprise.event.Observes;

import org.apache.log4j.Logger;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.model.Property;
import org.openbravo.client.kernel.event.EntityPersistenceEventObserver;
import org.openbravo.client.kernel.event.EntityUpdateEvent;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.model.common.order.OrderLine;
import org.openbravo.model.common.order.OrderlineServiceRelation;

public class ServiceOrderLineEventHandler extends EntityPersistenceEventObserver {
  private static Entity[] entities = { ModelProvider.getInstance().getEntity(OrderLine.ENTITY_NAME) };
  protected Logger logger = Logger.getLogger(ServiceOrderLineEventHandler.class);

  @Override
  protected Entity[] getObservedEntities() {
    return entities;
  }

  public void onUpdate(@Observes EntityUpdateEvent event) {
    if (!isValidEvent(event)) {
      return;
    }

    final Entity orderLineEntity = ModelProvider.getInstance().getEntity(OrderLine.ENTITY_NAME);
    final OrderLine thisLine = (OrderLine) event.getTargetInstance();

    StringBuffer where = new StringBuffer();
    where.append(" as rol");
    where.append(" where " + OrderlineServiceRelation.PROPERTY_ORDERLINERELATED
        + ".id = :orderLineId");
    OBQuery<OrderlineServiceRelation> rol = OBDal.getInstance().createQuery(
        OrderlineServiceRelation.class, where.toString());

    rol.setNamedParameter("orderLineId", thisLine.getId());
    rol.setMaxResult(1);
    if (rol.uniqueResult() != null) {
      final Property lineNetAmountProperty = orderLineEntity
          .getProperty(OrderLine.PROPERTY_LINENETAMOUNT);
      final Property lineGrossAmountProperty = orderLineEntity
          .getProperty(OrderLine.PROPERTY_LINEGROSSAMOUNT);
      final Property orderedQtyProperty = orderLineEntity
          .getProperty(OrderLine.PROPERTY_ORDEREDQUANTITY);

      BigDecimal currentLineNetAmount = (BigDecimal) event.getCurrentState(lineNetAmountProperty);
      BigDecimal oldLineNetAmount = (BigDecimal) event.getPreviousState(lineNetAmountProperty);
      BigDecimal currentLineGrossAmount = (BigDecimal) event
          .getCurrentState(lineGrossAmountProperty);
      BigDecimal oldLineGrossAmount = (BigDecimal) event.getPreviousState(lineGrossAmountProperty);
      BigDecimal currentOrderedQty = (BigDecimal) event.getCurrentState(orderedQtyProperty);
      BigDecimal oldOrderedQty = (BigDecimal) event.getPreviousState(orderedQtyProperty);

      if (currentOrderedQty.compareTo(oldOrderedQty) != 0) {
        rol = OBDal.getInstance().createQuery(OrderlineServiceRelation.class, where.toString());
        rol.setNamedParameter("orderLineId", thisLine.getId());
        rol.setMaxResult(1000);
        final ScrollableResults scroller = rol.scroll(ScrollMode.FORWARD_ONLY);
        while (scroller.next()) {
          final OrderlineServiceRelation or = (OrderlineServiceRelation) scroller.get()[0];
          if (or.getQuantity().compareTo(currentOrderedQty) > 0) {
            or.setQuantity(currentOrderedQty);
            if (thisLine.getSalesOrder().isPriceIncludesTax()) {
              if (currentLineGrossAmount.compareTo(oldLineGrossAmount) != 0) {
                or.setAmount(currentLineGrossAmount);
              }
            } else {
              if (currentLineNetAmount.compareTo(oldLineNetAmount) != 0) {
                or.setAmount(currentLineNetAmount);
              }
            }
            OBDal.getInstance().save(or);
          }
        }
      }
    }
  }
}