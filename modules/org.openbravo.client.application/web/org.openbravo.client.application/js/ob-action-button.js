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

OB.ActionButton = {};
OB.ActionButton.executingProcess = null;

isc.ClassFactory.defineClass('OBToolbarActionButton', isc.OBToolbarTextButton);

isc.OBToolbarActionButton.addProperties( {
  visible: false,
  
  action : function() {
    this.runProcess();
  },

  runProcess : function() {
    var theView = this.view;
    
    //TODO: Currently autosave is only supported in form view, once it is supported
    //in grid, make use of it here.
    if (this.autosave && theView.viewForm.hasChanged) {
      var actionObject = {
        target: this,
        method: this.doAction,
        parameters: []
      };
      theView.viewForm.autoSave(actionObject);
    } else {
      // If no changes, execute action directly
      this.doAction();
    }
  },
  
  doAction: function(){
    var theView = this.view;
    var popupParams = {
      viewId : 'OBPopupClassicWindow',
      obManualURL : this.obManualURL, 
      processId : this.id,
      id : this.id,
      command : this.command,
      tabTitle : this.title
    };

    var allProperties = theView.getContextInfo(false, true);
    var sessionProperties = theView.getContextInfo(true, true);

    OB.ActionButton.executingProcess = this;

    for ( var param in allProperties) {
      if (allProperties.hasOwnProperty(param)) {
        var value = allProperties[param];
        
        if (typeof value === 'boolean') {
          value = value?'Y':'N';
        }
        
        popupParams.command += '&' + param + '=' + value;
      }
    }

    theView.setContextInfo(sessionProperties, function() {
      OB.Layout.ViewManager.openView('OBPopupClassicWindow', popupParams);
    });
  },
  
  closeProcessPopup: function(newWindow) {
    //Keep current view for the callback function. Refresh and look for tab message.
    var theView = this.view;
    this.view.refresh(function(){
        theView.getTabMessage();
        theView.toolBar.refreshCustomButtons();
      });

    OB.ActionButton.executingProcess = null;
    
    if (newWindow) {
      if (newWindow.indexOf(location.origin) !== -1){
        newWindow = newWindow.substr(location.origin.length);
      }
      
      if (newWindow.startsWith(OB.Application.contextUrl)){
        newWindow = newWindow.substr(OB.Application.contextUrl.length);
      }
      
      if (!newWindow.startsWith('/')){
        newWindow = '/'+newWindow;
      }
      
      var windowParams = {
          viewId : this.title,
          tabTitle: this.title,
          obManualURL : newWindow  
        };
      OB.Layout.ViewManager.openView('OBClassicWindow', windowParams);
    }
  },
  
  refresh: function(record, hide) {
    if (hide || !record) {
      this.hide();
      return;
    }
    
    //TODO: implement display/read only logic
    this.show();
    
    var label = this.labelValue[record[this.property]];
    if (!label){
      label = this.title;
    }
    this.setTitle(label);
  }
  
});
