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
 * All portions are Copyright (C) 2009-2010 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.erpCommon.businessUtility;

import java.io.IOException;
import java.io.PrintWriter;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.hibernate.FetchMode;
import org.hibernate.criterion.Expression;
import org.hibernate.criterion.Order;
import org.openbravo.base.filter.IsIDFilter;
import org.openbravo.base.filter.IsPositiveIntFilter;
import org.openbravo.base.filter.RequestFilter;
import org.openbravo.base.filter.ValueListFilter;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.model.Property;
import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.data.FieldProvider;
import org.openbravo.erpCommon.obps.ActivationKey;
import org.openbravo.erpCommon.utility.ComboTableData;
import org.openbravo.erpCommon.utility.OBError;
import org.openbravo.erpCommon.utility.SQLReturnObject;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.erpCommon.utility.UtilityData;
import org.openbravo.model.ad.access.AuditTrailRaw;
import org.openbravo.model.ad.access.User;
import org.openbravo.model.ad.datamodel.Column;
import org.openbravo.model.ad.datamodel.Table;
import org.openbravo.model.ad.domain.Callout;
import org.openbravo.model.ad.domain.ListTrl;
import org.openbravo.model.ad.domain.Reference;
import org.openbravo.model.ad.system.Language;
import org.openbravo.model.ad.ui.Element;
import org.openbravo.model.ad.ui.ElementTrl;
import org.openbravo.model.ad.ui.Field;
import org.openbravo.model.ad.ui.FieldTrl;
import org.openbravo.model.ad.ui.Form;
import org.openbravo.model.ad.ui.FormTrl;
import org.openbravo.model.ad.ui.Message;
import org.openbravo.model.ad.ui.MessageTrl;
import org.openbravo.model.ad.ui.ProcessTrl;
import org.openbravo.model.ad.ui.Tab;
import org.openbravo.model.ad.ui.Task;
import org.openbravo.model.ad.ui.Window;
import org.openbravo.model.ad.ui.WindowTrl;
import org.openbravo.model.ad.ui.Workflow;
import org.openbravo.xmlEngine.XmlDocument;

public class AuditTrailPopup extends HttpSecureAppServlet {
  private static final long serialVersionUID = 1L;

  private static final String auditActionsReferenceId = "4C36DC179A5F40DC80B3F3798E121152";
  private static final String adMessageIdForProcess = "437";
  private static final String adMessageIdForWindow = "614";
  private static final String adMessageIdForForm = "D9912E810888475ABB8DFF416196FB5E";
  private static final String adMessageIdForCallout = "13F1AE1374AD4054BE7FD3743B56F266";
  private static final String adValRuleIdForFields = "9C6989B15CEA4987A502C0F5FF02B171";

  private static final String[] colNamesHistory = { "time", "action", "user", "process", "field",
      "old_value", "new_value", "rowkey" };
  private static final RequestFilter columnFilterHistory = new ValueListFilter(colNamesHistory);
  private static final RequestFilter directionFilter = new ValueListFilter("asc", "desc");

  public void init(ServletConfig config) {
    super.init(config);
    boolHist = false;
  }

  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException,
      ServletException {
    VariablesSecureApp vars = new VariablesSecureApp(request);

    String accesTabId = vars.getGlobalVariable("inpTabId", "AuditTrail.tabId", IsIDFilter.instance);
    if (!hasGeneralAccess(vars, "W", accesTabId)) {
      // do security check based on tabId passed in
      bdErrorGeneralPopUp(request, response, Utility.messageBD(this, "Error", vars.getLanguage()),
          Utility.messageBD(this, "AccessTableNoView", vars.getLanguage()));
    }

    // all code runs in adminMode to get read access to i.e. Tab,TabTrl,AD_Audit_Trail entities
    boolean oldAdminMode = OBContext.getOBContext().setInAdministratorMode(true);
    try {

      if (vars.commandIn("POPUP_HISTORY")) {
        // popup showing the history of a single record
        checkIfEnabled(request, response, vars);

        removePageSessionVariables(vars);
        vars.removeSessionValue("AuditTrail.tabId");
        vars.removeSessionValue("AuditTrail.tableId");
        vars.removeSessionValue("AuditTrail.recordId");

        // read request params, and save in session
        String tabId = vars.getGlobalVariable("inpTabId", "AuditTrail.tabId", IsIDFilter.instance);
        String tableId = vars.getGlobalVariable("inpTableId", "AuditTrail.tableId",
            IsIDFilter.instance);
        // recordId is optional as popup can be called from empty grid
        String recordId = vars.getGlobalVariable("inpRecordId", "AuditTrail.recordId", false,
            false, false, "", IsIDFilter.instance);
        printPagePopupHistory(response, vars, tabId, tableId, recordId);

      } else if (vars.commandIn("STRUCTURE_HISTORY")) {
        // called from the DataGrid.js STRUCTURE request
        printGridStructureHistory(response, vars);

      } else if (vars.commandIn("DATA_HISTORY")) {
        // called from the DataGrid.js DATA request
        if (vars.getStringParameter("newFilter").equals("1")) {
          removePageSessionVariables(vars);
        }
        String tableId = vars.getGlobalVariable("inpTableId", "AuditTrail.tableId",
            IsIDFilter.instance);
        String tabId = vars.getGlobalVariable("inpTabId", "AuditTrail.tabId", IsIDFilter.instance);
        String recordId = vars.getGlobalVariable("inpRecordId", "AuditTrail.recordId",
            IsIDFilter.instance);

        // filter fields
        String userId = vars.getGlobalVariable("inpUser", "AuditTrail.userId", "",
            IsIDFilter.instance);
        String fieldId = vars.getGlobalVariable("inpField", "AuditTrail.fieldId", "",
            IsIDFilter.instance);
        String dateFrom = vars.getGlobalVariable("inpDateFrom", "AuditTrail.dateFrom", "");
        String dateTo = vars.getGlobalVariable("inpDateTo", "AuditTrail.dateTo", "");

        String strNewFilter = vars.getStringParameter("newFilter");
        String strOffset = vars.getStringParameter("offset", IsPositiveIntFilter.instance);
        String strPageSize = vars.getStringParameter("page_size", IsPositiveIntFilter.instance);
        // not used right now, as grid is defined as non-sortable
        String strSortCols = vars.getInStringParameter("sort_cols", columnFilterHistory);
        String strSortDirs = vars.getInStringParameter("sort_dirs", directionFilter);
        printGridDataHistory(response, vars, tableId, tabId, recordId, userId, fieldId, dateFrom,
            dateTo, strSortCols, strSortDirs, strOffset, strPageSize, strNewFilter);

      } else if (vars.commandIn("POPUP_DELETED")) {
        // popup showing all deleted records of a single tab
        checkIfEnabled(request, response, vars);

        removePageSessionVariables(vars);
        vars.removeSessionValue("AuditTrail.recordId");
        vars.removeSessionValue("AuditTrail.tabId");
        vars.removeSessionValue("AuditTrail.tableId");

        // read request params, and save in session
        String tabId = vars.getGlobalVariable("inpTabId", "AuditTrail.tabId", IsIDFilter.instance);
        String tableId = vars.getGlobalVariable("inpTableId", "AuditTrail.tableId",
            IsIDFilter.instance);

        // recordId is optional as popup can be called from empty grid
        String recordId = vars.getGlobalVariable("inpRecordId", "AuditTrail.recordId", false,
            false, false, "", IsIDFilter.instance);
        printPagePopupDeleted(response, vars, recordId, tabId, tableId);

      } else if (vars.commandIn("STRUCTURE_DELETED")) {
        // called from the DataGrid.js STRUCTURE request
        String tabId = vars.getGlobalVariable("inpTabId", "AuditTrail.tabId", IsIDFilter.instance);
        String tableId = vars.getGlobalVariable("inpTableId", "AuditTrail.tableId",
            IsIDFilter.instance);
        printGridStructureDeleted(response, vars, tabId, tableId);

      } else if (vars.commandIn("DATA_DELETED")) {
        // called from the DataGrid.js DATA request
        if (vars.getStringParameter("newFilter").equals("1")) {
          removePageSessionVariables(vars);
        }
        String tabId = vars.getGlobalVariable("inpTabId", "AuditTrail.tabId", IsIDFilter.instance);
        String tableId = vars.getGlobalVariable("inpTableId", "AuditTrail.tableId",
            IsIDFilter.instance);

        // filter fields
        String dateFrom = vars.getGlobalVariable("inpDateFrom", "AuditTrail.dateFrom", "");
        String dateTo = vars.getGlobalVariable("inpDateTo", "AuditTrail.dateTo", "");
        String userId = vars.getGlobalVariable("inpUser", "AuditTrail.userId", "",
            IsIDFilter.instance);

        String strNewFilter = vars.getStringParameter("newFilter");
        String strOffset = vars.getStringParameter("offset", IsPositiveIntFilter.instance);
        String strPageSize = vars.getStringParameter("page_size", IsPositiveIntFilter.instance);
        // not used right now, as grid is defined as non-sortable
        String strSortCols = vars.getInStringParameter("sort_cols", columnFilterHistory);
        String strSortDirs = vars.getInStringParameter("sort_dirs", directionFilter);
        printGridDataDeleted(response, vars, tabId, tableId, dateFrom, dateTo, userId, strSortCols,
            strSortDirs, strOffset, strPageSize, strNewFilter);
      } else {
        pageError(response);
      }
    } finally {
      OBContext.getOBContext().setInAdministratorMode(oldAdminMode);
    }
  }

