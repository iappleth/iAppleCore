/*global define,$,_,Backbone */

define(['builder', 'utilities', 'arithmetic', 'i18n', 'components/keyboard'], function (B) {

  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};

  OB.COMP.CloseKeyboard = OB.COMP.Keyboard.extend({
    initialize: function () {
      OB.COMP.Keyboard.prototype.initialize.call(this); // super.initialize();

      // Toolbars at the end...
      this.attr({
        toolbarempty: [
          {command:'---', label: {kind: B.KindHTML('<span>&nbsp;</span>')}},
          {command:'---', label: {kind: B.KindHTML('<span>&nbsp;</span>')}},
          {command:'---', label: {kind: B.KindHTML('<span>&nbsp;</span>')}},
          {command:'---', label: {kind: B.KindHTML('<span>&nbsp;</span>')}},
          {command:'---', label: {kind: B.KindHTML('<span>&nbsp;</span>')}},
          {command:'---', label: {kind: B.KindHTML('<span>&nbsp;</span>')}}
        ],
        toolbarcashcount: [
       {command:'---', label: OB.I18N.getLabel('OBPOS_KbCash')},
       {command:'---', label: OB.I18N.getLabel('OBPOS_KbCard')},
       {command:'---', label: OB.I18N.getLabel('OBPOS_KbVoucher')},
       {command:'---', label: {kind: B.KindHTML('<span>&nbsp;</span>')}},
       {command:'---', label: {kind: B.KindHTML('<span>&nbsp;</span>')}},
       {command:'---', label: {kind: B.KindHTML('<span>&nbsp;</span>')}}
     ]
      });

      this.show('toolbarempty');
    }
  });


});