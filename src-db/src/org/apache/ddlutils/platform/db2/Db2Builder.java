package org.apache.ddlutils.platform.db2;

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import java.io.IOException;
import java.sql.Types;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.apache.ddlutils.Platform;
import org.apache.ddlutils.alteration.AddColumnChange;
import org.apache.ddlutils.alteration.AddPrimaryKeyChange;
import org.apache.ddlutils.alteration.PrimaryKeyChange;
import org.apache.ddlutils.alteration.RemoveColumnChange;
import org.apache.ddlutils.alteration.RemovePrimaryKeyChange;
import org.apache.ddlutils.alteration.TableChange;
import org.apache.ddlutils.model.Column;
import org.apache.ddlutils.model.Database;
import org.apache.ddlutils.model.ValueObject;
import org.apache.ddlutils.model.Index;
import org.apache.ddlutils.model.Table;
import org.apache.ddlutils.model.TypeMap;
import org.apache.ddlutils.platform.SqlBuilder;
import org.apache.ddlutils.util.Jdbc3Utils;

/**
 * The SQL Builder for DB2.
 * 
 * @version $Revision: 504811 $
 */
public class Db2Builder extends SqlBuilder
{
    /**
     * Creates a new builder instance.
     * 
     * @param platform The plaftform this builder belongs to
     */
    public Db2Builder(Platform platform)
    {
        super(platform);
        addEscapedCharSequence("'", "''");
    }

    /**
     * {@inheritDoc}
     */
    protected String getNativeDefaultValue(ValueObject column)
    {
        if ((column.getTypeCode() == Types.BIT) ||
            (Jdbc3Utils.supportsJava14JdbcTypes() && (column.getTypeCode() == Jdbc3Utils.determineBooleanTypeCode())))
        {
            return getDefaultValueHelper().convert(column.getDefaultValue(), column.getTypeCode(), Types.SMALLINT).toString();
        }
        else
        {
            return super.getNativeDefaultValue(column);
        }
    }

    /**
     * {@inheritDoc}
     */
    protected void writeColumnAutoIncrementStmt(Table table, Column column) throws IOException
    {
        print("GENERATED BY DEFAULT AS IDENTITY");
    }

    /**
     * {@inheritDoc}
     */
    public String getSelectLastIdentityValues(Table table)
    {
        return "VALUES IDENTITY_VAL_LOCAL()";
    }

    /**
     * {@inheritDoc}
     */
    public void writeExternalIndexDropStmt(Table table, Index index) throws IOException
    {
        // Index names in DB2 are unique to a schema and hence Derby does not
        // use the ON <tablename> clause
        print("DROP INDEX ");
        printIdentifier(getConstraintObjectName(index));
        printEndOfStatement();
    }

    /**
     * {@inheritDoc}
     */
    protected void writeCastExpression(Column sourceColumn, Column targetColumn) throws IOException
    {
        String sourceNativeType = getBareNativeType(sourceColumn);
        String targetNativeType = getBareNativeType(targetColumn);

        if (sourceNativeType.equals(targetNativeType))
        {
            printIdentifier(getColumnName(sourceColumn));
        }
        else
        {
            String type = getSqlType(targetColumn);

            // DB2 has the limitation that it cannot convert numeric values
            // to VARCHAR, though it can convert them to CHAR
            if (TypeMap.isNumericType(sourceColumn.getTypeCode()) &&
                "VARCHAR".equalsIgnoreCase(targetNativeType))
            {
                Object sizeSpec = targetColumn.getSize();
                
                if (sizeSpec == null)
                {
                    sizeSpec = getPlatformInfo().getDefaultSize(targetColumn.getTypeCode());
                }
                type = "CHAR(" +sizeSpec.toString() + ")";
            }

            print("CAST(");
            printIdentifier(getColumnName(sourceColumn));
            print(" AS ");
            print(type);
            print(")");
        }
    }

