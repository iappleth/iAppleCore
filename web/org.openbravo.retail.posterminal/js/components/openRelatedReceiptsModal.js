/*
 ************************************************************************************
 * Copyright (C) 2018-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, enyo, _*/

enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.UI.OpenRelatedReceipts_btnApply',
  isDefaultAction: true,
  i18nContent: 'OBPOS_LblApplyButton',
  events: {
    onApplyChanges: '',
    onExecuteCallback: ''
  },
  tap: function() {
    this.inherited(arguments);
    this.doExecuteCallback({
      executeCallback: false
    });
    this.doHideThisPopup();
    this.doApplyChanges();
  }
});

enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.UI.OpenRelatedReceipts_btnCancel',
  isDefaultAction: false,
  i18nContent: 'OBMOBC_LblCancel',
  tap: function() {
    this.inherited(arguments);
    this.doHideThisPopup();
  }
});

enyo.kind({
  name: 'OB.UI.CheckboxButtonOpenRelatedReceipts',
  kind: 'OB.UI.CheckboxButton',
  classes: 'modal-dialog-btn-check span1',
  style: 'width: 8%',
  events: {
    onLineSelected: ''
  },
  handlers: {
    onCheckAll: 'checkAll'
  },
  checkAll: function(inSender, inEvent) {
    if (inEvent.checked) {
      this.check();
    } else {
      this.unCheck();
    }
  },
  tap: function() {
    this.inherited(arguments);
    this.doLineSelected({
      selected: this.checked
    });
  }
});

enyo.kind({
  name: 'OB.UI.RelatedReceipt',
  style:
    'border-bottom: 1px solid #cccccc; text-align: center; color: black; padding-top: 9px;',
  handlers: {
    onLineSelected: 'lineSelected'
  },
  components: [
    {
      kind: 'OB.UI.CheckboxButtonOpenRelatedReceipts',
      name: 'checkboxButtonOpenRelatedReceipts'
    },
    {
      name: 'documentNo',
      classes: 'span4 relatedDocsDocNo'
    },
    {
      name: 'orderedDate',
      classes: 'span2 relatedDocsOrderDate'
    },
    {
      name: 'amount',
      classes: 'span2 relatedDocsAmount'
    },
    {
      name: 'pending',
      classes: 'span2 relatedDocsPending'
    },
    {
      style: 'clear: both;'
    }
  ],
  initComponents: function() {
    this.inherited(arguments);
    var symbol = OB.MobileApp.model.get('terminal').symbol,
      symbolAtRight = OB.MobileApp.model.get('terminal')
        .currencySymbolAtTheRight;
    this.$.documentNo.setContent(this.order.get('documentNo'));
    this.$.orderedDate.setContent(
      OB.I18N.formatDate(new Date(this.order.get('orderDate')))
    );
    this.$.amount.setContent(
      OB.I18N.formatCurrencyWithSymbol(
        this.order.get('amount'),
        symbol,
        symbolAtRight
      )
    );
    this.$.pending.setContent(
      OB.I18N.formatCurrencyWithSymbol(
        this.order.get('pending'),
        symbol,
        symbolAtRight
      )
    );
  },
  lineSelected: function(inSender, inEvent) {
    inEvent.selectedLine = this.order.id;
  }
});

