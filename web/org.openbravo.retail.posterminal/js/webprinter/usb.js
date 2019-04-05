/*
 ************************************************************************************
 * Copyright (C) 2018 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, Promise, console */

(function () {

  var USB = function (printertype) {
      this.printertype = printertype;
      this.device = null;
      this.onDisconnected = this.onDisconnected.bind(this);
      if (!navigator.usb && navigator.usb.addEventListener) {
        navigator.usb.addEventListener('disconnect', function (event) {
          if (event.device === this.device) {
            this.onDisconnected();
          }
        }.bind(this));
      }
      };

  USB.prototype.connected = function () {
    return this.device !== null;
  };

  USB.prototype.request = function () {

    if (!navigator.usb || !navigator.usb.requestDevice) {
      return Promise.reject('USB not supported.');
    }

    var filters = [];
    this.printertype.devices.forEach(function (item) {
      filters.push({
        vendorId: item.vendorId,
        productId: item.productId
      });
    });

    return navigator.usb.requestDevice({
      filters: filters
    }).then(function (device) {
      this.device = device;
      return this.printertype.devices.find(function (d) {
        return d.vendorId === device.vendorId && d.productId === device.productId;
      });
    }.bind(this));
  };

  USB.prototype.print = function (data) {

    if (!this.device) {
      return Promise.reject('Device is not connected.');
    }

    return this.device.open().then(function () {
      console.log('Configuring');
      return this.device.selectConfiguration(1);
    }.bind(this)).then(function () {
      console.log('claiming');
      return this.device.claimInterface(0);
    }.bind(this)).then(function () {
      return OB.ARRAYS.printArray(this.printChunk.bind(this), 64, data);
    }.bind(this)).then(function () {
      return this.device.close();
    }.bind(this))['catch'](function (error) {
      this.onDisconnected();
      throw error;
    }.bind(this));
  };

  USB.prototype.printChunk = function (chunk) {
    return function () {
      console.log('transfering');
      return this.device.transferOut(1, chunk.buffer);
    }.bind(this);
  };

  USB.prototype.onDisconnected = function () {
    this.device = null;
  };

  window.OB = window.OB || {};
  OB.USB = USB;
}());