/*global OB, enyo*/

/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

enyo.kind({
  name: 'OB.OBPOSCashUp.UI.CashUp',
  kind: 'OB.UI.WindowView',
  windowmodel: OB.OBPOSCashUp.Model.CashUp,
  handlers: {
    //onNext: 'nextStep',
    //onPrev: 'prevStep',
    onButtonOk: 'buttonOk',
    onTapRadio: 'tapRadio',
    onChangeStep: 'changeStep'
  },
  changeStep: function (inSender, inEvent) {
    this.log(inEvent.originator.name);
  },
  tapRadio: function (inSender, inEvent) {
//    if (inEvent.originator.name === 'allowvariableamount') {
//      //      FIXME: Put focus on the input
//      //      this.$.cashToKeep.$.variableamount.focus();
//    }
    this.$.cashUpInfo.$.buttonNext.setDisabled(false);
  },
  buttonOk: function (inSender, inEvent) {
    //    $('button[button*="allokbutton"]').css('visibility','hidden');
    //    var elem = this.me.options.modeldaycash.paymentmethods.get(this.options[this._id].rowid);
    //    this.options['counted_'+this.options[this._id].rowid].$el.text(OB.I18N.formatCurrency(elem.get('expected')));
    //    elem.set('counted',OB.DEC.add(0,elem.get('expected')));
    //    this.me.options.modeldaycash.set('totalCounted',OB.DEC.add(this.me.options.modeldaycash.get('totalCounted'),elem.get('counted')));
    //    this.options['counted_'+this.rowid].$el.show();
    //    if($('button[button="okbutton"][style!="display: none; "]').length===0){
    //      this.me.options.closenextbutton.$el.removeAttr('disabled');
    //    }
  },
  prevStep: function (inSender, inEvent) {
    var found = false;
    if (this.model.get('step') === 3 || this.model.get('step') === 2) {
      //Count Cash back from Post, print & Close.
      if (this.model.get('step') === 2) {
        this.model.set('allowedStep', this.model.get('allowedStep') - 1);
      } else {
        this.model.set('step', 2);
      }
      found = false;
      this.$.cashUpInfo.$.buttonNext.setDisabled(true);
      $(".active").removeClass("active");
      //Count Cash to Cash to keep or Cash to keep to Cash to keep
      if ($(".active").length === 0) {
        this.$.cashToKeep.show();
        this.$.postPrintClose.hide();
        this.$.cashUpInfo.$.buttonNext.setContent(OB.I18N.getLabel('OBPOS_LblNextStep'));
      }
      while (this.model.get('allowedStep') >= 0) {

        //FIXME:Delete this line when Step 2 works well
        this.model.payList.at(this.model.get('allowedStep')).set('counted', 0);


        if (this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').automatemovementtoother) {
          found = true;
          $('#cashtokeepheader').text(OB.I18N.getLabel('OBPOS_LblStep3of4', [this.model.payList.at(this.model.get('allowedStep')).get('name')]));
          if (this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').keepfixedamount) {
            if (!this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').amount) {
              this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').amount = 0;
            }
            if (this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').amount > this.model.payList.at(this.model.get('allowedStep')).get('counted')) {
              this.$.cashToKeep.$.keepfixedamount.setContent(OB.I18N.formatCurrency(this.model.payList.at(this.model.get('allowedStep')).get('counted')));
              this.$.cashToKeep.$.keepfixedamount.value = this.model.payList.at(this.model.get('allowedStep')).get('counted');
            } else {
              this.$.cashToKeep.$.keepfixedamount.setContent(OB.I18N.formatCurrency(this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').amount));
              this.$.cashToKeep.$.keepfixedamount.value = this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').amount;
            }
            this.$.cashToKeep.$.keepfixedamount.show();
          } else {
            this.$.cashToKeep.$.keepfixedamount.hide();
          }
          if (this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').allowmoveeverything) {
            this.$.cashToKeep.$.allowmoveeverything.value = 0;
            this.$.cashToKeep.$.allowmoveeverything.setContent(OB.I18N.getLabel('OBPOS_LblNothing'));
            this.$.cashToKeep.$.allowmoveeverything.show();
          } else {
            this.$.cashToKeep.$.allowmoveeverything.hide();
          }
          if (this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').allowdontmove) {
            this.$.cashToKeep.$.allowdontmove.value = this.model.payList.at(this.model.get('allowedStep')).get('counted');
            this.$.cashToKeep.$.allowdontmove.setContent(OB.I18N.getLabel('OBPOS_LblTotalAmount') + ' ' + OB.I18N.formatCurrency(OB.DEC.add(0, this.model.payList.at(this.model.get('allowedStep')).get('counted'))));
            this.$.cashToKeep.$.allowdontmove.show();
          } else {
            this.$.cashToKeep.$.allowdontmove.hide();
          }
          if (this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').allowvariableamount) {
            this.$.cashToKeep.$.allowvariableamount.setContent(OB.I18N.getLabel('OBPOS_LblOther'));
            this.$.cashToKeep.$.allowvariableamount.show();
            this.$.cashToKeep.$.variableamount.show();
            this.$.cashToKeep.$.variableamount.value = '';
          } else {
            this.$.cashToKeep.$.allowvariableamount.hide();
            this.$.cashToKeep.$.variableamount.hide();
          }
          break;
        }
        this.model.set('allowedStep', this.model.get('allowedStep') - 1);
      }
      if (found === false) {
        this.$.listPaymentMethods.show();
        this.$.cashToKeep.hide();
        this.$.cashUpKeyboard.showToolbar('toolbarcountcash');
        this.model.set('step', 1);
        this.model.set('allowedStep', 0);
        this.$.cashUpInfo.$.buttonNext.setDisabled(false);
      }
    } else if (this.model.get('step') === 1) {
      //Pending receipts back from Count Cash.
      this.$.listPendingReceipts.show();
      this.$.listPaymentMethods.hide();
      this.$.cashUpInfo.$.buttonPrev.setDisabled(true);
      this.$.cashUpInfo.$.buttonNext.setDisabled(false);
      this.$.cashUpKeyboard.showToolbar('toolbarempty');
      this.model.set('step', 0);
      //    if($('button[button="okbutton"][style!="display: none; "]').length!==0){
      //      this.$el.attr('disabled','disabled');
      //    }
    }
  },
  nextStep: function (inSender, inEvent) {
    var found = false;
    if (this.model.get('step') === 0) {
      this.$.listPendingReceipts.hide();
      this.$.listPaymentMethods.show();
      this.$.cashUpInfo.$.buttonPrev.setDisabled(false);
      this.$.cashUpKeyboard.showToolbar('toolbarcountcash');
      this.model.set('step', this.model.get('step') + 1);
      //show toolbarcountcash
      //      if($('button[button="okbutton"][style!="display: none; "]').length!==0){
      //        this.$el.attr('disabled','disabled');
      //      }
    } else if (this.model.get('step') === 1 || this.model.get('step') === 2) {
      found = false;
      if (this.model.get('step') === 2) {
        this.model.set('allowedStep', this.model.get('allowedStep') + 1);
      }
      this.$.cashUpInfo.$.buttonNext.setDisabled(true);
      this.model.set('step', 2);
      //Count Cash to Cash to keep or Cash to keep to Cash to keep
      if ($(".active").length > 0 && this.model.get('allowedStep') !== 0) {
        if ($('.active').text() === "") { //Variable Amount
          if (this.$.cashToKeep.$.variableamount.value === '') {
            this.model.payList.at(this.model.get('allowedStep') - 1).get('paymentMethod').amountToKeep = 0;
          } else {
            if (OB.I18N.parseNumber(this.$.cashToKeep.$.variableamount.value) <= this.model.payList.at(this.model.get('allowedStep') - 1).get('counted')) {
              this.model.payList.at(this.model.get('allowedStep') - 1).get('paymentMethod').amountToKeep = OB.I18N.parseNumber(this.$.cashToKeep.$.variableamount.value);
            } else {
              OB.UTIL.showError(OB.I18N.getLabel('OBPOS_MsgMoreThanCounted'));
              this.model.set('allowedStep', this.model.get('allowedStep') - 1);
              this.$.cashUpInfo.$.buttonNext.setDisabled(false);
              return true;
            }
          }
        } else {
          this.model.payList.at(this.model.get('allowedStep') - 1).get('paymentMethod').amountToKeep = OB.I18N.parseNumber($('.active').text());
        }
        $(".active").removeClass("active");
      }
      while (this.model.get('allowedStep') < this.model.payList.length) {
        //FIXME:Delete this line when Step 2 works well
        this.model.payList.at(this.model.get('allowedStep')).set('counted', 0);


        if (this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').automatemovementtoother) {
          found = true;
          $('#cashtokeepheader').text(OB.I18N.getLabel('OBPOS_LblStep3of4', [this.model.payList.at(this.model.get('allowedStep')).get('name')]));
          if (this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').keepfixedamount) {
            if (!this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').amount) {
              this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').amount = 0;
            }
            if (this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').amount > this.model.payList.at(this.model.get('allowedStep')).get('counted')) {
              this.$.cashToKeep.$.keepfixedamount.setContent(OB.I18N.formatCurrency(this.model.payList.at(this.model.get('allowedStep')).get('counted')));
              this.$.cashToKeep.$.keepfixedamount.value = this.model.payList.at(this.model.get('allowedStep')).get('counted');
            } else {
              this.$.cashToKeep.$.keepfixedamount.setContent(OB.I18N.formatCurrency(this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').amount));
              this.$.cashToKeep.$.keepfixedamount.value = this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').amount;
            }
            this.$.cashToKeep.$.keepfixedamount.show();
          } else {
            this.$.cashToKeep.$.keepfixedamount.hide();
          }
          if (this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').allowmoveeverything) {
            this.$.cashToKeep.$.allowmoveeverything.value = 0;
            this.$.cashToKeep.$.allowmoveeverything.setContent(OB.I18N.getLabel('OBPOS_LblNothing'));
            this.$.cashToKeep.$.allowmoveeverything.show();
          } else {
            this.$.cashToKeep.$.allowmoveeverything.hide();
          }
          if (this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').allowdontmove) {
            this.$.cashToKeep.$.allowdontmove.value = this.model.payList.at(this.model.get('allowedStep')).get('counted');
            this.$.cashToKeep.$.allowdontmove.setContent(OB.I18N.getLabel('OBPOS_LblTotalAmount') + ' ' + OB.I18N.formatCurrency(OB.DEC.add(0, this.model.payList.at(this.model.get('allowedStep')).get('counted'))));
            this.$.cashToKeep.$.allowdontmove.show();
          } else {
            this.$.cashToKeep.$.allowdontmove.hide();
          }
          if (this.model.payList.at(this.model.get('allowedStep')).get('paymentMethod').allowvariableamount) {
            this.$.cashToKeep.$.allowvariableamount.setContent(OB.I18N.getLabel('OBPOS_LblOther'));
            this.$.cashToKeep.$.allowvariableamount.show();
            this.$.cashToKeep.$.variableamount.show();
            this.$.cashToKeep.$.variableamount.value = '';
          } else {
            this.$.cashToKeep.$.allowvariableamount.hide();
            this.$.cashToKeep.$.variableamount.hide();
          }
          break;
        }
        this.model.set('allowedStep', this.model.get('allowedStep') + 1);
      }
      if (found === false) {
        this.$.postPrintClose.show();
        this.$.cashToKeep.hide();
        this.$.listPaymentMethods.hide();
        //        this.options.renderpaymentlines.$el.empty();
        //        this.options.renderpaymentlines.render();
        this.$.cashUpInfo.$.buttonNext.setContent(OB.I18N.getLabel('OBPOS_LblPostPrintClose'));
        this.$.cashUpInfo.$.buttonNext.setDisabled(false);
        this.model.set('allowedStep', this.model.get('allowedStep') - 1);
        this.model.set('step', 3);
        this.model.time = new Date().toString().substring(3, 24);
        $('#reportTime').text(OB.I18N.getLabel('OBPOS_LblTime') + ': ' + new Date().toString().substring(3, 24));
      } else {
        this.$.listPaymentMethods.hide();
        this.$.cashToKeep.show();
        this.$.cashUpKeyboard.showToolbar('toolbarempty');
      }
    }
  },
  components: [{
    classes: 'row',
    components: [
    // 1st column: list of pending receipts
    {
      classes: 'span6',
      components: [{
        kind: 'OB.OBPOSCashUp.UI.ListPendingReceipts'
      }]
    },
    // 1st column: list of count cash per payment method
    {
      classes: 'span6',
      components: [{
        kind: 'OB.OBPOSCashUp.UI.ListPaymentMethods',
        showing: false
      }]
    },
    // 1st column: Radio buttons to choose how much to keep in cash
    {
      classes: 'span6',
      components: [{
        kind: 'OB.OBPOSCashUp.UI.CashToKeep',
        showing: false
      }]
    },
    // 1st column: Cash up Report previous to finish the proccess
    {
      classes: 'span6',
      components: [{
        kind: 'OB.OBPOSCashUp.UI.PostPrintClose',
        showing: false
      }]
    },
    //2nd column
    {
      classes: 'span6',
      components: [{
        classes: 'span6',
        components: [{
          kind: 'OB.OBPOSCashUp.UI.CashUpInfo'
        }, {
          kind: 'OB.OBPOSCashUp.UI.CashUpKeyboard'
        }]
      }]
    }, {
      kind: 'OB.UI.ModalCancel'
    }, {
      //  kind: OB.UI.ModalFinishClose
    }]
  }],
  init: function () {
    this.inherited(arguments);
    
    this.$.listPendingReceipts.setCollection(this.model.get('orderlist'));
    
    this.$.listPaymentMethods.setCollection(this.model.getData('DataCloseCashPaymentMethod'));
    this.$.listPaymentMethods.$.total.setContent(this.model.get('totalExpected'));
    //Cash Up Report
    this.$.postPrintClose.setModel(this.model.get('cashUpReport').at(0));
  }
});

OB.POS.registerWindow({
  windowClass: OB.OBPOSCashUp.UI.CashUp,
  route: 'retail.cashup',
  menuPosition: 20,
  menuLabel: OB.I18N.getLabel('OBPOS_LblCloseCash')
});

//  return (
//      {kind: B.KindJQuery('section'), content: [
//
//        {kind: OB.MODEL.DayCash},
//        {kind: OB.Model.Order},
//        {kind: OB.Collection.OrderList},
//        {kind: OB.DATA.CloseCashPaymentMethod},
//        {kind: OB.DATA.PaymentCloseCash},
//        {kind: OB.COMP.ModalCancel},
//        {kind: OB.COMP.ModalFinishClose},
//        {kind: OB.COMP.ModalProcessReceipts},
//        {kind: OB.DATA.Container, content: [
//             {kind: OB.DATA.CloseCashPaymentMethod},
//             {kind: OB.DATA.CashCloseReport},
//             {kind: OB.COMP.HWManager, attr: {'templatecashup': 'res/printcashup.xml'}}
//        ]},
//        {kind: B.KindJQuery('div'), attr: {'class': 'row'}, content: [
//          {kind: B.KindJQuery('div'), attr: {'class': 'span6'}, content: [
//             {kind: OB.COMP.PendingReceipts},
//             {kind: OB.COMP.CountCash},
//             {kind: OB.COMP.CashToKeep},
//             {kind: OB.COMP.PostPrintClose}
//           ]},
//
//          {kind: B.KindJQuery('div'), attr: {'class': 'span6'}, content: [
//            {kind: B.KindJQuery('div'), content: [
//              {kind: OB.COMP.CloseInfo }
//            ]},
//            {kind: OB.COMP.CloseKeyboard }
//          ]}
//        ]}
//
//      ], init: function () {
//        var ctx = this.context;
//        OB.UTIL.showLoading(true);
//        ctx.on('domready', function () {
//          var orderlist = this.context.modelorderlist;
//          OB.Dal.find(OB.Model.Order, {hasbeenpaid:'Y'}, function (fetchedOrderList) { //OB.Dal.find success
//            var currentOrder = {};
//            if (fetchedOrderList && fetchedOrderList.length !== 0) {
//              ctx.orderlisttoprocess = fetchedOrderList;
//              OB.UTIL.showLoading(false);
//              $('#modalprocessreceipts').modal('show');
//            }else{
//              OB.UTIL.showLoading(false);
//            }
//          }, function () { //OB.Dal.find error
//          });
//
//          OB.Dal.find(OB.Model.Order,{hasbeenpaid:'N'}, function (fetchedOrderList) { //OB.Dal.find success
//            var currentOrder = {};
//            if (fetchedOrderList && fetchedOrderList.length !== 0) {
//              ctx.closenextbutton.$el.attr('disabled','disabled');
//              orderlist.reset(fetchedOrderList.models);
//            }
//          }, function () { //OB.Dal.find error
//          });
//        }, this);
//      }}
//    );
//  }
//});