/** Unidades de medida soportadas en la calculadora de receta */
export type RecipeUnit = 'gr' | 'kg' | 'ml' | 'cc' | 'l' | 'unidad';

/** Un ingrediente individual dentro de una receta */
export interface RecipeIngredient {
  /** Nombre descriptivo del ingrediente (ej: "Palta Hass") */
  name: string;
  /** Precio pagado por la cantidad comprada */
  paidAmount: number;
  /** Cantidad comprada (en la unidad de compra) */
  purchasedQty: number;
  /** Unidad en la que se compró */
  purchasedUnit: RecipeUnit;
  /** Cantidad usada en la receta */
  usedQty: number;
  /** Unidad en la que se usa (puede diferir de purchasedUnit si son compatibles) */
  usedUnit: RecipeUnit;
}

/** Márgenes predefinidos disponibles */
export type MarginPreset = 25 | 50 | 100 | 200;

/** Estructura completa de receta guardada en el producto */
export interface ProductRecipe {
  /** Lista de ingredientes */
  ingredients: RecipeIngredient[];
  /** Cantidad de unidades producidas con esta receta */
  yieldUnits: number;
  /** Margen aplicado (porcentaje). null si no se eligió ninguno */
  marginPercent: number | null;
}

/** Resultado del cálculo de costo de un ingrediente */
export interface IngredientCost {
  /** Costo proporcional de este ingrediente para la receta */
  cost: number;
  /** true si las unidades son incompatibles y no se pudo calcular */
  incompatible: boolean;
}

/** Resultado global del cálculo de receta */
export interface RecipeCalculation {
  /** Costo por ingrediente (índice = índice del ingrediente en el array) */
  ingredientCosts: IngredientCost[];
  /** Costo total de todos los ingredientes sumados */
  totalCost: number;
  /** Costo dividido por las unidades producidas */
  costPerUnit: number;
  /** Precio sugerido con el margen aplicado */
  suggestedPrice: number;
}
