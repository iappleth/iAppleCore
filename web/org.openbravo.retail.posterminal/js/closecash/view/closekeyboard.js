/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, enyo, _ */

enyo.kind({
  name: 'OB.OBPOSCashUp.UI.CashUpKeyboard',
  published: {
    payments: null
  },
  kind: 'OB.UI.Keyboard',

  init: function (model) {
    this.model = model;
    var me = this;
    this.inherited(arguments);

    this.addToolbar({
      name: 'toolbarempty',
      buttons: []
    });
    this.addToolbar({
      name: 'toolbarother',
      buttons: [{
        command: 'allowvariableamount',
        definition: {
          action: function (keyboard, amt) {
            me.model.set('otherInput', OB.I18N.parseNumber(amt));
          }
        },
        label: OB.I18N.getLabel('OBPOS_LblOther'),
        holdActive: true
      }]
    });

    // CashPayments step.
    this.addToolbar({
      name: 'toolbarcashpayments',
      buttons: [{
        command: 'cashpayments',
        i18nLabel: 'OBPOS_SetQuantity',
        definition: {
          action: function (keyboard, amt) {
            keyboard.model.trigger('action:addUnitToCollection', {
              coin: keyboard.selectedCoin,
              amount: parseInt(amt, 10)
            });
          }
        }
      }, {
        command: 'resetallcoins',
        i18nLabel: 'OBPOS_ResetAllCoins',
        stateless: true,
        definition: {
          stateless: true,
          action: function (keyboard, amt) {
            keyboard.model.trigger('action:resetAllCoins');
          }
        }
      }, {
        command: 'opendrawer',
        i18nLabel: 'OBPOS_OpenDrawer',
        stateless: true,
        definition: {
          stateless: true,
          action: function (keyboard, amt) {
            if (OB.POS.modelterminal.hasPermission('OBPOS_approval.opendrawer')) {
              OB.UTIL.Approval.requestApproval(
              me.model, 'OBPOS_approval.opendrawer', function (approved, supervisor, approvalType) {
                if (approved) {
                  OB.POS.hwserver.openDrawer();
                }
              });
            }
          }
        }
      }]
    });
    this.model.on('action:SelectedCoin', function (coin) {
      this.setStatus('cashpayments');
      this.selectedCoin = coin;
    }, this);


    this.showToolbar('toolbarempty');

    this.model.get('paymentList').on('reset', function () {
      var buttons = [];
      this.model.get('paymentList').each(function (payment) {
        if (!payment.get('paymentMethod').iscash || !payment.get('paymentMethod').countcash) {
          buttons.push({
            command: payment.get('_id'),
            definition: {
              action: function (keyboard, amt) {
                var convAmt = OB.I18N.parseNumber(amt);
                payment.set('foreignCounted', OB.DEC.add(0, convAmt));
                payment.set('counted', OB.DEC.mul(convAmt, payment.get('rate')));
              }
            },
            label: payment.get('name')
          });
        }
      }, this);
      if (this.model.get('paymentList').length !== 0) {
        this.addToolbar({
          name: 'toolbarcountcash',
          buttons: buttons
        });
      }
    }, this);
  }

});