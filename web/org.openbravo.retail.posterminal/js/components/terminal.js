/*
 ************************************************************************************
 * Copyright (C) 2012 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global B, $ */

// Container for the whole POS application
enyo.kind({
  name: 'OB.UI.Terminal',
  classes: 'container',
  components: [{
    classes: 'section',
    name: 'topsection',
    components: [{
      classes: 'row',
      style: 'height: 50px; vertical-align: middle; display: table-cell;',
      components: [{
        classes: 'span12',
        style: 'color: white; font-size: 16px;',
        components: [{
          style: 'display: inline-block; vertical-align: middle; margin: 3px 0px 0px 0px;',
          components: [{
            name: 'online',
            style: 'display: inline-block; margin-left: 15px;',
            components: [{
              tag: 'span',
              style: 'display: inline-block; width: 20px; color: transparent; background-image: url(\'./img/iconOnline.png\'); background-repeat: no-repeat; background-position: 2px 3px;',
              content: '.',
            }, {
              tag: 'span',
              content: 'Online' //TODO: trl
            }]
          }, {
            name: 'terminal',
            style: 'display: inline-block; margin-left: 50px;'
          }, {
            classes: 'dropdown',
            style: 'display: inline-block; margin-left: 50px;',
            components: [{
              tag: 'a',
              name: 'yourcompany',
              classes: 'btn-dropdown dropdown-toggle',
              attributes: {
                href: '#',
                'data-toggle': 'dropdown'
              }
            }, {
              classes: 'dropdown-menu',
              style: 'color: black; width: 350px;',
              components: [{
                style: 'height: 60px; background: no-repeat center center url(\'../../utility/ShowImageLogo?logo=yourcompanymenu\');'
              }, {
                name: 'yourcompanyproperties',
                style: 'display: block; padding: 10px; float: left; background-color: #FFF899; line-height: 23px;'

              }, {
                style: 'clear: both;'
              }]
            }]
          }, {
            style: 'display: inline-block; margin-left: 50px;',
            classes: 'dropdown',
            components: [{
              tag: 'a',
              name: 'loggeduser',
              classes: 'btn-dropdown dropdown-toggle',
              attributes: {
                'data-toggle': 'dropdown',
                href: '#'
              }
            }, {
              name: 'loggeduserproperties',
              classes: 'dropdown-menu',
              style: 'color: black; padding: 0px; width: 350px;'
            }]
          }]

        }, {
          style: 'display: inline-block; float: right;',
          components: [{
            style: 'display: inline-block; float: left; margin: 4px 10px 0px 0px;',
            content: 'Openbravo Web POS'
          }, {
            style: 'width: 30px; height: 30px; float: right; margin: 0px 12px 0px 0px;',
            components: [{
              classes: 'top-right-logo'
            }]
          }, {
            name: 'dialogsContainer'
          }]
        }]
      }]
    }, {
      components: [{
        name: 'containerLoading',
        components: [{
          classes: 'POSLoadingCenteredBox',
          components: [{
            classes: 'POSLoadingPromptLabel',
            content: 'Loading...'
          }, {
            classes: 'POSLoadingProgressBar',
            components: [{
              classes: 'POSLoadingProgressBarImg'
            }]
          }]
        }],
        makeId: function() {
          return 'containerLoading';
        }
      }, {
        makeId: function() {
          return 'containerWindow';
        },
        name: 'containerWindow'
      }]
    }]
  }],

  initComponents: function() {
    //this.terminal = terminal;
    this.inherited(arguments);

    this.terminal.on('change:context', function() {
      var ctx = this.terminal.get('context');
      if (ctx) {
        this.$.loggeduser.setContent(ctx.user._identifier);
        this.$.loggeduserproperties.destroyComponents();
        this.$.loggeduserproperties.createComponent({
          kind: 'OB.UI.Terminal.UserWidget',
          img: ctx.img,
          username: ctx.user._identifier,
          role: ctx.role._identifier
        }).render();
      } else {
        this.$.loggeduser.destroyComponents();
        this.$.loggeduserproperties.destroyComponents();
      }
    }, this);


    this.terminal.on('change:terminal change:bplocation change:location change:pricelist change:pricelistversion', function() {
      var name = '';
      var clientname = '';
      var orgname = '';
      var pricelistname = '';
      var currencyname = '';
      var locationname = '';

      if (this.terminal.get('terminal')) {
        name = this.terminal.get('terminal')._identifier;
        clientname = this.terminal.get('terminal')['client' + OB.Constants.FIELDSEPARATOR + '_identifier'];
        orgname = this.terminal.get('terminal')['organization' + OB.Constants.FIELDSEPARATOR + '_identifier'];
      }
      if (this.terminal.get('pricelist')) {
        pricelistname = this.terminal.get('pricelist')._identifier;
        currencyname = this.terminal.get('pricelist')['currency' + OB.Constants.FIELDSEPARATOR + '_identifier'];
      }
      if (this.terminal.get('location')) {
        locationname = this.terminal.get('location')._identifier;
      }

      this.$.terminal.setContent(name);

      this.$.yourcompany.setContent(orgname);
      this.$.yourcompanyproperties.destroyComponents();
      this.$.yourcompanyproperties.createComponent({
        kind: 'OB.UI.Terminal.CompanyWidget',
        clientName: clientname,
        orgName: orgname,
        priceName: pricelistname,
        currencyName: currencyname,
        locationName: locationname
      }).render();

    }, this);
  },
  makeId: function() {
    return 'container';
  }

});



