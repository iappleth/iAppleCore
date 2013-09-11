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
 * All portions are Copyright (C) 2011-2013 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
// This file contains direct overrides of Smartclient types.
// Normally we introduce new subtypes of Smartclient types. However for
// some cases it makes sense to directly set properties on top Smartclient
// types. This is done in this file.
// We have dates/times in the database without timezone, we assume GMT therefore 
// for all our date/times we use GMT on both the server and the client
// NOTE: causes issue https://issues.openbravo.com/view.php?id=16014
// NOTE: disabled as now timezone is send from the client to the server
// Time.setDefaultDisplayTimezone(0);
// Call duplicated - we include SmartClient embedded in StaticResources for classic windows
isc.setAutoDraw(false);
isc.screenReader = false;

isc.DataSource.serializeTimeAsDatetime = true;

isc.DataSource.addProperties({
  compareDates: function (date1, date2, fieldName, otherFieldName) {
    var field = this.getField(fieldName),
        otherField = otherFieldName ? this.getField(otherFieldName) : null;
    if ((field && (field.type === "datetime" || field.type === "_id_24" || field.type === "_id_16")) || (otherField && (otherField.type === "datetime" || otherField.type === "_id_24" || otherField.type === "_id_16"))) {
      return Date.compareDates(date1, date2);
    } else {
      return Date.compareLogicalDates(date1, date2);
    }
  }
});

isc.DataSource.addSearchOperator({
  ID: 'exists',
  // Compares two criteria that use the 'exists' operator:
  // - If they are the same, return 0 (no need to reapply the filter)
  // - If they are not the same, return -1 to force a datasource call. 
  // - Returning 1 would imply that the new criterion is more retrictive than the old criterion and that the filtered results can be
  // fetched locally, we don't want to do that with criteria that use the 'exists' operator
  compareCriteria: function (newCriterion, oldCriterion, operator, ds) {
    var newValues, oldValues, i;
    if (newCriterion.fieldName === oldCriterion.fieldName && newCriterion.existsQuery === oldCriterion.existsQuery) {
      // If the fieldName and the exists query is the same, compare the values
      newValues = newCriterion.value;
      oldValues = oldCriterion.value;
      if (newValues.length === oldValues.length) {
        // They have the same length, check if they are the same in the same order
        for (i = 0; i < newValues.length; i++) {
          if (newValues[i] !== oldValues[i]) {
            return -1;
          }
        }
        // Same fieldName, same existsQuery, same values: both criterias are the same
        return 0;
      } else {
        return -1;
      }
    } else {
      return -1;
    }
  }
});

isc.ResultSet.addProperties({
  _original_removeCacheData: isc.ResultSet.getPrototype().removeCacheData,
  removeCacheData: function (updateData) {
    var filteringOnClient = this.allRows !== null,
        i, index, ds;
    this._original_removeCacheData(updateData);
    if (filteringOnClient) {
      ds = this.getDataSource();
      // remove any rows that were present in the cache
      for (i = 0; i < updateData.length; i++) {
        index = ds.findByKeys(updateData[i], this.localData);
        if (index !== -1) {
          this.localData.removeAt(index);
        }
      }
    }
  }
});


isc.Canvas.addProperties({

  // make sure that the datasources are also destroyed
  _original_destroy: isc.Canvas.getPrototype().destroy,
  destroy: function () {
    if (this.optionDataSource && !this.optionDataSource.potentiallyShared) {
      this.optionDataSource.destroy();
      this.optionDataSource = null;
    }
    if (this.dataSource && !this.dataSource.potentiallyShared) {
      this.dataSource.destroy();
      this.dataSource = null;
    }
    this._original_destroy();
  }
});

//Let the click on an ImgButton and Button fall through to its action method 
isc.ImgButton.addProperties({
  click: function () {
    if (this.action) {
      this.action();
    }
  }
});

isc.Button.addProperties({
  click: function () {
    if (this.action) {
      this.action();
    }
  }
});

