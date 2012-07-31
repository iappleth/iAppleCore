/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */



OB.Model.WindowModel = Backbone.Model.extend({
  data: {},

  initialize: function() {
    var me = this,
        queue = {};
    if (!this.models) {
      this.models = [];
    }

    _.extend(this.models, Backbone.Events);

    this.models.on('ready', function() {
      this.trigger('ready');
      if (this.init) {
        this.init();
      }
    }, this);

    OB.Model.Util.loadModels(true, this.models, this.data);

    //TODO: load offline models when regesitering window
  },

  getData: function(dsName) {
    return this.data[dsName];
  }
});

OB.UI.WindowView = Backbone.View.extend({
  windowmodel: null,

  initialize: function() {
    var me = this;
    this.model = new this.windowmodel();
    this.model.on('ready', function() {
      OB.UTIL.initContentView(me);
      if (me.init) {
        me.init();
      }
      OB.POS.modelterminal.trigger('window:ready', me);
    });
  }

});

OB.UI.CashManagement = OB.UI.WindowView.extend({
  windowmodel: OB.Model.CashManagement,
  tagName: 'section',
  contentView: [{
    tag: 'div',
    attributes: {
      'class': 'row'
    },
    content: [
    // 1st column: list of deposits/drops done or in process
    {
      tag: 'div',
      attributes: {
        'class': 'span6'
      },
      content: [{
        view: OB.COMP.ListDepositsDrops
      }]
    },
    //2nd column:
    {
      tag: 'div',
      attributes: {
        'class': 'span6'
      },
      content: [{
        tag: 'div',
        attributes: {
          'class': 'span6'
        },
        content: [{
          view: OB.COMP.CashMgmtInfo
        }]
      }, {
        view: OB.COMP.CashMgmtKeyboard
      }]
    },
    //hidden stuff 
    {
      tag: 'div',
      content: [{
        view: OB.UI.ModalDepositEvents.extend({
          id: 'modaldepositevents',
          header: OB.I18N.getLabel('OBPOS_SelectDepositDestinations'),
          type: 'DataDepositEvents'
        })
      }, {
        view: OB.UI.ModalDepositEvents.extend({
          id: 'modaldropevents',
          header: OB.I18N.getLabel('OBPOS_SelectDropDestinations'),
          type: 'DataDropEvents'
        })
      }, {
        view: OB.COMP.ModalCancel
      }]
    }]
  }],

  init: function() {
    var depositEvent = this.model.getData('DataDepositEvents'),
        dropEvent = this.model.getData('DataDropEvents');

    // DepositEvent Collection is shown by TableView, when selecting an option 'click' event 
    // is triggered, propagating this UI event to model here
    depositEvent.on('click', function(model) {
      this.model.depsdropstosend.trigger('paymentDone', model, this.options.currentPayment);
      delete this.options.currentPayment;
    }, this);

    dropEvent.on('click', function(model) {
      this.model.depsdropstosend.trigger('paymentDone', model, this.options.currentPayment);
      delete this.options.currentPayment;
    }, this);
  }
});


OB.POS.registerWindow('retail.cashmanagement', OB.UI.CashManagement, 10);