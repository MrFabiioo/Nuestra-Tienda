import { defineAction } from 'astro:actions';
import { requireAuth } from '../../firebase/guards';
import { getAnalyticsData } from '../../services/analytics/repository';

export const getAnalytics = defineAction({
  accept: 'json',
  handler: async (_input, context) => {
    requireAuth(context);
    return await getAnalyticsData();
  },
});
