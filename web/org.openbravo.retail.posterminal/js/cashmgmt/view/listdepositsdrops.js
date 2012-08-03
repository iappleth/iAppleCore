/*global Backbone, _, enyo */

/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

// Renders lines of deposits/drops
enyo.kind({
  name: 'OB.OBPOSCasgMgmt.UI.RenderDepositLine',
  components: [{
    classes: 'row-fluid',
    components: [{
      classes: 'span12',
      style: 'border-bottom: 1px solid #cccccc;',
      components: [{
        name: 'description',
        style: 'padding: 6px 20px 6px 10px;  float: left; width: 40%'
      }, {
        name: 'user',
        style: 'text-align:right; padding: 6px 20px 6px 10px; float: left;  width: 15%'
      }, {
        name: 'time',
        style: 'text-align:right; padding: 6px 20px 6px 10px; float: left;  width: 10%'
      }, {
        name: 'amt',
        style: 'text-align:right; padding: 6px 20px 6px 10px; float: right;'
      }]
    }]
  }],
  create: function () {
    var amnt, lbl, time = new Date(this.model.get('time'));

    this.inherited(arguments);

    if (this.model.get('timeOffset')) {
      time.setMinutes(time.getMinutes() + this.model.get('timeOffset') + time.getTimezoneOffset());
    }
    if (this.model.get('drop') !== 0) {
      amnt = OB.I18N.formatCurrency(OB.DEC.add(0, this.model.get('drop')));
      lbl = OB.I18N.getLabel('OBPOS_LblWithdrawal') + ': ';
    } else {
      amnt = OB.I18N.formatCurrency(OB.DEC.add(0, this.model.get('deposit')));
      lbl = OB.I18N.getLabel('OBPOS_LblDeposit') + ': ';
    }

    this.$.description.setContent(lbl + this.model.get('description'));
    this.$.user.setContent(this.model.get('user'));
    this.$.time.setContent(time.toString().substring(16, 21));
    this.$.amt.setContent(amnt);
  }
});

enyo.kind({
  name: 'OB.OBPOSCasgMgmt.UI.RenderTotal',
  tag: 'span',
  published: {
    total: null
  },
  create: function () {
    this.inherited(arguments);
    this.owner.model.on('change:total', function (model) {
      this.setTotal(model.get('total'));
    }, this);
  },
  totalChanged: function (oldValue) {
    this.setContent(this.total);
    if (OB.DEC.compare(this.total) < 0) {
      this.applyStyle('color', 'red');
    } else {
      this.applyStyle('color', 'black');
    }
  }
});

//Renders each of the payment types with their summary and a list of deposits/drops (OB.OBPOSCasgMgmt.UI.RenderDepositLine)
enyo.kind({
  name: 'OB.OBPOSCasgMgmt.UI.RenderDepositsDrops',
  components: [
  // separator
  {
    classes: 'row-fluid',
    components: [{
      classes: 'span12',
      style: 'border-bottom: 1px solid #cccccc;',
      components: [{
        style: 'padding: 10px 20px 10px 10px;  float: left;'
      }, {
        style: 'clear: both;'
      }]
    }]
  },

  // Total per payment type
  {
    classes: 'row-fluid',
    components: [{
      classes: 'span12',
      style: 'border-bottom: 1px solid #cccccc;',
      components: [{
        name: 'startingCashPayName',
        style: 'padding: 6px 20px 6px 10px;  float: left; width: 70%'
      }, {
        name: 'startingCashAmnt',
        style: 'text-align:right; padding: 6px 20px 6px 10px; float: right;'
      }]
    }]
  },

  // Tendered per payment type
  {
    classes: 'row-fluid',
    components: [{
      classes: 'span12',
      style: 'border-bottom: 1px solid #cccccc;',
      components: [{
        name: 'tenderedLbl',
        style: 'padding: 6px 20px 6px 10px;  float: left; width: 70%'
      }, {
        name: 'tenderedAmnt',
        style: 'text-align:right; padding: 6px 20px 6px 10px; float: right;'
      }]
    }]
  },

  // Drops/deposits
  {
    name: 'theList',
    listStyle: 'list',
    kind: 'OB.UI.Table',
    renderLine: 'OB.OBPOSCasgMgmt.UI.RenderDepositLine',
    renderEmpty: 'enyo.Control'
  },

  // Available per payment type
  {
    classes: 'row-fluid',
    components: [{
      classes: 'span12',
      style: 'border-bottom: 1px solid #cccccc;',
      components: [{
        name: 'availableLbl',
        style: 'padding: 10px 20px 10px 10px; float: left; width: 70%; font-weight:bold;'
      }, {
        style: 'padding: 10px 20px 10px 0px;  float: right;',
        components: [{
          name: 'total',
          kind: 'OB.OBPOSCasgMgmt.UI.RenderTotal',
          style: 'float:right; font-weight: bold;'
        }]
      }]
    }]
  }],
  create: function () {
    var transactionsArray = this.model.get('listdepositsdrops'),
        transactionsCollection = new Backbone.Collection(transactionsArray),
        total;

    this.inherited(arguments);

    total = _.reduce(transactionsArray, function (accum, trx) {
      return accum + trx.deposit - trx.drop;
    }, 0);

    this.model.set('total', total, {
      silent: true // prevents triggering change event
    });

    this.$.total.setTotal(total); // explicitly set the total
    this.$.theList.setCollection(transactionsCollection);

    this.$.startingCashPayName.setContent(OB.I18N.getLabel('OBPOS_LblStarting') + ' ' + this.model.get('payName'));
    this.$.startingCashAmnt.setContent(OB.I18N.formatCurrency(OB.DEC.add(0, this.model.get('startingCash'))));
    this.$.tenderedLbl.setContent(OB.I18N.getLabel('OBPOS_LblTotalTendered') + ' ' + this.model.get('payName'));
    this.$.tenderedAmnt.setContent(OB.I18N.formatCurrency(OB.DEC.add(0, this.model.get('totalTendered'))));
    this.$.availableLbl.setContent(OB.I18N.getLabel('OBPOS_LblNewAvailableIn') + ' ' + this.model.get('payName'));
  }
});

