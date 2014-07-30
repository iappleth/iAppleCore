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
 * All portions are Copyright (C) 2014 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.advpaymentmngt.actionHandler;

import java.util.List;
import java.util.Map;

import org.codehaus.jettison.json.JSONObject;
import org.hibernate.criterion.Restrictions;
import org.openbravo.client.application.Parameter;
import org.openbravo.client.kernel.BaseActionHandler;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.model.ad.system.Language;
import org.openbravo.model.ad.ui.ElementTrl;
import org.openbravo.service.db.DbUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class AddPaymentReloadLabelsActionHandler extends BaseActionHandler {
  private static Logger log = LoggerFactory.getLogger(AddPaymentReloadLabelsActionHandler.class);

  @Override
  protected JSONObject execute(Map<String, Object> parameters, String data) {
    JSONObject result = new JSONObject();
    JSONObject values = new JSONObject();
    JSONObject errorMessage = new JSONObject();
    OBContext.setAdminMode(true);
    try {
      final String strBusinessPartner = (String) parameters.get("businessPartner");
      final String strFinancialAccount = (String) parameters.get("financialAccount");
      final String strIssotrx = (String) parameters.get("issotrx");
      boolean issotrx = "true".equals(strIssotrx) ? true : false;
      final Parameter businessPartner = OBDal.getInstance()
          .get(Parameter.class, strBusinessPartner);
      final Parameter financialAccount = OBDal.getInstance().get(Parameter.class,
          strFinancialAccount);
      final Language language = OBContext.getOBContext().getLanguage();

      final OBCriteria<ElementTrl> obcBP = OBDal.getInstance().createCriteria(ElementTrl.class);
      obcBP.add(Restrictions.eq(ElementTrl.PROPERTY_ID, businessPartner.getApplicationElement()
          .getId()));
      obcBP.add(Restrictions.eq(ElementTrl.PROPERTY_LANGUAGE, language));
      final List<ElementTrl> obcListBP = obcBP.list();
      if (obcListBP.size() > 0) {
        if (issotrx) {
          values.put("businessPartner", obcListBP.get(0).getName());
        } else {
          values.put("businessPartner", obcListBP.get(0).getPurchaseOrderName());
        }
      } else {
        if (issotrx) {
          values.put("businessPartner", businessPartner.getApplicationElement().getName());
        } else {
          values.put("businessPartner", businessPartner.getApplicationElement()
              .getPurchaseOrderName());
        }
      }

      final OBCriteria<ElementTrl> obcFA = OBDal.getInstance().createCriteria(ElementTrl.class);
      obcFA.add(Restrictions.eq(ElementTrl.PROPERTY_ID, financialAccount.getApplicationElement()
          .getId()));
      obcFA.add(Restrictions.eq(ElementTrl.PROPERTY_LANGUAGE, language));
      final List<ElementTrl> obcListFA = obcFA.list();
      if (obcListFA.size() > 0) {
        if (issotrx) {
          values.put("financialAccount", obcListFA.get(0).getName());
        } else {
          values.put("financialAccount", obcListFA.get(0).getPurchaseOrderName());
        }
      } else {
        if (issotrx) {
          values.put("financialAccount", financialAccount.getApplicationElement().getName());
        } else {
          values.put("financialAccount", financialAccount.getApplicationElement()
              .getPurchaseOrderName());
        }
      }

      String message = "Ok";
      errorMessage.put("severity", "success");
      errorMessage.put("text", message);
      result.put("values", values);
      result.put("message", errorMessage);
    } catch (Exception e) {
      OBDal.getInstance().rollbackAndClose();
      log.error(e.getMessage(), e);
      try {
        Throwable ex = DbUtility.getUnderlyingSQLException(e);
        String message = OBMessageUtils.translateError(ex.getMessage()).getMessage();
        errorMessage = new JSONObject();
        errorMessage.put("severity", "error");
        errorMessage.put("title", "Error");
        errorMessage.put("text", message);
        result.put("message", errorMessage);
      } catch (Exception e2) {
        log.error(e.getMessage(), e2);
        // do nothing, give up
      }
    } finally {
      OBContext.restorePreviousMode();
    }
    return result;
  }
}