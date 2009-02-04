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

package org.openbravo.service.system;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.ddlutils.model.Database;
import org.apache.ddlutils.model.ForeignKey;
import org.apache.ddlutils.model.Index;
import org.apache.ddlutils.model.Reference;
import org.apache.ddlutils.model.Unique;
import org.apache.ddlutils.model.View;
import org.hibernate.criterion.Expression;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.model.Property;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.ad.datamodel.Column;
import org.openbravo.model.ad.datamodel.Table;
import org.openbravo.model.ad.module.Module;
import org.openbravo.service.system.SystemValidationResult.SystemValidationType;

/**
 * Validates the database model against the application dictionary and checks that columns are
 * inline with the application dictionary.
 * 
 * @author mtaal
 */

// check naming rule of a table, use ad_exceptions table
public class DatabaseValidator implements SystemValidator {
  private Database database;

  private static int MAX_OBJECT_NAME_LENGTH = 30;

  private StringBuilder updateSql = new StringBuilder();

  // if this is set then only module specific things are checked.
  private Module validateModule;

  public String getCategory() {
    return "Database Model";
  }

  public SystemValidationResult validate() {
    final SystemValidationResult result = new SystemValidationResult();

    // read the tables
    final OBCriteria<Table> tcs = OBDal.getInstance().createCriteria(Table.class);
    tcs.add(Expression.eq(Table.PROPERTY_ISVIEW, false));
    final List<Table> adTables = tcs.list();
    final Map<String, Table> adTablesByName = new HashMap<String, Table>();
    for (Table adTable : adTables) {
      adTablesByName.put(adTable.getTableName(), adTable);
    }

    // the following cases are checked:
    // 1) table present in ad, but not in db
    // 2) table present in db, not in ad
    // 3) table present on both sides, column match check

    final org.apache.ddlutils.model.Table[] dbTables = getDatabase().getTables();
    final Map<String, org.apache.ddlutils.model.Table> dbTablesByName = new HashMap<String, org.apache.ddlutils.model.Table>();
    for (org.apache.ddlutils.model.Table dbTable : dbTables) {
      dbTablesByName.put(dbTable.getName().toUpperCase(), dbTable);
    }
    final Map<String, org.apache.ddlutils.model.Table> tmpDBTablesByName = new HashMap<String, org.apache.ddlutils.model.Table>(
        dbTablesByName);

    final Map<String, View> dbViews = new HashMap<String, View>();
    final View[] views = getDatabase().getViews();
    for (View view : views) {
      dbViews.put(view.getName().toUpperCase(), view);
    }

    final String moduleId = (getValidateModule() == null ? null : getValidateModule().getId());
    for (Table adTable : adTables) {
      final org.apache.ddlutils.model.Table dbTable = dbTablesByName.get(adTable.getTableName()
          .toUpperCase());
      final View view = dbViews.get(adTable.getTableName().toUpperCase());
      if (view == null && dbTable == null) {
        // in Application Dictionary not in Physical Table
        if (moduleId == null
            || (adTable.getDataPackage().getModule() != null && adTable.getDataPackage()
                .getModule().getId().equals(moduleId))) {
          result.addError(SystemValidationResult.SystemValidationType.NOT_EXIST_IN_DB, "Table "
              + adTable.getTableName() + " defined in the Application Dictionary"
              + " but is not present in the database");
        }
      } else if (view != null) {
        dbViews.remove(view.getName().toUpperCase());
      } else {
        if (moduleId == null
            || (adTable.getDataPackage().getModule() != null && adTable.getDataPackage()
                .getModule().getId().equals(moduleId))) {
          checkTableWithoutPrimaryKey(dbTable, result);
          checkForeignKeys(dbTable, result);
          checkMaxObjectNameLength(dbTable, result);
        }
        matchColumns(adTable, dbTable, result);
        tmpDBTablesByName.remove(dbTable.getName().toUpperCase());
      }
    }

    // only check this one if the global validate check is done
    for (org.apache.ddlutils.model.Table dbTable : tmpDBTablesByName.values()) {
      result.addError(SystemValidationResult.SystemValidationType.NOT_EXIST_IN_AD, "Table "
          + dbTable.getName() + " present in the database "
          + " but not defined in the Application Dictionary");
    }

    for (View view : dbViews.values()) {
      result.addWarning(SystemValidationResult.SystemValidationType.NOT_EXIST_IN_AD, "View "
          + view.getName() + " present in the database "
          + " but not defined in the Application Dictionary");
    }

    // System.err.println(updateSql);

    return result;
  }

