/*global window, define, Backbone */

define(['builder', 'utilities', 'utilitiesui', 'i18n', 'components/commonbuttons', 'components/editline'], function (B) {

  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};

  OB.COMP.ButtonTabEditLine = OB.COMP.ButtonTab.extend({
    tabpanel: '#edition',
    label: OB.I18N.getLabel('OBPOS_LblEdit'),
    render: function () {
      this.options.modelorder.get('lines').on('click', function () {
        this.$el.tab('show');
      }, this);
      return this;
    },
    shownEvent: function (e) {
      this.options.keyboard.show('toolbarscan');
    }
  });

  OB.COMP.TabEditLine = OB.COMP.CustomView.extend({
    createView: function () {
      return (
        {kind: B.KindJQuery('div'), attr: {'id': 'edition', 'class': 'tab-pane'}, content: [
          {kind: OB.COMP.EditLine }
        ]}
      );
    }
  });

});