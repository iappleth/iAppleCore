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
 * All portions are Copyright (C) 2001-2009 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.erpCommon.utility;

import java.util.Enumeration;
import java.util.Properties;
import java.util.StringTokenizer;
import java.util.Vector;

import org.apache.log4j.Logger;
import org.openbravo.base.secureApp.VariablesSecureApp;
import org.openbravo.database.ConnectionProvider;

/**
 * @author Fernando Iriazabal
 * 
 *         Implements the common tasks needed to build the query of the windows.
 */
public class ModelSQLGeneration {
  static Logger log4j = Logger.getLogger(ModelSQLGeneration.class);

  /**
   * Constructor
   */
  public ModelSQLGeneration() {
  }

  /**
   * Gets the order by clause.
   * 
   * @param vars
   *          Handler for the session info.
   * @param tableSQL
   *          Handler for the query builder.
   * @return Vector with the list of fields in the order by clause.
   * @throws Exception
   */
  private static Vector<String> getOrderBy(VariablesSecureApp vars, TableSQLData tableSQL)
      throws Exception {
    Vector<String> vOrderBy = new Vector<String>();
    StringBuffer orderBy = new StringBuffer();
    if (tableSQL == null)
      return vOrderBy;
    String sortCols = vars.getInStringParameter("sort_cols");
    String sortDirs = vars.getInStringParameter("sort_dirs");

    if (log4j.isDebugEnabled())
      log4j.debug("sort_cols: " + sortCols);
    if (log4j.isDebugEnabled())
      log4j.debug("sort_dirs: " + sortDirs);

    if (sortCols != null && sortCols.length() > 0) {
      if (sortCols.startsWith("("))
        sortCols = sortCols.substring(1, sortCols.length() - 1);
      if (sortDirs.startsWith("("))
        sortDirs = sortDirs.substring(1, sortDirs.length() - 1);
      StringTokenizer datas = new StringTokenizer(sortCols, " ,", false);
      StringTokenizer dirs = new StringTokenizer(sortDirs, " ,", false);
      while (datas.hasMoreTokens()) {
        String token = datas.nextToken();
        String tokenDir = dirs.nextToken();
        if (token.startsWith("'"))
          token = token.substring(1, token.length() - 1);
        if (tokenDir.startsWith("'"))
          tokenDir = tokenDir.substring(1, tokenDir.length() - 1);
        token = token.trim();
        tokenDir = tokenDir.trim();
        if (!token.equals("")) {
          vOrderBy.addElement(tableSQL.getTableName() + "." + token + " " + tokenDir);
          if (!orderBy.toString().equals(""))
            orderBy.append(", ");
          orderBy.append(tableSQL.getTableName()).append(".").append(token).append(" ").append(
              tokenDir);
        }
      }
    }
    vars.setSessionValue(tableSQL.getTabID() + "|orderby", orderBy.toString());
    vars.setSessionValue(tableSQL.getTabID() + "|orderbySimple", orderBy.toString());
    return vOrderBy;
  }

