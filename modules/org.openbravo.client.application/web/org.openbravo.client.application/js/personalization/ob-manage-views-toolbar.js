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
 * Contributor(s): ___________
 ************************************************************************
 */

// = Manage views toolbar buttons =
// Registers button to open the menu which shows the available views
// and the save/delete option (if enabled).
(function () {
  var manageViewButtonProperties = {
    
    initWidget: function() {
      this.menu = isc.Menu.create({
        button: this,

        // overridden to get much simpler custom style name
        getBaseStyle: function(record, rowNum, colNum){
          if (colNum === 0) {
            return this.baseStyle + 'Icon';
          }
          if (record.showSeparator) {
            return this.baseStyle + 'Separator';
          }
          return this.baseStyle;
        },

        itemClick: function(item, colNum) {
          if (item.viewDefinition) {
            OB.Personalization.applyViewDefinition(item.personalizationId, item.viewDefinition, this.button.view.standardWindow);
          } else {
            item.doClick(this.button.view.standardWindow);
          }
        }      
      }, OB.Styles.Personalization.Menu);
    },
    
    showMenu: function() {      
      if (!OB.Utilities.checkProfessionalLicense(
          OB.I18N.getLabel('OBUIAPP_ActivateMessagePersonalization'))) {
        return;
      }
      return this.Super('showMenu', arguments);
    },
    
    // shows the menu with the available views and the save 
    // and delete option
    action: function() {
      var data = [], icon, i, undef, view,
        standardWindow = this.view.standardWindow,
        adminLevel = false, length,
        personalization = standardWindow.getClass().personalization, 
        views = personalization && personalization.views ? personalization.views : [],
        canDelete = false;
      
      if (!OB.Utilities.checkProfessionalLicense(
          OB.I18N.getLabel('OBUIAPP_ActivateMessagePersonalization'))) {
        return;
      }
      
      // create the list of current views to show
      length = views.length;
      for (i = 0; i < length; i++) {
        view = views[i];
        canDelete = view.canEdit || canDelete;
        
        if (standardWindow.selectedPersonalizationId && view.personalizationId === standardWindow.selectedPersonalizationId) {
          icon = this.menu.itemIcon;
        } else {
          icon = null;
        }
        
        data.push({title: view.viewDefinition.name, icon: icon, personalizationId: view.personalizationId, viewDefinition: view.viewDefinition});        
      }
      
      // compute the menu items, only if the user is allowed
      // to personalize
      if (this.isWindowPersonalizationAllowed()) {
        
        if (standardWindow.getClass().personalization && standardWindow.getClass().personalization.formData) {
          formData = standardWindow.getClass().personalization.formData;
          if (formData.clients || formData.orgs || formData.roles) {
            adminLevel = true;
          }
        }
        
        data.push({title: OB.I18N.getLabel('OBUIAPP_SaveView'), 
          showSeparator: data.length > 0,
          doClick: function(standardWindow) {
            var popup = isc.OBPopup.create({
                standardWindow: standardWindow
              }, 
              OB.Personalization.ManageViewsPopupProperties,
              OB.Personalization.ManageViewsPopupPropertiesSave,
              adminLevel ? 
                OB.Styles.Personalization.saveViewPopupLarge :
                OB.Styles.Personalization.saveViewPopupSmall);
            popup.show();
          }});

        // if there are views allow to choose a default
        if (views.length > 0) {
          data.push({title: OB.I18N.getLabel('OBUIAPP_SetDefaultView'),
            standardWindow: standardWindow,
            doClick: function(standardWindow) {
              var popup = isc.OBPopup.create({
                  standardWindow: standardWindow
                }, 
                OB.Personalization.ManageViewsPopupProperties,
                OB.Personalization.ManageViewsPopupPropertiesDefault,
                OB.Styles.Personalization.deleteViewPopup);
              popup.show();
            }});
        }
        
        // only show the delete option if there are deletable options        
        if (canDelete) {
          data.push({title: OB.I18N.getLabel('OBUIAPP_DeleteView'),
            standardWindow: standardWindow,
            doClick: function(standardWindow) {
              var popup = isc.OBPopup.create({
                  standardWindow: standardWindow
                }, 
                OB.Personalization.ManageViewsPopupProperties,
                OB.Personalization.ManageViewsPopupPropertiesDelete,
                OB.Styles.Personalization.deleteViewPopup);
              popup.show();
            }});
        }
      }
      
      if (data.length === 0) {
        // this can not really happen, the button should be disabled
        return;
      }
      
      this.menu.setData(data);
      
      this.Super('action', arguments);
    },
    disabled: false,
    buttonType: 'manageviews',
    prompt: OB.I18N.getLabel('OBUIAPP_ManageViews_Toolbar_Button'),
    updateState: function(){
      this.resetBaseStyle();
      
      // no items are shown in this case
      if (!this.isWindowPersonalizationAllowed() && (!this.view.standardWindow.getClass().personalization || 
          !this.view.standardWindow.getClass().personalization.views || this.view.standardWindow.getClass().personalization.views.length === 0)) {
        this.setDisabled(true);
      } else {
        this.setDisabled(false);
      }
      
      this.show();
    },
    isWindowPersonalizationAllowed: function() {
      var propValue, undef;
      if (this.userWindowPersonalizationAllowed === undef) {
        propValue = OB.PropertyStore.get('OBUIAPP_WindowPersonalization_Override', 
            this.view.standardWindow ? this.view.standardWindow.windowId : null);
        if (propValue === 'false' || propValue === 'N') {
          this.userWindowPersonalizationAllowed = false;
        } else {
          this.userWindowPersonalizationAllowed = true;
        }
      }
      return this.userWindowPersonalizationAllowed;
    },
    keyboardShortcutId: 'ToolBar_ManageViews'
  };
  
  OB.ToolbarRegistry.registerButton(manageViewButtonProperties.buttonType, 
      isc.OBToolbarIconButton, manageViewButtonProperties, 320, null);
 
}());
