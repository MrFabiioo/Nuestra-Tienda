import assert from 'node:assert/strict';
import test from 'node:test';

import { buildEstimatedProfitabilityRanking } from './estimated-profitability';

test('rankea productos por ganancia estimada usando solo costo estimable desde receta actual', () => {
  const result = buildEstimatedProfitabilityRanking([
    {
      productId: 'combo',
      title: 'Combo Guacamole',
      approvedQty: 10,
      approvedRevenue: 300,
      recipeRaw: JSON.stringify({
        ingredients: [
          {
            name: 'Palta',
            paidAmount: 120,
            purchasedQty: 12,
            purchasedUnit: 'unidad',
            usedQty: 1,
            usedUnit: 'unidad',
          },
        ],
        yieldUnits: 2,
        marginPercent: 50,
      }),
    },
    {
      productId: 'nachos',
      title: 'Nachos',
      approvedQty: 8,
      approvedRevenue: 160,
      recipeRaw: JSON.stringify({
        ingredients: [
          {
            name: 'Totopos',
            paidAmount: 80,
            purchasedQty: 10,
            purchasedUnit: 'unidad',
            usedQty: 1,
            usedUnit: 'unidad',
          },
        ],
        yieldUnits: 4,
        marginPercent: 25,
      }),
    },
  ]);

  assert.equal(result.items.length, 2);
  assert.equal(result.items[0]?.productId, 'combo');
  assert.equal(result.items[0]?.estimatedRevenue, 300);
  assert.equal(result.items[0]?.estimatedCost, 50);
  assert.equal(result.items[0]?.estimatedProfit, 250);
  assert.equal(result.items[1]?.productId, 'nachos');
  assert.equal(result.items[1]?.estimatedCost, 16);
  assert.equal(result.items[1]?.estimatedProfit, 144);
  assert.equal(result.productsWithoutEstimatedCost, 0);
});

test('excluye productos sin receta o con costo no estimable para no mentir la utilidad', () => {
  const result = buildEstimatedProfitabilityRanking([
    {
      productId: 'sin-receta',
      title: 'Sin receta',
      approvedQty: 5,
      approvedRevenue: 120,
      recipeRaw: null,
    },
    {
      productId: 'incompatible',
      title: 'Incompatible',
      approvedQty: 3,
      approvedRevenue: 90,
      recipeRaw: JSON.stringify({
        ingredients: [
          {
            name: 'Ingrediente raro',
            paidAmount: 20,
            purchasedQty: 2,
            purchasedUnit: 'kg',
            usedQty: 1,
            usedUnit: 'unidad',
          },
        ],
        yieldUnits: 1,
        marginPercent: 50,
      }),
    },
    {
      productId: 'estimable',
      title: 'Estimable',
      approvedQty: 2,
      approvedRevenue: 50,
      recipeRaw: JSON.stringify({
        ingredients: [
          {
            name: 'Base',
            paidAmount: 30,
            purchasedQty: 3,
            purchasedUnit: 'unidad',
            usedQty: 1,
            usedUnit: 'unidad',
          },
        ],
        yieldUnits: 3,
        marginPercent: 50,
      }),
    },
  ]);

  assert.deepEqual(
    result.items.map(item => item.productId),
    ['estimable'],
  );
  assert.equal(result.productsWithoutEstimatedCost, 2);
});