  /**
   * Returns the filter clause to apply to the query.
   * 
   * @param vars
   *          Handler for the session info.
   * @param tableSQL
   *          Handler for the query builder.
   * @param filter
   *          Vector with specific filters.
   * @param filterParams
   *          Vector with the parameters for the specific filters.
   * @return Object with the filters defined.
   * @throws Exception
   */
  private static SQLReturnObject getFilter(VariablesSecureApp vars, TableSQLData tableSQL,
      Vector<String> filter, Vector<String> filterParams) throws Exception {
    SQLReturnObject result = new SQLReturnObject();
    if (tableSQL == null)
      return result;
    boolean isNewFilter = !vars.getStringParameter("newFilter").equals("");
    Vector<Properties> filters = tableSQL.getFilteredStructure("IsSelectionColumn", "Y");
    if (filters == null || filters.size() == 0)
      filters = tableSQL.getFilteredStructure("IsIdentifier", "Y");
    if (filters == null || filters.size() == 0)
      return result;
    tableSQL.addAuditFields(filters);
    if (isNewFilter) {
      for (Enumeration<Properties> e = filters.elements(); e.hasMoreElements();) {
        Properties prop = e.nextElement();
        String aux = vars.getRequestGlobalVariable("inpParam" + prop.getProperty("ColumnName"),
            tableSQL.getTabID() + "|param" + prop.getProperty("ColumnName"));
        // The filter is not applied if the parameter value is null or
        // parameter value is '%' for string references.
        if (!aux.equals("")) {
          if (!aux.equals("%")
              || (!prop.getProperty("AD_Reference_ID").equals("10")
                  && !prop.getProperty("AD_Reference_ID").equals("14")
                  && !prop.getProperty("AD_Reference_ID").equals("34") || !prop.getProperty(
                  "AD_Reference_ID").equals("35"))) {
            filter.addElement(formatFilter(tableSQL.getTableName(), prop.getProperty("ColumnName"),
                prop.getProperty("AD_Reference_ID"), true));
            filterParams.addElement("Param" + prop.getProperty("ColumnName"));
            result.setData("Param" + prop.getProperty("ColumnName"), aux);
          } else {
            filter.addElement("1=1");
          }
        }
        final String adRefId = prop.getProperty("AD_Reference_ID");
        if (Utility.isDecimalNumber(adRefId) || Utility.isIntegerNumber(adRefId)
            || Utility.isDateTime(adRefId)) {
          aux = vars.getRequestGlobalVariable("inpParam" + prop.getProperty("ColumnName") + "_f",
              tableSQL.getTabID() + "|param" + prop.getProperty("ColumnName") + "_f");
          if (!aux.equals("")) {
            filter.addElement(formatFilter(tableSQL.getTableName(), prop.getProperty("ColumnName"),
                prop.getProperty("AD_Reference_ID"), false));
            filterParams.addElement("Param" + prop.getProperty("ColumnName") + "_f");
            result.setData("Param" + prop.getProperty("ColumnName") + "_f", aux);
          }
        }
      }
    } else {
      for (Enumeration<Properties> e = filters.elements(); e.hasMoreElements();) {
        Properties prop = e.nextElement();
        String aux = vars.getSessionValue(tableSQL.getTabID() + "|param"
            + prop.getProperty("ColumnName"));
        // The filter is not applied if the parameter value is null or
        // parameter value is '%' for string references.
        if (!aux.equals("")) {
          if (!aux.equals("%")
              || (!prop.getProperty("AD_Reference_ID").equals("10")
                  && !prop.getProperty("AD_Reference_ID").equals("14") && !prop.getProperty(
                  "AD_Reference_ID").equals("34"))) {
            filter.addElement(formatFilter(tableSQL.getTableName(), prop.getProperty("ColumnName"),
                prop.getProperty("AD_Reference_ID"), true));
            filterParams.addElement("Param" + prop.getProperty("ColumnName"));
            result.setData("Param" + prop.getProperty("ColumnName"), aux);
          } else {
            filter.addElement("1=1");
          }
        }
        final String adRefId = prop.getProperty("AD_Reference_ID");
        if (Utility.isDecimalNumber(adRefId) || Utility.isIntegerNumber(adRefId)
            || Utility.isDateTime(adRefId)) {
          aux = vars.getSessionValue(tableSQL.getTabID() + "|param"
              + prop.getProperty("ColumnName") + "_f");
          if (!aux.equals("")) {
            filter.addElement(formatFilter(tableSQL.getTableName(), prop.getProperty("ColumnName"),
                prop.getProperty("AD_Reference_ID"), false));
            filterParams.addElement("Param" + prop.getProperty("ColumnName") + "_f");
            result.setData("Param" + prop.getProperty("ColumnName") + "_f", aux);
          }
        }
      }
    }
    return result;
  }

