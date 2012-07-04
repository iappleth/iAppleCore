/*global window, B, Backbone */

(function () {

  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};

  OB.COMP.ModalFinishClose = OB.COMP.ModalAction.extend({
    id: 'modalFinishClose',
    header: OB.I18N.getLabel('OBPOS_LblGoodjob'),

    setBodyContent: function() {
      return(
        {kind: B.KindJQuery('div'), content: [
          OB.I18N.getLabel('OBPOS_FinishCloseDialog')
        ]}
      );
    },

    setBodyButtons: function() {
      return(
        {kind: B.KindJQuery('div'), content: [
          {kind: OB.COMP.CloseDialogOk}
        ]}
      );
    }
  });

  // Exit
  OB.COMP.CloseDialogOk = OB.COMP.Button.extend({
    render: function () {
      this.$el.addClass('btnlink btnlink-gray modal-dialog-content-button');
      this.$el.html(OB.I18N.getLabel('OBPOS_LblOk'));
      return this;
    },
    clickEvent: function (e) {
      OB.UTIL.showLoading(true);
      window.location=OB.POS.hrefWindow('retail.pointofsale');
    }
  });

}());