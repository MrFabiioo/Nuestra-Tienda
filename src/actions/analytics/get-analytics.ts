import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { requireAdminAccess } from '../../firebase/guards';
import { resolveAnalyticsRange } from '../../services/analytics/analytics-range';
import { getAnalyticsData } from '../../services/analytics/repository';

export const getAnalytics = defineAction({
  accept: 'json',
  input: z.object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }).optional(),
  handler: async (input, context) => {
    requireAdminAccess(context, 'ver analytics');

    const range = resolveAnalyticsRange(input);

    return await getAnalyticsData(range);
  },
});
