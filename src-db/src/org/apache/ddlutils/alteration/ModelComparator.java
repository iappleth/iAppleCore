package org.apache.ddlutils.alteration;

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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.ddlutils.PlatformInfo;
import org.apache.ddlutils.model.Check;
import org.apache.ddlutils.model.Column;
import org.apache.ddlutils.model.Database;
import org.apache.ddlutils.model.ForeignKey;
import org.apache.ddlutils.model.Function;
import org.apache.ddlutils.model.Index;
import org.apache.ddlutils.model.Sequence;
import org.apache.ddlutils.model.Table;
import org.apache.ddlutils.model.Trigger;
import org.apache.ddlutils.model.Unique;
import org.apache.ddlutils.model.UtilsCompare;
import org.apache.ddlutils.model.View;

/**
 * Compares two database models and creates change objects that express how to
 * adapt the first model so that it becomes the second one. Neither of the models
 * are changed in the process, however, it is also assumed that the models do not
 * change in between.
 * 
 * TODO: Add support and tests for the change of the column order 
 * 
 * @version $Revision: $
 */
public class ModelComparator
{
    /** The log for this comparator. */
    private final Log _log = LogFactory.getLog(ModelComparator.class);

    /** The platform information. */
    private PlatformInfo _platformInfo;
    /** Whether comparison is case sensitive. */
    private boolean _caseSensitive;

    /**
     * Creates a new model comparator object.
     * 
     * @param platformInfo  The platform info
     * @param caseSensitive Whether comparison is case sensitive
     */
    public ModelComparator(PlatformInfo platformInfo, boolean caseSensitive)
    {
        _platformInfo  = platformInfo;
        _caseSensitive = caseSensitive;
    }

