/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.1  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use. this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License.
 * The Original Code is Openbravo ERP.
 * The Initial Developer of the Original Code is Openbravo SLU
 * All portions are Copyright (C) 2011-2014 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

// = OBDateTimeItem =
// Contains the widget for editing Date Time, it works differently than the OBDateItem
// in that it auto-completes while typing. A TODO: make this widget work the same as the 
// OBDateItem, autocomplete when blurring.
isc.ClassFactory.defineClass('OBDateTimeItem', isc.OBDateItem);

isc.OBDateTimeItem.addClassProperties({

  // ** {{{ autoCompleteData }}} **
  //
  // Autocomplets the date entered.
  // Parameters:
  // * {{{dateFormat}}}: the dateFormat in OB format
  // * {{{value}}}: the current entered value
  autoCompleteDate: function (dateFormat, value, item) {
    var fmt;

    // if (!isTabPressed) {
    if (value === null) {
      return value;
    }
    fmt = OB.Utilities.Date.normalizeDisplayFormat(dateFormat);
    try {
      if (item.getSelectionRange() && item.getSelectionRange()[0] !== value.length) {
        // If we are inserting in a position different from  the last one, we don't autocomplete
        return value;
      }
    } catch (ignored) {}
    var strDate = value;
    var b = fmt.match(/%./g);
    var i = 0,
        j = -1;
    var text = '';
    var length = 0;
    var pos = fmt.indexOf(b[0]) + b[0].length;
    var separator = fmt.substring(pos, pos + 1);
    var separatorH = '';
    pos = fmt.indexOf('%H');
    if (pos !== -1) {
      separatorH = fmt.substring(pos + 2, pos + 3);
    }
    while (strDate.charAt(i)) {
      if (strDate.charAt(i) === separator || strDate.charAt(i) === separatorH || strDate.charAt(i) === ' ') {
        i++;
        continue;
      }
      if (length <= 0) {
        j++;
        if (j > 0) {
          if (b[j] === '%H') {
            text += ' ';
          } else if (b[j] === '%M' || b[j] === '%S') {
            text += separatorH;
          } else {
            text += separator;
          }
        }
        switch (b[j]) {
        case '%d':
        case '%e':
          text += strDate.charAt(i);
          length = 2;
          break;
        case '%m':
          text += strDate.charAt(i);
          length = 2;
          break;
        case '%Y':
          text += strDate.charAt(i);
          length = 4;
          break;
        case '%y':
          text += strDate.charAt(i);
          length = 2;
          break;
        case '%H':
        case '%I':
        case '%k':
        case '%l':
          text += strDate.charAt(i);
          length = 2;
          break;
        case '%M':
          text += strDate.charAt(i);
          length = 2;
          break;
        case '%S':
          text += strDate.charAt(i);
          length = 2;
          break;
        }
      } else {
        text += strDate.charAt(i);
      }
      length--;
      i++;
    }
    return text;
    // IE doesn't detect the onchange event if text value is modified
    // programatically, so it's here called
    // if (i > 7 && (typeof (field.onchange)!='undefined'))
    // field.onchange();
    // }
  }
});

