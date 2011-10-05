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
 * All portions are Copyright (C) 2010-2011 Openbravo SLU
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
import org.openbravo.base.model.Property;
import org.openbravo.base.model.domaintype.ForeignKeyDomainType;
import org.openbravo.client.application.ApplicationUtils;
import org.openbravo.client.application.DynamicExpressionParser;
import org.openbravo.client.kernel.BaseTemplateComponent;
import org.openbravo.client.kernel.KernelUtils;
import org.openbravo.client.kernel.Template;
import org.openbravo.client.kernel.reference.FKSearchUIDefinition;
import org.openbravo.client.kernel.reference.UIDefinition;
import org.openbravo.client.kernel.reference.UIDefinitionController;
import org.openbravo.dal.service.OBDal;
import org.openbravo.data.Sqlc;
import org.openbravo.model.ad.ui.Element;
import org.openbravo.model.ad.ui.Field;
import org.openbravo.model.ad.ui.FieldGroup;
import org.openbravo.model.ad.ui.Tab;

/**
 * The backing bean for generating the OBViewForm client-side representation.
 * 
 * @author mtaal
 * @author iperdomo
 */

public class OBViewFormComponent extends BaseTemplateComponent {

  private static final String TEMPLATE_ID = "C1D176407A354A40815DC46D24D70EB8";
  private static Logger log = Logger.getLogger(OBViewFormComponent.class);

  private String parentProperty;

  private static final long ONE_COLUMN_MAX_LENGTH = 60;
  private static final String TEXT_AD_REFERENCE_ID = "14";
  private static final String IMAGEBLOB_AD_REFERENCE_ID = "4AA6C3BE9D3B4D84A3B80489505A23E5";

  private static final String AUDIT_GROUP_ID = "1000100001";
  private static final String MORE_INFO_GROUP_ID = "402880E72F1C15A5012F1C7AA98B00E8";

  private Tab tab;
  private List<String> statusBarFields = new ArrayList<String>();

  private String templateId = TEMPLATE_ID;

  protected Template getComponentTemplate() {
    return OBDal.getInstance().get(Template.class, templateId);
  }

  public Tab getTab() {
    return tab;
  }

  public void setTab(Tab tab) {
    this.tab = tab;
  }

