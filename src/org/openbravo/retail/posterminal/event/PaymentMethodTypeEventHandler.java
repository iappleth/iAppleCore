/*
 ************************************************************************************
 * Copyright (C) 2015 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

package org.openbravo.retail.posterminal.event;

import javax.enterprise.event.Observes;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.client.kernel.event.EntityDeleteEvent;
import org.openbravo.client.kernel.event.EntityNewEvent;
import org.openbravo.client.kernel.event.EntityPersistenceEventObserver;
import org.openbravo.client.kernel.event.EntityUpdateEvent;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.retail.posterminal.OBPOSPaymentMethodCashup;
import org.openbravo.retail.posterminal.TerminalTypePaymentMethod;
import org.openbravo.service.db.DalConnectionProvider;

/**
 * @author guillermogil
 * 
 */

public class PaymentMethodTypeEventHandler extends EntityPersistenceEventObserver {
  private static Entity[] entities = {
      ModelProvider.getInstance().getEntity(TerminalTypePaymentMethod.ENTITY_NAME) };
  protected Logger logger = LogManager.getLogger();

  @Override
  protected Entity[] getObservedEntities() {
    return entities;
  }

  public void onUpdate(@Observes EntityUpdateEvent event) {
    if (!isValidEvent(event)) {
      return;
    }

    validateActiveOrRemovePaymentMethod((TerminalTypePaymentMethod) event.getTargetInstance(),
        false);

    Boolean leaveascredit = (Boolean) event.getTargetInstance().get("leaveascredit");
    Entity appPaymentTypeEntity = ModelProvider.getInstance()
        .getEntity(TerminalTypePaymentMethod.ENTITY_NAME);
    if (leaveascredit) {
      event.setCurrentState(appPaymentTypeEntity.getProperty("allowdrops"), false);
      event.setCurrentState(appPaymentTypeEntity.getProperty("allowdeposits"), false);
      event.setCurrentState(appPaymentTypeEntity.getProperty("allowvariableamount"), false);
      event.setCurrentState(appPaymentTypeEntity.getProperty("allowdontmove"), false);
      event.setCurrentState(appPaymentTypeEntity.getProperty("allowmoveeverything"), false);
      event.setCurrentState(appPaymentTypeEntity.getProperty("automatemovementtoother"), false);
      event.setCurrentState(appPaymentTypeEntity.getProperty("keepfixedamount"), false);
      event.setCurrentState(appPaymentTypeEntity.getProperty("cashDifferences"), null);
      event.setCurrentState(appPaymentTypeEntity.getProperty("glitemDropdep"), null);
    } else {
      Boolean countPaymentInCashUp = (Boolean) event
          .getCurrentState(appPaymentTypeEntity.getProperty("countpaymentincashup"));
      if (event.getCurrentState(appPaymentTypeEntity.getProperty("cashDifferences")) == null
          && countPaymentInCashUp) {
        throw new OBException(Utility.messageBD(new DalConnectionProvider(false),
            "OBPOS_CashDiffLeaveCredit", OBContext.getOBContext().getLanguage().getLanguage()));
      }
    }

  }

  public void onSave(@Observes EntityNewEvent event) {
    if (!isValidEvent(event)) {
      return;
    }

    Boolean leaveascredit = (Boolean) event.getTargetInstance().get("leaveascredit");
    Entity appPaymentTypeEntity = ModelProvider.getInstance()
        .getEntity(TerminalTypePaymentMethod.ENTITY_NAME);
    if (leaveascredit) {
      event.setCurrentState(appPaymentTypeEntity.getProperty("allowdrops"), false);
      event.setCurrentState(appPaymentTypeEntity.getProperty("allowdeposits"), false);
      event.setCurrentState(appPaymentTypeEntity.getProperty("allowvariableamount"), false);
      event.setCurrentState(appPaymentTypeEntity.getProperty("allowdontmove"), false);
      event.setCurrentState(appPaymentTypeEntity.getProperty("allowmoveeverything"), false);
      event.setCurrentState(appPaymentTypeEntity.getProperty("automatemovementtoother"), false);
      event.setCurrentState(appPaymentTypeEntity.getProperty("keepfixedamount"), false);
      event.setCurrentState(appPaymentTypeEntity.getProperty("cashDifferences"), null);
      event.setCurrentState(appPaymentTypeEntity.getProperty("glitemDropdep"), null);
    } else {
      Boolean countPaymentInCashUp = (Boolean) event
          .getCurrentState(appPaymentTypeEntity.getProperty("countpaymentincashup"));
      if (event.getCurrentState(appPaymentTypeEntity.getProperty("cashDifferences")) == null
          && countPaymentInCashUp) {
        throw new OBException(Utility.messageBD(new DalConnectionProvider(false),
            "OBPOS_CashDiffLeaveCredit", OBContext.getOBContext().getLanguage().getLanguage()));
      }
    }

  }

  public void onDelete(@Observes EntityDeleteEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
    validateActiveOrRemovePaymentMethod((TerminalTypePaymentMethod) event.getTargetInstance(),
        true);
  }

  private void validateActiveOrRemovePaymentMethod(TerminalTypePaymentMethod paymentMethod,
      boolean removePayment) {
    if (!paymentMethod.isActive() || removePayment) {
      String whereclause = " as e join e.cashUp as cashup "
          + "where cashup.isProcessed is false and e.paymentType.active is true "
          + "and e.paymentType.paymentMethod=:paymentMethod ";
      OBQuery<OBPOSPaymentMethodCashup> queryCashupPayment = OBDal.getInstance()
          .createQuery(OBPOSPaymentMethodCashup.class, whereclause);
      queryCashupPayment.setMaxResult(1);
      queryCashupPayment.setNamedParameter("paymentMethod", paymentMethod);
      if (queryCashupPayment.count() > 0) {
        throw new OBException(Utility.messageBD(new DalConnectionProvider(false),
            (removePayment == true) ? "OBPOS_PaymentMethodRemove" : "OBPOS_PaymentMethodDeactive",
            OBContext.getOBContext().getLanguage().getLanguage()));
      }
    }
  }
}