  private void checkMaxObjectNameLength(org.apache.ddlutils.model.Table dbTable,
      SystemValidationResult result) {
    checkNameLength("Table", dbTable.getName(), result);
    for (org.apache.ddlutils.model.Column dbColumn : dbTable.getColumns()) {
      checkNameLength("(table: " + dbTable.getName() + ") Column ", dbColumn.getName(), result);
    }
    for (ForeignKey fk : dbTable.getForeignKeys()) {
      checkNameLength("(table: " + dbTable.getName() + ") Foreign Key ", fk.getName(), result);
    }
    for (Unique unique : dbTable.getuniques()) {
      checkNameLength("(table: " + dbTable.getName() + ") Unique Constraint ", unique.getName(),
          result);
    }
    for (Index index : dbTable.getIndices()) {
      checkNameLength("(table: " + dbTable.getName() + ") Index ", index.getName(), result);
    }
  }

  private void checkNameLength(String type, String name, SystemValidationResult result) {
    if (name.length() > MAX_OBJECT_NAME_LENGTH) {
      result.addError(SystemValidationResult.SystemValidationType.NAME_TOO_LONG, "The name of "
          + type + " " + name + " is too long, the maximum allowed length is: "
          + MAX_OBJECT_NAME_LENGTH);
    }
  }

  private void checkTableWithoutPrimaryKey(org.apache.ddlutils.model.Table dbTable,
      SystemValidationResult result) {
    if (dbTable.getPrimaryKeyColumns().length == 0) {
      result.addError(SystemValidationResult.SystemValidationType.NO_PRIMARY_KEY_COLUMNS, "Table "
          + dbTable.getName() + " has no primary key columns.");
    }
  }

  private Property getProperty(String tableName, String columnName) {
    final Entity entity = ModelProvider.getInstance().getEntityByTableName(tableName);
    if (entity == null) {
      // can happen with mismatches
      return null;
    }
    for (Property property : entity.getProperties()) {
      if (property.getColumnName() != null && property.getColumnName().equalsIgnoreCase(columnName)) {
        return property;
      }
    }
    return null;
  }

  private void checkForeignKeys(org.apache.ddlutils.model.Table table, SystemValidationResult result) {
    final Entity entity = ModelProvider.getInstance().getEntityByTableName(table.getName());
    if (entity == null) {
      // can happen with mismatches
      return;
    }
    for (Property property : entity.getProperties()) {
      if (!property.isPrimitive() && !property.isOneToMany() && !property.isAuditInfo()) {
        // check if the property column is present in a foreign key

        // special case that a property does not have a column, if it is
        // like a virtual property see ClientInformation.client
        if (property.getColumnName() == null) {
          continue;
        }

        final String colName = property.getColumnName().toUpperCase();

        // ignore this specific case
        if (entity.getTableName().equalsIgnoreCase("ad_module_log")
            && colName.equalsIgnoreCase("ad_module_id")) {
          continue;
        }

        boolean found = false;
        for (ForeignKey fk : table.getForeignKeys()) {
          for (Reference reference : fk.getReferences()) {
            if (reference.getLocalColumnName().toUpperCase().equals(colName)) {
              found = true;
              break;
            }
          }
          if (found) {
            break;
          }
        }
        if (!found) {
          result.addError(SystemValidationResult.SystemValidationType.NOT_PART_OF_FOREIGN_KEY,
              "Foreign Key Column " + table.getName() + "." + property.getColumnName()
                  + " is not part of a foreign key constraint.");
        }
      }
    }
  }

