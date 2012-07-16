<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
 <head>
     <title>Openbravo POS</title>
     <meta charset="utf-8">
     <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0">
     <meta name="description" content="Openbravo Point of Sale window">
     <meta name="author" content="Openbravo, S.L.U.">

     <!--  Apple application capable attributes -->
     <meta name="apple-mobile-web-app-capable" content="yes" />
     <meta name="apple-mobile-web-app-status-bar-style" content="black" />
     <meta name="apple-touch-fullscreen" content="yes" />
     <link rel="apple-touch-startup-image" href="img/openbravopos.png"/>

     <!-- Application icons -->
     <link rel="apple-touch-icon" href="img/openbravopos57x57.png" />
     <link rel="apple-touch-icon" sizes="72x72" href="img/openbravopos72x72.png" />
     <link rel="apple-touch-icon" sizes="114x114" href="img/openbravopos114x114.png" />
     <link rel="shortcut icon" type="image/x-icon" href="../../web/images/favicon.ico" />

     <link rel="stylesheet/less" href="js/libs/bootstrap/less/bootstrap.less">
     <link rel="stylesheet/less" href="js/libs/bootstrap/less/responsive.less">
     <script src="js/libs/less/less-1.3.0.min.js"></script>

    <link rel="stylesheet" type="text/css" href="css/standard.css" />
    <link rel="stylesheet" type="text/css" href="css/login.css" />
</head>

<body style="background-color: darkgray; background: url(img/BACKGROUND-PNG24.png) top left">
<div id="container" class="container">
  <div id="topsection" class="section">
    <div class="row" style="height: 50px; vertical-align: middle; display: table-cell;">
      <div class="span12" style="color: white; font-size: 16px;">
        <div style="display: inline-block; vertical-align: middle; margin: 3px 0px 0px 0px;">
          <div id="online" style="display: inline-block; margin-left: 15px;"><span style="display: inline-block;
width: 20px; color: transparent; background-image: url('./img/login-connected.png'); background-repeat: no-repeat; background-position: 2px 3px;">.</span><span>Online</span></div>
          <div id="terminal" style="display: inline-block; margin-left: 50px;"></div>
          <div class="dropdown" style="display: inline-block; margin-left: 50px;" >
            <a id="yourcompany" class="btn-dropdown" href="#" class="dropdown-toggle" data-toggle="dropdown"></a>
            <div class="dropdown-menu" style="color: black; width: 350px;">
              <div style="height: 60px; background-repeat: no-repeat; background-position: center center; background-image: url('../../utility/ShowImageLogo?logo=yourcompanymenu');"></div>
              <div id="yourcompanyproperties" style="display: block; padding: 10px; float: left; background-color: #FFF899; line-height: 23px;"></div>
              <div style="clear: both;"></div>
            </div>
          </div>
          <div class="dropdown" style="display: inline-block; margin-left: 50px;" >
            <a id="loggeduser" class="btn-dropdown" href="#" class="dropdown-toggle" data-toggle="dropdown"></a>
            <div id="loggeduserproperties" class="dropdown-menu" style="color: black; padding: 0px; width: 350px;">
            </div>
          </div>
        </div>
        <div style="display: inline-block; float: right; visibility: hidden;">
          <div style="display: inline-block; float: left; margin: 4px 10px 0px 0px;">Openbravo Web POS</div>
          <div style="width: 30px; height: 30px; float: right; margin: 0px 12px 0px 0px;">
            <div class="top-right-logo">
          </div>
        </div>
      </div>
    </div>
  </div>
  <div>
    <div id="containerLoading">
      <div class="POSLoadingCenteredBox">
        <div class="POSLoadingPromptLabel" id="">Loading...</div>
        <div class="POSLoadingProgressBar">
          <div class="POSLoadingProgressBarImg"></div>
        </div>
      </div>
    </div>
    <div id="containerWindow" style="display: none;">
      <!-- Here it goes the POS window... -->
    </div>
  </div>
</div>

<script src="../org.openbravo.client.kernel/js/BigDecimal-all-1.0.1.min.js"></script>

<script src="js/libs/jquery-1.7.2.js"></script>
<script src="js/libs/underscore-1.3.3.js"></script>
<script src="js/libs/backbone-0.9.2.js"></script>
<script src="js/libs/bootstrap/js/bootstrap-tab.js"></script>
<script src="js/libs/bootstrap/js/bootstrap-dropdown.js"></script>
<script src="js/libs/bootstrap/js/bootstrap-modal.js"></script>
<script src="js/libs/bootstrap/js/bootstrap-alert.js"></script>
<script src="js/libs/mbp-helper.js"></script>

<!-- Login application -->
<script src="../org.openbravo.client.application/js/utilities/ob-utilities-date.js"></script>
<script src="js/arithmetic.js"></script>
<script src="js/builder.js"></script>
<script src="js/datasource.js"></script>
<script src="js/data/dal.js"></script>
<script src="js/utilities.js"></script>
<script src="js/utilitiesui.js"></script>
<script src="js/i18n.js"></script>
<script src="js/components/clock.js"></script>
<script src="js/components/commonbuttons.js"></script>
<script src="js/model/terminal.js"></script>
<script src="js/model/order.js"></script>
<script src="js/windows/login.js"></script>
<script src="js/mainlogin.js"></script>

<script>
OB = window.OB || {};
OB.I18N = window.OB.I18N || {};
OB.I18N.getLabel = window.OB.I18N.getLabel || function(param) { return param; };

// Hack focus captured by location bar in android browser.
(function () {
  var locationwarning = true;
  var focuskeeper = $('<input id="focuskeeper" style="position:fixed; top:-1000px; left:-1000px;" type="text"/>');
  $("body").append(focuskeeper);
  $("body").focusin(function() {
    locationwarning = false;
  });
  $("body").focusout(function() {
    locationwarning = true;
  });

  window.fixFocus = function () {

    if (locationwarning) {
      focuskeeper.focus();
    }
    var t = document.activeElement.tagName;
    var id = document.activeElement.id;
    return (id === 'focuskeeper' || (t !=='INPUT' && t !=='SELECT' && t !=='TEXTAREA')); // process key
  }
}());
</script>
</body>
</html>
