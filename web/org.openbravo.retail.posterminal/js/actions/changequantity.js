/*
 ************************************************************************************
 * Copyright (C) 2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, Promise */

(function () {

  var AbstractCommandQuantity = function (args) {
      OB.Actions.AbstractAction.call(this, args);
      this.calculateToAdd = args.calculateToAdd;
      this.command = function (view) {
        var editboxvalue = view.state.readState({
          name: 'editbox'
        });

        var selectedReceiptLine = view.state.readState({
          name: 'selectedReceiptLine'
        });
        var selectedReceiptLines = view.state.readState({
          name: 'selectedReceiptLines'
        });
        var value = OB.I18N.parseNumber(editboxvalue || '1');
        var receipt = view.model.get('order');

        var validateQuantity = function () {
            if (OB.MobileApp.model.hasPermission('OBPOS_maxQtyUsingKeyboard', true) && value >= OB.I18N.parseNumber(OB.MobileApp.model.hasPermission('OBPOS_maxQtyUsingKeyboard', true))) {
              return OB.UTIL.question(OB.I18N.getLabel('OBPOS_maxQtyUsingKeyboardHeader'), OB.I18N.getLabel('OBPOS_maxQtyUsingKeyboardBody', [value]));
            } else {
              return Promise.resolve();
            }
            };

        if (!selectedReceiptLine) {
          return;
        }
        if (!isFinite(value)) {
          return;
        }

        if (receipt.get('isEditable') === false) {
          this.doShowPopup({
            popup: 'modalNotEditableOrder'
          });
          return;
        }

        if (selectedReceiptLines.find(function (line) {
          return line.get('product').get('isEditableQty') === false;
        })) {
          this.doShowPopup({
            popup: 'modalNotEditableLine'
          });
          return;
        }

        var valueBigDecimal = OB.DEC.toBigDecimal(value);
        if (valueBigDecimal.scale() > selectedReceiptLine.get('product').get('uOMstandardPrecision')) {
          OB.UTIL.showError(OB.I18N.getLabel('OBPOS_StdPrecisionLimitError', [selectedReceiptLine.get('product').get('uOMstandardPrecision')]));
          return;
        }

        validateQuantity().then(function () {
          var selection = [];
          receipt.set('undo', null);
          if (selectedReceiptLines && selectedReceiptLines.length > 1) {
            receipt.set('multipleUndo', true);
          }
          selectedReceiptLines.forEach(function (line) {
            selection.push(line);
            var toadd = this.calculateToAdd(receipt, line.get('qty'), value);
            if (toadd !== 0) {
              if (line.get('qty') + toadd === 0) { // If final quantity will be 0 then request approval
                view.deleteLine(view, {
                  selectedReceiptLines: selectedReceiptLines
                });
              } else if (!line.get('relatedLines')) {
                view.addProductToOrder(view, {
                  product: line.get('product'),
                  qty: toadd,
                  options: {
                    line: line,
                    blockAddProduct: true
                  }
                });
              }
            }
          }, this);
          receipt.set('multipleUndo', null);
          receipt.trigger('scan');
          view.setMultiSelectionItems(view, {
            selection: selection
          });
        }.bind(this));
      };
      };

  OB.MobileApp.actionsRegistry.register(
  new AbstractCommandQuantity({
    window: 'retail.pointofsale',
    name: 'changeQuantity',
    properties: {
      i18nContent: 'OBMOBC_KbQuantity'
    },
    calculateToAdd: function (receipt, qty, value) {
      return (receipt.get('orderType') === 1) ? value + qty : value - qty;
    }
  }));

  OB.MobileApp.actionsRegistry.register(
  new AbstractCommandQuantity({
    window: 'retail.pointofsale',
    name: 'addQuantity',
    properties: {
      label: '+'
    },
    calculateToAdd: function (receipt, qty, value) {
      return value || 1;
    }
  }));

  OB.MobileApp.actionsRegistry.register(
  new AbstractCommandQuantity({
    window: 'retail.pointofsale',
    name: 'removeQuantity',
    properties: {
      label: '-'
    },
    calculateToAdd: function (receipt, qty, value) {
      return -(value || 1);
    }
  }));

}());