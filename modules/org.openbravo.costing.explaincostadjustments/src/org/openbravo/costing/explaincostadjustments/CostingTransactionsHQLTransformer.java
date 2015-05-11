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
 * All portions are Copyright (C) 2015 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 *************************************************************************
 */

package org.openbravo.costing.explaincostadjustments;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.hibernate.Query;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.client.kernel.ComponentProvider;
import org.openbravo.costing.CostAdjustmentUtils;
import org.openbravo.costing.CostingAlgorithm.CostDimension;
import org.openbravo.costing.CostingUtils;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.security.OrganizationStructureProvider;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.common.enterprise.Locator;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.materialmgmt.cost.Costing;
import org.openbravo.model.materialmgmt.cost.CostingRule;
import org.openbravo.model.materialmgmt.transaction.MaterialTransaction;
import org.openbravo.service.datasource.hql.HqlQueryTransformer;

@ComponentProvider.Qualifier("DFF0A9F7C26C457FA8735A09ACFD5971")
public class CostingTransactionsHQLTransformer extends HqlQueryTransformer {

  public static final String propADListPriority = org.openbravo.model.ad.domain.List.PROPERTY_SEQUENCENUMBER;
  public static final String propADListReference = org.openbravo.model.ad.domain.List.PROPERTY_REFERENCE;
  public static final String propADListValue = org.openbravo.model.ad.domain.List.PROPERTY_SEARCHKEY;
  public static final String MovementTypeRefID = "189";
  private static final String ORDERBY = " ORDER BY ";
  private static Set<String> orgs = null;
  HashMap<CostDimension, BaseOBObject> costDimensions = null;

  @Override
  public String transformHqlQuery(String hqlQuery, Map<String, String> requestParameters,
      Map<String, Object> queryNamedParameters) {
    // Sets the named parameters

    final String costingId = requestParameters.get("@MaterialMgmtCosting.id@");
    String strJustCount = requestParameters.get("_justCount");
    boolean justCount = strJustCount.equalsIgnoreCase("true");

    String transformedHqlQuery = null;

    if (costingId != null && !costingId.equals("null")) {

      Costing costing = OBDal.getInstance().get(Costing.class, costingId);
      MaterialTransaction transaction = costing.getInventoryTransaction();

      if (transaction != null) {
        OrganizationStructureProvider osp = OBContext.getOBContext()
            .getOrganizationStructureProvider(transaction.getClient().getId());

        Organization org = OBContext.getOBContext()
            .getOrganizationStructureProvider(transaction.getClient().getId())
            .getLegalEntity(transaction.getOrganization());

        costDimensions = CostingUtils.getEmptyDimensions();

        CostingRule costingRule = CostingUtils.getCostDimensionRule(org,
            transaction.getTransactionProcessDate());

        if (costing.getProduct().isProduction()) {
          orgs = osp.getChildTree("0", false);
        } else {
          orgs = osp.getChildTree(costing.getOrganization().getId(), true);
          if (costingRule.isWarehouseDimension()) {
            costDimensions.put(CostDimension.Warehouse, transaction.getStorageBin().getWarehouse());
          }
        }

        StringBuffer whereClause = getWhereClause(costing, queryNamedParameters);
        transformedHqlQuery = hqlQuery.replace("@whereClause@", whereClause.toString());

        Costing prevCosting = getPreviousCosting(transaction);
        String costOnQuery = addCostOnQuery(prevCosting);
        transformedHqlQuery = transformedHqlQuery.replace("@previousCostingCost@", costOnQuery);

        StringBuffer cumQty = addCumQty(costing, queryNamedParameters);
        transformedHqlQuery = transformedHqlQuery.replace("@cumQty@", cumQty.toString());

        StringBuffer cumCost = addCumCost(cumQty, costing, prevCosting);
        transformedHqlQuery = transformedHqlQuery.replace("@cumCost@", cumCost);

        transformedHqlQuery = appendOrderByClause(transformedHqlQuery, justCount);
        return transformedHqlQuery;
      }
    }

    transformedHqlQuery = hqlQuery.replace("@whereClause@", " 1 = 2 ");
    transformedHqlQuery = transformedHqlQuery.replace("@previousCostingCost@", "0");
    transformedHqlQuery = transformedHqlQuery.replace("@cumQty@", "0");
    transformedHqlQuery = transformedHqlQuery.replace("@cumCost@", "0");
    return transformedHqlQuery;
  }

