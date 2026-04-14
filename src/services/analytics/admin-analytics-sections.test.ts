import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAdminAnalyticsSectionsLayout } from './admin-analytics-sections';

test('restaura monto bruto histórico y mueve rentabilidad estimada al lugar de entrega', () => {
  const layout = buildAdminAnalyticsSectionsLayout();

  assert.deepEqual(layout.productPanels, ['status', 'topByQty', 'topByRevenue']);
  assert.deepEqual(layout.mixPanels, ['payment', 'estimatedProfit']);
  assert.equal(layout.productGridClass, 'xl:grid-cols-3');
  assert.equal(layout.mixGridClass, 'lg:grid-cols-2');
});
