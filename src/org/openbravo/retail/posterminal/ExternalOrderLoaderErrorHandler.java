/*
 ************************************************************************************
 * Copyright (C) 2015-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */
package org.openbravo.retail.posterminal;

import javax.enterprise.context.ApplicationScoped;

import org.codehaus.jettison.json.JSONObject;
import org.openbravo.client.kernel.ComponentProvider.Qualifier;
import org.openbravo.service.db.DbUtility;

/**
 */
@ApplicationScoped
@Qualifier(ExternalOrderLoader.APP_NAME)
public class ExternalOrderLoaderErrorHandler extends POSDataSynchronizationErrorHandler {

  @Override
  public void handleError(Throwable t, String typeOfData, JSONObject result,
      JSONObject jsonRecord) {
    if (ExternalOrderLoader.isSynchronizedRequest()) {
      ExternalOrderLoader.setCurrentException(DbUtility.getUnderlyingSQLException(t));
      return;
    }
    super.handleError(t, typeOfData, result, jsonRecord);
  }

  @Override
  public boolean setImportEntryStatusToError() {
    return true;
  }

}
