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
 * All portions are Copyright (C) 2021-2022 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.event;

import javax.enterprise.event.Observes;

import org.hibernate.criterion.Restrictions;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.model.Property;
import org.openbravo.client.kernel.event.EntityNewEvent;
import org.openbravo.client.kernel.event.EntityPersistenceEvent;
import org.openbravo.client.kernel.event.EntityPersistenceEventObserver;
import org.openbravo.client.kernel.event.EntityUpdateEvent;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.model.externalbpartner.ExternalBusinessPartnerConfig;
import org.openbravo.model.externalbpartner.ExternalBusinessPartnerConfigLocation;
import org.openbravo.model.externalbpartner.ExternalBusinessPartnerConfigProperty;

/**
 * Checks the validity of the saved/updated external business partner configuration property
 */
public class ExternalBusinessPartnerConfigPropertyEventHandler
    extends EntityPersistenceEventObserver {
  private static final Entity[] ENTITIES = {
      ModelProvider.getInstance().getEntity(ExternalBusinessPartnerConfigProperty.ENTITY_NAME) };
  private static final String MULTI_INTEGRATION_TYPE = "MI";

  @Override
  protected Entity[] getObservedEntities() {
    return ENTITIES;
  }

  public void onSave(@Observes EntityNewEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
    checkDefaultEmailDuplicates(event);
    checkDefaultPhoneDuplicates(event);
    checkDefaultAddressDuplicates(event);
  }

  public void onUpdate(@Observes EntityUpdateEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
    checkDefaultEmailDuplicates(event);
    checkDefaultPhoneDuplicates(event);
    checkDefaultAddressDuplicates(event);
    checkMandatoryRemovalIfMultiIntegration(event);
  }

  private void checkDefaultEmailDuplicates(EntityPersistenceEvent event) {
    final String id = event.getId();
    final ExternalBusinessPartnerConfigProperty property = (ExternalBusinessPartnerConfigProperty) event
        .getTargetInstance();
    final ExternalBusinessPartnerConfig currentExtBPConfig = property
        .getExternalBusinessPartnerIntegrationConfiguration();

    if (!property.isDefaultemail() || !property.isActive()) {
      return;
    }

    final OBCriteria<?> criteria = OBDal.getInstance()
        .createCriteria(event.getTargetInstance().getClass());
    criteria.add(Restrictions.eq(
        ExternalBusinessPartnerConfigProperty.PROPERTY_EXTERNALBUSINESSPARTNERINTEGRATIONCONFIGURATION,
        currentExtBPConfig));
    criteria
        .add(Restrictions.eq(ExternalBusinessPartnerConfigProperty.PROPERTY_ISDEFAULTEMAIL, true));
    criteria.add(Restrictions.eq(ExternalBusinessPartnerConfigProperty.PROPERTY_ACTIVE, true));
    criteria.add(Restrictions.ne(ExternalBusinessPartnerConfigProperty.PROPERTY_ID, id));

    criteria.setMaxResults(1);
    if (criteria.uniqueResult() != null) {
      throw new OBException("@DuplicatedCRMDefaultEmail@");
    }
  }

  private void checkDefaultPhoneDuplicates(EntityPersistenceEvent event) {
    final String id = event.getId();
    final ExternalBusinessPartnerConfigProperty property = (ExternalBusinessPartnerConfigProperty) event
        .getTargetInstance();
    final ExternalBusinessPartnerConfig currentExtBPConfig = property
        .getExternalBusinessPartnerIntegrationConfiguration();

    if (!property.isDefaultphone() || !property.isActive()) {
      return;
    }

    final OBCriteria<?> criteria = OBDal.getInstance()
        .createCriteria(event.getTargetInstance().getClass());
    criteria.add(Restrictions.eq(
        ExternalBusinessPartnerConfigProperty.PROPERTY_EXTERNALBUSINESSPARTNERINTEGRATIONCONFIGURATION,
        currentExtBPConfig));
    criteria
        .add(Restrictions.eq(ExternalBusinessPartnerConfigProperty.PROPERTY_ISDEFAULTPHONE, true));
    criteria.add(Restrictions.eq(ExternalBusinessPartnerConfigProperty.PROPERTY_ACTIVE, true));
    criteria.add(Restrictions.ne(ExternalBusinessPartnerConfigProperty.PROPERTY_ID, id));

    criteria.setMaxResults(1);
    if (criteria.uniqueResult() != null) {
      throw new OBException("@DuplicatedCRMDefaultPhone@");
    }
  }

  private void checkDefaultAddressDuplicates(EntityPersistenceEvent event) {
    final String id = event.getId();
    final ExternalBusinessPartnerConfigProperty property = (ExternalBusinessPartnerConfigProperty) event
        .getTargetInstance();
    final ExternalBusinessPartnerConfig currentExtBPConfig = property
        .getExternalBusinessPartnerIntegrationConfiguration();

    if (!property.isDefaultAddress() || !property.isActive()) {
      return;
    }

    final OBCriteria<?> criteria = OBDal.getInstance()
        .createCriteria(event.getTargetInstance().getClass());
    criteria.add(Restrictions.eq(
        ExternalBusinessPartnerConfigProperty.PROPERTY_EXTERNALBUSINESSPARTNERINTEGRATIONCONFIGURATION,
        currentExtBPConfig));
    criteria.add(
        Restrictions.eq(ExternalBusinessPartnerConfigProperty.PROPERTY_ISDEFAULTADDRESS, true));
    criteria.add(Restrictions.eq(ExternalBusinessPartnerConfigProperty.PROPERTY_ACTIVE, true));
    criteria.add(Restrictions.ne(ExternalBusinessPartnerConfigProperty.PROPERTY_ID, id));

    criteria.setMaxResults(1);
    if (criteria.uniqueResult() != null) {
      throw new OBException(OBMessageUtils.messageBD("@DuplicatedCRMDefaultAddress@"));
    }
  }

  private void checkMandatoryRemovalIfMultiIntegration(EntityUpdateEvent event) {
    final ExternalBusinessPartnerConfigProperty externalBusinessPartnerConfigProperty = (ExternalBusinessPartnerConfigProperty) event
        .getTargetInstance();
    final Property mandatoryProperty = ENTITIES[0]
        .getProperty(ExternalBusinessPartnerConfigProperty.PROPERTY_MANDATORY);
    final ExternalBusinessPartnerConfig externalBusinessPartnerConfiguration = externalBusinessPartnerConfigProperty
        .getExternalBusinessPartnerIntegrationConfiguration();
    if (((Boolean) event.getPreviousState(mandatoryProperty))
        && !((Boolean) event.getCurrentState(mandatoryProperty)) && MULTI_INTEGRATION_TYPE
            .equals(externalBusinessPartnerConfiguration.getTypeOfIntegration())) {
      // Query to check if the property being managed exists in address mapping
      //@formatter:off
      String hql = " cRMConnectorConfiguration.id = :crmConfigurationId "
                 + " and ("
                 + "         addressLine1.id = :propertyId "
                 + "      or addressLine2.id = :propertyId "
                 + "      or cityName.id = :propertyId "
                 + "      or postalCode.id = :propertyId "
                 + "      or country.id = :propertyId "
                 + "      or region.id = :propertyId"
                 + "     )";
      //@formatter:on

      OBQuery<ExternalBusinessPartnerConfigLocation> hqlCriteria = OBDal.getInstance()
          .createQuery(ExternalBusinessPartnerConfigLocation.class, hql)
          .setNamedParameter("crmConfigurationId", externalBusinessPartnerConfiguration.getId())
          .setNamedParameter("propertyId", externalBusinessPartnerConfigProperty.getId());
      hqlCriteria.setMaxResult(1);
      if (hqlCriteria.uniqueResult() != null) {
        throw new OBException(OBMessageUtils.messageBD("UnnasignExtBPAddressPropertyMandatory"));
      }
    }
  }
}
