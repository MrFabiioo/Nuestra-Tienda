import assert from 'node:assert/strict';
import test from 'node:test';

import { getAdminAllowedEmailAllowlist, isAdminEmailAllowed } from './admin-access';

test('solo ADMIN_ALLOWED_EMAILS define la whitelist admin', () => {
  const allowlist = getAdminAllowedEmailAllowlist('admin@example.com, owner@example.com');

  assert.deepEqual([...allowlist], ['admin@example.com', 'owner@example.com']);
  assert.equal(isAdminEmailAllowed('admin@example.com', 'admin@example.com, owner@example.com'), true);
  assert.equal(isAdminEmailAllowed('notify@example.com', 'admin@example.com, owner@example.com'), false);
});

test('normaliza emails y rechaza allowlists vacías', () => {
  assert.equal(isAdminEmailAllowed('  ADMIN@EXAMPLE.COM  ', ' admin@example.com '), true);
  assert.equal(isAdminEmailAllowed('admin@example.com', undefined), false);
  assert.equal(isAdminEmailAllowed(undefined, 'admin@example.com'), false);
});
