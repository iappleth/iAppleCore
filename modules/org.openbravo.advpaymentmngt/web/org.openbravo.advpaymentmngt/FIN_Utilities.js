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
 * The Initial Developer of the Original Code is Openbravo SLU
 * All portions are Copyright (C) 2010-2011 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

//Global variables definition
var frm = null,
    isReceipt = true,
    isCreditAllowed = true,
    globalMaskNumeric = "#0.00",
    globalDecSeparator = ".",
    globalGroupSeparator = ",",
    globalGroupInterval = "3";

function isTrue(objectName) {
  return frm.elements[objectName].value === 'Y';
}

function initFIN_Utilities(_frm, _creditAllowed) {
  frm = _frm;
  isReceipt = isTrue('isReceipt');
  isCreditAllowed = _creditAllowed !== undefined ? _creditAllowed : true;
  if (!isCreditAllowed) {
    frm.inpUseCredit.checked = false;
  }
  globalMaskNumeric = getDefaultMaskNumeric();
  globalDecSeparator = getGlobalDecSeparator();
  globalGroupSeparator = getGlobalGroupSeparator();
  globalGroupInterval = getGlobalGroupInterval();
}

function processLabels() {
  var receiptlbls = getElementsByName('lblR'), i;
  for (i = 0; i < receiptlbls.length; i++) {
    displayLogicElement(receiptlbls[i].id, isReceipt);
  }
  var paidlbls = getElementsByName('lblP');
  for (i = 0; i < paidlbls.length; i++) {
    displayLogicElement(paidlbls[i].id, !isReceipt);
  }
} 

function selectDifferenceAction(value) {
  var diffAction = frm.inpDifferenceAction, i;
  for (i = 0; i < diffAction.length; i++) {
    diffAction[i].checked = false;
    diffAction[i].checked = (diffAction[i].value === value);
  }
}

/**
 * Function that transform a plain number into a formatted one
 * @param {String} number to be formated
 * @return The converted number
 * @type String
 */
function applyFormat(number) {
  return returnFormattedNumber(number, globalMaskNumeric, globalDecSeparator, globalGroupSeparator, globalGroupInterval);
}

/**
* Function to operate with formatted number
* @param {Number} number1 The first operand
* @param {String} operator The operator (+ - * / % < > <= >= ...)
* @param {Number} number2 The second operand
* @param {String} result_maskNumeric The numeric mask of the result
* @param {String} decSeparator The decimal separator of the number
* @param {String} groupSeparator The group separator of the number
* @param {String} groupInterval The group interval of the number
* @return The result of the operation or true or false if the operator is (< > <= >= ...)
* @type String or Boolean
* @deprecated TO BE REMOVED ON MP22
*/
function formattedNumberOpTemp(number1, operator, number2, result_maskNumeric, decSeparator, groupSeparator, groupInterval) {
  var result;

  if (result_maskNumeric === null || result_maskNumeric === "") {
    result_maskNumeric = getDefaultMaskNumeric();
  }
  if (decSeparator === null || decSeparator === "") {
    decSeparator = getGlobalDecSeparator();
  }
  if (groupSeparator === null || groupSeparator === "") {
    groupSeparator = getGlobalGroupSeparator();
  }
  if (groupInterval === null || groupInterval === "") {
    groupInterval = getGlobalGroupInterval();
  }

  number1 = returnFormattedToCalc(number1, decSeparator, groupSeparator);
  number1 = parseFloat(number1);

  number2 = returnFormattedToCalc(number2, decSeparator, groupSeparator);
  number2 = parseFloat(number2);

  if (operator === "sqrt") {
    result = Math.sqrt(number1);
  } else if (operator === "round") {
    result = roundNumber(number1, number2);
  } else {
    result = eval('('+number1+')' + operator + '('+number2+')');
  }
  if (result !== true && result !== false && result !== null && result !== "") {
    result = returnCalcToFormatted(result, result_maskNumeric, decSeparator, groupSeparator, groupInterval);
  }
  return result;
}

