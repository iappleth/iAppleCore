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
 * All portions are Copyright (C) 2015 Openbravo SLU 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

OB.ProductServices = OB.ProductServices || {};

OB.ProductServices.rfcWindowId = 'FF808081330213E60133021822E40007';

OB.ProductServices.onLoad = function (view) {
  var orderLinesGrid = view.theForm.getItem('grid').canvas.viewGrid;
  orderLinesGrid.selectionChanged = OB.ProductServices.relateOrderLinesSelectionChanged;
};

OB.ProductServices.onLoadGrid = function (grid) {
  OB.ProductServices.updateTotalLinesAmount(this.view.theForm);
  OB.ProductServices.updateServicePrice(this.view, null);
};

OB.ProductServices.updateTotalLinesAmount = function (form) {
  var totalLinesAmt = BigDecimal.prototype.ZERO,
      grid = form.getItem('grid').canvas.viewGrid,
      amountField = grid.getFieldByColumnName('amount'),
      selectedRecords = grid.getSelectedRecords(),
      totalLinesAmountlItem = form.getItem('totallinesamount'),
      i, lineAmt;

  for (i = 0; i < selectedRecords.length; i++) {
    lineAmt = new BigDecimal(String(grid.getEditedCell(grid.getRecordIndex(selectedRecords[i]), amountField)));
    totalLinesAmt = totalLinesAmt.add(lineAmt);
  }
  totalLinesAmountlItem.setValue(Number(totalLinesAmt.toString()));
  return true;
};

OB.ProductServices.orderLinesGridQtyOnChange = function (item, view, form, grid) {
  var newAmount = new BigDecimal(String(item.getValue())).multiply(new BigDecimal(String(item.record.price))),
      oldAmount = grid.getEditValues(grid.getRecordIndex(item.record)).amount,
      originalQty = new BigDecimal(String(item.record.originalOrderedQuantity)),
      newQty = new BigDecimal(String(item.getValue())),
      precision = form.getItem('pricePrecision').getValue();
  newAmount = newAmount.setScale(precision, BigDecimal.prototype.ROUND_HALF_UP);
  if (!oldAmount && oldAmount !== 0) {
    oldAmount = new BigDecimal(String(item.record.amount));
  } else {
    oldAmount = new BigDecimal(String(grid.getEditValues(grid.getRecordIndex(item.record)).amount));
  }
  if (newAmount.compareTo(oldAmount) !== 0) {
    grid.setEditValue(grid.getRecordIndex(item.record), 'amount', Number(newAmount));
    OB.ProductServices.updateTotalLinesAmount(form);
    OB.ProductServices.updateServicePrice(view, item.record);
  }
};

OB.ProductServices.QuantityValidate = function (item, validator, value, record) {
  if (!isc.isA.Number(value)) {
    return false;
  }
  if (value === null) {
    return false;
  }
  var quantity = new BigDecimal(String(value)),
      returnedQty = new BigDecimal(String(record.returnQtyOtherRM)),
      recordQty = new BigDecimal(String(record.originalOrderedQuantity)),
      windowId = item.grid.view.windowId;
  if (windowId === OB.ProductServices.rfcWindowId && ((value < 0) || (quantity.compareTo(recordQty.subtract(returnedQty))) > 0)) {
    item.grid.view.messageBar.setMessage(isc.OBMessageBar.TYPE_ERROR, null, OB.I18N.getLabel('OBUIAPP_RM_OutOfRange', [recordQty.subtract(returnedQty).toString()]));
    return false;
  }
  if (windowId !== OB.ProductServices.rfcWindowId && ((recordQty.compareTo(BigDecimal.prototype.ZERO) < 0) && (((quantity.compareTo(recordQty) < 0)) || (value > 0)))) {
    item.grid.view.messageBar.setMessage(isc.OBMessageBar.TYPE_ERROR, null, OB.I18N.getLabel('ServiceQuantityLessThanOrdered', [recordQty]));
    return false;
  }
  if (windowId !== OB.ProductServices.rfcWindowId && ((recordQty.compareTo(BigDecimal.prototype.ZERO) > 0) && (((quantity.compareTo(recordQty) > 0)) || (value < 0)))) {
    item.grid.view.messageBar.setMessage(isc.OBMessageBar.TYPE_ERROR, null, OB.I18N.getLabel('ServiceQuantityMoreThanOrdered', [recordQty]));
    return false;
  }
  return true;
};

