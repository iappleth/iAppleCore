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
isc.ClassFactory.defineClass('OBStatusBarLeftBar', isc.HLayout);

isc.OBStatusBarLeftBar.addProperties( {
  // to allow setting the active view when clicking in the statusbar
    canFocus : true
  });

isc.ClassFactory.defineClass('OBStatusBarTextLabel', isc.Label);

isc.OBStatusBarTextLabel.addProperties( {
  // to allow setting the active view when clicking in the statusbar
    canFocus : true,
    canSelectText: true
  });

isc.ClassFactory.defineClass('OBStatusBarIconButtonBar', isc.HLayout);

isc.OBStatusBarIconButtonBar.addProperties( {
  // to allow setting the active view when clicking in the statusbar
    canFocus : true
  });

isc.ClassFactory.defineClass('OBStatusBarIconButton', isc.ImgButton);

isc.OBStatusBarIconButton.addProperties( {
  buttonType : null,
  view : null,
  // to allow setting the active view when clicking in the statusbar
  canFocus : true,
  keyboardShortcutId : null,

  // always go through the autosave of the window
  action : function() {
    // to avoid issue that autosave is executed when maximize/minimize views using KS
    if (this.buttonType === 'maximizeRestore') {
      this.doAction();
      return;
    }

    // don't do autosave if new and nothing changed
    if (this.buttonType === 'close' && !this.view.viewForm.hasChanged && this.view.viewForm.isNew) {
      this.view.standardWindow.setDirtyEditForm(null);
    }
    
    // or when maximizing/minimizing
    if (this.buttonType === 'maximize' || this.buttonType === 'restore') {
      this.doAction();
      return;
    }

    var actionObject = {
      target : this,
      method : this.doAction,
      parameters : []
    };
    this.view.standardWindow.doActionAfterAutoSave(actionObject, false);
  },

  doAction : function() {
    var rowNum, newRowNum, newRecord, theButtonBar, i;
    if (this.buttonType === 'previous') {
      this.view.editNextPreviousRecord(false);
    } else if (this.buttonType === 'maximize') {
      this.view.maximize();
    } else if (this.buttonType === 'restore') {
      this.view.restore();
    } else if (this.buttonType === 'next') {
      this.view.editNextPreviousRecord(true);
    } else if (this.buttonType === 'close') {
      if(this.view.viewForm.hasChanged && !this.view.viewForm.validateForm()) {
        return;
      }
      this.view.switchFormGridVisibility();
      this.view.messageBar.hide();
      if (this.view.viewForm.isNew) {
        this.view.refreshChildViews();
      }
    } else if (this.buttonType === 'maximizeRestore') {
      theButtonBar = this.view.statusBar.buttonBar;
      if (theButtonBar.members) {
        for (i = 0; i < theButtonBar.members.length; i++) {
          if (theButtonBar.members[i].buttonType === 'maximize' && !theButtonBar.members[i].isDisabled() && theButtonBar.members[i].isVisible()) {
            theButtonBar.members[i].action();
            break;
          } else if (theButtonBar.members[i].buttonType === 'restore' && !theButtonBar.members[i].isDisabled() && theButtonBar.members[i].isVisible()) {
            theButtonBar.members[i].action();
            break;
          }
        }
      }
    }
  },

  enableShortcut: function() {
    if (this.keyboardShortcutId) {
      var me = this;
      var ksAction = function(){
        if (!me.isDisabled() && me.isVisible()) {
          me.focus();
          me.action();
        } else if (me.forceKeyboardShortcut) {
          me.action();
        }
        return false; //To avoid keyboard shortcut propagation
      };
      OB.KeyboardManager.Shortcuts.set(this.keyboardShortcutId, 'OBViewForm', ksAction);
    }
  },

  disableShortcut: function() {
    if (this.keyboardShortcutId) {
      OB.KeyboardManager.Shortcuts.set(this.keyboardShortcutId, null, function(){
        return true;
      });
    }
  },

  initWidget : function() {
    if (this.initWidgetStyle) {
      this.initWidgetStyle();
    }
    this.Super('initWidget', arguments);
  }

});

isc.ClassFactory.defineClass('OBStatusBar', isc.HLayout);

