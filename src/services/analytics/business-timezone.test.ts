import assert from 'node:assert/strict';
import test from 'node:test';

import { getLast30BusinessDayWindow } from './business-timezone';

test('usa la fecha de negocio como ancla del rango de 30 días', () => {
  const referenceDate = new Date('2026-04-13T15:30:00.000Z');

  const window = getLast30BusinessDayWindow(referenceDate);

  assert.equal(window.anchorDate, '2026-04-13');
  assert.equal(window.dates.length, 30);
  assert.equal(window.dates[0], '2026-03-15');
  assert.equal(window.dates.at(-1), '2026-04-13');
});

test('mantiene la ancla en el día de negocio previo cerca de medianoche UTC', () => {
  const referenceDate = new Date('2026-04-13T04:30:00.000Z');

  const window = getLast30BusinessDayWindow(referenceDate);

  assert.equal(window.anchorDate, '2026-04-12');
  assert.equal(window.dates.length, 30);
  assert.equal(window.dates[0], '2026-03-14');
  assert.equal(window.dates.at(-1), '2026-04-12');
});