  private StringBuffer getWhereClause(Costing costing, Map<String, Object> queryNamedParameters) {

    StringBuffer whereClause = new StringBuffer();
    MaterialTransaction transaction = costing.getInventoryTransaction();
    Costing prevCosting = getPreviousCosting(transaction);

    whereClause.append(" trx." + MaterialTransaction.PROPERTY_PRODUCT + ".id = c."
        + MaterialTransaction.PROPERTY_PRODUCT + ".id ");
    whereClause.append(" and trxtype." + propADListReference + ".id = :refid");
    whereClause.append(" and trxtype." + propADListValue + " = trx."
        + MaterialTransaction.PROPERTY_MOVEMENTTYPE);
    whereClause.append(" and c.id = :costingId ");
    whereClause.append(" and trx." + MaterialTransaction.PROPERTY_ISCOSTCALCULATED + " = true");
    whereClause.append(" and ((( ");
    whereClause.append("   trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE + " < trxcosting."
        + MaterialTransaction.PROPERTY_MOVEMENTDATE);
    whereClause.append("   or (");
    whereClause.append("     trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE + " = trxcosting."
        + MaterialTransaction.PROPERTY_MOVEMENTDATE);
    whereClause.append("     and ( ");
    whereClause.append("       trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE
        + " < trxcosting." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE);
    whereClause.append("       or (");
    whereClause.append("         trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE
        + " = trxcosting." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE);
    whereClause.append("         and ( ");
    whereClause.append("         trxtype." + propADListPriority + " < :trxtypeprio");
    whereClause.append("           or (");
    whereClause.append("             trxtype." + propADListPriority + " = :trxtypeprio");
    whereClause.append("             and ( ");
    whereClause.append("               trx." + MaterialTransaction.PROPERTY_MOVEMENTQUANTITY
        + " > :trxqty");
    whereClause.append("                 or (");
    whereClause.append("                   trx." + MaterialTransaction.PROPERTY_MOVEMENTQUANTITY
        + " = :trxqty");
    whereClause.append("                   and trx." + MaterialTransaction.PROPERTY_ID
        + " <> :trxid");
    whereClause.append(" )))))))) ");

    if (prevCosting != null) {

      whereClause.append(" and ( ");
      whereClause.append("   trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE
          + " > :prevCostMovementDate");
      whereClause.append("   or (");
      whereClause.append("     trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE
          + " = :prevCostMovementDate");
      whereClause.append("     and ( ");
      whereClause.append("       trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE
          + " > :prevCostTrxProcessDate");
      whereClause.append("       or (");
      whereClause.append("         trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE
          + " = :prevCostTrxProcessDate");
      whereClause.append("         and ( ");
      whereClause.append("           trxtype." + propADListPriority + " > :prevtrxtypeprio");
      whereClause.append("           or (");
      whereClause.append("             trxtype." + propADListPriority + " = :prevtrxtypeprio");
      whereClause.append("             and ( ");
      whereClause.append("               trx." + MaterialTransaction.PROPERTY_MOVEMENTQUANTITY
          + " < :prevtrxqty");
      whereClause.append("               or (");
      whereClause.append("                 trx." + MaterialTransaction.PROPERTY_MOVEMENTQUANTITY
          + " = :prevtrxqty");
      whereClause.append("                 and trx." + MaterialTransaction.PROPERTY_ID
          + " <> :prevtrxid");
      whereClause.append(" )))))))) ");

    }
    whereClause.append(" ) ");
    whereClause.append(" or (trx." + MaterialTransaction.PROPERTY_ID + " = :trxid) ");
    if (prevCosting != null) {
      whereClause.append(" or (trx." + MaterialTransaction.PROPERTY_ID + " = :prevtrxid) ");
    }
    whereClause.append(" ) ");

    whereClause.append(" and trx." + MaterialTransaction.PROPERTY_ORGANIZATION + ".id in (:orgs) ");
    whereClause.append(" and trx." + MaterialTransaction.PROPERTY_CLIENT + ".id = :clientId ");
    if (costDimensions.get(CostDimension.Warehouse) != null) {
      whereClause.append(" and locator." + Locator.PROPERTY_WAREHOUSE + ".id = :warehouse ");
    }

    queryNamedParameters.put("refid", MovementTypeRefID);
    queryNamedParameters.put("costingId", costing.getId());
    queryNamedParameters.put("orgs", orgs);
    queryNamedParameters.put("clientId", costing.getClient().getId());
    queryNamedParameters.put("trxtypeprio",
        CostAdjustmentUtils.getTrxTypePrio(transaction.getMovementType()));
    queryNamedParameters.put("trxqty", transaction.getMovementQuantity());
    queryNamedParameters.put("trxid", transaction.getId());
    if (prevCosting != null) {
      MaterialTransaction prevCostingTrx = prevCosting.getInventoryTransaction();
      queryNamedParameters.put("prevCostMovementDate", prevCostingTrx.getMovementDate());
      queryNamedParameters
          .put("prevCostTrxProcessDate", prevCostingTrx.getTransactionProcessDate());
      queryNamedParameters.put("prevtrxtypeprio",
          CostAdjustmentUtils.getTrxTypePrio(prevCostingTrx.getMovementType()));
      queryNamedParameters.put("prevtrxqty", prevCostingTrx.getMovementQuantity());
      queryNamedParameters.put("prevtrxid", prevCostingTrx.getId());
    }
    if (costDimensions.get(CostDimension.Warehouse) != null) {
      queryNamedParameters.put("warehouse", costDimensions.get(CostDimension.Warehouse).getId());
    }
    return whereClause;
  }

