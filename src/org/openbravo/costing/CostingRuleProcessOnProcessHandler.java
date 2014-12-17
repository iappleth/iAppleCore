/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.0  (the  "License"),  being   the  Mozilla   Public  License
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
 *************************************************************************
 */
package org.openbravo.costing;

import java.text.ParseException;
import java.util.Date;
import java.util.Map;
import java.util.Set;

import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.Query;
import org.hibernate.Session;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.client.kernel.BaseActionHandler;
import org.openbravo.client.kernel.RequestContext;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.security.OrganizationStructureProvider;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.erpCommon.utility.OBDateUtils;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.common.plm.Product;
import org.openbravo.model.financialmgmt.calendar.Period;
import org.openbravo.model.financialmgmt.calendar.PeriodControl;
import org.openbravo.model.materialmgmt.cost.CostingRule;
import org.openbravo.model.materialmgmt.transaction.MaterialTransaction;
import org.openbravo.service.db.DalConnectionProvider;
import org.openbravo.service.db.DbUtility;

public class CostingRuleProcessOnProcessHandler extends BaseActionHandler {
  private static final Logger log4j = Logger.getLogger(CostingRuleProcessOnProcessHandler.class);

  @Override
  protected JSONObject execute(Map<String, Object> parameters, String content) {
    JSONObject jsonResponse = new JSONObject();
    JSONObject msg = new JSONObject();
    final VariablesSecureApp vars = RequestContext.get().getVariablesSecureApp();
    try {
      OBContext.setAdminMode(true);
      JSONObject jsonRequest = new JSONObject(content);
      final String ruleId = jsonRequest.getString("ruleId");
      CostingRule rule = OBDal.getInstance().get(CostingRule.class, ruleId);
      OrganizationStructureProvider osp = OBContext.getOBContext()
          .getOrganizationStructureProvider(rule.getClient().getId());
      final Set<String> childOrgs = osp.getChildTree(rule.getOrganization().getId(), true);
      final Set<String> naturalOrgs = osp.getNaturalTree(rule.getOrganization().getId());

      String message = null;
      // Checks
      CostingRule prevCostingRule = getPreviousRule(rule);
      boolean existsPreviousRule = prevCostingRule != null;
      boolean existsTransactions = existsTransactions(naturalOrgs, childOrgs);
      if (!existsPreviousRule && existsTransactions) {
        if (!rule.getOrganization().getOrganizationType().isLegalEntity()
            && rule.getStartingDate() == null) {
          message = Utility.parseTranslation(new DalConnectionProvider(false), vars,
              vars.getLanguage(), "@CostingRuleStartingDateNullNoPeriodClosed@");
        } else if (rule.getOrganization().getOrganizationType().isLegalEntity()) {
          Date movementDateInClosedPeriod = checkTransactionsWithMovDateInClosedPeriod(naturalOrgs,
              childOrgs, rule);
          if (movementDateInClosedPeriod != null) {
            message = Utility.parseTranslation(new DalConnectionProvider(false), vars,
                vars.getLanguage(), "@CostNotCalculatedForTrxWithMovDateInPeriodClosed@");
          } else if (movementDateInClosedPeriod == null && rule.getStartingDate() == null) {
            message = Utility.parseTranslation(new DalConnectionProvider(false), vars,
                vars.getLanguage(), "@CostingRuleStartingDateNullNoPeriodClosed@");
          }
        }
      }
      msg.put("severity", "success");
      msg.put("title", "Success");
      msg.put("text", message);
      jsonResponse.put("message", msg);
    } catch (Exception e) {
      OBDal.getInstance().rollbackAndClose();
      Throwable ex = DbUtility.getUnderlyingSQLException(e);
      String message = OBMessageUtils.translateError(ex.getMessage()).getMessage();
      log4j.error(message, e);
      try {
        msg = new JSONObject();
        msg.put("severity", "error");
        msg.put("text", message);
        msg.put("title", OBMessageUtils.messageBD("Error"));
        jsonResponse.put("message", msg);
      } catch (Exception ignore) {
      }
    } finally {
      OBContext.restorePreviousMode();
    }
    return jsonResponse;
  }

