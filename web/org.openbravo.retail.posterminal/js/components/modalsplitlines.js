/*
 ************************************************************************************
 * Copyright (C) 2016-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, _, Backbone */

OB.SplitLine = OB.SplitLine || {};
(function() {
  OB.SplitLine.MAX_SPLITLINE = 20;
})();

enyo.kind({
  name: 'OB.UI.ModalSplitLinesTable',
  kind: 'Scroller',
  classes: 'obUiModalSplitLinesTable',
  initComponents: function() {
    this.inherited(arguments);
    this.lines = [];
  },
  createLine: function(qty, deliveredLine) {
    var lineNum = this.lines.length,
      line = this.createComponent({
        classes: 'obUiModalSplitLinesTable-line',
        components: [
          {
            classes: 'obUiModalSplitLinesTable-line-container1',
            components: [
              {
                kind: 'OB.UI.FormElement',
                name: 'formElementQty_' + lineNum,
                classes:
                  'obUiFormElement_dataEntry obUiFormElement_dataEntry_noicon obUiModalSplitLinesTable-line-container1-formElementQty',
                coreElement: {
                  kind: 'OB.UI.FormElement.IntegerEditor',
                  name: 'qty_' + lineNum,
                  classes: 'obUiModalSplitLinesTable-line-container1-qty',
                  label: deliveredLine
                    ? OB.I18N.getLabel('OBPOS_lblSplitLinesQtyDelivered', [
                        lineNum + 1
                      ])
                    : OB.I18N.getLabel('OBPOS_lblSplitLinesQty', [lineNum + 1]),
                  isDisabled: deliveredLine
                }
              },
              {
                kind: 'OB.UI.SmallButton',
                name: 'btnRemove_' + lineNum,
                lineNum: lineNum,
                classes: 'obUiModalSplitLinesTable-line-container1-btnRemove',
                content: 'x',
                tap: function() {
                  this.owner.removeLine(this.lineNum, true);
                },
                disabled: deliveredLine
              }
            ]
          }
        ]
      });
    line.owner.$['formElementQty_' + lineNum].coreElement.setValue(qty);
    line.render();
    this.lines.push(line);
  },
  setValues: function(values) {
    var i;
    for (i = 0; i < values.length && i < this.lines.length; i++) {
      if (values[i] instanceof Object) {
        this.lines[i].owner.$['formElementQty_' + i].coreElement.setValue(
          values[i].qty
        );
      } else {
        this.lines[i].owner.$['formElementQty_' + i].coreElement.setValue(
          values[i]
        );
      }
    }
  },
  getValues: function() {
    var result = [];
    _.each(this.lines, function(line, index) {
      result.push(
        parseInt(
          line.owner.$['formElementQty_' + index].coreElement.getValue(),
          10
        )
      );
    });
    return result;
  },
  countLines: function() {
    return this.lines.length;
  },
  sumLines: function() {
    var sum = 0;
    _.each(this.lines, function(line, indx) {
      var val = parseInt(
        line.owner.$['formElementQty_' + indx].coreElement.getValue(),
        10
      );
      sum += isNaN(val) ? 0 : val;
    });
    return sum;
  },
  removeLine: function(lineNum, modified) {
    if (this.lines.length > 2 && lineNum >= 0 && lineNum < this.lines.length) {
      var i;
      for (i = lineNum; i < this.lines.length - 1; i++) {
        this.lines[i].owner.$['formElementQty_' + i].coreElement.setValue(
          this.lines[i + 1].owner.$[
            'formElementQty_' + (i + 1)
          ].coreElement.getValue()
        );
      }
      this.lines[this.lines.length - 1].destroy();
      this.lines.pop();
      this.owner.$.formElementNumberlinesQty.coreElement.setValue(
        this.lines.length
      );
      if (modified) {
        this.owner.owner.setModified();
        this.owner.owner.updateDifference();
      }
    }
  },
  removeAllLine: function() {
    _.each(this.lines, function(line) {
      line.destroy();
    });
    this.lines = [];
  }
});

enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.UI.ModalSplitLine_btnApply',
  classes: 'obUiModalSplitLineBtnApply',
  isDefaultAction: true,
  i18nContent: 'OBPOS_LblApplyButton',
  tap: function() {
    this.owner.owner.splitLines();
    this.doHideThisPopup();
  }
});

enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.UI.ModalSplitLine_btnCancel',
  classes: 'obUiModalSplitLineBtnCancel',
  isDefaultAction: false,
  i18nContent: 'OBMOBC_LblCancel',
  tap: function() {
    this.doHideThisPopup();
  }
});

enyo.kind({
  kind: 'OB.UI.Modal',
  name: 'OB.UI.ModalSplitLine',
  classes: 'obUiModalSplitLine',
  events: {
    onHideThisPopup: '',
    onAddProduct: ''
  },
  handlers: {
    onNumberChange: 'numberChange'
  },
  i18nHeader: 'OBPOS_lblSplit',
  //body of the popup
  body: {
    classes: 'obUiModalSplitLine-body',
    components: [
      {
        classes: 'obUiModalSplitLine-body-splitlineMessage',
        name: 'splitlineMessage',
        initComponents: function() {
          this.setContent(OB.I18N.getLabel('OBPOS_lblSplitWarning'));
        }
      },
      {
        classes: 'obUiModalSplitLine-body-header',
        components: [
          {
            classes: 'obUiModalSplitLine-body-header-infoFields',
            components: [
              {
                classes: 'obUiModalSplitLine-body-header-infoFields-container1',
                components: [
                  {
                    kind: 'OB.UI.FormElement',
                    name: 'formElementOriginalQty',
                    classes:
                      'obUiFormElement_dataEntry obUiFormElement_dataEntry_noicon obUiModalSplitLine-body-header-infoFields-container1-formElementOriginalQty',
                    coreElement: {
                      kind: 'OB.UI.EditNumber',
                      name: 'originalQty',
                      classes:
                        'obUiModalSplitLine-body-header-infoFields-container1-originalQty',
                      i18nLabel: 'OBPOS_lblSplitOriginalQty',
                      initComponents: function() {
                        this.setDisabled(true);
                      }
                    }
                  }
                ]
              },
              {
                classes: 'obUiModalSplitLine-body-header-infoFields-container2',
                components: [
                  {
                    kind: 'OB.UI.FormElement',
                    name: 'formElementSplitQty',
                    classes:
                      'obUiFormElement_dataEntry obUiFormElement_dataEntry_noicon obUiModalSplitLine-body-header-infoFields-container2-formElementSplitQty',
                    coreElement: {
                      kind: 'OB.UI.EditNumber',
                      name: 'splitQty',
                      classes:
                        'obUiModalSplitLine-body-header-infoFields-container2-splitQty',
                      i18nLabel: 'OBPOS_lblSplitQty',
                      initComponents: function() {
                        this.setDisabled(true);
                      }
                    }
                  }
                ]
              },
              {
                classes: 'obUiModalSplitLine-body-header-infoFields-container3',
                components: [
                  {
                    kind: 'OB.UI.FormElement',
                    name: 'formElementDifferenceQty',
                    classes:
                      'obUiFormElement_dataEntry obUiFormElement_dataEntry_noicon obUiModalSplitLine-body-header-infoFields-container3-formElementDifferenceQty',
                    coreElement: {
                      kind: 'OB.UI.EditNumber',
                      name: 'differenceQty',
                      classes:
                        'obUiModalSplitLine-body-header-infoFields-container3-differenceQty',
                      i18nLabel: 'OBPOS_lblSplitDifference',
                      initComponents: function() {
                        this.setDisabled(true);
                      }
                    }
                  }
                ]
              }
            ]
          },
          {
            classes: 'obUiModalSplitLine-body-header-numberlinesSetter',
            components: [
              {
                kind: 'OB.UI.FormElement',
                name: 'formElementNumberlinesQty',
                classes:
                  'obUiFormElement_dataEntry obUiFormElement_dataEntry_noicon obUiModalSplitLine-body-header-numberlinesSetter-formElementNumberlinesQty',
                coreElement: {
                  kind: 'OB.UI.FormElement.IntegerEditor',
                  name: 'numberlinesQty',
                  classes:
                    'obUiModalSplitLine-body-header-numberlinesSetter-numberlinesQty',
                  i18nLabel: 'OBPOS_lblSplitNumberLines',
                  maxLines: OB.SplitLine.MAX_SPLITLINE
                }
              }
            ]
          }
        ]
      },
      {
        kind: 'OB.UI.ModalSplitLinesTable',
        name: 'qtyLines',
        classes: 'obUiModalSplitLine-body-qtyLines'
      },
      {
        classes: 'obUiModalSplitLine-body-labelError',
        name: 'labelError',
        showing: false,
        initComponents: function() {
          this.setContent(OB.I18N.getLabel('OBPOS_lblSplitErrorQty'));
        }
      }
    ]
  },
  //buttons of the popup
  footer: {
    classes: 'obUiModal-footer-mainButtons obUiModalSplitLine-footer',
    components: [
      {
        kind: 'OB.UI.ModalSplitLine_btnCancel',
        classes: 'obUiModalSplitLine-footer-obUiModalSplitLineBtnCancel'
      },
      {
        kind: 'OB.UI.ModalSplitLine_btnApply',
        name: 'btnApply',
        classes: 'obUiModalSplitLine-footer-btnApply'
      }
    ]
  },

  executeOnShow: function() {
    var maxRows;

    this.orderline = this.args.model;
    this.receipt = this.args.receipt;

    maxRows = Math.min(
      this.orderline.get('qty'),
      this.$.body.$.formElementNumberlinesQty.coreElement.maxLines
    );

    this.$.body.$.formElementOriginalQty.coreElement.setValue(
      this.orderline.get('qty')
    );
    this.$.body.$.formElementNumberlinesQty.coreElement.setValue(2);
    this.$.body.$.formElementNumberlinesQty.coreElement.setMin(2);
    this.$.body.$.formElementNumberlinesQty.coreElement.setMax(maxRows);
    this.$.body.$.qtyLines.removeAllLine();
    _.each(
      this.getSplitProposal(),
      function(qty) {
        if (qty instanceof Object) {
          this.$.body.$.qtyLines.createLine(qty.qty, true);
        } else {
          this.$.body.$.qtyLines.createLine(qty);
        }
      },
      this
    );
    this.updateDifference();
    this.modified = false;
  },

  setModified: function() {
    this.modified = true;
  },

  excludeFromCopy: [
    //
    '_gross',
    'discountedNet',
    'gross',
    'grossListPrice',
    'id',
    'linerate',
    'net',
    'noDiscountCandidates', //
    'price',
    'priceIncludesTax',
    'priceList',
    'pricenet',
    'product',
    'productidentifier', //
    'promotionCandidates',
    'promotionMessages',
    'promotions',
    'qty',
    'qtyToApplyDiscount',
    'splitline', //
    'tax',
    'taxAmount',
    'taxLines',
    'uOM',
    'warehouse',
    'deliveredQuantity',
    'replacedorderline'
  ],

  splittedLines: [],

  getAdjustedPromotion: function(promo, qty) {
    var clonedPromotion = JSON.parse(JSON.stringify(promo));
    if (
      clonedPromotion.discountType === 'D1D193305A6443B09B299259493B272A' ||
      promo.discountType === '7B49D8CC4E084A75B7CB4D85A6A3A578'
    ) {
      var amount = (clonedPromotion.amt / clonedPromotion.originalQty) * qty;
      clonedPromotion.amt = amount;
      clonedPromotion.displayedTotalAmount = amount;
      clonedPromotion.fullAmt = amount;
      clonedPromotion.userAmt = amount;
      clonedPromotion.pendingQtyOffer = qty;
    }
    return clonedPromotion;
  },

  addManualPromotionSplit: function(line, promo) {
    var adjustedPromotion = this.getAdjustedPromotion(promo, line.get('qty'));
    OB.Model.Discounts.addManualPromotion(this.receipt, [line], {
      definition: adjustedPromotion,
      rule: new Backbone.Model(adjustedPromotion)
    });
  },

  addProductSplit: function(success, addline) {
    if (success && addline && addline.id !== this.orderline.id) {
      if (addline.get('price') !== this.orderline.get('price')) {
        this.receipt.setPrice(addline, this.orderline.get('price'));
      }
      var key;
      for (key in this.orderline.attributes) {
        if (this.orderline.attributes.hasOwnProperty(key)) {
          if (_.indexOf(this.excludeFromCopy, key) === -1) {
            addline.set(key, this.orderline.get(key));
          }
        }
      }
      if (addline.id !== this.orderline.id) {
        addline.set('remainingQuantity', 0);
      }
    }
    if (this.indexToAdd < this.qtysToAdd.length) {
      if (success) {
        var originalQty = 0;
        _.each(this.qtysToAdd, function(qtyToAdd) {
          originalQty += qtyToAdd;
        });
        this.doAddProduct({
          product: this.orderline.get('product'),
          qty: this.qtysToAdd[this.indexToAdd++],
          attrs: {
            splitline: true,
            originalLine: this.orderline
          },
          options: {
            at: addline.collection.indexOf(addline) + 1,
            blockAddProduct: true,
            isSplitLinesAction: true
          },
          context: this,
          callback: function(success, addline) {
            this.splittedLines.push(addline);
            addline.set('promotions', []);
            var promotionManual = _.filter(
              this.orderline.get('promotions'),
              function(promo) {
                return promo.manual;
              }
            );
            _.forEach(
              promotionManual,
              function(promo) {
                promo.originalQty = originalQty;
                this.addManualPromotionSplit(addline, promo);
              },
              this
            );
            this.addProductSplit(success, addline);
          }
        });
      } else {
        OB.log('error', 'Can not add product to receipt');
      }
    } else {
      var promotionManual = _.filter(this.orderline.get('promotions'), function(
        promo
      ) {
        return promo.manual;
      });
      _.forEach(
        promotionManual,
        function(promo, index) {
          if (
            promo.discountType === 'D1D193305A6443B09B299259493B272A' ||
            promo.discountType === '7B49D8CC4E084A75B7CB4D85A6A3A578' ||
            promo.discountType === 'F3B0FB45297844549D9E6B5F03B23A82'
          ) {
            var adjustedPromotion = this.getAdjustedPromotion(
              promo,
              this.orderline.get('qty')
            );
            var splittedAmount = _.reduce(
              this.splittedLines,
              function(sum, line) {
                var linePromo = _.find(line.get('promotions'), function(lp) {
                  return lp.discountType === promo.discountType;
                });
                if (linePromo) {
                  return (
                    sum + OB.DEC.toNumber(OB.DEC.toBigDecimal(linePromo.amt))
                  );
                }
                return sum;
              },
              0
            );
            var bdSplittedAmount = OB.DEC.toBigDecimal(splittedAmount),
              bdPromoAmount = OB.DEC.toBigDecimal(promo.amt);
            if (
              bdPromoAmount.compareTo(
                bdSplittedAmount.add(OB.DEC.toBigDecimal(adjustedPromotion.amt))
              ) !== 0
            ) {
              var amount = OB.DEC.toNumber(
                bdPromoAmount.subtract(bdSplittedAmount)
              );
              adjustedPromotion.amt = amount;
              adjustedPromotion.displayedTotalAmount = amount;
              adjustedPromotion.fullAmt = amount;
              adjustedPromotion.userAmt = amount;
              adjustedPromotion.splitAmt = amount;
            }
            this.orderline
              .get('promotions')
              .splice(index, 1, adjustedPromotion);
          }
        },
        this
      );
      var me = this;
      OB.UTIL.HookManager.executeHooks(
        'OBPOS_PostSplitLine',
        {
          receipt: this.receipt,
          line: this.orderline,
          splittedLines: this.splittedLines
        },
        function(args) {
          me.receipt.set('skipCalculateReceipt', false);
          me.receipt.calculateReceipt();
        }
      );
    }
  },

  splitLines: function() {
    this.indexToAdd = 1;
    this.qtysToAdd = this.$.body.$.qtyLines.getValues();
    this.orderline.set('splitline', true);
    this.receipt.set('skipCalculateReceipt', true);
    this.doAddProduct({
      options: {
        line: this.orderline,
        blockAddProduct: true,
        isSplitLinesAction: true
      },
      product: this.orderline.get('product'),
      qty: this.qtysToAdd[0] - this.orderline.get('qty'),
      context: this,
      callback: function(success, orderline) {
        if (success) {
          this.splittedLines = [];
          this.addProductSplit(true, orderline);
        } else {
          this.orderline.set('splitline', false);
          this.receipt.set('skipCalculateReceipt', false);
          OB.log('error ', 'Can not change units');
        }
      }
    });
  },

  getSplitProposal: function() {
    var i,
      sum = 0,
      proposal = [],
      qty = this.orderline.get('qty'),
      lines = parseInt(
        this.$.body.$.formElementNumberlinesQty.coreElement.getValue(),
        10
      ),
      proposed = Math.floor(qty / lines),
      remainingQuantity = this.orderline.get('remainingQuantity');
    if (proposed < 1) {
      proposed = 1;
    }
    if (remainingQuantity) {
      proposal.push({
        qty: remainingQuantity,
        delivered: true
      });
      sum += remainingQuantity;

      proposed = Math.floor((qty - remainingQuantity) / lines + 1);
      if (proposed < 1) {
        proposed = 1;
      }

      for (i = 1; i < lines; i++) {
        sum += proposed;
        proposal.push(proposed);
      }
      for (i = 1; i < lines && sum < qty; i++) {
        sum++;
        proposal[i]++;
      }
    } else {
      for (i = 0; i < lines; i++) {
        sum += proposed;
        proposal.push(proposed);
      }
      for (i = 0; i < lines && sum < qty; i++) {
        sum++;
        proposal[i]++;
      }
    }
    return proposal;
  },

  numberChange: function(inSender, inEvent) {
    if (inEvent.numberId === 'numberlinesQty') {
      this.$.body.$.formElementNumberlinesQty.coreElement.setValue(
        inEvent.value
      );
      var i,
        countLines = this.$.body.$.qtyLines.countLines();
      if (inEvent.value < countLines) {
        for (i = 0; i < countLines - inEvent.value; i++) {
          this.$.body.$.qtyLines.removeLine(countLines - i - 1, false);
        }
      } else if (inEvent.value > countLines) {
        var qty = 1;
        if (this.modified && inEvent.value - 1 === countLines) {
          var sumLines = this.$.body.$.qtyLines.sumLines();
          if (sumLines < this.orderline.get('qty')) {
            qty = this.orderline.get('qty') - sumLines;
          }
        }
        for (i = 0; i < inEvent.value - countLines; i++) {
          this.$.body.$.qtyLines.createLine(qty);
        }
      }
      if (!this.modified) {
        this.$.body.$.qtyLines.setValues(this.getSplitProposal());
      }
    } else {
      this.setModified();
    }
    this.updateDifference();
  },

  updateDifference: function() {
    var sumLines = this.$.body.$.qtyLines.sumLines(),
      difference = this.orderline.get('qty') - sumLines;
    this.$.body.$.formElementSplitQty.coreElement.setValue(sumLines);
    this.$.body.$.formElementDifferenceQty.coreElement.setValue(difference);
    this.$.body.$.labelError.setShowing(difference !== 0);
    this.$.footer.$.btnApply.setDisabled(difference !== 0);
  }
});