/**
 * Calculates the absolute value using the global formats
 * @param {String} number1 The number
 * @return The result of the Math.abs() operation in a formatted string
 * @type String
 */
function abs(number1) {
  var result;
  number1 = returnFormattedToCalc(number1, globalDecSeparator, globalGroupSeparator);
  number1 = parseFloat(number1);
  result = Math.abs(number1);

  if (result !== null && result !== "") {
    result = returnCalcToFormatted(result, globalMaskNumeric, globalDecSeparator, globalGroupSeparator, globalGroupInterval);
  }
  return result;
}

/**
 * Arithmetic add operation of two Strings using the global formats.
 * @param {String} number1 The first operand
 * @param {String} number2 The second operand
 * @return The result of adding number1 to number2 using the global formats.
 * @type String
 */
function add(number1, number2) {
  return formattedNumberOpTemp(number1, '+', number2, globalMaskNumeric, globalDecSeparator, globalGroupSeparator, globalGroupInterval);
}

/**
 * Arithmetic subtract operation of two Strings using the global formats.
 * @param {String} number1 The first operand
 * @param {String} number2 The second operand
 * @return The result of adding number1 to number2 using the global formats.
 * @type String
 */
function subtract(number1, number2) {
  return formattedNumberOpTemp(number1, '-', number2, globalMaskNumeric, globalDecSeparator, globalGroupSeparator, globalGroupInterval);
}

/**
 * Compares two Strings using the operator
 * @param {String} number1 The first operand
 * @param {String} operator The operator (+ - * / % < > <= >= ...)
 * @param {String} number2 The second operand
 * @return true or false
 * @type boolean
 */
function compare(number1, operator, number2) {
  return formattedNumberOpTemp(number1, operator, number2, globalMaskNumeric, globalDecSeparator, globalGroupSeparator, globalGroupInterval);	
}

/**
 * Compares two Strings using the operator.
 * If both numbers are negative it compares using the absolute value. 
 */
function compareWithSign(number1, operator, number2) {
  if (compare(number1, '<', 0) && compare(number2, '<', 0)) {
    return formattedNumberOpTemp(abs(number1), operator, abs(number2), globalMaskNumeric, globalDecSeparator, globalGroupSeparator, globalGroupInterval);
  } else {
    return formattedNumberOpTemp(number1, operator, number2, globalMaskNumeric, globalDecSeparator, globalGroupSeparator, globalGroupInterval);
  }
}

function isBetweenZeroAndMaxValue(value, maxValue){
  return ((compare(value, '>=', 0) && compare(value, '<=', maxValue)) ||
          (compare(value, '<=', 0) && compare(value, '>=', maxValue)));
}

function validateSelectedAmounts(recordID, existsPendingAmount, selectedAction){
  var pendingAmount = document.frmMain.elements["inpRecordAmt"+recordID].value,
      amount = document.frmMain.elements["inpPaymentAmount"+recordID].value;
  if (existsPendingAmount === null) {
    existsPendingAmount = false;
  }
  if (amount===null || amount==="") {
    setWindowElementFocus(frm.elements["inpPaymentAmount"+recordID]);
    showJSMessage(7);
    return false;
  }
  if ( !isBetweenZeroAndMaxValue(amount, pendingAmount) ) {
    setWindowElementFocus(frm.elements["inpPaymentAmount"+recordID]);
    showJSMessage(9);
    return false;
  }
  // Only possible to pay 0 in case of a write off
  if (selectedAction != "writeoff" && compare(amount, '==', 0)) {
	setWindowElementFocus(frm.elements["inpPaymentAmount"+recordID]);
	showJSMessage(9);
    return false;
  }
  if ( existsPendingAmount && compare(amount, '<', pendingAmount) ) {
    setWindowElementFocus(frm.elements["inpPaymentAmount"+recordID]);
    showJSMessage('APRM_JSNOTALLAMOUTALLOCATED');
    return false;
  }
  return true;
}

