/*
 ************************************************************************************
 * Copyright (C) 2018-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, enyo, _ */

enyo.kind({
  name: 'OB.UI.DeleteDiscountLine',
  classes: 'obUiDeletediscountLine',
  handlers: {
    onApplyChange: 'applyChange'
  },
  events: {
    onChangeSelected: ''
  },
  applyChange: function(inSender, inEvent) {
    var index = inEvent.promotionLines.indexOf(this.newAttribute);
    if (index !== -1) {
      if (this.$.checkboxButtonDiscount.checked) {
        inEvent.promotionLines[index].deleteDiscount = true;
      } else {
        inEvent.promotionLines[index].deleteDiscount = false;
      }
    }
  },
  components: [
    {
      kind: 'OB.UI.CheckboxButton',
      name: 'checkboxButtonDiscount',
      classes: 'obUiDeletediscountLine-checkboxButtonDiscount span1',
      tap: function() {
        if (this.checked) {
          this.unCheck();
          this.parent.$.discoutLineDisplay.addClass(
            'obUiDeletediscountLine-checkboxButtonDiscount-discoutLineDisplay_checked'
          );
          this.parent.$.price.addClass(
            'obUiDeletediscountLine-checkboxButtonDiscount-price_checked'
          );
        } else {
          this.check();
          this.parent.$.discoutLineDisplay.removeClass(
            'obUiDeletediscountLine-checkboxButtonDiscount-discoutLineDisplay_checked'
          );
          this.parent.$.price.removeClass(
            'obUiDeletediscountLine-checkboxButtonDiscount-price_checked'
          );
        }
        this.owner.doChangeSelected();
      }
    },
    {
      name: 'discoutLineDisplay',
      classes:
        'obUiDeletediscountLine-checkboxButtonDiscount-discoutLineDisplay',
      components: [
        {
          classes: 'obUiDeletediscountLine-discoutLineDisplay-container1 span4',
          components: [
            {
              name: 'discount',
              classes: 'obUiDeletediscountLine-container1-discount'
            },
            {
              name: 'discountedProducts',
              classes: 'obUiDeletediscountLine-container1-discountedProducts'
            }
          ]
        }
      ]
    },
    {
      name: 'price',
      classes: 'obUiDeletediscountLine-checkboxButtonDiscount-price span4'
    },
    {
      classes: 'obUiDeletediscountLine-checkboxButtonDiscount-container1'
    }
  ],
  initComponents: function() {
    this.inherited(arguments);
    this.renderDiscountLines();
  },
  renderDiscountLines: function() {
    var me = this;
    this.$.checkboxButtonDiscount.check();
    this.$.discount.setContent(this.newAttribute.promotionIdentifier);
    this.$.price.setContent(
      OB.I18N.formatCurrency(this.newAttribute.discAmt * -1)
    );

    //for each line in Discount
    _.each(this.newAttribute.appliedLine, function(lineObj) {
      var productDiscAmt = '',
        nameContent = '';
      var productName =
        lineObj.line.get('qty') > 1
          ? '(' + lineObj.line.get('qty') + 'x) '
          : '';
      productName += lineObj.line.get('product').get('_identifier');
      if (me.newAttribute.appliedLine.length > 1) {
        productDiscAmt = lineObj.discAmt * -1;
      }
      if (productDiscAmt !== '') {
        nameContent = '[' + OB.I18N.formatCurrency(productDiscAmt) + ']';
      }
      me.$.discountedProducts.createComponent({
        classes:
          'obUiDeletediscountLine-container1-discountedProducts-container1',
        components: [
          {
            tag: 'li',
            classes:
              'obUiDeletediscountLine-container1-discountedProducts-container1-container1',
            components: [
              {
                tag: 'span',
                classes:
                  'obUiDeletediscountLine-container1-discountedProducts-container1-container1-element1',
                content: productName
              },
              {
                tag: 'span',
                classes:
                  'obUiDeletediscountLine-container1-discountedProducts-container1-container1-element2',
                content: nameContent
              }
            ]
          },
          {
            classes:
              'obUiDeletediscountLine-container1-discountedProducts-container1-container2'
          }
        ]
      });
    });
  }
});

enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.UI.DeleteDiscountDeleteSelected',
  classes: 'obUiDeleteDiscountDeleteSelected',
  events: {
    onApplyChanges: '',
    onCallbackExecutor: ''
  },
  tap: function() {
    if (this.doApplyChanges()) {
      this.doCallbackExecutor();
      this.doHideThisPopup();
    }
  },
  initComponents: function() {
    this.inherited(arguments);
    this.setContent(OB.I18N.getLabel('OBPOS_LblDeleteSelected'));
  }
});