  /**
   * Formats the filter to get the correct output (adds TO_DATE, TO_NUMBER...).
   * 
   * @param tablename
   *          String with the table name.
   * @param columnname
   *          String with the column name.
   * @param reference
   *          String with the reference id.
   * @param first
   *          Boolean to know if is the first or not.
   * @return String with the formated field.
   */
  private static String formatFilter(String tablename, String columnname, String reference,
      boolean first) {
    if (columnname == null || columnname.equals("") || tablename == null || tablename.equals("")
        || reference == null || reference.equals(""))
      return "";
    StringBuffer text = new StringBuffer();
    if (reference.equals("15") || reference.equals("16") || reference.equals("24")) {
      text.append("TO_DATE(").append(reference.equals("24") ? "TO_CHAR(" : "").append(tablename)
          .append(".").append(columnname).append(
              (reference.equals("24") ? ", 'HH24:MI:SS'), 'HH24:MI:SS'" : "")).append(") ");
      if (first)
        text.append(">= ");
      else {
        if (reference.equals("24"))
          text.append("<=");
        else
          text.append("< ");
      }
      text.append("TO_DATE(?").append((reference.equals("24") ? ", 'HH24:MI:SS'" : "")).append(")");
      if (!first && !reference.equals("24"))
        text.append("+1");
    } else if (reference.equals("11") || reference.equals("12") || reference.equals("13")
        || reference.equals("22") || reference.equals("29") || reference.equals("800008")
        || reference.equals("800019")) {
      text.append(tablename).append(".").append(columnname).append(" ");
      if (first)
        text.append(">= ");
      else
        text.append("<= ");
      text.append("TO_NUMBER(?)");
    } else if (reference.equals("10") || reference.equals("14") || reference.equals("34")) {
      String aux = "";
      if (!columnname.equalsIgnoreCase("Value") && !columnname.equalsIgnoreCase("DocumentNo"))
        aux = "C_IGNORE_ACCENT";
      text.append(aux).append("(");
      text.append(tablename).append(".").append(columnname).append(") LIKE ");
      text.append(aux).append("(?)");
    } else if (reference.equals("35")) {
      text
          .append(
              "(SELECT UPPER(DESCRIPTION) FROM M_ATTRIBUTESETINSTANCE WHERE M_ATTRIBUTESETINSTANCE.M_ATTRIBUTESETINSTANCE_ID = ")
          .append(tablename).append(".").append(columnname).append(") LIKE C_IGNORE_ACCENT(?)");
    } else {
      text.append(tablename).append(".").append(columnname).append(" = ?");
    }
    return text.toString();
  }

  /**
   * Sets the order by in the session.
   * 
   * @param vars
   *          Handler for the session info.
   * @param tableSQL
   *          Handler for the query builder.
   * @throws Exception
   */
  private static void setSessionOrderBy(VariablesSecureApp vars, TableSQLData tableSQL)
      throws Exception {
    Vector<QueryFieldStructure> vOrderBy = tableSQL.getOrderByFields();
    StringBuffer txtAux = new StringBuffer();
    if (vOrderBy != null) {
      for (int i = 0; i < vOrderBy.size(); i++) {
        QueryFieldStructure auxStructure = vOrderBy.elementAt(i);
        if (!txtAux.toString().equals(""))
          txtAux.append(", ");
        txtAux.append(auxStructure.toString());
      }
    }
    vars.setSessionValue(tableSQL.getTabID() + "|orderby", txtAux.toString());

    vOrderBy = tableSQL.getOrderBySimpleFields();
    StringBuffer txtAuxSimple = new StringBuffer();
    if (vOrderBy != null) {
      for (int i = 0; i < vOrderBy.size(); i++) {
        QueryFieldStructure auxStructure = vOrderBy.elementAt(i);
        if (!txtAuxSimple.toString().equals(""))
          txtAuxSimple.append(", ");
        txtAuxSimple.append(auxStructure.toString());
      }
    }
    if (txtAuxSimple.toString().equals(""))
      vars.setSessionValue(tableSQL.getTabID() + "|orderbySimple", txtAuxSimple.toString());

    Vector<String> positions = tableSQL.getOrderByPosition();
    txtAux = new StringBuffer();
    if (positions != null) {
      for (int i = 0; i < positions.size(); i++) {
        String auxStructure = positions.elementAt(i);
        auxStructure = Integer.toString((Integer.valueOf(auxStructure).intValue() + 1));
        if (!txtAux.toString().equals(""))
          txtAux.append(",");
        txtAux.append(auxStructure);
      }
    }
    vars.setSessionValue(tableSQL.getTabID() + "|orderbyPositions", txtAux.toString());

    Vector<String> directions = tableSQL.getOrderByDirection();
    txtAux = new StringBuffer();
    if (directions != null) {
      for (int i = 0; i < directions.size(); i++) {
        String auxStructure = directions.elementAt(i);
        if (!txtAux.toString().equals(""))
          txtAux.append(",");
        txtAux.append(auxStructure);
      }
    }
    vars.setSessionValue(tableSQL.getTabID() + "|orderbyDirections", txtAux.toString());
  }