// == OBDateItem properties ==
isc.OBDateTimeItem.addProperties({
  showTime: true,
  fixedTime: null,

  blurValue: function () {
    if (this.showTime) {
      var value = OB.Utilities.Date.OBToJS(this.dateTextField.getElementValue(), OB.Format.dateTime);
      this.setValue(value);
      return value;
    } else {
      return this.Super('blurValue', arguments);
    }
  },

  parseValue: function () {
    if (this.showTime) {
      return this.dateTextField.getElementValue();
    } else {
      return this.Super('parseValue', arguments);
    }
  },

  // ** {{{ change }}} **
  // Called when changing a value.
  change: function (form, item, value, oldValue) { /* transformInput */
    var isADate = value !== null && Object.prototype.toString.call(value) === '[object Date]';
    if (isADate) {
      return;
    }
    // prevent change events from happening
    if (!this.fixedTime || !this.getValue()) {
      //FIXME: autoCompleteDate works wrong if partial time has been set
      var completedDate = isc.OBDateTimeItem.autoCompleteDate(item.dateFormat, value, this);
      if (completedDate !== oldValue) {
        item.setValue(completedDate);
      }
    } else if (this.showTime && this.fixedTime) {
      this.setValue(this.getValue()); // To force change the time with the fixed time (if exists)
    }
  },

  showPicker: function () {
    // keep previously selected date
    this.previousValue = this.getValue();
    this.Super('showPicker', arguments);
  },

  pickerDataChanged: function (picker) {
    var date, time;
    this.Super('pickerDataChanged', arguments);

    // SC sets time to local 0:00 to date in pickerDataChanged method
    // setting now time if there was one previously selected, or current time if not 
    date = this.getValue();
    if (!this.fixedTime) {
      if (this.previousValue) {
        time = this.previousValue;
        delete this.previousValue;

        if (this.isAbsoluteDateTime && Object.prototype.toString.call(time) === '[object Date]') {
          // Trick to ensure that if we are moving from a DST to a non-DST date (or the other way around), the time remains the same (Part 1/2)
          time = new Date(time.getTime() + (time.getTimezoneOffset() * 60000));
        }
      } else {
        time = new Date();
      }
      date.setHours(time.getHours(), time.getMinutes(), time.getSeconds());

      if (this.isAbsoluteDateTime && Object.prototype.toString.call(date) === '[object Date]') {
        // Trick to ensure that if we are moving from a DST to a non-DST date (or the other way around), the time remains the same (Part 2/2)
        date = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      }
    }

    //TODO: There is a problem in the GMT frontier with fixedTimes.
    //      For example, in a "GMT+1" try to set fixedTime: '23:30:00' or fixedTime: '00:30:00'
    //      Although this logic is quite accurate, it is not perfect, and sometimes while selecting a date in the date picker,
    //      the written date is not the same than the selected. Also when saving, the stored value in the database is not the viewed one
    if (this.isAbsoluteDateTime && this.fixedTime && Object.prototype.toString.call(date) === '[object Date]') {
      var tmpDateA = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
      var tmpDateB = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));

      if (date.getDate() === tmpDateA.getDate() && date.getDate() === tmpDateB.getDate()) {
        date.setDate(date.getDate() + 1);
      } else if (date.getDate() < tmpDateA.getDate()) {
        date.setDate(date.getDate() - 2);
      } else if (date.getDate() > tmpDateB.getDate()) {
        date.setDate(date.getDate() + 6);
      }
    }

    this.setValue(date);
    this.updateValue();
  },

  compareValues: function (value1, value2) {
    return (0 === isc.Date.compareDates(value1, value2));
  },

  // Convert a text value entered in this item's text field to a final data value for storage
  parseEditorValue: function (value, form, item) {
    var newValue = value,
        fixedTime = this.fixedTime;
    if (this.showTime) {
      newValue = OB.Utilities.Date.OBToJS(value, OB.Format.dateTime);
    } else {
      newValue = OB.Utilities.Date.OBToJS(value, OB.Format.date);
    }

    if (this.isAbsoluteDateTime) {
      if (Object.prototype.toString.call(newValue) === '[object Date]') {
        newValue = new Date(newValue.getTime() - (newValue.getTimezoneOffset() * 60000));
      }
    }

    if (fixedTime && Object.prototype.toString.call(newValue) === '[object Date]') {
      if (Object.prototype.toString.call(fixedTime) === '[object String]') {
        fixedTime = isc.Time.parseInput(fixedTime);
      }
      if (Object.prototype.toString.call(fixedTime) === '[object Date]') {
        newValue.setHours(fixedTime.getHours(), fixedTime.getMinutes(), fixedTime.getSeconds());
      }
    }

    return newValue;
  },

  // Convert this item's data value to a text value for display in this item's text field
  formatEditorValue: function (value, record, form, item) {
    var newValue = value,
        fixedTime = this.fixedTime;

    if (this.isAbsoluteDateTime) {
      if (Object.prototype.toString.call(newValue) === '[object Date]') {
        newValue = new Date(newValue.getTime() + (newValue.getTimezoneOffset() * 60000));
      }
    }

    if (fixedTime && Object.prototype.toString.call(newValue) === '[object Date]') {
      if (Object.prototype.toString.call(fixedTime) === '[object String]') {
        fixedTime = isc.Time.parseInput(fixedTime);
      }
      if (Object.prototype.toString.call(fixedTime) === '[object Date]') {
        newValue.setHours(fixedTime.getHours(), fixedTime.getMinutes(), fixedTime.getSeconds());
      }
    }

    if (this.showTime) {
      return OB.Utilities.Date.JSToOB(newValue, OB.Format.dateTime);
    } else {
      return OB.Utilities.Date.JSToOB(newValue, OB.Format.date);
    }
  }
});


// == OBDateTimeFromDateItem ==
// OBDateTimeFromDateItem inherits from OBDateTimeItem
// It has the value of the current selected date at 00:00:00
isc.ClassFactory.defineClass('OBDateTimeFromDateItem', isc.OBDateTimeItem);

// == OBDateItem properties ==
isc.OBDateTimeFromDateItem.addProperties({
  showTime: false,
  fixedTime: '00:00:00'
});

// == OBDateTimeToDateItem ==
// OBDateTimeToDateItem inherits from OBDateTimeItem
// It has the value of the next day of the selected date at 00:00:00
isc.ClassFactory.defineClass('OBDateTimeToDateItem', isc.OBDateTimeItem);

// == OBDateItem properties ==
isc.OBDateTimeToDateItem.addProperties({
  showTime: false,
  fixedTime: '00:00:00'
});


// == OBDateTimeToDateItem ==
// OBAbsoluteDateTimeItem inherits from OBDateTimeItem
// It displays the received date and send to the backend the modified one "as it is". So there is no any kind of UTC conversion.
isc.ClassFactory.defineClass('OBAbsoluteDateTimeItem', isc.OBDateTimeItem);

isc.OBAbsoluteDateTimeItem.addProperties({
  isAbsoluteDateTime: true
});