  /**
   * If the instance is not activated, show error message.
   */
  private boolean checkIfEnabled(HttpServletRequest request, HttpServletResponse response,
      VariablesSecureApp vars) throws IOException {
    // ActivationKey already initialized in i.e. HSAS, so just take static info
    if (ActivationKey.isActiveInstance()) {
      return true;
    }
    String titleText = Utility.messageBD(this, "AUDIT_TRAIL", vars.getLanguage());
    // <p> in java, to allow multi-paragraph text via the parameter
    String infoText = "<p>" + Utility.messageBD(this, "FEATURE_OBPS_ONLY", vars.getLanguage())
        + "</p>";
    String linkText = Utility.messageBD(this, "LEARN_HOW", vars.getLanguage());
    String afterLinkText = Utility.messageBD(this, "ACTIVATE_INSTANCE", vars.getLanguage());
    showErrorActivatedInstancesOnly(response, vars, titleText, infoText, linkText, afterLinkText);
    return false;
  }

  private void showErrorActivatedInstancesOnly(HttpServletResponse response,
      VariablesSecureApp vars, String titleText, String infoText, String linkText,
      String afterLinkText) throws IOException {
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/obps/ErrorActivatedInstancesOnly").createXmlDocument();

    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    xmlDocument.setParameter("theme", vars.getTheme());
    xmlDocument.setParameter("titleText", titleText);
    xmlDocument.setParameter("infoText", infoText);
    xmlDocument.setParameter("linkText", linkText);
    xmlDocument.setParameter("afterLinkText", afterLinkText);

    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  private void removePageSessionVariables(VariablesSecureApp vars) {
    vars.removeSessionValue("AuditTrail.userId");
    vars.removeSessionValue("AuditTrail.fieldId");
    vars.removeSessionValue("AuditTrail.dateFrom");
    vars.removeSessionValue("AuditTrail.dateTo");
  }

  private void printPagePopupHistory(HttpServletResponse response, VariablesSecureApp vars,
      String tabId, String tableId, String recordId) throws IOException {
    log4j.debug("POPUP-HISTORY - tabId: " + tabId + ", tableId: " + tableId + ", inpRecordId: "
        + recordId);

    XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/businessUtility/AuditTrailPopupHistory").createXmlDocument();

    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    // calendar language has extra parameter
    xmlDocument.setParameter("calendar", vars.getLanguage().substring(0, 2));
    xmlDocument.setParameter("theme", vars.getTheme());

    xmlDocument.setParameter("jsFocusOnField", Utility.focusFieldJS("paramDateFrom"));

    xmlDocument.setParameter("grid", "20");
    xmlDocument.setParameter("grid_Offset", "");
    xmlDocument.setParameter("grid_SortCols", "1");
    xmlDocument.setParameter("grid_SortDirs", "DESC");
    xmlDocument.setParameter("grid_Default", "0");

    // display/save-formats for the datetime fields
    xmlDocument
        .setParameter("dateFromdisplayFormat", vars.getSessionValue("#AD_SqlDateTimeFormat"));
    xmlDocument.setParameter("dateFromsaveFormat", vars.getJavaDateFormat());
    xmlDocument.setParameter("dateTodisplayFormat", vars.getSessionValue("#AD_SqlDateTimeFormat"));
    xmlDocument.setParameter("dateTosaveFormat", vars.getJavaDateFormat());

    // user combobox (restricted to login users only)
    try {
      ComboTableData cmd = new ComboTableData(vars, this, "19", "AD_User_ID", "",
          "C48E4CAE3C2A4C5DBC2E011D8AD2C428", Utility.getContext(this, vars, "#AccessibleOrgTree",
              "AuditTrailPopup"),
          Utility.getContext(this, vars, "#User_Client", "AuditTrailPopup"), 0);
      cmd.fillParameters(null, "AuditTrailPopup", "");
      xmlDocument.setData("reportAD_User_ID", "liststructure", cmd.select(false));
    } catch (Exception e) {
      log4j.error("Error getting adUser combo content", e);
    }

    // fields combobox (filtered to be in same tab)
    try {
      // ad_reference.19 == TableDir
      ComboTableData cmd = new ComboTableData(vars, this, "19", "AD_Field_ID", "",
          adValRuleIdForFields, Utility.getContext(this, vars, "#AccessibleOrgTree",
              "AuditTrailPopup"),
          Utility.getContext(this, vars, "#User_Client", "AuditTrailPopup"), 0);
      SQLReturnObject params = new SQLReturnObject();
      params.setData("AD_Tab_ID", tabId); // parameter for the validation
      cmd.fillParameters(params, "AuditTrailPopup", "");
      xmlDocument.setData("reportAD_Field_ID", "liststructure", cmd.select(false));
    } catch (Exception e) {
      log4j.error("Error getting adField combo content", e);
    }

    String recordStatus;
    String identifier;
    Table table = OBDal.getInstance().get(Table.class, tableId);

    // popup called from a record or empty grid?
    if (recordId.isEmpty()) {
      recordStatus = "AUDIT_HISTORY_RECORD_NONE";
      identifier = "";
    } else {
      // called with a recordId
      // fill current record status/data table
      BaseOBObject bob = OBDal.getInstance().get(table.getName(), recordId);
      if (bob != null) {
        // for existing records we use the current identifier
        recordStatus = "AUDIT_HISTORY_RECORD_EXISTS";
        identifier = bob.getIdentifier();
      } else {
        // for deleted record we build the identifier manually
        recordStatus = "AUDIT_HISTORY_RECORD_DELETED";
        identifier = try2GetIdentifier(table, recordId);
      }
    }

    // name of the business element shown (i.e. Business Partner)
    String elementName = table.getDBTableName() + "_ID";
    String elementNameDisplay;
    String hql = "as e where upper(e.dBColumnName) = :elementName";
    OBQuery<Element> qe = OBDal.getInstance().createQuery(Element.class, hql);
    qe.setNamedParameter("elementName", elementName.toUpperCase());
    Element e = qe.uniqueResult();
    if (e == null) {
      elementNameDisplay = "(deleted)";
    } else {
      elementNameDisplay = getTranslatedElementName(e, OBContext.getOBContext().getLanguage());
    }

    String text = Utility.messageBD(this, recordStatus, vars.getLanguage());
    text = text.replace("@recordidentifier@", identifier);
    text = text.replace("@elementname@", elementNameDisplay);

    xmlDocument.setParameter("recordIdentifierText", text);

    // param for building 'View deleted records' link
    xmlDocument.setParameter("recordId", recordId);
    xmlDocument.setParameter("tabId", tabId);
    xmlDocument.setParameter("tableId", tableId);

    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  private String getTranslatedElementName(Element element, Language language) {
    OBCriteria<ElementTrl> c = OBDal.getInstance().createCriteria(ElementTrl.class);
    c.add(Expression.eq(ElementTrl.PROPERTY_APPLICATIONELEMENT, element));
    c.add(Expression.eq(ElementTrl.PROPERTY_LANGUAGE, language));
    ElementTrl trl = (ElementTrl) c.uniqueResult();
    if (trl == null) {
      return element.getName();
    }
    return trl.getName();
  }

  private String try2GetIdentifier(Table table, String recordId) {
    StringBuilder result = new StringBuilder();

    // loop over identifier columns and concatenate identifier value manually
    // if one of these identifiers cannot be retrieved use fall-back string for it
    Entity tableEntity = ModelProvider.getInstance().getEntity(table.getName());
    for (Property prop : tableEntity.getIdentifierProperties()) {
      // get value for the property from audit data
      OBCriteria<AuditTrailRaw> c = OBDal.getInstance().createCriteria(AuditTrailRaw.class);
      c.add(Expression.eq(AuditTrailRaw.PROPERTY_ACTION, "D"));
      c.add(Expression.eq(AuditTrailRaw.PROPERTY_TABLE, table.getId()));
      c.add(Expression.eq(AuditTrailRaw.PROPERTY_RECORDID, recordId));
      c.add(Expression.eq(AuditTrailRaw.PROPERTY_COLUMN, prop.getColumnId()));
      AuditTrailRaw atr = (AuditTrailRaw) c.uniqueResult();
      String value = "(unknown)";
      if (atr != null) {
        // get formatted old value
        value = getFormattedValue(atr, false);
      }
      result.append(value);
      result.append(" - "); // delimiter between columns
    }
    // remove ' ' after last column
    result.setLength(result.length() - 3);
    return result.toString();
  }

  private void printPagePopupDeleted(HttpServletResponse response, VariablesSecureApp vars,
      String recordId, String tabId, String tableId) throws IOException {
    log4j.debug("POPUP_DELETED - recordId: " + recordId + ", tabId: " + tabId + ", tableId: "
        + tableId);

    XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/businessUtility/AuditTrailPopupDeleted").createXmlDocument();

    xmlDocument.setParameter("directory", "var baseDirectory = \"" + strReplaceWith + "/\";\n");
    xmlDocument.setParameter("language", "defaultLang=\"" + vars.getLanguage() + "\";");
    // calendar language has extra parameter
    xmlDocument.setParameter("calendar", vars.getLanguage().substring(0, 2));
    xmlDocument.setParameter("theme", vars.getTheme());

    xmlDocument.setParameter("jsFocusOnField", Utility.focusFieldJS("paramDateFrom"));

    xmlDocument.setParameter("grid", "20");
    xmlDocument.setParameter("grid_Offset", "");
    xmlDocument.setParameter("grid_SortCols", "1");
    xmlDocument.setParameter("grid_SortDirs", "DESC");
    xmlDocument.setParameter("grid_Default", "0");

    // display/save-formats for the datetime fields
    xmlDocument
        .setParameter("dateFromdisplayFormat", vars.getSessionValue("#AD_SqlDateTimeFormat"));
    xmlDocument.setParameter("dateFromsaveFormat", vars.getJavaDateFormat());
    xmlDocument.setParameter("dateTodisplayFormat", vars.getSessionValue("#AD_SqlDateTimeFormat"));
    xmlDocument.setParameter("dateTosaveFormat", vars.getJavaDateFormat());

    // user combobox (restricted to login users only)
    try {
      ComboTableData cmd = new ComboTableData(vars, this, "19", "AD_User_ID", "",
          "C48E4CAE3C2A4C5DBC2E011D8AD2C428", Utility.getContext(this, vars, "#AccessibleOrgTree",
              "AuditTrailPopup"),
          Utility.getContext(this, vars, "#User_Client", "AuditTrailPopup"), 0);
      cmd.fillParameters(null, "AuditTrailPopup", "");
      xmlDocument.setData("reportAD_User_ID", "liststructure", cmd.select(false));
    } catch (Exception e) {
      log4j.error("Error getting adUser combo content", e);
    }

    // param for building 'Back to history' link
    xmlDocument.setParameter("recordId", recordId);
    xmlDocument.setParameter("tabId", tabId);
    xmlDocument.setParameter("tableId", tableId);

    response.setContentType("text/html; charset=UTF-8");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

  private void printGridStructureHistory(HttpServletResponse response, VariablesSecureApp vars)
      throws IOException, ServletException {
    SQLReturnObject[] data = getHeadersHistory(vars);
    printGridStructureGeneric(data, response, vars);
  }

  private SQLReturnObject[] getHeadersHistory(VariablesSecureApp vars) {
    SQLReturnObject[] data = new SQLReturnObject[colNamesHistory.length];
    boolean[] colSortable = { false, false, false, false, false, false, false, true };
    String[] colWidths = { "120", "60", "60", "120", "96", "150", "150", "0" };
    for (int i = 0; i < colNamesHistory.length; i++) {
      SQLReturnObject dataAux = new SQLReturnObject();
      dataAux.setData("columnname", colNamesHistory[i]);
      dataAux.setData("gridcolumnname", colNamesHistory[i]);
      dataAux.setData("isidentifier", (colNamesHistory[i].equals("rowkey") ? "true" : "false"));
      dataAux.setData("iskey", (colNamesHistory[i].equals("rowkey") ? "true" : "false"));
      dataAux.setData("isvisible", (colNamesHistory[i].endsWith("_id")
          || colNamesHistory[i].equals("rowkey") ? "false" : "true"));
      String name = Utility.messageBD(this, "AUDIT_HISTORY_" + colNamesHistory[i].toUpperCase(),
          vars.getLanguage());
      dataAux.setData("name", (name.startsWith("AUDIT_HISTORY_") ? colNamesHistory[i] : name));
      dataAux.setData("type", "string");
      dataAux.setData("width", colWidths[i]);
      dataAux.setData("issortable", colSortable[i] ? "true" : "false");
      data[i] = dataAux;
    }
    return data;
  }

  private void printGridDataHistory(HttpServletResponse response, VariablesSecureApp vars,
      String tableId, String tabId, String recordId, String userId, String fieldId,
      String strDateFrom, String strDateTo, String strOrderCols, String strOrderDirs,
      String strOffset, String strPageSize, String strNewFilter) throws IOException,
      ServletException {

    log4j.debug("DATA_HISTORY: tableId: " + tableId + " recordId: " + recordId);

    long s1 = System.currentTimeMillis();

    // get list of field-id's, excluding the ones with reference ID (13)
    String hql = "as f where f.tab.id = :tabId and f.column.reference.id <> '13'";
    OBQuery<Field> qf = OBDal.getInstance().createQuery(Field.class, hql);
    qf.setNamedParameter("tabId", tabId);
    List<Field> fieldList = qf.list();
    Map<String, Field> fields = new HashMap<String, Field>(fieldList.size());
    for (Field f : fieldList) {
      fields.put(f.getColumn().getId(), f);
    }

    FieldProvider[] data = null;
    String type = "Hidden";
    String title = "";
    String description = "";
    String strNumRows = "0";
    int offset = Integer.valueOf(strOffset).intValue();
    int pageSize = Integer.valueOf(strPageSize).intValue();

    // parse dateTime filter fields
    String strDateFormat = vars.getJavaDataTimeFormat();
    SimpleDateFormat dateFormat = new SimpleDateFormat(strDateFormat);
    Date dateFrom = parseDate(strDateFrom, dateFormat);
    Date dateTo = parseDate(strDateTo, dateFormat);

    // get columnId matching the fieldId
    String columnId = "";
    if (fieldId != null && !fieldId.isEmpty()) {
      Field field = OBDal.getInstance().get(Field.class, fieldId);
      columnId = field.getColumn().getId();
    }

    try {
      if (strNewFilter.equals("1") || strNewFilter.equals("")) {
        // New filter or first load -> get total rows for filter
        strNumRows = getCountRowsHistory(tableId, fields.keySet(), recordId, userId, columnId,
            dateFrom, dateTo);
        vars.setSessionValue("AuditTrail.numrows", strNumRows);
      } else {
        strNumRows = vars.getSessionValue("AuditTrail.numrows");
      }

      // get data (paged by offset, pageSize)
      data = getDataRowsHistory(tableId, tabId, fields, recordId, userId, columnId, dateFrom,
          dateTo, offset, pageSize, vars.getLanguage());
    } catch (ServletException e) {
      log4j.error("Error getting row data: ", e);
      OBError myError = Utility.translateError(this, vars, vars.getLanguage(), e.getMessage());
      if (!myError.isConnectionAvailable()) {
        bdErrorAjax(response, "Error", "Connection Error", "No database connection");
        return;
      } else {
        type = myError.getType();
        title = myError.getTitle();
        if (!myError.getMessage().startsWith("<![CDATA["))
          description = "<![CDATA[" + myError.getMessage() + "]]>";
        else
          description = myError.getMessage();
      }
    } catch (Exception e) {
      log4j.error("Error getting row data: ", e);
      type = "Error";
      title = "Error";
      if (e.getMessage().startsWith("<![CDATA["))
        description = "<![CDATA[" + e.getMessage() + "]]>";
      else
        description = e.getMessage();
    }

    if (!type.startsWith("<![CDATA["))
      type = "<![CDATA[" + type + "]]>";
    if (!title.startsWith("<![CDATA["))
      title = "<![CDATA[" + title + "]]>";
    if (!description.startsWith("<![CDATA["))
      description = "<![CDATA[" + description + "]]>";
    StringBuffer strRowsData = new StringBuffer();
    strRowsData.append("<xml-data>\n");
    strRowsData.append("  <status>\n");
    strRowsData.append("    <type>").append(type).append("</type>\n");
    strRowsData.append("    <title>").append(title).append("</title>\n");
    strRowsData.append("    <description>").append(description).append("</description>\n");
    strRowsData.append("  </status>\n");
    strRowsData.append("  <rows numRows=\"").append(strNumRows).append("\">\n");
    if (data != null && data.length > 0) {
      for (int j = 0; j < data.length; j++) {
        strRowsData.append("    <tr>\n");
        for (String columnname : colNamesHistory) {
          strRowsData.append("      <td><![CDATA[");
          // formatting already done
          strRowsData.append(data[j].getField(columnname));
          strRowsData.append("]]></td>\n");
        }
        strRowsData.append("    </tr>\n");
      }
    }
    strRowsData.append("  </rows>\n");
    strRowsData.append("</xml-data>\n");

    response.setContentType("text/xml; charset=UTF-8");
    response.setHeader("Cache-Control", "no-cache");
    PrintWriter out = response.getWriter();
    out.print(strRowsData.toString());
    out.close();
    long s2 = System.currentTimeMillis();
    log4j.debug("printGridDataHistory took: " + (s2 - s1));
  }

  private String getCountRowsHistory(String tableId, Collection<String> columnIds, String recordId,
      String userId, String columnId, Date dateFrom, Date dateTo) {
    long s1 = System.currentTimeMillis();

    OBCriteria<AuditTrailRaw> crit = OBDal.getInstance().createCriteria(AuditTrailRaw.class);
    crit.add(Expression.eq(AuditTrailRaw.PROPERTY_TABLE, tableId));
    crit.add(Expression.eq(AuditTrailRaw.PROPERTY_RECORDID, recordId));
    // filter to only show rows which have their column shown in the tab
    crit.add(Expression.in(AuditTrailRaw.PROPERTY_COLUMN, columnIds));
    if (!userId.isEmpty()) {
      crit.add(Expression.eq(AuditTrailRaw.PROPERTY_USERCONTACT, userId));
    }
    if (!columnId.isEmpty()) {
      crit.add(Expression.eq(AuditTrailRaw.PROPERTY_COLUMN, columnId));
    }
    if (dateFrom != null) {
      crit.add(Expression.ge(AuditTrailRaw.PROPERTY_EVENTTIME, dateFrom));
    }
    if (dateTo != null) {
      crit.add(Expression.le(AuditTrailRaw.PROPERTY_EVENTTIME, dateTo));
    }
    int count = crit.count();

    long s2 = System.currentTimeMillis();
    log4j.debug("getCountRowsHistory took: " + (s2 - s1) + " result= " + count);

    return String.valueOf(count);
  }

  private FieldProvider[] getDataRowsHistory(String tableId, String tabId,
      Map<String, Field> tabFields, String recordId, String userId, String columnId, Date dateFrom,
      Date dateTo, int offset, int pageSize, String language) throws ServletException {

    OBCriteria<AuditTrailRaw> crit = OBDal.getInstance().createCriteria(AuditTrailRaw.class);
    crit.add(Expression.eq(AuditTrailRaw.PROPERTY_TABLE, tableId));
    crit.add(Expression.eq(AuditTrailRaw.PROPERTY_RECORDID, recordId));
    // filter to only show rows which have their column shown in the tab
    crit.add(Expression.in(AuditTrailRaw.PROPERTY_COLUMN, tabFields.keySet()));
    crit.addOrder(Order.desc(AuditTrailRaw.PROPERTY_EVENTTIME));
    if (!userId.isEmpty()) {
      crit.add(Expression.eq(AuditTrailRaw.PROPERTY_USERCONTACT, userId));
    }
    if (!columnId.isEmpty()) {
      crit.add(Expression.eq(AuditTrailRaw.PROPERTY_COLUMN, columnId));
    }
    if (dateFrom != null) {
      crit.add(Expression.ge(AuditTrailRaw.PROPERTY_EVENTTIME, dateFrom));
    }
    if (dateTo != null) {
      crit.add(Expression.le(AuditTrailRaw.PROPERTY_EVENTTIME, dateTo));
    }
    crit.setFirstResult(offset);
    crit.setMaxResults(pageSize);
    List<AuditTrailRaw> rows = crit.list();

    /*
     * beautify result logic is kept simple: iterate over main query result and do needed extra
     * queries to get the beautified column output pro: - simple, keep criteria for main query
     * instead of manual hql . with hibernate session cache: query per distinct pk value only con: -
     * subqueries for column beautification instead of a bigger main query
     */
    UtilityData[] actions = UtilityData.selectReference(this, language, auditActionsReferenceId);

    List<SQLReturnObject> resRows = new ArrayList<SQLReturnObject>(rows.size());
    for (AuditTrailRaw row : rows) {
      SQLReturnObject resRow = new SQLReturnObject();
      resRow.setData("time", getFormattedTime(row.getEventTime()));
      resRow.setData("action", getFormattedAction(actions, row.getAction()));
      resRow.setData("user", getFormattedUser(row.getUserContact()));
      resRow.setData("process", getFormattedProcess(row.getProcessType(), row.getProcess()));
      resRow.setData("field", getFormattedField(tabFields, row));
      resRow.setData("old_value", getFormattedValue(row, false));
      resRow.setData("new_value", getFormattedValue(row, true));
      resRow.setData("rowkey", row.getId());
      resRows.add(resRow);
    }

    FieldProvider[] res = new FieldProvider[resRows.size()];
    res = resRows.toArray(res);
    return res;
  }

  private void printGridStructureDeleted(HttpServletResponse response, VariablesSecureApp vars,
      String tabId, String tableId) throws IOException, ServletException {
    SQLReturnObject[] data = getHeadersDeleted(vars, tabId, tableId);
    printGridStructureGeneric(data, response, vars);
  }

  private SQLReturnObject[] getHeadersDeleted(VariablesSecureApp vars, String tabId, String tableId) {

    List<SQLReturnObject> data = new ArrayList<SQLReturnObject>();

    // rowkey
    SQLReturnObject gridCol = new SQLReturnObject();
    gridCol.setData("columnname", "rowkey");
    gridCol.setData("gridcolumnname", "rowkey");
    gridCol.setData("isidentifier", "true");
    gridCol.setData("iskey", "true");
    gridCol.setData("isvisible", "false");
    gridCol.setData("name", "rowkey");
    gridCol.setData("type", "string");
    gridCol.setData("width", "0");
    gridCol.setData("issortable", "true");
    data.add(gridCol);

    // time
    gridCol = new SQLReturnObject();
    gridCol.setData("columnname", "audittrailtime");
    gridCol.setData("gridcolumnname", "audittrailtime");
    gridCol.setData("isidentifier", "false");
    gridCol.setData("iskey", "false");
    gridCol.setData("isvisible", "true");
    String translatedName = Utility.messageBD(this, "AUDIT_HISTORY_TIME", vars.getLanguage());
    gridCol.setData("name", translatedName);
    gridCol.setData("type", "string");
    gridCol.setData("width", "120");
    gridCol.setData("issortable", "true");
    data.add(gridCol);

    // user
    gridCol = new SQLReturnObject();
    gridCol.setData("columnname", "audittrailuser");
    gridCol.setData("gridcolumnname", "audittrailuser");
    gridCol.setData("isidentifier", "false");
    gridCol.setData("iskey", "false");
    gridCol.setData("isvisible", "true");
    translatedName = Utility.messageBD(this, "AUDIT_HISTORY_USER", vars.getLanguage());
    gridCol.setData("name", translatedName);
    gridCol.setData("type", "string");
    gridCol.setData("width", "60");
    gridCol.setData("issortable", "false");
    data.add(gridCol);

    // process
    gridCol = new SQLReturnObject();
    gridCol.setData("columnname", "audittrailprocess");
    gridCol.setData("gridcolumnname", "audittrailprocess");
    gridCol.setData("isidentifier", "false");
    gridCol.setData("iskey", "false");
    gridCol.setData("isvisible", "true");
    translatedName = Utility.messageBD(this, "AUDIT_HISTORY_PROCESS", vars.getLanguage());
    gridCol.setData("name", translatedName);
    gridCol.setData("type", "string");
    gridCol.setData("width", "120");
    gridCol.setData("issortable", "false");
    data.add(gridCol);

    Tab tab = OBDal.getInstance().get(Tab.class, tabId);
    List<Field> fields = getFieldListForTab(vars, tab);
    for (Field field : fields) {
      Column col = field.getColumn();
      gridCol = new SQLReturnObject();
      gridCol.setData("columnname", col.getDBColumnName());
      gridCol.setData("gridcolumnname", col.getDBColumnName());
      gridCol.setData("isidentifier", "false");
      gridCol.setData("iskey", "false");
      gridCol.setData("isvisible", "true");

      // TODO: optimize fetch for translation
      gridCol
          .setData("name", getTranslatedFieldName(field, OBContext.getOBContext().getLanguage()));
      gridCol.setData("type", "string");

      gridCol.setData("width", calculateColumnWidth(field.getDisplayedLength()));
      gridCol.setData("issortable", "false");
      data.add(gridCol);
    }

    SQLReturnObject[] result = new SQLReturnObject[data.size()];
    data.toArray(result);
    return result;
  }

  /**
   * Get the ordered list of fields shown in a grid view of a specific tab.
   */
  private List<Field> getFieldListForTab(VariablesSecureApp vars, Tab tab) {
    OBCriteria<Field> c = OBDal.getInstance().createCriteria(Field.class);
    c.add(Expression.eq(Field.PROPERTY_TAB, tab));
    c.add(Expression.eq(Field.PROPERTY_DISPLAYED, Boolean.TRUE));
    c.add(Expression.eq(Field.PROPERTY_SHOWINGRIDVIEW, Boolean.TRUE));
    c.setFetchMode("column", FetchMode.JOIN); // optimize column association
    c.addOrderBy(Field.PROPERTY_SEQUENCENUMBER, true);
    List<Field> fields = c.list();
    return fields;
  }

  private String getTranslatedFieldName(Field field, Language lang) {
    OBCriteria<FieldTrl> c = OBDal.getInstance().createCriteria(FieldTrl.class);
    c.add(Expression.eq(FieldTrl.PROPERTY_FIELD, field));
    c.add(Expression.eq(FieldTrl.PROPERTY_LANGUAGE, lang));
    FieldTrl trl = (FieldTrl) c.uniqueResult();
    if (trl == null) {
      return field.getName();
    }
    return trl.getName();
  }

  /**
   * Utility method to translate a displayLenth into a column width (in a DataGrid).
   * 
   * Logic needs to be synchronized with TableSQLData.getHeaders
   */
  private String calculateColumnWidth(Long displayLength) {
    long width = displayLength * 6;
    // cap with interval [23..300]
    width = Math.max(23, width);
    width = Math.min(300, width);
    return String.valueOf(width);
  }

  private void printGridDataDeleted(HttpServletResponse response, VariablesSecureApp vars,
      String tabId, String tableId, String strDateFrom, String strDateTo, String userId,
      String strOrderCols, String strOrderDirs, String strOffset, String strPageSize,
      String strNewFilter) throws IOException, ServletException {

    long s1 = System.currentTimeMillis();
    SQLReturnObject[] headers = getHeadersDeleted(vars, tabId, tableId);
    FieldProvider[] data = null;
    String type = "Hidden";
    String title = "";
    String description = "";
    String strNumRows = "0";
    int offset = Integer.valueOf(strOffset).intValue();
    int pageSize = Integer.valueOf(strPageSize).intValue();

    // parse dateTime filter fields
    String strDateFormat = vars.getJavaDataTimeFormat();
    SimpleDateFormat dateFormat = new SimpleDateFormat(strDateFormat);
    // parsing is done to verify dateFormat
    Date dateFrom = parseDate(strDateFrom, dateFormat);
    Date dateTo = parseDate(strDateTo, dateFormat);

    try {
      if (strNewFilter.equals("1") || strNewFilter.equals("")) {
        // New filter or first load
        strNumRows = getCountRowsDeleted(vars, tabId, tableId, offset, pageSize, strDateFrom,
            strDateTo, userId);
        vars.setSessionValue("AuditTrail.numrows", strNumRows);
      } else {
        strNumRows = vars.getSessionValue("AuditTrail.numrows");
      }

      // get data
      data = getDataRowsDeleted(vars, tabId, tableId, offset, pageSize, strDateFrom, strDateTo,
          userId);
    } catch (Exception e) {
      log4j.error("Error getting row data: ", e);
      type = "Error";
      title = "Error";
      if (e.getMessage().startsWith("<![CDATA["))
        description = "<![CDATA[" + e.getMessage() + "]]>";
      else
        description = e.getMessage();
    }

    if (!type.startsWith("<![CDATA["))
      type = "<![CDATA[" + type + "]]>";
    if (!title.startsWith("<![CDATA["))
      title = "<![CDATA[" + title + "]]>";
    if (!description.startsWith("<![CDATA["))
      description = "<![CDATA[" + description + "]]>";
    StringBuffer strRowsData = new StringBuffer();
    strRowsData.append("<xml-data>\n");
    strRowsData.append("  <status>\n");
    strRowsData.append("    <type>").append(type).append("</type>\n");
    strRowsData.append("    <title>").append(title).append("</title>\n");
    strRowsData.append("    <description>").append(description).append("</description>\n");
    strRowsData.append("  </status>\n");
    strRowsData.append("  <rows numRows=\"").append(strNumRows).append("\">\n");
    if (data != null && data.length > 0) {
      for (int j = 0; j < data.length; j++) {
        strRowsData.append("    <tr>\n");
        for (int k = 0; k < headers.length; k++) {
          strRowsData.append("      <td><![CDATA[");
          String columnname = headers[k].getField("columnname");

          String value = data[j].getField(columnname);
          strRowsData.append(value);
          strRowsData.append("]]></td>\n");
        }
        strRowsData.append("    </tr>\n");
      }
    }
    strRowsData.append("  </rows>\n");
    strRowsData.append("</xml-data>\n");

    response.setContentType("text/xml; charset=UTF-8");
    response.setHeader("Cache-Control", "no-cache");
    PrintWriter out = response.getWriter();
    out.print(strRowsData.toString());
    out.close();
    long s2 = System.currentTimeMillis();
    log4j.debug("printGridDataDeleted took: " + (s2 - s1));
  }

  private String getCountRowsDeleted(VariablesSecureApp vars, String tabId, String tableId,
      int offset, int pageSize, String dateFrom, String dateTo, String userId) {
    long s1 = System.currentTimeMillis();
    FieldProvider[] rows = AuditTrailDeletedRecords.getDeletedRecords(this, vars, tabId, 0, 0,
        true, dateFrom, dateTo, userId);
    String countResult = rows[0].getField("counter");
    long t1 = System.currentTimeMillis();

    log4j.debug("getCountRowsDeleted took: " + (t1 - s1) + " result= " + countResult);
    return countResult;
  }

  private FieldProvider[] getDataRowsDeleted(VariablesSecureApp vars, String tabId, String tableId,
      int offset, int pageSize, String dateFrom, String dateTo, String userId) {

    long s1 = System.currentTimeMillis();
    FieldProvider[] rows = AuditTrailDeletedRecords.getDeletedRecords(this, vars, tabId, offset,
        pageSize, false, dateFrom, dateTo, userId);
    long s2 = System.currentTimeMillis();

    /*
     * beautify result logic is kept simple: iterate over main query result and do needed extra
     * queries to get the beautified column output pro: - simple, keep criteria for main query
     * instead of manual hql . with hibernate session cache: query per distinct pk value only con: -
     * subqueries for column beautification instead of a bigger main query
     */
    List<FieldProvider> resRows = new ArrayList<FieldProvider>();
    for (FieldProvider row : rows) {
      // copy and beautify
      SQLReturnObject resRow = new SQLReturnObject();
      Tab tab = OBDal.getInstance().get(Tab.class, tabId);
      // copy static fields to result
      resRow.setData("rowkey", row.getField("rowkey"));
      resRow.setData("audittrailtime", row.getField("audittrailtime"));
      resRow.setData("audittrailuser", getFormattedUser(row.getField("audittrailuser")));
      resRow.setData("audittrailprocess", getFormattedProcess(
          row.getField("audittrailprocesstype"), row.getField("audittrailprocessid")));
      // copy and beautify data columns
      for (Field field : tab.getADFieldList()) {
        // no need to format hidden fields
        if (!field.isShowInGridView() || !field.isDisplayed()) {
          continue;
        }
        Column col = field.getColumn();
        String value = row.getField(col.getDBColumnName());
        // beautify it
        value = getFormattedValue(col, value);
        resRow.setData(col.getDBColumnName(), value);
      }
      resRows.add(resRow);

    }

    long s3 = System.currentTimeMillis();
    log4j.debug("getDataRowsDeleted: getRows:" + (s2 - s1) + " beautifyRows: " + (s3 - s2));

    FieldProvider[] res = new FieldProvider[resRows.size()];
    resRows.toArray(res);
    return res;
  }

  /**
   * Helper function which returns the old value from a audit row. Essentially
   * coalesce(old_char,old_nchar,old_date,old_number)
   * 
   * @param row
   *          audit record
   * @return the old value from that row
   */
  private static String getOld(AuditTrailRaw row) {
    String result;
    result = row.getOldChar();
    if (result == null) {
      result = row.getOldNChar();
    }
    if (result == null && row.getOldDate() != null) {
      result = String.valueOf(row.getOldDate());
    }
    if (result == null && row.getOldNumber() != null) {
      result = String.valueOf(row.getOldNumber());
    }
    return result;
  }

  /**
   * Helper function which returns the new value from a audit row. Essentially coalesce(new_char,
   * new_nchar, new_date, new_number)
   * 
   * @param row
   *          audit record
   * @return the new value from that row
   */
  private static String getNew(AuditTrailRaw row) {
    String result;
    result = row.getNewChar();
    if (result == null) {
      result = row.getNewNChar();
    }
    if (result == null && row.getNewDate() != null) {
      result = String.valueOf(row.getNewDate());
    }
    if (result == null && row.getNewNumber() != null) {
      result = String.valueOf(row.getNewNumber());
    }
    return result;
  }

  private static String getFormattedTime(Date time) {
    // currently no-op
    return String.valueOf(time);
  }

  /*
   * translate action reference value into translated reference list name, as list of distinct
   * values is small do one query for all outside of the loop
   */
  private static String getFormattedAction(final UtilityData[] actions, String action) {
    for (UtilityData theAction : actions) {
      if (theAction.value.equals(action)) {
        return theAction.name;
      }
    }
    return action;
  }

  private static String getFormattedUser(String userId) {
    if (userId == null) {
      return " ";
    }
    User u = OBDal.getInstance().get(User.class, userId);
    return u.getName();
  }

  /**
   * Map a pair of (processType,process) to a user displayValue by looking up the matching model
   * object names.
   * 
   * The definition of processType is taken from org.openbravo.base.secureApp.ClassInfoData.select
   * 
   * @param processType
   *          char defining which table the process parameter points to
   * @param process
   *          uuid pointing to a model table defined via processType
   */
  private String getFormattedProcess(String processType, String process) {
    if (processType == null || process == null) {
      return " ";
    }

    if ("X".equals(processType)) {
      String formLabel = getTranslatedMessage(adMessageIdForForm);
      return formLabel + ": " + getTranslatedFormName(process);
    }
    if ("P".equals(processType) || "R".equals(processType)) {
      String processLabel = getTranslatedMessage(adMessageIdForProcess);
      return processLabel + ": " + getTranslatedProcessName(process);
    }
    // no translation for the next four, as either no _trl table exists, or the application elements
    // are not used/don't trigger db-changes
    if ("T".equals(processType)) {
      return "Task: " + OBDal.getInstance().get(Task.class, process).getName();
    }
    if ("S".equals(processType)) {
      return "Reference: " + OBDal.getInstance().get(Reference.class, process).getName();
    }
    if ("F".equals(processType)) {
      return "Workflow: " + OBDal.getInstance().get(Workflow.class, process).getName();
    }
    if ("C".equals(processType)) {
      String calloutLabel = getTranslatedMessage(adMessageIdForCallout);
      return calloutLabel + ": " + OBDal.getInstance().get(Callout.class, process).getName();
    }
    // all other cases -> Tab
    String windowLabel = getTranslatedMessage(adMessageIdForWindow);
    return windowLabel + ": " + getTranslatedWindowName(process);
  }

  private String getTranslatedMessage(String msgId) {
    Message msg = OBDal.getInstance().get(Message.class, msgId);
    OBCriteria<MessageTrl> c = OBDal.getInstance().createCriteria(MessageTrl.class);
    c.add(Expression.eq(MessageTrl.PROPERTY_MESSAGE, msg));
    c.add(Expression.eq(MessageTrl.PROPERTY_LANGUAGE, OBContext.getOBContext().getLanguage()));
    MessageTrl trl = (MessageTrl) c.uniqueResult();
    if (trl == null) {
      return msg.getMessageText();
    }
    return trl.getMessageText();
  }

  private String getTranslatedWindowName(String tabId) {
    Window w = OBDal.getInstance().get(Tab.class, tabId).getWindow();
    OBCriteria<WindowTrl> c = OBDal.getInstance().createCriteria(WindowTrl.class);
    c.add(Expression.eq(WindowTrl.PROPERTY_WINDOW, w));
    c.add(Expression.eq(WindowTrl.PROPERTY_LANGUAGE, OBContext.getOBContext().getLanguage()));
    WindowTrl trl = (WindowTrl) c.uniqueResult();
    if (trl == null) {
      return w.getName();
    }
    return trl.getName();
  }

  private String getTranslatedProcessName(String processId) {
    org.openbravo.model.ad.ui.Process p = OBDal.getInstance().get(
        org.openbravo.model.ad.ui.Process.class, processId);
    OBCriteria<ProcessTrl> c = OBDal.getInstance().createCriteria(ProcessTrl.class);
    c.add(Expression.eq(ProcessTrl.PROPERTY_PROCESS, p));
    c.add(Expression.eq(ProcessTrl.PROPERTY_LANGUAGE, OBContext.getOBContext().getLanguage()));
    ProcessTrl trl = (ProcessTrl) c.uniqueResult();
    if (trl == null) {
      return p.getName();
    }
    return trl.getName();
  }

  private String getTranslatedFormName(String formId) {
    Form f = OBDal.getInstance().get(Form.class, formId);
    OBCriteria<FormTrl> c = OBDal.getInstance().createCriteria(FormTrl.class);
    c.add(Expression.eq(FormTrl.PROPERTY_SPECIALFORM, f));
    c.add(Expression.eq(FormTrl.PROPERTY_LANGUAGE, OBContext.getOBContext().getLanguage()));
    FormTrl trl = (FormTrl) c.uniqueResult();
    if (trl == null) {
      return f.getName();
    }
    return trl.getName();
  }

  // TODO: optimize trl fetching
  private String getFormattedField(Map<String, Field> tabFields, AuditTrailRaw auditRow) {
    Field field = tabFields.get(auditRow.getColumn());

    String fieldNameTranslated = getTranslatedFieldName(field, OBContext.getOBContext()
        .getLanguage());
    return fieldNameTranslated;
  }

  private String getFormattedValue(AuditTrailRaw auditRow, boolean newValue) {
    String value = newValue ? getNew(auditRow) : getOld(auditRow);
    Column col = OBDal.getInstance().get(Column.class, auditRow.getColumn());
    return getFormattedValue(col, value);
  }

  private String getFormattedValue(Column col, String value) {
    if (col == null) {
      // column might have been deleted in the model
      return value;
    }

    // no need to follow a null into some reference
    if (value == null) {
      // translate null into an empty String for display
      return " ";
    }

    Table table = col.getTable();
    Entity tableEntity = ModelProvider.getInstance().getEntity(table.getName());

    String referenceName = col.getReference().getName();

    Property colProperty = tableEntity.getPropertyByColumnName(col.getDBColumnName());
    Entity targetEntity = colProperty.getTargetEntity();
    Property referencedCp = colProperty.getReferencedProperty();

    // cannot be handled by generic targetEntity/referencedProperty code below
    if (referenceName.equals("List")) {
      Reference colListRef = col.getReferenceSearchKey();
      return getTranslatedListValueName(colListRef, value);
    }

    // generic handling of fk-lookup via targetEntity/referencedProperty
    // handles Table,TableDir,Search for now, and all new reference types providing
    // targetEntity/referencedProperty
    if (targetEntity != null) {
      // try generic lookup or fk-target value
      if (referencedCp == null) {
        // use targetEntity's pk as lookup key (like in TableDir case)
        return getFkTargetIdentifierViaPK(col, value);
      }
      return getFkTargetIdentifierViaReferencedColumn(targetEntity.getName(), referencedCp
          .getName(), value);
    }

    // no special formatting for reference value -> just return the value
    return value;
  }

  private String getFkTargetIdentifierViaPK(Column col, String fkValue) {
    Table table = col.getTable();
    Entity tableEntity = ModelProvider.getInstance().getEntity(table.getName());

    String targetIdentifier = fkValue;
    BaseOBObject bob = OBDal.getInstance().get(
        tableEntity.getPropertyByColumnName(col.getDBColumnName()).getTargetEntity().getName(),
        fkValue);
    targetIdentifier = (bob != null) ? bob.getIdentifier() : "(deleted)";
    return targetIdentifier;
  }

  private String getFkTargetIdentifierViaReferencedColumn(String targetEntityName,
      String referencedPropertyName, String value) {
    OBCriteria<BaseOBObject> c = OBDal.getInstance().createCriteria(targetEntityName);
    c.add(Expression.eq(referencedPropertyName, value));
    BaseOBObject bob = (BaseOBObject) c.uniqueResult();
    if (bob != null) {
      String targetIdentifier = (bob != null) ? bob.getIdentifier() : "(deleted)";
      return targetIdentifier;
    }
    return "(deleted)";
  }

  /**
   * The the translated (fall-back untranslated) name of a value of a specific list reference.
   * 
   * @param listRef
   *          the list reference
   * @param value
   *          the value
   * @return translated name of the value in the listRef
   */
  private String getTranslatedListValueName(Reference listRef, String value) {
    OBCriteria<org.openbravo.model.ad.domain.List> critList = OBDal.getInstance().createCriteria(
        org.openbravo.model.ad.domain.List.class);
    critList.add(Expression.eq(org.openbravo.model.ad.domain.List.PROPERTY_REFERENCE, listRef));
    critList.add(Expression.eq(org.openbravo.model.ad.domain.List.PROPERTY_SEARCHKEY, value));
    org.openbravo.model.ad.domain.List list = (org.openbravo.model.ad.domain.List) critList
        .uniqueResult();
    if (list == null) {
      return value;
    }
    // check if we have a translation
    OBCriteria<ListTrl> critListTrl = OBDal.getInstance().createCriteria(ListTrl.class);
    critListTrl.add(Expression.eq(ListTrl.PROPERTY_LISTREFERENCE, list));
    critListTrl.add(Expression
        .eq(ListTrl.PROPERTY_LANGUAGE, OBContext.getOBContext().getLanguage()));
    ListTrl trl = (ListTrl) critListTrl.uniqueResult();
    if (trl != null) {
      return trl.getName();
    } else {
      return list.getName();
    }
  }

  /**
   * Helper function to parse a string with the specified date-format into a date object.
   * 
   * @param inputDate
   *          string to parse
   * @param format
   *          dateFormat of the string
   * @return date object or null on parse error
   */
  private Date parseDate(String inputDate, SimpleDateFormat format) {
    if (inputDate != null && !inputDate.isEmpty()) {
      try {
        return format.parse(inputDate);
      } catch (ParseException pe) {
        log4j.error("Could not parse dateTo", pe);
      }
    }
    return null;
  }

  /**
   * Utility method which print the response to a DataGrid's STRUCTURE request.
   * 
   * @param headers
   *          array describing the list of column shown in the grid
   */
  private void printGridStructureGeneric(SQLReturnObject[] headers, HttpServletResponse response,
      VariablesSecureApp vars) throws IOException, ServletException {
    XmlDocument xmlDocument = xmlEngine.readXmlTemplate(
        "org/openbravo/erpCommon/utility/DataGridStructure").createXmlDocument();

    String type = "Hidden";
    String title = "";
    String description = "";

    xmlDocument.setParameter("type", type);
    xmlDocument.setParameter("title", title);
    xmlDocument.setParameter("description", description);
    xmlDocument.setData("structure1", headers);
    response.setContentType("text/xml; charset=UTF-8");
    response.setHeader("Cache-Control", "no-cache");
    PrintWriter out = response.getWriter();
    out.println(xmlDocument.print());
    out.close();
  }

}
