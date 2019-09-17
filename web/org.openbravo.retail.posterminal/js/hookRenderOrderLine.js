/*
 ************************************************************************************
 * Copyright (C) 2018-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, _*/

OB.UTIL.HookManager.registerHook('OBPOS_RenderOrderLine', function(
  args,
  callbacks
) {
  if (OB.MobileApp.model.hasPermission('OBRDM_EnableDeliveryModes', true)) {
    var orderline = args.orderline.model,
      order = args.order,
      deliveryDate = orderline.get('obrdmDeliveryDate')
        ? orderline.get('obrdmDeliveryDate') instanceof Date
          ? orderline.get('obrdmDeliveryDate')
          : new Date(orderline.get('obrdmDeliveryDate'))
        : null,
      deliveryTime = orderline.get('obrdmDeliveryTime')
        ? orderline.get('obrdmDeliveryTime') instanceof Date
          ? orderline.get('obrdmDeliveryTime')
          : new Date(orderline.get('obrdmDeliveryTime'))
        : null,
      showDate =
        orderline.get('obrdmDeliveryMode') === 'PickupInStoreDate' ||
        orderline.get('obrdmDeliveryMode') === 'HomeDelivery',
      showTime = orderline.get('obrdmDeliveryMode') === 'HomeDelivery',
      deliveryName = orderline.get('nameDelivery')
        ? orderline.get('nameDelivery')
        : orderline.get('obrdmDeliveryMode')
        ? _.find(OB.MobileApp.model.get('deliveryModes'), function(dm) {
            return dm.id === orderline.get('obrdmDeliveryMode');
          }).name
        : null,
      isDeliveryService =
        orderline.get('product').get('productType') === 'S' &&
        orderline.get('product').get('obrdmIsdeliveryservice'),
      deliveryPaymentMode = OB.MobileApp.model.get('deliveryPaymentMode');

    if (
      orderline.get('obrdmDeliveryMode') &&
      deliveryName &&
      (orderline.get('obrdmDeliveryMode') !==
        order.get('obrdmDeliveryModeProperty') ||
        deliveryDate)
    ) {
      var currentDate, currentTime;

      if (!deliveryDate) {
        currentDate = new Date();
        currentDate.setHours(0);
        currentDate.setMinutes(0);
        currentDate.setSeconds(0);
      }

      if (!deliveryTime) {
        currentTime = new Date();
        currentTime.setSeconds(0);
      }

      args.orderline.createComponent({
        classes: 'obPosRenderOrderLine',
        components: [
          {
            content:
              '-- ' +
              OB.I18N.getLabel('OBRDM_DeliveryMode') +
              ': ' +
              deliveryName,
            classes: 'obPosRenderOrderLine-element1'
          },
          {
            content: showDate
              ? '-- ' +
                OB.I18N.getLabel('OBRDM_DeliveryDate') +
                ': ' +
                (deliveryDate
                  ? OB.I18N.formatDate(deliveryDate)
                  : OB.I18N.formatDate(currentDate))
              : '',
            classes: 'obPosRenderOrderLine-element2'
          },
          {
            content: showTime
              ? '-- ' +
                OB.I18N.getLabel('OBRDM_DeliveryTime') +
                ': ' +
                (deliveryTime
                  ? OB.I18N.formatHour(deliveryTime)
                  : OB.I18N.formatHour(currentTime))
              : '',
            classes: 'obPosRenderOrderLine-element3'
          }
        ]
      });
    }

    order.on('change:obrdmDeliveryModeProperty', function(model) {
      orderline.trigger('updateView');
    });

    if (
      orderline.has('obrdmAmttopayindelivery') &&
      isDeliveryService &&
      deliveryPaymentMode === 'PD'
    ) {
      var symbol = OB.MobileApp.model.get('terminal').symbol,
        symbolAtTheRight = OB.MobileApp.model.get('terminal')
          .currencySymbolAtTheRight;
      args.orderline.createComponent({
        classes: 'obPosRenderOrderLine-amtToPayInDelivery',
        components: [
          {
            content:
              '-- ' +
              OB.I18N.getLabel('OBRDM_AmtToPayInDeliveryLbl', [
                OB.I18N.formatCurrencyWithSymbol(
                  orderline.get('obrdmAmttopayindelivery'),
                  symbol,
                  symbolAtTheRight
                )
              ]),
            classes:
              'obPosRenderOrderLine-amtToPayInDelivery-orderlineCanbedelivered'
          }
        ],
        tap: function() {
          if (!OB.MobileApp.model.receipt.get('isEditable')) {
            return;
          }
          OB.UTIL.Approval.requestApproval(
            OB.MobileApp.view.$.containerWindow.getRoot().model,
            'OBRDM_ChangeDeliveryPaymentApproval',
            function(approved, supervisor, approvalType) {
              if (approved) {
                OB.MobileApp.view.$.containerWindow.getRoot().doShowPopup({
                  popup: 'OBRDM_UI_ModalChangeDeliveryAmount',
                  args: {
                    orderline: orderline
                  }
                });
              }
            }
          );
        }
      });
    }

    if (isDeliveryService) {
      args.orderline.$.serviceIcon.setSrc('img/iconShippingAddress.svg');
      args.orderline.$.serviceIcon.setClasses(
        'obPosRenderOrderLine-serviceIcon-isDeliveryService'
      );
    } else {
      args.orderline.$.serviceIcon.setSrc('img/iconService_ticketline.png');
      args.orderline.$.serviceIcon.setClasses(
        'obPosRenderOrderLine-serviceIcon-isNotDeliveryService'
      );
    }
    if (orderline.get('hasDeliveryServices')) {
      args.orderline.createComponent({
        kind: 'OBRDM.UI.ShowDeliveryServicesButton',
        name: 'showDeliveryServicesButton',
        classes: 'obPosRenderOrderLine-showDeliveryServicesButton'
      });
    }
  }
  OB.UTIL.HookManager.callbackExecutor(args, callbacks);
});