isc.StaticTextItem.addProperties({
  canFocus: false
});

// we generate datasources with minimal field sets to 
// minimize the javascript, therefore the standard
// processValue implementation does not work for this
// filter operator, it uses the datasource field definitions
// therefore override it to only return the value
// see DataSourceConstants.MINIMAL_PROPERTY_OUTPUT
// https://issues.openbravo.com/view.php?id=18557
if (!isc.DynamicForm.getOperatorIndex()) {
  isc.DynamicForm.buildOperatorIndex();
}
isc.DynamicForm.getOperatorIndex()['=.'][0].processValue = function (value, ds) {
  return value;
};

isc.Layout.addProperties({

  destroyAndRemoveMembers: function (toDestroy) {
    var i, len, nextIndex = 0;
    if (!isc.isA.Array(toDestroy)) {
      toDestroy = [toDestroy];
    }
    len = toDestroy.length;
    for (i = 0; i < len; i++) {
      if (toDestroy[nextIndex] && toDestroy[nextIndex].destroy) {
        toDestroy[nextIndex].destroy();
      }
      if (toDestroy.length === len) {
        nextIndex = nextIndex + 1;
      }
    }
    this.removeMembers(toDestroy);
  }
});

isc.TextItem.addProperties({

  // to support and/or in text items
  // https://issues.openbravo.com/view.php?id=18747
  // NOTE: if Smartclient starts to support and/or, revisit this code
  parseValueExpressions: function (value, fieldName) {
    // enable hack to force Smartclient to support and/or logic
    if (isc.isA.String(value) && (value.toUpperCase().contains(' OR ') || value.toUpperCase().contains(' AND '))) {
      return this.parseOBValueExpressions(value, fieldName);
    }
    return this.Super('parseValueExpressions', arguments);
  },

  // this is a copy of the FormItem.parseValueExpressions to support
  // and/or logic for enum and text fields
  parseOBValueExpressions: function (value, fieldName) {
    var type = this.getType(),
        i, isValidLogicType = (isc.SimpleType.inheritsFrom(type, 'enum') || isc.SimpleType.inheritsFrom(type, 'text') || isc.SimpleType.inheritsFrom(type, 'integer') || isc.SimpleType.inheritsFrom(type, 'float') || isc.SimpleType.inheritsFrom(type, 'date')),
        opIndex = isc.DynamicForm.getOperatorIndex(),
        validOps = isc.getKeys(opIndex),
        result = {
        operator: "and",
        criteria: []
        },
        crit = result.criteria,
        valueParts = [],
        allowEx = true,
        ds = isc.DS.get(this.form.expressionDataSource || this.form.dataSource);

    if (!value) {
      value = this.getValue();
    }
    if (!value) {
      return;
    }

    if (!isc.isA.String(value)) {
      value += "";
    }

    var tempOps, tempOp;

    var defOpName = this.getOperator();
    if (defOpName) {
      validOps.add(defOpName);
    }

    var defOp = ds ? ds.getSearchOperator(defOpName) : {
      id: defOpName
    };

    var field, insensitive = defOp.caseInsensitive;
    var partIndex, parts, partCrit, part;

    if (isValidLogicType && value.contains(" and ")) {
      valueParts = value.split(" and ");
    } else if (isValidLogicType && value.contains(" or ")) {
      valueParts = value.split(" or ");
      result.operator = "or";
    } else if (value.contains("...")) {
      valueParts = value.split("...");
      if (valueParts.length === 2) {
        tempOps = opIndex["..."];

        if (tempOps) {
          tempOp = (insensitive ? tempOps.find("caseInsensitive", true) : tempOps[0]);
        }

        field = ds ? ds.getField(fieldName) : null;

        if (field && isc.SimpleType.inheritsFrom(field.type, "date")) {
          valueParts[0] = new Date(Date.parse(valueParts[0]));
          valueParts[0].logicalDate = true;
          valueParts[1] = new Date(Date.parse(valueParts[1]));
          valueParts[1].logicalDate = true;
        } else if (field && field.type === "text") {

          if (!valueParts[1].endsWith(this._betweenInclusiveEndCrit)) {
            valueParts[1] += this._betweenInclusiveEndCrit;
          }
        }

        return {
          fieldName: fieldName,
          operator: tempOp.ID,
          start: valueParts[0],
          end: valueParts[1]
        };
      }
    } else {
      valueParts = [value];
    }

    var skipTheseOps = [" and ", " or "];

    for (i = 0; i < valueParts.length; i++) {
      var key, valuePart = valueParts[i],
          subCrit = {
          fieldName: fieldName
          };

      field = ds ? ds.getField(fieldName) : null;
      var isDateField = (field ? field && isc.SimpleType.inheritsFrom(field.type, "date") : false),
          valueHasExpression = false;

      for (key in opIndex) {
        if (opIndex.hasOwnProperty(key)) {
          if (!key) {
            continue;
          }

          var ops = opIndex[key],
              wildCard = false,
              op;

          if (key === "==" && isc.isA.String(valuePart) && valuePart.startsWith("=") && !valuePart.startsWith("==") && !valuePart.startsWith("=(")) {
            wildCard = true;
          }

          if (ops && ops.length) {
            op = ops.find("caseInsensitive", insensitive) || ops[0];
          }

          if (!op || !op.symbol || skipTheseOps.contains(op.symbol)) {
            continue;
          }

          if (validOps.contains(op.symbol) && ((isc.isA.String(valuePart) && (valuePart.startsWith(op.symbol) ||

          (op.symbol === "..." && valuePart.contains(op.symbol)))) || wildCard)) {
            valueHasExpression = true;

            if (valuePart.startsWith(op.symbol)) {
              valuePart = valuePart.substring(op.symbol.length - (wildCard ? 1 : 0));
            }

            if (op.closingSymbol) {
              // this is a containing operator (inSet, notInSet), with opening and 
              // closing symbols...  check that the value endsWith the correct 
              // closing symbol and strip it off - op.processValue() will split 
              // the string for us later
              if (valuePart.endsWith(op.closingSymbol)) {
                valuePart = valuePart.substring(0, valuePart.length - op.closingSymbol.length);
              }
            }

            if (valuePart.contains("...")) {
              // allow range operators as well as conjunctives
              var rangeValueParts = valuePart.split("...");
              if (rangeValueParts.length === 2) {
                tempOps = opIndex["..."];

                if (tempOps) {
                  tempOp = (insensitive ? tempOps.find("caseInsensitive", true) : tempOps[0]);
                }

                field = ds ? ds.getField(fieldName) : null;

                if (field && isc.SimpleType.inheritsFrom(field.type, "date")) {
                  rangeValueParts[0] = new Date(Date.parse(rangeValueParts[0]));
                  rangeValueParts[0].logicalDate = true;
                  rangeValueParts[1] = new Date(Date.parse(rangeValueParts[1]));
                  rangeValueParts[1].logicalDate = true;
                } else if (field && field.type === "text") {

                  if (!rangeValueParts[1].endsWith(this._betweenInclusiveEndCrit)) {
                    rangeValueParts[1] += this._betweenInclusiveEndCrit;
                  }
                }

                result.criteria.add({
                  fieldName: fieldName,
                  operator: tempOp.ID,
                  start: rangeValueParts[0],
                  end: rangeValueParts[1]
                });

                continue;
              }
            }

            if (isDateField) {
              valuePart = new Date(Date.parse(valuePart));
              valuePart.logicalDate = true;
            }

            subCrit.operator = op.ID;

            if (op.processValue) {
              valuePart = op.processValue(valuePart, ds);
            }

            if (op.wildCard && isc.isA.String(valuePart) && valuePart.contains(op.wildCard)) {
              // this is an operator that supports wildCards (equals, notEquals)...
              parts = valuePart.split(op.wildCard);

              if (parts.length > 1) {
                for (partIndex = 0; partIndex < parts.length; partIndex++) {
                  part = parts[partIndex];

                  if (!part || part.length === 0) {
                    continue;
                  }

                  partCrit = {
                    fieldName: fieldName,
                    value: part
                  };

                  var hasPrefix = partIndex > 0,
                      hasSuffix = parts.length - 1 > partIndex;

                  if (hasPrefix && hasSuffix) {
                    // this is a contains criteria
                    partCrit.operator = insensitive ? "iContains" : "contains";
                  } else if (hasPrefix) {
                    // this is an endsWith criteria
                    partCrit.operator = insensitive ? "iEndsWith" : "endsWith";
                  } else if (hasSuffix) {
                    // this is a startsWith criteria
                    partCrit.operator = insensitive ? "iStartsWith" : "startsWith";
                  }

                  result.criteria.add(partCrit);
                }

                // we'll include a check for this attribute when rebuilding the 
                // value later
                this._lastValueHadWildCards = true;

                // clear out the sub-crit's operator - this will prevent it being
                // added to the result criteria below (we've already added 
                // everything we need above
                subCrit.operator = null;
              }
            } else {
              // set the value if one is required for the op
              if (op.valueType !== "none") {
                subCrit.value = valuePart;
              }
            }

            break;
          }
        }
      }
      if (!valueHasExpression) {
        // this was a straight expression like "10"
        subCrit.operator = defOpName;
        subCrit.value = valuePart;
      }
      if (subCrit.operator) {
        result.criteria.add(subCrit);
      }
    }
    //  this.logWarn("Parsed expression:" + value + " to criterion:" + this.echo(result));
    if (result.criteria.length === 1) {
      result = result.criteria[0];
    }
    if (result.criteria && result.criteria.length === 0) {
      result = null;
    }
    if (!result.fieldName) {
      result.fieldName = fieldName;
    }

    return result;
  },

  // see comments in super type for useDisabledEventMask
  // http://forums.smartclient.com/showthread.php?p=70160#post70160
  // https://issues.openbravo.com/view.php?id=17936
  useDisabledEventMask: function () {
    if (isc.Browser.isIE) {
      return false;
    }
    return this.Super('useDisabledEventMask', arguments);
  }

});

