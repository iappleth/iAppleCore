/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.1  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License.
 * The Original Code is Openbravo ERP.
 * The Initial Developer of the Original Code is Openbravo SLU
 * All portions are Copyright (C) 2011 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
// = Openbravo Utilities =
// Defines utility methods in the top-level OB.Utilities object. Utility methods
// are related to opening views, opening popups, displaying yes/no, etc. 
OB.Utilities = {};

// ** {{{OB.Utilities.createLoadingLayout}}} **
// Creates a layout with the loading image.
OB.Utilities.createLoadingLayout = function(){
  var mainLayout = isc.HLayout.create({styleName: OB.LoadingPrompt.mainLayoutStyleName, width: '100%', height: '100%', align: 'center', defaultLayoutAlign: 'center'});
  var loadingLayout = isc.HLayout.create({styleName: OB.LoadingPrompt.loadingLayoutStyleName, width: 1, height: 1, overflow: 'visible'});
  mainLayout.addMember(loadingLayout);
  loadingLayout.addMember(isc.Label.create({contents: OB.I18N.getLabel('OBUIAPP_LOADING'), styleName: 'OBLoadingPromptLabel', width: 1, height: 1, overflow: 'visible'}));
  loadingLayout.addMember(isc.Img.create(OB.LoadingPrompt.loadingImage));
  return mainLayout;
};

// ** {{{OB.Utilities.addRequiredSuffixToBaseStyle}}} **
// Adds the Required suffix to a base style for a required formitem, to show it yellow in 
// the forms.
OB.Utilities.addRequiredSuffixToBaseStyle = function(item){
  if (item.required) {
    // apparently this is called many times therefore do not append
    // if we already did append it
    if (item.textFieldProperties && item.textFieldProperties.textBoxStyle) {
      if (!item.textFieldProperties.textBoxStyle.endsWith('Required')) {
        // make a copy as the textFieldProperties object is shared by many instances
        // so you can't change it directly
        item.textFieldProperties = isc.addProperties({}, item.textFieldProperties);
        item.textFieldProperties.textBoxStyle = item.textFieldProperties.textBoxStyle + 'Required';
      }
    } else if (item.textBoxStyle && !item.textBoxStyle.endsWith('Required')) {
      item.textBoxStyle = item.textBoxStyle + 'Required';
    }
  }
};

// ** {{{OB.Utilities.determineViewOfFormItem}}} **
// Handles the different ways to find the view of a form item.
OB.Utilities.determineViewOfFormItem = function(item){
  var form = item.form;
  if (form.view) {
    // form item in standard form
    return form.view;
  } else if (form.grid) {
    // row editor form item
    if (form.grid.view) {
      return form.grid.view;
    } else if (isc.isA.RecordEditor(form.grid) && form.grid.sourceWidget && form.grid.sourceWidget.view) {
      // filter editor form item
      return form.grid.sourceWidget.view;
    }
  }
  return null;
};

// ** {{{OB.Utilities.callAction}}} **
// Calls the action defined by the action object, if the action object has a callback
// property, it is assumed to be a function and it is called. Otherwise the following
// properties are assumed to be in the action object: method (a function), target (the 
// object to call the function on) and parameters (an array passed to the function).
// If action is null/undefined then nothing is done and undefined is returned.
// When the action is called the result of the action is returned.
OB.Utilities.callAction = function(action){
  function IEApplyHack(method, object, parameters) {
    if (!object) {
      object = window;
    }
    if (!parameters) {
      parameters = [];
    }

    object.customApplyMethod = method;

    var argsString = [];
    for(var i = 0; i < parameters.length; i++) {
      argsString[i] = 'parameters[' + i + ']';
    }

    var argsList = argsString.join(",");

    var result = eval('object.customApplyMethod(' + argsList + ');');

    delete object.customApplyMethod;

    return result;
  }

  if (!action) {
    return;
  }
  if (action.callback) {
    action.callback();
  } else {
    if (navigator.userAgent.toUpperCase().indexOf("MSIE") !== -1) {
      IEApplyHack(action.method, action.target, action.parameters);
    } else {
      action.method.apply(action.target, action.parameters);
    }
  }
};

