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
 * All portions are Copyright (C) 2022 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.event;

import java.util.stream.Stream;

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
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.model.externalbpartner.ExternalBusinessPartnerConfigLocation;
import org.openbravo.model.externalbpartner.ExternalBusinessPartnerConfigProperty;

/**
 * @formatter: off
 * Ensures the following rules:
 * When using Customer and Adderss Enpoint Configuration only one Adderss Mapping is allowed
 * When Creating an Address Mapping, Country property should always be filled
 * When Using Customer and Address Endpoint Configuration, if an Address Mapping property is assigned it should always be marked as mandatory
 * @formatter:on
 */

public class ExternalBusinessPartnerAddressMappingEventHandler
    extends EntityPersistenceEventObserver {
  private static Entity[] entities = {
      ModelProvider.getInstance().getEntity(ExternalBusinessPartnerConfigLocation.ENTITY_NAME) };
  final Entity externalBPAddressEntity = ModelProvider.getInstance()
      .getEntity(ExternalBusinessPartnerConfigLocation.ENTITY_NAME);
  private static final String MULTI_INTEGRATION_TYPE = "MI";

  @Override
  protected Entity[] getObservedEntities() {
    return entities;
  }

  public void onUpdate(@Observes EntityUpdateEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
    checkSingleAddressMappingIfMultiIntegration(event);
    checkEmptyCountry(event);
    checkMandatoryPropertiesIfMultiIntegration(event);
  }

  public void onSave(@Observes EntityNewEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
    checkSingleAddressMappingIfMultiIntegration(event);
    checkEmptyCountry(event);
    checkMandatoryPropertiesIfMultiIntegration(event);
  }

  private void checkEmptyCountry(EntityPersistenceEvent event) {
    final Property externalBPAddressProperty = externalBPAddressEntity
        .getProperty(ExternalBusinessPartnerConfigLocation.PROPERTY_COUNTRY);
    final ExternalBusinessPartnerConfigProperty externalBPAddressCountry = (ExternalBusinessPartnerConfigProperty) event
        .getCurrentState(externalBPAddressProperty);
    if (externalBPAddressCountry == null) {
      throw new OBException(OBMessageUtils.messageBD("ExtBPCountryMandatory"));
    }
  }

  private void checkSingleAddressMappingIfMultiIntegration(EntityPersistenceEvent event) {
    ExternalBusinessPartnerConfigLocation extBpPartnerConfigLocation = (ExternalBusinessPartnerConfigLocation) event
        .getTargetInstance();

    if (MULTI_INTEGRATION_TYPE
        .equals(extBpPartnerConfigLocation.getCRMConnectorConfiguration().getTypeOfIntegration())) {
      final String id = event.getId();
      final OBCriteria<?> criteria = OBDal.getInstance()
          .createCriteria(ExternalBusinessPartnerConfigLocation.ENTITY_NAME);

      criteria.add(Restrictions.eq(ExternalBusinessPartnerConfigLocation.PROPERTY_ACTIVE, true));
      criteria.add(
          Restrictions.eq(ExternalBusinessPartnerConfigLocation.PROPERTY_CRMCONNECTORCONFIGURATION,
              extBpPartnerConfigLocation.getCRMConnectorConfiguration()));
      criteria.add(Restrictions.ne(ExternalBusinessPartnerConfigLocation.PROPERTY_ID, id));

      criteria.setMaxResults(1);
      if (criteria.uniqueResult() != null) {
        throw new OBException(OBMessageUtils.messageBD("@DuplicatedCRMAddressMapping@"));
      }
    }

  }

  private void checkMandatoryPropertiesIfMultiIntegration(EntityPersistenceEvent event) {
    ExternalBusinessPartnerConfigLocation extBpPartnerConfigLocation = (ExternalBusinessPartnerConfigLocation) event
        .getTargetInstance();
    if (MULTI_INTEGRATION_TYPE
        .equals(extBpPartnerConfigLocation.getCRMConnectorConfiguration().getTypeOfIntegration())) {
      Stream
          .of(ExternalBusinessPartnerConfigLocation.PROPERTY_ADDRESSLINE1,
              ExternalBusinessPartnerConfigLocation.PROPERTY_ADDRESSLINE2,
              ExternalBusinessPartnerConfigLocation.PROPERTY_CITYNAME,
              ExternalBusinessPartnerConfigLocation.PROPERTY_POSTALCODE,
              ExternalBusinessPartnerConfigLocation.PROPERTY_REGION)
          .forEach((propertyToCheck -> checkIfNonMandatoryProperty(event, propertyToCheck)));
    }

  }

  private void checkIfNonMandatoryProperty(EntityPersistenceEvent event,
      String addressPropertyName) {
    if (addressPropertyName != null) {
      final ExternalBusinessPartnerConfigProperty propertyAddress = (ExternalBusinessPartnerConfigProperty) event
          .getCurrentState(externalBPAddressEntity.getProperty(addressPropertyName));
      if (propertyAddress != null && !propertyAddress.isMandatory()) {
        throw new OBException(OBMessageUtils.messageBD("ExtBPAddressPropertyMandatory"));
      }
    }
  }

}
