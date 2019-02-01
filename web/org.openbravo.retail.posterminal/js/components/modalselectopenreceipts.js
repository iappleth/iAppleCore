/*
 ************************************************************************************
 * Copyright (C) 2015-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, _, Promise */

enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.UI.ModalSelectOpenedReceipt_btnApply',
  isDefaultAction: true,
  i18nContent: 'OBPOS_LblApplyButton',
  tap: function () {
    this.doHideThisPopup();
  }
});

enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.UI.ModalSelectOpenedReceipt_btnCancel',
  isDefaultAction: false,
  i18nContent: 'OBMOBC_LblCancel',
  tap: function () {
    this.doHideThisPopup();
  }
});

enyo.kind({
  kind: 'OB.UI.ModalAction',
  name: 'OB.UI.ModalSelectOpenedReceipt',
  i18nHeader: 'OBPOS_lblHeaderSelectOpenedReceiptModal',
  //body of the popup
  bodyContent: {
    components: [{
      name: 'lblSelectOpenedReceiptModal'
    }, {
      name: 'listSelectOpenedReceiptModal',
      kind: 'OB.UI.OpenedReceiptsList'
    }, {
      style: 'display: inline-block',
      components: [{
        name: 'chkSelectOpenedReceiptModal',
        kind: 'OB.UI.CheckboxButton',
        style: 'float: left; width: 44px; height: 44px; background-position: center center; border: 1px solid white; cursor: pointer;',
        classes: 'btn-check-alt'
      }, {
        name: 'lblSelectOpenedReceiptModalChk',
        style: 'float: left; padding: 6px 0px 0px 14px;',
        initComponents: function () {
          this.setContent(OB.I18N.getLabel('OBPOS_lblSelectOpenedReceiptModalChk'));
        }
      }]
    }]
  },
  //buttons of the popup
  bodyButtons: {
    components: [{
      kind: 'OB.UI.ModalSelectOpenedReceipt_btnApply',
      disabled: true,
      checkModifyTax: function (params) {
        return new Promise(function (resolve, reject) {
          function promiseResolve() {
            resolve(params);
          }
          if (params.product.get('modifyTax') && params.attrs.relatedLines && params.attrs.relatedLines.length > 0) {
            OB.Dal.findUsingCache('ProductServiceLinked', OB.Model.ProductServiceLinked, {
              'product': params.product.get('id')
            }, function (data) {
              var i, j;
              for (i = 0; i < params.attrs.relatedLines.length; i++) {
                for (j = 0; j < data.length; j++) {
                  if (params.attrs.relatedLines[i].productCategory === data.at(j).get('productCategory')) {
                    // Found taxes modification configuration
                    // resolve after displaying confirmation message
                    OB.UTIL.showConfirmation.display(OB.I18N.getLabel('OBPOS_lblHeaderSelectOpenedReceiptModal'), OB.I18N.getLabel('OBPOS_WillNotModifyTax'), [{
                      label: OB.I18N.getLabel('OBMOBC_LblOk'),
                      isConfirmButton: true,
                      action: promiseResolve
                    }], {
                      autoDismiss: false,
                      onHideFunction: promiseResolve
                    });
                    return;
                  }
                }
              }
              // Not found taxes modification configuration
              // resolve silently
              promiseResolve();
            }, reject, {
              modelsAffectedByCache: ['ProductServiceLinked']
            });
          } else {
            // Product to add does not modify taxes
            // resolve silently
            promiseResolve();
          }
        });
      },
      tap: function () {
        // TODO: Check the behavior with the receipt multi-line selection case.
        // TODO: The 'Undo' button doesn't work in the case the target receipt is opened.
        var me = this;
        var orderModel = this.owner.owner.selectedLine.model;
        var product = this.owner.owner.args.product;
        var attrs = this.owner.owner.args.attrs;

        this.checkModifyTax({
          product: product,
          attrs: attrs
        }) //
        .then(function (params) {
          if (me.owner.owner.selectedLine.id.indexOf('openedReceiptsListLine') === -1) {
            // 'Create New One' case
            var orderList = me.owner.owner.owner.model.get('orderList');
            orderList.saveCurrent();
            var newOrder = orderList.newOrder(orderList.current.get('bp'));
            orderList.unshift(newOrder);
            orderModel = newOrder;
            orderModel.set('deferredOrder', true);
          }
          orderModel.set('bp', me.owner.owner.owner.model.get('orderList').current.get('bp'));
          me.owner.owner.doAddProduct({
            targetOrder: orderModel,
            product: product,
            attrs: attrs,
            options: {
              blockAddProduct: true
            },
            context: me.owner.owner.args.context,
            callback: function () {
              if (me.owner.owner.args.callback) {
                me.owner.owner.args.callback();
              }
              if (me.owner.owner.$.bodyContent.$.chkSelectOpenedReceiptModal.checked) {

                me.owner.owner.doChangeCurrentOrder({
                  newCurrentOrder: orderModel
                });
                me.owner.owner.owner.model.get('order').calculateReceipt(function () {
                  me.owner.owner.owner.model.get('order').get('lines').trigger('updateRelations');
                });
              } else {
                //Hack to calculate totals even if the receipt is not the UI receipt
                orderModel.setIsCalculateReceiptLockState(false);
                orderModel.setIsCalculateGrossLockState(false);
                orderModel.set('belongsToMultiOrder', true);
                orderModel.calculateReceipt(function () {
                  orderModel.trigger('updateServicePrices');
                  orderModel.set('belongsToMultiOrder', false);
                });
              }
            }
          });
          me.owner.owner.args.callback = null;
          me.owner.owner.doHideThisPopup();

        });
      }
    }, {
      kind: 'OB.UI.ModalSelectOpenedReceipt_btnCancel'
    }]
  },
  executeOnHide: function () {
    //executed when popup is hiden.
    //to access to argumens -> this.args
    if (this.args.callback) {
      this.args.callback.call(this.args.context, false);
    }
  },
  executeOnShow: function () {
    //executed when popup is shown.
    //to access to argumens -> this.args
    this.uncheckAllItems();
    this.$.bodyContent.$.chkSelectOpenedReceiptModal.check();
    this.$.bodyButtons.$.modalSelectOpenedReceipt_btnApply.setDisabled(true);
    this.$.bodyContent.$.lblSelectOpenedReceiptModal.setContent(OB.I18N.getLabel('OBPOS_LblSelectOpenedReceiptModal', [this.args.product.attributes._identifier]));
  },

  published: {
    receiptsList: null
  },
  receiptsListChanged: function (oldValue) {
    this.$.bodyContent.$.listSelectOpenedReceiptModal.setReceiptsList(this.receiptsList);
  },

  init: function (model) {
    this.$.bodyButtons.setStyle('padding-top: 5px');
  },
  events: {
    onChangeCurrentOrder: '',
    onHideThisPopup: '',
    onAddProduct: ''
  },

  selectedLine: null,
  uncheckAllItems: function () {
    var items = this.$.bodyContent.$.listSelectOpenedReceiptModal.$.openedreceiptslistitemprinter.$.tbody.$,
        buttonContainer, control, openedReceiptsListLine;

    // Remove grey background to 'Create New Receipt' button
    this.$.bodyContent.$.listSelectOpenedReceiptModal.$.button.setStyle(this.$.bodyContent.$.listSelectOpenedReceiptModal.$.button.style.replace(' background-color: #cccccc;', ''));

    // Remove grey background to opened receipts list
    for (control in items) {
      if (items.hasOwnProperty(control)) {
        if (control.substring(0, 7) === 'control') {
          buttonContainer = items[control].$;
          for (openedReceiptsListLine in buttonContainer) {
            if (buttonContainer.hasOwnProperty(openedReceiptsListLine)) {
              if (openedReceiptsListLine.substring(0, 22) === 'openedReceiptsListLine') {
                buttonContainer[openedReceiptsListLine].setStyle(buttonContainer[openedReceiptsListLine].style.replace(' background-color: #cccccc;', ''));
              }
            }
          }
        }
      }
    }
  },
  checkItem: function (line) {
    this.selectedLine = line;
    this.uncheckAllItems();

    // Add grey background to the new selected line
    line.setStyle(line.style + ' background-color: #cccccc;');

    // Enable 'Apply' button
    if (this.$.bodyButtons.$.modalSelectOpenedReceipt_btnApply.disabled) {
      this.$.bodyButtons.$.modalSelectOpenedReceipt_btnApply.setDisabled(false);
    }
  }
});