// NOTE BEWARE: methods/props added here will overwrite and NOT extend FormItem
// properties! 
isc.FormItem.addProperties({
  // default, is overridden in generated field template
  personalizable: true,
  updatable: true,
  width: '*',

  // always take up space when an item is hidden in a form
  alwaysTakeSpace: true,

  // If an item has an optiomDataSource, a fetch is made in the init() or setValue() ...
  // "The fetch occurs if the item value is non null on initial draw of the form or whenever setValue() is called"
  // http://www.smartclient.com/docs/8.1/a/b/c/go.html#attr..FormItem.fetchMissingValues
  fetchMissingValues: false,

  // disable tab to icons
  canTabToIcons: false,

  _original_validate: isc.FormItem.getPrototype().validate,
  validate: function () {

    // prevent validation when we are showing the editor and moving
    // the focus around
    if (this.form && this.form.grid && this.form.grid._showingEditor) {
      return;
    }
    return this._original_validate();
  },

  _original_init: isc.FormItem.getPrototype().init,
  init: function () {
    this.obShowIf = this.showIf; // Copy the reference of showIf definition
    OB.Utilities.addRequiredSuffixToBaseStyle(this);
    // and continue with the original init
    this._original_init();
  },

  _handleEditorExit: isc.FormItem.getPrototype().handleEditorExit,
  handleEditorExit: function () {
    if (this.form && this.form._isRedrawing) {
      return;
    }
    return this._handleEditorExit();
  },

  // make sure that the datasources are also destroyed
  _original_destroy: isc.FormItem.getPrototype().destroy,
  destroy: function () {
    if (this.optionDataSource && !this.optionDataSource.potentiallyShared) {
      this.optionDataSource.destroy();
      this.optionDataSource = null;
    }
    if (this.dataSource && !this.dataSource.potentiallyShared) {
      this.dataSource.destroy();
      this.dataSource = null;
    }
    this._original_destroy();
  },

  // overridden to not show if hiddenInForm is set
  _show: isc.FormItem.getPrototype().show,
  show: function (arg1) {
    if (this.hiddenInForm) {
      return;
    }
    this._show(arg1);
  },

  // overridden to not make a difference between undefined and null
  _original_compareValues: isc.FormItem.getPrototype().compareValues,
  compareValues: function (value1, value2) {
    var undef, val1NullOrUndefined = (value1 === null || value1 === undef || value1 === ''),
        val2NullOrUndefined = (value2 === null || value2 === undef || value2 === '');
    if (val1NullOrUndefined && val2NullOrUndefined) {
      return true;
    }
    // a special case, smartclient makes a mistake when comparing
    // zero against an empty string
    if (value1 === 0 && value2 !== 0) {
      return false;
    }
    if (value1 !== 0 && value2 === 0) {
      return false;
    }
    return this._original_compareValues(value1, value2);
  },

  _handleTitleClick: isc.FormItem.getPrototype().handleTitleClick,
  handleTitleClick: function () {
    // always titleclick directly as sc won't call titleclick
    // in that case
    if (this.isDisabled()) {
      this.titleClick(this.form, this);
      return false;
    }
    // forward to the original method
    return this._handleTitleClick();
  },

  titleClick: function (form, item) {
    item.focusInItem();
    if (item.linkButtonClick) {
      item.linkButtonClick();
    }
  },

  changed: function (form, item, value) {
    this._hasChanged = true;
    this.clearErrors();

    if (this.redrawOnChange) {
      if (this.form.onFieldChanged) {
        this.form.onFieldChanged(this.form, item || this, value);
      }
      if (this.form && this.form.view && this.form.view.toolBar && this.form.view.toolBar.refreshCustomButtonsView) {
        this.form.view.toolBar.refreshCustomButtonsView(this.form.view);
      }
    }
  },

  focus: function (form, item) {
    var view = OB.Utilities.determineViewOfFormItem(item);
    if (view) {
      view.lastFocusedItem = this;
    }
    this.hasFocus = true;
  },

  blur: function (form, item) {
    if (this.form && this.form._isRedrawing) {
      return;
    }
    if (item._hasChanged && form && form.handleItemChange) {
      form.handleItemChange(item);
    }
  },

  // prevent a jscript error in ie when closing a tab
  // https://issues.openbravo.com/view.php?id=18890
  _doBlurItem: isc.FormItem.getPrototype().blurItem,
  blurItem: function () {
    if (!this.form || this.form.destroyed || this.form._isRedrawing) {
      return;
    }
    this._doBlurItem();
  },

  isDisabled: function (ignoreTemporaryDisabled) {
    if (!this.form) {
      return false;
    }
    // disabled if the property can not be updated and the form or record is new
    // explicitly comparing with false as it is only set for edit form fields
    if (this.updatable === false && !(this.form.isNew || this.form.getValue('_new'))) {
      // note: see the ob-view-form.js resetCanFocus method 
      this.canFocus = false;
      return true;
    }
    var disabled = this.form.readOnly || this.readonly || this.disabled;
    // allow focus if all items are disabled
    // note: see the ob-view-form.js resetCanFocus method 
    this.canFocus = this.form.allItemsDisabled || !disabled;
    return (!ignoreTemporaryDisabled && this.form.allItemsDisabled) || disabled;
  },

  // return all relevant focus condition
  isFocusable: function (ignoreTemporaryDisabled) {
    return this.getCanFocus() && this.isVisible() && !this.isDisabled(ignoreTemporaryDisabled);
  },

  // overridden to never use the forms datasource for fields
  getOptionDataSource: function () {
    var ods = this.optionDataSource;

    if (isc.isA.String(ods)) {
      ods = isc.DataSource.getDataSource(ods);
    }

    return ods;
  }
});

