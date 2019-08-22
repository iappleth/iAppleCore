/*
 ************************************************************************************
 * Copyright (C) 2012-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global enyo, _ */
enyo.kind({
  name: 'OB.UI.RenderProduct',
  kind: 'OB.UI.listItemButton',
  classes: 'obUiRenderProduct',
  avoidDoubleClick: false,
  resizeHandler: function() {
    if (!this.model) {
      return true;
    }
    if (!this.debounceRedraw) {
      this.debounceRedraw = _.debounce(this.drawPriceBasedOnSize, 500);
    }
    this.inherited(arguments);
    this.debounceRedraw();
    return true;
  },
  components: [
    {
      classes: 'obUiRenderProduct-container1',
      components: [
        {
          name: 'productImgContainer',
          classes: 'obUiRenderProduct-container1-productImgContainer',
          components: [
            {
              name: 'productImage',
              classes: 'obUiRenderProduct-productImgContainer-productImage',
              components: [
                {
                  classes: 'obUiRenderProduct-productImage-container1',
                  components: [
                    {
                      tag: 'div',
                      classes:
                        'obUiRenderProduct-productImage-container1-container1',
                      contentType: 'image/png',
                      components: [
                        {
                          tag: 'img',
                          name: 'icon',
                          classes:
                            'obUiRenderProduct-productImage-container1-container1-icon'
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              kind: 'OB.UI.Thumbnail',
              name: 'thumbnail',
              classes: 'obUiRenderProduct-productImgContainer-thumbnail'
            }
          ]
        },
        {
          classes: 'obUiRenderProduct-container1-container2',
          components: [
            {
              classes: 'obUiRenderProduct-container1-container2-container1',
              components: [
                {
                  name: 'identifierContainer',
                  classes:
                    'obUiRenderProduct-container1-container2-container1-identifierContainer',
                  components: [
                    {
                      name: 'identifier',
                      classes:
                        'obUiRenderProduct-identifierContainer-identifier'
                    },
                    {
                      name: 'filterAttr',
                      classes:
                        'obUiRenderProduct-identifierContainer-filterAttr',
                      allowHtml: true
                    }
                  ]
                },
                {
                  classes:
                    'obUiRenderProduct-container1-container2-container1-container2',
                  components: [
                    {
                      kind: 'OB.UI.ProductContextMenu',
                      name: 'btnProductContextMenu',
                      classes:
                        'obUiRenderProduct-container1-container2-container1-container2-btnProductContextMenu'
                    }
                  ]
                }
              ]
            },
            {
              classes: 'obUiRenderProduct-container1-container2-container2',
              components: [
                {
                  name: 'icons',
                  classes:
                    'obUiRenderProduct-container1-container2-container2-icons',
                  minWidth: 0,
                  components: [
                    {
                      name: 'bestseller',
                      kind: 'OB.UI.Thumbnail.Bestseller',
                      classes: 'obUiRenderProduct-icons-bestseller',
                      default: 'img/iconBestsellerSmall.svg',
                      showing: false
                    }
                  ]
                },
                {
                  name: 'priceBox',
                  classes:
                    'obUiRenderProduct-container1-container2-container2-priceBox',
                  components: [
                    {
                      classes: 'obUiRenderProduct-priceBox-container1',
                      components: [
                        {
                          name: 'price',
                          classes: 'obUiRenderProduct-priceBox-container1-price'
                        },
                        {
                          name: 'priceList',
                          classes:
                            'obUiRenderProduct-priceBox-container1-priceList'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'generic',
      classes: 'obUiRenderProduct-generic',
      showing: false
    },
    {
      name: 'bottonLine',
      classes: 'obUiRenderProduct-bottonLine'
    }
  ],
  drawPriceBasedOnSize: function() {
    var shouldResizeWork =
      (enyo.Panels.isScreenNarrow() && document.body.clientWidth <= 466) ||
      (!enyo.Panels.isScreenNarrow() && document.body.clientWidth <= 925);
    var hideProductImages =
      OB.MobileApp.model.hasPermission('OBPOS_HideProductImages', true) ||
      OB.MobileApp.model.hasPermission(
        'OBPOS_HideProductImagesInSearchAndBrowse',
        true
      );
    var searchTab = false;

    function getFontSize(price) {
      var fontSize = '16px;';
      if (price.length === 9) {
        fontSize = '15px;';
        if (enyo.Panels.isScreenNarrow() && document.body.clientWidth <= 410) {
          fontSize = '14px;';
        }
      } else if (price.length === 10) {
        fontSize = '14px;';
        if (enyo.Panels.isScreenNarrow() && document.body.clientWidth <= 410) {
          fontSize = '13px;';
        }
      } else if (price.length === 11) {
        fontSize = '13px;';
        if (enyo.Panels.isScreenNarrow() && document.body.clientWidth <= 410) {
          fontSize = '12px;';
        }
      } else if (price.length > 11) {
        fontSize = '12px;';
        if (!enyo.Panels.isScreenNarrow()) {
          if (
            document.body.clientWidth >= 840 &&
            document.body.clientWidth <= 925
          ) {
            fontSize = '13px;';
          } else if (document.body.clientWidth < 840) {
            fontSize = '11px;';
          }
        } else {
          if (
            document.body.clientWidth <= 425 &&
            document.body.clientWidth > 400
          ) {
            fontSize = '11px;';
          } else if (document.body.clientWidth <= 400) {
            fontSize = '10px;';
          }
        }
      }
      return fontSize;
    }
    if (
      _.isUndefined(this.$.price) ||
      _.isUndefined(this.$.priceList) ||
      _.isUndefined(this.model)
    ) {
      //Probably this event was raised during destroy and we want to ignore it.
      return true;
    }
    if (this.id.indexOf('searchCharacteristic') !== -1) {
      searchTab = true;
    }
    if (
      this.model.get('currentStandardPrice') &&
      this.model.get('currentStandardPrice') !== 'undefined'
    ) {
      // This inline style is allowed
      this.$.priceList.addStyles('font-size: 16px;');
      if (
        OB.MobileApp.model.hasPermission(
          'ShowStandardPriceOnSearchAndBrowse',
          true
        )
      ) {
        if (
          OB.I18N.formatCurrency(this.model.get('currentStandardPrice'))
            .length > 11 &&
          !searchTab &&
          !hideProductImages &&
          shouldResizeWork
        ) {
          // This inline style is allowed
          this.$.price.addStyles(
            'font-size: ' +
              getFontSize(
                OB.I18N.formatCurrency(this.model.get('currentStandardPrice'))
              )
          );
        }
        this.$.priceList.setContent(
          OB.I18N.formatCurrency(this.model.get('currentStandardPrice'))
        );
      }
      if (this.model.get('standardPrice')) {
        // This inline style is allowed
        this.$.price.addStyles('font-size: 16px;');
        if (!searchTab && !hideProductImages && shouldResizeWork) {
          // This inline style is allowed
          this.$.price.addStyles(
            'font-size: ' +
              getFontSize(
                OB.I18N.formatCurrency(this.model.get('standardPrice'))
              )
          );
        }
      }
      if (this.model.get('crossStore')) {
        this.$.price.setContent('?.??');
      } else {
        this.$.price.setContent(
          OB.I18N.formatCurrency(this.model.get('standardPrice'))
        );
      }
    } else {
      if (this.model.get('standardPrice')) {
        // This inline style is allowed
        this.$.price.addStyles('font-size: 16px;');
        if (!searchTab && !hideProductImages && shouldResizeWork) {
          // This inline style is allowed
          this.$.price.addStyles(
            'font-size: ' +
              getFontSize(
                OB.I18N.formatCurrency(this.model.get('standardPrice'))
              )
          );
        }
      }
      if (this.model.get('crossStore')) {
        this.$.price.setContent('?.??');
      } else {
        this.$.price.setContent(
          OB.I18N.formatCurrency(this.model.get('standardPrice'))
        );
      }
    }
    // Context menu
    if (
      this.model.get('productType') !== 'I' ||
      this.$.btnProductContextMenu.$.menu.itemsCount === 0
    ) {
      this.$.btnProductContextMenu.hide();
      this.$.identifierContainer.removeClass(
        'obUiRenderProduct-identifierContainer_withWidth'
      );
    } else {
      this.$.btnProductContextMenu.setModel(this.model);
      this.$.identifierContainer.addClass(
        'obUiRenderProduct-identifierContainer_withWidth'
      );
      if (
        this.model.get('showchdesc') &&
        !this.model.get('characteristicDescription')
      ) {
        this.addClass('obUiRenderProduct_showchdesc');
      } else {
        this.removeClass('obUiRenderProduct_showchdesc');
      }
    }
  },
  initComponents: function() {
    this.inherited(arguments);
    // Build filter info from filter attributes
    var filterTxt = '',
      searchTab = false,
      filterAttr = this.model.get('filterAttr'),
      maxWidthCalc;

    if (filterAttr && _.isArray(filterAttr) && filterAttr.length > 0) {
      filterAttr.forEach(function(attr) {
        if (filterTxt !== '') {
          filterTxt = filterTxt + attr.separator;
        }
        filterTxt = filterTxt + attr.value;
      });
    }
    if (this.id.indexOf('searchCharacteristic') !== -1) {
      searchTab = true;
    }
    this.$.identifier.setContent(this.setIdentifierContent());
    this.$.filterAttr.setContent(filterTxt);
    if (this.model.get('showchdesc')) {
      this.$.bottonLine.setContent(this.model.get('characteristicDescription'));
    }
    this.drawPriceBasedOnSize(searchTab);

    if (OB.MobileApp.model.get('permissions')['OBPOS_retail.productImages']) {
      if (this.model.get('imgId')) {
        this.$.icon.setSrc(OB.UTIL.getMinimizedImageURL(this.model.get('id')));
        this.$.icon.setAttribute(
          'onerror',
          'if (this.src != "../org.openbravo.mobile.core/assets/img/box.png") this.src = "../org.openbravo.mobile.core/assets/img/box.png"; '
        );
      } else {
        this.$.icon.setSrc('../org.openbravo.mobile.core/assets/img/box.png');
      }
      this.$.thumbnail.hide();
    } else {
      this.$.thumbnail.setImg(this.model.get('img'));
      this.$.icon.parent.hide();
    }

    /* TODO: Check if it is still needed or can be refactored using only CSS */
    if (this.owner.owner.owner.owner.owner.name === 'browseProducts') {
      if (enyo.Panels.isScreenNarrow()) {
        maxWidthCalc = parseInt(document.body.clientWidth / 2, 10) - 213;
      } else {
        maxWidthCalc = parseInt(document.body.clientWidth / 4, 10) - 213;
      }
    } else {
      if (enyo.Panels.isScreenNarrow()) {
        maxWidthCalc = parseInt(document.body.clientWidth / 2, 10) - 213;
      } else {
        maxWidthCalc = parseInt(document.body.clientWidth, 10) - 363;
      }
    }
    if (maxWidthCalc < 0) {
      maxWidthCalc = 0;
    }
    maxWidthCalc =
      Math.floor(maxWidthCalc / 20) * 20 >= 20
        ? Math.floor(maxWidthCalc / 20) * 20
        : 20;
    // This inline style is allowed
    this.$.icons.addStyles('max-width: ' + maxWidthCalc + 'px');
    if (this.model.get('bestseller') !== true) {
      // This inline style is allowed
      this.$.icons.applyStyle('min-width', this.$.icons.minWidth + 'px');
      this.$.icons.addClass('u-noWidth');
      this.$.bestseller.removeClass('u-blockDisplay');
      this.$.bestseller.$.image.hide();
    } else {
      this.$.icons.minWidth += 20;
      // This inline style is allowed
      this.$.icons.applyStyle('min-width', this.$.icons.minWidth + 'px');
      this.$.icons.removeClass('u-noWidth');
      this.$.bestseller.addClass('u-blockDisplay');
    }

    if (
      OB.MobileApp.model.hasPermission('OBPOS_HideProductImages', true) ||
      OB.MobileApp.model.hasPermission(
        'OBPOS_HideProductImagesInSearchAndBrowse',
        true
      )
    ) {
      this.$.productImgContainer.hide();
    }

    if (this.model.get('isGeneric')) {
      this.$.generic.setContent(OB.I18N.getLabel('OBMOBC_LblGeneric'));
      this.$.generic.show();
    }
    OB.UTIL.HookManager.executeHooks(
      'OBPOS_RenderProduct',
      {
        model: this
      },
      function(args) {
        if (args.model.$.icons.children.length) {
          args.model.$.icons.minWidth = OB.DEC.add(
            args.model.$.icons.minWidth,
            OB.DEC.mul(args.model.$.icons.children.length, 20)
          );
          args.model.$.icons.applyStyle(
            'min-width',
            args.model.$.icons.minWidth + 'px'
          );
        }
      }
    );
  },
  setIdentifierContent: function() {
    return this.model.get('_identifier');
  }
});

enyo.kind({
  name: 'OB.UI.Thumbnail.Bestseller',
  kind: 'OB.UI.Thumbnail',
  classes: 'obUiThumbnailBestseller',
  drawImage: function() {
    this.inherited(arguments);
    this.$.image.addClass('obUiThumbnailBestseller-image');
  },
  initComponents: function() {
    this.inherited(arguments);
    this.removeClass('obUiThumbnail');
  }
});

enyo.kind({
  kind: 'OB.UI.ListContextMenu',
  name: 'OB.UI.ProductContextMenu',
  classes: 'obUiProductContextMenu',
  initComponents: function() {
    this.inherited(arguments);
    this.$.menu.setItems(OB.MobileApp.model.get('productContextMenuOptions'));
  }
});