  public List<OBViewFieldDefinition> getFields() {

    final List<OBViewFieldDefinition> fields = new ArrayList<OBViewFieldDefinition>();
    final List<Field> adFields = new ArrayList<Field>(tab.getADFieldList());
    Collections.sort(adFields, new FormFieldComparator());

    final List<Field> fieldsInDynamicExpression = new ArrayList<Field>();
    final Map<Field, String> displayLogicMap = new HashMap<Field, String>();
    final Map<Field, String> readOnlyLogicMap = new HashMap<Field, String>();

    // Processing dynamic expressions (display logic)
    for (Field f : adFields) {
      if (f.getDisplayLogic() == null || f.getDisplayLogic().equals("") || !f.isActive()
          || !f.isDisplayed()) {
        continue;
      }

      final DynamicExpressionParser parser = new DynamicExpressionParser(f.getDisplayLogic(), tab);
      displayLogicMap.put(f, parser.getJSExpression());

      log.debug(f.getTab().getId() + " - " + f.getName() + " >>> " + parser.getJSExpression());

      for (Field fieldExpression : parser.getFields()) {
        if (!fieldsInDynamicExpression.contains(fieldExpression)) {
          fieldsInDynamicExpression.add(fieldExpression);
        }
      }
    }

    // Processing dynamic expression (read-only logic)
    for (Field f : adFields) {
      if (f.getColumn().getReadOnlyLogic() == null || f.getColumn().getReadOnlyLogic().equals("")
          || !f.isActive() || !f.getColumn().isActive()) {
        continue;
      }

      final DynamicExpressionParser parser = new DynamicExpressionParser(f.getColumn()
          .getReadOnlyLogic(), tab);
      readOnlyLogicMap.put(f, parser.getJSExpression());

      log.debug(f.getTab().getId() + " - " + f.getName() + " >>> " + parser.getJSExpression());

      for (Field fieldExpression : parser.getFields()) {
        if (!fieldsInDynamicExpression.contains(fieldExpression)) {
          fieldsInDynamicExpression.add(fieldExpression);
        }
      }
    }

    // Processing audit fields: if there's field for audit, don't put it in the "more info" section
    boolean hasCreatedField = false, hasCreatedByField = false, hasUpdatedField = false, hasUpdatedByField = false;
    for (Field f : adFields) {
      String dbColName = f.getColumn().getDBColumnName().toLowerCase();
      if (!dbColName.startsWith("created") && !dbColName.startsWith("updated")) {
        continue;
      }
      if (f.isActive() && f.getColumn().isActive() && (f.isDisplayed() || f.isShownInStatusBar())) {
        if ("created".equals(dbColName)) {
          hasCreatedField = true;
        } else if ("createdby".equals(dbColName)) {
          hasCreatedByField = true;
        } else if ("updated".equals(dbColName)) {
          hasUpdatedField = true;
        } else if ("updatedby".equals(dbColName)) {
          hasUpdatedByField = true;
        }
      }
    }
    List<OBViewFieldDefinition> auditFields = new ArrayList<OBViewFieldDefinition>();

    if (!hasCreatedField) {
      OBViewFieldAudit audit = new OBViewFieldAudit("creationDate", OBViewUtil.createdElement);
      auditFields.add(audit);
    }
    if (!hasCreatedByField) {
      OBViewFieldAudit audit = new OBViewFieldAudit("createdBy", OBViewUtil.createdByElement);
      auditFields.add(audit);
    }
    if (!hasUpdatedField) {
      OBViewFieldAudit audit = new OBViewFieldAudit("updated", OBViewUtil.updatedElement);
      auditFields.add(audit);
    }
    if (!hasUpdatedByField) {
      OBViewFieldAudit audit = new OBViewFieldAudit("updatedBy", OBViewUtil.updatedByElement);
      auditFields.add(audit);
    }

    OBViewFieldGroup currentFieldGroup = null;
    FieldGroup currentADFieldGroup = null;
    int colNum = 1;
    for (Field field : adFields) {

      if (field.getColumn() == null || !field.isActive() || !field.isDisplayed()
          || ApplicationUtils.isUIButton(field)) {
        continue;
      }

      final Property property = KernelUtils.getInstance().getPropertyFromColumn(field.getColumn(),
          false);

      final OBViewField viewField = new OBViewField();
      viewField.setField(field);
      viewField.setProperty(property);
      viewField.setRedrawOnChange(fieldsInDynamicExpression.contains(field));
      viewField.setShowIf(displayLogicMap.get(field) != null ? displayLogicMap.get(field) : "");
      viewField.setReadOnlyIf(readOnlyLogicMap.get(field) != null ? readOnlyLogicMap.get(field)
          : "");
      // Positioning some fields in odd-columns
      if (colNum % 2 == 0 && (field.isStartinoddcolumn() || viewField.getColSpan() == 2)) {
        final OBViewFieldSpacer spacer = new OBViewFieldSpacer();
        fields.add(spacer);
        colNum++;
        if (colNum > 4) {
          colNum = 1;
        }
      }

      // change in fieldgroup
      if (field.getFieldGroup() != null && field.getFieldGroup() != currentADFieldGroup) {
        // start of a fieldgroup use it
        final OBViewFieldGroup viewFieldGroup = new OBViewFieldGroup();
        fields.add(viewFieldGroup);
        viewFieldGroup.setFieldGroup(field.getFieldGroup());

        currentFieldGroup = viewFieldGroup;
        currentADFieldGroup = field.getFieldGroup();
        colNum = 1;
      }

      fields.add(viewField);

      if (currentFieldGroup != null) {
        currentFieldGroup.addChild(viewField);
      }

      colNum += viewField.getColSpan();
      if (colNum > 4) {
        colNum = 1;
      }
    }

    // Add audit info
    if (!auditFields.isEmpty()) {
      final OBViewFieldGroup viewFieldGroup = new OBViewFieldGroup();
      viewFieldGroup.setType("OBAuditSectionItem");
      viewFieldGroup.setPersonalizable(false);
      fields.add(viewFieldGroup);
      viewFieldGroup.setFieldGroup(OBDal.getInstance().get(FieldGroup.class, AUDIT_GROUP_ID));
      viewFieldGroup.addChildren(auditFields);
      fields.addAll(auditFields);
    }

    // add the notes part
    final OBViewFieldDefinition notesCanvasFieldDefinition = new NotesCanvasField();
    final NotesField notesField = new NotesField();
    notesField.setChildField(notesCanvasFieldDefinition);
    fields.add(notesField);
    fields.add(notesCanvasFieldDefinition);

    // add the linked items part
    final OBViewFieldDefinition linkedItemsCanvasFieldDefinition = new LinkedItemsCanvasField();
    final LinkedItemsField linkedItemsField = new LinkedItemsField();
    linkedItemsField.setChildField(linkedItemsCanvasFieldDefinition);
    fields.add(linkedItemsField);
    fields.add(linkedItemsCanvasFieldDefinition);

    // add the attachments part
    final AttachmentsCanvasField attachmentsCanvas = new AttachmentsCanvasField();
    final AttachmentsField attachmentDefinition = new AttachmentsField();
    attachmentDefinition.setChildField(attachmentsCanvas);
    fields.add(attachmentDefinition);
    fields.add(attachmentsCanvas);

    // add status bar fields
    processStatusBarFields(fields, adFields);

    return fields;
  }

