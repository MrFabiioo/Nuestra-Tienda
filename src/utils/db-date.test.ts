import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeDbDate, serializeDbDate } from './db-date';

test('serializeDbDate fuerza ISO para columnas date en raw SQL', () => {
  const value = serializeDbDate(new Date('2026-04-16T01:21:42.264Z'));

  assert.equal(value, '2026-04-16T01:21:42.264Z');
});

test('normalizeDbDate parsea texto numérico legacy como epoch milliseconds', () => {
  const value = normalizeDbDate('1776302502264.0');

  assert.ok(value instanceof Date);
  assert.equal(value?.toISOString(), '2026-04-16T01:21:42.264Z');
});

test('normalizeDbDate devuelve null cuando recibe una fecha inválida', () => {
  assert.equal(normalizeDbDate('not-a-date'), null);
  assert.equal(normalizeDbDate(new Date('invalid')), null);
});
