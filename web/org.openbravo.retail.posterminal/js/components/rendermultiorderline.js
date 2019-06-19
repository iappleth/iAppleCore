/*
 ************************************************************************************
 * Copyright (C) 2013-2016 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, enyo, _ */
enyo.kind({
  name: 'OB.UI.RemoveMultiOrders',
  kind: 'OB.UI.SmallButton',
  classes: 'obUiRemoveMultiOrders',
  events: {
    onRemoveMultiOrders: ''
  },
  tap: function() {
    if (_.isUndefined(this.deleting) || this.deleting === false) {
      this.deleting = true;
      this.addClass('obUiRemoveMultiOrders_loading');
      this.doRemoveMultiOrders({
        order: this.owner.model
      });
    }
  }
});

enyo.kind({
  kind: 'OB.UI.SelectButton',
  name: 'OB.UI.RenderMultiOrdersLineValues',
  classes: 'obUiRenderMultiOrdersLineValues',
  handlers: {
    onChangeEditMode: 'changeEditMode'
  },
  events: {
    onShowPopup: ''
  },
  components: [
    {
      name: 'line',
      classes: 'obUiRenderMultiOrdersLineValues-line',
      components: [
        {
          name: 'multiTopLine',
          classes: 'obUiRenderMultiOrdersLineValues-line-multiTopLine',
          components: [
            {
              name: 'documentNo',
              classes:
                'obUiRenderMultiOrdersLineValues-multiTopLine-documentNo',
              initComponents: function() {
                this.setContent(
                  this.owner.owner.model.get('documentNo') +
                    ' - ' +
                    this.owner.owner.model.get('bp').get('_identifier')
                );
              }
            },
            {
              name: 'total',
              classes: 'obUiRenderMultiOrdersLineValues-multiTopLine-total',
              initComponents: function() {
                this.setContent(
                  !_.isUndefined(
                    this.owner.owner.model.get('amountToLayaway')
                  ) && !_.isNull(this.owner.owner.model.get('amountToLayaway'))
                    ? OB.I18N.formatCurrency(
                        this.owner.owner.model.get('amountToLayaway')
                      )
                    : this.owner.owner.model.printPending()
                );
              }
            }
          ]
        },
        {
          name: 'totalAndLayaway',
          classes: 'obUiRenderMultiOrdersLineValues-line-totalAndLayaway',
          components: [
            {
              name: 'totalOrder',
              classes:
                'obUiRenderMultiOrdersLineValues-totalAndLayaway-totalOrder',
              initComponents: function() {
                this.setContent(
                  OB.I18N.getLabel('OBPOS_LineTotal') +
                    ': ' +
                    this.owner.owner.model.printTotal()
                );
              }
            },
            {
              name: 'isLayaway',
              classes:
                'obUiRenderMultiOrdersLineValues-totalAndLayaway-isLayaway',
              initComponents: function() {
                if (this.owner.owner.model.get('isLayaway')) {
                  this.setContent(OB.I18N.getLabel('OBPOS_LblLayaway'));
                } else if (
                  !_.isUndefined(
                    this.owner.owner.model.get('amountToLayaway')
                  ) &&
                  !_.isNull(this.owner.owner.model.get('amountToLayaway'))
                ) {
                  this.setContent(OB.I18N.getLabel('OBPOS_ToBeLaidaway'));
                }
              }
            }
          ]
        },
        {
          name: 'multiBottonLine',
          classes: 'obUiRenderMultiOrdersLineValues-line-multiBottonLine',
          initComponents: function() {
            this.setContent(
              OB.I18N.getLabel('OBPOS_RemainingToPay') +
                ': ' +
                this.owner.owner.model.printPending() +
                ' - (' +
                OB.I18N.formatDate(
                  new Date(this.owner.owner.model.get('orderDate'))
                ) +
                ') '
            );
          }
        },
        {
          classes: 'obUiRenderMultiOrdersLineValues-line-element1'
        }
      ]
    }
  ],
  tap: function() {
    if (OB.MobileApp.model.hasPermission('OBPOS_receipt.layawayReceipt')) {
      this.doShowPopup({
        popup: 'modalmultiorderslayaway',
        args: this.owner.model
      });
    }
  },
  changeEditMode: function(inSender, inEvent) {
    this.addRemoveClass('btnselect-orderline-edit', inEvent.edit);
    this.bubble('onShowColumn', {
      colNum: 1
    });
  }
});

enyo.kind({
  name: 'OB.UI.RenderMultiOrdersLine',
  classes: 'obUiRenderMultiOrdersLine',
  components: [
    {
      kind: 'OB.UI.RemoveMultiOrders',
      classes: 'obUiRenderMultiOrdersLine-obUiRemoveMultiOrders'
    },
    {
      kind: 'OB.UI.RenderMultiOrdersLineValues',
      classes: 'obUiRenderMultiOrdersLine-obUiRenderMultiOrdersLineValues'
    }
  ]
});

enyo.kind({
  name: 'OB.UI.RenderMultiOrdersLineEmpty',
  classes: 'obUiRenderMultiOrdersLineEmpty',
  initComponents: function() {
    this.inherited(arguments);
    this.setContent(OB.I18N.getLabel('OBPOS_ReceiptNew'));
  }
});
