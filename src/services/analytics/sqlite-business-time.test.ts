import assert from 'node:assert/strict';
import test from 'node:test';
import Database from 'libsql';

import {
  buildBusinessDateExpression,
  buildBusinessDateTimeExpression,
  buildBusinessDayOfWeekExpression,
  buildBusinessHourExpression,
} from './sqlite-business-time';

function evaluateSqliteExpression(expression: string) {
  const database = new Database(':memory:');

  try {
    const row = database.prepare(`SELECT ${expression} AS value`).get() as { value: string | number | null };

    return row.value;
  } finally {
    database.close();
  }
}

test('convierte epoch-ms a datetime SQLite antes de aplicar timezone de negocio', () => {
  const createdAtEpochMs = Date.parse('2026-04-13T15:40:00.000Z');

  assert.equal(
    evaluateSqliteExpression(buildBusinessDateTimeExpression(String(createdAtEpochMs))),
    '2026-04-13 10:40:00',
  );
});

test('agrupa el caso real reportado como lunes 10h Bogotá sin caer en domingo 00h', () => {
  const createdAtEpochMs = Date.parse('2026-04-13T15:40:00.000Z');

  assert.equal(
    evaluateSqliteExpression(buildBusinessDayOfWeekExpression(String(createdAtEpochMs))),
    1,
  );
  assert.equal(
    evaluateSqliteExpression(buildBusinessHourExpression(String(createdAtEpochMs))),
    10,
  );
  assert.equal(
    evaluateSqliteExpression(buildBusinessDateExpression(String(createdAtEpochMs))),
    '2026-04-13',
  );
});
