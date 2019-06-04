/*
 ************************************************************************************
 * Copyright (C) 2018-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, _ */

(function () {
  OB.UTIL.StockUtils = {};

  OB.UTIL.StockUtils.getReceiptLineStock = function (productId, line, successCallback, errorCallback) {
    var serverCallStoreDetailedStock = new OB.DS.Process('org.openbravo.retail.posterminal.stock.StoreDetailedStock');
    serverCallStoreDetailedStock.exec({
      crossOrganization: line ? line.get('organization').id : null,
      product: productId ? productId : line.get('product').get('id'),
      line: line
    }, function (data) {
      successCallback(data);
    }, function (data) {
      if (errorCallback && errorCallback instanceof Function) {
        errorCallback(data);
      }
    });
  };

  OB.UTIL.StockUtils.checkOrderLinesStock = function (orders, callback) {
    var checkedLines = [],
        checkOrderStock, checkOrderLineStock;
    checkOrderLineStock = function (idxOrderLine, order, orderCallback) {
      if (idxOrderLine === order.get('lines').length) {
        orderCallback();
        return;
      }
      var line = order.get('lines').at(idxOrderLine),
          product = line.get('product'),
          productStatus = OB.UTIL.ProductStatusUtils.getProductStatus(product),
          positiveQty = OB.DEC.compare(line.get('qty')) > 0,
          checkStock = positiveQty && (productStatus.restrictsaleoutofstock || OB.UTIL.isCrossStoreProduct(product));

      OB.UTIL.HookManager.executeHooks('OBPOS_CheckStockPrePayment', {
        order: order,
        orders: orders,
        line: line,
        checkStock: checkStock
      }, function (args) {
        if (args.cancelOperation) {
          if (callback && callback instanceof Function) {
            callback(false);
          }
          return;
        }
        if (args.checkStock) {
          var qtyInOtherOrders = OB.DEC.Zero,
              options = {
              line: line
              },
              i, j;
          // Get the quantity if the other editable orders for this line
          for (i = orders.indexOf(order); i < orders.length; i++) {
            var currentOrder = orders[i];
            if (order.id !== currentOrder.id && currentOrder.get('isEditable')) {
              for (j = 0; j < currentOrder.get('lines').length; j++) {
                var currentOrderLine = currentOrder.get('lines').models[j];
                if ((currentOrderLine.get('product').get('id') === line.get('product').get('id') && currentOrderLine.get('warehouse').id === line.get('warehouse').id)) {
                  qtyInOtherOrders += currentOrderLine.get('qty');
                }
              }
            }
          }
          if (!_.find(checkedLines, function (checkedLine) {
            return checkedLine.productId === line.get('product').get('id') && checkedLine.warehouseId === line.get('warehouse').id;
          })) {
            checkedLines.push({
              productId: line.get('product').get('id'),
              warehouseId: line.get('warehouse').id
            });
            order.getStoreStock(line.get('product'), qtyInOtherOrders, options, null, function (hasStock) {
              if (hasStock) {
                checkOrderLineStock(idxOrderLine + 1, order, orderCallback);
              } else {
                callback(false);
              }
            });
          } else {
            checkOrderLineStock(idxOrderLine + 1, order, orderCallback);
          }
        } else {
          checkOrderLineStock(idxOrderLine + 1, order, orderCallback);
        }
      });
    };
    checkOrderStock = function (idxOrder) {
      if (idxOrder === orders.length) {
        callback(true);
        return;
      }
      var order = orders[idxOrder];
      if (order.get('isEditable')) {
        checkOrderLineStock(0, order, function () {
          checkOrderStock(idxOrder + 1);
        });
      } else {
        checkOrderStock(idxOrder + 1);
      }
    };
    // Check stock for the lines that are not allowed to be sold without stock
    checkOrderStock(0);
  };
}());