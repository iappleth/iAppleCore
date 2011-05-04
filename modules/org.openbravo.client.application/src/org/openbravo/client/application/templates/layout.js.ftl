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
 * All portions are Copyright (C) 2010 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
*/

// make sure that the layout is loaded in the parent window if we accidentally end up
// in a child frame
try {
  if (window.parent && window.parent.OB && window.parent.OB.Layout) {
    isc.Log.logDebug("Reloading in parent frame", "OB");
    window.parent.location.href=window.location.href;
  } else if (window.parent.parent && window.parent.parent.OB && window.parent.parent.OB.Layout) {
    isc.Log.logDebug("Reloading in parent.parent frame", "OB");
    window.parent.parent.location.href=window.location.href;
  } else {
    isc.Log.logDebug("loading in own frame", "OB");
  }
} catch(e) {
    // ignoring on purpose
    isc.Log.logDebug("Error when checking parent frame: " + e.message, "OB");
}

// needed for backward compatibility... to open the registration form
function openRegistration() {
  OB.Utilities.openProcessPopup(OB.Application.contextUrl + 'ad_forms/Registration.html', true);
}

isc.Canvas.addClassProperties({neverUsePNGWorkaround:true});

OB.KeyboardManager.KS.setPredefinedKSList('OBUIAPP_KeyboardShortcuts');
OB.KeyboardManager.KS.setPredefinedKSList('UINAVBA_KeyboardShortcuts');
OB.KeyboardManager.KS.setPredefinedKSList('UITOOLB_KeyboardShortcuts');

// should be moved to client.kernel component
// placed here to prevent dependencies of client.kernel on Preferences
OB.Application.startPage = '${data.startPage}';

// the OB.Layout contains everything
OB.Layout = isc.VLayout.create({
  width: '100%',
  height: '100%',
  overflow: 'auto'
});

// create the bar with navigation components
OB.Toolbar = isc.ToolStrip.create({  
  addMembers: function(members) {
    // encapsulate the members
    var newMembers = [], i;
    for (i = 0; i < members.length; i++) {
        // encapsulate in 2 hlayouts to handle correct mouse over/hover and show of box
        var newMember = isc.HLayout.create({layoutLeftMargin: 0, layoutRightMargin: 0, width: '100%', height: '100%', styleName: 'OBNavBarComponent', members:[members[i]]}); 
        newMembers[i] = newMember;
    }    
    // note the array has to be placed in an array otherwise the newMembers
    // is considered to the argument list
    this.Super('addMembers', [newMembers]);
  }
}, OB.MainLayoutStylingProperties.Toolbar);

// the TopLayout has the navigation bar on the left and the logo on the right
OB.TopLayout = isc.HLayout.create({}, OB.MainLayoutStylingProperties.TopLayout);
    
// create the navbar on the left and the logo on the right
OB.TopLayout.CompanyImageLogo = isc.Img.create({
  imageType: 'normal'
}, OB.MainLayoutStylingProperties.CompanyImageLogo);
OB.TestRegistry.register('org.openbravo.client.application.companylogo', OB.TopLayout.CompanyImageLogo);

OB.TopLayout.OpenbravoLogo = isc.Img.create({
    imageType: 'normal',
    imageWidth: '130',
    imageHeight: '32',
    src: OB.Application.contextUrl + 'utility/GetOpenbravoLogo.png',
    getInnerHTML: function() {
        var html = this.Super('getInnerHTML', arguments);
        <#if data.addProfessionalLink>
        return '<a href="http://www.openbravo.com/product/erp/professional/" target="_new">' + html + '</a>';
        <#else>
        return html;
        </#if>
    }
});
OB.TestRegistry.register('org.openbravo.client.application.openbravologo', OB.TopLayout.OpenbravoLogo);    

OB.TopLayout.addMember(OB.Toolbar);
OB.TopLayout.addMember(
        isc.HLayout.create({
            width: '100%',
            align: 'right',
            layoutRightMargin: 10,
            membersMargin: 10,
            defaultLayoutAlign: 'center',
            members: [OB.TopLayout.CompanyImageLogo, OB.TopLayout.OpenbravoLogo]
        })      
);

// add the top part to the main layout
OB.Layout.addMember(OB.TopLayout);

// create some vertical space
OB.Layout.addMember(isc.LayoutSpacer.create({height: 10}));

OB.MainView = isc.VLayout.create({
  width: '100%',
  height: '100%'
});
OB.Layout.addMember(OB.MainView);

OB.MainView.TabSet = isc.OBTabSetMain.create({});

OB.MainView.addMember(OB.MainView.TabSet);

OB.TestRegistry.register('org.openbravo.client.application.mainview', OB.MainView);
OB.TestRegistry.register('org.openbravo.client.application.mainview.tabset', OB.MainView.TabSet);
OB.TestRegistry.register('org.openbravo.client.application.layout', OB.Layout);

OB.Toolbar.addMembers([
<#list data.navigationBarComponents as nbc>
${nbc.jscode}<#if nbc_has_next>,</#if>
</#list>]);

${data.notesDataSource}

// test to see if we can show the heartbeat or registration popups (or not)
(function _OB_checkHeartBeatRegistration() {
 var handleReturn = function(response, data, request) {
     if (data.showInstancePurpose) {
       OB.Layout.ClassicOBCompatibility.Popup.openInstancePurpose();
     } else if (data.showHeartbeat) {
       OB.Layout.ClassicOBCompatibility.Popup.openHeartbeat();
     } else if (data.showRegistration) {
       OB.Layout.ClassicOBCompatibility.Popup.openRegistration();
     }
 };

 OB.RemoteCallManager.call('org.openbravo.client.application.HeartBeatPopupActionHandler', {}, {}, handleReturn);

}());
