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
 * All portions are Copyright (C) 2010 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.client.myob;

import java.util.List;

import org.hibernate.criterion.Expression;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.util.OBClassLoader;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.ad.access.Role;
import org.openbravo.model.ad.access.User;
import org.openbravo.model.ad.system.Client;
import org.openbravo.model.common.enterprise.Organization;

/**
 * Util class for MyOB.
 * 
 * @author mtaal
 */
abstract public class MyOBUtils {

  /**
   * Calls {@link #getWidgetTitle(WidgetClass)} using the
   * 
   * {@link WidgetInstance#getWidgetClass()}
   * 
   * @param widgetInstance
   * @return the (translated) title
   */
  static String getWidgetTitle(WidgetInstance widgetInstance) {
    return getWidgetTitle(widgetInstance.getWidgetClass());
  }

  /**
   * Computes the widget title using the user's language, if no translation is available then the
   * {@link WidgetClass#getWidgetTitle()} is used.
   * 
   * @param widgetInstance
   *          the widget class of this instance is used to read the title
   * @return the title of the widget read from the widgetclass
   * @see WidgetInstance#getOBKMOWidgetClass()
   * @see WidgetClassTrl
   * @see WidgetClass#getTitle()
   */
  static String getWidgetTitle(WidgetClass widgetClass) {
    final String userLanguageId = OBContext.getOBContext().getLanguage().getId();

    for (WidgetClassTrl widgetClassTrl : widgetClass.getOBKMOWidgetClassTrlList()) {
      final String trlLanguageId = (String) DalUtil.getId(widgetClassTrl.getLanguage());
      if (trlLanguageId.equals(userLanguageId)) {
        return widgetClassTrl.getTitle();
      }
    }
    return widgetClass.getWidgetTitle();
  }

  /**
   * Creates the widgetProvider from the widgetClass object. Also calls/sets the
   * {@link WidgetProvider#setWidgetClass(WidgetClass)}.
   * 
   * @param widgetClass
   * @return instance of a {@link WidgetProvider}
   */
  static WidgetProvider getWidgetProvider(WidgetClass widgetClass) {
    try {
      String strJavaClass = (widgetClass.getWidgetSuperclass() != null) ? widgetClass
          .getWidgetSuperclass().getJavaClass() : widgetClass.getJavaClass();
      final Class<?> clz = OBClassLoader.getInstance().loadClass(strJavaClass);
      final WidgetProvider widgetProvider = (WidgetProvider) clz.newInstance();
      widgetProvider.setWidgetClass(widgetClass);
      return widgetProvider;
    } catch (Exception e) {
      throw new OBException(e);
    }
  }

