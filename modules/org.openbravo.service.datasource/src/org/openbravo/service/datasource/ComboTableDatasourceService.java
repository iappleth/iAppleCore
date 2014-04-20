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
package org.openbravo.service.datasource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Map;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.base.weld.WeldUtils;
import org.openbravo.client.application.window.ApplicationDictionaryCachedStructures;
import org.openbravo.client.kernel.RequestContext;
import org.openbravo.client.kernel.reference.UIDefinition;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.data.FieldProvider;
import org.openbravo.erpCommon.utility.ComboTableData;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.ad.ui.Field;
import org.openbravo.service.db.DalConnectionProvider;
import org.openbravo.service.json.JsonConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * The implementation of the combo table reference datasource.
 * 
 * @author Shankar Balachandran
 */

public class ComboTableDatasourceService extends BaseDataSourceService {
  private static final Logger log = LoggerFactory.getLogger(ComboTableDatasourceService.class);

  /*
   * (non-Javadoc)
   * 
   * @see org.openbravo.service.datasource.DataSourceService#fetch(java.util.Map)
   */
  @Override
  public String fetch(Map<String, String> parameters) {
    try {
      long init = System.currentTimeMillis();
      OBContext.setAdminMode();
      if (parameters.get("FILTER_VALUE") != null) {
        return filter(parameters);
      }
      String fieldId = parameters.get("fieldId");
      final String startRow = parameters.get(JsonConstants.STARTROW_PARAMETER);
      final String endRow = parameters.get(JsonConstants.ENDROW_PARAMETER);
      int startRowCount = 0;
      boolean doCount = false;
      if (startRow != null) {
        startRowCount = Integer.parseInt(startRow);
        doCount = true;
      }
      if (endRow != null) {
        doCount = true;
      }
      boolean preventCountOperation = "true"
          .equals(parameters.get(JsonConstants.NOCOUNT_PARAMETER));
      String singleRecord = parameters.get("@ONLY_ONE_RECORD@");
      Field field = OBDal.getInstance().get(Field.class, fieldId);
      Boolean getValueFromSession = Boolean.getBoolean(parameters.get("getValueFromSession"));
      String columnValue = parameters.get("columnValue");
      RequestContext rq = RequestContext.get();
      VariablesSecureApp vars = rq.getVariablesSecureApp();
      boolean comboreload = rq.getRequestParameter("donotaddcurrentelement") != null
          && rq.getRequestParameter("donotaddcurrentelement").equals("true");
      String ref = field.getColumn().getReference().getId();
      String objectReference = "";
      if (field.getColumn().getReferenceSearchKey() != null) {
        objectReference = field.getColumn().getReferenceSearchKey().getId();
      }
      String validation = "";
      if (field.getColumn().getValidation() != null) {
        validation = field.getColumn().getValidation().getId();
      }

      String orgList = Utility.getReferenceableOrg(vars, vars.getStringParameter("inpadOrgId"));
      String clientList = Utility.getContext(new DalConnectionProvider(false), vars,
          "#User_Client", field.getTab().getWindow().getId());
      if (field.getColumn().getDBColumnName().equalsIgnoreCase("AD_CLIENT_ID")) {
        clientList = Utility.getContext(new DalConnectionProvider(false), vars, "#User_Client",
            field.getTab().getWindow().getId(),
            Integer.parseInt(field.getTab().getTable().getDataAccessLevel()));
        clientList = vars.getSessionValue("#User_Client");
        orgList = null;
      }
      if (field.getColumn().getDBColumnName().equalsIgnoreCase("AD_ORG_ID")) {
        orgList = Utility.getContext(new DalConnectionProvider(false), vars, "#User_Org", field
            .getTab().getWindow().getId(),
            Integer.parseInt(field.getTab().getTable().getDataAccessLevel()));
      }

      ApplicationDictionaryCachedStructures cachedStructures = WeldUtils
          .getInstanceFromStaticBeanManager(ApplicationDictionaryCachedStructures.class);
      ComboTableData comboTableData = cachedStructures.getComboTableData(vars, ref, field
          .getColumn().getDBColumnName(), objectReference, validation, orgList, clientList);
      Map<String, String> newParameters = null;

      FieldProvider tabData = UIDefinition.generateTabData(field.getTab().getADFieldList(), field,
          columnValue);
      newParameters = comboTableData.fillSQLParametersIntoMap(new DalConnectionProvider(false),
          vars, tabData, field.getTab().getWindow().getId(),
          (getValueFromSession && !comboreload) ? columnValue : "");
      if (singleRecord != null) {
        newParameters.put("@ONLY_ONE_RECORD@", singleRecord);
        newParameters.put("@ACTUAL_VALUE@", singleRecord);
      }
      FieldProvider[] fps = comboTableData.select(new DalConnectionProvider(false), newParameters,
          getValueFromSession && !comboreload, startRow, endRow);
      ArrayList<FieldProvider> values = new ArrayList<FieldProvider>();
      values.addAll(Arrays.asList(fps));
      ArrayList<JSONObject> comboEntries = new ArrayList<JSONObject>();
      ArrayList<String> possibleIds = new ArrayList<String>();
      // If column is mandatory we add an initial blank value
      if (!field.getColumn().isMandatory()) {
        possibleIds.add("");
        JSONObject entry = new JSONObject();
        entry.put(JsonConstants.ID, (String) null);
        entry.put(JsonConstants.IDENTIFIER, (String) null);
        comboEntries.add(entry);
      }
      for (FieldProvider fp : values) {
        possibleIds.add(fp.getField("ID"));
        JSONObject entry = new JSONObject();
        entry.put(JsonConstants.ID, fp.getField("ID"));
        entry.put(JsonConstants.IDENTIFIER, fp.getField("NAME"));
        comboEntries.add(entry);
      }
      JSONObject fieldProps = new JSONObject();
      if (getValueFromSession && !comboreload) {
        fieldProps.put("value", columnValue);
        fieldProps.put("classicValue", columnValue);
      } else {
        if (possibleIds.contains(columnValue)) {
          fieldProps.put("value", columnValue);
          fieldProps.put("classicValue", columnValue);
        } else {
          // In case the default value doesn't exist in the combo values, we choose the first one
          if (comboEntries.size() > 0) {
            if (comboEntries.get(0).has(JsonConstants.ID)) {
              fieldProps.put("value", comboEntries.get(0).get(JsonConstants.ID));
              fieldProps.put("classicValue", comboEntries.get(0).get(JsonConstants.ID));
            } else {
              fieldProps.put("value", (String) null);
              fieldProps.put("classicValue", (String) null);
            }
          } else {
            fieldProps.put("value", "");
            fieldProps.put("classicValue", "");
          }
        }
      }
      fieldProps.put("entries", new JSONArray(comboEntries));
      log.debug("fetch operation for ComboTableDatasourceService took: {} ms",
          (System.currentTimeMillis() - init));

      // now jsonfy the data
      try {
        final JSONObject jsonResult = new JSONObject();
        final JSONObject jsonResponse = new JSONObject();
        jsonResponse.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
        jsonResponse.put(JsonConstants.RESPONSE_STARTROW, startRow);
        jsonResponse.put(JsonConstants.RESPONSE_ENDROW, endRow);
        if (doCount && !preventCountOperation) {
          int totalRows = Integer.parseInt(endRow) - startRowCount + 1;
          int num = totalRows;
          if (num == -1) {
            int endRowCount = Integer.parseInt(endRow);
            num = (endRowCount + 2);
            if ((endRowCount - startRowCount) > totalRows) {
              num = startRowCount + totalRows;
            }
          }
          jsonResponse.put(JsonConstants.RESPONSE_TOTALROWS, num);
        } else {
          jsonResponse.put(JsonConstants.RESPONSE_TOTALROWS,
              parameters.get(JsonConstants.RESPONSE_TOTALROWS));
        }
        jsonResponse.put(JsonConstants.RESPONSE_DATA, fieldProps.get("entries"));
        jsonResult.put(JsonConstants.RESPONSE_RESPONSE, jsonResponse);

        // if (jsonObjects.size() > 0) {
        // System.err.println(jsonObjects.get(0));
        // }
        return jsonResult.toString();
      } catch (JSONException e) {
        throw new OBException(e);
      }

    } catch (Exception e) {
      log.error(e.getMessage(), e);
    } finally {

      OBContext.restorePreviousMode();
    }
    return null;
  }