// To fix issue https://issues.openbravo.com/view.php?id=21786
isc.ComboBoxItem.addProperties({
  isPickListShown: function () {
    return (this.pickList ? (this.pickList.isDrawn() && this.pickList.isVisible()) : false);
  },

  hidePicker: function () {
    if (this.pickList) {
      this.pickList.hideClickMask();
      this.pickList.hide();
    }
  }
});

// overridden to never show a prompt. A prompt can be created manually 
// when overriding for example the DataSource (see the OBStandardView).
isc.RPCManager.showPrompt = false;
isc.RPCManager.neverShowPrompt = true;

// Overrides hasFireBug function to always return false,
// the SmartClient code has too many trace() calls that result in worse
// performance when using Firefox/Firebug
isc.Log.hasFireBug = function () {
  return false;
};

// prevent caching of picklists globally to prevent js error 
// when a picklist has been detached from a formitem
isc.PickList.getPrototype().cachePickListResults = false;

isc.DateItem.changeDefaults('textFieldDefaults', {
  isDisabled: function () {
    var disabled = this.Super('isDisabled', arguments);
    if (disabled) {
      return true;
    }
    if (this.parentItem.isDisabled()) {
      return true;
    }
    return false;
  }
});

// if not overridden then also errors handled by OB are shown in a popup
// see https://issues.openbravo.com/view.php?id=17136
isc.RPCManager.addClassProperties({
  _handleError: isc.RPCManager.getPrototype().handleError,
  handleError: function (response, request) {
    if (!request.willHandleError) {
      isc.RPCManager.handleError(response, request);
    }
  }
});

