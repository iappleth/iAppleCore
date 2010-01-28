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
package org.openbravo.reference.ui;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Properties;
import java.util.Vector;

import javax.servlet.ServletException;

import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.database.ConnectionProvider;
import org.openbravo.erpCommon.businessUtility.BuscadorData;
import org.openbravo.erpCommon.utility.SQLReturnObject;
import org.openbravo.erpCommon.utility.TableSQLData;
import org.openbravo.service.db.DalConnectionProvider;
import org.openbravo.utils.FormatUtilities;

/**
 * Base implementation for UI objects
 * 
 */
public class UIReference {

  protected String reference;
  protected String subReference;
  // addSecondaryFilter is used to add a "to" filter in the standard getFilter method
  protected boolean addSecondaryFilter;
  protected ConnectionProvider conn;
  protected String strReplaceWith;

  public UIReference(String reference, String subreference) {
    this.reference = reference;
    this.subReference = subreference;
    this.addSecondaryFilter = false;
    this.conn = new DalConnectionProvider();
  }

  /**
   * Generates the sql needed for TableSQLData class
   */
  public void generateSQL(TableSQLData table, Properties field) throws Exception {
    identifier(table, table.getTableName(), field, field.getProperty("ColumnName"), table
        .getTableName()
        + "." + field.getProperty("ColumnName"), false);
  }

  /**
   * Helper method called from generateSQL to create the SQL for the identifier
   */
  protected void identifier(TableSQLData tableSql, String parentTableName, Properties field,
      String identifierName, String realName, boolean tableRef) throws Exception {
    if (field == null)
      return;

    if (!UIReferenceUtility.checkTableTranslation(tableSql, parentTableName, field, reference,
        identifierName, realName, tableRef)) {
      tableSql.addSelectField(UIReferenceUtility.formatField(reference, tableSql, (parentTableName
          + "." + field.getProperty("ColumnName"))), identifierName);
    }
  }

  /**
   * Obtains the type of data to be shown in the grid mode
   * 
   */
  public String getGridType() {
    return "string";
  }

  /**
   * Includes the needed casting (TO_DATE...) to compose SQL
   */
  public String addSQLCasting(String column) {
    return column;
  }

  /**
   * Obtains filter for TableSQLData
   */
  public void getFilter(SQLReturnObject result, boolean isNewFilter, VariablesSecureApp vars,
      TableSQLData tableSQL, Vector<String> filter, Vector<String> filterParams, Properties prop)
      throws Exception {
    String aux;
    if (isNewFilter) {
      aux = vars.getRequestGlobalVariable("inpParam" + prop.getProperty("ColumnName"), tableSQL
          .getTabID()
          + "|param" + prop.getProperty("ColumnName"));
    } else {
      aux = vars.getSessionValue(tableSQL.getTabID() + "|param" + prop.getProperty("ColumnName"));
    }
    // The filter is not applied if the parameter value is null or
    // parameter value is '%' for string references.
    if (!aux.equals("")) {
      UIReferenceUtility.addFilter(filter, filterParams, result, tableSQL, prop
          .getProperty("ColumnName"), prop.getProperty("ColumnName"), reference, true, aux);
    }
    if (addSecondaryFilter) {
      aux = vars.getRequestGlobalVariable("inpParam" + prop.getProperty("ColumnName") + "_f",
          tableSQL.getTabID() + "|param" + prop.getProperty("ColumnName") + "_f");
      if (!aux.equals("")) {
        UIReferenceUtility.addFilter(filter, filterParams, result, tableSQL, prop
            .getProperty("ColumnName"), prop.getProperty("ColumnName") + "_f", reference, false,
            aux);
      }
    }
  }

  /**
   * This method is called to show the value in the grid, it is intended to format the value
   * properly
   * 
   * @param vars
   */
  public String formatGridValue(VariablesSecureApp vars, String value) {
    return value;
  }

  /**
   * Generates the HTML code for the input used to display the reference in the filter popup
   */
  public void generateFilterHtml(StringBuffer strHtml, VariablesSecureApp vars,
      BuscadorData fields, String strTab, String strWindow, StringBuffer script, String strIsSOTrx,
      ArrayList<String> vecScript, Vector<Object> vecKeys) throws IOException, ServletException {
    if ((Integer.valueOf(fields.fieldlength).intValue() > UIReferenceUtility.MAX_TEXTBOX_LENGTH)) {
      // Memo replace with reference 1-2-3 cells doing < MAX_TEXTBOX_LENGTH/4 /2 > /2
      strHtml.append("<td>");
      strHtml
          .append("<textarea class=\"dojoValidateValid TextArea_TwoCells_width TextArea_Medium_height\" ");
      strHtml.append("name=\"inpParam").append(FormatUtilities.replace(fields.columnname)).append(
          "\" ");
      strHtml.append("cols=\"50\" rows=\"3\" ");
      strHtml.append(">");
      strHtml.append(fields.value);
      strHtml.append("</textarea>\n");
    } else {
      strHtml.append("<td class=\"TextBox_ContentCell\">");
      strHtml.append("<input type=\"text\" class=\"dojoValidateValid TextBox_OneCell_width\" ");
      strHtml.append("name=\"inpParam").append(FormatUtilities.replace(fields.columnname)).append(
          "\" ");
      strHtml.append("maxlength=\"").append(fields.fieldlength).append("\" ");
      strHtml.append("value=\"").append(fields.value).append("\" ");
      strHtml.append(">");
      strHtml.append("</td>");
    }
  }

  /**
   * Generates the body for the accept (aceptar) script called from filter pop-up when OK button is
   * clicked.
   */
  public void generateFilterAcceptScript(BuscadorData field, StringBuffer params,
      StringBuffer paramsData) {
    paramsData.append("paramsData[count++] = new Array(\"inpParam").append(
        FormatUtilities.replace(field.columnname)).append("\" , ");
    params.append(", \"inpParam").append(FormatUtilities.replace(field.columnname)).append("\",");
    params.append(" escape(");

    paramsData.append("frm.inpParam").append(FormatUtilities.replace(field.columnname)).append(
        ".value);\n");

    params.append("frm.inpParam").append(FormatUtilities.replace(field.columnname))
        .append(".value");

    if (addSecondaryFilter) {
      paramsData.append("paramsData[count++] = new Array(\"inpParam").append(
          FormatUtilities.replace(field.columnname)).append("_f\", ");
      paramsData.append("frm.inpParam").append(FormatUtilities.replace(field.columnname)).append(
          "_f.value);\n");
      params.append("), \"inpParam").append(FormatUtilities.replace(field.columnname)).append(
          "_f\",");
      params.append(" escape(");
      params.append("frm.inpParam").append(FormatUtilities.replace(field.columnname)).append(
          "_f.value");
    }

    params.append(")");
  }

  public void setReplaceWith(String replaceWith) {
    this.strReplaceWith = replaceWith;
  }

  public boolean hasSecondaryFilter() {
    return addSecondaryFilter;
  }

}
