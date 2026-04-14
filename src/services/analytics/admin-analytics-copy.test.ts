import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAdminAnalyticsStaticCopy } from './admin-analytics-copy';

test('quita labels de advertencia temporal del hero y del bloque de tendencia', () => {
  const copy = buildAdminAnalyticsStaticCopy();

  assert.equal(copy.hero.badges.context, 'Resumen ejecutivo + rentabilidad estimada + mix operativo');
  assert.equal(copy.hero.title, 'Analytics con lectura honesta del negocio');
  assert.equal(
    copy.hero.description,
    'Primero separá demanda bruta, facturación confirmada y carga operativa. Después mirá rentabilidad estimada por producto, mix de pago y patrones temporales.',
  );
  assert.equal(copy.trendAlert.title, 'Lectura temporal');
  assert.equal(
    copy.trendAlert.description,
    'La serie diaria te ayuda a detectar ritmo comercial y evolución de pedidos a lo largo del tiempo.',
  );
});

test('deja el bloque temporal con copy claro pero sin avisos de bug pendiente', () => {
  const copy = buildAdminAnalyticsStaticCopy();

  assert.deepEqual(copy.temporalWarnings, [
    'Usá estas vistas para detectar concentración de demanda por día y franja horaria.',
    'Combiná esta lectura con el pipeline y el mix operativo para decidir refuerzos, cobertura y prioridades.',
    'Las métricas de monto bruto e histórico NO equivalen a caja confirmada salvo que el pedido esté aprobado.',
  ]);
  assert.equal(copy.temporalSectionEyebrow, 'Patrones temporales');
  assert.equal(copy.temporalCards.byDayOfWeekEyebrow, 'Día de semana');
  assert.equal(copy.temporalCards.byHourEyebrow, 'Hora');
});
