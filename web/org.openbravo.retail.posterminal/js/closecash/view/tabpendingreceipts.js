/*
 ************************************************************************************
 * Copyright (C) 2012-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo , _ */

enyo.kind({
  name: 'OB.OBPOSCashUp.UI.ButtonVoid',
  kind: 'OB.UI.Button',
  classes: 'obObposCashupUiButtonVoid',
  initComponents: function() {
    return this;
  }
});

enyo.kind({
  name: 'OB.OBPOSCashUp.UI.ButtonBring',
  kind: 'OB.UI.Button',
  classes: 'obObposCashupUiButtonBring',
  initComponents: function() {
    this.setContent(OB.I18N.getLabel('OBPOS_BringOrder'));
    return this;
  }
});

enyo.kind({
  name: 'OB.OBPOSCashUp.UI.DocumentNoAndBP',
  classes: 'obObposCashupUiDocumentNoAndBP',
  components: [
    {
      name: 'documentNo',
      classes: 'obObposCashupUiDocumentNoAndBP-documentNo'
    },
    {
      name: 'bp',
      classes: 'obObposCashupUiDocumentNoAndBP-bp'
    }
  ]
});

enyo.kind({
  name: 'OB.OBPOSCashUp.UI.GrossSessionUser',
  classes: 'obObposCashupUiGrossSessionUser',
  components: [
    {
      name: 'printGross',
      classes: 'obObposCashupUiGrossSessionUser-printGross'
    },
    {
      name: 'sessionUser',
      classes: 'obObposCashupUiGrossSessionUser-sessionUser'
    }
  ]
});

enyo.kind({
  name: 'OB.OBPOSCashUp.UI.InfoPendingReceipt',
  classes: 'obObposCashupUiInfoPendingReceipt',
  components: [
    {
      name: 'documentNoAndBP',
      classes: 'obObposCashupUiInfoPendingReceipt-documentNoAndBP',
      kind: 'OB.OBPOSCashUp.UI.DocumentNoAndBP'
    },
    {
      name: 'grossSessionUser',
      classes: 'obObposCashupUiInfoPendingReceipt-grossSessionUser',
      kind: 'OB.OBPOSCashUp.UI.GrossSessionUser'
    }
  ]
});