  public List<String> getStatusBarFields() {
    if (statusBarFields == null) {
      log.warn("Calling getStatusBarFields without initializing fields cache");
      return Collections.emptyList();
    }
    return statusBarFields;
  }

  private void processStatusBarFields(List<OBViewFieldDefinition> fields, List<Field> adFields) {
    for (Field field : adFields) {

      if (field.isShownInStatusBar() == null || !field.isShownInStatusBar()) {
        continue;
      }

      final Property property = KernelUtils.getInstance().getPropertyFromColumn(field.getColumn(),
          false);

      statusBarFields.add(property.getName());

      if (field.isDisplayed()) {
        continue;
      }

      final OBViewField viewField = new OBViewField();
      viewField.setField(field);
      viewField.setProperty(property);
      viewField.setRedrawOnChange(false);
      viewField.setShowIf("");
      viewField.setReadOnlyIf("");

      fields.add(viewField);
    }
  }

  private interface OBViewFieldDefinition {
    public String getLabel();

    public String getName();

    public String getType();

    public boolean getStandardField();

    public boolean isPersonalizable();

    public String getFieldProperties();

    public String getInpColumnName();

    public String getReferencedKeyColumnName();

    public String getTargetEntity();

    public boolean getStartRow();

    public boolean getEndRow();

    public long getColSpan();

    public long getRowSpan();

    public boolean isReadOnly();

    public boolean isUpdatable();

    public boolean isParentProperty();

    public boolean getRedrawOnChange();

    public String getShowIf();

    public String getReadOnlyIf();

    public boolean isDisplayed();

    public boolean getHasDefaultValue();
  }

  public class OBViewFieldAudit implements OBViewFieldDefinition {
    private String name;
    private String refType;
    private String refEntity;
    private Element element;

    public OBViewFieldAudit(String type, Element element) {
      name = type;
      this.element = element;

      if (type.endsWith("By")) {
        // User search
        refType = "30";
        refEntity = "User";
      } else {
        // Date time
        refType = "16";
        refEntity = "";
      }
    }

    @Override
    public String getLabel() {
      return OBViewUtil.getLabel(element, element.getADElementTrlList());
    }

    @Override
    public String getName() {
      return name;
    }

    @Override
    public String getType() {
      return "_id_" + refType;
    }

    @Override
    public boolean getStandardField() {
      return true;
    }