// ** {{{OB.Utilities.replaceNullStringValue}}} **
// Replaces values which are 'null' with null
OB.Utilities.replaceNullStringValue = function(form, values){
  for (var prop in values) {
    if (values.hasOwnProperty(prop)) {
      var value = values[prop];
      if (value === 'null') {
        values[prop] = null;
      }
    }
  }
};

// ** {{{OB.Utilities.useClassicMode}}} **
// Returns true if the user wants to work in classic mode, checks the url parameter
// as well as a property value.
OB.Utilities.useClassicMode = function(windowId){
  if (OB.Utilities.hasUrlParameter('mode', 'classic')) {
    return true;
  }
  var propValue = OB.PropertyStore.get('OBUIAPP_UseClassicMode', windowId);
  if (propValue === 'Y') {
    return true;
  }
  if (OB.WindowDefinitions[windowId] && OB.WindowDefinitions[windowId].showInClassicMode) {
    return true;
  }
  return false;
};

// ** {{{OB.Utilities.openView}}} **
// Open a view taking into account if a specific window should be opened in classic mode or not.
// Returns the object used to open the window.
OB.Utilities.openView = function(windowId, tabId, tabTitle, recordId, command, icon){
  var isClassicEnvironment = OB.Utilities.useClassicMode(windowId);
  
  var openObject;
  if (isClassicEnvironment) {
    if (recordId) {
      OB.Layout.ClassicOBCompatibility.openLinkedItem(tabId, recordId);
      return null;
    }
    openObject = {
      viewId: 'OBClassicWindow',
      windowId: windowId,
      tabId: tabId,
      id: tabId,
      command: 'DEFAULT',
      tabTitle: tabTitle,
      icon: icon
    };
  } else if (recordId) {
    openObject = {
      viewId: '_' + windowId,
      id: tabId,
      targetRecordId: recordId,
      targetTabId: tabId,
      tabTitle: tabTitle,
      windowId: windowId
    };
  } else {
    openObject = {
      viewId: '_' + windowId,
      id: tabId,
      tabId: tabId,
      tabTitle: tabTitle,
      windowId: windowId,
      icon: icon
    };
  }
  if (command) {
    openObject.command = command;
  }
  OB.Layout.ViewManager.openView(openObject.viewId, openObject);
  return openObject;
};

// ** {{{OB.Utilities.openDirectView}}} **
// Open the correct view for a passed in target definition, coming from a certain source Window.
OB.Utilities.openDirectView = function(sourceWindowId, keyColumn, targetEntity, recordId){

  var actionURL = OB.Application.contextUrl + 'utility/ReferencedLink.html';
  
  var callback = function(response, data, request){
    OB.Utilities.openView(data.windowId, data.tabId, data.tabTitle, data.recordId);
  };
  
  var reqObj = {
    params: {
      Command: 'JSON',
      inpEntityName: targetEntity,
      inpKeyReferenceId: recordId,
      inpwindowId: sourceWindowId,
      inpKeyReferenceColumnName: keyColumn
    },
    callback: callback,
    evalResult: true,
    httpMethod: 'GET',
    useSimpleHttp: true,
    actionURL: actionURL
  };
  var request = isc.RPCManager.sendRequest(reqObj);
};

// ** {{{OB.Utilities.getPromptString}}} **
// Translates a string or array of strings to a string with html returns.
OB.Utilities.getPromptString = function(msg){
  var msgString = '';
  if (!isc.isAn.Array(msg)) {
    msg = [msg];
  }
  for (var i = 0; i < msg.length; i++) {
    msgString += (i > 0 ? '<br>' : '') + msg[i].asHTML();
  }
  return msgString;
};

// ** {{{OB.Utilities.hasUrlParameter}}} **
// Returns true if the url has a certain parameter with a certain value.
OB.Utilities.hasUrlParameter = function(name, value){
  var url = window.document.location.href, checkPoint = url.indexOf(name + '=' +
  value);
  return checkPoint !== -1;
};