  static List<WidgetInstance> getDefaultWidgetInstances(String availableAtLevel,
      String[] availableAtValues) {
    OBCriteria<WidgetInstance> widgetInstancesCrit = OBDal.getInstance().createCriteria(
        WidgetInstance.class);
    widgetInstancesCrit.add(Expression.isNull(WidgetInstance.PROPERTY_VISIBLEATUSER));
    if ("OB".equals(availableAtLevel)) {
      widgetInstancesCrit.setFilterOnReadableClients(false);
      widgetInstancesCrit.add(Expression.eq(WidgetInstance.PROPERTY_RELATIVEPRIORITY, 0L));
      widgetInstancesCrit.add(Expression.eq(WidgetInstance.PROPERTY_CLIENT, OBDal.getInstance()
          .get(Client.class, "0")));
      widgetInstancesCrit.setFilterOnReadableOrganization(false);
      widgetInstancesCrit.add(Expression.eq(WidgetInstance.PROPERTY_ORGANIZATION, OBDal
          .getInstance().get(Organization.class, "0")));
    } else if ("SYSTEM".equals(availableAtLevel)) {
      widgetInstancesCrit.setFilterOnReadableClients(false);
      widgetInstancesCrit.add(Expression.eq(WidgetInstance.PROPERTY_RELATIVEPRIORITY, 1L));
      widgetInstancesCrit.add(Expression.eq(WidgetInstance.PROPERTY_CLIENT, OBDal.getInstance()
          .get(Client.class, "0")));
      widgetInstancesCrit.setFilterOnReadableOrganization(false);
      widgetInstancesCrit.add(Expression.eq(WidgetInstance.PROPERTY_ORGANIZATION, OBDal
          .getInstance().get(Organization.class, "0")));
    } else if ("CLIENT".equals(availableAtLevel)) {
      widgetInstancesCrit.setFilterOnReadableClients(false);
      widgetInstancesCrit.add(Expression.eq(WidgetInstance.PROPERTY_CLIENT, OBDal.getInstance()
          .get(Client.class, availableAtValues[0])));
      widgetInstancesCrit.add(Expression.eq(WidgetInstance.PROPERTY_RELATIVEPRIORITY, 2L));
    } else if ("ORG".equals(availableAtLevel)) {
      final Organization organization = OBDal.getInstance().get(Organization.class,
          availableAtValues[0]);
      widgetInstancesCrit.setFilterOnReadableClients(false);
      widgetInstancesCrit.add(Expression.eq(WidgetInstance.PROPERTY_CLIENT, organization
          .getClient()));
      widgetInstancesCrit.setFilterOnReadableOrganization(false);
      widgetInstancesCrit.add(Expression.eq(WidgetInstance.PROPERTY_ORGANIZATION, organization));
      widgetInstancesCrit.add(Expression.eq(WidgetInstance.PROPERTY_RELATIVEPRIORITY, 3L));
    } else if ("ROLE".equals(availableAtLevel)) {
      final Role role = OBDal.getInstance().get(Role.class, availableAtValues[0]);
      widgetInstancesCrit.setFilterOnReadableClients(false);
      widgetInstancesCrit.add(Expression.eq(WidgetInstance.PROPERTY_CLIENT, role.getClient()));
      widgetInstancesCrit.setFilterOnReadableOrganization(false);
      widgetInstancesCrit.add(Expression.eq(WidgetInstance.PROPERTY_ORGANIZATION, OBDal
          .getInstance().get(Organization.class, "0")));
      widgetInstancesCrit.add(Expression.eq(WidgetInstance.PROPERTY_VISIBLEATROLE, role));
      widgetInstancesCrit.add(Expression.eq(WidgetInstance.PROPERTY_RELATIVEPRIORITY, 4L));
    } else if ("USER".equals(availableAtLevel)) {
      // not supported
    }
    return widgetInstancesCrit.list();
  }

  static List<WidgetInstance> getUserWidgetInstances() {
    OBCriteria<WidgetInstance> obc = OBDal.getInstance().createCriteria(WidgetInstance.class);
    obc.setFilterOnReadableClients(false);
    obc.add(Expression.eq(WidgetInstance.PROPERTY_CLIENT, OBDal.getInstance().get(Client.class,
        OBContext.getOBContext().getCurrentClient().getId())));
    obc.setFilterOnReadableOrganization(false);
    obc.add(Expression.eq(WidgetInstance.PROPERTY_ORGANIZATION, OBDal.getInstance().get(
        Organization.class, OBContext.getOBContext().getCurrentOrganization().getId())));
    obc.add(Expression.eq(WidgetInstance.PROPERTY_VISIBLEATROLE, OBDal.getInstance().get(
        Role.class, OBContext.getOBContext().getRole().getId())));
    obc.add(Expression.eq(WidgetInstance.PROPERTY_VISIBLEATUSER, OBDal.getInstance().get(
        User.class, OBContext.getOBContext().getUser().getId())));
    return obc.list();
  }

  static WidgetClass getWidgetClassFromTitle(String strClassTitle) {
    OBCriteria<WidgetClass> widgetClassCrit = OBDal.getInstance().createCriteria(WidgetClass.class);
    widgetClassCrit.add(Expression.eq(WidgetClass.PROPERTY_WIDGETTITLE, strClassTitle));
    if (widgetClassCrit.list().size() == 0) {
      return null;
    }
    return widgetClassCrit.list().get(0);
  }

}