    @Override
    public String getFieldProperties() {
      return "'width': '*', ";
    }

    @Override
    public String getInpColumnName() {
      return "";
    }

    @Override
    public String getReferencedKeyColumnName() {
      return "";
    }

    public boolean getHasDefaultValue() {
      return false;
    }

    @Override
    public String getTargetEntity() {
      return refEntity;
    }

    @Override
    public boolean getStartRow() {
      return false;
    }

    @Override
    public boolean getEndRow() {
      return false;
    }

    @Override
    public long getColSpan() {
      return 1;
    }

    @Override
    public long getRowSpan() {
      return 1;
    }

    @Override
    public boolean isReadOnly() {
      return true;
    }

    @Override
    public boolean isUpdatable() {
      return false;
    }

    public boolean isPersonalizable() {
      return false;
    }

    @Override
    public boolean isParentProperty() {
      return false;
    }

    @Override
    public boolean getRedrawOnChange() {
      return false;
    }

    @Override
    public String getShowIf() {
      return "";
    }

    @Override
    public String getReadOnlyIf() {
      return "";
    }

    public boolean isRequired() {
      return false;
    }

    public String getColumnName() {
      return "";
    }

    public boolean isFirstFocusedField() {
      return false;
    }

    public boolean isSearchField() {
      return !refEntity.isEmpty();
    }

    public boolean isDisplayed() {
      return true;
    }
  }

  public class OBViewField implements OBViewFieldDefinition {
    private Field field;
    private Property property;
    private String label;
    private UIDefinition uiDefinition;
    private Boolean isParentProperty = null;
    private boolean redrawOnChange = false;
    private String showIf = "";
    private String readOnlyIf = "";

    /**
     * @deprecated use {@link #setRedrawOnChange(boolean)}
     */
    @Deprecated
    public void setReadrawOnChange(boolean value) {
      this.setRedrawOnChange(value);
    }

    public boolean isReadOnly() {
      return isParentProperty() || field.isReadOnly();
    }

    public boolean isUpdatable() {
      return property.isUpdatable();
    }

    public boolean isPersonalizable() {
      return true;
    }

    public boolean isParentProperty() {
      if (isParentProperty == null) {
        if (OBViewFormComponent.this.getParentProperty() == null) {
          isParentProperty = false;
        } else {
          isParentProperty = OBViewFormComponent.this.getParentProperty()
              .equals(property.getName());
        }
      }
      return isParentProperty;
    }

    public boolean isSearchField() {
      return uiDefinition instanceof FKSearchUIDefinition;
    }

    public boolean isFirstFocusedField() {
      Boolean focused = field.isFirstFocusedField();
      Boolean displayed = field.isDisplayed();
      return focused != null && focused && displayed != null && displayed;
    }

    public String getType() {
      return getUIDefinition().getName();
    }

    public boolean getHasDefaultValue() {
      return field.getColumn().getDefaultValue() != null;
    }

    public String getFieldProperties() {

      String jsonString = getUIDefinition().getFieldProperties(field).trim();
      if (jsonString == null || jsonString.trim().length() == 0) {
        return "";
      }
      // strip the first and last { }
      if (jsonString.startsWith("{") && jsonString.endsWith("}")) {
        // note -2 is done because the first substring takes of 1 already
        return jsonString.substring(1).substring(0, jsonString.length() - 2) + ",";
      } else if (jsonString.equals("{}")) {
        return "";
      }
      // be lenient just return the string as it is...
      return jsonString + (jsonString.trim().endsWith(",") ? "" : ",");
    }

    private UIDefinition getUIDefinition() {
      if (uiDefinition != null) {
        return uiDefinition;
      }
      uiDefinition = UIDefinitionController.getInstance().getUIDefinition(property.getColumnId());
      return uiDefinition;
    }

    public String getName() {
      return property.getName();
    }

    public String getColumnName() {
      return property.getColumnName();
    }

    public String getInpColumnName() {
      return "inp" + Sqlc.TransformaNombreColumna(property.getColumnName());
    }