  private void matchColumns(Table adTable, org.apache.ddlutils.model.Table dbTable,
      SystemValidationResult result) {

    final Map<String, org.apache.ddlutils.model.Column> dbColumnsByName = new HashMap<String, org.apache.ddlutils.model.Column>();
    for (org.apache.ddlutils.model.Column dbColumn : dbTable.getColumns()) {
      dbColumnsByName.put(dbColumn.getName().toUpperCase(), dbColumn);
    }

    final String moduleId = (getValidateModule() == null ? null : getValidateModule().getId());
    for (Column column : adTable.getADColumnList()) {
      final boolean checkColumn = moduleId == null
          || (adTable.getDataPackage().getModule() != null && adTable.getDataPackage().getModule()
              .getId().equals(moduleId))
          || (column.getModule() != null && column.getModule().getId().equals(moduleId));
      if (!checkColumn) {
        continue;
      }
      final org.apache.ddlutils.model.Column dbColumn = dbColumnsByName.get(column.getColumnName()
          .toUpperCase());
      if (dbColumn == null) {
        result.addError(SystemValidationResult.SystemValidationType.NOT_EXIST_IN_DB, "Column "
            + adTable.getTableName() + "." + column.getColumnName()
            + " defined in the Application Dictionary " + " but not present in the database.");
      } else {
        checkDataType(column, dbColumn, result, dbTable);

        checkNameLength("(table: " + dbTable.getName() + ") Column ", dbColumn.getName(), result);

        dbColumnsByName.remove(column.getColumnName().toUpperCase());
      }
    }

    if (moduleId == null
        || (adTable.getDataPackage().getModule() != null && adTable.getDataPackage().getModule()
            .getId().equals(moduleId))) {
      for (org.apache.ddlutils.model.Column dbColumn : dbColumnsByName.values()) {
        result.addError(SystemValidationResult.SystemValidationType.NOT_EXIST_IN_AD, "Column "
            + dbTable.getName() + "." + dbColumn.getName() + " present in the database "
            + " but not defined in the Application Dictionary.");
      }
    }
  }

  private void checkDataType(Column adColumn, org.apache.ddlutils.model.Column dbColumn,
      SystemValidationResult result, org.apache.ddlutils.model.Table dbTable) {

    final Property property = getProperty(dbTable.getName(), dbColumn.getName());

    if (property != null && !property.isMandatory() && dbColumn.isRequired()) {
      result.addError(
          SystemValidationResult.SystemValidationType.NOT_NULL_IN_DB_NOT_MANDATORY_IN_AD, "Column "
              + dbTable.getName() + "." + dbColumn.getName()
              + " is required (not-null) but in the Application Dictonary"
              + " it is set as non-mandatory");

      final Property p = getProperty(dbTable.getName(), dbColumn.getName());
      updateSql
          .append("update ad_column set ismandatory='Y' where ad_column_id in (select c.ad_column_id from ad_column c, ad_table t "
              + "where c.ad_table_id=t.ad_table_id and t.tablename='"
              + p.getEntity().getTableName() + "' and c.columnname='" + p.getColumnName() + "');\n");

    }

    // disabled this check, will be done in 2.60
    if (false) {
      if (property != null && property.isMandatory() && !dbColumn.isRequired()) {
        result.addError(SystemValidationType.MANDATORY_IN_AD_NULLABLE_IN_DB, "Column "
            + dbTable.getName() + "." + dbColumn.getName()
            + " is not-required (null-allowed) but in the Application Dictonary"
            + " it is set as mandatory");
      }
    }

    // check the default value
    if (property != null && property.getActualDefaultValue() != null) {
      try {
        property.checkIsValidValue(property.getActualDefaultValue());
      } catch (Exception e) {
        // actually a ValidationException is thrown but this is not
        // accepted by the compiler
        result.addError(SystemValidationType.INCORRECT_DEFAULT_VALUE, e.getMessage());
      }
    }

    if (dbColumn.isPrimaryKey()) {
      // there is a special case, the ad_script_sql has a
      // seqno has key
      if (!dbTable.getName().equalsIgnoreCase("ad_script_sql")) {
        checkType(dbColumn, dbTable, result, "VARCHAR");
        checkLength(dbColumn, dbTable, result, 32);
      }
    } else if (property != null && property.getAllowedValues().size() > 0) {
      checkType(dbColumn, dbTable, result, "VARCHAR");
      checkLength(dbColumn, dbTable, result, 60);
    } else if (property != null && property.isOneToMany()) {
      // ignore those
    } else if (property != null && !property.isPrimitive()) {

      checkType(dbColumn, dbTable, result, "VARCHAR");
      if (property.getReferencedProperty() != null) {
        checkLength(dbColumn, dbTable, result, property.getReferencedProperty().getFieldLength());
      } else {
        checkLength(dbColumn, dbTable, result, 32);
      }
    } else if (property != null && property.getPrimitiveObjectType() != null) {
      final Class<?> prim = property.getPrimitiveObjectType();
      if (prim == String.class) {
        checkType(dbColumn, dbTable, result,
            new String[] { "VARCHAR", "NVARCHAR", "CHAR", "NCHAR" });
      } else if (prim == Integer.class) {
        checkType(dbColumn, dbTable, result, "DECIMAL");
      } else if (prim == BigDecimal.class) {
        checkType(dbColumn, dbTable, result, "DECIMAL");
      } else if (prim == Date.class) {
        checkType(dbColumn, dbTable, result, "TIMESTAMP");
      } else if (prim == Boolean.class) {
        checkType(dbColumn, dbTable, result, "CHAR");
        checkLength(dbColumn, dbTable, result, 1);
      } else if (prim == Float.class) {
        checkType(dbColumn, dbTable, result, "DECIMAL");
      } else if (prim == Object.class) {
        // nothing to check...
      } else if (prim == Timestamp.class) {
        checkType(dbColumn, dbTable, result, "TIMESTAMP");
      }
    }
  }

