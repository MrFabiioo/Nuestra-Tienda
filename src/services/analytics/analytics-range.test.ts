import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveAnalyticsRange } from './analytics-range';

test('convierte un rango válido al intervalo UTC de negocio', () => {
  const range = resolveAnalyticsRange({
    from: '2026-04-07',
    to: '2026-04-13',
  });

  assert.ok(range);
  assert.equal(range?.from.toISOString(), '2026-04-07T05:00:00.000Z');
  assert.equal(range?.to.toISOString(), '2026-04-14T05:00:00.000Z');
});

test('ignora rangos incompletos o invertidos', () => {
  assert.equal(resolveAnalyticsRange(undefined), undefined);
  assert.equal(resolveAnalyticsRange({ from: '2026-04-07' }), undefined);
  assert.equal(resolveAnalyticsRange({ to: '2026-04-13' }), undefined);
  assert.equal(resolveAnalyticsRange({ from: '2026-04-13', to: '2026-04-13' }), undefined);
  assert.equal(resolveAnalyticsRange({ from: '2026-04-14', to: '2026-04-13' }), undefined);
});
