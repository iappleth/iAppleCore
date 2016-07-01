/*
 ************************************************************************************
 * Copyright (C) 2015-2016 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, _ */

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
    if (this.maxLines) {
      this.$.numberQty.max = this.maxLines;
    }
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
          style: 'float: left; '
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

  executeOnHide: function () {
    //executed when popup is hiden.
    //to access to argumens -> this.args
  },

  executeOnShow: function () {
    //executed when popup is shown.
    //to access to argumens -> this.args
    this.orderline = this.args.model;
    this.receipt = this.args.receipt;
    this.$.bodyContent.$.originalQty.setValue(this.orderline.get('qty'));
    this.$.bodyContent.$.numberlinesQty.$.numberQty.setValue(2);
    this.$.bodyContent.$.numberlinesQty.$.numberQty.setMin(2);
    this.$.bodyContent.$.numberlinesQtyMobile.$.numberQty.setValue(2);
    this.$.bodyContent.$.numberlinesQtyMobile.$.numberQty.setMin(2);
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
          context: this,
          callback: this.addProductSplit
        });
      } else {
        OB.log('error', 'Can not add product to receipt');
      }
    }
  },

  splitLines: function () {
    this.indexToAdd = 1;
    this.qtysToAdd = this.$.bodyContent.$.qtyLines.getValues();
    this.doAddProduct({
      options: {
        line: this.orderline
      },
      product: this.orderline.get('product'),
      qty: this.qtysToAdd[0] - this.orderline.get('qty'),
      context: this,
      callback: function (success, orderline) {
        if (success) {
          this.orderline.set('splitline', true);
          this.addProductSplit(true, orderline);
        } else {
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