function updateDifference() {
  var expected = (frm.inpExpectedPayment && frm.inpExpectedPayment.value) ? frm.inpExpectedPayment.value : 0;
  var total = (frm.inpTotal && frm.inpTotal.value) ? frm.inpTotal.value : 0;
  var amount = total;

  if (frm.inpActualPayment !== null) {
    amount = frm.inpActualPayment.value;
  }
  if (frm.inpUseCredit.checked) {
    amount = add(amount, frm.inpCredit.value);
  }
  if ( compareWithSign(expected, '>', total) ) {
    frm.inpDifference.value = subtract(expected, total);
  } else if ( compareWithSign(amount, '>', total) ) {
    frm.inpDifference.value = subtract(amount, total);
  } else {
    frm.inpDifference.value = 0;
  }
  document.getElementById('paramDifference').innerHTML = frm.inpDifference.value;
  displayLogicElement('sectionDifference', ( compare(expected, '!=', total) || compareWithSign(amount, '>', total) ) );
  displayLogicElement('sectionDifferenceBox', ( compare(expected, '!=', total) || (isCreditAllowed && compareWithSign(amount, '>', total)) ) );
  displayLogicElement('writeoff', compare(expected, '!=', total) );
  displayLogicElement('underpayment', compareWithSign(expected, '>', total) );
  displayLogicElement('credit', isCreditAllowed && compareWithSign(amount, '>', total) );
  displayLogicElement('refund', isCreditAllowed && isReceipt && compareWithSign(amount, '>', total) );
  if (!(compare(expected, '!=', total) || (isCreditAllowed && compareWithSign(amount, '>', total)) )) {
    // No action available
    selectDifferenceAction('none');
  } else if ( isCreditAllowed && compareWithSign(amount, '>', total) ) {
    selectDifferenceAction('credit');
  } else if ( !isCreditAllowed || compareWithSign(expected, '>', total) ) {
    selectDifferenceAction('underpayment');
  } else {
    selectDifferenceAction('none');
  }
}