isc.OBStatusBar.addProperties( {
  view : null,
  iconButtonGroupSpacerWidth : 0, // Set in the skin

  previousButton : null,
  nextButton : null,
  closeButton : null,
  maximizeButton : null,
  restoreButton : null,
  maximizeRestoreButton : null,

  newIcon : null,
  editIcon: null,
  showingIcon : false,
  mode : '',
  isActive : true,
  buttonBar : null,
  buttonBarProperties: {},

  initWidget : function() {
    this.contentLabel = isc.OBStatusBarTextLabel.create( {
      contents : '&nbsp;',
      width : '100%',
      height : '100%'
    });

    this.leftStatusBar = isc.OBStatusBarLeftBar.create({});
    this.leftStatusBar.addMember(this.contentLabel);
    
    this.buttonBar = isc.OBStatusBarIconButtonBar.create(this.buttonBarProperties);
    this.addCreateButtons();
    
    this.savedIcon = isc.Img.create(this.savedIconDefaults);
    this.newIcon = isc.Img.create(this.newIconDefaults);
    this.editIcon = isc.Img.create(this.editIconDefaults);
    this.spacer = isc.LayoutSpacer.create({
      width : 14
    });
    this.leftStatusBar.addMember(this.spacer, 0);

    this.addMembers([this.leftStatusBar, this.buttonBar]);
    this.Super('initWidget', arguments);
  },
  
  addCreateButtons: function() {

    this.previousButton = isc.OBStatusBarIconButton.create( {
      view : this.view,
      buttonType : 'previous',
      keyboardShortcutId : 'StatusBar_Previous',
      prompt : OB.I18N.getLabel('OBUIAPP_PREVIOUSBUTTON')
    });
    this.nextButton = isc.OBStatusBarIconButton.create( {
      view : this.view,
      buttonType : 'next',
      keyboardShortcutId : 'StatusBar_Next',
      prompt : OB.I18N.getLabel('OBUIAPP_NEXTBUTTON')
    });
    this.closeButton = isc.OBStatusBarIconButton.create( {
      view : this.view,
      buttonType : 'close',
      keyboardShortcutId : 'StatusBar_Close',
      prompt : OB.I18N.getLabel('OBUIAPP_CLOSEBUTTON')
    });
    this.maximizeButton = isc.OBStatusBarIconButton.create( {
      view : this.view,
      buttonType : 'maximize',
      prompt : OB.I18N.getLabel('OBUIAPP_MAXIMIZEBUTTON')
    });
    this.restoreButton = isc.OBStatusBarIconButton.create( {
      visibility : 'hidden',
      view : this.view,
      buttonType : 'restore',
      prompt : OB.I18N.getLabel('OBUIAPP_RESTOREBUTTON')
    });
    this.maximizeRestoreButton = isc.OBStatusBarIconButton.create( { // Only for implement 'StatusBar_Maximize-Restore' keyboard shortcut
      visibility : 'hidden',
      view : this.view,
      buttonType : 'maximizeRestore',
      forceKeyboardShortcut : true,
      keyboardShortcutId : 'StatusBar_Maximize-Restore'
    });

    var buttonSpacer = isc.HLayout.create( {
      width : this.iconButtonGroupSpacerWidth
    }), i;

    this.buttonBar.addMembers( [ this.previousButton, this.nextButton, buttonSpacer,
        this.maximizeButton, this.restoreButton, this.closeButton, this.maximizeRestoreButton ]);
    for (i = 0; i < this.buttonBar.members.length; i++) {
      if (this.buttonBar.members[i].buttonType) {
        OB.TestRegistry.register(
            'org.openbravo.client.application.statusbar.button.' + this.buttonBar.members[i].buttonType + '.' + this.view.tabId,
            this.buttonBar.members[i]);
      }
    }
  },

  draw: function(){
    this.Super('draw', arguments);
  },

  visibilityChanged: function(state){
    if (this.isActive) {
      if (state) {
        this.enableShortcuts();
      } else {
        this.disableShortcuts();
      }
    }
  },

  setActive: function(value){
    if (value) {
      this.isActive = true;
      this.enableShortcuts();
    } else {
      this.isActive = false;
      this.disableShortcuts();
    }
  },

  enableShortcuts: function(){
    if (this.buttonBar.members) {
      for (i = 0; i < this.buttonBar.members.length; i++) {
        if (this.buttonBar.members[i].enableShortcut) {
          this.buttonBar.members[i].enableShortcut();
        }
      }
    }
  },

  disableShortcuts: function(){
    if (this.buttonBar.members) {
      for (i = 0; i < this.buttonBar.members.length; i++) {
        if (this.buttonBar.members[i].disableShortcut) {
          this.buttonBar.members[i].disableShortcut();
        }
      }
    }
  },

  addIcon : function(icon) {
      // remove any existing icon or spacer
    this.leftStatusBar.destroyAndRemoveMembers(this.leftStatusBar.members[0]);
    this.leftStatusBar.addMember(icon, 0);
  },

  removeIcon : function() {
    // remove any existing icon or spacer
    this.leftStatusBar.destroyAndRemoveMembers(this.leftStatusBar.members[0]);
    this.leftStatusBar.addMember(this.spacer, 0);
  },

  setNewState : function(isNew) {
    this.previousButton.setDisabled(isNew);
    this.nextButton.setDisabled(isNew);
    if (isNew) {
      this.mode = 'NEW';
      this.setContentLabel(this.newIcon, 'OBUIAPP_New');
    }
  },

  setContentLabel: function(icon, statusCode, arrayTitleField, message) {
    // set the status code before calling updateContentTitle
    this.statusCode = statusCode;
    
    this.updateContentTitle(arrayTitleField, message);

    if (icon) {
      this.addIcon(icon);
    } else {
      this.removeIcon(icon);
    }
  },

  updateContentTitle: function(arrayTitleField, message) {
    var msg = '', i;
    if (!isc.Page.isRTL()) { // LTR mode
      if (this.statusCode) {
        msg += '<span class="' + (this.statusLabelStyle?this.statusLabelStyle:'') + '">' + OB.I18N.getLabel(this.statusCode) + '</span>';
      }
      if (arrayTitleField) {
        for (i = 0; i < arrayTitleField[0].length; i++) {
          if (i !== 0 || this.statusCode) {
            msg += '<span class="' + (this.separatorLabelStyle?this.separatorLabelStyle:'') + '">' + '&nbsp;&nbsp;|&nbsp;&nbsp;' + '</span>';
          }
          msg += '<span class="' + (this.titleLabelStyle?this.titleLabelStyle:'') + '">' + arrayTitleField[0][i] + ': ' + '</span>';
          msg += '<span class="' + (this.fieldLabelStyle?this.fieldLabelStyle:'') + '">' + this.getValidValue(arrayTitleField[1][i]) + '</span>';
        }
      }
      if (message) {
        if (arrayTitleField || this.statusCode) {
          msg += '<span class="' + (this.separatorLabelStyle?this.separatorLabelStyle:'') + '">' + '&nbsp;&nbsp;|&nbsp;&nbsp;' + '</span>';
        }
        msg += '<span class="' + (this.titleLabelStyle?this.titleLabelStyle:'') + '">' + message + '</span>';
      }
    } else { // RTL mode
      if (message) {
        msg += '<span class="' + (this.titleLabelStyle?this.titleLabelStyle:'') + '">' + message + '</span>';
        if (arrayTitleField || this.statusCode) {
          msg += '<span class="' + (this.separatorLabelStyle?this.separatorLabelStyle:'') + '">' + '&nbsp;&nbsp;|&nbsp;&nbsp;' + '</span>';
        }
      }
      if (arrayTitleField) {
        for (i = arrayTitleField[0].length-1; i >= 0; i--) {
          msg += '<span class="' + (this.fieldLabelStyle?this.fieldLabelStyle:'') + '">' + this.getValidValue(arrayTitleField[1][i]) + '</span>';
          msg += '<span class="' + (this.titleLabelStyle?this.titleLabelStyle:'') + '">' + ' :' + arrayTitleField[0][i] + '</span>';
          if (i !== 0 || this.statusCode) {
            msg += '<span class="' + (this.separatorLabelStyle?this.separatorLabelStyle:'') + '">' + '&nbsp;&nbsp;|&nbsp;&nbsp;' + '</span>';
          }
        }
      }
      if (this.statusCode) {
        msg += '<span class="' + (this.statusLabelStyle?this.statusLabelStyle:'') + '">' + OB.I18N.getLabel(this.statusCode) + '</span>';
      }
    }

    if (this.labelOverflowHidden) {
      msg = '<nobr>' + msg + '</nobr>';
    }
    this.contentLabel.setContents(msg);
  },
  
  getValidValue: function(value) {
    var undef;
    if (value === null || value === undef) {
      return '&nbsp;&nbsp;&nbsp;';
    }
    return value;
  },

  destroy: function () {
    if(this.savedIcon) {
      this.savedIcon.destroy();
      this.savedIcon = null;
    }

    if(this.newIcon) {
      this.newIcon.destroy();
      this.newIcon = null;
    }

    if(this.editIcon) {
      this.editIcon.destroy();
      this.editIcon = null;
    }
    this.Super('destroy', arguments);
  }
});
