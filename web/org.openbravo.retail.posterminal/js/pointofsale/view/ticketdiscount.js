/*
 ************************************************************************************
 * Copyright (C) 2012-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, enyo, Backbone, _*/
enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.Discounts',
  classes: 'obObposPointOfSaleUiDiscounts',
  handlers: {
    onApplyDiscounts: 'applyDiscounts',
    onDiscountsClose: 'closingDiscounts',
    onDiscountChanged: 'discountChanged',
    onDiscountQtyChanged: 'discountQtyChanged',
    onCheckedTicketLine: 'ticketLineChecked'
  },
  events: {
    onDiscountsModeFinished: '',
    onDisableKeyboard: '',
    onDiscountsModeKeyboard: '',
    onShowPopup: '',
    onCheckAllTicketLines: ''
  },
  checkedLines: [],
  components: [
    {
      kind: 'Scroller',
      classes: 'obObposPointOfSaleUiDiscounts-scroller',
      thumb: true,
      components: [
        {
          kind: 'OB.UI.FormElement',
          name: 'formElementDiscountsList',
          classes:
            'obUiFormElement_dataEntry obUiFormElement_dataEntry_noicon obObposPointOfSaleUiDiscounts-scroller-formElementDiscountsList',
          coreElement: {
            kind: 'OB.UI.DiscountList',
            name: 'discountsList',
            i18nLabel: 'OBPOS_LineDiscount',
            classes:
              'obObposPointOfSaleUiDiscounts-scroller-formElementDiscountsList-discountsList'
          }
        },
        {
          kind: 'OB.UI.FormElement',
          name: 'formElementCheckOverride',
          classes:
            'obUiFormElement_dataEntry obUiFormElement_dataEntry_noicon obObposPointOfSaleUiDiscounts-scroller-formElementCheckOverride',
          coreElement: {
            kind: 'OB.OBPOSPointOfSale.UI.Discounts.btnCheckOverride',
            name: 'checkOverride',
            i18nLabel: 'OBPOS_overridePromotions',
            classes:
              'obObposPointOfSaleUiDiscounts-scroller-formElementCheckOverride-checkOverride'
          }
        },
        {
          kind: 'OB.UI.FormElement',
          name: 'formElementCheckSelectAll',
          classes:
            'obUiFormElement_dataEntry obUiFormElement_dataEntry_noicon obObposPointOfSaleUiDiscounts-scroller-formElementCheckSelectAll',
          coreElement: {
            kind: 'OB.OBPOSPointOfSale.UI.Discounts.btnCheckAll',
            name: 'checkSelectAll',
            i18nLabel: 'OBPOS_applyToAllLines',
            classes:
              'obObposPointOfSaleUiDiscounts-scroller-formElementCheckSelectAll-checkSelectAll'
          }
        }
      ]
    },
    {
      classes: 'obObposPointOfSaleUiDiscounts-buttons',
      components: [
        {
          kind: 'OB.OBPOSPointOfSale.UI.Discounts.btnDiscountsApply',
          name: 'btnApply',
          classes: 'obObposPointOfSaleUiDiscounts-buttons-btnApply'
        },
        {
          kind: 'OB.OBPOSPointOfSale.UI.Discounts.btnDiscountsCancel',
          classes:
            'obObposPointOfSaleUiDiscounts-buttons-obObposPointOfSaleUiBtnDiscountsCancel'
        }
      ]
    }
  ],
  show: function() {
    var me = this;
    me.$.btnApply.setDisabled(true);
    me.discounts.reset();
    me.order.trigger('showDiscount');
    //uncheck lines
    this.doCheckAllTicketLines({
      status: false
    });
    //load discounts
    OB.Dal.find(
      OB.Model.Discount,
      {
        _whereClause:
          'where m_offer_type_id in (' +
          OB.Model.Discounts.getManualPromotions() +
          ") AND date('now') BETWEEN DATEFROM AND COALESCE(date(DATETO), date('9999-12-31'))" +
          // filter by order price list
          ' AND (' +
          " (pricelist_selection = 'Y' AND NOT EXISTS " + //
          " (SELECT 1 FROM m_offer_pricelist opl WHERE m_offer.m_offer_id = opl.m_offer_id AND opl.m_pricelist_id = '" +
          me.order.get('priceList') +
          "'))" + //
          " OR (pricelist_selection = 'N' AND EXISTS " + //
          " (SELECT 1 FROM m_offer_pricelist opl WHERE m_offer.m_offer_id = opl.m_offer_id AND opl.m_pricelist_id = '" +
          me.order.get('priceList') +
          "')))" + //
          // filter discretionary discounts by current role
          " AND ((EM_OBDISC_ROLE_SELECTION = 'Y'" + //
          ' AND NOT EXISTS' + //
          ' (SELECT 1' + //
          ' FROM OBDISC_OFFER_ROLE' + //
          ' WHERE M_OFFER_ID = M_OFFER.M_OFFER_ID' + //
          "   AND AD_ROLE_ID = '" +
          OB.MobileApp.model.get('context').role.id +
          "'" + //
          ' ))' + //
          " OR (EM_OBDISC_ROLE_SELECTION = 'N'" + //
          ' AND EXISTS' + //
          ' (SELECT 1' + //
          ' FROM OBDISC_OFFER_ROLE' + //
          ' WHERE M_OFFER_ID = M_OFFER.M_OFFER_ID' + //
          "   AND AD_ROLE_ID = '" +
          OB.MobileApp.model.get('context').role.id +
          "'" + //
          ' )))' //
      },
      function(promos) {
        promos.comparator = function(model) {
          return model.get('_identifier');
        };
        promos.sort();
        me.discounts.reset(promos.models);
        if (
          OB.MobileApp.model.hasPermission('OBPOS_AutoSelectDiscounts', true)
        ) {
          var selectedModels = OB.MobileApp.view.$.containerWindow.getRoot().$
              .multiColumn.$.rightPanel.$.keyboard.selectedModels,
            i;
          for (i = 0; i < selectedModels.length; i++) {
            selectedModels[i].trigger('check');
          }
        } else {
          me.ticketLineChecked(
            {},
            {
              checkedLines: me.checkedLines
            }
          );
        }
        //set the keyboard for selected discount
        if (promos.length > 0) {
          var model = promos.at(0);
          var rule =
            OB.Model.Discounts.discountRules[model.get('discountType')];
          var amt = 0;
          var requiresQty = !rule.isFixed; // If fixed discount, no requires qty
          var units;
          if (rule.isAmount) {
            amt = model.get('disctTotalamountdisc')
              ? model.get('disctTotalamountdisc')
              : model.get('obdiscAmt');
            units = OB.MobileApp.model.get('terminal').currency$_identifier;
          } else {
            amt = model.get('disctTotalpercdisc')
              ? model.get('disctTotalpercdisc')
              : model.get('obdiscPercentage');
            units = '%';
          }

          me.discountChanged(
            {},
            {
              originator: me.$.formElementDiscountsList.coreElement,
              model: model,
              amt: amt,
              requiresQty: requiresQty,
              units: units
            }
          );
        }
      },
      function() {
        //show an error in combo
        var tr;
        me.discounts.reset();
        tr = me.$.formElementDiscountsList.coreElement.createComponent({
          kind: 'OB.UI.FormElement.Select.Option',
          text: OB.I18N.getLabel('OBPOS_errorGettingDiscounts'),
          value: 'error',
          initComponents: function() {
            this.setValue(this.value);
            this.setContent(this.text);
          }
        });
        tr.render();
        if (
          OB.MobileApp.model.hasPermission('OBPOS_AutoSelectDiscounts', true)
        ) {
          var selectedModels = OB.MobileApp.view.$.containerWindow.getRoot().$
              .multiColumn.$.rightPanel.$.keyboard.selectedModels,
            i;
          for (i = 0; i < selectedModels.length; i++) {
            selectedModels[i].trigger('check');
          }
        } else {
          me.ticketLineChecked(
            {},
            {
              checkedLines: me.checkedLines
            }
          );
        }
      }
    );
    this.inherited(arguments);
  },
  disableKeyboard: function() {
    this.doDiscountsModeKeyboard({
      status: true,
      writable: false
    });
  },
  enableKeyboard: function() {
    this.doDiscountsModeKeyboard({
      status: true,
      writable: true
    });
  },
  _searchSelectedComponent: function(selectedId) {
    return _.find(
      this.$.formElementDiscountsList.coreElement.getComponents(),
      function(comp) {
        if (comp.getValue() === selectedId) {
          return true;
        }
      },
      this
    );
  },
  discountQtyChanged: function(inSender, inEvent) {
    if (!OB.DEC.isNumber(inEvent.qty)) {
      this.doShowPopup({
        popup: 'modalNotValidValueForDiscount'
      });
      return;
    }
    var comp = this._searchSelectedComponent(
      this.$.formElementDiscountsList.coreElement.getValue()
    );
    if (comp.units === '%' && OB.DEC.toBigDecimal(inEvent.qty) > 100) {
      this.doShowPopup({
        popup: 'modalNotValidValueForDiscount'
      });
      return;
    }
    comp.setContent(comp.originalText + ' - ' + inEvent.qty + ' ' + comp.units);
    this.$.formElementDiscountsList.amt = inEvent.qty;
  },
  initComponents: function() {
    var discountsModel = Backbone.Collection.extend({
      model: OB.Model.Discounts
    });
    this.inherited(arguments);

    this.discounts = new discountsModel();
    this.$.formElementDiscountsList.coreElement.setCollection(this.discounts);
  },
  ticketLineChecked: function(inSender, inEvent) {
    var activateButton = false;
    if (inEvent.allChecked) {
      this.$.formElementCheckSelectAll.coreElement.check();
    } else {
      this.$.formElementCheckSelectAll.coreElement.unCheck();
    }
    this.checkedLines = inEvent.checkedLines;

    _.forEach(this.checkedLines, function(checkedLine) {
      if (!checkedLine.get('noDiscountAllow')) {
        activateButton = true;
      }
    });
    if (
      this.checkedLines.length > 0 &&
      this.discounts.length !== 0 &&
      activateButton
    ) {
      this.$.btnApply.setDisabled(false);
      this.$.btnApply.addClass(
        '.obObposPointOfSaleUiDiscounts-buttons-btnApply_activate'
      );
    } else {
      this.$.btnApply.setDisabled(true);
      this.$.btnApply.addClass(
        '.obObposPointOfSaleUiDiscounts-buttons-btnApply_desactivate'
      );
    }
  },
  discountChanged: function(inSender, inEvent) {
    // Build discount container info
    var formElementDiscountsList = this.$.formElementDiscountsList;
    formElementDiscountsList.model = inEvent.model;
    formElementDiscountsList.requiresQty = inEvent.requiresQty;
    formElementDiscountsList.amt = inEvent.amt;
    formElementDiscountsList.units = inEvent.units;

    // Disable keyboard if rule is fixed, otherwise, enable keyboard
    if (
      OB.Model.Discounts.discountRules[inEvent.model.get('discountType')]
        .isFixed
    ) {
      this.disableKeyboard();
    } else {
      this.enableKeyboard();
    }

    OB.UTIL.HookManager.executeHooks(
      'OBPOS_preDiscountChangeHook',
      {
        context: this,
        formElementDiscountsList: formElementDiscountsList,
        inEvent: inEvent,
        hideLineSelectionOptions: false
      },
      function(args) {
        if (args && args.cancelOperation) {
          return;
        }
        if (
          OB.UTIL.isNullOrUndefined(args.formElementDiscountsList) ||
          OB.UTIL.isNullOrUndefined(args.formElementDiscountsList.model)
        ) {
          // Mandatory infornation
          OB.UTIL.showError(
            'Critical discount information is missing: ' +
              (args.formElementDiscountsList
                ? 'Discount model'
                : 'Discount Container')
          );
        } else if (
          OB.UTIL.isNullOrUndefined(args.formElementDiscountsList.amt) ||
          OB.UTIL.isNullOrUndefined(args.formElementDiscountsList.units)
        ) {
          // Without this information, the discounts could not be applied
          OB.UTIL.showWarning(
            'Some discount information is missing, the promotion could not be applied: ' +
              (args.formElementDiscountsList.amt
                ? 'Discount units'
                : 'Discount amount')
          );
        }
        if (args.hideLineSelectionOptions) {
          args.context.$.formElementCheckSelectAll.hide();
          args.context.order.get('lines').trigger('hideAllCheckBtn');
          args.context.$.btnApply.setDisabled(false);
          args.context.$.btnApply.addClass(
            '.obObposPointOfSaleUiDiscounts-buttons-btnApply_activate'
          );
        } else {
          args.context.$.formElementCheckSelectAll.show();
          args.context.order.get('lines').trigger('showAllCheckBtn');

          if (
            args.context.checkedLines.length > 0 &&
            ((!OB.UTIL.isNullOrUndefined(args.context.discounts) &&
              args.context.discounts.length !== 0) ||
              (!OB.UTIL.isNullOrUndefined(args.formElementDiscountsList) &&
                !OB.UTIL.isNullOrUndefined(
                  args.formElementDiscountsList.model
                )))
          ) {
            args.context.$.btnApply.setDisabled(false);
            args.context.$.btnApply.addClass(
              '.obObposPointOfSaleUiDiscounts-buttons-btnApply_activate'
            );
          } else {
            args.context.$.btnApply.setDisabled(true);
            args.context.$.btnApply.addClass(
              '.obObposPointOfSaleUiDiscounts-buttons-btnApply_desactivate'
            );
          }
        }
        if (discountsContainer.model.get('obdiscAllowmultipleinstan')) {
          args.context.$.overridePromotion.hide();
          args.context.$.checkOverride.unCheck();
        } else {
          args.context.$.overridePromotion.show();
        }
      }
    );
  },
  closingDiscounts: function(inSender, inEvent) {
    OB.MobileApp.view.scanningFocus(true);
    this.$.formElementCheckSelectAll.coreElement.unCheck();
    this.setShowing(false);
    this.doDiscountsModeFinished({
      tabPanel: 'scan',
      keyboard: 'toolbarscan',
      edit: false,
      options: {
        discounts: false
      }
    });
  },
  applyDiscounts: function(inSender, inEvent) {
    var promotionToApply = {},
      formElementDiscountsList = this.$.formElementDiscountsList,
      orderLinesCollection = new OB.Collection.OrderLineList(),
      me = this;
    //preApplyDiscountsHook
    OB.UTIL.HookManager.executeHooks(
      'OBPOS_preApplyDiscountsHook',
      {
        context: this
      },
      function(args) {
        if (args && args.cancelOperation) {
          me.closingDiscounts();
          return;
        }
        if (!me.$.overridePromotion.showing) {
          me.$.checkOverride.unCheck();
        }
        promotionToApply.rule = formElementDiscountsList.model;
        promotionToApply.definition = {};
        promotionToApply.definition.userAmt = formElementDiscountsList.amt;
        promotionToApply.definition.applyNext = !me.$.formElementCheckOverride.coreElement.getChecked();
        promotionToApply.definition.lastApplied = true;
        promotionToApply.definition.obdiscLineFinalgross =
          formElementDiscountsList.amt;

        if (
          formElementDiscountsList.requiresQty &&
          !formElementDiscountsList.amt
        ) {
          //Show a modal pop up with the error
          me.doShowPopup({
            popup: 'modalDiscountNeedQty'
          });
          return true;
        }
        _.each(me.checkedLines, function(line) {
          orderLinesCollection.add(line);
        });

        OB.Model.Discounts.addManualPromotion(
          me.order,
          orderLinesCollection,
          promotionToApply
        );

        me.closingDiscounts();
      }
    );
  },
  init: function(model) {
    this.order = model.get('order');
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.Discounts.btnDiscountsApply',
  kind: 'OB.UI.ModalDialogButton',
  classes: 'obObposPointOfSaleUiDiscountsBtnDiscountsApply',
  i18nLabel: 'OBMOBC_LblApply',
  events: {
    onApplyDiscounts: ''
  },
  tap: function() {
    this.doApplyDiscounts();
  },
  initComponents: function() {
    this.inherited(arguments);
    this.setDisabled(true);
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.Discounts.btnCheckAll',
  kind: 'OB.UI.FormElement.Checkbox',
  classes: 'obObposPointOfSaleUiDiscountsBtnCheckAll',
  events: {
    onCheckAllTicketLines: ''
  },
  checked: false,
  tap: function() {
    this.inherited(arguments);
    this.doCheckAllTicketLines({
      status: this.checked
    });
  }
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.Discounts.btnCheckOverride',
  kind: 'OB.UI.FormElement.Checkbox',
  classes: 'obObposPointOfSaleUiDiscountsBtnCheckOverride',
  checked: false
});