enyo.kind({
  name: 'OB.UI.ModalOpenRelatedReceipts',
  kind: 'OB.UI.ModalAction',
  classes: 'modal-dialog',
  style: 'width: 700px;',
  handlers: {
    onApplyChanges: 'applyChanges',
    onCheckedAll: 'checkedAll',
    onLineSelected: 'lineSelected',
    onExecuteCallback: 'executeCallback'
  },
  bodyContent: {
    kind: 'Scroller',
    maxHeight: '225px',
    style: 'background-color: #ffffff;margin-top: -8px;',
    thumb: true,
    horizontal: 'hidden',
    components: [
      {
        name: 'attributes'
      }
    ]
  },
  bodyButtons: {
    components: [
      {
        kind: 'OB.UI.OpenRelatedReceipts_btnApply'
      },
      {
        kind: 'OB.UI.OpenRelatedReceipts_btnCancel'
      }
    ]
  },
  lineSelected: function(inSender, inEvent) {
    var selectedOrder = _.find(this.args.models, function(model) {
      return model.id === inEvent.selectedLine;
    });
    if (inEvent.selected) {
      this.selectedOrders.push(selectedOrder.attributes);
    } else {
      var index;
      for (index = 0; index < this.selectedOrders.length; index++) {
        var order = this.selectedOrders[index];
        if (order.id === selectedOrder.id) {
          break;
        }
      }
      this.selectedOrders.splice(index, 1);
    }
    this.$.bodyButtons.$.openRelatedReceipts_btnApply.setDisabled(
      _.reduce(
        this.$.bodyContent.$.attributes.$,
        function(count, line) {
          return line.$.checkboxButtonOpenRelatedReceipts.checked
            ? count + 1
            : count;
        },
        0
      ) === 0
    );
  },
  applyChanges: function(inSender, inEvent) {
    this.args.callback(this.selectedOrders);
  },
  executeCallback: function(inSender, inEvent) {
    this.execCallback = inEvent.executeCallback;
  },
  executeOnShow: function() {
    var lineNum = 0,
      model,
      i;
    this.selectedOrders = JSON.parse(JSON.stringify(this.args.models));
    this.execCallback = true;
    this.$.bodyContent.$.attributes.destroyComponents();
    this.$.header.destroyComponents();
    this.$.header.createComponent({
      name: 'CheckAllHeaderDocNum',
      style: 'text-align: center; color: white;',
      components: [
        {
          content: OB.I18N.getLabel('OBPOS_OpenRelatedReceiptsTitle'),
          name: 'headerLbl',
          classes: 'span12',
          style: 'line-height: 50px; font-size: 24px;'
        },
        {
          style: 'clear: both;'
        }
      ]
    });
    this.$.header.addStyles('padding-bottom: 0px; margin: 0px; height: 140px;');
    this.$.header.createComponent({
      name: 'CheckAllHeader',
      style:
        'overflow: hidden; padding-top: 20px; border-bottom: 3px solid #cccccc; text-align: center; color: black; margin-top: 15px; padding-bottom: 7px;  font-weight: bold; background-color: white; height:40px;',
      components: [
        {
          name: 'documentNoLbl',
          content: OB.I18N.getLabel('OBPOS_DocumentNo'),
          classes: 'span4 relatedDocsDocNolbl'
        },
        {
          name: 'orderedDateLbl',
          content: OB.I18N.getLabel('OBPOS_DateOrdered'),
          classes: 'span2 relatedDocsOrderDateLbl'
        },
        {
          name: 'amountLbl',
          content: OB.I18N.getLabel('OBPOS_AmountOfCash'),
          classes: 'span2 relatedDocsAmountLbl'
        },
        {
          name: 'pendingLbl',
          content: OB.I18N.getLabel('OBPOS_Pending'),
          classes: 'span2 relatedDocsPendingLbl'
        },
        {
          style: 'clear: both;'
        }
      ]
    });

    for (i = 1; i < this.args.models.length; i++) {
      model = this.args.models[i];
      this.$.bodyContent.$.attributes.createComponent({
        kind: 'OB.UI.RelatedReceipt',
        name: 'line' + lineNum,
        order: model
      });
      lineNum++;
    }
    this.waterfall('onCheckAll', {
      checked: true
    });
    this.$.bodyButtons.$.openRelatedReceipts_btnApply.setDisabled(false);
    this.$.header.render();
    this.$.bodyContent.$.attributes.render();
  },
  executeOnHide: function() {
    if (this.execCallback) {
      this.args.callback([this.args.models[0]]);
    }
  },
  initComponents: function() {
    this.inherited(arguments);
    this.attributeContainer = this.$.bodyContent.$.attributes;
  }
});