  private void checkType(org.apache.ddlutils.model.Column dbColumn,
      org.apache.ddlutils.model.Table dbTable, SystemValidationResult result, String[] expectedTypes) {
    boolean found = false;
    final StringBuilder sb = new StringBuilder();
    for (String expectedType : expectedTypes) {
      sb.append(expectedType + " ");
      found = dbColumn.getType().equals(expectedType);
      if (found) {
        break;
      }
    }
    if (!found) {
      result.addError(SystemValidationType.WRONG_TYPE, "Column " + dbTable.getName() + "."
          + dbColumn.getName() + " has incorrect type, expecting " + sb.toString() + "but was "
          + dbColumn.getType());
    }
  }

  private void checkType(org.apache.ddlutils.model.Column dbColumn,
      org.apache.ddlutils.model.Table dbTable, SystemValidationResult result, String expectedType) {
    if (!dbColumn.getType().equals(expectedType)) {
      if (dbColumn.getName().toUpperCase().equals("USER1_ID")
          || dbColumn.getName().toUpperCase().equals("USER2_ID")) {
        final Property p = getProperty(dbTable.getName(), dbColumn.getName());
        updateSql
            .append("update ad_column set ad_reference_id='10', ad_reference_value_id=NULL where ad_column_id in (select c.ad_column_id from ad_column c, ad_table t "
                + "where c.ad_table_id=t.ad_table_id and t.tablename='"
                + p.getEntity().getTableName()
                + "' and c.columnname='"
                + p.getColumnName()
                + "');\n");
      }

      result.addError(SystemValidationType.WRONG_TYPE, "Column " + dbTable.getName() + "."
          + dbColumn.getName() + " has incorrect type, expecting " + expectedType + " but was "
          + dbColumn.getType());
    }
  }

  private void checkLength(org.apache.ddlutils.model.Column dbColumn,
      org.apache.ddlutils.model.Table dbTable, SystemValidationResult result, int expectedLength) {
    // special case no length check
    if ("AD_SCRIPT_SQL.SEQNO".equalsIgnoreCase(dbTable.getName() + "." + dbColumn.getName())) {
      return;
    }

    if (dbColumn.getSizeAsInt() != expectedLength) {
      result.addError(SystemValidationType.WRONG_LENGTH, "Column " + dbTable.getName() + "."
          + dbColumn.getName() + " has incorrect length, expecting " + expectedLength + " but was "
          + dbColumn.getSizeAsInt());
    }
  }

  // private void dumpDataType(org.apache.ddlutils.model.Table dbTable) {
  // System.err.println(">>>>>>>>>>>>>> Table >>> " + dbTable.getName());
  // for (org.apache.ddlutils.model.Column dbColumn :
  // dbTable.getColumns()) {
  // System.err.println(dbColumn.getType() + " " + dbColumn.getSize());
  // }
  // }

  public Database getDatabase() {
    return database;
  }

  public void setDatabase(Database database) {
    this.database = database;
  }

  public Module getValidateModule() {
    return validateModule;
  }

  public void setValidateModule(Module module) {
    this.validateModule = module;
  }

}