  /**
   * Overloaded method with sorted columns by default
   */
  public static String generateSQL(ConnectionProvider conn, VariablesSecureApp vars,
      TableSQLData tableSQL, String selectFields, Vector<String> filter,
      Vector<String> filterParams, int offset, int pageSize) throws Exception {
    return generateSQL(conn, vars, tableSQL, selectFields, filter, filterParams, offset, pageSize,
        true, false);
  }

  /**
   * Special case of the method which specifies that only the id column of the base table should be
   * returned. No extra left joins (besides possible sort columns) are needed.
   */
  public static String generateSQLonlyId(ConnectionProvider conn, VariablesSecureApp vars,
      TableSQLData tableSQL, String selectFields, Vector<String> filter,
      Vector<String> filterParams, int offset, int pageSize) throws Exception {
    return generateSQL(conn, vars, tableSQL, selectFields, filter, filterParams, offset, pageSize,
        true, true);
  }

  /**
   * Generates the query for this tab. This method adds to the standard query defined in the
   * TableSQLData (from dictionary) the user filter parameters and order by defined by UI
   * 
   * @param conn
   *          Handler for the database connection.
   * @param vars
   *          Handler for the session info.
   * @param tableSQL
   *          Handler for the query builder.
   * @param selectFields
   *          String with the fields of the select clause.
   * @param filter
   *          Vector with the specific filter fields.
   * @param filterParams
   *          Vector with the parameters for the specific filter fields.
   * @param offset
   *          int, offset of rows to be displayed
   * @param pageSize
   *          int, number of rows to be displayed
   * @param onlyId
   *          only the id of the base table should be returned
   * @return String with the sql.
   * @throws Exception
   */
  public static String generateSQL(ConnectionProvider conn, VariablesSecureApp vars,
      TableSQLData tableSQL, String selectFields, Vector<String> filter,
      Vector<String> filterParams, int offset, int pageSize, boolean sorted, boolean onlyId)
      throws Exception {
    Vector<String> orderBy = new Vector<String>(); // Maintains orderby
    // clause with SQL clause
    Vector<String> orderBySimple = new Vector<String>(); // Maintains
    // orderby clause
    // just with column
    // names
    String loadSessionOrder = vars.getSessionValue(tableSQL.getTabID() + "|newOrder");
    if (loadSessionOrder == null || loadSessionOrder.equals("")
        || vars.getSessionValue(tableSQL.getTabID() + "|orderbySimple").equals("")) {
      orderBy = getOrderBy(vars, tableSQL);
      orderBySimple = (Vector<String>) orderBy.clone();
    } else {
      String auxOrder = vars.getSessionValue(tableSQL.getTabID() + "|orderby");
      String auxOrderSimple = vars.getSessionValue(tableSQL.getTabID() + "|orderbySimple");
      if (!auxOrder.equals(""))
        orderBy.addElement(auxOrder);
      if (!auxOrderSimple.equals(""))
        orderBySimple.addElement(auxOrderSimple);
    }
    if (filter == null)
      filter = new Vector<String>();
    if (filterParams == null)
      filterParams = new Vector<String>();
    SQLReturnObject parametersData = getFilter(vars, tableSQL, filter, filterParams);
    String parentKey = tableSQL.getParentColumnName();
    if (parentKey != null && !parentKey.equals("")) {
      String aux = vars.getGlobalVariable("inpParentKey", tableSQL.getWindowID() + "|" + parentKey);
      if (!aux.equals("")) {
        if (parametersData == null)
          parametersData = new SQLReturnObject();
        parametersData.setData("PARENT", aux);
      }
    }
    String strSQL = tableSQL.getSQL(filter, filterParams, orderBy, null, selectFields,
        orderBySimple, offset, pageSize, sorted, onlyId);
    setSessionOrderBy(vars, tableSQL);
    Utility.fillTableSQLParameters(conn, vars, parametersData, tableSQL, tableSQL.getWindowID());
    return strSQL;
  }
}
