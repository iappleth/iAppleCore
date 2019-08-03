/*
 ************************************************************************************
 * Copyright (C) 2013-2018 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, enyo*/

enyo.kind({
  name: 'OB.UI.ModalReceipts',
  kind: 'OB.UI.Modal',
  classes: 'obUiModalReceipts',
  published: {
    receiptsList: null
  },
  i18nHeader: 'OBPOS_LblAssignReceipt',
  body: {
    kind: 'OB.UI.ListReceipts',
    name: 'listreceipts',
    classes: 'obUiModalReceipts-listreceipts'
  },
  receiptsListChanged: function(oldValue) {
    this.$.body.$.listreceipts.setReceiptsList(this.receiptsList);
  }
});

enyo.kind({
  name: 'OB.UI.ListReceipts',
  classes: 'obUiListReceipt row-fluid',
  published: {
    receiptsList: null
  },
  components: [
    {
      classes: 'obUiListReceipt-container1 span12',
      components: [
        {
          classes: 'obUiListReceipt-container1-element1'
        },
        {
          classes: 'obUiListReceipt-container1-container1',
          components: [
            {
              name: 'receiptslistitemprinter',
              kind: 'OB.UI.ScrollableTable',
              classes:
                'obUiListReceipt-container1-container1-receiptslistitemprinter',
              renderLine: 'OB.UI.ListReceiptLine',
              renderEmpty: 'OB.UI.RenderEmpty'
            }
          ]
        }
      ]
    }
  ],
  receiptsListChanged: function(oldValue) {
    this.$.receiptslistitemprinter.setCollection(this.receiptsList);
  }
});

enyo.kind({
  name: 'OB.UI.ListReceiptLine',
  kind: 'OB.UI.SelectButton',
  classes: 'obUiListReceiptLine',
  events: {
    onHideThisPopup: '',
    onChangeCurrentOrder: ''
  },
  tap: function() {
    var execution = OB.UTIL.ProcessController.start('changeCurrentOrder');
    this.inherited(arguments);
    this.doHideThisPopup();
    this.doChangeCurrentOrder({
      newCurrentOrder: this.model
    });
    OB.UTIL.ProcessController.finish('changeCurrentOrder', execution);
  },
  components: [
    {
      name: 'line',
      classes: 'obUiListReceiptLine-line',
      components: [
        {
          classes: 'obUiListReceiptLine-line-container1',
          components: [
            {
              classes: 'obUiListReceiptLine-container1-date',
              name: 'date'
            },
            {
              classes: 'obUiListReceiptLine-container1-element1'
            },
            {
              classes: 'obUiListReceiptLine-container1-time',
              name: 'time'
            }
          ]
        },
        {
          classes: 'obUiListReceiptLine-line-container2',
          components: [
            {
              classes: 'obUiListReceiptLine-container2-orderNo',
              name: 'orderNo'
            },
            {
              classes: 'obUiListReceiptLine-container2-element1'
            },
            {
              classes: 'obUiListReceiptLine-container2-bp',
              name: 'bp'
            }
          ]
        },
        {
          name: 'lineTotalContainer',
          classes: 'obUiListReceiptLine-line-lineTotalContainer',
          components: [
            {
              classes: 'obUiListReceiptLine-lineTotalContainer-total',
              name: 'total'
            },
            {
              classes: 'obUiListReceiptLine-lineTotalContainer-element1'
            }
          ]
        },
        {
          classes: 'obUiListReceiptLine-line-container3'
        }
      ]
    }
  ],
  create: function() {
    this.inherited(arguments);
    this.$.date.setContent(
      OB.I18N.formatDate(new Date(this.model.get('orderDate')))
    );
    this.$.time.setContent(
      OB.I18N.formatHour(
        OB.I18N.normalizeDate(
          this.model.get('creationDate') || this.model.get('orderDate')
        )
      )
    );
    this.$.orderNo.setContent(this.model.get('documentNo'));
    this.$.bp.setContent(this.model.get('bp').get('_identifier'));
    this.$.total.setContent(this.model.printTotal());
    OB.UTIL.HookManager.executeHooks('OBPOS_RenderListReceiptLine', {
      listReceiptLine: this
    });
  }
});

/*delete confirmation modal*/

enyo.kind({
  kind: 'OB.UI.ModalAction',
  name: 'OB.UI.ModalDeleteReceipt',
  classes: 'obUiModalDeleteReceipt',
  events: {
    onDisableLeftToolbar: ''
  },
  bodyContent: {
    classes: 'obUiModalDeleteReceipt-bodyContent',
    i18nContent: 'OBPOS_MsgConfirmDelete' // TODO: add this as part of the message + '\n' + OB.I18N.getLabel('OBPOS_cannotBeUndone')
  },
  bodyButtons: {
    classes: 'obUiModalDeleteReceipt-bodyButtons',
    components: [
      {
        classes: 'obUiModalDeleteReceipt-bodyButtons-obUiBtnModalCancelDelete',
        kind: 'OB.UI.btnModalCancelDelete'
      },
      {
        classes: 'obUiModalDeleteReceipt-bodyButtons-obUiBtnModalApplyDelete',
        kind: 'OB.UI.btnModalApplyDelete'
      }
    ]
  },
  executeOnHide: function() {
    this.doDisableLeftToolbar({
      status: false
    });
  },
  initComponents: function() {
    this.header = OB.I18N.getLabel('OBPOS_ConfirmDeletion');
    this.inherited(arguments);
  }
});

enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.UI.btnModalApplyDelete',
  isDefaultAction: true,
  i18nContent: 'OBPOS_LblYesDelete',
  classes: 'obUiBtnModalApplyDelete',
  events: {
    onDeleteOrder: ''
  },
  tap: function() {
    this.doHideThisPopup();
    this.doDeleteOrder({
      notSavedOrder: true
    });
  }
});

enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.UI.btnModalCancelDelete',
  i18nContent: 'OBMOBC_LblCancel',
  classes: 'obUiBtnModalCancelDelete',
  tap: function() {
    this.doHideThisPopup();
  }
});
