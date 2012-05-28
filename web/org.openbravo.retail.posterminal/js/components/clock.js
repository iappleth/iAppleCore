/*global window, define, $, Backbone */

define(['builder', 'utilities', 'i18n'], function (B) {
  
  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};

  // Generic Clock
  OB.COMP.Clock = Backbone.View.extend({
    tagName: 'div',
    initialize: function () {
      this.component = B(
        {kind: B.KindJQuery('div'), content: [
          {kind: B.KindJQuery('div'), id: 'clock'},
          {kind: B.KindJQuery('div'), id: 'date'}
        ]});
      this.$el.append(this.component.$el);
      
      this.$clock = this.component.context.clock.$el;
      this.$date = this.component.context.date.$el;
      var me = this;
      var updateclock = function () {
        var d = new Date();
        me.$clock.text(OB.I18N.formatHour(d));
        me.$date.text(OB.I18N.formatDate(d));
      };
      updateclock();
      setInterval(updateclock, 1000);
    },
    attr: function (attributes) {
      if (attributes.containerClassName) {
        this.$el.attr('class', attributes.containerClassName);
      }
      if (attributes.clockClassName) {
        this.$clock.attr('class', attributes.clockClassName);
      }
      if (attributes.dateClassName) {
        this.$date.attr('class', attributes.dateClassName);
      }
    }
  });
});    

