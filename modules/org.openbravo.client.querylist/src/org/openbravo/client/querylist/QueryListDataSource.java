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
 * All portions are Copyright (C) 2010-2014 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.client.querylist;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.Query;
import org.hibernate.criterion.Restrictions;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.exception.OBSecurityException;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.model.domaintype.BigDecimalDomainType;
import org.openbravo.base.model.domaintype.BooleanDomainType;
import org.openbravo.base.model.domaintype.DateDomainType;
import org.openbravo.base.model.domaintype.DomainType;
import org.openbravo.base.model.domaintype.LongDomainType;
import org.openbravo.base.model.domaintype.PrimitiveDomainType;
import org.openbravo.client.application.Parameter;
import org.openbravo.client.application.ParameterUtils;
import org.openbravo.client.kernel.reference.EnumUIDefinition;
import org.openbravo.client.kernel.reference.ForeignKeyUIDefinition;
import org.openbravo.client.kernel.reference.NumberUIDefinition;
import org.openbravo.client.kernel.reference.UIDefinition;
import org.openbravo.client.kernel.reference.UIDefinitionController;
import org.openbravo.client.kernel.reference.YesNoUIDefinition;
import org.openbravo.client.myob.WidgetClass;
import org.openbravo.client.myob.WidgetInstance;
import org.openbravo.client.myob.WidgetReference;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.erpCommon.utility.OBMessageUtils;
import org.openbravo.model.ad.access.WindowAccess;
import org.openbravo.model.ad.datamodel.Column;
import org.openbravo.model.ad.domain.Reference;
import org.openbravo.model.ad.ui.Field;
import org.openbravo.model.ad.ui.Window;
import org.openbravo.portal.PortalAccessible;
import org.openbravo.service.datasource.DataSourceProperty;
import org.openbravo.service.datasource.ReadOnlyDataSourceService;
import org.openbravo.service.json.AdvancedQueryBuilder;
import org.openbravo.service.json.JsonConstants;
import org.openbravo.service.json.JsonUtils;

/**
 * Reads the tabs which the user is allowed to see.
 * 
 * @author gorkaion
 */
public class QueryListDataSource extends ReadOnlyDataSourceService implements PortalAccessible {
  private static final String OPTIONAL_FILTERS = "@optional_filters@";
  private static final Logger log = Logger.getLogger(QueryListDataSource.class);
  private static final String OPERATOR = "$OPERATOR";

  /**
   * Returns the count of objects based on the passed parameters.
   * 
   * @param parameters
   *          the parameters passed in from the request
   * @return the total number of objects
   */
  @Override
  protected int getCount(Map<String, String> parameters) {
    return getData(parameters, 0, -1).size();
  }

