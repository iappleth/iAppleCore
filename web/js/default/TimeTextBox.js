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
 * All portions are Copyright (C) 2001-2007 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
*/

// Function to build the validation for text box
validateTimeTextBox= function(/*String*/ id){
  isValidTimeTextBox(id);
  var required = document.getElementById(id).getAttribute("required");
  if (required == "true") isMissingTimeTextBox(id);
  isInRangeTimeTextBox(id);
}

isValidTimeTextBox= function(/*String*/ id){
  var isValid = this.isValidTime(document.getElementById(id).value);
  var element = document.getElementById(id+"invalidSpan");
  if (isValid)
    element.style.display="none";
  else
    element.style.display="";
}

isMissingTimeTextBox= function(/*String*/ id){
  var isMissing = document.getElementById(id).value.length == 0;
  var element = document.getElementById(id+"missingSpan");
  if (isMissing)
    element.style.display="";
  else
    element.style.display="none";
}

isInRangeTimeTextBox= function(/*String*/ id){
  var isInRange = true;
  var element = document.getElementById(id+"rangeSpan");
  if (isInRange)
    element.style.display="none";
  else
    element.style.display="";
}

isValidTime = function(/*String*/str_datetime) {
	if (str_datetime.length == 0) return true;
// datetime parsing and formatting routimes. modify them if you wish other datetime format
//function str2dt (str_datetime) {
	var re_date = /^(\d+)\:(\d+)\:(\d+)$/;
	if (!re_date.exec(str_datetime)) {
		re_date = /^(\d+)\:(\d+)$/;
		if (!re_date.exec(str_datetime)) 
			return false;
  }
//  if (RegExp.$1 < 0 || RegExp.$1 > 23) return false;
//  if (RegExp.$2 < 0 || RegExp.$2 > 59) return false;
//  if (RegExp.$3 < 0 || RegExp.$3 > 59) return false;
	return (new Date (0, 0, 0, RegExp.$1, RegExp.$2, RegExp.$3));
}

function auto_complete_time(field, fmt) {
  if (getCaretPosition(field).start != field.value.length) return; //If we are inserting in a position different from the last one, we don't autocomplete
  if (fmt == null || fmt == "") fmt = field.getAttribute("displayformat");
  var strDate = field.value;
  var b = fmt.match(/%./g);
  var i = 0, j = -1;
  var text = "";
  var length = 0;
  var pos = fmt.indexOf(b[0]) + b[0].length;
  var separator = fmt.substring(pos, pos+1);
  while (strDate.charAt(i)) {
    if (strDate.charAt(i)==separator || isNaN(strDate.charAt(i))) {
      i++;
      continue;
    }
    if (length<=0) {
      j++;
      if (j>0) {
        if (b[j]=="%M" || b[j]=="%S") text += separator;
      }
      switch (b[j]) {
          case "%H":
          case "%I":
          case "%k":
          case "%l":
              text += strDate.charAt(i);
              length = 2;
              break;
          case "%M":
              text += strDate.charAt(i);
              length = 2;
              break;
          case "%S":
              text += strDate.charAt(i);
              length = 2;
              break;
      }
    } else text += strDate.charAt(i);
    length--;
    i++;
  }
  field.value = text;
}

// CaretPosition object
function CaretPosition()
{
 var start = null;
 var end = null;
}

/* Function that returns actual position of -1 if we are at last position*/
function getCaretPosition(oField)
{
 var oCaretPos = new CaretPosition();

 // IE support
 if(document.selection)
 {
  oField.focus();
  var oSel = document.selection.createRange();
  var selectionLength = oSel.text.length;
  oSel.moveStart ('character', -oField.value.length);
  oCaretPos.start = oSel.text.length - selectionLength;
  oCaretPos.end = oSel.text.length;
 }
 // Firefox support
 else if(oField.selectionStart || oField.selectionStart == '0')
 {
  // This is a whole lot easier in Firefox
  oCaretPos.start = oField.selectionStart;
  oCaretPos.end = oField.selectionEnd;
 }

 // Return results
 return (oCaretPos);
}
