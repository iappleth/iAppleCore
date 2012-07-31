/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */


OB.Model = OB.Model || {};

OB.Model.DepositsDrops = Backbone.Model.extend({
  source: 'org.openbravo.retail.posterminal.term.CashMgmtDepositsDrops',
  modelName: 'DataDepositsDrops',
  online: true
});

OB.Model.CashMgmtPaymentMethod = Backbone.Model.extend({
  source: 'org.openbravo.retail.posterminal.term.CashMgmtPayments',
  modelName: 'DataCashMgmtPaymentMethod',
  online: true
});

OB.Model.DropEvents = Backbone.Model.extend({
  source: 'org.openbravo.retail.posterminal.term.CashMgmtDropEvents',
  modelName: 'DataDropEvents',
  online: true
});

OB.Model.DepositEvents = Backbone.Model.extend({
  source: 'org.openbravo.retail.posterminal.term.CashMgmtDepositEvents',
  modelName: 'DataDepositEvents',
  online: true
});

OB.Model.CashManagement = OB.Model.WindowModel.extend({
  models: [OB.Model.DepositsDrops, OB.Model.CashMgmtPaymentMethod, OB.Model.DropEvents, OB.Model.DepositEvents],
  init: function() {
    var depList = this.getData('DataDepositsDrops');


    this.depsdropstosend = new Backbone.Collection();

    this.depsdropstosend.on('paymentDone', function(model, p) {
      var deposits, error = false;
      depList.each(function(dep) {
        if (p.destinationKey === dep.get('paySearchKey')) {
          error = (p.type === 'drop' && OB.DEC.sub(dep.get('total'), p.amount) < 0);
          deposits = dep.get('listdepositsdrops');
        }
      });
      if (error) {
        console.log('eerr');
        OB.UTIL.showError(OB.I18N.getLabel('OBPOS_MsgMoreThanAvailable'));
        return;
      }
      console.log('paymentDone', this, p);
      var payment = {
        description: p.identifier + ' - ' + model.get('name'),
        name: p.destinationKey,
        user: OB.POS.modelterminal.get('context').user._identifier,
        time: new Date()
      };

      if (p.type === 'drop') {
        payment.deposit = 0;
        payment.drop = p.amount;
      } else {
        payment.deposit = p.amount;
        payment.drop = 0
      }

      deposits.push(payment);

      this.depsdropstosend.add({
        amount: p.amount,
        description: p.identifier + ' - ' + model.get('name'),
        paymentMethodId: p.id,
        type: p.type,
        reasonId: model.get('id'),
        user: OB.POS.modelterminal.get('context').user._identifier,
        time: new Date().toString().substring(16, 21)
      });
      depList.trigger('reset');
    }, this);

    this.depsdropstosend.on('makeDeposits', function() {
      var process = new OB.DS.Process('org.openbravo.retail.posterminal.ProcessCashMgmt'),
          me = this;

      OB.UTIL.showLoading(true);
      if (this.depsdropstosend.length === 0) {
        OB.POS.navigate('retail.pointofsale');
        return true;
      }

      process.exec({
        depsdropstosend: this.depsdropstosend.toJSON()
      }, function(data, message) {
        if (data && data.exception) {
          OB.UTIL.showLoading(false);
          OB.UTIL.showError(OB.I18N.getLabel('OBPOS_MsgErrorDropDep'));
        } else {
          // XXX: is this the way to print?: HWManager needs to be refactored
          var hw = new OB.COMP.HWManager(me);
          hw.depsdropstosend = me.depsdropstosend.toJSON();
          hw.attr({
            templatecashmgmt: 'res/printcashmgmt.xml'
          });
          me.trigger('print');
        }
      });
    }, this);
  }
});