  @Override
  protected List<Map<String, Object>> getData(Map<String, String> parameters, int startRow,
      int endRow) {
    // creation of formats is done here because they are not thread safe
    final SimpleDateFormat xmlDateFormat = JsonUtils.createDateFormat();
    final SimpleDateFormat xmlDateTimeFormat = JsonUtils.createDateTimeFormat();

    OBContext.setAdminMode();
    try {
      WidgetClass widgetClass = OBDal.getInstance().get(WidgetClass.class,
          parameters.get("widgetId"));

      // Check security: continue only if the widget instance is visible for current user/role
      WidgetInstance wi = OBDal.getInstance().get(WidgetInstance.class,
          parameters.get("widgetInstanceId"));

      boolean accessibleWidgetInForm = false;
      if (wi == null) {
        accessibleWidgetInForm = isAccessibleWidgetInForm(widgetClass);
      }
      if (!accessibleWidgetInForm
          && (wi == null || wi.getWidgetClass().getId() != widgetClass.getId())) {
        // weird stuff: widget class doesn't match widget instance's class, most probably URL is
        // not generated by UI, but user is typing it
        log.error("User " + OBContext.getOBContext().getUser() + " with role "
            + OBContext.getOBContext().getRole() + " is trying to access widget '"
            + widgetClass.getWidgetTitle() + "' but widget istance doesn't match with class");
        throw new OBSecurityException(OBMessageUtils.getI18NMessage("OBCQL_NoAccessToWidget",
            new String[] { widgetClass.getWidgetTitle() }));
      }

      if (!accessibleWidgetInForm
          && (OBContext.getOBContext() != null
              && ((wi.getVisibleAtUser() != null && !wi.getVisibleAtUser().getId()
                  .equals(OBContext.getOBContext().getUser().getId()))) || (wi.getVisibleAtRole() != null && !wi
              .getVisibleAtRole().getId().equals(OBContext.getOBContext().getRole().getId())))) {
        log.error("User " + OBContext.getOBContext().getUser() + " with role "
            + OBContext.getOBContext().getRole() + " is trying to access widget '"
            + widgetClass.getWidgetTitle() + "' which is not granted");
        throw new OBSecurityException(OBMessageUtils.getI18NMessage("OBCQL_NoAccessToWidget",
            new String[] { widgetClass.getWidgetTitle() }));
      }

      boolean isExport = "true".equals(parameters.get("exportToFile"));
      boolean showAll = "true".equals(parameters.get("showAll"));
      String viewMode = parameters.get("viewMode");
      List<OBCQL_QueryColumn> columns = QueryListUtils.getColumns(widgetClass
          .getOBCQLWidgetQueryList().get(0));

      // handle complex criteria
      try {
        JSONArray criterias = (JSONArray) JsonUtils.buildCriteria(parameters).get("criteria");
        for (int i = 0; i < criterias.length(); i++) {
          final JSONObject criteria = criterias.getJSONObject(i);
          parameters.put(criteria.getString("fieldName"), criteria.getString("value"));
          parameters
              .put(criteria.getString("fieldName") + OPERATOR, criteria.getString("operator"));
        }
      } catch (JSONException e) {
        // Ignore exception.
      }

      String HQL = widgetClass.getOBCQLWidgetQueryList().get(0).getHQL();
      // Parse the HQL in case that optional filters are required
      HQL = parseOptionalFilters(HQL, viewMode, parameters, columns, xmlDateFormat);

      if (parameters.containsKey(JsonConstants.SUMMARY_PARAMETER)) {
        // if the request comes from the summary row, update the select clause so that it obtains
        // the values for the summary fields
        HQL = updateHQLWithSummaryFields(HQL, parameters.get(JsonConstants.SUMMARY_PARAMETER));
      }

      if (parameters.containsKey(JsonConstants.SORTBY_PARAMETER)) {
        HQL = updateSortByFields(HQL, parameters.get(JsonConstants.SORTBY_PARAMETER));
      }

      Query widgetQuery = OBDal.getInstance().getSession().createQuery(HQL);
      String[] queryAliases = widgetQuery.getReturnAliases();

      if (!isExport && "widget".equals(viewMode) && !showAll) {
        int rowsNumber = Integer.valueOf((parameters.get("rowsNumber") != null && !parameters.get(
            "rowsNumber").equals("null")) ? parameters.get("rowsNumber") : "10");
        widgetQuery.setMaxResults(rowsNumber);
      } else if (!isExport) {
        if (startRow > 0) {
          widgetQuery.setFirstResult(startRow);
        }
        if (endRow > startRow) {
          widgetQuery.setMaxResults(endRow - startRow + 1);
        }
      }

      String[] params = widgetQuery.getNamedParameters();
      if (params.length > 0) {
        HashMap<String, Object> parameterValues = getParameterValues(parameters, widgetClass);

        for (int i = 0; i < params.length; i++) {
          String namedParam = params[i];
          boolean isParamSet = false;
          if (parameterValues.containsKey(namedParam)) {
            Object value = parameterValues.get(namedParam);
            if (value instanceof Collection<?>) {
              widgetQuery.setParameterList(namedParam, (Collection<?>) value);
            } else if (value instanceof Object[]) {
              widgetQuery.setParameterList(namedParam, (Object[]) value);
            } else if (value instanceof String
                && isDate(namedParam, widgetClass.getOBUIAPPParameterEMObkmoWidgetClassIDList())) {
              widgetQuery.setParameter(namedParam, convertToDate((String) value));
            } else {
              widgetQuery.setParameter(namedParam, value);
            }
            isParamSet = true;
          }
          if (!isParamSet) {
            // TODO: throw an exception
          }
        }
      }

      final List<Map<String, Object>> result = new ArrayList<Map<String, Object>>();

      if (parameters.containsKey(JsonConstants.SUMMARY_PARAMETER)) {
        // process the response for the summary row
        Map<String, Object> summaryData = new LinkedHashMap<String, Object>();
        try {
          JSONObject summaryFieldsObject = new JSONObject(
              parameters.get(JsonConstants.SUMMARY_PARAMETER));
          Iterator<?> summaryFieldNameIterator = summaryFieldsObject.keys();
          Object uniqueResult = widgetQuery.uniqueResult();
          if (uniqueResult instanceof Object[]) {
            // handles the case where the values of several summary fields are request
            Object[] summaryValues = (Object[]) uniqueResult;
            int i = 0;
            while (summaryFieldNameIterator.hasNext()) {
              String summaryFieldName = (String) summaryFieldNameIterator.next();
              summaryData.put(summaryFieldName, summaryValues[i++]);
            }
          } else {
            // handles the case where the value of just one summary field is request
            String summaryFieldName = (String) summaryFieldsObject.names().get(0);
            summaryData.put(summaryFieldName, uniqueResult);
          }
          summaryData.put("isGridSummary", true);
        } catch (Exception e) {
        }
        result.add(summaryData);

      } else {
        // process the response for the grid
        for (Object objResult : widgetQuery.list()) {
          final Map<String, Object> data = new LinkedHashMap<String, Object>();
          Object[] resultList = new Object[1];
          if (objResult instanceof Object[]) {
            resultList = (Object[]) objResult;
          } else {
            resultList[0] = objResult;
          }

          for (OBCQL_QueryColumn column : columns) {
            UIDefinition uiDefinition = UIDefinitionController.getInstance().getUIDefinition(
                column.getReference());
            DomainType domainType = uiDefinition.getDomainType();
            // TODO: throw an exception if the display expression doesn't match any returned alias.
            for (int i = 0; i < queryAliases.length; i++) {
              if (queryAliases[i].equals(column.getDisplayExpression())
                  || (!isExport && queryAliases[i].equals(column.getLinkExpression()))) {
                Object value = resultList[i];
                if (value instanceof Timestamp) {
                  value = xmlDateTimeFormat.format(value);
                  value = JsonUtils.convertToCorrectXSDFormat((String) value);
                }
                if (value instanceof Date) {
                  value = xmlDateFormat.format(value);
                }

                if (domainType instanceof BooleanDomainType) {
                  if (value instanceof String) {
                    value = ((PrimitiveDomainType) domainType).createFromString((String) value);
                  }
                }

                if (!isExport) {
                  data.put(queryAliases[i], value);
                } else {
                  data.put(QueryListUtils.getColumnLabel(column), value);
                }
              }
            }
          }
          result.add(data);
        }
      }
      return result;
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  /**
   * Updates the order by clause of the HQL query so that it obtains the values for the summary
   * fields. If the HQL query already contains order by fields, the new fields are appended for the
   * existing fields.
   * 
   * @param hQL
   *          original HQL query
   * @param sortByParametersString
   *          parameter that contains sortBy field values
   * @return an updated HQL query that will set the order by fields
   */
  private String updateSortByFields(String hql, String sortBy) {
    String[] fieldList = null;
    String sortByClause = "", hqlString = hql;
    if (sortBy.contains(",")) {
      fieldList = sortBy.split(",");
    }
    if (hqlString.toLowerCase().contains("order by")) {
      if (fieldList == null) {
        sortByClause = sortBy.startsWith("-") ? sortBy.substring(1, sortBy.length()) + " desc "
            : sortBy;
      } else {
        // sort by multiple columns
        for (String field : fieldList) {
          sortByClause = field.startsWith("-") ? sortByClause.concat(field.substring(1,
              field.length()))
              + " desc " : sortByClause.concat(field);
        }
      }
      int sortByIndex = hqlString.toLowerCase().indexOf("order by");
      hqlString = hqlString.substring(0, sortByIndex + "order by".length() + 1) + sortByClause
          + "," + hqlString.substring(sortByIndex + "order by".length() + 1);
    } else {
      hqlString = hqlString.concat(" order by " + sortByClause);
    }
    return hqlString;
  }

  /**
   * Updates the select clause of the HQL query so that it obtains the values for the summary fields
   * 
   * @param hQL
   *          original HQL query
   * @param summaryParametersString
   *          parameter that contains pairs of summaryField - summaryFunction values
   * @return an updated HQL query that will obtain the values for the summary fields
   */
  private String updateHQLWithSummaryFields(String hQL, String summaryParametersString) {
    // get rid of the original select clause, a new one is going to be built
    String updatedHQL = removeSelectClause(hQL);
    // the order clause is not needed when obtaining the values for the summary fields
    updatedHQL = removeOrderByClause(updatedHQL);
    try {
      JSONObject summaryFieldsObject = new JSONObject(summaryParametersString);
      Iterator<?> summaryFieldNameIterator = summaryFieldsObject.keys();
      StringBuilder selectClause = new StringBuilder("select ");
      boolean first = true;
      while (summaryFieldNameIterator.hasNext()) {
        String summaryFieldName = (String) summaryFieldNameIterator.next();
        String summaryFunction = summaryFieldsObject.getString(summaryFieldName);
        if (!first) {
          selectClause.append(", ");
        } else {
          first = false;
        }
        // only three summary functions are available for the columns of Query/List widgets: count,
        // sum and avg
        if ("count".equals(summaryFunction)) {
          selectClause.append("count(*)");
        } else if ("sum".equals(summaryFunction)) {
          selectClause.append("sum(" + summaryFieldName + ")");
        } else if ("avg".equals(summaryFunction)) {
          selectClause.append("sum(" + summaryFieldName + ")/count(*)");
        }
      }
      updatedHQL = selectClause.toString() + " " + updatedHQL;
    } catch (JSONException e) {
      log.error("Error obtaining the values of the summary fields", e);
    }
    return updatedHQL;
  }

  /**
   * Removes the select clause of a hql query
   * 
   * @param hql
   *          the original hql query
   * @return the original hql query without its select clause
   */
  private String removeSelectClause(String hql) {
    String hqlWithoutSelectClause = hql;
    if (hqlWithoutSelectClause.toLowerCase().indexOf(" from ") != -1) {
      hqlWithoutSelectClause = hqlWithoutSelectClause.substring(hqlWithoutSelectClause
          .toLowerCase().indexOf(" from "));
    } else if (hqlWithoutSelectClause.toLowerCase().indexOf("\nfrom ") != -1) {
      hqlWithoutSelectClause = hqlWithoutSelectClause.substring(hqlWithoutSelectClause
          .toLowerCase().indexOf("\nfrom "));
    }
    return hqlWithoutSelectClause;
  }

  /**
   * Removes the order by clause of a hql query
   * 
   * @param hql
   *          the original hql query
   * @return the original hql query without its select clause
   */
  private String removeOrderByClause(String hql) {
    String hqlWithoutOrderByClause = hql;
    if (hqlWithoutOrderByClause.toLowerCase().indexOf(" order by ") != -1) {
      hqlWithoutOrderByClause = hqlWithoutOrderByClause.substring(0, hqlWithoutOrderByClause
          .toLowerCase().indexOf(" order by "));
    } else if (hqlWithoutOrderByClause.toLowerCase().indexOf("\norder by ") != -1) {
      hqlWithoutOrderByClause = hqlWithoutOrderByClause.substring(0, hqlWithoutOrderByClause
          .toLowerCase().indexOf("\norder by "));
    }
    return hqlWithoutOrderByClause;
  } // Checks if the widget is embedded in a tab accessible by the user

  private boolean isAccessibleWidgetInForm(WidgetClass widgetClass) {
    OBCriteria<WidgetReference> widgetInFormCriteria = OBDal.getInstance().createCriteria(
        WidgetReference.class);
    widgetInFormCriteria.add(Restrictions.eq(WidgetReference.PROPERTY_WIDGETCLASS, widgetClass));
    List<Window> windowList = new ArrayList<Window>();
    List<WidgetReference> widgetInFormList = widgetInFormCriteria.list();
    for (WidgetReference widgetInForm : widgetInFormList) {
      List<Column> columnList = widgetInForm.getReference().getADColumnReferenceSearchKeyList();
      for (Column column : columnList) {
        List<Field> fieldList = column.getADFieldList();
        for (Field field : fieldList) {
          windowList.add(field.getTab().getWindow());
        }
      }
    }

    if (windowList.isEmpty()) {
      // The widget is not embedded in any window
      return false;
    } else {
      OBCriteria<WindowAccess> accessibleWindowCriteria = OBDal.getInstance().createCriteria(
          WindowAccess.class);
      accessibleWindowCriteria.add(Restrictions.eq(WindowAccess.PROPERTY_ROLE, OBContext
          .getOBContext().getRole()));
      accessibleWindowCriteria.add(Restrictions.in(WindowAccess.PROPERTY_WINDOW, windowList));
      int count = accessibleWindowCriteria.count();
      // If the widget is embedded in at least one window accessible by the user, return true
      return (count > 0);
    }
  }

  // Converts and object from String to Date
  private Date convertToDate(String value) {
    DateDomainType domainType = new DateDomainType();
    return (Date) domainType.createFromString(value);
  }

  // Check if the reference of a parameter is a Date
  private boolean isDate(String paramName, List<Parameter> parameterList) {
    Parameter parameterToCheck = null;
    for (Parameter p : parameterList) {
      if (p.getDBColumnName().equals(paramName)) {
        parameterToCheck = p;
        break;
      }
    }
    if (parameterToCheck == null) {
      return false;
    } else {
      DomainType domainType = ModelProvider.getInstance()
          .getReference(parameterToCheck.getReference().getId()).getDomainType();
      if (domainType.getClass().equals(DateDomainType.class)) {
        return true;
      } else {
        return false;
      }
    }
  }

  /**
   * Returns a HashMap with the values of the parameters included on the given widget instance.
   * 
   * @param parameters
   *          the parameters passed in from the request
   * @param widgetClass
   *          the widget class to which the parameters belong to
   * @return a HashMap<String, Object> with the value of each parameter mapped by the DBColumnName
   *         of the parameter.
   */
  private HashMap<String, Object> getParameterValues(Map<String, String> parameters,
      WidgetClass widgetClass) {
    HashMap<String, Object> parameterValues = new HashMap<String, Object>();

    // get serializedValues from request (if present)
    String serializedParams = parameters.get("serializedParameters");
    if (serializedParams != null) {
      try {
        JSONObject json = new JSONObject(serializedParams);
        for (Parameter parameter : widgetClass.getOBUIAPPParameterEMObkmoWidgetClassIDList()) {
          if (parameter.isFixed()) {
            parameterValues.put(parameter.getDBColumnName(),
                ParameterUtils.getParameterFixedValue(parameters, parameter));
          } else {
            if (json.has(parameter.getDBColumnName())) {
              parameterValues.put(parameter.getDBColumnName(),
                  json.get(parameter.getDBColumnName()));
            } else {
              // TODO: not fixed & value missing -> error (prepared to be handled in caller, but not
              // yet implemented)
            }
          }
        }
      } catch (JSONException e) {
        log.error("Error processing client parameters", e);
      }
    } else {
      // data send without serializedParams (should not happen)
      throw new OBException("Missing serializedParameters value in request");
    }

    return parameterValues;
  }

  private String parseOptionalFilters(String _HQL, String viewMode, Map<String, String> parameters,
      List<OBCQL_QueryColumn> columns, SimpleDateFormat xmlDateFormat) {
    StringBuffer optionalFilter = new StringBuffer(" 1=1 ");
    String HQL = _HQL;

    // Parse for columns filtered by grid's filter row on maximized view. If we are not on maximized
    // view return the HQL without parsing.
    if ("maximized".equals(viewMode)) {
      for (OBCQL_QueryColumn column : columns) {
        if (column.isCanBeFiltered()) {
          String value = parameters.get(column.getDisplayExpression());
          String operator = parameters.get(column.getDisplayExpression() + OPERATOR);
          if (column.getReference().getName().equals("YesNo") && value != null) {
            if (value.equals("true")) {
              value = "Y";
            } else {
              value = "N";
            }
          }
          String whereClause = " 1=1 ";
          if (value != null) {
            whereClause = getWhereClause(value, column, xmlDateFormat, operator);
          }

          if (HQL.contains("@" + column.getDisplayExpression() + "@")) {
            HQL = HQL.replace("@" + column.getDisplayExpression() + "@", whereClause);
          } else {
            optionalFilter.append(" and " + whereClause);
          }
        }
      }
    }
    HQL = HQL.replace(OPTIONAL_FILTERS, optionalFilter.toString());
    return HQL;
  }

  private String getWhereClause(String value, OBCQL_QueryColumn column,
      SimpleDateFormat xmlDateFormat, String operator) {
    String whereClause = "";
    DomainType domainType = ModelProvider.getInstance().getReference(column.getReference().getId())
        .getDomainType();
    if (domainType.getClass().getSuperclass().equals(BigDecimalDomainType.class)
        || domainType.getClass().equals(LongDomainType.class)) {
      if (StringUtils.isNotEmpty(value)) {
        whereClause = column.getWhereClauseLeftPart() + " "
            + AdvancedQueryBuilder.getHqlOperator(operator) + " " + value;
      } else {
        whereClause = " 1=1 ";
      }
    } else if (domainType.getClass().equals(DateDomainType.class)) {
      try {
        final Calendar cal = Calendar.getInstance();
        cal.setTime(xmlDateFormat.parse(value));
        whereClause = " (day(" + column.getWhereClauseLeftPart() + ") = " + cal.get(Calendar.DATE);
        whereClause += "\n and month(" + column.getWhereClauseLeftPart() + ") = "
            + (cal.get(Calendar.MONTH) + 1);
        whereClause += "\n and year(" + column.getWhereClauseLeftPart() + ") = "
            + cal.get(Calendar.YEAR) + ") ";
      } catch (Exception e) {
        // ignore these errors, just don't filter then
        // add a dummy whereclause to make the query format correct
        whereClause = " 1=1 ";
      }
    } else {
      whereClause = "upper(" + column.getWhereClauseLeftPart() + ")";
      whereClause += " LIKE ";
      whereClause += "'%" + value.toUpperCase().replaceAll(" ", "%") + "%'";
    }
    return whereClause;
  }

  public List<DataSourceProperty> getDataSourceProperties(Map<String, Object> parameters) {
    // note datasource properties are not cached as the component is
    // re-used within one request thread
    final List<DataSourceProperty> dsProperties = new ArrayList<DataSourceProperty>();
    OBContext.setAdminMode();
    try {
      WidgetClass widgetClass = (WidgetClass) parameters
          .get(QueryListWidgetProvider.WIDGETCLASS_PARAMETER);

      if (!widgetClass.getOBCQLWidgetQueryList().isEmpty()) {
        for (OBCQL_QueryColumn column : QueryListUtils.getColumns(widgetClass
            .getOBCQLWidgetQueryList().get(0))) {
          Reference reference = column.getReference();
          if (column.getReferenceSearchKey() != null) {
            reference = column.getReferenceSearchKey();
          }

          final DataSourceProperty dsProperty = new DataSourceProperty();
          dsProperty.setName(column.getDisplayExpression());
          dsProperty.setId(false);
          dsProperty.setMandatory(false);
          dsProperty.setAuditInfo(false);
          dsProperty.setUpdatable(false);
          final UIDefinition uiDefinition = UIDefinitionController.getInstance().getUIDefinition(
              reference);
          dsProperty.setBoolean(uiDefinition instanceof YesNoUIDefinition);
          dsProperty.setPrimitive(!(uiDefinition instanceof ForeignKeyUIDefinition));
          dsProperty.setUIDefinition(uiDefinition);
          if (dsProperty.isPrimitive()) {
            dsProperty.setPrimitiveObjectType(((PrimitiveDomainType) uiDefinition.getDomainType())
                .getPrimitiveType());
            dsProperty.setNumericType(uiDefinition instanceof NumberUIDefinition);

            if (uiDefinition instanceof EnumUIDefinition) {
              if (column.getReferenceSearchKey() == null) {
                log.warn("In widget " + column.getWidgetQuery().getWidgetClass().getWidgetTitle()
                    + " column " + column.getDisplayExpression()
                    + " is of enum type but does not define sub reference.");
              } else {
                Set<String> allowedValues = DataSourceProperty.getAllowedValues(column
                    .getReferenceSearchKey());
                dsProperty.setAllowedValues(allowedValues);
                dsProperty.setValueMap(DataSourceProperty.createValueMap(allowedValues, column
                    .getReferenceSearchKey().getId()));
              }
            }
          } else {
          }
          dsProperties.add(dsProperty);
        }
      }
      return dsProperties;
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  protected void sort(String sortBy, List<Map<String, Object>> data) {
    Collections.sort(data, new DataComparator(sortBy));
  }

  // can only be used if the comparedBy is a string
  private static class DataComparator implements Comparator<Map<String, Object>> {
    private ArrayList<String> compareByArray;

    public DataComparator(String compareBy) {
      this.compareByArray = new ArrayList<String>();
      if (compareBy.contains(JsonConstants.IN_PARAMETER_SEPARATOR)) {
        final String[] separatedValues = compareBy.split(JsonConstants.IN_PARAMETER_SEPARATOR);
        for (String separatedValue : separatedValues) {
          this.compareByArray.add(separatedValue);
        }
      } else {
        this.compareByArray.add(compareBy);
      }
    }

    @Override
    public int compare(Map<String, Object> o1, Map<String, Object> o2) {
      for (String compareBy : compareByArray) {
        int ascending = 1;
        if (compareBy.startsWith("-")) {
          ascending = -1;
          compareBy = compareBy.substring(1);
        }
        final Object v1 = o1.get(compareBy);
        final Object v2 = o2.get(compareBy);
        if (v1 == null) {
          return -1 * ascending;
        } else if (v2 == null) {
          return 1 * ascending;
        }
        int returnValue = 0;
        if (v1 instanceof Date && v2 instanceof Date) {
          returnValue = ((Date) v1).compareTo((Date) v2) * ascending;
        } else if (v1 instanceof Timestamp && v2 instanceof Timestamp) {
          returnValue = ((Timestamp) v1).compareTo((Timestamp) v2) * ascending;
        } else if (v1 instanceof Long && v2 instanceof Long) {
          returnValue = ((Long) v1).compareTo((Long) v2) * ascending;
        } else if (v1 instanceof BigDecimal && v2 instanceof BigDecimal) {
          returnValue = ((BigDecimal) v1).compareTo((BigDecimal) v2) * ascending;
        } else if (v1 instanceof String && v2 instanceof String) {
          returnValue = ((String) v1).compareTo((String) v2) * ascending;
        } else {
          log.warn("Comparing on property " + compareBy + " for objects " + v1 + "/" + v2 + ". "
              + "But value is are of different classes or an instance of a not supported class. "
              + "Returning default compare value.");
          returnValue = 0;
        }
        if (returnValue != 0) {
          return returnValue;
        }
      }
      return 0;
    }
  }

}
