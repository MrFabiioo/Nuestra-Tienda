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

test('tolera fechas ISO serializadas por raw SQL al calcular fecha y hora de negocio', () => {
  const createdAtIso = '2026-04-13T15:40:00.000Z';

  assert.equal(
    evaluateSqliteExpression(buildBusinessDateTimeExpression(`'${createdAtIso}'`)),
    '2026-04-13 10:40:00',
  );
  assert.equal(
    evaluateSqliteExpression(buildBusinessHourExpression(`'${createdAtIso}'`)),
    10,
  );
  assert.equal(
    evaluateSqliteExpression(buildBusinessDateExpression(`'${createdAtIso}'`)),
    '2026-04-13',
  );
});

test('agrupa correctamente pedidos ISO por día y hora de negocio', () => {
  const database = new Database(':memory:');

  try {
    database.exec('CREATE TABLE orders (createdAt TEXT NOT NULL, total REAL NOT NULL)');

    const insertOrder = database.prepare('INSERT INTO orders (createdAt, total) VALUES (?, ?)');
    insertOrder.run('2026-04-13T02:15:00.000Z', 18); // 2026-04-12 21:15 Bogotá
    insertOrder.run('2026-04-13T15:40:00.000Z', 25); // 2026-04-13 10:40 Bogotá
    insertOrder.run('2026-04-13T15:55:00.000Z', 42); // 2026-04-13 10:55 Bogotá

    const byDay = database.prepare(`
      SELECT ${buildBusinessDateExpression('createdAt')} AS businessDate, COUNT(*) AS orders
      FROM orders
      GROUP BY businessDate
      ORDER BY businessDate
    `).all() as Array<{ businessDate: string; orders: number }>;

    const byHour = database.prepare(`
      SELECT ${buildBusinessHourExpression('createdAt')} AS businessHour, COUNT(*) AS orders
      FROM orders
      GROUP BY businessHour
      ORDER BY businessHour
    `).all() as Array<{ businessHour: number; orders: number }>;

    assert.deepEqual(byDay, [
      { businessDate: '2026-04-12', orders: 1 },
      { businessDate: '2026-04-13', orders: 2 },
    ]);
    assert.deepEqual(byHour, [
      { businessHour: 10, orders: 2 },
      { businessHour: 21, orders: 1 },
    ]);
  } finally {
    database.close();
  }
});
