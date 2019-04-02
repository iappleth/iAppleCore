/*
 ************************************************************************************
 * Copyright (C) 2018-2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB, Promise  */

(function () {

  var Bluetooth = function (info) {
      this.info = info;
      this.size = this.info.buffersize || 20;
      this.device = null;
      };

  Bluetooth.prototype.connected = function () {
    return this.device !== null;
  };

  Bluetooth.prototype.request = function () {

    if (!navigator.bluetooth || !navigator.bluetooth.requestDevice) {
      return Promise.reject('Bluetooth not supported.');
    }

    return navigator.bluetooth.requestDevice({
      filters: [{
        services: [this.info.service]
      }]
    }).then(function (device) {
      this.device = device;
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));
    }.bind(this));
  };

  Bluetooth.prototype.print = function (data) {
    var result;

    if (!this.device) {
      return Promise.reject('Device is not connected.');
    }

    if (this.characteristic) {
      result = OB.ARRAYS.printArray(this.printChunk.bind(this), this.size, data);
    } else {
      result = this.device.gatt.connect().then(function (server) {
        this.server = server;
        return server.getPrimaryService(this.info.service);
      }.bind(this)).then(function (service) {
        return service.getCharacteristic(this.info.characteristic);
      }.bind(this)).then(function (characteristic) {
        this.characteristic = characteristic;
        return OB.ARRAYS.printArray(this.printChunk.bind(this), this.size, data);
      }.bind(this));
    }

    return result['catch'](function (error) {
      this.onDisconnected();
      throw error;
    }.bind(this));
  };

  Bluetooth.prototype.printChunk = function (chunk) {
    return function () {
      return this.characteristic.writeValue(chunk);
    }.bind(this);
  };

  Bluetooth.prototype.onDisconnected = function () {
    this.device = null;
    this.characteristic = null;
    this.server = null;
  };

  window.OB = window.OB || {};
  OB.Bluetooth = Bluetooth;

}());