// uncomment this code and put a breakpoint to get a better control
// on from where async operations are started
//isc.Class._fireOnPause = isc.Class.fireOnPause;
//isc.Class.fireOnPause = function(id, callback, delay, target, instanceID) {
//  isc.Class._fireOnPause(id, callback, delay, target, instanceID);
//};
// Allow searchs (with full dataset in memory/the datasource) not distinguish
// between accent or non-accent words
isc.DataSource.addProperties({

  _fieldMatchesFilter: isc.DataSource.getPrototype().fieldMatchesFilter,
  fieldMatchesFilter: function (fieldValue, filterValue, requestProperties) {
    if (fieldValue && typeof fieldValue === 'string') {
      fieldValue = fieldValue.replace(/á|à|ä|â/g, 'a').replace(/Á|À|Ä|Â/g, 'A');
      fieldValue = fieldValue.replace(/é|è|ë|ê/g, 'e').replace(/É|È|Ë|Ê/g, 'E');
      fieldValue = fieldValue.replace(/í|ì|ï|î/g, 'i').replace(/Í|Ì|Ï|Î/g, 'I');
      fieldValue = fieldValue.replace(/ó|ò|ö|ô/g, 'o').replace(/Ó|Ò|Ö|Ô/g, 'O');
      fieldValue = fieldValue.replace(/ú|ù|ü|û/g, 'u').replace(/Ú|Ù|Ü|Û/g, 'U');
      fieldValue = fieldValue.replace(/ç/g, 'c').replace(/Ç/g, 'C');
      fieldValue = fieldValue.replace(/ñ/g, 'n').replace(/Ñ/g, 'N');
    }
    if (filterValue && typeof filterValue === 'string') {
      filterValue = filterValue.replace(/á|à|ä|â/g, 'a').replace(/Á|À|Ä|Â/g, 'A');
      filterValue = filterValue.replace(/é|è|ë|ê/g, 'e').replace(/É|È|Ë|Ê/g, 'E');
      filterValue = filterValue.replace(/í|ì|ï|î/g, 'i').replace(/Í|Ì|Ï|Î/g, 'I');
      filterValue = filterValue.replace(/ó|ò|ö|ô/g, 'o').replace(/Ó|Ò|Ö|Ô/g, 'O');
      filterValue = filterValue.replace(/ú|ù|ü|û/g, 'u').replace(/Ú|Ù|Ü|Û/g, 'U');
      filterValue = filterValue.replace(/ç/g, 'c').replace(/Ç/g, 'C');
      filterValue = filterValue.replace(/ñ/g, 'n').replace(/Ñ/g, 'N');
    }
    return this._fieldMatchesFilter(fieldValue, filterValue, requestProperties);
  }
});