enyo.kind({
  name: 'OB.UI.OpenedReceiptsList',
  classes: 'row-fluid',
  published: {
    receiptsList: null
  },
  components: [{
    classes: 'span12',
    style: 'margin: 20px 0px 20px 0px; height: 189px; overflow-y: auto;',
    components: [{
      components: [{
        kind: 'OB.UI.Button',
        classes: 'btnselect',
        style: 'height: 63px; line-height: 23px; width: 100%; font-size: 16px; background-color: white; border-bottom: 1px solid #cccccc;',
        components: [{
          style: 'width: 100%',
          components: [{
            style: 'float: left; width: 15%; color: black;',
            components: [{
              tag: "img",
              style: 'float: left; width: 19px; height: 19px; color: black; margin-left: 10px;',
              attributes: {
                src: '../org.openbravo.mobile.core/assets/img/iconCreateNew-alt.svg'
              }
            }]
          }, {
            style: 'float: left; width: 80%; color: black;',
            initComponents: function () {
              this.setContent(OB.I18N.getLabel('OBPOS_LblCreateNewReceipt'));
            }
          }, {
            style: 'float: left; width: 80%; color: white; display: hidden;',
            content: '.'
          }, {
            style: 'clear: both;'
          }]
        }],
        tap: function () {
          if (this.owner.owner.owner.checkItem) {
            this.owner.owner.owner.checkItem(this);
          }
        }
      }, {
        name: 'openedreceiptslistitemprinter',
        kind: 'OB.UI.ScrollableTable',
        //scrollAreaMaxHeight: '189px',
        renderLine: 'OB.UI.OpenedReceiptsListLine',
        renderEmpty: 'OB.UI.RenderEmpty'
      }]
    }]
  }],
  receiptsListChanged: function (oldValue) {
    this.$.openedreceiptslistitemprinter.setCollection(this.receiptsList);
  }
});