//Renders the summary of deposits/drops and contains a list (OB.OBPOSCasgMgmt.UI.RenderDepositsDrops)
//with detailed information for each payment type
enyo.kind({
  name: 'OB.OBPOSCasgMgmt.UI.ListDepositsDrops',
  components: [{
    style: 'overflow:auto; height: 500px; margin: 5px',
    components: [{
      style: 'background-color: #ffffff; color: black; padding: 5px;',
      components: [{
        classes: 'row-fluid',
        components: [{
          classes: 'span12',
          style: 'border-bottom: 1px solid #cccccc;',
          components: [{
            style: 'padding: 6px; border-bottom: 1px solid #cccccc;text-align:center; font-weight:bold;',
            content: OB.I18N.getLabel('OBPOS_LblCashManagement')
          }, {
            name: 'userName',
            style: 'padding: 6px; border-bottom: 1px solid #cccccc; text-align:center;'
          }, {
            name: 'time',
            style: 'padding: 6px; border-bottom: 1px solid #cccccc; text-align:center;'
          }, {
            name: 'store',
            style: 'padding: 6px; border-bottom: 1px solid #cccccc; text-align:center;'
          }, {
            name: 'terminal',
            style: 'padding: 6px; border-bottom: 1px solid #cccccc; text-align:center;'
          }, {
            name: 'depositDropsList',
            kind: 'OB.UI.Table',
            renderLine: 'OB.OBPOSCasgMgmt.UI.RenderDepositsDrops',
            renderEmpty: 'enyo.Control',
            listStyle: 'list'
          }]
        }]
      }]
    }]
  }],
  create: function () {
    this.inherited(arguments);
    this.$.userName.setContent(OB.I18N.getLabel('OBPOS_LblUser') + ': ' + OB.POS.modelterminal.get('context').user._identifier);
    this.$.time.setContent(OB.I18N.getLabel('OBPOS_LblTime') + ': ' + new Date().toString().substring(3, 24));
    this.$.store.setContent(OB.I18N.getLabel('OBPOS_LblStore') + ': ' + OB.POS.modelterminal.get('terminal').organization$_identifier);
    this.$.terminal.setContent(OB.I18N.getLabel('OBPOS_LblTerminal') + ': ' + OB.POS.modelterminal.get('terminal')._identifier);

    this.$.depositDropsList.setCollection(this.owner.model && this.owner.model.getData('DataDepositsDrops'));
  },
  init: function () {
    // this.owner is the window (OB.UI.WindowView)
    // this.parent is the DOM object on top of the list (usually a DIV)
    this.$.depositDropsList.setCollection(this.owner.model.getData('DataDepositsDrops'));
  }
});