// ** {{{OB.Utilities.getLocationUrlWithoutFragment()}}} **
// Returns the url of the page without the fragment (the part starting with #)
OB.Utilities.getLocationUrlWithoutFragment = function(){
  var url = window.document.location.href, checkPoint = url.indexOf('#');
  if (checkPoint !== -1) {
    url = url.substring(0, checkPoint);
  }
  return url;
};

// ** {{{ OB.Utilities.openProcessPopup(/*String*/ processId }}} **
// Opens a separate window for classic OB windows.
// Parameters:
// * {{{url}}}: the url of the html page to open
// * {{{noFrameSet}}}: if true then the page is opened directly without a
// * {{{postParams}}}: if this object is set and noFrameSet is not true, main Framset send
//                     properties of this object to url as POST, other case a GET to url is
//                     performed
// frameset
OB.Utilities.openProcessPopup = function(/* String */url, noFrameSet, postParams, height, width){
  height = height || 450;
  width = width || 625;
  var top = (screen.height - height) / 2;
  var left = (screen.width - width) / 2;
  var adds = 'height=' + height + ', width=' + width + ', left=' + left +
  ', top=' +
  top;
  adds += ', location=0';
  adds += ', scrollbars=1';
  adds += ', status=1';
  adds += ', menubar=0';
  adds += ', toolbar=0';
  adds += ', resizable=1';
  var winPopUp;
  
  if (noFrameSet) {
    winPopUp = window.open(url, 'PROCESS', adds);
  } else {
    winPopUp = window.open('', 'PROCESS', adds);
    var mainFrameSrc = !postParams ? ('src="' + url + '"') : '', html = '<html>' +
    '<frameset cols="0%,100%" frameborder="no" border="0" framespacing="0" rows="*" id="framesetMenu">' +
    '<frame name="frameMenu" scrolling="no" src="' +
    OB.Application.contextUrl +
    'utility/VerticalMenu.html?Command=LOADING" id="paramFrameMenuLoading"></frame>' +
    '<frame name="mainframe" noresize="" ' +
    mainFrameSrc +
    ' id="fieldProcessId"></frame>' +
    '<frame name="hiddenFrame" scrolling="no" noresize="" src=""></frame>' +
    '</frameset>' +
    '</html>';
    
    winPopUp.document.write(html);
    if (postParams) {
      var doc = winPopUp.frames[1].document, frm = doc.createElement('form');
      frm.setAttribute('method', 'post');
      frm.setAttribute('action', url);
      for (var i in postParams) {
        if (postParams.hasOwnProperty(i)) {
          var inp = winPopUp.document.createElement('input');
          inp.setAttribute('type', 'hidden');
          inp.setAttribute('name', i);
          inp.setAttribute('value', postParams[i]);
          frm.appendChild(inp);
        }
      }
      doc.body.appendChild(frm);
      frm.submit();
    }
    winPopUp.document.close();
  }
  OB.Utilities.registerClassicPopupInTestRegistry(url, winPopUp);
  winPopUp.focus();
  return winPopUp;
};

// ** {{{ OB.Utilities.registerClassicPopupInTestRegistry(/*String*/ url, /*Object*/ obj }}} **
// Registers the obj as a classic popup
OB.Utilities.registerClassicPopupInTestRegistry = function(url, obj){
  if (url.startsWith('/')) {
    var index = url.indexOf('/', 1);
    url = url.substring(index + 1);
  }
  OB.TestRegistry.register('org.openbravo.classicpopup.' + url, obj);
};

// ** {{{ OB.Utilities.isNonEmptyString(/*String*/ strValue }}} **
// Returns true if the parameter is a valid String which has length > 0
// Parameters:
// * {{{strValue}}}: the value to check
OB.Utilities.isNonEmptyString = function(/* String */strValue){
  if (!strValue) {
    return false;
  }
  strValue = strValue.replace(/^\s*/, '').replace(/\s*$/, '');
  return strValue.length > 0;
};

