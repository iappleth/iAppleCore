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
 * The Initial Developer of the Original Code is Openbravo SL 
 * All portions are Copyright (C) 2008 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.test.model;

import org.apache.log4j.Logger;
import org.hibernate.criterion.Expression;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.common.order.Order;
import org.openbravo.model.common.order.OrderLine;
import org.openbravo.test.base.BaseTest;

/**
 * Test cases for one-to-many support: adding a child, deleting a child.
 * 
 * @author iperdomo
 */
public class OneToManyTest extends BaseTest {

  private static final Logger log = Logger.getLogger(OneToManyTest.class);

  private static String lineId;

  /**
   * Tests if it is possible to iterate over {@link OrderLine} objects of an {@link Order}. Adds one
   */
  public void testAccessChildCollection() {
    setUserContext("1000000");
    addReadWriteAccess(Order.class);
    addReadWriteAccess(OrderLine.class);
    final OBCriteria<Order> order = OBDal.getInstance().createCriteria(Order.class);
    // order.add(Expression.eq("id", "1000019"));
    for (final Order o : order.list()) {
      log.debug("Order: " + o.toString());
      for (final OrderLine l : o.getOrderLineList()) {
        log.debug("Line: " + l.toString());
      }
      log.debug("-----");
    }
  }

  /**
   * Tests adding an {@link OrderLine} to an {@link Order} without explicitly saving the order line,
   * the cascade behavior defined in the hibernate mapping should take care of that.
   */
  public void testAddOrderLine() {

    setUserContext("1000000");
    addReadWriteAccess(Order.class);
    addReadWriteAccess(OrderLine.class);
    final OBCriteria<Order> orders = OBDal.getInstance().createCriteria(Order.class);
    orders.add(Expression.eq(Order.PROPERTY_DOCUMENTSTATUS, "DR")); // Draft
    // document

    for (final Order o : orders.list()) {
      log.debug("Order: " + o.get(Order.PROPERTY_DOCUMENTNO) + " - no. lines: "
          + o.getOrderLineList().size());

      if (o.getOrderLineList().size() > 0) {
        final OrderLine l = o.getOrderLineList().get(0);
        // copy the orderline
        final OrderLine copy = (OrderLine) DalUtil.copy(l);
        copy.setId(null);
        o.getOrderLineList().add(copy);
        commitTransaction();
        lineId = copy.getId();
        break;
      }
    }
    // we did copy a line
    assertTrue(lineId != null);
  }

  /**
   * Now the order line from the previous test case is deleted.
   */
  public void testDeleteChild() {

    setUserContext("1000000");
    addReadWriteAccess(Order.class);
    addReadWriteAccess(OrderLine.class);
    final OBCriteria<Order> orders = OBDal.getInstance().createCriteria(Order.class);
    orders.add(Expression.eq(Order.PROPERTY_DOCUMENTSTATUS, "DR"));

    OrderLine toRemove = null;
    for (final Order o : orders.list()) {
      log.debug("Order: " + o.get(Order.PROPERTY_DOCUMENTNO) + " - no. lines: "
          + o.getOrderLineList().size());
      for (OrderLine ol : o.getOrderLineList()) {
        if (lineId.equals(ol.getId())) {
          toRemove = ol;
          log.debug("OrderLine to remove: " + ol.toString());
          break;
        }
      }
      if (toRemove != null) {
        o.getOrderLineList().remove(toRemove);
        break;
      }
    }
    assertTrue(toRemove != null);
  }

  /**
   * This test checks if the order line has indeed been deleted.
   */
  public void testConfirmDeleted() {
    setUserContext("1000000");
    addReadWriteAccess(Order.class);
    addReadWriteAccess(OrderLine.class);

    final OBCriteria<OrderLine> lines = OBDal.getInstance().createCriteria(OrderLine.class);
    lines.add(Expression.eq(OrderLine.PROPERTY_ID, lineId));

    assertEquals(0, lines.list().size());

  }

  // test is already done above while preventing side effects.
  // public void testAddChild() throws Exception {
  // setUserContext("1000000");
  // final OBCriteria<BusinessPartner> bpartners = OBDal.getInstance().createCriteria(
  // BusinessPartner.class);
  // bpartners.add(Expression.eq(BusinessPartner.PROPERTY_SEARCHKEY, "mafalda"));
  //
  // if (bpartners.list().size() > 0) {
  // final BusinessPartner partner = bpartners.list().get(0);
  // final User user1 = OBProvider.getInstance().get(User.class);
  // user1.setName("test");
  // user1.setEmail("email@domain.com");
  // user1.setActive(true);
  // user1.setFirstName("Firstname");
  // user1.setLastName("Lastname");
  // user1.setBusinessPartner(partner);
  // user1.setClient(partner.getClient());
  // user1.setOrganization(partner.getOrganization());
  // // adding the user1 to the users collection
  // final int count = partner.getADUserList().size();
  // partner.getADUserList().add(user1);
  // assertEquals(count + 1, partner.getADUserList().size());
  // } else
  // throw new Exception("malfalda not found in business partners list");
  // }
}