enyo.kind({
  name: 'OB.OBPOSCashUp.UI.RenderPendingReceiptLine',
  classes: 'obObposCashupUiRenderPendingReceiptLine',
  events: {
    onVoidOrder: '',
    onBringOrder: ''
  },
  components: [
    {
      classes: 'obObposCashupUiRenderPendingReceiptLine-container1',
      components: [
        {
          name: 'orderDate',
          classes:
            'obObposCashupUiRenderPendingReceiptLine-container1-orderDate'
        },
        {
          name: 'infoPendingReceipt',
          classes:
            'obObposCashupUiRenderPendingReceiptLine-container1-infoPendingReceipt',
          kind: 'OB.OBPOSCashUp.UI.InfoPendingReceipt'
        },
        {
          classes:
            'obObposCashupUiRenderPendingReceiptLine-container1-buttonBringContainer',
          name: 'buttonBringContainer',
          components: [
            {
              name: 'buttonBring',
              classes:
                'obObposCashupUiRenderPendingReceiptLine-buttonBringContainer-buttonBring',
              kind: 'OB.OBPOSCashUp.UI.ButtonBring',
              ontap: 'bringOrder'
            }
          ]
        },
        {
          classes:
            'obObposCashupUiRenderPendingReceiptLine-container1-container1',
          components: [
            {
              name: 'buttonVoid',
              classes:
                'obObposCashupUiRenderPendingReceiptLine-container1-container1-buttonVoid',
              kind: 'OB.OBPOSCashUp.UI.ButtonVoid',
              ontap: 'voidOrder'
            }
          ]
        }
      ]
    }
  ],
  create: function() {
    this.inherited(arguments);
    var me = this;
    this.$.orderDate.setContent(
      OB.I18N.formatHour(this.model.get('orderDate'))
    );
    this.$.infoPendingReceipt.$.documentNoAndBP.$.documentNo.setContent(
      this.model.get('documentNo')
    );
    this.$.infoPendingReceipt.$.documentNoAndBP.$.bp.setContent(
      this.model.get('bp').get('_identifier')
    );
    this.$.infoPendingReceipt.$.grossSessionUser.$.printGross.setContent(
      this.model.printGross()
    );
    if (this.model.get('session') === OB.MobileApp.model.get('session')) {
      this.$.buttonBringContainer.addClass('u-hideFromUI');
    } else {
      OB.Dal.find(
        OB.Model.User,
        {
          id: this.model.get('updatedBy')
        },
        function(user) {
          if (
            user.models.length > 0 &&
            !_.isUndefined(me.$.infoPendingReceipt) &&
            !_.isUndefined(me.$.infoPendingReceipt.$.grossSessionUser) &&
            !_.isUndefined(
              me.$.infoPendingReceipt.$.grossSessionUser.$.sessionUser
            )
          ) {
            me.$.infoPendingReceipt.$.grossSessionUser.$.sessionUser.setContent(
              user.models[0].get('name')
            );
          }
        }
      );
    }
  },
  voidOrder: function(inSender, inEvent) {
    var me = this;
    OB.UTIL.showConfirmation.display(
      OB.I18N.getLabel('OBPOS_ConfirmDeletion'),
      OB.I18N.getLabel('OBPOS_MsgConfirmDelete'),
      [
        {
          label: OB.I18N.getLabel('OBMOBC_LblCancel'),
          isDefaultAction: false
        },
        {
          label: OB.I18N.getLabel('OBPOS_LblYesDelete'),
          isConfirmButton: true,
          isDefaultAction: true,
          action: function() {
            me.doVoidOrder();
          }
        }
      ]
    );
  },
  bringOrder: function(inSender, inEvent) {
    var me = this,
      jsonOrder;
    OB.UTIL.showConfirmation.display(
      OB.I18N.getLabel('OBPOS_ConfirmBringOrder'),
      OB.I18N.getLabel('OBPOS_MsgConfirmBringOrder'),
      [
        {
          label: OB.I18N.getLabel('OBPOS_LblYesBring'),
          isConfirmButton: true,
          action: function() {
            jsonOrder = JSON.parse(me.model.get('json'));
            jsonOrder.session = OB.MobileApp.model.get('session');
            jsonOrder.createdBy = OB.MobileApp.model.usermodel.id;
            jsonOrder.updatedBy = OB.MobileApp.model.usermodel.id;
            me.model.set('json', JSON.stringify(jsonOrder));
            me.model.set('session', OB.MobileApp.model.get('session'));
            OB.Dal.save(me.model, null, null, false);
          }
        },
        {
          label: OB.I18N.getLabel('OBMOBC_LblCancel')
        }
      ]
    );
  }
});

