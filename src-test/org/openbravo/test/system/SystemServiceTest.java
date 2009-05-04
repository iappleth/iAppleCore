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
 * All portions are Copyright (C) 2009 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.test.system;

import java.util.Date;
import java.util.List;

import org.openbravo.dal.service.OBDal;
import org.openbravo.model.ad.datamodel.Column;
import org.openbravo.model.ad.datamodel.Table;
import org.openbravo.model.ad.domain.Reference;
import org.openbravo.model.ad.utility.DataSet;
import org.openbravo.service.dataset.DataSetService;
import org.openbravo.service.system.SystemService;
import org.openbravo.test.base.BaseTest;

/**
 * Test the {@link SystemService} class.
 * 
 * @author mtaal
 */

public class SystemServiceTest extends BaseTest {

  /**
   * Test the {@link DataSetService#hasChanged(DataSet, Date)} method.
   */
  public void testChangedDataSet() {
    setUserContext("0");
    final List<DataSet> dss = OBDal.getInstance().createCriteria(DataSet.class).list();
    final Date now = new Date(System.currentTimeMillis());
    for (DataSet ds : dss) {
      assertFalse(DataSetService.getInstance().hasChanged(ds, now));
    }

    // 600 days in the past
    final long oneDay = 1000 * 60 * 60 * 24;
    final long manyDays = (long) 600 * oneDay;
    final Date past = new Date(System.currentTimeMillis() - manyDays);
    for (DataSet ds : dss) {
      if (!DataSetService.getInstance().hasData(ds)) {
        continue;
      }
      assertTrue(DataSetService.getInstance().hasChanged(ds, past));
    }
  }

  /**
   * Tests the {@link SystemService#hasChanged(Class[], Date)} method which is used to check if an
   * object in a specific table have changed since a specific time.
   */
  public void testChangedClasses() {
    setUserContext("0");
    final Class<?>[] clzs = new Class<?>[] { Table.class, Column.class, Reference.class };

    final Date now = new Date(System.currentTimeMillis());
    assertFalse(SystemService.getInstance().hasChanged(clzs, now));

    // 600 days in the past
    final Date past = new Date(System.currentTimeMillis() - (1000 * 60 * 60 * 24 * 600));
    assertTrue(SystemService.getInstance().hasChanged(clzs, past));
  }
}