// ** {{{ OB.Utilities.areEqualWithTrim(/*String*/ str1, /*String*/ str2}}} **
// Returns true if the two strings are equal after trimming them.
// Parameters:
// * {{{str1}}}: the first String to check
// * {{{str2}}}: the second String to compare
OB.Utilities.areEqualWithTrim = function(/* String */str1, /* String */ str2){
  if (!str1 || !str2) {
    return false;
  }
  str1 = str1.replace(/^\s*/, '').replace(/\s*$/, '');
  str2 = str2.replace(/^\s*/, '').replace(/\s*$/, '');
  return str1 === str2;
};

OB.Utilities.processLogoutQueue = function(){
  var q = OB.Utilities.logoutWorkQueue, qElement, result, tab, tabID;
  
  if (q && q.length === 0) {
    return;
  }
  
  if (typeof arguments[1] === 'string') {
    // The 2nd parameter in a sendRequest callback is the 'data' parameter
    // http://www.smartclient.com/docs/7.0rc2/a/b/c/go.html#type..RPCCallback
    result = eval('(' + arguments[1] + ')');
    if (result && result.oberror) {
      if (result.oberror.type === 'Error') {
        tab = OB.MainView.TabSet.getTab(arguments[2].params.tabID);
        if (tab) {
          tab.pane.getAppFrameWindow().location.href = result.redirect;
        }
        q = [];
        return;
      }
    }
  }
  // Process one element at the time,
  // the save callbacks will empty the queue
  qElement = q.pop();
  if (qElement.func && qElement.args !== undefined) {
    qElement.func.apply(qElement.self, qElement.args);
  }
};

// ** {{{ OB.Utilities.logout }}} **
// Logout from the application, removes server side session info and redirects
// the client to the Login page.
OB.Utilities.logout = function(confirmed){
  if (!confirmed) {
    isc.confirm(OB.I18N.getLabel('OBUIAPP_LogoutConfirmation'), function(ok){
      if (ok) {
        OB.Utilities.logout(true);
      }
    });
    return;
  }
  OB.Utilities.logoutWorkQueue = [];
  var q = OB.Utilities.logoutWorkQueue, i, tabs = OB.MainView.TabSet.tabs, tabsLength = tabs.length, appFrame;
  
  // Push the logout process to the 'end' of the queue
  q.push({
    func: OB.RemoteCallManager.call,
    self: this,
    args: ['org.openbravo.client.application.LogOutActionHandler', {}, {}, function(){
      window.location.href = OB.Application.contextUrl;
    }
]
  });
  
  for (i = 0; i < tabsLength; i++) {
    if (tabs[i].pane.Class === 'OBClassicWindow') {
      appFrame = tabs[i].pane.appFrameWindow ||
      tabs[i].pane.getAppFrameWindow();
      if (appFrame && appFrame.isUserChanges) {
        if (appFrame.validate && !appFrame.validate()) {
          q = [];
          return;
        }
        q.push({
          func: tabs[i].pane.saveRecord,
          self: tabs[i].pane,
          args: [tabs[i].ID, OB.Utilities.processLogoutQueue]
        });
      }
    }
  }
  OB.Utilities.processLogoutQueue();
};

// ** {{{ OB.Utilities.getYesNoDisplayValue }}} **
// Returns the Yes label if the passed value is true, the No label if false.
OB.Utilities.getYesNoDisplayValue = function(/* Boolean */value){
  if (value === true || value === 'true') {
    return OB.I18N.getLabel('OBUISC_Yes');
  } else if (value === false) {
    return OB.I18N.getLabel('OBUISC_No');
  } else {
    return '';
  }
};

// ** {{{ OB.Utilities.getClassicValue }}} **
// Returns the Y if the passed value is true, and N if false.
OB.Utilities.getClassicValue = function(/* Boolean */value){
  if (value) {
    return 'Y';
  } else if (value === false) {
    return 'N';
  } else {
    return '';
  }
};

