/*
 ************************************************************************************
 * Copyright (C) 2015-2016 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, _, Backbone */

enyo.kind({
  name: 'OB.UI.ModalNumberEditor',
  events: {
    onNumberChange: ''
  },
  style: 'clear: both; padding: 0',
  components: [{
    kind: 'OB.UI.SmallButton',
    name: 'btnQtyMinus',
    classes: 'btnlink-white',
    style: 'border: 1px solid #E2E2E2; margin: -2px 2px 0 0',
    content: '−',
    tap: function () {
      var qty = parseInt(this.owner.$.numberQty.getValue(), 10),
          min = this.owner.$.numberQty.getMin();
      if (qty > min) {
        this.owner.$.numberQty.setValue(qty - 1);
        this.owner.doNumberChange({
          numberId: this.owner.name,
          value: parseInt(this.owner.$.numberQty.getValue(), 10)
        });
      }
    }
  }, {
    kind: 'OB.UI.EditNumber',
    name: 'numberQty',
    min: 1,
    classes: 'btnlink-white splitline-number-edit'
  }, {
    kind: 'OB.UI.SmallButton',
    name: 'btnQtyPlus',
    classes: 'btnlink-white',
    style: 'border: 1px solid #E2E2E2; margin: -2px 0 0 2px;',
    content: '+',
    tap: function () {
      var qty = parseInt(this.owner.$.numberQty.getValue(), 10),
          max = this.owner.$.numberQty.getMax();
      if (!max || qty < max) {
        this.owner.$.numberQty.setValue(qty + 1);
        this.owner.doNumberChange({
          numberId: this.owner.name,
          value: parseInt(this.owner.$.numberQty.getValue(), 10)
        });
      }
    }
  }],
  initComponents: function () {
    this.inherited(arguments);
    this.$.numberQty.setNumberId(this.name);
  }
});

enyo.kind({
  name: 'OB.UI.ModalSplitLinesTable',
  kind: 'Scroller',
  maxHeight: '200px',
  style: 'width: 100%; background-color: #fff; overflow: auto',
  initComponents: function () {
    this.inherited(arguments);
    this.lines = [];
  },
  createLine: function (qty) {
    var lineNum = this.lines.length,
        line = this.createComponent({
        style: 'width: 100%; clear:both; background-color: #fff; height: 35px; padding-top: 2px;',
        components: [{
          classes: 'splitline-line-label',
          name: 'lineNum_' + lineNum,
          content: OB.I18N.getLabel('OBPOS_lblSplitLinesQty', [lineNum + 1])
        }, {
          classes: 'splitline-line-editors',
          components: [{
            kind: 'OB.UI.ModalNumberEditor',
            name: 'qty_' + lineNum,
            style: 'float: left; '
          }, {
            kind: 'OB.UI.SmallButton',
            name: 'btnRemove_' + lineNum,
            lineNum: lineNum,
            classes: 'btnlink-gray',
            style: 'float: left; border: 1px solid #D2D2D2; margin: 2px 0 0 5px',
            content: 'x',
            tap: function () {
              this.owner.removeLine(this.lineNum, true);
            }
          }]
        }]
      });
    line.owner.$['qty_' + lineNum].$.numberQty.setValue(qty);
    line.render();
    this.lines.push(line);
  },
  setValues: function (values) {
    var i;
    for (i = 0; i < values.length && i < this.lines.length; i++) {
      this.lines[i].owner.$['qty_' + i].$.numberQty.setValue(values[i]);
    }
  },
  getValues: function () {
    var result = [];
    _.each(this.lines, function (line, index) {
      result.push(parseInt(line.owner.$['qty_' + index].$.numberQty.getValue(), 10));
    });
    return result;
  },
  countLines: function () {
    return this.lines.length;
  },
  sumLines: function () {
    var sum = 0;
    _.each(this.lines, function (line, indx) {
      sum += parseInt(line.owner.$['qty_' + indx].$.numberQty.getValue(), 10);
    });
    return sum;
  },
  removeLine: function (lineNum, modified) {
    if (this.lines.length > 2 && lineNum >= 0 && lineNum < this.lines.length) {
      var i;
      for (i = lineNum; i < this.lines.length - 1; i++) {
        this.lines[i].owner.$['qty_' + i].$.numberQty.setValue(this.lines[i + 1].owner.$['qty_' + (i + 1)].$.numberQty.getValue());
      }
      this.lines[this.lines.length - 1].destroy();
      this.lines.pop();
      this.owner.$.numberlinesQty.$.numberQty.setValue(this.lines.length);
      this.owner.$.numberlinesQtyMobile.$.numberQty.setValue(this.lines.length);
      if (modified) {
        this.owner.owner.setModified();
        this.owner.owner.updateDifference();
      }
    }
  },
  removeAllLine: function () {
    _.each(this.lines, function (line) {
      line.destroy();
    });
    this.lines = [];
  }
});

enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.UI.ModalSplitLine_btnApply',
  isDefaultAction: true,
  i18nContent: 'OBPOS_LblApplyButton',
  tap: function () {
    this.owner.owner.splitLines();
    this.doHideThisPopup();
  }
});

enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.UI.ModalSplitLine_btnCancel',
  isDefaultAction: false,
  i18nContent: 'OBMOBC_LblCancel',
  tap: function () {
    this.doHideThisPopup();
  }
});

enyo.kind({
  kind: 'OB.UI.ModalAction',
  name: 'OB.UI.ModalSplitLine',
  i18nHeader: 'OBPOS_lblSplit',
  topPosition: '60px',
  events: {
    onHideThisPopup: '',
    onAddProduct: ''
  },
  handlers: {
    onNumberChange: 'numberChange'
  },
  //body of the popup
  bodyContent: {
    components: [{
      style: 'padding: 6px 0px 0px 14px;',
      initComponents: function () {
        this.setContent(OB.I18N.getLabel('OBPOS_lblSplitWarning'));
      }
    }, {
      classes: 'splitline-info',
      components: [{
        classes: 'splitline-info-label',
        initComponents: function () {
          this.setContent(OB.I18N.getLabel('OBPOS_lblSplitOriginalQty'));
        }
      }, {
        classes: 'splitline-info-label',
        initComponents: function () {
          this.setContent(OB.I18N.getLabel('OBPOS_lblSplitQty'));
        }
      }, {
        classes: 'splitline-info-label splitline-info-label-difference',
        initComponents: function () {
          this.setContent(OB.I18N.getLabel('OBPOS_lblSplitDifference'));
        }
      }, {
        classes: 'splitline-info-label splitline-info-hide-lines',
        initComponents: function () {
          this.setContent(OB.I18N.getLabel('OBPOS_lblSplitNumberLines'));
        }
      }]
    }, {
      style: 'background-color: #fff; height: 34px; color: black; font-size: 16px; padding-top: 1px',
      components: [{
        classes: 'splitline-info-editor',
        components: [{
          kind: 'OB.UI.EditNumber',
          name: 'originalQty',
          style: 'width: 40px; height: 23px;',
          initComponents: function () {
            this.setDisabled(true);
          }
        }]
      }, {
        classes: 'splitline-info-editor',
        components: [{
          kind: 'OB.UI.EditNumber',
          name: 'splitQty',
          style: 'width: 40px; height: 23px;',
          initComponents: function () {
            this.setDisabled(true);
          }
        }]
      }, {
        classes: 'splitline-info-editor',
        components: [{
          kind: 'OB.UI.EditNumber',
          name: 'differenceQty',
          style: 'width: 40px; height: 23px;',
          initComponents: function () {
            this.setDisabled(true);
          }
        }]
      }, {
        classes: 'splitline-info-editor splitline-info-hide-lines',
        components: [{
          kind: 'OB.UI.ModalNumberEditor',
          name: 'numberlinesQty',
          maxLines: 100
        }]
      }]
    }, {
      style: 'height: 15px;'
    }, {
      classes: 'splitline-lines-number-hide',
      style: 'width: 100%; clear:both; background-color: #fff; height: 55px; padding-top: 2px;',
      components: [{
        classes: 'splitline-line-label',
        initComponents: function () {
          this.setContent(OB.I18N.getLabel('OBPOS_lblSplitNumberLines'));
        }
      }, {
        classes: 'splitline-line-editors',
        components: [{
          kind: 'OB.UI.ModalNumberEditor',
          name: 'numberlinesQtyMobile',
          style: 'float: left; ',
          maxLines: 100
        }]
      }]
    }, {
      classes: 'splitline-lines-number-hide',
      style: 'height: 15px;'
    }, {
      kind: 'OB.UI.ModalSplitLinesTable',
      name: 'qtyLines'
    }, {
      style: 'padding: 6px 0px 0px 14px; color: yellow',
      name: 'labelError',
      showing: false,
      initComponents: function () {
        this.setContent(OB.I18N.getLabel('OBPOS_lblSplitErrorQty'));
      }
    }]
  },
  //buttons of the popup
  bodyButtons: {
    components: [{
      kind: 'OB.UI.ModalSplitLine_btnApply',
      name: 'btnApply'
    }, {
      kind: 'OB.UI.ModalSplitLine_btnCancel'
    }]
  },

  executeOnShow: function () {

    var maxRows, mobileMaxRows;

    this.orderline = this.args.model;
    this.receipt = this.args.receipt;

    maxRows = Math.min(this.orderline.get('qty'), this.$.bodyContent.$.numberlinesQty.maxLines);
    mobileMaxRows = Math.min(this.orderline.get('qty'), this.$.bodyContent.$.numberlinesQtyMobile.maxLines);

    this.$.bodyContent.$.originalQty.setValue(this.orderline.get('qty'));
    this.$.bodyContent.$.numberlinesQty.$.numberQty.setValue(2);
    this.$.bodyContent.$.numberlinesQty.$.numberQty.setMin(2);
    this.$.bodyContent.$.numberlinesQty.$.numberQty.setMax(maxRows);
    this.$.bodyContent.$.numberlinesQtyMobile.$.numberQty.setValue(2);
    this.$.bodyContent.$.numberlinesQtyMobile.$.numberQty.setMin(2);
    this.$.bodyContent.$.numberlinesQtyMobile.$.numberQty.setMax(mobileMaxRows);
    this.$.bodyContent.$.qtyLines.removeAllLine();
    _.each(this.getSplitProposal(), function (qty) {
      this.$.bodyContent.$.qtyLines.createLine(qty);
    }, this);
    this.updateDifference();
    this.modified = false;
  },

  setModified: function () {
    this.modified = true;
  },

  excludeFromCopy: [ //
  '_gross', 'discountedNet', 'gross', 'grossListPrice', 'id', 'linerate', 'net', 'noDiscountCandidates', //
  'price', 'priceIncludesTax', 'priceList', 'pricenet', 'product', 'productidentifier', //
  'promotionCandidates', 'promotionMessages', 'promotions', 'qty', 'qtyToApplyDiscount', 'splitline', //
  'tax', 'taxAmount', 'taxLines', 'uOM', 'warehouse', 'deliveredQuantity', 'replacedorderline'],

  splittedLines: [],

  getAdjustedPromotion: function (promo, qty) {
    var clonedPromotion = JSON.parse(JSON.stringify(promo));
    if (clonedPromotion.discountType === 'D1D193305A6443B09B299259493B272A' || promo.discountType === '7B49D8CC4E084A75B7CB4D85A6A3A578') {
      var amount = clonedPromotion.amt / clonedPromotion.qtyOffer * qty;
      clonedPromotion.amt = amount;
      clonedPromotion.displayedTotalAmount = amount;
      clonedPromotion.fullAmt = amount;
      clonedPromotion.userAmt = amount;
      clonedPromotion.qtyOffer = qty;
      clonedPromotion.obdiscQtyoffer = qty;
      clonedPromotion.pendingQtyOffer = qty;
    }
    return clonedPromotion;
  },

  addManualPromotionSplit: function (line, promo) {
    var adjustedPromotion = this.getAdjustedPromotion(promo, line.get('qty'));
    OB.Model.Discounts.addManualPromotion(this.receipt, [line], {
      definition: adjustedPromotion,
      rule: new Backbone.Model(adjustedPromotion)
    });
  },

  addProductSplit: function (success, addline) {
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
        this.doAddProduct({
          product: this.orderline.get('product'),
          qty: this.qtysToAdd[this.indexToAdd++],
          attrs: {
            'splitline': true
          },
          options: {
            at: addline.collection.indexOf(addline) + 1
          },
          context: this,
          callback: function (success, addline) {
            this.splittedLines.push(addline);
            addline.set('promotions', []);
            var promotionManual = _.filter(this.orderline.get('promotions'), function (promo) {
              return promo.manual;
            });
            _.forEach(promotionManual, function (promo) {
              this.addManualPromotionSplit(addline, promo);
            }, this);
            this.addProductSplit(success, addline);
          }
        });
      } else {
        OB.log('error', 'Can not add product to receipt');
      }
    } else {
      var promotionManual = _.filter(this.orderline.get('promotions'), function (promo) {
        return promo.manual;
      });
      _.forEach(promotionManual, function (promo, index) {
        if (promo.discountType === 'D1D193305A6443B09B299259493B272A' || promo.discountType === '7B49D8CC4E084A75B7CB4D85A6A3A578') {
          var adjustedPromotion = this.getAdjustedPromotion(promo, this.orderline.get('qty'));
          var splittedAmount = _.reduce(this.splittedLines, function (sum, line) {
            var linePromo = _.find(line.get('promotions'), function (lp) {
              return lp.discountType === promo.discountType;
            });
            if (linePromo) {
              return sum + OB.DEC.toNumber(OB.DEC.toBigDecimal(OB.I18N.formatCurrency(linePromo.amt)));
            }
            return sum;
          }, 0);
          var bdSplittedAmount = OB.DEC.toBigDecimal(OB.I18N.formatCurrency(splittedAmount)),
              bdPromoAmount = OB.DEC.toBigDecimal(OB.I18N.formatCurrency(promo.amt));
          if (bdPromoAmount.compareTo(bdSplittedAmount.add(OB.DEC.toBigDecimal(OB.I18N.formatCurrency(adjustedPromotion.amt)))) !== 0) {
            var amount = OB.DEC.toNumber(bdPromoAmount.subtract(bdSplittedAmount));
            adjustedPromotion.amt = amount;
            adjustedPromotion.displayedTotalAmount = amount;
            adjustedPromotion.fullAmt = amount;
            adjustedPromotion.userAmt = amount;
          }
          this.orderline.get('promotions').splice(index, 1, adjustedPromotion);
        }
      }, this);
      this.receipt.set('skipCalculateReceipt', false);
      this.receipt.calculateReceipt();
    }
  },

  splitLines: function () {
    this.indexToAdd = 1;
    this.qtysToAdd = this.$.bodyContent.$.qtyLines.getValues();
    this.orderline.set('splitline', true);
    this.receipt.set('skipCalculateReceipt', true);
    this.doAddProduct({
      options: {
        line: this.orderline
      },
      product: this.orderline.get('product'),
      qty: this.qtysToAdd[0] - this.orderline.get('qty'),
      context: this,
      callback: function (success, orderline) {
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

  getSplitProposal: function () {
    var i, sum = 0,
        proposal = [],
        qty = this.orderline.get('qty'),
        lines = parseInt(this.$.bodyContent.$.numberlinesQty.$.numberQty.getValue(), 10),
        proposed = Math.floor(qty / lines);
    if (proposed < 1) {
      proposed = 1;
    }
    for (i = 0; i < lines; i++) {
      sum += proposed;
      proposal.push(proposed);
    }
    for (i = 0; i < lines && sum < qty; i++) {
      sum++;
      proposal[i]++;
    }
    return proposal;
  },

  numberChange: function (inSender, inEvent) {
    if (inEvent.numberId === 'numberlinesQty' || inEvent.numberId === 'numberlinesQtyMobile') {
      if (inEvent.numberId === 'numberlinesQty') {
        this.$.bodyContent.$.numberlinesQtyMobile.$.numberQty.setValue(inEvent.value);
      } else {
        this.$.bodyContent.$.numberlinesQty.$.numberQty.setValue(inEvent.value);
      }
      var i, countLines = this.$.bodyContent.$.qtyLines.countLines();
      if (inEvent.value < countLines) {
        for (i = 0; i < countLines - inEvent.value; i++) {
          this.$.bodyContent.$.qtyLines.removeLine(countLines - i - 1, false);
        }
      } else if (inEvent.value > countLines) {
        var qty = 1;
        if (this.modified && (inEvent.value - 1) === countLines) {
          var sumLines = this.$.bodyContent.$.qtyLines.sumLines();
          if (sumLines < this.orderline.get('qty')) {
            qty = this.orderline.get('qty') - sumLines;
          }
        }
        for (i = 0; i < inEvent.value - countLines; i++) {
          this.$.bodyContent.$.qtyLines.createLine(qty);
        }
      }
      if (!this.modified) {
        this.$.bodyContent.$.qtyLines.setValues(this.getSplitProposal());
      }
    } else {
      this.setModified();
    }
    this.updateDifference();
  },

  updateDifference: function () {
    var sumLines = this.$.bodyContent.$.qtyLines.sumLines(),
        difference = this.orderline.get('qty') - sumLines;
    this.$.bodyContent.$.splitQty.setValue(sumLines);
    this.$.bodyContent.$.differenceQty.setValue(difference);
    this.$.bodyContent.$.labelError.setShowing(difference !== 0);
    this.$.bodyButtons.$.btnApply.setDisabled(difference !== 0);
  }

});