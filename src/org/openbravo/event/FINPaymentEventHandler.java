/*
 ************************************************************************************
 * Copyright (C) 2016 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

package org.openbravo.event;

import java.math.BigDecimal;

import javax.enterprise.event.Observes;

import org.apache.log4j.Logger;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.model.Property;
import org.openbravo.client.kernel.event.EntityDeleteEvent;
import org.openbravo.client.kernel.event.EntityNewEvent;
import org.openbravo.client.kernel.event.EntityPersistenceEventObserver;
import org.openbravo.client.kernel.event.EntityUpdateEvent;
import org.openbravo.erpCommon.businessUtility.CancelAndReplaceUtils;
import org.openbravo.model.financialmgmt.payment.FIN_Payment;

public class FINPaymentEventHandler extends EntityPersistenceEventObserver {
  private static Entity[] entities = { ModelProvider.getInstance().getEntity(
      FIN_Payment.ENTITY_NAME) };
  protected Logger logger = Logger.getLogger(this.getClass());

  @Override
  protected Entity[] getObservedEntities() {
    return entities;
  }

  public void onUpdate(@Observes EntityUpdateEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
    FIN_Payment payment = (FIN_Payment) event.getTargetInstance();
    int index = payment.getDocumentNo().indexOf(CancelAndReplaceUtils.REVERSE_PREFIX);
    if (payment.getAmount().compareTo(BigDecimal.ZERO) == 0) {
      if (index == -1) {
        final Entity paymentEntity = ModelProvider.getInstance().getEntity(FIN_Payment.ENTITY_NAME);
        final Property paymentDocumentNoProperty = paymentEntity
            .getProperty(FIN_Payment.PROPERTY_DOCUMENTNO);
        event.setCurrentState(paymentDocumentNoProperty, payment.getDocumentNo()
            + CancelAndReplaceUtils.REVERSE_PREFIX);
      }
    } else {
      if (index > 0) {
        final Entity paymentEntity = ModelProvider.getInstance().getEntity(FIN_Payment.ENTITY_NAME);
        final Property paymentDocumentNoProperty = paymentEntity
            .getProperty(FIN_Payment.PROPERTY_DOCUMENTNO);
        event.setCurrentState(paymentDocumentNoProperty, payment.getDocumentNo()
            .substring(0, index));
      }
    }
  }

  public void onSave(@Observes EntityNewEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
    FIN_Payment payment = (FIN_Payment) event.getTargetInstance();
    if (payment.getAmount().compareTo(BigDecimal.ZERO) == 0) {
      final Entity paymentEntity = ModelProvider.getInstance().getEntity(FIN_Payment.ENTITY_NAME);
      final Property paymentDocumentNoProperty = paymentEntity
          .getProperty(FIN_Payment.PROPERTY_DOCUMENTNO);
      event.setCurrentState(paymentDocumentNoProperty, payment.getDocumentNo()
          + CancelAndReplaceUtils.REVERSE_PREFIX);
    }
  }

  public void onDelete(@Observes EntityDeleteEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
  }
}