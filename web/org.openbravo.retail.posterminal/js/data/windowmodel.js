/*
 ************************************************************************************
 * Copyright (C) 2012-2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

OB.Model.WindowModel = Backbone.Model.extend({
  data: {},

  load: function() {
    var me = this;
    if (!this.models) {
      this.models = [];
    }

    _.extend(this.models, Backbone.Events);

    if (!OB.MobileApp.model.get('loggedOffline')) {
      OB.Dal.loadModels(true, this.models, this.data, undefined, function() {
        if (me.init) {
          me.init();
        }
        me.trigger('ready');
      });
    } else {
      if (this.init) {
        this.init();
      }
      this.trigger('ready');
    }
    //TODO: load offline models when registering window
  },

  setAllOff: function(model) {
    var p;
    if (model.off) {
      model.off();
    }
    if (model.attributes) {
      for (p in model.attributes) {
        if (
          Object.prototype.hasOwnProperty.call(model.attributes, p) &&
          model.attributes[p]
        ) {
          this.setAllOff(model);
        }
      }
    }
  },

  setOff: function() {
    if (!this.data) {
      return;
    }
    if (this.data) {
      _.forEach(
        this.data,
        function(model) {
          this.setAllOff(model);
        },
        this
      );
    }
    this.data = null;

    if (this.models) {
      _.forEach(
        this.models,
        function(model) {
          if (model.off) {
            model.off();
          }
        },
        this
      );
      if (this.models.off) {
        this.models.off();
      }
    }
    this.models = null;
  },

  getData: function(dsName) {
    return this.data[dsName];
  }
});
