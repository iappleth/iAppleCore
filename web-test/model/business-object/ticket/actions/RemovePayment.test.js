/*
 ************************************************************************************
 * Copyright (C) 2020 Openbravo S.L.U.
 * Licensed under the Openbravo Commercial License version 1.0
 * You may obtain a copy of the License at http://www.openbravo.com/legal/obcl.html
 * or in the legal folder of this module distribution.
 ************************************************************************************
 */

require('../SetupTicket');
require('../../../../../web/org.openbravo.retail.posterminal/app/model/business-object/ticket/actions/RemovePayment');
require('../SetupTicketUtils');
const deepfreeze = require('deepfreeze');

const basicTicket = deepfreeze({
  lines: [
    {
      id: '1',
      qty: 100,
      product: { id: 'p1' },
      baseGrossUnitPrice: 5
    }
  ],
  payments: [
    { id: '1', amount: 200, kind: 'OBPOS_payment.cash' },
    { id: '2', amount: 800, kind: 'OBPOS_payment.card' }
  ],
  deletedPayments: [{ id: '3', amount: 800, kind: 'OBPOS_payment.card' }]
});

const ticketWithRounding = deepfreeze({
  lines: [
    {
      id: '1',
      qty: 100,
      product: { id: 'p1' },
      baseGrossUnitPrice: 5
    }
  ],
  payments: [
    {
      id: '1',
      amount: 200,
      kind: 'OBPOS_payment.cash',
      paymentRoundingLine: {
        id: '2',
        amount: 800,
        kind: 'OBPOS_payment.card',
        roundedPaymentId: '1'
      }
    },
    { id: '2', amount: 800, kind: 'OBPOS_payment.card', roundedPaymentId: '1' }
  ]
});

const ticketWithReversedPayment = deepfreeze({
  lines: [
    {
      id: '1',
      qty: 100,
      product: { id: 'p1' },
      baseGrossUnitPrice: 5
    }
  ],
  payments: [
    {
      id: '1',
      amount: 200,
      kind: 'OBPOS_payment.cash',
      reversedPaymentId: '2'
    },
    { id: '2', amount: 200, kind: 'OBPOS_payment.card', isReversed: true }
  ]
});

const ticketWithNullPaymentId = deepfreeze({
  lines: [
    {
      id: '1',
      qty: 100,
      product: { id: 'p1' },
      baseGrossUnitPrice: 5
    }
  ],
  payments: [
    { id: '1', amount: 200, kind: 'OBPOS_payment.cash' },
    { amount: 800, kind: 'OBPOS_payment.card' }
  ],
  deletedPayments: [{ id: '3', amount: 800, kind: 'OBPOS_payment.card' }]
});

describe('Ticket.removePayment action', () => {
  it('remove simple payment', () => {
    const { payments } = OB.App.StateAPI.Ticket.removePayment(basicTicket, {
      paymentIds: ['1']
    });
    expect(payments).toHaveLength(1);
  });
  it('remove two payments', () => {
    const { payments } = OB.App.StateAPI.Ticket.removePayment(basicTicket, {
      paymentIds: ['1', '2']
    });
    expect(payments).toHaveLength(0);
  });
  it('remove payment with rounding line', () => {
    const { payments } = OB.App.StateAPI.Ticket.removePayment(
      ticketWithRounding,
      {
        paymentIds: ['1']
      }
    );
    expect(payments).toHaveLength(0);
  });
  it('remove payment associated with a reversed payment', () => {
    const { payments } = OB.App.StateAPI.Ticket.removePayment(
      ticketWithReversedPayment,
      {
        paymentIds: ['1']
      }
    );
    expect(payments).toHaveLength(1);
    expect(payments[0].isReversed).toBe(false);
  });
  it('removedPayments array', () => {
    const { deletedPayments } = OB.App.StateAPI.Ticket.removePayment(
      basicTicket,
      {
        paymentIds: ['1']
      }
    );
    expect(deletedPayments).toHaveLength(2);
  });

  it('remove simple payment in ticket with null id', () => {
    const { payments } = OB.App.StateAPI.Ticket.removePayment(
      ticketWithNullPaymentId,
      {
        paymentIds: ['1']
      }
    );
    expect(payments).toHaveLength(1);
  });
});