function updateTotal() {
  var chk = frm.inpScheduledPaymentDetailId;
  var total = 0, i;
  var scheduledPaymentDetailId, pendingAmount, amount, isAnyChecked = false;
  var selectedBusinessPartners = {
     numberofitems: 0,
     increase: function(obj) {
       if (obj && obj.value) {
         var key = obj.value;
            var value = this[key];
         if (value) {
           this[key] = value + 1;
         } else {
           this[key] = 1;
           this.numberofitems = this.numberofitems + 1;
         }
       }
     },
     reset: function() {
          var i;
       this.numberofitems = 0;
       for (i in this) {
         if (this.hasOwnProperty(i)) {
           if (typeof this[i] !== "function") {
             this[i] = 0;
           }
         }
       }
     },
     isMultibpleSelection: function() {
       return (this.numberofitems > 1);
     }
  };
   
  selectedBusinessPartners.reset();
  
  if (!chk) {
    if (frm.inpGeneratedCredit && !isReceipt){
      frm.inpActualPayment.value = frm.inpGeneratedCredit.value;
    }
    updateDifference();
    return;
  } else if (!chk.length) {
    scheduledPaymentDetailId = frm.inpRecordId0.value;
    pendingAmount = frm.elements["inpRecordAmt" + scheduledPaymentDetailId].value;
    amount = frm.elements["inpPaymentAmount" + scheduledPaymentDetailId].value;
    if ( amount !== "" && !isBetweenZeroAndMaxValue(amount, pendingAmount) ) {
      setWindowElementFocus(frm.elements["inpPaymentAmount" + scheduledPaymentDetailId]);
    } else {
      initialize_MessageBox('messageBoxID');
    }
    if (chk.checked) {
      document.getElementById('paraminvalidSpan'+scheduledPaymentDetailId).style.display = !isBetweenZeroAndMaxValue(amount, pendingAmount) ? 'block' : 'none';
      total = (frm.elements["inpPaymentAmount" + scheduledPaymentDetailId].value === '') ? "0" : frm.elements["inpPaymentAmount" + scheduledPaymentDetailId].value;
      selectedBusinessPartners.increase(frm.elements['inpRecordBP'+scheduledPaymentDetailId]);
      isAnyChecked = true;
    }
  } else {
    var rows = chk.length;
    for (i = 0; i < rows; i++) {
      scheduledPaymentDetailId = frm.elements["inpRecordId" + i].value;
      pendingAmount = frm.elements["inpRecordAmt" + scheduledPaymentDetailId].value;
      amount = frm.elements["inpPaymentAmount" + scheduledPaymentDetailId].value;
      if (amount !== "" && !isBetweenZeroAndMaxValue(amount, pendingAmount) ) {
        setWindowElementFocus(frm.elements["inpPaymentAmount" + scheduledPaymentDetailId]);
      } else {
        initialize_MessageBox('messageBoxID');
      }
      if (chk[i].checked) {
        document.getElementById('paraminvalidSpan'+scheduledPaymentDetailId).style.display = !isBetweenZeroAndMaxValue(amount, pendingAmount) ? 'block' : 'none';
        total = (frm.elements["inpPaymentAmount" + scheduledPaymentDetailId].value === '') ? total : add(total,frm.elements["inpPaymentAmount" + scheduledPaymentDetailId].value);
        selectedBusinessPartners.increase(frm.elements['inpRecordBP'+scheduledPaymentDetailId]);
        isAnyChecked = true;
      }
    }
  }
  frm.inpTotal.value = total;
  document.getElementById('paramTotal').innerHTML = frm.inpTotal.value;
  var inheritedActualPayment = (frm.paramInheritedActualPayment && frm.paramInheritedActualPayment.value === "Y");
  if (!isReceipt && !inheritedActualPayment) {
    if (frm.inpUseCredit.checked) {
      if ( compare(total, '>',frm.inpCredit.value) ) {
        frm.inpActualPayment.value = subtract(total, frm.inpCredit.value);
      }
      else {
        frm.inpActualPayment.value = 0;
      }
    } else {
      if (isAnyChecked) {
        frm.inpActualPayment.value = frm.inpTotal.value;
      }
      if (frm.inpGeneratedCredit) {
        frm.inpActualPayment.value = add(frm.inpTotal.value, frm.inpGeneratedCredit.value);
      }
    }
  }
  isCreditAllowed = !selectedBusinessPartners.isMultibpleSelection();
  updateDifference();
}

function distributeAmount(_amount) {
  var amount = applyFormat(_amount);
  var chk = frm.inpScheduledPaymentDetailId;
  var scheduledPaymentDetailId, outstandingAmount, j, i;
  
  if (!chk) {
    updateTotal();
    return;
  } else if (!chk.length) {
    scheduledPaymentDetailId = frm.inpRecordId0.value;
    outstandingAmount = frm.elements["inpRecordAmt" + scheduledPaymentDetailId].value;
    if ( compare(outstandingAmount, '>', amount) ) {
      outstandingAmount = amount;
    }
    frm.elements["inpPaymentAmount" + scheduledPaymentDetailId].value = outstandingAmount;
    if (!chk.checked) {
      chk.checked = true;
      updateData(chk.value, chk.checked);
    }
  } else {
    var total = chk.length;
    for ( i = 0; i < total; i++) {
      scheduledPaymentDetailId = frm.elements["inpRecordId" + i].value;
      outstandingAmount = frm.elements["inpRecordAmt" + scheduledPaymentDetailId].value;
      if ( compare(outstandingAmount, '>', amount) ) {
        outstandingAmount = amount;
      }
      if ( compare(amount, '==', 0) ) {
        frm.elements["inpPaymentAmount" + scheduledPaymentDetailId].value = "";
        for ( j = 0; j < total; j++) {
          if (chk[j].checked && chk[j].value === scheduledPaymentDetailId) {
            chk[j].checked = false;
            updateData(chk[j].value, chk[j].checked);
          }
        }
      } else {
        frm.elements["inpPaymentAmount" + scheduledPaymentDetailId].value = outstandingAmount;
        for ( j = 0; j < total; j++) {
          if (!chk[j].checked && chk[j].value === scheduledPaymentDetailId) {
            chk[j].checked = true;
            updateData(chk[j].value, chk[j].checked);
          }
        }
        amount = subtract(amount, outstandingAmount);
      }
    }
  }
  updateTotal();
  return true;
}

