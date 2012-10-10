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
 * All portions are Copyright (C) 2012 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.client.application.event;

import java.math.BigInteger;
import java.util.HashMap;
import java.util.List;

import javax.enterprise.event.Observes;

import org.apache.log4j.Logger;
import org.hibernate.criterion.Order;
import org.hibernate.criterion.Restrictions;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.client.kernel.event.EntityNewEvent;
import org.openbravo.client.kernel.event.EntityPersistenceEventObserver;
import org.openbravo.client.kernel.event.EntityUpdateEvent;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.ad.utility.Tree;
import org.openbravo.model.ad.utility.TreeNode;
import org.openbravo.model.financialmgmt.accounting.coa.Element;
import org.openbravo.model.financialmgmt.accounting.coa.ElementValue;

public class ElementValueEventHandler extends EntityPersistenceEventObserver {

  private static Entity[] entities = { ModelProvider.getInstance().getEntity(
      ElementValue.ENTITY_NAME) };
  protected Logger logger = Logger.getLogger(this.getClass());

  @Override
  protected Entity[] getObservedEntities() {
    return entities;
  }

  public void onSave(@Observes EntityNewEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
    final ElementValue account = (ElementValue) event.getTargetInstance();
    // If value is not a number account will be folded in the root directory of the tree. So do
    // nothing, DB trigger will manage
    try {
      new BigInteger(account.getSearchKey());
    } catch (NumberFormatException e) {
      return;
    }
    doIt(account);
  }

  public void onUpdate(@Observes EntityUpdateEvent event) {
    if (!isValidEvent(event)) {
      return;
    }
    final ElementValue account = (ElementValue) event.getTargetInstance();
    doIt(account);
  }

  private void doIt(ElementValue account) {
    boolean isNumber = true;
    try {
      new BigInteger(account.getSearchKey());
    } catch (NumberFormatException e) {
      isNumber = false;
    }
    String rootNode = "0";
    OBCriteria<TreeNode> obc = OBDal.getInstance().createCriteria(TreeNode.class);
    obc.add(Restrictions.eq(TreeNode.PROPERTY_NODE, account.getId()));
    obc.setMaxResults(1);
    List<TreeNode> nodes = obc.list();
    HashMap<String, String> result = getParentAndSeqNo(account);
    String parent_ID = result.get("ParentID");
    String seqNo = result.get("SeqNo");
    if (nodes.size() > 0) {
      TreeNode node = nodes.get(0);
      node.setReportSet(!isNumber ? rootNode : parent_ID);
      node.setSequenceNumber(new Long(seqNo));
      OBDal.getInstance().save(node);
    } else {
      TreeNode treeElement = OBProvider.getInstance().get(TreeNode.class);
      treeElement.setNode(account.getId());
      treeElement.setTree(account.getAccountingElement().getTree());
      treeElement.setReportSet(!isNumber ? rootNode : parent_ID);
      // System.out.println("ElementValueEventHandler - node_id=" + account.getId() +
      // " - parent_id="
      // + treeElement.getReportSet() + " - Tree_id=" + treeElement.getTree().getId());
      treeElement.setSequenceNumber(new Long(seqNo));
      OBDal.getInstance().save(treeElement);
    }

  }

  HashMap<String, String> getParentAndSeqNo(ElementValue account) {
    HashMap<String, String> result = new HashMap<String, String>();
    // Default values for result
    result.put("ParentID", "0");
    result
        .put("SeqNo", String.valueOf(getNextSeqNo(account.getAccountingElement().getTree(), "0")));
    List<ElementValue> accounts = getAccountList(account.getAccountingElement());
    ElementValue previousElement = null;
    if (!accounts.contains(account)) {
      accounts.remove(account);
    }
    for (int i = 0; i < accounts.size(); i++) {
      if (accounts.get(i).getSearchKey().replace('(', ' ').trim().replace(')', ' ').trim()
          .compareTo(account.getSearchKey()) < 0) {
        if (i > 0) {
          previousElement = accounts.get(i);
        }
      }
    }
    if (previousElement != null && previousElement.isSummaryLevel() && !account.isSummaryLevel()) {
      result.put("ParentID", previousElement.getId());
      result.put("SeqNo", "0");
    } else if (previousElement == null) {
      return result;
    } else {
      OBCriteria<TreeNode> obc = OBDal.getInstance().createCriteria(TreeNode.class);
      obc.add(Restrictions.eq(TreeNode.PROPERTY_NODE, previousElement.getId()));
      obc.setMaxResults(1);
      List<TreeNode> nodes = obc.list();
      result.put("ParentID", nodes.get(0).getReportSet());
      result.put("SeqNo", String.valueOf(nodes.get(0).getSequenceNumber() + 10));
    }
    updateSeqNo(result.get("ParentID"), account.getAccountingElement().getTree(),
        result.get("SeqNo"));
    return result;

  }

  List<ElementValue> getAccountList(Element accountElement) {
    OBCriteria<ElementValue> obc = OBDal.getInstance().createCriteria(ElementValue.class);
    obc.add(Restrictions.eq(ElementValue.PROPERTY_ACCOUNTINGELEMENT, accountElement));
    obc.add(Restrictions.eq(ElementValue.PROPERTY_ACTIVE, true));
    obc.addOrder(Order.asc(ElementValue.PROPERTY_SEARCHKEY));
    obc.setFilterOnReadableClients(false);
    obc.setFilterOnReadableOrganization(false);
    return obc.list();
  }

  void updateSeqNo(String parentID, Tree tree, String seqNo) {
    OBCriteria<TreeNode> obc = OBDal.getInstance().createCriteria(TreeNode.class);
    obc.add(Restrictions.eq(TreeNode.PROPERTY_TREE, tree));
    obc.add(Restrictions.eq(TreeNode.PROPERTY_REPORTSET, parentID));
    obc.add(Restrictions.ge(TreeNode.PROPERTY_SEQUENCENUMBER, new Long(seqNo)));
    obc.setFilterOnReadableClients(false);
    obc.setFilterOnReadableOrganization(false);
    for (TreeNode node : obc.list()) {
      node.setSequenceNumber(node.getSequenceNumber() + 10l);
      OBDal.getInstance().save(node);
    }
    return;
  }

  long getNextSeqNo(Tree tree, String parent_ID) {
    OBCriteria<TreeNode> obc = OBDal.getInstance().createCriteria(TreeNode.class);
    obc.add(Restrictions.eq(TreeNode.PROPERTY_REPORTSET, parent_ID));
    obc.add(Restrictions.eq(TreeNode.PROPERTY_TREE, tree));
    obc.addOrder(Order.desc(TreeNode.PROPERTY_SEQUENCENUMBER));
    obc.setFilterOnReadableClients(false);
    obc.setFilterOnReadableOrganization(false);
    List<TreeNode> nodes = obc.list();
    if (nodes.size() > 0) {
      return obc.list().get(0).getSequenceNumber() + 10l;
    } else {
      return 10l;
    }
  }

}
