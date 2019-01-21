/*
 ************************************************************************************
 * Copyright (C) 2012-2018 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global $, _ */

(function () {

  var PrintCashUp = function () {
      var terminal = OB.MobileApp.model.get('terminal');
      this.templatecashup = new OB.DS.HWResource(terminal.printCashUpTemplate || OB.OBPOSPointOfSale.Print.CashUpTemplate);
      this.cancelOrDismiss = function () {
        OB.POS.navigate('retail.pointofsale');
        OB.MobileApp.view.$.confirmationContainer.setAttribute('openedPopup', '');
      };
      this.isRetry = false;
      };

  PrintCashUp.prototype.print = function (report, sumary, closed, callback) {
    var me = this;
    // callbacks definition
    var successfunc = function () {
        var printCashUp = new OB.OBPOSCashUp.Print.CashUp();
        printCashUp.isRetry = true;
        printCashUp.print(report, sumary, closed, me.cancelOrDismiss);
        return true;
        };
    var cancelfunc = function () {
        me.cancelOrDismiss();
        return true;
        };
    var printProcess = function () {
        OB.POS.hwserver.cleanDisplay();
        OB.POS.hwserver.print(me.templatecashup, {
          cashup: {
            closed: closed,
            report: report,
            summary: sumary
          }
        }, function (result) {
          if (result && result.exception) {
            OB.OBPOS.showSelectPrinterDialog(successfunc, cancelfunc, cancelfunc, false, 'OBPOS_MsgPrintAgainCashUp');
          } else {
            if (callback) {
              callback();
            }
          }
        });
        };
    if (OB.MobileApp.model.get('terminal').terminalType.selectprinteralways) {
      OB.OBPOS.showSelectPrintersWindow(printProcess, cancelfunc, cancelfunc, false, me.isRetry);
    } else {
      printProcess();
    }
  };

  // Public object definition
  OB.OBPOSCashUp = OB.OBPOSCashUp || {};
  OB.OBPOSCashUp.Print = OB.OBPOSCashUp.Print || {};

  OB.OBPOSCashUp.Print.CashUp = PrintCashUp;

}());