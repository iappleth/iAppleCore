/*global B, $ */

(function () {

  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};

  OB.COMP.RenderBusinessPartner = OB.COMP.SelectButton.extend({
    render: function() {
      this.$el.append(B(
        {kind: B.KindJQuery('div'), attr:{'style': 'line-height: 23px;'}, content: [
          {kind: B.KindJQuery('div'), content: [
            this.model.get('_identifier')
          ]},
          {kind: B.KindJQuery('div'), attr:{'style': 'color: #888888'}, content: [
            this.model.get('locName')
          ]},
          {kind: B.KindJQuery('div'), attr: {style: 'clear: both;'}}
        ]}
      ).$el);
      return this;
    }
  });
}());
