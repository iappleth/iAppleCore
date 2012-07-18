/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global window, B, Backbone , $ */

(function() {

  OB = window.OB || {};
  OB.UI = window.OB.UI || {};

  OB.UI.ButtonTabBrowse = OB.COMP.ToolbarButtonTab.extend({
    tabpanel: '#catalog',
    label: OB.I18N.getLabel('OBPOS_LblBrowse'),
    shownEvent: function(e) {
      this.options.keyboard.hide();
    }
  });

  OB.UI.BrowseCategories = Backbone.View.extend({
    tagName: 'div',
    attributes: {
      'style': 'overflow:auto; height: 612px; margin: 5px;'
    },
    initialize: function() {
      var $child = $('<div/>');
      $child.css({
        'background-color': '#ffffff',
        'color': 'black',
        'padding': '5px'
      });
      this.listCategories = new OB.COMP.ListCategories(this.options);
      $child.append(this.listCategories.$el);
      this.$el.append($child);
    }
  });

  OB.UI.BrowseProducts = Backbone.View.extend({
    tagName: 'div',
    attributes: {
      'style': 'overflow:auto; height: 612px; margin: 5px;'
    },
    initialize: function() {
      var $child = $('<div/>');
      $child.css({
        'background-color': '#ffffff',
        'color': 'black',
        'padding': '5px'
      });
      this.listProducts = new OB.COMP.ListProducts(this.options);
      $child.append(this.listProducts.$el);
      this.$el.append($child);
    }
  });

  OB.UI.TabBrowse = Backbone.View.extend({
    tagName: 'div',
    attributes: {
      'id': 'catalog',
      'class': 'tab-pane'
    },
    initialize: function() {
      var $container, $productListContainer, browseProd, $categoriesListContainer, browseCateg;
      $container = $('<div/>');
      $container.addClass('row-fluid');

      $productListContainer = $('<div/>');
      $productListContainer.addClass('span6');

      browseProd = new OB.UI.BrowseProducts(this.options);
      $productListContainer.append(browseProd.$el);

      $categoriesListContainer = $('<div/>');
      $categoriesListContainer.addClass('span6');
      browseCateg = new OB.UI.BrowseCategories(this.options);
      $categoriesListContainer.append(browseCateg.$el);

      $container.append($productListContainer);
      $container.append($categoriesListContainer);

      this.$el.append($container);

      browseCateg.listCategories.categories.on('selected', function(category) {
        browseProd.listProducts.loadCategory(category);
      }, this);
    }
  });
}());