enyo.kind({
  name: 'OB.OBPOSPointOfSale.UI.Discounts.btnDiscountsCancel',
  kind: 'OB.UI.ModalDialogButton',
  classes: 'obObposPointOfSaleUiDiscountsBtnDiscountsCancel',
  events: {
    onDiscountsClose: ''
  },
  i18nContent: 'OBMOBC_LblCancel',
  tap: function() {
    this.doDiscountsClose();
  }
});

enyo.kind({
  name: 'OB.UI.DiscountList',
  kind: 'OB.UI.List',
  handlers: {
    onchange: 'changeDiscount'
  },
  classes: 'obUiDiscountList',
  renderEmpty: enyo.Control,
  renderLine: 'OB.UI.DiscountList.Options',
  initComponents: function() {
    this.inherited(arguments);
  },
  changeDiscount: function() {
    var model = this.collection.at(this.getSelected());
    var rule = OB.Model.Discounts.discountRules[model.get('discountType')];
    var amt = 0;
    var requiresQty = !rule.isFixed; // If fixed discount, no requires qty
    var units;
    if (rule.isAmount) {
      amt = model.get('disctTotalamountdisc')
        ? model.get('disctTotalamountdisc')
        : model.get('obdiscAmt');
      units = OB.MobileApp.model.get('terminal').currency$_identifier;
    } else {
      amt = model.get('disctTotalpercdisc')
        ? model.get('disctTotalpercdisc')
        : model.get('obdiscPercentage');
      units = '%';
    }

    this.formElement.owner.discountChanged(
      {},
      {
        originator: this,
        model: model,
        amt: amt,
        requiresQty: requiresQty,
        units: units
      }
    );
  }
});

