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
 * All portions are Copyright (C) 2011 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
// This file contains direct overrides of Smartclient types.
// Normally we introduce new subtypes of Smartclient types. However for
// some cases it makes sense to directly set properties on top Smartclient
// types. This is done in this file.

// is placed here because the smartclient labels are loaded just after the smartclient
// core
isc.setAutoDraw(false);

// We have dates/times in the database without timezone, we assume GMT therefore 
// for all our date/times we use GMT on both the server and the client
// NOTE: causes issue https://issues.openbravo.com/view.php?id=16014
// NOTE: disabled as now timezone is send from the client to the server
// Time.setDefaultDisplayTimezone(0);

isc.Canvas.addProperties({
  
  // workaround for this issue:
  // http://forums.smartclient.com/showthread.php?p=75007#post75007
  // https://issues.openbravo.com/view.php?id=18841
  cancelNativeScrollOnKeyDown: false,
  
  // make sure that the datasources are also destroyed
  _original_destroy: isc.Canvas.getPrototype().destroy,
  destroy: function() {
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
  click: function() {
    if (this.action) {
      this.action();
    }
  }
});

isc.Button.addProperties({
  click: function() {
    if (this.action) {
      this.action();
    }
  }
});

isc.StaticTextItem.getPrototype().getCanFocus = function() {return false;};

isc.Layout.addProperties({
  
  destroyAndRemoveMembers: function(toDestroy) {
    var i;
    if (!isc.isA.Array(toDestroy)) {
      toDestroy = [toDestroy];
    }
    for (i = 0; i < toDestroy.length; i++) {
      if (toDestroy[i] && toDestroy[i].destroy) {
        toDestroy[i].destroy();
      }
    }
    this.removeMembers(toDestroy);
  }
});

isc.TextItem.addProperties({

  // to support and/or in text items
  // https://issues.openbravo.com/view.php?id=18747
  // NOTE: if Smartclient starts to support and/or, revisit this code
  parseValueExpressions: function(value, fieldName) {
    // enable hack to force Smartclient to support and/or logic
    if (isc.isA.String(value) && 
        (value.toUpperCase().contains(' OR ') || value.toUpperCase().contains(' AND '))) {
      return this.parseOBValueExpressions(value, fieldName);
    }
    return this.Super('parseValueExpressions', arguments);
  },

  // this is a copy of the FormItem.parseValueExpressions to support
  // and/or logic for enum and text fields
  parseOBValueExpressions: function(value, fieldName) {
    var type = this.getType(),
      isValidLogicType = (isc.SimpleType.inheritsFrom(type, 'enum') ||
          isc.SimpleType.inheritsFrom(type, 'text') ||
          isc.SimpleType.inheritsFrom(type, 'integer') ||
          isc.SimpleType.inheritsFrom(type, 'float') ||
          isc.SimpleType.inheritsFrom(type, 'date')
      ),
      opIndex = isc.DynamicForm.getOperatorIndex(),
      validOps = isc.getKeys(opIndex),
      result = { operator: 'and', criteria: [], fieldName: fieldName},
      crit = result.criteria,
      valueParts = [], i,
      ds = isc.DS.get(this.form.expressionDataSource || this.form.dataSource),
      defOpName, defOp, insensitive, field, skipTheseOps,
      valuePart, subCrit, isDateField, useDefaultOperator, opKey, key,
      operator, operators, op, ops, wildCard,
      parts, partCrit, part, partIndex,
      hasPrefix, hasSuffix;
    
    if (!value) {
      value = this.getValue();
    }
    if (!value) {
      return;
    }
    
    if (!isc.isA.String(value)) {
      value += '';
    }
    
    defOpName = this.getOperator();
    if (defOpName) {
      validOps.add(defOpName);
    }
    
    defOp = ds ? ds.getSearchOperator(defOpName) : { id: defOpName };
    
    insensitive = defOp.caseInsensitive;
    
    if (isValidLogicType && value.contains(' and ')) {
        valueParts = value.split(' and ');
    } else if (isValidLogicType && value.contains(' or ')) {
        valueParts = value.split(' or ');
        result.operator = 'or';
    } else if (value.contains('...')) {
        valueParts = value.split('...');
        if (valueParts.length === 2) {
            var tempOps = opIndex['...'],
                tempOp;
    
            if (tempOps) {
              tempOp = (insensitive ? tempOps.find('caseInsensitive', true) : tempOps[0]);
            }
    
            field = ds ? ds.getField(fieldName) : null;
    
            if (field && isc.SimpleType.inheritsFrom(field.type, 'date')) {
                valueParts[0] = new Date(Date.parse(valueParts[0]));
                valueParts[0].logicalDate = true;
                valueParts[1] = new Date(Date.parse(valueParts[1]));
                valueParts[1].logicalDate = true;
            } else if (field && field.type === 'text') {
                
                if (!valueParts[1].endsWith(this._betweenInclusiveEndCrit)) {
                    valueParts[1] += this._betweenInclusiveEndCrit;
                }
            }
    
            return { fieldName: fieldName, operator: tempOp.ID, 
                start: valueParts[0], end: valueParts[1] };
        }
    } else {
        valueParts = [value];
    }
    
    skipTheseOps = [ ' and ', ' or ', '...' ];
    
    for (i = 0; i < valueParts.length; i++) {
        valuePart = valueParts[i];
        subCrit = { fieldName: fieldName };
        field = ds ? ds.getField(fieldName) : null;
        isDateField = (field ? field && isc.SimpleType.inheritsFrom(field.type, 'date') : false);
    
        useDefaultOperator = true;
        for (opKey in opIndex) {
          if (opIndex.hasOwnProperty(opKey)) {
            if (!opKey) {
              continue;
            }
            
            operators = opIndex[opKey];
  
            if (operators && operators.length) {
                operator = operators.find('caseInsensitive', insensitive) || operators[0];
            }
    
            if (!operator || !operator.symbol || skipTheseOps.contains(operator.symbol)) {
              continue;
            }
            if (validOps.contains(operator.symbol) && 
                      (isc.isA.String(valuePart) && valuePart.startsWith(operator.symbol))) {
              useDefaultOperator = false;
              break;
            }
          }
        }
        if (useDefaultOperator) {
          valuePart = defOp.symbol + valuePart;
        }
        
        for (key in opIndex) {
          if (opIndex.hasOwnProperty(key)) {
    
            if (!key) {
              continue;
            }
    
            ops = opIndex[key];
            wildCard = false;
    
            if (key === '==' && isc.isA.String(valuePart) && valuePart.startsWith('=') && 
                    !valuePart.startsWith('==') && !valuePart.startsWith('=(')) 
            {
              wildCard = true;
            }
    
            if (ops && ops.length) {
              op = ops.find('caseInsensitive', insensitive) || ops[0];
            }
    
            if (!op || !op.symbol || skipTheseOps.contains(op.symbol)) {
              continue;
            }
            
            if (validOps.contains(op.symbol) && (
                  (isc.isA.String(valuePart) && valuePart.startsWith(op.symbol)) 
                  || wildCard))
            {
              valuePart = valuePart.substring(op.symbol.length - (wildCard ? 1 : 0));
              if (op.closingSymbol) {
                // this is a containing operator (inSet, notInSet), with opening and 
                // closing symbols...  check that the value endsWith the correct 
                // closing symbol and strip it off - op.processValue() will split 
                // the string for us later
                if (valuePart.endsWith(op.closingSymbol)) {
                    valuePart = valuePart.substring(0, valuePart.length - op.closingSymbol.length);
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
                  for (partIndex=0; partIndex<parts.length; partIndex++) {
                    part = parts[partIndex];
  
                    if (!part || part.length === 0) {
                      continue;
                    }
  
                    partCrit = { fieldName: fieldName, value: part };
  
                    hasPrefix = partIndex > 0;
                    hasSuffix = parts.length - 1 > partIndex;
  
                    if (hasPrefix && hasSuffix) {
                      // this is a contains criteria
                      partCrit.operator = insensitive ? 'iContains' : 'contains';
                    } else if (hasPrefix) {
                      // this is an endsWith criteria
                      partCrit.operator = insensitive ? 'iEndsWith' : 'endsWith';
                    } else if (hasSuffix) {
                      // this is a startsWith criteria
                      partCrit.operator = insensitive ? 'iStartsWith' : 'startsWith';
                    }
  
                    result.criteria.add(partCrit);
                  }
  
                  // clear out the sub-crit's operator - this will prevent it being
                  // added to the result criteria below (we've already added 
                  // everything we need above
                  subCrit.operator = null;
                }
            } else {
              // set the value if one is required for the op
              if (op.valueType !== 'none') {
                subCrit.value = valuePart;
              }
            }
  
            break;
          }
        }
      }
      if (subCrit.operator) {
        result.criteria.add(subCrit);
      }
    }
    if (result.criteria.length === 1) {
      result = result.criteria[0];
    }
    if (result.criteria && result.criteria.length === 0) {
      result = null;
    }
    
    return result;
  },

  // see comments in super type for useDisabledEventMask
  // http://forums.smartclient.com/showthread.php?p=70160#post70160
  // https://issues.openbravo.com/view.php?id=17936
  useDisabledEventMask: function() {
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

  // disable tab to icons
  canTabToIcons: false,
  
  _original_init: isc.FormItem.getPrototype().init,
  init: function() {
    this.obShowIf = this.showIf; // Copy the reference of showIf definition
    OB.Utilities.addRequiredSuffixToBaseStyle(this);
    // and continue with the original init
    this._original_init();
  },
  
  // make sure that the datasources are also destroyed
  _original_destroy: isc.FormItem.getPrototype().destroy,
  destroy: function() {
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
    return this._original_compareValues(value1, value2);
  },
  
  _handleTitleClick: isc.FormItem.getPrototype().handleTitleClick,
  handleTitleClick: function() {
    // always titleclick directly as sc won't call titleclick
    // in that case
    if (this.isDisabled()) {
      this.titleClick(this.form, this);
      return false;
    }
    // forward to the original method
    return this._handleTitleClick();
  },
 
  // overridden als selectValue did not seem to work for ie
  _selectValue: isc.FormItem.getPrototype().selectValue,
  selectValue: function() {
    var element = this.getFocusElement();
    if (element && element.select) {
      element.select();
    } else {
      this._selectValue();
    }
  },
  
  // prevent to many calls to focus in item if there is already focus
  _focusInItem: isc.FormItem.getPrototype().focusInItem,
  focusInItem: function() {
    if (this.hasFocus) {
      return;
    }
    this._focusInItem();
  },

  titleClick: function(form, item){
    item.focusInItem();
    if (item.linkButtonClick) {
      item.linkButtonClick();
    }
  },
  
  // replaced because icon url was not considering 
  // showDisabled false
  // http://forums.smartclient.com/showthread.php?p=70308#post70308
  getIconURL : function (icon, over, disabled, focused) {
    var src = icon.src || this.defaultIconSrc,
        state = (this.showDisabled && (disabled || this.iconIsDisabled(icon))) ? isc.StatefulCanvas.STATE_DISABLED 
                                            : over ? isc.StatefulCanvas.STATE_OVER : null;

    src = isc.Img.urlForState(src, false, focused, state);
    return src;
  },
  
  changed: function(form, item, value){
    this._hasChanged = true;
    this.clearErrors();
    
    if (this.redrawOnChange) {
      this.form.onFieldChanged(this.form, item || this, value);
      this.form.view.toolBar.refreshCustomButtonsView(this.form.view);
    }
  },
  
  focus: function(form, item){
    var view = OB.Utilities.determineViewOfFormItem(item);
    if (view) {
      view.lastFocusedItem = this;
    }
    this.hasFocus = true;
  },
  
  blur: function(form, item){
    if (item._hasChanged && form && form.handleItemChange) {
      form.handleItemChange(this);
    }
  },
  
  // prevent a jscript error in ie when closing a tab
  // https://issues.openbravo.com/view.php?id=18890
  blurItem: function() {
    if (!this.form || this.form.destroyed) {
      return;
    }
    this.Super('blurItem', arguments);
  },

  isDisabled: function(ignoreTemporaryDisabled){
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
  isFocusable: function(ignoreTemporaryDisabled){    
    return this.getCanFocus() &&
        this.isVisible() && !this.isDisabled(ignoreTemporaryDisabled);
  },
  
  // overridden to never use the forms datasource for fields
  getOptionDataSource : function () {
    var ods = this.optionDataSource;

    if (isc.isA.String(ods)) {
      ods = isc.DataSource.getDataSource(ods);
    }
    
    return ods;
  }
});

// overridden to never show a prompt. A prompt can be created manually 
// when overriding for example the DataSource (see the OBStandardView).
isc.RPCManager.showPrompt = false;
isc.RPCManager.neverShowPrompt = true;

// Overrides hasFireBug function to always return false,
// the SmartClient code has too many trace() calls that result in worse
// performance when using Firefox/Firebug
isc.Log.hasFireBug = function() { return false; };

// prevent caching of picklists globally to prevent js error 
// when a picklist has been detached from a formitem
isc.PickList.getPrototype().cachePickListResults = false;

isc.RelativeDateItem.addProperties({
  displayFormat: OB.Format.date,
  inputFormat: OB.Format.date,
  pickerConstructor: 'OBDateChooser',
  
  // overridden as the displayDateFormat does not seem to work fine
  formatDate: function(dt) {
   return OB.Utilities.Date.JSToOB(dt, OB.Format.date);
  },

  // updateEditor() Fired when the value changes (via updateValue or setValue)
  // Shows or hides the quantity box and updates the hint to reflect the current value.
  // overridden to solve: https://issues.openbravo.com/view.php?id=16295
  updateEditor : function () {

      if (!this.valueField || !this.quantityField) {
        return;
      }

      var focusItem,
          selectionRange,
          mustRefocus = false;

      if (this.valueField.hasFocus) {
          focusItem = this.valueField;
          selectionRange = this.valueField.getSelectionRange();
      } else if (this.quantityField.hasFocus) {
          focusItem = this.quantityField;
          selectionRange = this.quantityField.getSelectionRange();
      }
      
      var value = this.valueField.getValue(),
          quantity = this.quantityField.getValue();

      var showQuantity = (value && isc.isA.String(value) && this.relativePresets[value]);

      if (!showQuantity) {
          if (this.quantityField.isVisible()) {
              mustRefocus = true;
              this.quantityField.hide();
          }
      } else {
          if (!this.quantityField.isVisible()) {
            mustRefocus = true;
              this.quantityField.show();
          }
      }

      if (this.calculatedDateField) {
        value = this.getValue();
        var displayValue = this.editor.getValue('valueField');
        // only show if the value is not a direct date
        // https://issues.openbravo.com/view.php?id=16295
        if (displayValue && displayValue.length > 0) {
          displayValue = OB.Utilities.trim(displayValue);
          // if it starts with a number then it must be a real date
          if (displayValue.charAt(0) < '0' || displayValue.charAt(0) > '9' ) {
            this.calculatedDateField.setValue(!value ? '' : 
              '(' + this.formatDate(value) + ')');          
          } else {
            this.calculatedDateField.setValue('');                  
          }
        } else {
          this.calculatedDateField.setValue('');                  
        }
      }
      
      // If we redrew the form to show or hide the qty field, we may need to refocus and
      // reset the selection range
      
      if (mustRefocus && focusItem !== null) {
        if (!showQuantity && focusItem === this.quantityField) {
          this.valueField.focusInItem();
        } else {
          if (selectionRange) {
            focusItem.delayCall('setSelectionRange', [selectionRange[0],selectionRange[1]]);
          }
        }
      }
      this.calculatedDateField.canFocus = false;
  },
    
  // overridden because the picker is now part of the combo and not a separate field.
  // custom code to center the picker over the picker icon
  getPickerRect : function () {
    // we want the date chooser to float centered over the picker icon.
    var form = this.canvas;
    return [this.getPageLeft() + form.getLeft(), this.getPageTop() + form.getTop() - 40];
  }

});

isc.DateItem.changeDefaults('textFieldDefaults', {
  isDisabled: function() {
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
  handleError : function (response, request) {
    if (!request.willHandleError) {
      isc.RPCManager.handleError(response, request);
    }
  }
});

// Prevent errors in smartclient for screenreader, is quite new and unstable for now
isc.screenReader = false;

// uncomment this code and put a breakpoint to get a better control
// on from where async operations are started
//isc.Class._fireOnPause = isc.Class.fireOnPause;
//isc.Class.fireOnPause = function(id, callback, delay, target, instanceID) {
//  isc.Class._fireOnPause(id, callback, delay, target, instanceID);
//};

// Allow searchs (with full dataset in memory/the datasource) not distinguish
// between accent or non-accent words
isc.DataSource.addProperties({
  
  // workaround for this issue:
  // http://forums.smartclient.com/showthread.php?p=75186#post75186
  // https://issues.openbravo.com/view.php?id=18841
  compareAdvancedCriteria: function() {
    return 1;
  },
  
  _fieldMatchesFilter: isc.DataSource.getPrototype().fieldMatchesFilter,
  fieldMatchesFilter: function(fieldValue, filterValue, requestProperties) {
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