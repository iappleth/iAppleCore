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
 * All portions are Copyright (C) 2012-2013 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.client.application.process;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpSession;

import org.apache.log4j.Logger;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.model.Property;
import org.openbravo.base.model.domaintype.BooleanDomainType;
import org.openbravo.base.model.domaintype.DomainType;
import org.openbravo.base.model.domaintype.ForeignKeyDomainType;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.client.application.Parameter;
import org.openbravo.client.application.ParameterUtils;
import org.openbravo.client.application.Process;
import org.openbravo.client.kernel.KernelConstants;
import org.openbravo.client.kernel.KernelUtils;
import org.openbravo.client.kernel.reference.UIDefinition;
import org.openbravo.client.kernel.reference.UIDefinitionController;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.data.Sqlc;
import org.openbravo.model.ad.domain.Reference;
import org.openbravo.model.ad.ui.Field;
import org.openbravo.model.ad.ui.Tab;
import org.openbravo.model.ad.ui.Window;

/**
 * This ActionHandler is invoked when opening a Process Definition window. It is in charge of
 * computing default values for the parameters in the window.
 * 
 * @author alostale
 */
public class DefaultsProcessActionHandler extends BaseProcessActionHandler {

  private static final Logger log = Logger.getLogger(DefaultsProcessActionHandler.class);
  private static final String WINDOW_REFERENCE_ID = "FF80818132D8F0F30132D9BC395D0038";

  @Override
  protected final JSONObject doExecute(Map<String, Object> parameters, String content) {
    try {
      OBContext.setAdminMode(true);

      final String processId = (String) parameters.get("processId");

      JSONObject context = null;
      if (parameters.get("context") != null) {
        context = new JSONObject((String) parameters.get("context"));
      }
      final Process processDefinition = OBDal.getInstance().get(Process.class, processId);
      JSONObject defaults = new JSONObject();
      JSONObject filterExpressions = new JSONObject();
      final List<Parameter> orderedParams = new ArrayList<Parameter>();

      // Reorder params in a list in order to compute in order based on the dependencies of default
      // values
      final boolean paramsOrdered = reorderParams(processDefinition, orderedParams, context);

      if (paramsOrdered) {

        for (Parameter param : orderedParams) {
          if (param.getDefaultValue() != null) {

            Reference reference = param.getReferenceSearchKey();
            if (reference == null) {
              reference = param.getReference();
            }

            UIDefinition uiDefinition = UIDefinitionController.getInstance().getUIDefinition(
                reference);

            String rawDefaultValue = param.getDefaultValue();

            Object defaultValue;
            String inpName = null;
            if (isSessionDefaultValue(rawDefaultValue) && context != null) {
              // Transforms the default value from @columnName@ to the column inp name
              inpName = "inp"
                  + Sqlc.TransformaNombreColumna(rawDefaultValue.substring(1,
                      rawDefaultValue.length() - 1));
              defaultValue = context.get(inpName);
              inpName = "inp" + Sqlc.TransformaNombreColumna(param.getDBColumnName());
            } else {
              Map<String, String> requestMap = fixRequestMap(parameters);
              requestMap.put("currentParam", param.getDBColumnName());
              defaultValue = ParameterUtils.getJSExpressionResult(requestMap,
                  (HttpSession) parameters.get(KernelConstants.HTTP_SESSION), rawDefaultValue);
              if (context == null) {
                context = new JSONObject();
              }
              inpName = "inp" + Sqlc.TransformaNombreColumna(param.getDBColumnName());
            }
            if (!context.has(inpName)) {
              context.put(inpName, defaultValue);
            }
            DomainType domainType = uiDefinition.getDomainType();
            if (defaultValue != null && defaultValue instanceof String
                && domainType instanceof ForeignKeyDomainType) {
              // default value is ID of a FK, look for the identifier
              Entity referencedEntity = ((ForeignKeyDomainType) domainType)
                  .getForeignKeyColumn(param.getDBColumnName()).getProperty().getEntity();

              BaseOBObject record = OBDal.getInstance().get(referencedEntity.getName(),
                  defaultValue);
              if (record != null) {
                String identifier = record.getIdentifier();
                JSONObject def = new JSONObject();
                def.put("value", defaultValue);
                def.put("identifier", identifier);
                defaults.put(param.getDBColumnName(), def);
              }
            } else {
              if (domainType instanceof BooleanDomainType) {
                defaultValue = ((BooleanDomainType) domainType)
                    .createFromString((String) defaultValue);
              }
              defaults.put(param.getDBColumnName(), defaultValue);
            }
          }
          if (WINDOW_REFERENCE_ID.equals(param.getReference().getId())) {
            if (param.getReferenceSearchKey().getOBUIAPPRefWindowList().size() > 0) {
              final Window window = param.getReferenceSearchKey().getOBUIAPPRefWindowList().get(0)
                  .getWindow();
              final Tab tab = window.getADTabList().get(0);
              final String entityName = tab.getTable().getName();
              final Entity entity = ModelProvider.getInstance().getEntity(entityName);
              JSONObject gridJson = new JSONObject();

              for (Field field : tab.getADFieldList()) {
                if (field.getObuiappDefaultExpression() != null) {
                  String rawDefaultExpression = field.getObuiappDefaultExpression();
                  Object defaultExpression;
                  defaultExpression = ParameterUtils.getJSExpressionResult(
                      fixRequestMap(parameters),
                      (HttpSession) parameters.get(KernelConstants.HTTP_SESSION),
                      rawDefaultExpression);

                  if (defaultExpression != null && !defaultExpression.equals("")
                      && !defaultExpression.equals("''")) {
                    Property property = null;
                    if (field.getColumn() != null) {
                      property = KernelUtils.getInstance().getPropertyFromColumn(field.getColumn());
                    } else if (field.getProperty() != null) {
                      property = DalUtil.getPropertyFromPath(entity, field.getProperty());
                    }
                    if (property != null && property.getTargetEntity() != null
                        && !property.isOneToMany()) {
                      final BaseOBObject bob = OBDal.getInstance().get(
                          property.getTargetEntity().getName(), defaultExpression);
                      defaultExpression = bob.getIdentifier();
                    }
                  }

                  if (defaultExpression != null && !defaultExpression.equals("")
                      && !defaultExpression.equals("''")) {
                    String fieldName = field.getProperty();
                    if (fieldName != null) {
                      gridJson.put(fieldName.replace(DalUtil.DOT, DalUtil.FIELDSEPARATOR),
                          defaultExpression);
                    } else {
                      gridJson.put(
                          entity.getPropertyByColumnName(field.getColumn().getDBColumnName())
                              .getName().replace(DalUtil.DOT, DalUtil.FIELDSEPARATOR),
                          defaultExpression);
                    }
                  }
                }
              }
              log.debug("Implicit Filters for process " + processDefinition + ", grid: "
                  + param.getDBColumnName() + "\n" + gridJson.toString());
              filterExpressions.put(param.getDBColumnName(), gridJson);
            }
          }
        }
        log.debug("Defaults for process " + processDefinition + "\n" + defaults.toString());

        JSONObject results = new JSONObject();
        results.put("defaults", defaults);
        results.put("filterExpressions", filterExpressions);
        return results;
      } else {
        return new JSONObject();
      }
    } catch (Exception e) {
      log.error(
          "Error trying getting defaults and Filter Expressions for process: " + e.getMessage(), e);
      return new JSONObject();
    } finally {
      OBContext.restorePreviousMode();
    }
  }

