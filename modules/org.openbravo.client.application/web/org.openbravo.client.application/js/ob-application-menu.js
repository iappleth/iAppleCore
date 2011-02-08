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


isc.ClassFactory.defineClass('OBApplicationMenuTree', isc.Menu);

isc.OBApplicationMenuTree.addProperties({
  // move the menu a few pixels down and a bit to the left
  placeNear: function(left, top) {
    var parentLeft = this.menuButton.parentElement.getPageLeft();
    return this.Super('placeNear', [parentLeft, top - 1]);
  },

  initWidget: function() {
    var theMenu = this;

    // make sure that the submenus also
    // use the custom getBaseStyle function
    this.submenuInheritanceMask.push('getBaseStyle');

    this.Super('initWidget', arguments);
    isc.Page.registerKey({keyName: 'm', ctrlKey: true, shiftKey: true}, function(key, target) {theMenu.menuButton.showMenu();});
  },

  draw: function() {
    if (this.drawStyle) {
      this.drawStyle();
    }
    this.Super('draw', arguments);
  },

  //getBaseStyle: function (record, rowNum, colNum) {
  //    // todo: implement a javascript trim method
  //    var superBaseStyle = this.Super('getBaseStyle', arguments).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  //    return superBaseStyle + colNum;
  //},

  // overridden to get reliable custom style name
  getBaseStyle: function(record, rowNum, colNum){
    if (!this.getField(colNum)) {
      return '';
    }
    var name = this.getField(colNum).name;
    return this.baseStyle +  name.substr(0, 1).toUpperCase() + name.substr(1) + 'Field';
  },

  autoDraw: false,
  autoFitData: 'both',
  canHover: false,
  showIcons: false,
  selectedHideLayout: null,

  showing: false,

  show: function() {
    this.showing = true;
    this.Super('show', arguments);
    if (this.showStyle) {
      this.showStyle();
    }

    // this code hides the horizontal line between the menu button and the menu
    var layoutContainer = this.menuButton.parentElement;
    if (!this.selectedHideLayout) {
      this.selectedHideLayout = isc.Layout.create({styleName: this.hideButtonLineStyle,
        height: 3, width: layoutContainer.getVisibleWidth() - 2,
        top: layoutContainer.getPageTop() + layoutContainer.getVisibleHeight() - 2,
        left: layoutContainer.getPageLeft() + 1, overflow: 'hidden'});
    }
    this.selectedHideLayout.show();
    this.selectedHideLayout.moveAbove(this);
  },

  hide: function() {
    this.showing = false;
    this.Super('hide', arguments);
    if (this.selectedHideLayout) {
      this.selectedHideLayout.hide();
      this.selectedHideLayout.destroy();
      this.selectedHideLayout = null;
    }
    if (this.hideStyle) {
      this.hideStyle();
    }
  },

  itemClick: function(item, colNum) {
    var isClassicEnvironment = OB.Utilities.useClassicMode(item.windowId);
    var selectedView = null;
    if (item.tabId) {
      selectedView = OB.Utilities.openView(item.windowId, item.tabId, item.title);
      if (selectedView) {
        OB.RecentUtilities.addRecent('UINAVBA_MenuRecentList', selectedView);
      }
      return;
    } else if (item.recentObject) {
      selectedView = item.recentObject;
      if (!selectedView.viewId) {
          selectedView.viewId = 'OBClassicWindow';
      }
    } else if (item.manualUrl) {
      if (item.manualProcessId) {
          selectedView = {viewId: 'OBClassicWindow', obManualURL: item.manualUrl, processId: item.manualProcessId, id: item.manualProcessId, command: 'DEFAULT', tabTitle: item.title};
      } else if (item.processId) {
          var viewName = item.modal?'OBClassicPopupModal':'OBPopupClassicWindow';
          selectedView = {viewId: viewName, obManualURL: item.manualUrl, processId: item.processId, id: item.processId, command: 'BUTTON' + item.processId, tabTitle: item.title};
      } else if (item.formId) {
          selectedView = {viewId: 'OBClassicWindow', obManualURL: item.manualUrl, id: item.manualUrl, formId: item.formId, command: 'DEFAULT', tabTitle: item.title};
      } else {
          selectedView = {viewId: 'OBClassicWindow', obManualURL: item.manualUrl, id: item.manualUrl, command: 'DEFAULT', tabTitle: item.title};
      }
    } else if (item.externalUrl) {
      selectedView = {viewId: 'OBExternalPage', contentsURL: item.externalUrl, id: item.externalUrl, command: 'DEFAULT', tabTitle: item.title};
    }
    OB.RecentUtilities.addRecent('UINAVBA_MenuRecentList', selectedView);
    OB.Layout.ViewManager.openView(selectedView.viewId, selectedView);
  }
});


