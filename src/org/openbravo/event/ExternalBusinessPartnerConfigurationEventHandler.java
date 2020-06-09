/*
 ************************************************************************************
 * Copyright (C) 2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

package org.openbravo.event;

import javax.enterprise.event.Observes;

import org.openbravo.base.exception.OBException;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.client.kernel.event.EntityNewEvent;
import org.openbravo.client.kernel.event.EntityPersistenceEvent;
import org.openbravo.client.kernel.event.EntityPersistenceEventObserver;
import org.openbravo.client.kernel.event.EntityUpdateEvent;
import org.openbravo.model.ad.system.ClientInformation;
import org.openbravo.model.externalbpartner.ExternalBusinessPartnerConfigFilter;
import org.openbravo.model.externalbpartner.ExternalBusinessPartnerConfigProperty;

/**
 * Removes the associated value when the correspondent Y/N field is not checked
 */
public class ExternalBusinessPartnerConfigurationEventHandler
    extends EntityPersistenceEventObserver {
  private static final Entity[] ENTITIES = {
      ModelProvider.getInstance().getEntity(ExternalBusinessPartnerConfigProperty.ENTITY_NAME),
      ModelProvider.getInstance().getEntity(ExternalBusinessPartnerConfigFilter.ENTITY_NAME),
      ModelProvider.getInstance().getEntity(ClientInformation.ENTITY_NAME) };

  private static final String[][] CHECK_IN_PROPERTY = {
      { ExternalBusinessPartnerConfigProperty.PROPERTY_USEDASRECORDIDENTIFIER,
          ExternalBusinessPartnerConfigProperty.PROPERTY_IDENTIFIERSEQUENCENUMBER },
      { ExternalBusinessPartnerConfigProperty.PROPERTY_DISPLAYINDETAIL,
          ExternalBusinessPartnerConfigProperty.PROPERTY_DETAILSEQUENCENUMBER },
      { ExternalBusinessPartnerConfigProperty.PROPERTY_DISPLAYINLIST,
          ExternalBusinessPartnerConfigProperty.PROPERTY_LISTSEQUENCENUMBER },
      { ExternalBusinessPartnerConfigProperty.PROPERTY_KEYCOLUMN,
          ExternalBusinessPartnerConfigProperty.PROPERTY_KEYSEQUENCENUMBER },
      { ExternalBusinessPartnerConfigProperty.PROPERTY_CATEGORYKEY,
          ExternalBusinessPartnerConfigProperty.PROPERTY_CATEGORYKEYSEQUENCENUMBER } };

  private static final String[][] CHECK_IN_FILTER = {
      { ExternalBusinessPartnerConfigFilter.PROPERTY_ISADVANCEDFILTER,
          ExternalBusinessPartnerConfigFilter.PROPERTY_ADVANCEDFILTERSEQNO } };

  private static final String[][] CHECK_IN_CLIENTINFO = {
      { ClientInformation.PROPERTY_EXTBPENABLED, ClientInformation.PROPERTY_EXTBPCONFIG } };

  @Override
  protected Entity[] getObservedEntities() {
    return ENTITIES;
  }

  public void onSave(@Observes EntityNewEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
    removeSequenceIfNotSelected(event);
  }

  public void onUpdate(@Observes EntityUpdateEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
    removeSequenceIfNotSelected(event);
  }

  private void removeSequenceIfNotSelected(final EntityPersistenceEvent event) {
    final BaseOBObject targetInstance = event.getTargetInstance();
    if (targetInstance instanceof ExternalBusinessPartnerConfigProperty) {
      clearFieldAssociatedToFlag(event, targetInstance, CHECK_IN_PROPERTY);
    } else if (targetInstance instanceof ExternalBusinessPartnerConfigFilter) {
      clearFieldAssociatedToFlag(event, targetInstance, CHECK_IN_FILTER);
    } else if (targetInstance instanceof ClientInformation) {
      clearFieldAssociatedToFlag(event, targetInstance, CHECK_IN_CLIENTINFO);
    } else {
      throw new OBException("The targetInstance type is not supported", true);
    }
  }

  private void clearFieldAssociatedToFlag(final EntityPersistenceEvent event,
      final BaseOBObject targetInstance, final String[][] propertiesToCheck) {
    final Entity entity = targetInstance.getEntity();
    for (final String[] booleanPropertyWithSeqnoProperty : propertiesToCheck) {
      if (!(boolean) event
          .getCurrentState(entity.getProperty(booleanPropertyWithSeqnoProperty[0]))) {
        event.setCurrentState(entity.getProperty(booleanPropertyWithSeqnoProperty[1]), null);
      }
    }
  }
}
