/*global B, $, _, Backbone, window, confirm, OB, localStorage */

(function () {

  var modelterminal = new OB.MODEL.Terminal();

  var terminal = new OB.COMP.Terminal($("#terminal"), $('#yourcompany'), $('#yourcompanyproperties'), $('#loggeduser'), $('#loggeduserproperties'));
  terminal.setModel(modelterminal);

  var modalProfile = new OB.COMP.ModalProfile($('#dialogsContainer'));
  modalProfile.setModel(modelterminal);

  // alert all errors
  window.onerror = function (e) {
    if (typeof(e) === 'string') {
      OB.UTIL.showError(e);
    }
  };

  // global components.
  OB.POS = {
    modelterminal: modelterminal,
    paramWindow: OB.UTIL.getParameterByName("window") || "retail.pointofsale",
    paramTerminal: OB.UTIL.getParameterByName("terminal") || "POS-1",
    hrefWindow: function (windowname) {
      return '?terminal=' + window.encodeURIComponent(OB.POS.paramTerminal) + '&window=' + window.encodeURIComponent(windowname);
    },
    logout: function (callback) {
      modelterminal.logout();
    },
    lock: function (callback) {
      modelterminal.lock();
    },
    paymentProviders: {},
    windows: {}         
  };

  modelterminal.on('ready', function () {
    var webwindow, w,
        c = _.extend({}, Backbone.Events),
        terminal = OB.POS.modelterminal.get('terminal'),
        queue = {}, createWindow = false;

    // We are Logged !!!
    $(window).off('keypress');
    $('#logoutlink').css('visibility', 'visible');

    // Set Hardware..
    OB.POS.hwserver = new OB.DS.HWServer(modelterminal.get('terminal').hardwareurl, modelterminal.get('terminal').scaleurl);

    // Set Arithmetic properties:
    OB.DEC.setContext(OB.POS.modelterminal.get('currency').pricePrecision, BigDecimal.prototype.ROUND_HALF_EVEN);

    webwindow = OB.POS.windows[OB.POS.paramWindow];

    if (webwindow) {
      // loading/refreshing required data/models for window
      _.each(OB.DATA[OB.POS.paramWindow], function (model) {
        var ds = new OB.DS.DataSource(new OB.DS.Query(model, terminal.client, terminal.organization));
        ds.on('ready', function () {

          queue[model.prototype.source] = true;
          createWindow = OB.UTIL.queueStatus(queue);

          if(createWindow) {
            w = new webwindow(c);
            if (w.render) {
              w = w.render();
            }
            $("#containerWindow").empty().append(w.$el);
            c.trigger('domready');
            OB.UTIL.showLoading(false);
          }
        });
        ds.load();
        queue[model.prototype.source] = false;
      });
    } else {
      OB.UTIL.showLoading(false);
      alert(OB.I18N.getLabel('OBPOS_WindowNotFound', [OB.POS.paramWindow]));
    }
  });

  modelterminal.on('loginsuccess', function () {
    modelterminal.load();
  });

  modelterminal.on('logout', function () {

    // Logged out. go to login window
    modelterminal.off('loginfail');
    $(window).off('keypress');
    $('#logoutlink').css('visibility', 'hidden');

//    var c = _.extend({}, Backbone.Events);
//    $("#containerWindow").empty().append((new login(c)).$el);
//    c.trigger('domready'); window.location=

    // Redirect to login window
    localStorage.setItem('target-window', window.location.href);
    window.location = window.location.pathname + 'login.jsp' + '?terminal=' + window.encodeURIComponent(OB.POS.paramTerminal);
  });

  $(document).ready(function () {
    // Entry Point
    $('#dialogsContainer').append(B({kind: OB.COMP.ModalLogout}).$el);
    modelterminal.load();
  });

}());