/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global Backbone, enyo */

enyo.kind({
  name: 'OB.OBPOSCashUp.UI.RenderCashPaymentsLine',
  events: {
    onLineEditCash: '',
    onAddUnit: ''
  },
  components: [{
    components: [{
      classes: 'row-fluid',
      components: [{
        classes: 'span12',
        style: 'border-bottom: 1px solid #cccccc;',
        components: [{
          name: 'coin',
          kind: 'OB.UI.SmallButton',
          classes: 'btnlink-gray btnlink-cashup-edit',
          ontap: 'addUnit'
        }, {
          name: 'numberOfCoins',
          style: 'padding: 10px 10px 10px 0px; float: left; width: 15%; text-align: center;'
        }, {
          style: 'float: left;',
          components: [{
            name: 'buttonEdit',
            kind: 'OB.UI.SmallButton',
            classes: 'btnlink-orange btnlink-cashup-edit btn-icon-small btn-icon-edit',
            ontap: 'lineEdit'
          }]
        }, {
          name: 'total',
          style: 'float: left; padding: 10px 0px 10px 0px; width: 15%; text-align: center;'
        }]
      }]
    }]
  }],
  create: function () {
    this.inherited(arguments);
    this.$.coin.setContent(this.model.get('coinValue'));
    var style = 'padding: 10px 20px 10px 10px; float: left; width: 15%; text-align: center;';
    if(this.model.get('bordercolor')){
      style+='border:10px solid '+this.model.get('bordercolor')+";";
    }
    style += ' background-color:'+this.model.get('backcolor')+";";
    this.$.coin.addStyles(style);
    this.$.numberOfCoins.setContent(this.model.get('numberOfCoins'));
    this.$.total.setContent(OB.I18N.formatCurrency(OB.DEC.add(0, this.model.get('totalAmount'))));
  },
  render: function () {
    var udfn, counted, foreignCounted;
    this.inherited(arguments);
    counted = this.model.get('numberOfCoins');
    if (counted !== null && counted !== udfn) {
      this.$.numberOfCoins.setContent(counted);
      this.$.total.setContent(OB.I18N.formatCurrency(OB.DEC.add(0, this.model.get('totalAmount'))));
    }
  },
  lineEdit: function () {
    this.doLineEditCash();
  },
  addUnit: function() {
    this.doAddUnit();  
  },
  lineOK: function (inSender, inEvent) {
    this.model.set('counted', this.model.get('expected'));
    this.model.set('foreignCounted', this.model.get('foreignExpected'));
  }
});

enyo.kind({
  name: 'OB.OBPOSCashUp.UI.RenderTotal',
  tag: 'span',
  published: {
    total: OB.DEC.Zero
  },
  create: function () {
    this.inherited(arguments);
  },
  totalChanged: function (oldValue) {
    this.setContent(OB.I18N.formatCurrency(this.total));
    this.applyStyle('color', OB.DEC.compare(this.total) < 0 ? 'red' : 'black');
  }
});

