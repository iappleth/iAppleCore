/*global window, define, Backbone */

define(['builder', 'utilities', 'utilitiesui', 'i18n', 'components/commonbuttons'], function (B) {

  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};


  OB.COMP.ModalLogout = OB.COMP.Modal.extend({
    id: 'logoutDialog',
    header: OB.I18N.getLabel('OBPOS_LogoutDialogLogout'),
    initialize: function () {
      OB.COMP.Modal.prototype.initialize.call(this); // super.initialize();
      var theModal = this.$el,
          theHeader = theModal.children(':first'),
          theBody = theModal.children(':nth-child(2)'),
          theHeaderText = theHeader.children(':nth-child(2)');
      theModal.addClass('modal-dialog');
      theHeader.addClass('modal-dialog-header');
      theBody.addClass('modal-dialog-body');
      theHeaderText.addClass('modal-dialog-header-text');
    },
    getContentView: function () {
      return (
        {kind: B.KindJQuery('div'), content: [
          {kind: B.KindJQuery('div'), attr: {'class': 'modal-dialog-content-text'}, content: [OB.I18N.getLabel('OBPOS_LogoutDialogText')]},
          {kind: B.KindJQuery('div'), attr: {'class': 'modal-dialog-content-buttons-container'}, content: [
            {kind: OB.COMP.LogoutDialogLogout},
            {kind: OB.COMP.LogoutDialogLock},
            {kind: OB.COMP.LogoutDialogCancel}
          ]}
        ]}
      );
    }
  });


  // Logout the application
  OB.COMP.LogoutDialogLogout = OB.COMP.Button.extend({
    render: function () {
      this.$el.addClass('btnlink btnlink-gray modal-dialog-content-button');
      this.$el.html(OB.I18N.getLabel('OBPOS_LogoutDialogLogout'));
      return this;
    },
    clickEvent: function (e) {
      OB.POS.logout();
    }
  });

  // Lock the application
  OB.COMP.LogoutDialogLock = OB.COMP.Button.extend({
    render: function () {
      this.$el.addClass('btnlink btnlink-gray modal-dialog-content-button');
      this.$el.html(OB.I18N.getLabel('OBPOS_LogoutDialogLock'));
      return this;
    },
    clickEvent: function (e) {
      OB.POS.lock();
    }
  });

  // Cancel
  OB.COMP.LogoutDialogCancel = OB.COMP.Button.extend({
    render: function () {
      this.$el.addClass('btnlink btnlink-gray modal-dialog-content-button');
      this.$el.html(OB.I18N.getLabel('OBPOS_LblCancel'));
      this.$el.attr('data-dismiss', 'modal');
      return this;
    },
    clickEvent: function (e) {
      return true;
    }
  });

});