enyo.kind({
  kind: 'OB.UI.ShowServicesButton',
  name: 'OBRDM.UI.ShowDeliveryServicesButton',
  classes: 'obRdmUiShowDeliveryServicesButton',
  extraParams: {
    isDeliveryService: true
  },
  handlers: {
    onSetMultiSelected: 'setMultiSelected'
  },
  initComponents: function() {
    this.inherited(arguments);
    this.removeClass('obUiShowServicesButton_unreviewed');
    this.removeClass('obUiShowServicesButton_reviewed');
    if (this.owner.model.get('deliveryServiceProposed')) {
      this.addRemoveClass(
        'obRdmUiShowDeliveryServicesButton_unreviewed',
        false
      );
      this.addRemoveClass('obRdmUiShowDeliveryServicesButton_reviewed', true);
    } else {
      this.addRemoveClass('obRdmUiShowDeliveryServicesButton_unreviewed', true);
      this.addRemoveClass('obRdmUiShowDeliveryServicesButton_reviewed', false);
    }
    if (OB.MobileApp.model.get('serviceSearchMode')) {
      this.hide();
    }
  },
  tap: function(inSender, inEvent) {
    var orderline = this.owner.model,
      product = orderline.get('product');
    if (product) {
      this.addServicesFilter(orderline);
      orderline.set('deliveryServiceProposed', true);
      OB.MobileApp.model.receipt.save();
      return true;
    }
  },
  setMultiSelected: function(inSender, inEvent) {
    if (
      inEvent.models &&
      inEvent.models.length > 0 &&
      inEvent.models[0] instanceof OB.Model.OrderLine
    ) {
      if (inEvent.models.length > 1) {
        this.hide();
      } else {
        this.show();
      }
    }
  }
});

enyo.kind({
  kind: 'OB.UI.ModalAction',
  name: 'OBRDM.UI.ModalChangeDeliveryAmount',
  classes: 'obRdmUiModalChangeDeliveryAmount',
  executeOnShow: function() {
    this.$.bodyButtons.$.inputNewDeliveryAmount.setValue(
      this.args.orderline.get('obrdmAmttopayindelivery')
    );
  },
  bodyContent: {
    i18nContent: 'OBRDM_ChangeDeliveryAmountBody'
  },
  bodyButtons: {
    components: [
      {
        name: 'inputNewDeliveryAmount',
        kind: 'OB.UI.SearchInput',
        classes: 'obRdmUiModalChangeDeliveryAmount-inputNewDeliveryAmount'
      },
      {
        kind: 'OB.UI.ButtonApplyDeliveryAmount',
        classes: 'obRdmUiModalChangeDeliveryAmount-element1'
      }
    ]
  },
  initComponents: function() {
    this.header = OB.I18N.getLabel('OBRDM_ChangeDeliveryAmountTitle');
    this.inherited(arguments);
  }
});

enyo.kind({
  kind: 'OB.UI.ModalDialogButton',
  name: 'OB.UI.ButtonApplyDeliveryAmount',
  classes: 'ObUiButtonApplyDeliveryAmount',
  isDefaultAction: true,
  i18nContent: 'OBPOS_LblApplyButton',
  tap: function() {
    var amount,
      tmpAmount = this.owner.$.inputNewDeliveryAmount.getValue();
    try {
      if (!OB.I18N.isValidNumber(tmpAmount)) {
        OB.UTIL.showConfirmation.display(
          OB.I18N.getLabel('OBPOS_notValidInput_header'),
          OB.I18N.getLabel('OBPOS_notValidQty')
        );
        return;
      } else {
        while (tmpAmount.indexOf(OB.Format.defaultGroupingSymbol) !== -1) {
          tmpAmount = tmpAmount.replace(OB.Format.defaultGroupingSymbol, '');
        }
        amount = OB.I18N.parseNumber(tmpAmount);
      }
    } catch (ex) {
      OB.UTIL.showConfirmation.display(
        OB.I18N.getLabel('OBPOS_notValidInput_header'),
        OB.I18N.getLabel('OBPOS_notValidQty')
      );
      return;
    }
    if (_.isNaN(amount)) {
      //Reset delivery amount to the backup value stored in the line
      this.owner.owner.args.orderline.set(
        'obrdmAmttopayindelivery',
        this.owner.owner.args.orderline.get('baseAmountToPayInDeliver')
      );
      this.doHideThisPopup();
    } else if (amount < 0) {
      OB.UTIL.showConfirmation.display(
        OB.I18N.getLabel('OBPOS_notValidInput_header'),
        OB.I18N.getLabel('OBPOS_amtGreaterThanZero')
      );
    } else {
      var decimalAmount = OB.DEC.toBigDecimal(amount);
      if (decimalAmount.scale() > OB.DEC.getScale()) {
        OB.UTIL.showConfirmation.display(
          OB.I18N.getLabel('OBPOS_notValidInput_header'),
          OB.I18N.getLabel('OBPOS_NotValidCurrencyAmount', [amount])
        );
        return;
      } else {
        this.owner.owner.args.orderline.set('obrdmAmttopayindelivery', amount);
        this.doHideThisPopup();
      }
    }
  },
  init: function(model) {
    this.model = model;
  }
});

OB.UI.WindowView.registerPopup('OB.OBPOSPointOfSale.UI.PointOfSale', {
  kind: 'OBRDM.UI.ModalChangeDeliveryAmount',
  name: 'OBRDM_UI_ModalChangeDeliveryAmount'
});