    /**
     * {@inheritDoc}
     */
    protected void processTableStructureChanges(Database currentModel,
                                                Database desiredModel,
                                                Table    sourceTable,
                                                Table    targetTable,
                                                Map      parameters,
                                                List     changes) throws IOException
    {
        // DB2 provides only limited ways to alter a column, so we don't use them
        for (Iterator changeIt = changes.iterator(); changeIt.hasNext();)
        {
            TableChange change = (TableChange)changeIt.next();

            if (change instanceof AddColumnChange)
            {
                AddColumnChange addColumnChange = (AddColumnChange)change;

                // DB2 can only add not insert columns
                // Also, DB2 does not allow the GENERATED BY DEFAULT AS IDENTITY clause in
                // the ALTER TABLE ADD COLUMN statement, so we have to rebuild the table instead
                if ((addColumnChange.getNextColumn() == null) && !addColumnChange.getNewColumn().isAutoIncrement())
                {
                    processChange(currentModel, desiredModel, addColumnChange);
                    changeIt.remove();
                }
            }
        }

        for (Iterator changeIt = changes.iterator(); changeIt.hasNext();)
        {
            TableChange change = (TableChange)changeIt.next();

            if (change instanceof AddPrimaryKeyChange)
            {
                processChange(currentModel, desiredModel, (AddPrimaryKeyChange)change);
                changeIt.remove();
            }
            else if (change instanceof PrimaryKeyChange)
            {
                processChange(currentModel, desiredModel, (PrimaryKeyChange)change);
                changeIt.remove();
            }
            else if (change instanceof RemovePrimaryKeyChange)
            {
                processChange(currentModel, desiredModel, (RemovePrimaryKeyChange)change);
                changeIt.remove();
            }
        }
    }

    /**
     * Processes the addition of a column to a table.
     * 
     * @param currentModel The current database schema
     * @param desiredModel The desired database schema
     * @param change       The change object
     */
    protected void processChange(Database        currentModel,
                                 Database        desiredModel,
                                 AddColumnChange change) throws IOException
    {
        print("ALTER TABLE ");
        printlnIdentifier(getStructureObjectName(change.getChangedTable()));
        printIndent();
        print("ADD COLUMN ");
        writeColumn(change.getChangedTable(), change.getNewColumn());
        printEndOfStatement();
        change.apply(currentModel, getPlatform().isDelimitedIdentifierModeOn());
    }

    /**
     * Processes the removal of a column from a table.
     * 
     * @param currentModel The current database schema
     * @param desiredModel The desired database schema
     * @param change       The change object
     */
    protected void processChange(Database           currentModel,
                                 Database           desiredModel,
                                 RemoveColumnChange change) throws IOException
    {
        print("ALTER TABLE ");
        printlnIdentifier(getStructureObjectName(change.getChangedTable()));
        printIndent();
        print("DROP COLUMN ");
        printIdentifier(getColumnName(change.getColumn()));
        printEndOfStatement();
        change.apply(currentModel, getPlatform().isDelimitedIdentifierModeOn());
    }

    /**
     * Processes the removal of a primary key from a table.
     * 
     * @param currentModel The current database schema
     * @param desiredModel The desired database schema
     * @param change       The change object
     */
    protected void processChange(Database               currentModel,
                                 Database               desiredModel,
                                 RemovePrimaryKeyChange change) throws IOException
    {
        print("ALTER TABLE ");
        printlnIdentifier(getStructureObjectName(change.getChangedTable()));
        printIndent();
        print("DROP PRIMARY KEY");
        printEndOfStatement();
        change.apply(currentModel, getPlatform().isDelimitedIdentifierModeOn());
    }

    /**
     * Processes the change of the primary key of a table.
     * 
     * @param currentModel The current database schema
     * @param desiredModel The desired database schema
     * @param change       The change object
     */
    protected void processChange(Database         currentModel,
                                 Database         desiredModel,
                                 PrimaryKeyChange change) throws IOException
    {
        print("ALTER TABLE ");
        printlnIdentifier(getStructureObjectName(change.getChangedTable()));
        printIndent();
        print("DROP PRIMARY KEY");
        printEndOfStatement();
        writeExternalPrimaryKeysCreateStmt(change.getChangedTable(), change.getNewName(), change.getNewPrimaryKeyColumns());
        change.apply(currentModel, getPlatform().isDelimitedIdentifierModeOn());
    }
}