enyo.kind({
  name: 'OB.UI.OpenedReceiptsListLine',
  kind: 'OB.UI.SelectButton',
  tap: function () {
    this.inherited(arguments);
    if (this.owner.owner.owner.owner.owner.owner.checkItem) {
      this.owner.owner.owner.owner.owner.owner.checkItem(this);
    }
  },
  components: [{
    name: 'line',
    style: 'line-height: 23px; width: 100%; font-size: 16px;',
    components: [{
      components: [{
        style: 'float: left; width: 15%',
        name: 'time'
      }, {
        style: 'float: left; width: 25%',
        name: 'orderNo'
      }, {
        style: 'float: left; width: 60%',
        name: 'bp'
      }, {
        style: 'clear: both;'
      }]
    }, {
      components: [{
        style: 'float: left; width: 15%; font-weight: bold;'
      }, {
        style: 'float: left; width: 25%; font-weight: bold;'
      }, {
        style: 'float: right; text-align: right; width: 25%; font-weight: bold;',
        name: 'total'
      }, {
        style: 'clear: both;'
      }]
    }]
  }],
  create: function () {
    this.inherited(arguments);
    if (this.model.get('isPaid') || this.model.get('isLayaway')) {
      this.setStyle('display: none');
    }
    if (this.model.get('isPaid') || this.model.get('isLayaway')) {
      this.$.time.setContent(OB.I18N.formatDate(this.model.get('orderDate')));
    } else {
      this.$.time.setContent(OB.I18N.formatHour(this.model.get('orderDate')));
    }
    this.$.orderNo.setContent(this.model.get('documentNo'));
    this.$.bp.setContent(this.model.get('bp').get('_identifier'));
    this.$.total.setContent(this.model.printTotal());
    OB.UTIL.HookManager.executeHooks('OBPOS_RenderListReceiptLine', {
      listReceiptLine: this
    });
  }
});