// When filtering strings in backend, spaces are replaced by % in the resultant
// ilike expression. For example if filter is "jo sm" the query will be 
// "ilike '%jo%sm%'", so "John Smith" would be found. When filtering in client
// Smartclient doesn't do this conversion. This code, overwrittes Smartclioent
// string comparator to work like in backend.
(function () {
  var i, containsNoBlanks, originalCondition, stringComparisonNoBlanks, operators;

  // Replaces isc.contains in the custom string comparator. Blank spaces are not
  // part of the comparision, but they separate different tokens to be found in 
  // the text. It returns true in case the tested text contains, in order, all the
  // tokens separated by blank spaces. 
  containsNoBlanks = function (tested, test) {
    var tokens, token, i, pendingToTest, idx;
    if (!tested) {
      return true;
    }

    tokens = test.split(' ');
    pendingToTest = tested;
    for (i = 0; i < tokens.length; i++) {
      token = tokens[i];
      idx = pendingToTest.indexOf(token);
      if (token && idx === -1) {
        return false;
      }
      pendingToTest = pendingToTest.substring(idx + token.length);
    }
    return true;
  };

  // Copied from SmartClient's DataSource.js. The only difference is how contains
  // is computed.
  // Instead of using isc.contains, containsNoBlanks is used.
  stringComparisonNoBlanks = function (value, record, fieldName, criterion, operator, ds) {
    var field = ds.getField(fieldName);
    var tested = isc.DataSource.getPathValue(record, field ? field : fieldName);
    var test = value;
    var result;
    if (isc.isA.Number(tested)) {
      tested = tested.toString();
    }

    // Special-case code to match server-side exception when we get a request to do a string-
    // match on a non-text field (note that numbers are OK - they are converted above)
    if (tested !== null && !isc.isA.String(tested)) {
      return operator.negate;
    }

    // - a null data value cannot contain anything, including null.
    // - a non-null data value is considered to contain null. We originally followed Javascript
    //   and considered non-null values to NOT contain null; however, it is not possible to implement
    //   this scheme in Hibernate without resorting to hackery.  It was easier to change the 
    //   client-side rule
    if (tested === null) {
      return ds._strictMode ? ds._withinLogicalNot : operator.negate;
    }

    // Convert a null filter to the empty string, so our comparisons will work
    if (test === null) {
      test = "";
    }

    if (isc.isA.Number(test)) {
      test = test.toString();
    }

    if (!isc.isA.String(test) || !isc.isA.String(tested)) {
      return operator.negate;
    }

    if (operator.caseInsensitive) {
      tested = tested.toLowerCase();
      test = test.toLowerCase();
    }
    if (operator.startsWith) {
      result = isc.startsWith(tested, test);
    } else if (operator.endsWith) {
      result = isc.endsWith(tested, test);
    } else if (operator.equals) {
      result = (tested === test);
    } else {
      result = containsNoBlanks(tested, test); // using custom contains instead of isc.contains
    }

    if (operator.negate) {
      return !result;
    } else {
      return result;
    }
  };

  // replace all the operators that have the same string comparator iContains has
  operators = isc.DataSource._operators || isc.DataSource.$4r; // Iternal SC property
  originalCondition = operators.iContains.condition;

  for (i in operators) {
    if (operators.hasOwnProperty(i) && operators[i].condition === originalCondition) {
      operators[i].condition = stringComparisonNoBlanks;
    }
  }
}());