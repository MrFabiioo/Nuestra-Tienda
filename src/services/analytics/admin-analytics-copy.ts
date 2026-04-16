export interface AdminAnalyticsStaticCopy {
  hero: {
    badges: {
      context: string;
    };
    title: string;
    description: string;
  };
  trendAlert: {
    title: string;
    description: string;
  };
  temporalWarnings: string[];
  temporalSectionEyebrow: string;
  temporalCards: {
    byDayOfWeekEyebrow: string;
    byHourEyebrow: string;
  };
}

export function buildAdminAnalyticsStaticCopy(): AdminAnalyticsStaticCopy {
  return {
    hero: {
      badges: {
        context: 'Resumen ejecutivo + rentabilidad estimada + mix operativo',
      },
      title: 'Analytics con lectura honesta del negocio',
      description: 'Primero separá demanda bruta, facturación confirmada y carga operativa. Después mirá rentabilidad estimada por producto, mix de pago y patrones temporales.',
    },
    trendAlert: {
      title: 'Lectura temporal',
      description: 'La serie diaria te ayuda a detectar ritmo comercial y evolución de pedidos a lo largo del tiempo.',
    },
    temporalWarnings: [
      'Usá estas vistas para detectar concentración de demanda por día y franja horaria.',
      'Combiná esta lectura con el pipeline y el mix operativo para decidir refuerzos, cobertura y prioridades.',
      'Las métricas de monto bruto e histórico NO equivalen a caja confirmada salvo que el pedido esté aprobado.',
    ],
    temporalSectionEyebrow: 'Patrones temporales',
    temporalCards: {
      byDayOfWeekEyebrow: 'Día de semana',
      byHourEyebrow: 'Hora',
    },
  };
}
