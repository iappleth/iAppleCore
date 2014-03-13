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
package org.openbravo.client.application.window;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;
import org.openbravo.client.application.DynamicExpressionParser;
import org.openbravo.client.application.Parameter;
import org.openbravo.client.application.Process;
import org.openbravo.client.kernel.reference.UIDefinition;
import org.openbravo.client.kernel.reference.UIDefinitionController;
import org.openbravo.dal.core.DalUtil;
import org.openbravo.dal.core.OBContext;
import org.openbravo.model.ad.domain.ListTrl;
import org.openbravo.model.ad.domain.Reference;
import org.openbravo.model.ad.ui.FieldGroup;
import org.openbravo.model.ad.ui.Tab;
import org.openbravo.model.ad.ui.Window;

public class OBViewParameterHandler {
  private static final Logger log = Logger.getLogger(OBViewParameterHandler.class);
  private static final String WINDOW_REFERENCE_ID = "FF80818132D8F0F30132D9BC395D0038";
  private static final int NUMBER_COLUMNS = 4;
  private Process process;
  private ParameterWindowComponent paramWindow;

  public void setProcess(Process process) {
    this.process = process;
  }

  public List<OBViewParameter> getParameters() {

    List<Parameter> parametersInExpression = new ArrayList<Parameter>();

    // Computes the display logic of the parameters
    // It has to be done in advance in order to determine the dynamic parameters
    Map<Parameter, String> displayLogicMap = new HashMap<Parameter, String>();
    for (Parameter param : process.getOBUIAPPParameterList()) {
      if (param.isActive() && param.getDisplayLogic() != null && !param.getDisplayLogic().isEmpty()) {
        final DynamicExpressionParser parser = new DynamicExpressionParser(param.getDisplayLogic(),
            param.getObuiappProcess(), true);
        displayLogicMap.put(param, parser.getJSExpression());
        for (Parameter parameterExpression : parser.getParameters()) {
          if (!parametersInExpression.contains(parameterExpression)) {
            parametersInExpression.add(parameterExpression);
          }
        }
      }
    }

    // Computes read-only logic
    Map<Parameter, String> readOnlyLogicMap = new HashMap<Parameter, String>();
    for (Parameter param : process.getOBUIAPPParameterList()) {
      if (param.isActive() && !param.isFixed() && param.getReadOnlyLogic() != null
          && !param.getReadOnlyLogic().isEmpty()) {
        final DynamicExpressionParser parser = new DynamicExpressionParser(
            param.getReadOnlyLogic(), param.getObuiappProcess(), true);
        readOnlyLogicMap.put(param, parser.getJSExpression());
        for (Parameter parameterExpression : parser.getParameters()) {
          if (!parametersInExpression.contains(parameterExpression)) {
            parametersInExpression.add(parameterExpression);
          }
        }
      }
    }

    List<OBViewParameter> params = new ArrayList<OBViewParameterHandler.OBViewParameter>();
    OBViewParamGroup currentGroup = null;
    FieldGroup currentADFieldGroup = null;
    int pos = 1;
    for (Parameter param : process.getOBUIAPPParameterList()) {

      if (!(param.isActive()
          && (!param.isFixed() || param.getReference().getId().equals(WINDOW_REFERENCE_ID)) && (!param
          .getReference().getId().equals(ParameterWindowComponent.BUTTON_LIST_REFERENCE_ID)))) {
        continue;
      }

      // change in fieldgroup
      if (param.getFieldGroup() != null && param.getFieldGroup() != currentADFieldGroup) {
        OBViewParamGroup group = new OBViewParamGroup();
        params.add(group);
        group.setFieldGroup(param.getFieldGroup());

        currentGroup = group;
        currentADFieldGroup = param.getFieldGroup();
      }

      if (currentGroup != null) {
        currentGroup.addChild(param);
      }

      OBViewParameter parameter = new OBViewParameter(param);
      parameter.setRedrawOnChange(parametersInExpression.contains(param));
      if (displayLogicMap.containsKey(param)) {
        parameter.setShowIf(displayLogicMap.get(param));
      }

      if (readOnlyLogicMap.containsKey(param)) {
        parameter.setReadOnlyIf(readOnlyLogicMap.get(param));
      }
      // 17 is the list reference
      if (param.getReferenceSearchKey() != null
          && param.getReferenceSearchKey().getParentReference() != null
          && DalUtil.getId(param.getReferenceSearchKey().getParentReference()).equals("17")) {
        parameter.addListReferenceValues(param.getReferenceSearchKey());
      }

      // Add spacers to order the field in the column number defined
      if (param.isStartinnewline()) {
        pos = 0;
      }
      if (pos > NUMBER_COLUMNS) {
        pos = pos - NUMBER_COLUMNS;
      }

      if (param.getNumcolumn() != null) {
        int spaces = 0;
        if (pos > param.getNumcolumn().intValue()) {
          spaces = NUMBER_COLUMNS - (pos - param.getNumcolumn().intValue());
        } else {
          spaces = param.getNumcolumn().intValue() - pos;
        }
        for (int i = 0; i < spaces; i++) {
          final OBViewParamSpacer spacer = new OBViewParamSpacer();
          params.add(spacer);
          pos++;
        }

      }
      params.add(parameter);
      pos++;

    }
    return params;
  }