OB.ProductServices.relateOrderLinesSelectionChanged = function (record, state) {
  this.fireOnPause('selectionChanged' + record.id, function () {
    OB.ProductServices.doRelateOrderLinesSelectionChanged(record, state, this.view);
  }, 200);
  this.Super('selectionChanged', arguments);
};

OB.ProductServices.doRelateOrderLinesSelectionChanged = function (record, state, view) {
  var totalLinesAmount = view.theForm.getItem('totallinesamount'),
      totalLinesAmountValue = new BigDecimal(String(view.theForm.getItem('totallinesamount').getValue() || 0)),
      orderLinesGrid = view.theForm.getItem('grid').canvas.viewGrid,
      totalServiceAmount = view.theForm.getItem('totalserviceamount'),
      quantity = new BigDecimal(String(record.originalOrderedQuantity)),
      windowId = view.windowId;

  if (windowId !== OB.ProductServices.rfcWindowId) {
    if (state) {
      orderLinesGrid.setEditValue(orderLinesGrid.getRecordIndex(record), 'relatedQuantity', Number(quantity.toString()));
    } else {
      orderLinesGrid.setEditValue(orderLinesGrid.getRecordIndex(record), 'relatedQuantity', Number('0'));
    }
  } else {
    if (state) {
      orderLinesGrid.setEditValue(orderLinesGrid.getRecordIndex(record), 'relatedQuantity', Number('0'));
    } else {
      orderLinesGrid.setEditValue(orderLinesGrid.getRecordIndex(record), 'relatedQuantity', Number('0'));
    }
  }
  OB.ProductServices.updateTotalLinesAmount(view.theForm);
  OB.ProductServices.updateServicePrice(view, record);
};

OB.ProductServices.updateServicePrice = function (view, record) {
  var callback, totalServiceAmount = view.theForm.getItem('totalserviceamount'),
      orderLinesGrid = view.theForm.getItem('grid').canvas.viewGrid,
      totalLinesAmountValue = new BigDecimal(String(view.theForm.getItem('totallinesamount').getValue() || 0)),
      recordId, contextInfo;
  if (record) {
    recordId = record.id;
  } else {
    recordId = null;
  }
  
  contextInfo = orderLinesGrid.view.parentWindow.activeView.getContextInfo(false, true, true, true);
  if (!contextInfo.inpTabId) {
    contextInfo = orderLinesGrid.view.parentWindow.activeView.parentView.getContextInfo(false, true, true, true);
  }

  callback = function (response, data, request) {
    if (data.amount || data.amount === 0) {
      totalServiceAmount.setValue(Number(data.amount));
      if (data.message) {
        orderLinesGrid.view.messageBar.setMessage(isc.OBMessageBar.TYPE_WARNING, data.message.title, data.message.text);
      }
    } else {
      orderLinesGrid.view.messageBar.setMessage(isc.OBMessageBar.TYPE_ERROR, data.message.title, data.message.text);
      if (record) {
        orderLinesGrid.deselectRecord(record);
      }
    }
  };

  OB.RemoteCallManager.call('org.openbravo.common.actionhandler.ServiceRelatedLinePriceActionHandler', {
    orderlineId: view.theForm.getItem('orderlineId').getValue(),
    amount: view.theForm.getItem('totallinesamount').getValue(),
    orderLineToRelateId: recordId,
    tabId: contextInfo.inpTabId
  }, {}, callback);
};