  private String addCostOnQuery(Costing prevCosting) {

    if (prevCosting != null) {
      return prevCosting.getCost().toString();
    }
    return "0";
  }

  private StringBuffer addCumQty(Costing costing, Map<String, Object> queryNamedParameters) {

    OrganizationStructureProvider osp = OBContext.getOBContext().getOrganizationStructureProvider(
        costing.getInventoryTransaction().getClient().getId());
    orgs = osp.getChildTree(costing.getOrganization().getId(), true);
    if (costing.getProduct().isProduction()) {
      orgs = osp.getChildTree("0", false);
      costDimensions = CostingUtils.getEmptyDimensions();
    }

    StringBuffer select = new StringBuffer();
    select.append(" (select sum(trxCost." + MaterialTransaction.PROPERTY_MOVEMENTQUANTITY + ")");
    select.append("\n from " + MaterialTransaction.ENTITY_NAME + " as trxCost");
    select.append("\n join trxCost." + MaterialTransaction.PROPERTY_STORAGEBIN + " as locator");
    select.append("\n , " + org.openbravo.model.ad.domain.List.ENTITY_NAME + " as trxtypeCost");
    select.append("\n where trxtypeCost." + propADListReference + ".id = :refid");
    select.append("  and trxtypeCost." + propADListValue + " = trxCost."
        + MaterialTransaction.PROPERTY_MOVEMENTTYPE);
    select.append("   and trxCost." + MaterialTransaction.PROPERTY_PRODUCT + ".id = :productId");
    // Include only transactions that have its cost calculated. Should be all.
    select.append("   and trxCost." + MaterialTransaction.PROPERTY_ISCOSTCALCULATED + " = true");

    select.append("  and ( ");
    select.append("   trxCost." + MaterialTransaction.PROPERTY_MOVEMENTDATE + " < trx."
        + MaterialTransaction.PROPERTY_MOVEMENTDATE);
    select.append("   or (");
    select.append("    trxCost." + MaterialTransaction.PROPERTY_MOVEMENTDATE + " = trx."
        + MaterialTransaction.PROPERTY_MOVEMENTDATE);
    // If there are more than one trx on the same trx process date filter out those types with
    // less
    // priority and / or higher quantity.
    select.append("    and (");
    select.append("     trxCost." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE + " < trx."
        + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE);
    select.append("     or (");
    select.append("      trxCost." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE
        + " = trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE);
    select.append("      and (");
    select.append("       trxtypeCost." + propADListPriority + " < trxtype." + propADListPriority);
    select.append("       or (");
    select.append("          trxtypeCost." + propADListPriority + " = trxtype."
        + propADListPriority);
    select.append("        and ( trxCost." + MaterialTransaction.PROPERTY_MOVEMENTQUANTITY
        + " > trx." + MaterialTransaction.PROPERTY_MOVEMENTQUANTITY);
    select.append("        or (");
    select.append("         trxCost." + MaterialTransaction.PROPERTY_MOVEMENTQUANTITY + " = trx."
        + MaterialTransaction.PROPERTY_MOVEMENTQUANTITY);
    select.append("         and trxCost." + MaterialTransaction.PROPERTY_ID + " <= trx."
        + MaterialTransaction.PROPERTY_ID);
    select.append("    ))))))))");
    if (costDimensions.get(CostDimension.Warehouse) != null) {
      select.append("  and locator." + Locator.PROPERTY_WAREHOUSE + ".id = :warehouse");
    }
    select.append(" and trxCost." + MaterialTransaction.PROPERTY_ORGANIZATION + ".id in (:orgs)");
    select.append(" and trxCost." + MaterialTransaction.PROPERTY_CLIENT + ".id = :clientId )");

    queryNamedParameters.put("refid", MovementTypeRefID);
    queryNamedParameters.put("productId", costing.getProduct().getId());
    if (costDimensions.get(CostDimension.Warehouse) != null) {
      queryNamedParameters.put("warehouse", costDimensions.get(CostDimension.Warehouse).getId());
    }
    queryNamedParameters.put("orgs", orgs);
    queryNamedParameters.put("clientId", costing.getClient().getId());

    return select;
  }

  private Costing getPreviousCosting(MaterialTransaction transaction) {
    StringBuffer query = new StringBuffer();

    query.append(" select c." + Costing.PROPERTY_ID);
    query.append(" from " + Costing.ENTITY_NAME + " c ");
    query.append(" join c." + Costing.PROPERTY_INVENTORYTRANSACTION + " as trx ");
    query.append(" join trx." + MaterialTransaction.PROPERTY_STORAGEBIN + " as locator, ");
    query.append(" " + org.openbravo.model.ad.domain.List.ENTITY_NAME + " as trxtype ");
    query.append(" where trx." + MaterialTransaction.PROPERTY_PRODUCT + ".id = :productId ");
    query.append(" and trxtype." + propADListReference + ".id = :refid");
    query.append(" and trxtype." + propADListValue + " = trx."
        + MaterialTransaction.PROPERTY_MOVEMENTTYPE);
    query.append(" and trx." + MaterialTransaction.PROPERTY_ISCOSTCALCULATED + " = true");
    query.append(" and ( ");
    query.append("   trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE + " < :movementDate");
    query.append("   or (");
    query.append("     trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE + " = :movementDate");
    query.append("     and ( ");
    query.append("     trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE
        + " < :trxProcessDate");
    query.append("     or (");
    query.append("       trx." + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE
        + " = :trxProcessDate");
    query.append("       and ( ");
    query.append("         trxtype." + propADListPriority + " < :trxtypeprio");
    query.append("         or (");
    query.append("           trxtype." + propADListPriority + " = :trxtypeprio");
    query.append("           and ( ");
    query
        .append("             trx." + MaterialTransaction.PROPERTY_MOVEMENTQUANTITY + " > :trxqty");
    query.append("             or (");
    query.append("               trx." + MaterialTransaction.PROPERTY_MOVEMENTQUANTITY
        + " = :trxqty");
    query.append("               and trx." + MaterialTransaction.PROPERTY_ID + " <> :trxid");
    query.append(" )))))))) ");
    if (costDimensions.get(CostDimension.Warehouse) != null) {
      query.append(" and locator." + Locator.PROPERTY_WAREHOUSE + ".id = :warehouse ");
    }
    query.append(" and trx." + MaterialTransaction.PROPERTY_ORGANIZATION + ".id in (:orgs) ");
    query.append(" and trx." + MaterialTransaction.PROPERTY_CLIENT + ".id = :clientId ");
    query.append(" order by trx." + MaterialTransaction.PROPERTY_MOVEMENTDATE + " desc, trx."
        + MaterialTransaction.PROPERTY_TRANSACTIONPROCESSDATE + " desc");

    Query prevCostingQuery = OBDal.getInstance().getSession().createQuery(query.toString());
    prevCostingQuery.setParameter("productId", transaction.getProduct().getId());
    prevCostingQuery.setParameter("refid", MovementTypeRefID);
    prevCostingQuery.setParameter("movementDate", transaction.getMovementDate());
    prevCostingQuery.setParameter("trxProcessDate", transaction.getTransactionProcessDate());
    prevCostingQuery.setParameter("trxtypeprio",
        CostAdjustmentUtils.getTrxTypePrio(transaction.getMovementType()));
    prevCostingQuery.setParameter("trxqty", transaction.getMovementQuantity());
    prevCostingQuery.setParameter("trxid", transaction.getId());
    if (costDimensions.get(CostDimension.Warehouse) != null) {
      prevCostingQuery.setParameter("warehouse", costDimensions.get(CostDimension.Warehouse)
          .getId());
    }
    prevCostingQuery.setParameterList("orgs", orgs);
    prevCostingQuery.setParameter("clientId", transaction.getClient().getId());
    prevCostingQuery.setMaxResults(1);

    @SuppressWarnings("unchecked")
    final List<String> preCostingIdList = prevCostingQuery.list();

    Costing prevCosting = null;
    if (preCostingIdList.size() > 0) {
      prevCosting = OBDal.getInstance().get(Costing.class, preCostingIdList.get(0));
      return prevCosting;
    }
    return null;
  }

  private StringBuffer addCumCost(StringBuffer cumQty, Costing costing, Costing prevCosting) {
    StringBuffer cumCost = new StringBuffer();
    cumCost.append(" case when trxcosting.id = trx.id ");
    cumCost.append("   then (");
    cumCost.append(cumQty);
    cumCost.append(" * " + costing.getCost().toString());
    cumCost.append("   ) ");
    cumCost.append("   else ");
    if (prevCosting != null) {
      cumCost.append("   ( ");
      cumCost.append(cumQty);
      cumCost.append(" * " + prevCosting.getCost().toString());
      cumCost.append("   ) ");
    } else {
      cumCost.append(" 0 ");
    }
    cumCost.append(" end ");
    return cumCost;
  }

  protected String appendOrderByClause(String _hqlQuery, boolean justCount) {
    String hqlQuery = _hqlQuery;
    if (!justCount && hqlQuery.toUpperCase().contains(ORDERBY)) {
      StringBuffer orderByClause = new StringBuffer();
      orderByClause.append(" ORDER BY trx.movementDate, trx.transactionProcessDate");
      hqlQuery = hqlQuery.replace(hqlQuery.substring(hqlQuery.indexOf(" ORDER BY")),
          orderByClause.toString());
    }
    return hqlQuery;
  }
}