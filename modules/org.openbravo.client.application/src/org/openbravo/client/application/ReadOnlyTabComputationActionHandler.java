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
 * All portions are Copyright (C) 2011 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.client.application;

import java.util.Map;

import javax.enterprise.context.ApplicationScoped;

import org.codehaus.jettison.json.JSONObject;
import org.openbravo.base.exception.OBException;
import org.openbravo.client.kernel.BaseActionHandler;
import org.openbravo.client.kernel.StaticResourceComponent;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.ad.ui.Tab;
import org.openbravo.model.ad.ui.Window;
import org.openbravo.service.db.DalConnectionProvider;

/**
 * Computes which tabs are readonly and which are not readonly.
 * 
 * @author mtaal
 * @see StaticResourceComponent
 */
@ApplicationScoped
public class ReadOnlyTabComputationActionHandler extends BaseActionHandler {

  protected JSONObject execute(Map<String, Object> parameters, String data) {

    try {
      OBContext.setAdminMode();
      final String windowId = (String) parameters.get("windowId");
      final Window window = OBDal.getInstance().get(Window.class, windowId);
      final JSONObject json = new JSONObject();
      final String roleId = OBContext.getOBContext().getRole().getId();
      final DalConnectionProvider dalConnectionProvider = new DalConnectionProvider();
      for (Tab tab : window.getADTabList()) {
        final boolean readOnlyAccess = org.openbravo.erpCommon.utility.WindowAccessData
            .hasReadOnlyAccess(dalConnectionProvider, roleId, tab.getId());
        json.put(tab.getId(), readOnlyAccess || tab.getUIPattern().equals("RO"));
      }
      return json;
    } catch (Exception e) {
      throw new OBException(e);
    } finally {
      OBContext.restorePreviousMode();
    }
  }
}