enyo.kind({
  kind: 'OB.UI.FormElement.Select.Option',
  name: 'OB.UI.DiscountList.Options',
  classses: 'obUiDiscountListOptions',
  initComponents: function() {
    var rule = OB.Model.Discounts.discountRules[this.model.get('discountType')],
      propertyToShow = '';
    if (rule.getAmountProperty && rule.getAmountProperty instanceof Function) {
      propertyToShow = OB.Model.Discounts.discountRules[
        this.model.get('discountType')
      ].getAmountProperty();
    }
    this.setValue(this.model.get('id'));
    this.originalText = this.model.get('_identifier');
    // TODO: this shouldn't be hardcoded but defined in each promotion
    if (
      !OB.Model.Discounts.discountRules[this.model.get('discountType')].isFixed
    ) {
      //variable
      this.requiresQty = true;
      if (
        !OB.Model.Discounts.discountRules[this.model.get('discountType')]
          .isAmount
      ) {
        //variable porcentaje
        this.units = '%';
        if (
          !_.isUndefined(this.model.get(propertyToShow)) &&
          !_.isNull(this.model.get(propertyToShow))
        ) {
          this.amt = this.model.get(propertyToShow);
        }
      } else {
        //variable qty
        this.units = OB.MobileApp.model.get('terminal').currency$_identifier;
        if (this.model.get(propertyToShow)) {
          this.amt = this.model.get(propertyToShow);
        }
      }
    } else {
      //fixed
      this.requiresQty = false;
      if (
        !OB.Model.Discounts.discountRules[this.model.get('discountType')]
          .isAmount
      ) {
        //fixed percentage
        this.units = '%';
        if (
          !_.isUndefined(this.model.get(propertyToShow)) &&
          !_.isNull(this.model.get(propertyToShow))
        ) {
          this.amt = this.model.get(propertyToShow);
        }
      } else {
        //fixed amount
        this.units = OB.MobileApp.model.get('terminal').currency$_identifier;
        if (
          !_.isUndefined(this.model.get(propertyToShow)) &&
          !_.isNull(this.model.get(propertyToShow))
        ) {
          this.amt = this.model.get(propertyToShow);
        }
      }
    }
    if (this.amt) {
      this.setContent(this.originalText + ' - ' + this.amt + ' ' + this.units);
    } else {
      this.setContent(this.originalText);
    }
  }
});