enyo.kind({
  name: 'OB.OBPOSCashUp.UI.CashPayments',
  handlers: {
    onAnyCounted: 'anyCounted',
    onAddUnit: 'addUnit',
    onLineEditCash: 'lineEditCash'
  },
  events: {
    onCountAllOK: ''
  },
  components: [{
    classes: 'tab-pane',
    components: [{
      style: 'overflow:auto; height: 650px; margin: 5px',
      components: [{
        style: 'background-color: #ffffff; color: black; padding: 5px;',
        components: [{
          classes: 'row-fluid',
          components: [{
            classes: 'span12',
            components: [{
              style: 'padding: 10px; border-bottom: 1px solid #cccccc; text-align:center;',
              name: 'title',
              initComponents: function () {
                this.setContent(OB.I18N.getLabel('OBPOS_CashPaymentsTitle'));
              }
            }]
          }]
        }, {
          style: 'background-color: #ffffff; color: black;',
          components: [{
            components: [{
              classes: 'row-fluid',
              components: [{
                classes: 'span12',
                style: 'border-bottom: 1px solid #cccccc;',
                components: [{
                  style: 'padding: 10px 20px 10px 10px; float: left; width: 20%',
                  initComponents: function () {
                    this.setContent(OB.I18N.getLabel('OBPOS_CoinType'));
                  }
                }, {
                  style: 'padding: 10px 20px 10px 0px; float: left; width: 20%',
                  initComponents: function () {
                    this.setContent(OB.I18N.getLabel('OBPOS_NumberOfItems'));
                  }
                }, {
                  style: 'padding: 10px 0px 10px 0px;  float: left; width:20%',
                  initComponents: function () {
                    this.setContent(OB.I18N.getLabel('OBPOS_AmountOfCash'));
                  }
                }]
              }]
            }, {
              name: 'paymentsList',
              kind: 'OB.UI.Table',
              renderLine: 'OB.OBPOSCashUp.UI.RenderCashPaymentsLine',
              renderEmpty: 'OB.UI.RenderEmpty',
              listStyle: 'list'
            }, {
              classes: 'row-fluid',
              components: [{
                classes: 'span12',
                style: 'border-bottom: 1px solid #cccccc;',
                components: [{
                  name: 'totalLbl',
                  style: 'padding: 10px 20px 10px 10px; float: left; width: 15%;',
                  initComponents: function () {
                    this.setContent(OB.I18N.getLabel('OBPOS_ReceiptTotal'));
                  }
                }, {
                  style: 'padding: 10px 20px 10px 0px; float: left; width: 14%;',
                  components: [{
                    name: 'total',
                    kind: 'OB.OBPOSCashUp.UI.RenderTotal',
                    style: 'font-weight: bold;'
                  }]
                },  {
                  name: 'countedLbl',
                  style: 'padding: 10px 20px 10px 10px; float: left; width: 15%;',
                  initComponents: function () {
                    this.setContent(OB.I18N.getLabel('OBPOS_Counted'));
                  }
                },{
                  style: 'padding: 10px 5px 10px 0px; float: left;',
                  components: [{
                    name: 'counted',
                    kind: 'OB.OBPOSCashUp.UI.RenderTotal',
                    style: 'font-weight: bold;'
                  }]
                }, {
                  name: 'differenceLbl',
                  style: 'padding: 10px 20px 10px 10px; float: left; width: 15%;',
                  initComponents: function () {
                    this.setContent(OB.I18N.getLabel('OBPOS_Remaining'));
                  }
                },{
                  style: 'padding: 10px 5px 10px 0px; float: left;',
                  components: [{
                    name: 'diference',
                    kind: 'OB.OBPOSCashUp.UI.RenderTotal',
                    style: 'font-weight: bold;'
                  }]
                }]
              }]
            }]
          }]
        }]
      }]
    }]
  }],
  initComponents: function() {
    this.inherited(arguments);
  },
  init: function(model) {
    this.inherited(arguments);
    
    this.model = model;     
    this.model.on('action:addUnitToCollection', function (args) {
      this.addUnitToCollection(args.coin, args.amount);
    }, this); 
  },
  printTotals: function () {
    this.$.counted.setTotal(this.payment.get('foreignCounted'));
    this.$.diference.setTotal(this.payment.get('foreignDifference'));
  },
  
  lineEditCash: function (inSender, inEvent) {
    this.model.trigger('action:SelectedCoin', inEvent.originator.model.get('coinValue'));
  },
  
  addUnit: function (inSender, inEvent) {
    this.addUnitToCollection(inEvent.originator.model.get('coinValue'));
  },
  addUnitToCollection: function(coinValue, amount) {
    var collection = this.$.paymentsList.collection;
    var lAmount = amount || amount === 0 ? amount: 1;
    var resetAmt = amount || amount === 0 ? true : false;
    var newcollection = new Backbone.Collection();
    var totalCounted = 0;
    collection.each(function(coin){
      var coinModel = new Backbone.Model();
      if(coin.get('coinValue')===coinValue){
        if(resetAmt){
          coinModel.set('numberOfCoins', lAmount);
        }else{
          coinModel.set('numberOfCoins', coin.get('numberOfCoins') + lAmount);
        }
      }else{
        coinModel.set('numberOfCoins', coin.get('numberOfCoins'));
      }
      coinModel.set('coinValue', coin.get('coinValue'));
      coinModel.set('totalAmount', OB.DEC.mul(coinModel.get('numberOfCoins'), coinModel.get('coinValue')));
      totalCounted += coinModel.get('totalAmount');
      coinModel.set('backcolor', coin.get('backcolor'));
      coinModel.set('bordercolor', coin.get('bordercolor'));
      newcollection.add(coinModel);
    });
    
    this.payment.set('coinsCollection', newcollection);
    this.$.paymentsList.setCollection(newcollection);
    this.payment.set('foreignCounted', totalCounted);
    this.payment.set('counted', OB.DEC.mul(totalCounted, this.payment.get('rate')));
    this.payment.set('foreignDifference', OB.DEC.sub(totalCounted, this.payment.get('foreignExpected')));    
    this.printTotals();
  },
  anyCounted: function () {
    //this.$.buttonAllOk.applyStyle('visibility', 'hidden'); //hiding in this way to keep the space
  },
  initPaymentToCount: function (payment) {
    this.payment = payment;
    
    this.$.title.setContent(OB.I18N.getLabel('OBPOS_CashPaymentsTitle', [payment.get('name')]));
    
    this.$.total.setTotal(this.payment.get('foreignExpected'));
    
    if (!this.payment.get('coinsCollection')) {     
      // First empty collection before loading.
      this.$.paymentsList.setCollection(new Backbone.Collection());
      this.payment.set('foreignCounted', 0); 
      this.payment.set('counted', 0);
      this.payment.set('foreignDifference', OB.DEC.sub(0, this.payment.get('foreignExpected'))); 
      this.printTotals();    

      // Call to draw currencies.
      var currencyId = payment.get('paymentMethod').currency;
      var me = this;
      OB.Dal.find(OB.Model.CurrencyPanel, {
          currency: currencyId
        }, function(coins){
        var coinCol = new Backbone.Collection();
        coins.each(function(coin){
          var coinModel = new Backbone.Model();
          coinModel.set('numberOfCoins', 0);
          coinModel.set('totalAmount' ,0);
          coinModel.set('coinValue', coin.get('amount'));
          coinModel.set('backcolor', coin.get('backcolor'));
          coinModel.set('bordercolor', coin.get('bordercolor'));
          coinCol.add(coinModel);
        });
        
        me.payment.set('coinsCollection', coinCol);
        me.$.paymentsList.setCollection(coinCol);
        me.payment.set('foreignCounted', 0);   
        me.payment.set('counted', 0);
        me.payment.set('foreignDifference', OB.DEC.sub(0, me.payment.get('foreignExpected'))); 
        me.printTotals();             
      });  
    } else {
      this.$.paymentsList.setCollection(this.payment.get('coinsCollection'));
      this.printTotals();
    }
    
  },
  displayStep: function (model) {
    // this function is invoked when displayed.   
    
    this.initPaymentToCount(model.get('paymentList').at(model.get('substep')));
  }
});