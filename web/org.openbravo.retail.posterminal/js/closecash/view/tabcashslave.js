/*
 ************************************************************************************
 * Copyright (C) 2015 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, $ */

enyo.kind({
  name: 'OB.OBPOSCashUp.UI.CashSlave',
  published: {
    paymentToKeep: null
  },
  components: [{
    classes: 'tab-pane',
    components: [{
      style: 'overflow:auto; height: 500px; margin: 5px',
      components: [{
        style: 'background-color: #ffffff; color: black; padding: 5px;',
        components: [{
          classes: 'row-fluid',
          components: [{
            classes: 'span12',
            components: [{
              name: 'stepsheader',
              style: 'padding: 10px; border-bottom: 1px solid #cccccc; text-align:center;',
              renderHeader: function (step, count) {
                this.setContent(OB.I18N.getLabel('OBPOS_LblStepNumber', [step, count]) + " " + OB.I18N.getLabel('OBPOS_LblStepSlave') + OB.OBPOSCashUp.UI.CashUp.getTitleExtensions());
              }
            }]
          }]
        }, {
          style: 'background-color: #ffffff; color: black; padding: 10px; height: 50px;',
          name: 'panelInfo'
        }]
      }]
    }]
  }],
  init: function () {
    this.$.panelInfo.setContent(OB.I18N.getLabel('OBPOS_LblStepSlaveInfo'));
  },
  displayStep: function (model) {
    this.$.stepsheader.renderHeader(model.stepNumber('OB.CashUp.Slave'), model.stepCount());

    // this function is invoked when displayed.        
  }
});