function updateReadOnly(key, mark) {
  if (mark === null) {
    mark = false;
  }
  frm.elements["inpPaymentAmount" + key].disabled = !mark;
  var expectedAmount = frm.inpExpectedPayment.value;
  var recordAmount = frm.elements["inpRecordAmt" + key].value;

  if (mark) {
    frm.elements["inpPaymentAmount" + key].className = frm.elements["inpPaymentAmount" + key].className.replace(' readonly', '');
    frm.inpExpectedPayment.value = add(expectedAmount, recordAmount);
  } else {
    var classText = frm.elements["inpPaymentAmount" + key].className;
    if (classText.search('readonly') === -1) {
      frm.elements["inpPaymentAmount" + key].className = classText.concat(" readonly");
    }
    frm.elements["inpPaymentAmount" + key].value = '';
    frm.inpExpectedPayment.value = subtract(expectedAmount, recordAmount);
    document.getElementById('paraminvalidSpan'+key).style.display = 'none';
  }
  if (!mark) {
    frm.inpAllLines.checked = false;
  }
  return true;
}

function updateAll(drivenByGrid) {
  var frm = document.frmMain;
  var chk = frm.inpScheduledPaymentDetailId;
  var recordAmount, i;
  
  if (!chk) {
    frm.inpExpectedPayment.value = "0";
    return;
  } else if (!chk.length) {
    frm.inpExpectedPayment.value = "0";
    if (!chk.checked) {
      recordAmount = frm.elements["inpRecordAmt" + chk.value].value;
      frm.inpExpectedPayment.value = add(frm.inpExpectedPayment.value, recordAmount);
    }
    updateData(chk.value, chk.checked, drivenByGrid);
  } else {
    frm.inpExpectedPayment.value = "0";
    var total = chk.length;
    for (i = 0; i < total; i++) {
      if (!chk[i].checked) {
        recordAmount = frm.elements["inpRecordAmt" + chk[i].value].value;
        frm.inpExpectedPayment.value = add(frm.inpExpectedPayment.value, recordAmount);
      }
      updateData(chk[i].value, chk[i].checked, drivenByGrid);
    }
  }
  return true;
}

/**
 * 
 * @param allowCreditGeneration true if it is allowed to not select any pending payment if actualPayment amount is not
 *        zero.
 * @return true if validations are fine.
 */