    public String getReferencedKeyColumnName() {
      if (property.isOneToMany() || property.isPrimitive()) {
        return "";
      }
      Property prop;
      if (property.getReferencedProperty() == null) {
        prop = property.getTargetEntity().getIdProperties().get(0);
      } else {
        prop = property.getReferencedProperty();
      }
      return prop.getColumnName();
    }

    public String getTargetEntity() {
      if (property.isOneToMany() || property.isPrimitive()) {
        return "";
      }
      return property.getTargetEntity().getName();
    }

    public String getLabel() {
      // compute the label
      if (label == null) {
        label = OBViewUtil.getLabel(field);
      }
      return label;
    }

    public void setLabel(String label) {
      this.label = label;
    }

    public Field getField() {
      return field;
    }

    public void setField(Field field) {
      this.field = field;
    }

    public boolean getStandardField() {
      return true;
    }

    public Property getProperty() {
      return property;
    }

    public void setProperty(Property property) {
      this.property = property;
    }

    public boolean isRequired() {
      // booleans are never required as their input only allows 2 values
      if (property.isBoolean()) {
        return false;
      }

      if (field.getColumn() != null) {
        // Taking value from AD definition, mandatoriness of a column can be different in AD and in
        // memory model, because memory model sets mandatoriness regarding physical DB definition.
        return field.getColumn().isMandatory();
      } else {
        return property.isMandatory();
      }
    }

    public int getLength() {
      return property.getFieldLength();
    }

    public boolean getForeignKeyField() {
      return property.getDomainType() instanceof ForeignKeyDomainType;
    }

    public String getDataSourceId() {
      return property.getTargetEntity().getName();
    }

    public long getColSpan() {
      if (field.getObuiappColspan() != null) {
        return field.getObuiappColspan();
      }
      return field.getDisplayedLength() > ONE_COLUMN_MAX_LENGTH
          || (getRowSpan() == 2 && !property.getDomainType().getReference().getId()
              .equals(IMAGEBLOB_AD_REFERENCE_ID)) ? 2 : 1;
    }

    public boolean getEndRow() {
      return false;
    }

    public long getRowSpan() {
      if (field.getObuiappRowspan() != null) {
        return field.getObuiappRowspan();
      }
      if (property.getDomainType().getReference().getId().equals(TEXT_AD_REFERENCE_ID)) {
        return 2;
      }
      if (property.getDomainType().getReference().getId().equals(IMAGEBLOB_AD_REFERENCE_ID)) {
        return 2;
      }
      return 1;
    }

    public boolean getStartRow() {
      return field.isStartnewline();
    }

    public void setRedrawOnChange(boolean redrawOnChange) {
      this.redrawOnChange = redrawOnChange;
    }

    public boolean getRedrawOnChange() {
      return redrawOnChange;
    }

    public void setShowIf(String showIf) {
      this.showIf = showIf;
    }

    public String getShowIf() {
      return showIf;
    }

    public void setReadOnlyIf(String readOnlyExpression) {
      this.readOnlyIf = readOnlyExpression;
    }

    public String getReadOnlyIf() {
      return readOnlyIf;
    }

    public boolean isDisplayed() {
      return field.isDisplayed() != null && field.isDisplayed();
    }
  }

  public class DefaultVirtualField implements OBViewFieldDefinition {

    public String getFieldProperties() {
      return "";
    }

    public boolean getHasDefaultValue() {
      return false;
    }

    public boolean isReadOnly() {
      return false;
    }

    public boolean isUpdatable() {
      return true;
    }

    public boolean isParentProperty() {
      return false;
    }

    public boolean isPersonalizable() {
      return false;
    }

    public String getInpColumnName() {
      return "";
    }

    public String getReferencedKeyColumnName() {
      return "";
    }

    public String getTargetEntity() {
      return "";
    }

    public long getColSpan() {
      return 4;
    }

    public boolean getEndRow() {
      return true;
    }

    public long getRowSpan() {
      return 1;
    }