  /**
   * Filter combo data based on keyword
   * 
   * @param parameters
   * @return {@link JSONObject}
   */
  public String filter(Map<String, String> parameters) {
    try {
      long init = System.currentTimeMillis();
      OBContext.setAdminMode();
      String fieldId = parameters.get("fieldId");
      String startRow = parameters.get("_startRow");
      String endRow = parameters.get("_endRow");
      int startRowCount = 0;
      boolean doCount = false;
      if (startRow != null) {
        startRowCount = Integer.parseInt(startRow);
        doCount = true;
      }
      if (endRow != null) {
        doCount = true;
      }
      boolean preventCountOperation = "true"
          .equals(parameters.get(JsonConstants.NOCOUNT_PARAMETER));
      String singleRecord = parameters.get("@ONLY_ONE_RECORD@");
      String filterString = parameters.get("FILTER_VALUE");
      Field field = OBDal.getInstance().get(Field.class, fieldId);
      Boolean getValueFromSession = Boolean.getBoolean(parameters.get("getValueFromSession"));
      String columnValue = parameters.get("columnValue");
      RequestContext rq = RequestContext.get();
      VariablesSecureApp vars = rq.getVariablesSecureApp();
      boolean comboreload = rq.getRequestParameter("donotaddcurrentelement") != null
          && rq.getRequestParameter("donotaddcurrentelement").equals("true");
      String ref = field.getColumn().getReference().getId();
      String objectReference = "";
      if (field.getColumn().getReferenceSearchKey() != null) {
        objectReference = field.getColumn().getReferenceSearchKey().getId();
      }
      String validation = "";
      if (field.getColumn().getValidation() != null) {
        validation = field.getColumn().getValidation().getId();
      }

      String orgList = Utility.getReferenceableOrg(vars, vars.getStringParameter("inpadOrgId"));
      String clientList = Utility.getContext(new DalConnectionProvider(false), vars,
          "#User_Client", field.getTab().getWindow().getId());
      if (field.getColumn().getDBColumnName().equalsIgnoreCase("AD_CLIENT_ID")) {
        clientList = Utility.getContext(new DalConnectionProvider(false), vars, "#User_Client",
            field.getTab().getWindow().getId(),
            Integer.parseInt(field.getTab().getTable().getDataAccessLevel()));
        clientList = vars.getSessionValue("#User_Client");
        orgList = null;
      }
      if (field.getColumn().getDBColumnName().equalsIgnoreCase("AD_ORG_ID")) {
        orgList = Utility.getContext(new DalConnectionProvider(false), vars, "#User_Org", field
            .getTab().getWindow().getId(),
            Integer.parseInt(field.getTab().getTable().getDataAccessLevel()));
      }

      ApplicationDictionaryCachedStructures cachedStructures = WeldUtils
          .getInstanceFromStaticBeanManager(ApplicationDictionaryCachedStructures.class);
      ComboTableData comboTableData = cachedStructures.getComboTableData(vars, ref, field
          .getColumn().getDBColumnName(), objectReference, validation, orgList, clientList);
      Map<String, String> newParameters = null;

      FieldProvider tabData = UIDefinition.generateTabData(field.getTab().getADFieldList(), field,
          columnValue);
      newParameters = comboTableData.fillSQLParametersIntoMap(new DalConnectionProvider(false),
          vars, tabData, field.getTab().getWindow().getId(),
          (getValueFromSession && !comboreload) ? columnValue : "");
      if (singleRecord != null) {
        newParameters.put("@ONLY_ONE_RECORD@", singleRecord);
        newParameters.put("@ACTUAL_VALUE@", singleRecord);
      }
      FieldProvider[] fps = comboTableData.filter(new DalConnectionProvider(false), newParameters,
          getValueFromSession && !comboreload, startRow, endRow, filterString);
      ArrayList<FieldProvider> values = new ArrayList<FieldProvider>();
      values.addAll(Arrays.asList(fps));
      ArrayList<JSONObject> comboEntries = new ArrayList<JSONObject>();
      ArrayList<String> possibleIds = new ArrayList<String>();
      // If column is mandatory we add an initial blank value
      if (!field.getColumn().isMandatory()) {
        possibleIds.add("");
        JSONObject entry = new JSONObject();
        entry.put(JsonConstants.ID, (String) null);
        entry.put(JsonConstants.IDENTIFIER, (String) null);
        comboEntries.add(entry);
      }
      for (FieldProvider fp : values) {
        possibleIds.add(fp.getField("ID"));
        JSONObject entry = new JSONObject();
        entry.put(JsonConstants.ID, fp.getField("ID"));
        entry.put(JsonConstants.IDENTIFIER, fp.getField("NAME"));
        comboEntries.add(entry);
      }
      JSONObject fieldProps = new JSONObject();
      if (getValueFromSession && !comboreload) {
        fieldProps.put("value", columnValue);
        fieldProps.put("classicValue", columnValue);
      } else {
        if (possibleIds.contains(columnValue)) {
          fieldProps.put("value", columnValue);
          fieldProps.put("classicValue", columnValue);
        } else {
          // In case the default value doesn't exist in the combo values, we choose the first one
          if (comboEntries.size() > 0) {
            if (comboEntries.get(0).has(JsonConstants.ID)) {
              fieldProps.put("value", comboEntries.get(0).get(JsonConstants.ID));
              fieldProps.put("classicValue", comboEntries.get(0).get(JsonConstants.ID));
            } else {
              fieldProps.put("value", (String) null);
              fieldProps.put("classicValue", (String) null);
            }
          } else {
            fieldProps.put("value", "");
            fieldProps.put("classicValue", "");
          }
        }
      }
      fieldProps.put("entries", new JSONArray(comboEntries));
      log.debug("filter operation for ComboTableDatasourceService took: {} ms",
          (System.currentTimeMillis() - init));

      // now jsonfy the data
      try {
        final JSONObject jsonResult = new JSONObject();
        final JSONObject jsonResponse = new JSONObject();
        jsonResponse.put(JsonConstants.RESPONSE_STATUS, JsonConstants.RPCREQUEST_STATUS_SUCCESS);
        jsonResponse.put(JsonConstants.RESPONSE_STARTROW, startRow);
        jsonResponse.put(JsonConstants.RESPONSE_ENDROW, endRow);
        if (doCount && !preventCountOperation) {
          int totalRows = Integer.parseInt(endRow) - startRowCount + 1;
          int num = totalRows;
          if (num == -1) {
            int endRowCount = Integer.parseInt(endRow);
            num = (endRowCount + 2);
            if ((endRowCount - startRowCount) > totalRows) {
              num = startRowCount + totalRows;
            }
          }
          jsonResponse.put(JsonConstants.RESPONSE_TOTALROWS, num);
        } else {
          jsonResponse.put(JsonConstants.RESPONSE_TOTALROWS,
              parameters.get(JsonConstants.RESPONSE_TOTALROWS));
        }
        jsonResponse.put(JsonConstants.RESPONSE_DATA, fieldProps.get("entries"));
        jsonResult.put(JsonConstants.RESPONSE_RESPONSE, jsonResponse);

        // if (jsonObjects.size() > 0) {
        // System.err.println(jsonObjects.get(0));
        // }
        return jsonResult.toString();
      } catch (JSONException e) {
        throw new OBException(e);
      }

    } catch (Exception e) {
      log.error(e.getMessage(), e);
      return e.getMessage();
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  @Override
  public String remove(Map<String, String> parameters) {
    throw new OBException("Method not implemented");
  }

  @Override
  public String add(Map<String, String> parameters, String content) {
    throw new OBException("Method not implemented");
  }

  @Override
  public String update(Map<String, String> parameters, String content) {
    throw new OBException("Method not implemented");
  }

}