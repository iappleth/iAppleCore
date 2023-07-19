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
 * All portions are Copyright (C) 2023 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.authentication.oauth2;

import javax.enterprise.event.Observes;
import javax.inject.Inject;

import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.client.kernel.event.EntityDeleteEvent;
import org.openbravo.client.kernel.event.EntityNewEvent;
import org.openbravo.client.kernel.event.EntityPersistenceEventObserver;
import org.openbravo.client.kernel.event.EntityUpdateEvent;
import org.openbravo.model.authentication.LoginProvider;

/**
 * Used to invalidate the cache of configurations kept by {@link OAuth2SignInProvider} when changes
 * regarding an authentication provider configuration are detected. Note that in case of working in
 * a clustered environment, this mechanism will only invalidate the cache in the node were the
 * changes occurred. For the rest of the nodes in the cluster it will be necessary to wait for the
 * expiration of the cache entry.
 *
 * @see OAuth2SignInProvider#invalidateCache()
 */
class LoginProviderEventHandler extends EntityPersistenceEventObserver {
  private static final Entity[] ENTITIES = {
      ModelProvider.getInstance().getEntity(LoginProvider.ENTITY_NAME) };

  @Inject
  private OAuth2SignInProvider oauth2SignInProvider;

  @Override
  protected Entity[] getObservedEntities() {
    return ENTITIES;
  }

  public void onDelete(@Observes EntityDeleteEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
    invalidateOAuth2ConfigurationCache((LoginProvider) event.getTargetInstance());
  }

  public void onSave(@Observes EntityNewEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
    invalidateOAuth2ConfigurationCache((LoginProvider) event.getTargetInstance());
  }

  public void onUpdate(@Observes EntityUpdateEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
    invalidateOAuth2ConfigurationCache((LoginProvider) event.getTargetInstance());
  }

  private void invalidateOAuth2ConfigurationCache(LoginProvider loginProvider) {
    if ("OAUTH2".equals(loginProvider.getType())) {
      oauth2SignInProvider.invalidateCache();
    }
  }
}