    public boolean getStartRow() {
      return true;
    }

    public boolean getStandardField() {
      return false;
    }

    public String getLabel() {
      return "";
    }

    public String getName() {
      return "";
    }

    public String getType() {
      return "";
    }

    public boolean getRedrawOnChange() {
      return false;
    }

    public String getShowIf() {
      return "";
    }

    public String getReadOnlyIf() {
      return "";
    }

    public boolean isDisplayed() {
      return true;
    }
  }

  public class OBViewFieldGroup extends DefaultVirtualField {

    private boolean expanded = true;
    private String type;
    private FieldGroup fieldGroup;
    private String label;
    private List<OBViewFieldDefinition> children = new ArrayList<OBViewFieldDefinition>();
    private boolean personalizable = true;

    public OBViewFieldGroup() {
      type = "OBSectionItem";
    }

    public boolean isPersonalizable() {
      return personalizable;
    }

    public String getLabel() {
      // compute the label
      if (label == null) {
        label = OBViewUtil.getLabel(fieldGroup, fieldGroup.getADFieldGroupTrlList());
      }
      return label;
    }

    public void setLabel(String label) {
      this.label = label;
    }

    public FieldGroup getFieldGroup() {
      return fieldGroup;
    }

    public void setFieldGroup(FieldGroup fieldGroup) {
      if (AUDIT_GROUP_ID.equals(fieldGroup.getId())
          || MORE_INFO_GROUP_ID.equals(fieldGroup.getId())) {
        expanded = false;
      }

      this.fieldGroup = fieldGroup;
    }

    public void addChild(OBViewFieldDefinition viewFieldDefinition) {
      children.add(viewFieldDefinition);
    }

    public void addChildren(List<OBViewFieldDefinition> viewFieldDefinitions) {
      children.addAll(viewFieldDefinitions);
    }

    public List<OBViewFieldDefinition> getChildren() {
      return children;
    }

    public String getType() {
      return type;
    }

    public void setType(String type) {
      this.type = type;
    }

    public String getName() {
      return fieldGroup.getId();
    }

    public boolean isExpanded() {
      return expanded;
    }

    public void setExpanded(boolean expanded) {
      this.expanded = expanded;
    }

    public boolean isDisplayed() {
      for (OBViewFieldDefinition child : children) {
        if (child.isDisplayed()) {
          return true;
        }
      }
      return false;
    }

    public void setPersonalizable(boolean personalizable) {
      this.personalizable = personalizable;
    }
  }

  public class AttachmentsCanvasField extends DefaultVirtualField {

    public String getName() {
      return "_attachments_Canvas";
    }

    public String getType() {
      return "OBAttachmentCanvasItem";
    }

  }

  public class AttachmentsField extends DefaultVirtualField {

    private OBViewFieldDefinition childField;

    public String getLabel() {
      // is set at runtime
      return "dummy";
    }

    public boolean getEndRow() {
      return true;
    }

    public List<OBViewFieldDefinition> getChildren() {
      return Collections.singletonList(childField);

    }

    public String getType() {
      return "OBAttachmentsSectionItem";
    }

    public boolean getStartRow() {
      return true;
    }

    public boolean getRedrawOnChange() {
      return false;
    }

    public String getName() {
      return "_attachments_";
    }

    public OBViewFieldDefinition getChildField() {
      return childField;
    }

    public void setChildField(OBViewFieldDefinition childField) {
      this.childField = childField;
    }

    public boolean isExpanded() {
      return false;
    }
  }

  public class LinkedItemsField extends DefaultVirtualField {

    private OBViewFieldDefinition childField;

    public String getLabel() {
      // is set at runtime
      return "dummy";
    }

    public boolean getEndRow() {
      return true;
    }

    public List<OBViewFieldDefinition> getChildren() {
      return Collections.singletonList(childField);

    }

    public String getType() {
      return "OBLinkedItemSectionItem";
    }

    public boolean getStartRow() {
      return true;
    }

    public boolean getRedrawOnChange() {
      return false;
    }

