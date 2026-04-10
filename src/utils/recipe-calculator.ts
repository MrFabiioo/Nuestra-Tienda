import type {
  IngredientCost,
  RecipeCalculation,
  RecipeIngredient,
  RecipeUnit,
} from '@interfaces/recipe.interface';

/**
 * Factores de conversión a la unidad base de cada dimensión.
 *
 * Dimensión masa   → base: gramos (gr)
 * Dimensión volumen → base: mililitros (ml)
 * "unidad" no tiene conversión entre dimensiones.
 */
const CONVERSION_TO_BASE: Record<RecipeUnit, number | null> = {
  gr: 1,
  kg: 1000,
  ml: 1,
  cc: 1,      // 1 cc = 1 ml
  l: 1000,
  unidad: null, // dimensión propia: sólo es compatible consigo misma
};

/** Dimensión de cada unidad para detectar incompatibilidad */
const DIMENSION: Record<RecipeUnit, 'mass' | 'volume' | 'unit'> = {
  gr: 'mass',
  kg: 'mass',
  ml: 'volume',
  cc: 'volume',
  l: 'volume',
  unidad: 'unit',
};

/**
 * Convierte una cantidad expresada en `from` a la misma dimensión en `to`.
 * Devuelve `null` si las unidades son incompatibles.
 */
export function convertUnit(qty: number, from: RecipeUnit, to: RecipeUnit): number | null {
  if (from === to) return qty;

  const dimFrom = DIMENSION[from];
  const dimTo = DIMENSION[to];

  if (dimFrom !== dimTo) return null;

  const baseFrom = CONVERSION_TO_BASE[from];
  const baseTo = CONVERSION_TO_BASE[to];

  if (baseFrom === null || baseTo === null) return null;

  return (qty * baseFrom) / baseTo;
}

/**
 * Calcula el costo proporcional de un ingrediente individual.
 *
 * Fórmula:
 *   costoPorUnidadComprada = paidAmount / purchasedQty  (en unidad de compra)
 *   usedQtyNormalized      = convertUnit(usedQty, usedUnit, purchasedUnit)
 *   costo                  = costoPorUnidadComprada * usedQtyNormalized
 */
export function calcIngredientCost(ing: RecipeIngredient): IngredientCost {
  const { paidAmount, purchasedQty, purchasedUnit, usedQty, usedUnit } = ing;

  if (purchasedQty <= 0 || paidAmount < 0) {
    return { cost: 0, incompatible: false };
  }

  const usedInPurchaseUnits = convertUnit(usedQty, usedUnit, purchasedUnit);

  if (usedInPurchaseUnits === null) {
    return { cost: 0, incompatible: true };
  }

  const costPerPurchaseUnit = paidAmount / purchasedQty;
  const cost = costPerPurchaseUnit * usedInPurchaseUnits;

  return { cost, incompatible: false };
}

/**
 * Calcula el resumen completo de la receta.
 *
 * @param ingredients - Lista de ingredientes
 * @param yieldUnits  - Unidades producidas con esta receta
 * @param marginPercent - Margen sobre el costo por unidad (0-∞, ej: 50 = 50%)
 */
export function calcRecipe(
  ingredients: RecipeIngredient[],
  yieldUnits: number,
  marginPercent: number,
): RecipeCalculation {
  const ingredientCosts = ingredients.map(calcIngredientCost);
  const totalCost = ingredientCosts.reduce((acc, ic) => acc + ic.cost, 0);
  const safeYield = yieldUnits > 0 ? yieldUnits : 1;
  const costPerUnit = totalCost / safeYield;
  const suggestedPrice = costPerUnit * (1 + marginPercent / 100);

  return { ingredientCosts, totalCost, costPerUnit, suggestedPrice };
}

/** Devuelve una receta vacía para usar como valor inicial en el formulario */
export function emptyRecipe() {
  return {
    ingredients: [emptyIngredient()],
    yieldUnits: 1,
    marginPercent: 50 as number | null,
  };
}

/** Devuelve un ingrediente vacío */
export function emptyIngredient(): RecipeIngredient {
  return {
    name: '',
    paidAmount: 0,
    purchasedQty: 1,
    purchasedUnit: 'gr',
    usedQty: 1,
    usedUnit: 'gr',
  };
}

/** Lista de unidades con labels para poblar selects */
export const RECIPE_UNITS: { value: RecipeUnit; label: string }[] = [
  { value: 'gr', label: 'gr' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'cc', label: 'cc' },
  { value: 'l', label: 'l' },
  { value: 'unidad', label: 'unidad' },
];

/** Márgenes predefinidos */
export const MARGIN_PRESETS: { value: number; label: string }[] = [
  { value: 25, label: '25%' },
  { value: 50, label: '50%' },
  { value: 100, label: '100%' },
  { value: 200, label: '200%' },
];
