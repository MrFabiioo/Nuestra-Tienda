import assert from 'node:assert/strict';
import test from 'node:test';
import Database from 'libsql';

import { businessDateToUTC } from './business-timezone';
import { resolveAnalyticsWindow } from './repository';

test('serializa límites ISO para filtrar columnas date persistidas como texto', () => {
  const window = resolveAnalyticsWindow({
    from: businessDateToUTC('2026-04-07', false),
    to: businessDateToUTC('2026-04-13', true),
  });

  assert.equal(window.fromDbValue, '2026-04-07T05:00:00.000Z');
  assert.equal(window.toDbValue, '2026-04-14T05:00:00.000Z');
});

test('los límites ISO incluyen solo pedidos dentro del rango filtrado', () => {
  const database = new Database(':memory:');

  try {
    database.exec('CREATE TABLE orders (createdAt TEXT NOT NULL, total REAL NOT NULL)');

    const insertOrder = database.prepare('INSERT INTO orders (createdAt, total) VALUES (?, ?)');
    insertOrder.run('2026-04-07T04:59:59.999Z', 15);
    insertOrder.run('2026-04-07T05:00:00.000Z', 21);
    insertOrder.run('2026-04-13T16:30:00.000Z', 34);
    insertOrder.run('2026-04-14T05:00:00.000Z', 55);

    const window = resolveAnalyticsWindow({
      from: businessDateToUTC('2026-04-07', false),
      to: businessDateToUTC('2026-04-13', true),
    });

    const row = database
      .prepare('SELECT COUNT(*) AS orders, ROUND(COALESCE(SUM(total), 0), 2) AS revenue FROM orders WHERE createdAt >= ? AND createdAt < ?')
      .get(window.fromDbValue, window.toDbValue) as { orders: number; revenue: number };

    assert.deepEqual(row, { orders: 2, revenue: 55 });
  } finally {
    database.close();
  }
});
