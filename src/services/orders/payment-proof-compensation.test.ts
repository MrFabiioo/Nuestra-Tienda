import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPaymentProofCleanupTarget, getPaymentProofCleanupResourceType } from './payment-proof-compensation';

test('usa resourceType raw para comprobantes PDF', () => {
  assert.equal(getPaymentProofCleanupResourceType('application/pdf'), 'raw');
});

test('usa resourceType image para imágenes', () => {
  assert.equal(getPaymentProofCleanupResourceType('image/webp'), 'image');
  assert.equal(getPaymentProofCleanupResourceType('image/png'), 'image');
});

test('omite cleanup targets inline o vacíos', () => {
  assert.equal(buildPaymentProofCleanupTarget(undefined, 'image/png'), null);
  assert.equal(buildPaymentProofCleanupTarget('inline-proof-1', 'application/pdf'), null);
});

test('crea cleanup targets remotos válidos', () => {
  assert.deepEqual(buildPaymentProofCleanupTarget('payment-proof-123', 'application/pdf'), {
    publicId: 'payment-proof-123',
    resourceType: 'raw',
  });
});
