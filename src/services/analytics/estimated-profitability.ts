import type { ProductRecipe } from '@interfaces/recipe.interface';
import { calcRecipe } from '@utils/recipe-calculator';

export interface EstimatedProfitabilitySourceItem {
  productId: string;
  title: string;
  approvedQty: number;
  approvedRevenue: number;
  recipeRaw: string | null;
}

export interface EstimatedProfitabilityItem {
  productId: string;
  title: string;
  qty: number;
  revenue: number;
  estimatedRevenue: number;
  estimatedCost: number;
  estimatedProfit: number;
  estimatedUnitCost: number;
}

export interface EstimatedProfitabilityRanking {
  items: EstimatedProfitabilityItem[];
  productsWithoutEstimatedCost: number;
}

function parseRecipe(raw: string | null): ProductRecipe | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ProductRecipe;
  } catch {
    return null;
  }
}

function estimateUnitCost(recipe: ProductRecipe | null): number | null {
  if (!recipe || recipe.yieldUnits <= 0) {
    return null;
  }

  const calculation = calcRecipe(recipe.ingredients ?? [], recipe.yieldUnits, recipe.marginPercent ?? 0);

  if (calculation.ingredientCosts.some(ingredient => ingredient.incompatible)) {
    return null;
  }

  return Number.isFinite(calculation.costPerUnit) ? calculation.costPerUnit : null;
}

export function buildEstimatedProfitabilityRanking(
  items: EstimatedProfitabilitySourceItem[],
  limit = 10,
): EstimatedProfitabilityRanking {
  const rankedItems: EstimatedProfitabilityItem[] = [];
  let productsWithoutEstimatedCost = 0;

  for (const item of items) {
    const estimatedUnitCost = estimateUnitCost(parseRecipe(item.recipeRaw));

    if (estimatedUnitCost === null) {
      productsWithoutEstimatedCost += 1;
      continue;
    }

    const estimatedCost = estimatedUnitCost * item.approvedQty;

    rankedItems.push({
      productId: item.productId,
      title: item.title,
      qty: item.approvedQty,
      revenue: item.approvedRevenue,
      estimatedRevenue: item.approvedRevenue,
      estimatedCost,
      estimatedProfit: item.approvedRevenue - estimatedCost,
      estimatedUnitCost,
    });
  }

  rankedItems.sort((left, right) => right.estimatedProfit - left.estimatedProfit);

  return {
    items: rankedItems.slice(0, limit).map(item => ({
      ...item,
      estimatedRevenue: Number(item.estimatedRevenue.toFixed(2)),
      estimatedCost: Number(item.estimatedCost.toFixed(2)),
      estimatedProfit: Number(item.estimatedProfit.toFixed(2)),
      estimatedUnitCost: Number(item.estimatedUnitCost.toFixed(2)),
    })),
    productsWithoutEstimatedCost,
  };
}
