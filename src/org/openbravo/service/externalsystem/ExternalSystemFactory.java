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
package org.openbravo.service.externalsystem;

import java.util.Optional;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.inject.Any;
import javax.enterprise.inject.Instance;
import javax.inject.Inject;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.openbravo.dal.service.OBDal;

/**
 * Retrieves {@ExternalSystem} instances used to communicate with different external systems
 */
@ApplicationScoped
public class ExternalSystemFactory {
  private static final Logger log = LogManager.getLogger();

  @Inject
  @Any
  private Instance<ExternalSystem> externalSystems;

  /**
   * Retrieves an {@link ExternalSystem} instance configured with the provided configuration
   * 
   * @param configurationId
   *          The ID of the configuration of the external system
   * @return an Optional with the external system instance or an empty Optional in case it is not
   *         possible to create it for example due to a configuration problem
   */
  public Optional<ExternalSystem> getExternalSystem(String configurationId) {
    ExternalSystemData configuration = OBDal.getInstance()
        .get(ExternalSystemData.class, configurationId);
    return getExternalSystem(configuration);
  }

  /**
   * Retrieves an {@link ExternalSystem} instance configured with the provided configuration
   * 
   * @param configuration
   *          The configuration of the external system
   * @return an Optional with the external system instance or an empty Optional in case it is not
   *         possible to create it for example due to a configuration problem
   */
  public Optional<ExternalSystem> getExternalSystem(ExternalSystemData configuration) {
    String protocol = configuration.getProtocol();
    return externalSystems.select(new ProtocolSelector(protocol))
        .stream()
        .findFirst()
        .map(externalSystem -> {
          try {
            externalSystem.configure(configuration);
            return externalSystem;
          } catch (Exception ex) {
            log.error("Could not configure an external system with configuration {}",
                configuration.getId(), ex);
            return null;
          }
        });
  }
}