// ** {{{ OB.Utilities.applyDefaultValues }}} **
//
// Sets the value for each property in the defaultValues in the Fields object
// if it is not set there yet.
//
// Parameters:
// * {{{fields}}}: the current values
// * {{{defaultValues}}}: the default values to set in the fields object (if the
// property is not set in the fields object).
OB.Utilities.applyDefaultValues = function(/* Object */fields, /* Object */ defaultValues){
  var fieldsLength = fields.length;
  for (var i = 0; i < fieldsLength; i++) {
    var field = fields[i];
    for (var property in defaultValues) {
      if (defaultValues.hasOwnProperty(property)) {
        if (!field[property] && field[property] !== false) {
          field[property] = defaultValues[property];
        }
      }
    }
  }
};

// ** {{{ OB.Utilities.addFormInputsToCriteria }}} **
//
// Adds all input values on the standard OB form (document.frmMain) to the
// criteria object.
// 
// Parameters:
// * {{{criteria}}}: the current criteria object.
// * {{{win}}}: (Optional) a reference to the global context (window) where to
// get the document
// and functions are located, if not passed, the current window is used
OB.Utilities.addFormInputsToCriteria = function(/* Object */criteria, /* Window */ win){
  var d = (win && win.document ? win.document : null) || window.document, elementsLength = (d.frmMain ? d.frmMain.elements.length : 0), inputValue = (win && win.inputValue ? win.inputValue : null) ||
  window.inputValue, i, elem;
  
  for (i = 0; i < elementsLength; i++) {
    elem = d.frmMain.elements[i];
    if (elem.name) {
      criteria[elem.name] = inputValue(elem);
    }
  }
  
  // the form can have an organization field,
  // in the server it is used to determine the accessible orgs
  // TODO: make this optional or make it possible to set the orgid html id
  if (d.frmMain.inpadOrgId) {
    criteria[OB.Constants.ORG_PARAMETER] = inputValue(d.frmMain.inpadOrgId);
  }
};

//** {{{ OB.Utilities.postThroughHiddenForm }}} **
//
// Global method to post a request through a hidden form located on:
// org.openbravo.client.application/index.html
//
// Parameters:
// * {{{url}}}: the url to post the request.
// * {{{data}}}: the data to include in the request.

OB.Utilities.postThroughHiddenForm = function(url, data){
  OB.GlobalHiddenForm.setAttribute('action', url);
  
  // remove all children, needs to be done like this as the 
  // children array is getting updated while removing a child  
  while (OB.GlobalHiddenForm.children[0]) {
    OB.GlobalHiddenForm.removeChild(OB.GlobalHiddenForm.children[0]);
  }
  
  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      var field = document.createElement('input');
      field.setAttribute('type', 'hidden');
      field.setAttribute('name', key);
      field.setAttribute('value', data[key]);
      OB.GlobalHiddenForm.appendChild(field);
    }
  }
  
  OB.GlobalHiddenForm.submit();
};

// ** {{{ OB.Utilities.updateSmartClientComponentValue }}} **
//
// Updates the value of a smartclient component.
//
// Parameters:
// * {{{input}}}: the input field (html dom input element)
// * {{{component}}}: the Smartclient component (must have a setValue function)
OB.Utilities.updateSmartClientComponentValue = function(/* Object */input, /* Object */ component){
  component.setValue(input.value);
};

//** {{{ OB.Utilities.fixNull250 }}} **
//
// Transforms null values into '' to adapt display logic to 2.50 behavior.
//
// Parameters:
// * {{{currentValues}}}: array of values
OB.Utilities.fixNull250 = function (currentValues){
  var i;
  for(i in currentValues) { 
    if(currentValues.hasOwnProperty(i) && 
       currentValues[i] === null) {
      currentValues[i] = '';
    }
  }
};

// ** {{{ OB.Utilities.isValidURL}}} **
// Checks if a String is a valid URL
//
// Parameters:
// * {{{url}}}: String url
OB.Utilities.isValidURL = function(url) {
  // Validation based on: http://view.jquery.com/trunk/plugins/validate/jquery.validate.js
  // Note: http://localhost is not a valid URL, http://localhost.localdomain is a valid one
  if(!url) {
    return false;
  }
  return (/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i).test(url);
};