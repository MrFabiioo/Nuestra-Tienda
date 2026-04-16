import assert from 'node:assert/strict';
import test from 'node:test';

import { mapAdminOrderSummary } from './admin-order-summary.mapper';

test('normaliza fechas legacy guardadas como texto numérico por db.run()', () => {
  const summary = mapAdminOrderSummary({
    id: 'order-legacy',
    customerName: 'Ada Lovelace',
    customerEmail: 'ada@example.com',
    customerPhone: '555-0001',
    total: '123456.78',
    status: 'pending_payment',
    createdAt: '1776302502264.0',
    paymentStatus: 'pending',
    paymentMethod: 'bancolombia',
    proofUploadedAt: '1776302602264.0',
  });

  assert.ok(summary.createdAt instanceof Date);
  assert.equal(summary.createdAt?.toISOString(), '2026-04-16T01:21:42.264Z');
  assert.ok(summary.proofUploadedAt instanceof Date);
  assert.equal(summary.proofUploadedAt?.toISOString(), '2026-04-16T01:23:22.264Z');
});

test('normaliza fechas crudas del listado admin a instancias Date', () => {
  const summary = mapAdminOrderSummary({
    id: 'order-1',
    customerName: 'Ada Lovelace',
    customerEmail: 'ada@example.com',
    customerPhone: '555-0001',
    total: '123456.78',
    status: 'pending_payment',
    createdAt: '2026-04-15T18:30:00.000Z',
    paymentStatus: 'pending',
    paymentMethod: 'bancolombia',
    proofUploadedAt: '2026-04-15T19:00:00.000Z',
  });

  assert.equal(summary.total, 123456.78);
  assert.ok(summary.createdAt instanceof Date);
  assert.equal(summary.createdAt.toISOString(), '2026-04-15T18:30:00.000Z');
  assert.ok(summary.proofUploadedAt instanceof Date);
  assert.equal(summary.proofUploadedAt?.toISOString(), '2026-04-15T19:00:00.000Z');
});

test('mantiene null cuando no hay comprobante cargado', () => {
  const summary = mapAdminOrderSummary({
    id: 'order-2',
    customerName: 'Grace Hopper',
    customerEmail: 'grace@example.com',
    customerPhone: '555-0002',
    total: 99000,
    status: 'approved',
    createdAt: new Date('2026-04-16T10:00:00.000Z'),
    paymentStatus: 'approved',
    paymentMethod: 'bancolombia',
    proofUploadedAt: null,
  });

  assert.equal(summary.proofUploadedAt, null);
});

test('tolera createdAt inválido y deja diagnóstico para identificar la fila rota', () => {
  const originalWarn = console.warn;
  const warnings: unknown[][] = [];

  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };

  try {
    const summary = mapAdminOrderSummary({
      id: 'order-3',
      customerName: 'Linus Torvalds',
      customerEmail: 'linus@example.com',
      customerPhone: '555-0003',
      total: 1000,
      status: 'pending_payment',
      createdAt: 'not-a-date',
      paymentStatus: 'pending',
      paymentMethod: 'bancolombia',
      proofUploadedAt: null,
    });

    assert.equal(summary.createdAt, null);
    assert.equal(warnings.length, 1);
    assert.equal(warnings[0]?.[0], '[orders/admin] Invalid date in admin order summary row');
    assert.deepEqual(warnings[0]?.[1], {
      orderId: 'order-3',
      field: 'createdAt',
      value: 'not-a-date',
    });
  } finally {
    console.warn = originalWarn;
  }
});