enyo.kind({
  name: 'OB.UI.ModalDeleteDiscount',
  kind: 'OB.UI.ModalAction',
  classes: 'obUiModalDeleteDiscount',
  handlers: {
    onApplyChanges: 'applyChanges',
    onCallbackExecutor: 'callbackExecutor',
    onChangeSelected: 'updateTotal'
  },
  bodyContent: {
    classes: 'obUiModalDeleteDiscount-bodyContent',
    components: [
      {
        kind: 'Scroller',
        classes: 'obUiModalDeleteDiscount-bodyContent-Scroller',
        thumb: true,
        components: [
          {
            name: 'attributes',
            classes: 'obUiModalDeleteDiscount-Scroller-attributes'
          }
        ]
      },
      {
        name: 'totalselected',
        classes: 'obUiModalDeleteDiscount-bodyContent-totalselected',
        components: [
          {
            tag: 'span',
            name: 'totalselectedLbl',
            classes: 'obUiModalDeleteDiscount-totalselected-totalselectedLbl'
          },
          {
            tag: 'span',
            name: 'totalselectedAmt',
            classes: 'obUiModalDeleteDiscount-totalselected-totalselectedAmt'
          }
        ]
      },
      {
        classes: 'obUiModalDeleteDiscount-bodyContent-container1'
      }
    ]
  },
  bodyButtons: {
    classes: 'obUiModalDeleteDiscount-bodyButtons',
    components: [
      {
        kind: 'OB.UI.DeleteDiscountDeleteSelected',
        classes:
          'obUiModalDeleteDiscount-bodyButtons-obUiDeleteDiscountDeleteSelected'
      },
      {
        kind: 'OB.UI.btnModalCancelDelete',
        classes: 'obUiModalDeleteDiscount-bodyButtons-obUibtnModalCancelDelete'
      }
    ]
  },
  applyChanges: function(inSender, inEvent) {
    this.waterfall('onApplyChange', {
      promotionLines: this.promotionsList
    });
    return true;
  },
  callbackExecutor: function(inSender, inEvent) {
    var receipt = this.args.receipt,
      linePromotions,
      selectedLines = this.args.selectedLines,
      i,
      j,
      k;

    for (i = 0; i < this.promotionsList.length; i++) {
      if (this.promotionsList[i].deleteDiscount) {
        for (j = 0; j < selectedLines.length; j++) {
          linePromotions = selectedLines[j].get('promotions');
          for (k = 0; k < linePromotions.length; k++) {
            if (
              linePromotions[k].ruleId ===
                this.promotionsList[i].promotionObj.ruleId &&
              linePromotions[k].discountinstance ===
                this.promotionsList[i].promotionObj.discountinstance
            ) {
              linePromotions.splice(k, 1);
              break;
            }
          }
        }
      }
    }
    if (this.args.context) {
      this.args.context.owner.owner.rearrangeEditButtonBar(
        this.args.selectedLine
      );
    }
    receipt.calculateReceipt();
  },
  updateTotal: function() {
    var totalSelected = 0;
    _.each(this.$.bodyContent.$.attributes.$, function(line) {
      if (line.$.checkboxButtonDiscount.checked === true) {
        totalSelected = OB.DEC.add(
          totalSelected,
          parseFloat(
            line.$.price.content.split(OB.Format.defaultGroupingSymbol).join('')
          )
        );
      }
    });
    this.$.bodyContent.$.totalselectedAmt.setContent(
      OB.I18N.formatCurrency(totalSelected)
    );
  },
  executeOnShow: function() {
    this.promotionsList = [];
    var me = this,
      i;
    this.$.bodyContent.$.attributes.destroyComponents();
    this.$.header.destroyComponents();
    this.$.header.setContent(OB.I18N.getLabel('OBPOS_LblDiscountsDelete'));

    var selectedLinesModel = this.args.selectedLines,
      manualPromotions = OB.Model.Discounts.getManualPromotions();
    _.each(selectedLinesModel, function(line) {
      //for Each Line check all Promotions
      _.each(line.get('promotions'), function(linePromotions) {
        //check manual promotions
        if (manualPromotions.indexOf(linePromotions.discountType) !== -1) {
          //check if receipt discount
          var promotionExists = false,
            i;
          if (me.promotionsList.length > 0) {
            for (i = 0; i < me.promotionsList.length; i++) {
              if (
                me.promotionsList[i].promotionObj.ruleId ===
                  linePromotions.ruleId &&
                me.promotionsList[i].promotionObj.discountinstance ===
                  linePromotions.discountinstance
              ) {
                //rule already exists, then take existing promotion and add amount
                me.promotionsList[i].discAmt += linePromotions.amt;
                me.promotionsList[i].appliedLine.push({
                  line: line,
                  discAmt: linePromotions.amt
                });
                promotionExists = true;
                break;
              }
            }
          }
          if (me.promotionsList.length === 0 || !promotionExists) {
            me.promotionsList.push({
              promotionObj: linePromotions,
              promotionIdentifier:
                linePromotions.identifier || linePromotions.name,
              appliedLine: [
                {
                  line: line,
                  discAmt: linePromotions.amt
                }
              ],
              discAmt: linePromotions.amt
            });
          }
        }
      });
    });
    //add all promotion lines
    for (i = 0; i < this.promotionsList.length; i++) {
      var lineNumber = i + 1;
      this.$.bodyContent.$.attributes.createComponent({
        kind: 'OB.UI.DeleteDiscountLine',
        name: 'deleteDiscountLine' + lineNumber,
        classes: 'obUiModalDeleteDiscount-attributes-deleteDiscountLineGeneric',
        newAttribute: this.promotionsList[i],
        args: this.args
      });
    }
    this.$.bodyContent.$.attributes.render();
    this.$.header.render();

    //calculate total
    this.updateTotal();
  },
  initComponents: function() {
    this.inherited(arguments);
    this.attributeContainer = this.$.bodyContent.$.attributes;
    this.$.bodyContent.$.totalselectedLbl.setContent(
      OB.I18N.getLabel('OBPOS_LblTotalSelected')
    );
  }
});