    public String getName() {
      return "_linkedItems_";
    }

    public OBViewFieldDefinition getChildField() {
      return childField;
    }

    public void setChildField(OBViewFieldDefinition childField) {
      this.childField = childField;
    }

    public boolean isExpanded() {
      return false;
    }
  }

  private class LinkedItemsCanvasField extends DefaultVirtualField {

    public String getLabel() {
      // is set at runtime
      return "dummy";
    }

    @SuppressWarnings("unused")
    public List<OBViewFieldDefinition> getChildren() {
      return Collections.emptyList();
    }

    public String getType() {
      return "OBLinkedItemCanvasItem";
    }

    public String getName() {
      return "_linkedItems_Canvas";
    }
  }

  public class NotesField extends DefaultVirtualField {

    private OBViewFieldDefinition childField;

    public String getLabel() {
      // is set at runtime
      return "dummy";
    }

    public boolean getEndRow() {
      return true;
    }

    public List<OBViewFieldDefinition> getChildren() {
      return Collections.singletonList(childField);

    }

    public String getType() {
      return "OBNoteSectionItem";
    }

    public boolean getStartRow() {
      return true;
    }

    public boolean getRedrawOnChange() {
      return false;
    }

    public String getName() {
      return "_notes_";
    }

    public OBViewFieldDefinition getChildField() {
      return childField;
    }

    public void setChildField(OBViewFieldDefinition childField) {
      this.childField = childField;
    }

    public boolean isExpanded() {
      return false;
    }
  }

  private class NotesCanvasField extends DefaultVirtualField {

    public String getLabel() {
      // is set at runtime
      return "dummy";
    }

    @SuppressWarnings("unused")
    public List<OBViewFieldDefinition> getChildren() {
      return Collections.emptyList();
    }

    public String getType() {
      return "OBNoteCanvasItem";
    }

    public String getName() {
      return "_notes_Canvas";
    }

  }

  public class OBViewFieldSpacer implements OBViewFieldDefinition {

    public boolean isPersonalizable() {
      return false;
    }

    public boolean getHasDefaultValue() {
      return false;
    }

    public long getColSpan() {
      return 1;
    }

    public boolean getEndRow() {
      return false;
    }

    public boolean isReadOnly() {
      return false;
    }

    public boolean isUpdatable() {
      return true;
    }

    public boolean isParentProperty() {
      return false;
    }

    public String getFieldProperties() {
      return "";
    }

    public String getInpColumnName() {
      return "";
    }

    public String getLabel() {
      return "";
    }

    public String getName() {
      return "";
    }

    public String getReferencedKeyColumnName() {
      return "";
    }

    public String getTargetEntity() {
      return "";
    }

    public long getRowSpan() {
      return 1;
    }

    public boolean getStandardField() {
      return false;
    }

    public boolean getStartRow() {
      return false;
    }

    public String getType() {
      return "spacer";
    }

    public boolean getRedrawOnChange() {
      return false;
    }

    public String getShowIf() {
      return "";
    }

    public String getReadOnlyIf() {
      return "";
    }

    public boolean isDisplayed() {
      return true;
    }

  }

  public static class FormFieldComparator implements Comparator<Field> {

    /**
     * Fields with null sequence number are in the bottom of the form. In case multiple null
     * sequences, it is sorted by field UUID.
     */
    @Override
    public int compare(Field arg0, Field arg1) {
      Long arg0Position = arg0.getSequenceNumber();
      Long arg1Position = arg1.getSequenceNumber();

      if (arg0Position == null && arg1Position == null) {
        return arg0.getId().compareTo(arg1.getId());
      } else if (arg0Position == null) {
        return 1;
      } else if (arg1Position == null) {
        return -1;
      }

      return (int) (arg0Position - arg1Position);
    }

  }

  public String getParentProperty() {
    return parentProperty;
  }

  public void setParentProperty(String parentProperty) {
    this.parentProperty = parentProperty;
  }

  public void setTemplateId(String templateId) {
    this.templateId = templateId;
  }
}