    /**
     * Compares the two models and returns the changes necessary to create the second
     * model from the first one.
     *  
     * @param sourceModel The source model
     * @param targetModel The target model
     * @return The changes
     */
    public List compare(Database sourceModel, Database targetModel)
    {
        ArrayList changes = new ArrayList();

        for (int tableIdx = 0; tableIdx < targetModel.getTableCount(); tableIdx++)
        {
            Table targetTable = targetModel.getTable(tableIdx);
            Table sourceTable = sourceModel.findTable(targetTable.getName(), _caseSensitive);

            if (sourceTable == null)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("Table " + targetTable.getName() + " needs to be added");
                }
                changes.add(new AddTableChange(targetTable));
                for (int fkIdx = 0; fkIdx < targetTable.getForeignKeyCount(); fkIdx++)
                {
                    // we have to use target table's definition here because the
                    // complete table is new
                    changes.add(new AddForeignKeyChange(targetTable, targetTable.getForeignKey(fkIdx)));
                }
            }
            else
            {
                changes.addAll(compareTables(sourceModel, sourceTable, targetModel, targetTable));
            }
        }

        for (int tableIdx = 0; tableIdx < sourceModel.getTableCount(); tableIdx++)
        {
            Table sourceTable = sourceModel.getTable(tableIdx);
            Table targetTable = targetModel.findTable(sourceTable.getName(), _caseSensitive);

            if ((targetTable == null) && (sourceTable.getName() != null) && (sourceTable.getName().length() > 0))
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("Table " + sourceTable.getName() + " needs to be removed");
                }
                changes.add(new RemoveTableChange(sourceTable));
                // we assume that the target model is sound, ie. that there are no longer any foreign
                // keys to this table in the target model; thus we already have removeFK changes for
                // these from the compareTables method and we only need to create changes for the fks
                // originating from this table
                for (int fkIdx = 0; fkIdx < sourceTable.getForeignKeyCount(); fkIdx++)
                {
                    changes.add(new RemoveForeignKeyChange(sourceTable, sourceTable.getForeignKey(fkIdx)));
                }
            }
        }        
        
        for (int sqIdx = 0; sqIdx < sourceModel.getSequenceCount(); sqIdx++)
        {
            Sequence sourceSequence = sourceModel.getSequence(sqIdx);
            Sequence targetSequence = findCorrespondingSequence(targetModel, sourceSequence);
            
            if (targetSequence == null)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("Sequence " + sourceSequence + " needs to be removed from database " + sourceModel.getName());
                }
                changes.add(new RemoveSequenceChange(sourceSequence));
            }
        }
        
        for (int sqIdx = 0; sqIdx < targetModel.getSequenceCount(); sqIdx++)
        {
            Sequence targetSequence = targetModel.getSequence(sqIdx);
            Sequence sourceSequence = findCorrespondingSequence(sourceModel, targetSequence);
            
            if (sourceSequence == null)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("Sequence " + targetSequence + " needs to be created for the database " + sourceModel.getName());
                }
                changes.add(new AddSequenceChange(targetSequence));
            }
        }       
        
        for (int viIdx = 0; viIdx < sourceModel.getViewCount(); viIdx++)
        {
            View sourceView = sourceModel.getView(viIdx);
            View targetView = findCorrespondingView(targetModel, sourceView);
            
            if (targetView == null)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("View " + sourceView + " needs to be removed from database " + sourceModel.getName());
                }
                changes.add(new RemoveViewChange(sourceView));
            }
        }
        
        for (int viIdx = 0; viIdx < targetModel.getViewCount(); viIdx++)
        {
            View targetView = targetModel.getView(viIdx);
            View sourceView = findCorrespondingView(sourceModel, targetView);
            
            if (sourceView == null)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("View " + targetView + " needs to be created for the database " + sourceModel.getName());
                }
                changes.add(new AddViewChange(targetView));
            }
        }       
      
        for (int fnIdx = 0; fnIdx < sourceModel.getFunctionCount(); fnIdx++)
        {
            Function sourceFunction = sourceModel.getFunction(fnIdx);
            Function targetFunction = findCorrespondingFunction(targetModel, sourceFunction);
            
            if (targetFunction == null)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("Function " + sourceFunction + " needs to be removed from database " + sourceModel.getName());
                }
                changes.add(new RemoveFunctionChange(sourceFunction));
            }
        }
        
        for (int fnIdx = 0; fnIdx < targetModel.getFunctionCount(); fnIdx++)
        {
            Function targetFunction = targetModel.getFunction(fnIdx);
            Function sourceFunction = findCorrespondingFunction(sourceModel, targetFunction);
            
            if (sourceFunction == null)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("Function " + targetFunction + " needs to be created for the database " + sourceModel.getName());
                }
                changes.add(new AddFunctionChange(targetFunction));
            }
        }         
        
        for (int trIdx = 0; trIdx < sourceModel.getTriggerCount(); trIdx++)
        {
            Trigger sourceTrigger = sourceModel.getTrigger(trIdx);
            Trigger targetTrigger = findCorrespondingTrigger(targetModel, sourceTrigger);
            
            if (targetTrigger == null)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("Trigger " + sourceTrigger + " needs to be removed from database " + sourceModel.getName());
                }
                changes.add(new RemoveTriggerChange(sourceTrigger));
            }
        }
        
        for (int trIdx = 0; trIdx < targetModel.getTriggerCount(); trIdx++)
        {
            Trigger targetTrigger = targetModel.getTrigger(trIdx);
            Trigger sourceTrigger = findCorrespondingTrigger(sourceModel, targetTrigger);
            
            if (sourceTrigger == null)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("Trigger " + targetTrigger + " needs to be created for the database " + sourceModel.getName());
                }
                changes.add(new AddTriggerChange(targetTrigger));
            }
        }  
        
        return changes;
    }

    /**
     * Compares the two tables and returns the changes necessary to create the second
     * table from the first one.
     *  
     * @param sourceModel The source model which contains the source table
     * @param sourceTable The source table
     * @param targetModel The target model which contains the target table
     * @param targetTable The target table
     * @return The changes
     */
    public List compareTables(Database sourceModel,
                              Table    sourceTable,
                              Database targetModel,
                              Table    targetTable)
    {
        ArrayList changes = new ArrayList();

        for (int fkIdx = 0; fkIdx < sourceTable.getForeignKeyCount(); fkIdx++)
        {
            ForeignKey sourceFk = sourceTable.getForeignKey(fkIdx);
            ForeignKey targetFk = findCorrespondingForeignKey(targetTable, sourceFk);

            if (targetFk == null)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("Foreign key " + sourceFk + " needs to be removed from table " + sourceTable.getName());
                }
                changes.add(new RemoveForeignKeyChange(sourceTable, sourceFk));
            }
        }

        for (int fkIdx = 0; fkIdx < targetTable.getForeignKeyCount(); fkIdx++)
        {
            ForeignKey targetFk = targetTable.getForeignKey(fkIdx);
            ForeignKey sourceFk = findCorrespondingForeignKey(sourceTable, targetFk);

            if (sourceFk == null)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("Foreign key " + targetFk + " needs to be created for table " + sourceTable.getName());
                }
                // we have to use the target table here because the foreign key might
                // reference a new column
                changes.add(new AddForeignKeyChange(targetTable, targetFk));
            }
        }
        
        for (int chIdx = 0; chIdx < sourceTable.getCheckCount(); chIdx++)
        {
            Check sourceCh = sourceTable.getCheck(chIdx);
            Check targetCh = findCorrespondingCheck(targetTable, sourceCh);
            
            if (targetCh == null)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("Check " + sourceCh + " needs to be removed from table " + sourceTable.getName());
                }
                changes.add(new RemoveCheckChange(sourceTable, sourceCh));
            }
        }
        
        for (int chIdx = 0; chIdx < targetTable.getCheckCount(); chIdx++)
        {
            Check targetCh = targetTable.getCheck(chIdx);
            Check sourceCh = findCorrespondingCheck(sourceTable, targetCh);
            
            if (sourceCh == null)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("Check " + targetCh + " needs to be created for the table " + sourceTable.getName());
                }
                changes.add(new AddCheckChange(targetTable, targetCh));
            }
        }       

        for (int uniqueIdx = 0; uniqueIdx < sourceTable.getUniqueCount(); uniqueIdx++)
        {
            Unique sourceUnique = sourceTable.getUnique(uniqueIdx);
            Unique targetUnique = findCorrespondingUnique(targetTable, sourceUnique);

            if (targetUnique == null)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("Unique " + sourceUnique.getName() + " needs to be removed from table " + sourceTable.getName());
                }
                changes.add(new RemoveUniqueChange(sourceTable, sourceUnique));
            }
        }
        for (int uniqueIdx = 0; uniqueIdx < targetTable.getUniqueCount(); uniqueIdx++)
        {
            Unique targetUnique = targetTable.getUnique(uniqueIdx);
            Unique sourceUnique = findCorrespondingUnique(sourceTable, targetUnique);

            if (sourceUnique == null)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("Unique " + targetUnique.getName() + " needs to be created for table " + sourceTable.getName());
                }
                // we have to use the target table here because the unique might
                // reference a new column
                changes.add(new AddUniqueChange(targetTable, targetUnique));
            }
        }
        
        for (int indexIdx = 0; indexIdx < sourceTable.getIndexCount(); indexIdx++)
        {
            Index sourceIndex = sourceTable.getIndex(indexIdx);
            Index targetIndex = findCorrespondingIndex(targetTable, sourceIndex);

            if (targetIndex == null)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("Index " + sourceIndex.getName() + " needs to be removed from table " + sourceTable.getName());
                }
                changes.add(new RemoveIndexChange(sourceTable, sourceIndex));
            }
        }
        for (int indexIdx = 0; indexIdx < targetTable.getIndexCount(); indexIdx++)
        {
            Index targetIndex = targetTable.getIndex(indexIdx);
            Index sourceIndex = findCorrespondingIndex(sourceTable, targetIndex);

            if (sourceIndex == null)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("Index " + targetIndex.getName() + " needs to be created for table " + sourceTable.getName());
                }
                // we have to use the target table here because the index might
                // reference a new column
                changes.add(new AddIndexChange(targetTable, targetIndex));
            }
        }

        HashMap addColumnChanges = new HashMap();

        for (int columnIdx = 0; columnIdx < targetTable.getColumnCount(); columnIdx++)
        {
            Column targetColumn = targetTable.getColumn(columnIdx);
            Column sourceColumn = sourceTable.findColumn(targetColumn.getName(), _caseSensitive);

            if (sourceColumn == null)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("Column " + targetColumn.getName() + " needs to be created for table " + sourceTable.getName());
                }

                AddColumnChange change = new AddColumnChange(sourceTable,
                                                             targetColumn,
                                                             columnIdx > 0 ? targetTable.getColumn(columnIdx - 1) : null,
                                                             columnIdx < targetTable.getColumnCount() - 1 ? targetTable.getColumn(columnIdx + 1) : null);

                changes.add(change);
                addColumnChanges.put(targetColumn, change);
            }
            else
            {
                changes.addAll(compareColumns(sourceTable, sourceColumn, targetTable, targetColumn));
            }
        }
        // if the last columns in the target table are added, then we note this at the changes
        for (int columnIdx = targetTable.getColumnCount() - 1; columnIdx >= 0; columnIdx--)
        {
            Column          targetColumn = targetTable.getColumn(columnIdx);
            AddColumnChange change       = (AddColumnChange)addColumnChanges.get(targetColumn);

            if (change == null)
            {
                // column was not added, so we can ignore any columns before it that were added
                break;
            }
            else
            {
                change.setAtEnd(true);
            }
        }

        Column[] sourcePK = sourceTable.getPrimaryKeyColumns();
        Column[] targetPK = targetTable.getPrimaryKeyColumns();

        if ((sourcePK.length == 0) && (targetPK.length > 0))
        {
            if (_log.isInfoEnabled())
            {
                _log.info("A primary key needs to be added to the table " + sourceTable.getName());
            }
            // we have to use the target table here because the primary key might
            // reference a new column
            changes.add(new AddPrimaryKeyChange(targetTable, targetPK));
        }
        else if ((targetPK.length == 0) && (sourcePK.length > 0))
        {
            if (_log.isInfoEnabled())
            {
                _log.info("The primary key needs to be removed from the table " + sourceTable.getName());
            }
            changes.add(new RemovePrimaryKeyChange(sourceTable, sourcePK));
        }
        else if ((sourcePK.length > 0) && (targetPK.length > 0))
        {
            boolean changePK = false;

            if (! UtilsCompare.equals(sourceTable.getPrimaryKey(), targetTable.getPrimaryKey()))
            {
                changePK = true;
            }
            else if (sourcePK.length != targetPK.length)
            {
                changePK = true;
            }
            else
            {
                for (int pkColumnIdx = 0; (pkColumnIdx < sourcePK.length) && !changePK; pkColumnIdx++)
                {
                    if ((_caseSensitive  && !sourcePK[pkColumnIdx].getName().equals(targetPK[pkColumnIdx].getName())) ||
                        (!_caseSensitive && !sourcePK[pkColumnIdx].getName().equalsIgnoreCase(targetPK[pkColumnIdx].getName())))
                    {
                        changePK = true;
                    }
                }
            }
            if (changePK)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("The primary key of table " + sourceTable.getName() + " needs to be changed");
                }
                changes.add(new PrimaryKeyChange(sourceTable, sourcePK, targetPK));
            }
        }
        
        HashMap columnPosChanges = new HashMap();

        for (int columnIdx = 0; columnIdx < sourceTable.getColumnCount(); columnIdx++)
        {
            Column sourceColumn = sourceTable.getColumn(columnIdx);
            Column targetColumn = targetTable.findColumn(sourceColumn.getName(), _caseSensitive);

            if (targetColumn == null)
            {
                if (_log.isInfoEnabled())
                {
                    _log.info("Column " + sourceColumn.getName() + " needs to be removed from table " + sourceTable.getName());
                }
                changes.add(new RemoveColumnChange(sourceTable, sourceColumn));
            }
            else
            {
                int targetColumnIdx = targetTable.getColumnIndex(targetColumn);

                if (targetColumnIdx != columnIdx)
                {
                    columnPosChanges.put(sourceColumn, new Integer(targetColumnIdx));
                }
            }
        }
        if (!columnPosChanges.isEmpty())
        {
            changes.add(new ColumnOrderChange(sourceTable, columnPosChanges));
        }

        return changes;
    }

    /**
     * Compares the two columns and returns the changes necessary to create the second
     * column from the first one.
     *  
     * @param sourceTable  The source table which contains the source column
     * @param sourceColumn The source column
     * @param targetTable  The target table which contains the target column
     * @param targetColumn The target column
     * @return The changes
     */
    public List compareColumns(Table  sourceTable,
                               Column sourceColumn,
                               Table  targetTable,
                               Column targetColumn)
    {
        ArrayList changes = new ArrayList();

        // if (_platformInfo.getTargetJdbcType(targetColumn.getTypeCode()) != sourceColumn.getTypeCode())
        if (targetColumn.getTypeCode() != sourceColumn.getTypeCode())
        {
            changes.add(new ColumnDataTypeChange(sourceTable, sourceColumn, targetColumn.getTypeCode()));
        }

        boolean sizeMatters  = _platformInfo.hasSize(sourceColumn.getTypeCode());
        boolean scaleMatters = _platformInfo.hasPrecisionAndScale(sourceColumn.getTypeCode());

        if (sizeMatters &&
            !StringUtils.equals(sourceColumn.getSize(), targetColumn.getSize()))
        {
            changes.add(new ColumnSizeChange(sourceTable, sourceColumn, targetColumn.getSizeAsInt(), targetColumn.getScale()));
        }
        else if (scaleMatters &&
             (!StringUtils.equals(sourceColumn.getSize(), targetColumn.getSize()) ||
             (sourceColumn.getScale() == null && targetColumn.getScale() != null) ||
             (sourceColumn.getScale() != null && !sourceColumn.getScale().equals(targetColumn.getScale()))))
        {
            changes.add(new ColumnSizeChange(sourceTable, sourceColumn, targetColumn.getSizeAsInt(), targetColumn.getScale()));
        }

        Object sourceDefaultValue = sourceColumn.getParsedDefaultValue();
        Object targetDefaultValue = targetColumn.getParsedDefaultValue();

        if (((sourceDefaultValue == null) && (targetDefaultValue != null)) ||
            ((sourceDefaultValue != null) && !sourceDefaultValue.equals(targetDefaultValue)))
        {
            changes.add(new ColumnDefaultValueChange(sourceTable, sourceColumn, targetColumn.getDefaultValue()));
        }

        if (sourceColumn.isRequired() != targetColumn.isRequired())
        {
            changes.add(new ColumnRequiredChange(sourceTable, sourceColumn));
        }
        if (sourceColumn.isAutoIncrement() != targetColumn.isAutoIncrement())
        {
            changes.add(new ColumnAutoIncrementChange(sourceTable, sourceColumn));
        }

        return changes;
    }

    /**
     * Searches in the given table for a corresponding foreign key. If the given key
     * has no name, then a foreign key to the same table with the same columns (but not
     * necessarily in the same order) is searched. If the given key has a name, then the
     * corresponding key also needs to have the same name, or no name at all, but not a
     * different one. 
     * 
     * @param table The table to search in
     * @param fk    The original foreign key
     * @return The corresponding foreign key if found
     */
    private ForeignKey findCorrespondingForeignKey(Table table, ForeignKey fk)
    {
        for (int fkIdx = 0; fkIdx < table.getForeignKeyCount(); fkIdx++)
        {
            ForeignKey curFk = table.getForeignKey(fkIdx);

            if ((_caseSensitive  && fk.equals(curFk)) ||
                (!_caseSensitive && fk.equalsIgnoreCase(curFk)))
            {
                return curFk;
            }
        }
        return null;
    }
    
    /**
     * Searches in the given table for a corresponding unique. If the given unique
     * has no name, then a unique to the same table with the same columns in the
     * same order is searched. If the given unique has a name, then the a corresponding
     * unique also needs to have the same name, or no name at all, but not a different one. 
     * 
     * @param table The table to search in
     * @param unique The original unique
     * @return The corresponding unique if found
     */
    private Unique findCorrespondingUnique(Table table, Unique unique)
    {
        for (int uniqueIdx = 0; uniqueIdx < table.getUniqueCount(); uniqueIdx++)
        {
            Unique curUnique = table.getUnique(uniqueIdx);

            if ((_caseSensitive  && unique.equals(curUnique)) ||
                (!_caseSensitive && unique.equalsIgnoreCase(curUnique)))
            {
                return curUnique;
            }
        }
        return null;
    }
    
    /**
     * Searches in the given table for a corresponding index. If the given index
     * has no name, then a index to the same table with the same columns in the
     * same order is searched. If the given index has a name, then the a corresponding
     * index also needs to have the same name, or no name at all, but not a different one. 
     * 
     * @param table The table to search in
     * @param index The original index
     * @return The corresponding index if found
     */
    private Index findCorrespondingIndex(Table table, Index index)
    {
        for (int indexIdx = 0; indexIdx < table.getIndexCount(); indexIdx++)
        {
            Index curIndex = table.getIndex(indexIdx);

            if ((_caseSensitive  && index.equals(curIndex)) ||
                (!_caseSensitive && index.equalsIgnoreCase(curIndex)))
            {
                return curIndex;
            }
        }
        return null;
    }
    
    /**
     * Searches in the given table for a corresponding check. If the given check
     * has no name, then a check to the same table with the same columns (but not
     * necessarily in the same order) is searched. If the given check has a name, then the
     * corresponding check also needs to have the same name, or no name at all, but not a
     * different one. 
     * 
     * @param table The table to search in
     * @param check The original check
     * @return The corresponding check if found
     */
    private Check findCorrespondingCheck(Table table, Check check)
    {
        for (int chIdx = 0; chIdx < table.getCheckCount(); chIdx++)
        {
            Check curCh = table.getCheck(chIdx);

            if ((_caseSensitive  && check.equals(curCh)) ||
                (!_caseSensitive && check.equalsIgnoreCase(curCh)))
            {
                return curCh;
            }
        }
        return null;
    }   
    
    /**
     * Searches in the given database for a corresponding sequence. If the given sequence
     * has no name, then a sequence (but not
     * necessarily in the same order) is searched. If the given sequence has a name, then the
     * corresponding sequence also needs to have the same name, or no name at all, but not a
     * different one. 
     * 
     * @param database The database to search in
     * @param sequence The original sequence
     * @return The corresponding sequence if found
     */
    private Sequence findCorrespondingSequence(Database database, Sequence sequence)
    {
        for (int sqIdx = 0; sqIdx < database.getSequenceCount(); sqIdx++)
        {
            Sequence curSequence = database.getSequence(sqIdx);

            if ((_caseSensitive  && sequence.equals(curSequence)) ||
                (!_caseSensitive && sequence.equalsIgnoreCase(curSequence)))
            {
                return curSequence;
            }
        }
        return null;
    } 
    
    /**
     * Searches in the given database for a corresponding view. If the given view
     * has no name, then a view (but not
     * necessarily in the same order) is searched. If the given view has a name, then the
     * corresponding view also needs to have the same name, or no name at all, but not a
     * different one. 
     * 
     * @param database The database to search in
     * @param view The original view
     * @return The corresponding view if found
     */
    private View findCorrespondingView(Database database, View view)
    {
        for (int viIdx = 0; viIdx < database.getViewCount(); viIdx++)
        {
            View curView = database.getView(viIdx);

            if ((_caseSensitive  && view.equals(curView)) ||
                (!_caseSensitive && view.equalsIgnoreCase(curView)))
            {
                return curView;
            }
        }
        return null;
    } 
    
    /**
     * Searches in the given database for a corresponding function. If the given function
     * has no name, then a function (but not
     * necessarily in the same order) is searched. If the given function has a name, then the
     * corresponding function also needs to have the same name, or no name at all, but not a
     * different one. 
     * 
     * @param database The database to search in
     * @param function The original function
     * @return The corresponding function if found
     */
    private Function findCorrespondingFunction(Database database, Function function)
    {
        for (int fnIdx = 0; fnIdx < database.getFunctionCount(); fnIdx++)
        {
            Function curFunction = database.getFunction(fnIdx);

            if ((_caseSensitive  && function.equals(curFunction)) ||
                (!_caseSensitive && function.equalsIgnoreCase(curFunction)))
            {
                return curFunction;
            }
        }
        return null;
    } 
    
    /**
     * Searches in the given database for a corresponding trigger. If the given trigger
     * has no name, then a trigger (but not
     * necessarily in the same order) is searched. If the given trigger has a name, then the
     * corresponding trigger also needs to have the same name, or no name at all, but not a
     * different one. 
     * 
     * @param database The database to search in
     * @param trigger The original trigger
     * @return The corresponding trigger if found
     */
    private Trigger findCorrespondingTrigger(Database database, Trigger trigger)
    {
        for (int trIdx = 0; trIdx < database.getTriggerCount(); trIdx++)
        {
            Trigger curTrigger = database.getTrigger(trIdx);

            if ((_caseSensitive  && trigger.equals(curTrigger)) ||
                (!_caseSensitive && trigger.equalsIgnoreCase(curTrigger)))
            {
                return curTrigger;
            }
        }
        return null;
    }      
}
