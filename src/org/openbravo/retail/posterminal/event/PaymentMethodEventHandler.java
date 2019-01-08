/*
 ************************************************************************************
 * Copyright (C) 2015 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

package org.openbravo.retail.posterminal.event;

import java.util.List;

import javax.enterprise.event.Observes;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.hibernate.criterion.Restrictions;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.model.Property;
import org.openbravo.client.kernel.event.EntityDeleteEvent;
import org.openbravo.client.kernel.event.EntityNewEvent;
import org.openbravo.client.kernel.event.EntityPersistenceEventObserver;
import org.openbravo.client.kernel.event.EntityUpdateEvent;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.financialmgmt.payment.FIN_FinancialAccount;
import org.openbravo.retail.posterminal.OBPOSAppCashup;
import org.openbravo.retail.posterminal.OBPOSAppPayment;
import org.openbravo.retail.posterminal.TerminalTypePaymentMethod;
import org.openbravo.service.db.DalConnectionProvider;

/**
 * @author guillermogil
 * 
 */

public class PaymentMethodEventHandler extends EntityPersistenceEventObserver {
  private static Entity[] entities = { ModelProvider.getInstance().getEntity(
      OBPOSAppPayment.ENTITY_NAME) };
  protected Logger logger = LogManager.getLogger();

  @Override
  protected Entity[] getObservedEntities() {
    return entities;
  }

  public void onUpdate(@Observes EntityUpdateEvent event) {
    if (!isValidEvent(event)) {
      return;
    }

    validateActivePayment((OBPOSAppPayment) event.getTargetInstance());

    FIN_FinancialAccount financialAccount = (FIN_FinancialAccount) event.getTargetInstance().get(
        "financialAccount");
    TerminalTypePaymentMethod paymentMethod = (TerminalTypePaymentMethod) event.getTargetInstance()
        .get("paymentMethod");
    Boolean leaveascredit = paymentMethod.isLeaveascredit();
    if (leaveascredit && financialAccount != null) {
      final Entity appPaymentEntity = ModelProvider.getInstance().getEntity(
          OBPOSAppPayment.ENTITY_NAME);
      final Property financialAccountProperty = appPaymentEntity.getProperty("financialAccount");
      event.setCurrentState(financialAccountProperty, null);
    } else if (!leaveascredit && financialAccount == null) {
      throw new OBException(Utility.messageBD(new DalConnectionProvider(false),
          "OBPOS_FinAccLeaveCredit", OBContext.getOBContext().getLanguage().getLanguage()));
    }

  }

  public void onSave(@Observes EntityNewEvent event) {
    if (!isValidEvent(event)) {
      return;
    }

    FIN_FinancialAccount financialAccount = (FIN_FinancialAccount) event.getTargetInstance().get(
        "financialAccount");
    TerminalTypePaymentMethod paymentMethod = (TerminalTypePaymentMethod) event.getTargetInstance()
        .get("paymentMethod");
    Boolean leaveascredit = paymentMethod.isLeaveascredit();
    if (leaveascredit && financialAccount != null) {
      final Entity appPaymentEntity = ModelProvider.getInstance().getEntity(
          OBPOSAppPayment.ENTITY_NAME);
      final Property financialAccountProperty = appPaymentEntity.getProperty("financialAccount");
      event.setCurrentState(financialAccountProperty, null);
    } else if (!leaveascredit && financialAccount == null) {
      throw new OBException(Utility.messageBD(new DalConnectionProvider(false),
          "OBPOS_FinAccLeaveCredit", OBContext.getOBContext().getLanguage().getLanguage()));
    }

  }

  public void onDelete(@Observes EntityDeleteEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
    validateActiveOrRemovePayment((OBPOSAppPayment) event.getTargetInstance(), true);
  }

  private void validateActivePayment(OBPOSAppPayment paymentTerminal) {
    validateActiveOrRemovePayment(paymentTerminal, false);
  }

  private void validateActiveOrRemovePayment(OBPOSAppPayment paymentTerminal, boolean removePayment) {
    if (!paymentTerminal.isActive() || removePayment) {
      OBCriteria<OBPOSAppCashup> obCriteria = OBDal.getInstance().createCriteria(
          OBPOSAppCashup.class);
      obCriteria.add(Restrictions.eq(OBPOSAppCashup.PROPERTY_POSTERMINAL + ".id", paymentTerminal
          .getObposApplications().getId()));
      obCriteria.add(Restrictions.eq(OBPOSAppCashup.PROPERTY_ISPROCESSED, false));
      List<OBPOSAppCashup> cashUp = obCriteria.list();
      if (cashUp.size() > 0) {
        throw new OBException(Utility.messageBD(new DalConnectionProvider(false),
            (removePayment == true) ? "OBPOS_PaymentRemove" : "OBPOS_PaymentDeactive", OBContext
                .getOBContext().getLanguage().getLanguage()));
      }
    }
  }

}