enyo.kind({
  name: 'OB.OBPOSCashUp.UI.ListPendingReceipts',
  classes: 'obObposCashupUiListPendingReceipts',
  published: {
    collection: null
  },
  handlers: {
    onVoidOrder: 'voidOrder'
  },
  components: [
    {
      classes: 'obObposCashupUiListPendingReceipts-wrapper',
      components: [
        {
          classes: 'obObposCashupUiListPendingReceipts-wrapper-components',
          components: [
            {
              name: 'stepsheader',
              classes:
                'obObposCashupUiListPendingReceipts-wrapper-components-title',
              renderHeader: function(step, count) {
                this.setContent(
                  OB.I18N.getLabel('OBPOS_LblStepNumber', [step, count]) +
                    ' ' +
                    OB.I18N.getLabel('OBPOS_LblStepPendingOrders') +
                    OB.OBPOSCashUp.UI.CashUp.getTitleExtensions()
                );
              }
            },
            {
              name: 'rowDeleteAll',
              classes:
                'obObposCashupUiListPendingReceipts-wrapper-components-rowDeleteAll',
              components: [
                {
                  name: 'btnDeleteAll',
                  kind: 'OB.UI.Button',
                  classes:
                    'obObposCashupUiListPendingReceipts-wrapper-components-rowDeleteAll-btnDeleteAll',
                  i18nContent: 'OBPOS_DeleteAll',
                  ontap: 'voidAllPendingReceipts'
                },
                {
                  name: 'btnBringAll',
                  kind: 'OB.UI.Button',
                  classes:
                    'obObposCashupUiListPendingReceipts-wrapper-components-rowDeleteAll-btnBringAll',
                  i18nContent: 'OBPOS_BringAll',
                  ontap: 'bringAllPendingReceipts'
                }
              ]
            },
            {
              classes:
                'obObposCashupUiListPendingReceipts-wrapper-components-body',
              components: [
                {
                  name: 'pendingReceiptList',
                  classes:
                    'obObposCashupUiListPendingReceipts-wrapper-components-body-pendingReceiptList',
                  kind: 'OB.UI.Table',
                  renderLine: 'OB.OBPOSCashUp.UI.RenderPendingReceiptLine',
                  renderEmpty: 'OB.UI.RenderEmpty',
                  listStyle: 'list'
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  init: function(model) {
    this.model = model;
  },
  collectionChanged: function(oldCol) {
    this.$.pendingReceiptList.setCollection(this.collection);

    if (oldCol) {
      oldCol.off('remove add reset', this.receiptsChanged);
    }
    this.collection.on('remove add reset', this.receiptsChanged, this);
  },
  receiptsChanged: function() {
    var showBringBtn = false;
    if (this.collection.length === 0) {
      this.$.rowDeleteAll.hide();
    } else {
      this.$.rowDeleteAll.show();
      showBringBtn = _.find(this.collection.models, function(model) {
        return model.get('session') !== OB.MobileApp.model.get('session');
      });
      if (OB.UTIL.isNullOrUndefined(showBringBtn) || !showBringBtn) {
        this.$.btnBringAll.hide();
      }
    }
  },
  voidOrder: function(inSender, inEvent) {
    var me = this,
      model = inEvent.originator.model;

    if (OB.MobileApp.model.get('isMultiOrderState')) {
      if (OB.MobileApp.model.multiOrders.checkMultiOrderPayment()) {
        return;
      }
    }

    if (model.checkOrderPayment()) {
      return false;
    }

    OB.UTIL.Approval.requestApproval(
      this.model,
      'OBPOS_approval.cashupremovereceipts',
      function(approved, supervisor, approvalType) {
        if (approved) {
          // approved so remove the entry
          var callback = function() {
            me.collection.remove(model);
          };
          model.deleteOrder(me, callback);
        }
      }
    );
  },
  voidAllPendingReceipts: function(inSender, inEvent) {
    var me = this;
    OB.UTIL.showConfirmation.display(
      OB.I18N.getLabel('OBPOS_ConfirmDeletion'),
      OB.I18N.getLabel('OBPOS_cannotBeUndone'),
      [
        {
          label: OB.I18N.getLabel('OBMOBC_LblCancel'),
          isDefaultAction: false
        },
        {
          label: OB.I18N.getLabel('OBPOS_LblYesDelete'),
          isDefaultAction: true,
          isConfirmButton: true,
          action: function() {
            me.voidAllOrders();
          }
        }
      ]
    );
  },
  bringAllPendingReceipts: function(inSender, inEvent) {
    var me = this,
      jsonOrder;
    OB.UTIL.showConfirmation.display(
      OB.I18N.getLabel('OBPOS_ConfirmBringOrder'),
      OB.I18N.getLabel('OBPOS_cannotBeUndone'),
      [
        {
          label: OB.I18N.getLabel('OBPOS_LblYesBring'),
          isConfirmButton: true,
          action: function() {
            _.each(me.collection.models, function(model) {
              if (model.get('session') !== OB.MobileApp.model.get('session')) {
                jsonOrder = JSON.parse(model.get('json'));
                jsonOrder.session = OB.MobileApp.model.get('session');
                jsonOrder.createdBy = OB.MobileApp.model.usermodel.id;
                jsonOrder.updatedBy = OB.MobileApp.model.usermodel.id;
                model.set('json', JSON.stringify(jsonOrder));
                model.set('session', OB.MobileApp.model.get('session'));
                OB.Dal.save(model, null, null, false);
              }
            });
            me.$.btnBringAll.hide();
          }
        },
        {
          label: OB.I18N.getLabel('OBMOBC_LblCancel')
        }
      ]
    );
  },
  voidAllOrders: function(inSender, inEvent) {
    var me = this;

    if (OB.MobileApp.model.get('isMultiOrderState')) {
      if (OB.MobileApp.model.multiOrders.checkMultiOrderPayment()) {
        return;
      }
    }

    if (this.collection.checkOrderListPayment()) {
      return false;
    }

    function removeOneModel(model, collection) {
      if (collection.length === 0) {
        return;
      }
      var callback = function() {
        collection.remove(model);
        removeOneModel(collection.at(0), collection);
      };
      model.deleteOrder(me, callback);
    }

    OB.UTIL.Approval.requestApproval(
      this.model,
      'OBPOS_approval.cashupremovereceipts',
      function(approved, supervisor, approvalType) {
        if (approved) {
          removeOneModel(me.collection.at(0), me.collection);
        }
      }
    );
  },
  displayStep: function(model) {
    // this function is invoked when displayed.
    this.$.stepsheader.renderHeader(
      model.stepNumber('OB.CashUp.StepPendingOrders'),
      model.stepCount()
    );
  }
});