enyo.kind({
  name: 'OB.UI.Terminal.UserWidget',
  components: [{
    style: 'height: 60px; background-color: #FFF899;',
    components: [{
      style: 'float: left; width: 55px; margin: 6px 0px 0px 6px;',
      components: [{
        kind: 'OB.UI.Thumbnail',
        'default': 'img/anonymous-icon.png'
      }]
    }, {
      style: 'float: left; margin: 6px 0px 0px 0px; line-height: 150%;',
      components: [{
        components: [{
          components: [{
            tag: 'span',
            style: 'font-weight: 600; margin: 0px 0px 0px 5px;',
            name: 'username'
          }]
        }]
      }]
    }, {
      style: 'float: left; margin: 6px 0px 0px 0px; line-height: 150%;',
      components: [{
        components: [{
          components: [{
            tag: 'span',
            style: 'font-weight: 600; margin: 0px 0px 0px 5px;',
            name: 'role'
          }]
        }]
      }]
    }]
  }, {
    components: [{
      style: 'height: 5px;'
    }, {
      kind: 'OB.UI.MenuAction',
      label: 'Profile',
      //TODO: OB.I18N.getLabel('OBPOS_LblProfile'),
      tap: function() {
        console.log('tap');
        $('#profileDialog').modal('show');
      }
    }, {
      style: 'height: 5px;'
    }, {
      kind: 'OB.UI.MenuAction',
      label: 'Log Out',
      //TODO: OB.I18N.getLabel('OBPOS_LblProfile'),
      tap: function() {
        console.log('tap');
        $('#logoutDialog').modal('show');
      }
    }, {
      style: 'height: 5px;'
    }]
  }],
  initComponents: function() {
    this.inherited(arguments);
    this.$.username.setContent(this.username);
    this.$.role.setContent(this.role);
  }
});

enyo.kind({
  name: 'OB.UI.Terminal.CompanyWidget',
  components: [{
    components: [{
      tag: 'span',
      name: 'clientLbl'
    }, {
      tag: 'span',
      name: 'clientName',
      style: 'font-weight: bold; margin: 0px 0px 0px 5px;'
    }]
  }, {
    components: [{
      tag: 'span',
      name: 'orgLbl'
    }, {
      tag: 'span',
      name: 'orgName',
      style: 'font-weight: bold; margin: 0px 0px 0px 5px;'
    }]
  }, {
    components: [{
      tag: 'span',
      name: 'priceLbl'
    }, {
      tag: 'span',
      name: 'priceName',
      style: 'font-weight: bold; margin: 0px 0px 0px 5px;'
    }]
  }, {
    components: [{
      tag: 'span',
      name: 'currencyLbl'
    }, {
      tag: 'span',
      name: 'currencyName',
      style: 'font-weight: bold; margin: 0px 0px 0px 5px;'
    }]
  }, {
    components: [{
      tag: 'span',
      name: 'locationLbl'
    }, {
      tag: 'span',
      name: 'locationName',
      style: 'font-weight: bold; margin: 0px 0px 0px 5px;'
    }]
  }],
  initComponents: function() {
    this.inherited(arguments);
    this.$.clientLbl.setContent(OB.I18N.getLabel('OBPOS_CompanyClient'));
    this.$.clientName.setContent(this.clientName);

    this.$.orgLbl.setContent(OB.I18N.getLabel('OBPOS_CompanyOrg'));
    this.$.orgName.setContent(this.orgName);

    this.$.priceLbl.setContent(OB.I18N.getLabel('OBPOS_CompanyPriceList'));
    this.$.priceName.setContent(this.priceName);

    this.$.currencyLbl.setContent(OB.I18N.getLabel('OBPOS_CompanyCurrency'));
    this.$.currencyName.setContent(this.currencyName);

    this.$.locationLbl.setContent(OB.I18N.getLabel('OBPOS_CompanyLocation'));
    this.$.locationName.setContent(this.locationName);
  }
});