  // Returns true if the value of the parameter default value matches "@*@"
  private boolean isSessionDefaultValue(String rawDefaultValue) {
    if ("@".equals(rawDefaultValue.substring(0, 1))
        && "@".equals(rawDefaultValue.substring(rawDefaultValue.length() - 1))
        && rawDefaultValue.length() > 2) {
      return true;
    } else {
      return false;
    }
  }

  // Returns true if it orders all the params in a list taking into account the dependencies of the
  // defaults. It returns false of is not able to order all the params because of dependencies in
  // circle
  private boolean reorderParams(Process processDefinition, List<Parameter> orderedParams,
      JSONObject context) {
    final List<String> paramsAddedToOrderList = new ArrayList<String>();
    List<Parameter> paramsWithDefaultValue = new ArrayList<Parameter>();
    String dependentDefaultValue = null;
    Parameter parameter = null;
    int i = 0;

    try {

      for (Parameter param : processDefinition.getOBUIAPPParameterList()) {
        if (param.getDefaultValue() != null) {
          paramsWithDefaultValue.add(param);
        } else {
          orderedParams.add(param);
          paramsAddedToOrderList.add(param.getDBColumnName());
        }
      }

      while (!paramsWithDefaultValue.isEmpty()) {
        if (i == paramsWithDefaultValue.size()) {
          log.error("Error getting default values for process: " + processDefinition.getName()
              + ". Default values not properly defined, circle dependencies found");
          return false;
        }
        parameter = paramsWithDefaultValue.get(i);
        if (!isSessionDefaultValue(parameter.getDefaultValue())) {
          orderedParams.add(parameter);
          paramsAddedToOrderList.add(parameter.getDBColumnName());
          paramsWithDefaultValue.remove(i);
          i = 0;
        } else {
          dependentDefaultValue = dependentDefaultValue(parameter.getDefaultValue());
          String inpName = "inp" + Sqlc.TransformaNombreColumna(dependentDefaultValue);
          if (paramsAddedToOrderList.contains(dependentDefaultValue)
              || context.get(inpName) != null) {
            orderedParams.add(parameter);
            paramsAddedToOrderList.add(parameter.getDBColumnName());
            paramsWithDefaultValue.remove(i);
            i = 0;
          } else {
            i++;
          }
        }
      }
    } catch (JSONException e) {
      log.error("Error getting defaults and Filter Expressions for process: " + e.getMessage(), e);
      return false;
    }
    return true;
  }

  private String dependentDefaultValue(String rawDefaultValue) {
    return rawDefaultValue.substring(1, rawDefaultValue.length() - 1);
  }
}