  public class OBViewParameter {
    UIDefinition uiDefinition;
    Parameter parameter;
    String showIf = "";
    String readOnlyIf = "";
    boolean redrawOnChange = false;
    List<ValueMapValue> valueMap = new ArrayList<ValueMapValue>();

    public OBViewParameter() {

    }

    public OBViewParameter(Parameter param) {
      uiDefinition = UIDefinitionController.getInstance().getUIDefinition(param.getReference());
      parameter = param;
    }

    public boolean isValueMapPresent() {
      return !valueMap.isEmpty();
    }

    public List<ValueMapValue> getValueMap() {
      Collections.sort(valueMap, new Comparator<ValueMapValue>() {
        @Override
        public int compare(ValueMapValue v1, ValueMapValue v2) {
          final long seqno1 = v1.seqno;
          final long seqno2 = v2.seqno;

          // compare the names if no seqno set.
          if (seqno1 == -1 || seqno2 == -1) {
            return v1.getValue().compareTo(v2.getValue());
          }

          return (int) (seqno1 - seqno2);
        }
      });
      return valueMap;
    }

    public void addListReferenceValues(Reference reference) {
      for (org.openbravo.model.ad.domain.List list : reference.getADListList()) {
        if (list.isActive()) {
          addListValueReference(list);
        }
      }
    }

    public void addListValueReference(org.openbravo.model.ad.domain.List listValue) {
      String name = listValue.getName();
      final String languageId = OBContext.getOBContext().getLanguage().getId();
      for (ListTrl listTrl : listValue.getADListTrlList()) {
        if (!listTrl.isActive()) {
          continue;
        }
        if (DalUtil.getId(listTrl.getLanguage()).equals(languageId)) {
          name = listTrl.getName();
          break;
        }
      }
      final ValueMapValue vmv = new ValueMapValue(listValue.getSearchKey(), name,
          listValue.getSequenceNumber());
      valueMap.add(vmv);
    }

    public String getId() {
      return parameter.getId();
    }

    public String getType() {
      return uiDefinition != null ? uiDefinition.getName() : "--";
    }

    public String getTitle() {
      return OBViewUtil.getLabel(parameter, parameter.getOBUIAPPParameterTrlList());
    }

    public String getName() {
      return parameter.getDBColumnName();
    }

    public boolean isRequired() {
      return parameter.isMandatory();
    }

    public boolean isGrid() {
      return parameter.getReferenceSearchKey() != null
          && parameter.getReferenceSearchKey().getOBUIAPPRefWindowList().size() > 0;
    }