function validateSelectedPendingPayments(allowNotSelectingPendingPayment, action) {
  if (allowNotSelectingPendingPayment === undefined) {
    allowNotSelectingPendingPayment = false;
  }
  // If no credit usage is allowed we are forced to select at least one pending payment.
  allowNotSelectingPendingPayment = isCreditAllowed && allowNotSelectingPendingPayment;
  var actualPayment = document.frmMain.inpActualPayment.value;
  var expectedPayment = document.frmMain.inpExpectedPayment.value, i;
  if (document.frmMain.inpUseCredit.checked) {
    /*if ( compare(expectedPayment, '<=', actualPayment) ) {
      setWindowElementFocus(document.frmMain.inpUseCredit);
      showJSMessage('APRM_JSCANNOTUSECREDIT');
      return false;
    }*/
    actualPayment = add(actualPayment, document.frmMain.inpCredit.value);
  }
  if (action === null && compare(frm.inpDifference.value, '!=', 0)) {
    showJSMessage('APRM_JSDIFFERENCEWITHOUTACTION');
    return false;
  }
  var selectedTotal = document.frmMain.inpTotal.value;
  if ( compareWithSign(selectedTotal, '>', actualPayment) ) {
    setWindowElementFocus(document.frmMain.inpActualPayment);
    showJSMessage('APRM_JSMOREAMOUTALLOCATED');
    return false;
  }
  var chk = frm.inpScheduledPaymentDetailId;
  if (!chk) {
    return true;
  } else if (!chk.length) {
    if (chk.checked) {
      if (!validateSelectedAmounts(chk.value, compare(selectedTotal, '<', actualPayment), action)) {
        return false;
      }
    } else if ( !allowNotSelectingPendingPayment || compare(document.frmMain.inpDifference.value, '==', "0") ){
      showJSMessage('APRM_JSNOTLINESELECTED');
      return false;
    }
  } else {
    var total = chk.length;
    var isAnyChecked = false;
    for (i=0; i<total; i++) {
      if (chk[i].checked) {
        isAnyChecked = true;
        if (!validateSelectedAmounts(chk[i].value, compare(selectedTotal, '<', actualPayment), action)) {
          return false;
        }
      }
    }
    if (!isAnyChecked &&
        (!allowNotSelectingPendingPayment || compare(document.frmMain.inpDifference.value, '==', "0")) 
        ) {
      showJSMessage('APRM_JSNOTLINESELECTED');
      return false;
    }
  }
  return true;
}

/**
 * Creates a select html object with the option string list
 * @param object
 *     select html object.
 * @param innerHTML
 *     The string with the options. Example '<option value="id1">fist<option>'
 */
function createCombo(object, innerHTML){
  object.innerHTML = "";
  var selTemp = document.createElement("temp");
  var opt, i, j;
  selTemp.id="temp1";
  document.body.appendChild(selTemp);
  selTemp = document.getElementById("temp1");
  selTemp.style.display="none";
  innerHTML = innerHTML.replace(/<option/g,"<span").replace(/<\/option/g,"</span");
  selTemp.innerHTML = innerHTML;

  for (i=0; i<selTemp.childNodes.length; i++){
    var spantemp = selTemp.childNodes[i];

    if (spantemp.tagName) {
      opt = document.createElement("option");
      if(document.all){ //IE
        object.add(opt);
      } else{
        object.appendChild(opt);
      }

      //getting attributes
      for(j=0; j<spantemp.attributes.length ; j++){
        var attrName = spantemp.attributes[j].nodeName;
        var attrVal = spantemp.attributes[j].nodeValue;
        if(attrVal){
          try{
            opt.setAttribute(attrName,attrVal);
            opt.setAttributeNode(spantemp.attributes[j].cloneNode(true));
          }catch(e){}
        }
      }
      //value and text
      opt.value = spantemp.getAttribute("value");
      opt.text = spantemp.innerHTML;
      //IE
      opt.selected = spantemp.getAttribute('selected');
      opt.className = spantemp.className;
    }
  }
  document.body.removeChild(selTemp);
  selTemp = null;
}

/**
 * Helper function to reload the opener window dynamic grid.
 * @return
 */
function reloadParentGrid() {
  if(top.opener) {
    var dad = top.opener;
    if (typeof dad.loadGrid === "function" || typeof dad.loadGrid === "object") {
      top.opener.loadGrid();
    } else if (typeof dad.updateGridDataAfterFilter === "function" || typeof dad.updateGridDataAfterFilter === "object") {
      top.opener.updateGridDataAfterFilter();
    }
  } else if (getFrame('LayoutMDI') && getFrame('LayoutMDI').OB.MainView.TabSet.getSelectedTab().pane.view) {
    var theView = getFrame('LayoutMDI').OB.MainView.TabSet.getSelectedTab().pane.view;
    theView.refresh(function(){
        theView.getTabMessage();
        theView.toolBar.refreshCustomButtons();
    });
  }
}