isc.ClassFactory.defineClass('OBApplicationMenuButton', isc.MenuButton);

isc.OBApplicationMenuButton.addProperties({
  keyboardShortcutId : 'NavBar_MenuButton',

  draw : function() {
    var me = this;
    var ksAction = function() {
      if (!me.menu.showing) {
        isc.EH.clickMaskClick();
      }
      me.click();
      if (!me.menu.showing) {
        if(typeof OB.MainView.TabSet.getSelectedTab().pane.focusTab === 'function') {
          OB.MainView.TabSet.getSelectedTab().pane.focusTab();
        }
      }
    };
    OB.KeyboardManager.KS.set(this.keyboardShortcutId, ksAction);
    this.Super('draw', arguments);
  },

  click: function() {
    if (this.menu.showing) {
      this.menu.hide();
      return false;
    } else {
      this.showMenu();
    }
  },

  initWidget: function() {
    this.menu = isc.OBApplicationMenuTree.create({});
    // tell the menu who we are
    this.menu.menuButton = this;
    this.Super('initWidget', arguments);

    OB.TestRegistry.register('org.openbravo.client.application.navigationbarcomponents.ApplicationMenuButton', this);
    OB.TestRegistry.register('org.openbravo.client.application.navigationbarcomponents.ApplicationMenu', this.menu);
  },

  showMenu: function() {
    this.setMenuItems();

    this.menu.markForRedraw();

    if (this.showMenuStyle) {
      this.showMenuStyle();
    }

    this.Super('showMenu', arguments);
  },

  setMenuItems: function () {
    var recent = OB.RecentUtilities.getRecentValue('UINAVBA_MenuRecentList');
    var recentEntries = [];
    if (recent && recent.length > 0) {
      for (var recentIndex = 0; recentIndex < recent.length; recentIndex++) {
        var recentEntry = recent[recentIndex];
        if (recentEntry) {
            recentEntries[recentIndex] = {title: recentEntry.tabTitle, recentObject: recentEntry/*, _baseStyle: 'OBNavBarComponentMenuItemCell'*/};
        }
      }
      recentEntries[recent.length] = {isSeparator: true};
    }
    this.menu.setData(recentEntries.concat(this.baseData));
  },

  // is used by selenium, creates a scLocator on the basis of a path passed in
  // as arguments, note that the function does not expect an array as this
  // did not seem to be supported by selenium
  getSCLocator : function() {
    var index = 0, path = [];
    for (; index < arguments.length; index++) {
      path[index] = arguments[index];
    }
    index = 0;
    var pathLength = path.getLength();
    var itemIndex = 0, itemsLength = 0, item = null;
    var currentMenu = this.menu;

    // make sure the data is set
    this.setMenuItems();

    var searchedItem = null;
    var searchedIndex = -1;
    var pathSegment;

    for (; index < pathLength; index++) {
      if (searchedItem) {
        if (currentMenu.hasSubmenu(searchedItem)) {
          currentMenu = currentMenu.getSubmenu(searchedItem);
          itemIndex = 0;
          searchedIndex = -1;
          searchedItem = null;
        }
      }

      if (!currentMenu.isDrawn() || !currentMenu.body) {
        // draw, but avoid the call to 'show()' since we don't want to focus on this widget
        currentMenu.setVisibility(isc.Canvas.HIDDEN);
        currentMenu.draw();
      }

      pathSegment = path[index];
      itemsLength = currentMenu.getItems().getLength();

      for (; itemIndex < itemsLength; itemIndex++) {
        item = currentMenu.getItems()[itemIndex];
        if (item.title === pathSegment) {
          searchedItem = item;
          searchedIndex = itemIndex;
          break;
        }
      }
    }

    return 'scLocator=//' + this.getClassName() + '[ID=\"' + currentMenu.ID + '\"]/body/row[' + searchedIndex + ']/col[1]';
    //return currentMenu.body.getTableElement(searchedIndex);
  }
});
