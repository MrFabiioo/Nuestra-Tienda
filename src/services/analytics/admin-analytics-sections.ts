export type AdminAnalyticsProductPanel = 'status' | 'topByQty' | 'topByRevenue';
export type AdminAnalyticsMixPanel = 'payment' | 'estimatedProfit';

export interface AdminAnalyticsSectionsLayout {
  productGridClass: string;
  productPanels: AdminAnalyticsProductPanel[];
  mixGridClass: string;
  mixPanels: AdminAnalyticsMixPanel[];
}

export function buildAdminAnalyticsSectionsLayout(): AdminAnalyticsSectionsLayout {
  return {
    productGridClass: 'xl:grid-cols-3',
    productPanels: ['status', 'topByQty', 'topByRevenue'],
    mixGridClass: 'lg:grid-cols-2',
    mixPanels: ['payment', 'estimatedProfit'],
  };
}
