/*global B , Backbone, _, enyo */

/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

(function() {

  OB = window.OB || {};
  OB.COMP = window.OB.COMP || {};

  OB.COMP.SearchProduct = Backbone.View.extend({
    initialize: function() {
      var me = this;

      this.receipt = this.options.modelorder;

      this.categories = new OB.Collection.ProductCategoryList();
      this.products = new OB.Collection.ProductList();

      this.products.on('click', function(model) {
        this.receipt.addProduct(model);
      }, this);

      this.receipt.on('clear', function() {
        this.productname.val('');
        this.productcategory.val('');
        //A filter should be set before show products. -> Big data!!
        //this.products.exec({priceListVersion: OB.POS.modelterminal.get('pricelistversion').id, product: {}});
      }, this);

      this.component = B({
        kind: B.KindJQuery('div'),
        attr: {
          'class': 'row-fluid'
        },
        content: [{
          kind: B.KindJQuery('div'),
          attr: {
            'class': 'span12'
          },
          content: [{
            kind: B.KindJQuery('div'),
            attr: {
              'class': 'row-fluid',
              'style': 'border-bottom: 1px solid #cccccc;'
            },
            content: [{
              kind: B.KindJQuery('div'),
              attr: {
                'class': 'span12'
              },
              content: [{
                kind: B.KindJQuery('div'),
                attr: {
                  'style': 'padding: 10px 10px 5px 10px'
                },
                content: [{
                  kind: B.KindJQuery('div'),
                  attr: {
                    'style': 'display: table;'
                  },
                  content: [{
                    kind: B.KindJQuery('div'),
                    attr: {
                      'style': 'display: table-cell; width: 100%;'
                    },
                    content: [{
                      kind: OB.COMP.SearchInput,
                      id: 'productname',
                      attr: {
                        'type': 'text',
                        'xWebkitSpeech': 'x-webkit-speech',
                        'className': 'input',
                        'style': 'width: 100%;',
                        'clickEvent': function(e) {
                          if (e && e.keyCode === 13) {
                            me.searchAction();
                            return false;
                          } else {
                            return true;
                          }
                        }
                      }
                    }]
                  }, {
                    kind: B.KindJQuery('div'),
                    attr: {
                      'style': 'display: table-cell;'
                    },
                    content: [{
                      kind: OB.COMP.SmallButton,
                      attr: {
                        'className': 'btnlink-gray',
                        'icon': 'btn-icon-small btn-icon-clear',
                        'style': 'width: 100px; margin: 0px 5px 8px 19px;',
                        'clickEvent': function() {
                          this.$el.parent().prev().children().val('');
                          me.searchAction();
                        }
                      }
                    }]
                  }, {
                    kind: B.KindJQuery('div'),
                    attr: {
                      'style': 'display: table-cell;'
                    },
                    content: [{
                      kind: OB.COMP.SmallButton,
                      attr: {
                        'className': 'btnlink-yellow',
                        'icon': 'btn-icon-small btn-icon-search',
                        'style': 'width: 100px; margin: 0px 0px 8px 5px;',
                        'clickEvent': function() {
                          me.searchAction();
                        }
                      }
                    }]
                  }]
                }, {
                  kind: B.KindJQuery('div'),
                  attr: {
                    'style': 'margin: 5px 0px 0px 0px;'
                  },
                  content: [{
                    kind: OB.UI.ListView('select'),
                    id: 'productcategory',
                    attr: {
                      collection: this.categories,
                      className: 'combo',
                      style: 'width: 100%',
                      renderHeader: Backbone.View.extend({
                        tagName: 'option',
                        initialize: function() {
                          this.$el.attr('value', '').text(OB.I18N.getLabel('OBPOS_SearchAllCategories'));
                        }
                      }),
                      renderLine: Backbone.View.extend({
                        tagName: 'option',
                        initialize: function() {
                          this.model = this.options.model;
                        },
                        render: function() {
                          this.$el.attr('value', this.model.get('id')).text(this.model.get('_identifier'));
                          return this;
                        }
                      })
                    }
                  }]
                }]
              }]
            }]
          },

          {
            kind: B.KindJQuery('div'),
            attr: {
              'class': 'row-fluid',
              'style': 'height: 483px; overflow: auto;'
            },
            content: [{
              kind: B.KindJQuery('div'),
              attr: {
                'class': 'span12'
              },
              content: [{
                kind: B.KindJQuery('div'),
                content: [{
                  kind: OB.UI.TableView,
                  id: 'tableview',
                  attr: {
                    collection: this.products,
                    renderEmpty: OB.COMP.RenderEmpty,
                    renderLine: OB.COMP.RenderProduct
                  }
                }]
              }]
            }]
          }]
        }]
      });
      this.$el = this.component.$el;
      this.productname = this.component.context.productname.$el;
      this.searchAction = function() {
        var criteria = {};

        function successCallbackPrices(dataPrices, dataProducts) {
          if (dataPrices && dataPrices.length !== 0) {
            _.each(dataPrices.models, function(currentPrice) {
              if (dataProducts.get(currentPrice.get('product'))) {
                dataProducts.get(currentPrice.get('product')).set('price', currentPrice);
              }
            });
            _.each(dataProducts.models, function(currentProd) {
              if (currentProd.get('price') === undefined) {
                var price = new OB.Model.ProductPrice({
                  'listPrice': 0
                });
                dataProducts.get(currentProd.get('id')).set('price', price);
                OB.UTIL.showWarning("No price found for product " + currentProd.get('_identifier'));
              }
            });
          } else {
            OB.UTIL.showWarning("OBDAL No prices found for products");
            _.each(dataProducts.models, function(currentProd) {
              var price = new OB.Model.ProductPrice({
                'listPrice': 0
              });
              currentProd.set('price', price);
            });
          }
          me.products.reset(dataProducts.models);
        }

        function errorCallback(tx, error) {
          OB.UTIL.showError("OBDAL error: " + error);
        }

        function successCallbackProducts(dataProducts) {
          if (dataProducts && dataProducts.length > 0) {
            criteria = {
              'priceListVersion': OB.POS.modelterminal.get('pricelistversion').id
            };
            OB.Dal.find(OB.Model.ProductPrice, criteria, successCallbackPrices, errorCallback, dataProducts);
          } else {
            OB.UTIL.showWarning("No products found");
            me.products.reset();
          }
        }

        if (me.productname.val() && me.productname.val() !== '') {
          criteria._identifier = {
            operator: OB.Dal.CONTAINS,
            value: me.productname.val()
          };
        }
        if (me.productcategory.val() && me.productcategory.val() !== '') {
          criteria.productCategory = me.productcategory.val();
        }
        OB.Dal.find(OB.Model.Product, criteria, successCallbackProducts, errorCallback);
      };
      this.productcategory = this.component.context.productcategory.$el;
      this.tableview = this.component.context.tableview;

      function errorCallback(tx, error) {
        OB.UTIL.showError("OBDAL error: " + error);
      }

      function successCallbackCategories(dataCategories, me) {
        if (dataCategories && dataCategories.length > 0) {
          me.categories.reset(dataCategories.models);
        } else {
          me.categories.reset();
        }
      }

      OB.Dal.find(OB.Model.ProductCategory, null, successCallbackCategories, errorCallback, this);
    }
  });

  enyo.kind({
    name: 'OB.UI.SearchProduct',
    components: [{
      classes: 'row-fluid',
      components: [{
        classes: 'span12',
        components: [{
          classes: 'row-fluid',
          style: 'border-bottom: 1px solid #cccccc;',
          components: [{
            classes: 'span12',
            components: [{
              style: 'padding: 10px 10px 5px 10px;',
              components: [{
                style: 'display: table;',
                components: [{
                  style: 'display: table-cell; width: 100%;',
                  components: [{
                    kind: 'OB.UI.SearchInput',
                    name: 'productname',
                    classes: 'input',
                    attributes: {
                      'x-webkit-speech': 'x-webkit-speech'
                    },
                    style: 'width: 100%;',
                    onchange: 'searchAction'
                  }]
                }, {
                  style: 'display: table-cell;',
                  components: [{
                    kind: 'OB.UI.SmallButton',
                    classes: 'btnlink-gray btn-icon-small btn-icon-clear',
                    style: 'width: 100px; margin: 0px 5px 8px 19px;',
                    ontap: 'clearAction'
                  }]
                }, {
                  style: 'display: table-cell;',
                  components: [{
                    kind: 'OB.UI.SmallButton',
                    classes: 'btnlink-yellow btn-icon-small btn-icon-search',
                    style: 'width: 100px; margin: 0px 0px 8px 5px;',
                    ontap: 'searchAction'
                  }]
                }]
              }, {
                style: 'margin: 5px 0px 0px 0px;',
                components: [{
                  kind: 'OB.UI.List',
                  name: 'productcategory',
                  classes: 'combo',
                  style: 'width: 100%',
                  renderHeader: enyo.kind({
                    kind: 'enyo.Option',
                    initComponents: function() {
                      this.inherited(arguments);
                      this.setValue('__all__');
                      this.setContent(OB.I18N.getLabel('OBPOS_SearchAllCategories'));
                    }
                  }),
                  renderLine: enyo.kind({
                    kind: 'enyo.Option',
                    initComponents: function() {
                      this.inherited(arguments);
                      this.setValue(this.model.get('id'));
                      this.setContent(this.model.get('_identifier'));
                    }
                  }),
                  renderEmpty: 'enyo.Control'
                }]
              }]
            }]
          }, {
            classes: 'row-fluid',
            style: 'height: 483px; overflow: auto;',
            components: [{
              classes: 'span12',
              components: [{
                kind: 'OB.UI.Table',
                name: 'products',
                renderEmpty: 'OB.UI.RenderEmpty',
                renderLine: 'OB.UI.RenderProduct'
              }]
            }]
          }]
        }]
      }]
    }],
    init: function() {
      var me = this,
          receipt = this.owner.owner.owner.model.get('order');
      this.inherited(arguments);
      this.categories = new OB.Collection.ProductCategoryList();
      this.products = new OB.Collection.ProductList();
      this.$.productcategory.setCollection(this.categories);
      this.$.products.setCollection(this.products);

      this.products.on('click', function(model) {
        receipt.addProduct(model);
      });

      receipt.on('clear', function() {
        this.$.productname.setContent('');
        this.$.productcategory.setContent('');
        //A filter should be set before show products. -> Big data!!
        //this.products.exec({priceListVersion: OB.POS.modelterminal.get('pricelistversion').id, product: {}});
      }, this);

      function errorCallback(tx, error) {
        OB.UTIL.showError("OBDAL error: " + error);
      }

      function successCallbackCategories(dataCategories, me) {
        if (dataCategories && dataCategories.length > 0) {
          me.categories.reset(dataCategories.models);
        } else {
          me.categories.reset();
        }
      }

      OB.Dal.find(OB.Model.ProductCategory, null, successCallbackCategories, errorCallback, this);
    },
    clearAction: function() {
      this.$.productname.setValue('');
      this.searchAction();
    },
    searchAction: function() {
      var criteria = {},
          me = this;

      function successCallbackPrices(dataPrices, dataProducts) {
        if (dataPrices) {
          enyo.forEach(dataPrices.models, function(currentPrice) {
            if (dataProducts.get(currentPrice.get('product'))) {
              dataProducts.get(currentPrice.get('product')).set('price', currentPrice);
            }
          });
          enyo.forEach(dataProducts.models, function(currentProd) {
            if (currentProd.get('price') === undefined) {
              var price = new OB.Model.ProductPrice({
                'listPrice': 0
              });
              dataProducts.get(currentProd.get('id')).set('price', price);
              OB.UTIL.showWarning("No price found for product " + currentProd.get('_identifier'));
            }
          });
        } else {
          OB.UTIL.showWarning("OBDAL No prices found for products");
          enyo.forEach(dataProducts.models, function(currentProd) {
            var price = new OB.Model.ProductPrice({
              'listPrice': 0
            });
            currentProd.set('price', price);
          });
        }
        me.products.reset(dataProducts.models);
        me.products.trigger('reset');
      }

      function errorCallback(tx, error) {
        OB.UTIL.showError("OBDAL error: " + error);
      }

      // Initializing combo of categories without filtering

      function successCallbackProducts(dataProducts) {
        if (dataProducts && dataProducts.length > 0) {
          criteria = {
            'priceListVersion': OB.POS.modelterminal.get('pricelistversion').id
          };
          OB.Dal.find(OB.Model.ProductPrice, criteria, successCallbackPrices, errorCallback, dataProducts);
        } else {
          OB.UTIL.showWarning("No products found");
          me.products.reset();
        }
      }

      if (me.$.productname.getValue()) {
        criteria._identifier = {
          operator: OB.Dal.CONTAINS,
          value: me.$.productname.getValue()
        };
      }
      console.log('search', me.$.productname.getValue(), me.$.productcategory.getValue());
      if (me.$.productcategory.getValue() && me.$.productcategory.getValue() !== '__all__') {
        criteria.productCategory = me.$.productcategory.getValue();
      }
      OB.Dal.find(OB.Model.Product, criteria, successCallbackProducts, errorCallback);
    }
  });
}());