/*
 ************************************************************************************
 * Copyright (C) 2019 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

/*global OB */
(function () {

  OB.PRINTERTYPES.GENERICUSB.register({
    name: 'EPSON TM T20',
    vendorId: 0x04B8,
    productId: 0x0E03,
    ESCPOS: OB.ESCPOS.Standard
  });

}());