  private Date checkTransactionsWithMovDateInClosedPeriod(Set<String> naturalOrgs,
      Set<String> childOrgs, CostingRule rule) {
    StringBuilder hql = new StringBuilder();
    final Session session = OBDal.getInstance().getSession();
    hql.append(" select min(trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE + ")");
    hql.append(" from " + MaterialTransaction.ENTITY_NAME + " as trx");
    hql.append(" join trx." + MaterialTransaction.PROPERTY_PRODUCT + " as p");
    hql.append("\n where trx." + MaterialTransaction.PROPERTY_ISCOSTCALCULATED + " = false");
    hql.append("   and p." + Product.PROPERTY_PRODUCTTYPE + " = 'I'");
    hql.append("   and p." + Product.PROPERTY_STOCKED + " = true");
    hql.append("  and p." + Product.PROPERTY_ORGANIZATION + ".id in (:porgs)");
    hql.append("   and trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE + " >= :startingDate");
    hql.append("   and trx." + MaterialTransaction.PROPERTY_ORGANIZATION + ".id in (:childOrgs)");
    hql.append("   and exists");
    hql.append("     (select 1 from " + PeriodControl.ENTITY_NAME + " pc");
    hql.append("       inner join  pc." + PeriodControl.PROPERTY_PERIOD + " p");
    hql.append("       where " + PeriodControl.PROPERTY_PERIODSTATUS + " <>'O'");
    hql.append("       and p." + Period.PROPERTY_CLIENT + "= :client");
    hql.append("       and pc." + PeriodControl.PROPERTY_ORGANIZATION + "= :org");
    hql.append("       and to_date(trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE
        + ") >= p.startingDate");
    hql.append("       and to_date(trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE
        + ") < p.endingDate + 1)");

    final Query query = session.createQuery(hql.toString());

    query.setParameterList("porgs", naturalOrgs);
    query.setParameter("startingDate", CostingUtils.getCostingRuleStartingDate(rule));
    query.setParameterList("childOrgs", childOrgs);
    query.setParameter("client", rule.getClient());
    query.setParameter("org", rule.getOrganization());

    Date movementDateInPeriodClosed = null;
    try {
      movementDateInPeriodClosed = (Date) query.uniqueResult();
      if (movementDateInPeriodClosed != null) {
        movementDateInPeriodClosed = OBDateUtils.getDate(OBDateUtils
            .formatDate(movementDateInPeriodClosed));
      }
    } catch (ParseException e) {
      log4j.error("Error executing process", e);
    }

    return movementDateInPeriodClosed;
  }

  private CostingRule getPreviousRule(CostingRule rule) {
    StringBuffer where = new StringBuffer();
    where.append(" as cr");
    where.append(" where cr." + CostingRule.PROPERTY_ORGANIZATION + " = :ruleOrg");
    where.append("   and cr." + CostingRule.PROPERTY_VALIDATED + " = true");
    where.append("   order by cr." + CostingRule.PROPERTY_STARTINGDATE + " desc");

    OBQuery<CostingRule> crQry = OBDal.getInstance().createQuery(CostingRule.class,
        where.toString());
    crQry.setFilterOnReadableOrganization(false);
    crQry.setNamedParameter("ruleOrg", rule.getOrganization());
    crQry.setMaxResult(1);
    return (CostingRule) crQry.uniqueResult();
  }

  private boolean existsTransactions(Set<String> naturalOrgs, Set<String> childOrgs) {
    StringBuffer where = new StringBuffer();
    where.append(" as p");
    where.append(" where p." + Product.PROPERTY_PRODUCTTYPE + " = 'I'");
    where.append("   and p." + Product.PROPERTY_STOCKED + " = true");
    where.append("   and p." + Product.PROPERTY_ORGANIZATION + ".id in (:porgs)");
    where.append("   and exists (select 1 from " + MaterialTransaction.ENTITY_NAME);
    where.append("     where " + MaterialTransaction.PROPERTY_PRODUCT + " = p");
    where
        .append("      and " + MaterialTransaction.PROPERTY_ORGANIZATION + " .id in (:childOrgs))");

    OBQuery<Product> pQry = OBDal.getInstance().createQuery(Product.class, where.toString());
    pQry.setFilterOnReadableOrganization(false);
    pQry.setNamedParameter("porgs", naturalOrgs);
    pQry.setNamedParameter("childOrgs", childOrgs);
    return pQry.count() > 0;
  }
}
