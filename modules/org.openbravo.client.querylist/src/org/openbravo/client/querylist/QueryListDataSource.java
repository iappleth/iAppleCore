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
package org.openbravo.client.querylist;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.hibernate.Query;
import org.openbravo.client.application.ParameterValue;
import org.openbravo.client.myob.WidgetClass;
import org.openbravo.client.myob.WidgetInstance;
import org.openbravo.client.querylist.QueryListUtils.IncludeIn;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.service.datasource.ReadOnlyDataSourceService;

/**
 * Reads the tabs which the user is allowed to see.
 * 
 * @author gorkaion
 */
public class QueryListDataSource extends ReadOnlyDataSourceService {

  /**
   * Returns the count of objects based on the passed parameters.
   * 
   * @param parameters
   *          the parameters passed in from the request
   * @return the total number of objects
   */
  protected int getCount(Map<String, String> parameters) {
    return getData(parameters, 0, Integer.MAX_VALUE).size();
  }

  /*
   * (non-Javadoc)
   * 
   * @see org.openbravo.service.datasource.ReadOnlyDataSourceService#getData(java.util.Map, int,
   * int)
   */
  protected List<Map<String, Object>> getData(Map<String, String> parameters, int startRow,
      int endRow) {
    OBContext.setAdminMode();
    try {
      // WidgetInstance widgetInstance = OBDal.getInstance().get(WidgetInstance.class,
      // parameters.get("widgetId"));
      WidgetClass widgetClass = OBDal.getInstance().get(WidgetClass.class,
          "D1E4261099AE4095B2F2DAEE0F7E7784");
      WidgetInstance widgetInstance = widgetClass.getOBKMOWidgetInstanceList().get(0);
      IncludeIn includeIn = QueryListUtils.IncludeIn.WidgetView;
      List<OBCQL_QueryColumn> columns = QueryListUtils.getColumns(widgetClass
          .getOBCQLWidgetQueryList().get(0), includeIn);
      Query widgetQuery = OBDal.getInstance().getSession()
          .createQuery(widgetClass.getOBCQLWidgetQueryList().get(0).getHQL());
      String[] queryAliases = widgetQuery.getReturnAliases();
      if (startRow > 0) {
        widgetQuery.setFirstResult(startRow);
      }
      if (endRow > startRow) {
        widgetQuery.setFetchSize(endRow - startRow + 1);
      }
      String[] params = widgetQuery.getNamedParameters();
      if (params.length > 0) {
        List<ParameterValue> parameterValues = widgetInstance
            .getOBUIAPPParameterValueEMObkmoWidgetInstanceIDList();

        for (int i = 0; i < params.length; i++) {
          String namedParam = params[i];
          boolean isParamSet = false;
          for (ParameterValue paramValue : parameterValues) {
            if (namedParam.equals(paramValue.getParameter().getDBColumnName())) {
              widgetQuery.setParameter(namedParam, paramValue.getValueString());
              isParamSet = true;
            }
          }
          if (!isParamSet) {
            // TODO: throw an exception
          }

        }
      }

      final List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();
      for (Object objResult : widgetQuery.list()) {
        final Map<String, Object> data = new HashMap<String, Object>();

        Object[] resultList = new Object[1];
        if (objResult instanceof Object[])
          resultList = (Object[]) objResult;
        else
          resultList[0] = objResult;

        for (OBCQL_QueryColumn column : columns) {
          // TODO: throw an exception if the display exception doesn't match any returned alias.
          for (int i = 0; i < queryAliases.length; i++) {
            if (column.getDisplayExpression().equals(queryAliases[i])) {
              data.put(column.getName(), resultList[i]);
            }
          }
        }
        result.add(data);
      }
      return result;
    } finally {
      OBContext.restorePreviousMode();
    }
  }
}
