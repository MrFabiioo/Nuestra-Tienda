import {
  destroyAdminAnalyticsDashboard,
  initAdminAnalyticsDashboard,
  type AdminAnalyticsDashboardLifecycle,
} from './admin-analytics-dashboard';

declare const analyticsDocument: Document;

const cleanupWithExplicitDocument = initAdminAnalyticsDashboard(analyticsDocument);
cleanupWithExplicitDocument();

const cleanupWithGlobalDocument = initAdminAnalyticsDashboard();
cleanupWithGlobalDocument();

destroyAdminAnalyticsDashboard(analyticsDocument);
destroyAdminAnalyticsDashboard();

const lifecycle: AdminAnalyticsDashboardLifecycle = {
  mount: (root?: Document) => initAdminAnalyticsDashboard(root),
  destroy: (root?: Document) => destroyAdminAnalyticsDashboard(root),
};

lifecycle.mount(analyticsDocument)();
lifecycle.destroy(analyticsDocument);