    public String getTabView() {
      Window window;

      if (parameter.getReferenceSearchKey().getOBUIAPPRefWindowList().size() == 0
          || parameter.getReferenceSearchKey().getOBUIAPPRefWindowList().get(0).getWindow() == null) {
        return null;
      } else {
        window = parameter.getReferenceSearchKey().getOBUIAPPRefWindowList().get(0).getWindow();
      }

      if (window.getADTabList().isEmpty()) {
        log.error("Window definition " + window.getName() + " has no tabs");
        return null;
      }

      Tab tab = window.getADTabList().get(0);

      final OBViewTab tabComponent = paramWindow.createComponent(OBViewTab.class);
      tabComponent.setTab(tab);
      return tabComponent.generate();
    }

    public String getParameterProperties() {
      String jsonString = uiDefinition.getParameterProperties(parameter).trim();
      if (jsonString == null || jsonString.trim().length() == 0) {
        return "";
      }
      // strip the first and last { }
      if (jsonString.startsWith("{") && jsonString.endsWith("}")) {
        // note -2 is done because the first substring takes of 1 already
        return "," + jsonString.substring(1).substring(0, jsonString.length() - 2);
      } else if (jsonString.equals("{}")) {
        return "";
      }
      // be lenient just return the string as it is...
      return ","
          + (jsonString.trim().endsWith(",") ? jsonString.substring(0, jsonString.length() - 2)
              : jsonString);
    }

    public void setShowIf(String showIf) {
      this.showIf = showIf;
    }

    public String getShowIf() {
      return showIf;
    }

    public void setReadOnlyIf(String readOnlyIf) {
      this.readOnlyIf = readOnlyIf;
    }

    public String getReadOnlyIf() {
      return readOnlyIf;
    }

    public boolean getRedrawOnChange() {
      return redrawOnChange;
    }

    public void setRedrawOnChange(boolean redrawOnChange) {
      this.redrawOnChange = redrawOnChange;
    }

    public String getWidth() {
      return this.uiDefinition.getParameterWidth(this.parameter);
    }

    public Long getLength() {
      if (parameter == null || parameter.getLength() == 0L) {
        return -1L;
      }
      return parameter.getLength();
    }

    public class ValueMapValue {
      final String key;
      final String value;
      final long seqno;

      ValueMapValue(String key, String value, Long seqno) {
        this.key = key;
        this.value = value;
        this.seqno = (seqno != null ? seqno : -1);
      }

      public String getKey() {
        return key;
      }

      public String getValue() {
        return value;
      }

      public long getSeqno() {
        return seqno;
      }
    }
  }

  public class OBViewParamGroup extends OBViewParameter {
    private FieldGroup fieldGroup;
    private List<Parameter> children = new ArrayList<Parameter>();

    @Override
    public String getType() {
      return "OBSectionItem";
    }

    public void setFieldGroup(FieldGroup fieldGroup) {
      this.fieldGroup = fieldGroup;
    }

    @Override
    public String getName() {
      return fieldGroup.getId();
    }

    @Override
    public String getTitle() {
      return OBViewUtil.getLabel(fieldGroup, fieldGroup.getADFieldGroupTrlList());
    }

    @Override
    public boolean isGrid() {
      return false;
    }

    public void addChild(Parameter param) {
      children.add(param);
    }

    public List<Parameter> getChildren() {
      return children;
    }

    public boolean isExpanded() {
      return !(fieldGroup.isCollapsed() == null ? false : fieldGroup.isCollapsed());
    }
  }

  public class OBViewParamSpacer extends OBViewParameter {
    @Override
    public String getType() {
      return "spacer";
    }

    public String getName() {
      return "";
    }

    public boolean getPersonalizable() {
      return false;

    }

    public boolean isGrid() {
      return false;
    }

    public String getTitle() {
      return "";
    }

    public String getId() {
      return "";
    }

    public String getWidth() {
      return "";
    }

    public boolean isRequired() {
      return false;
    }

    public String getParameterProperties() {
      return "";
    }

  }

  public void setParamWindow(ParameterWindowComponent parameterWindowComponent) {
    this.paramWindow = parameterWindowComponent;
  }
}
