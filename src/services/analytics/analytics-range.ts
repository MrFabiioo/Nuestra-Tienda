import { businessDateToUTC } from './business-timezone';

export type AnalyticsRangeInput = {
  from?: string;
  to?: string;
} | undefined;

export function resolveAnalyticsRange(input?: AnalyticsRangeInput) {
  if (!input?.from || !input?.to || input.from >= input.to) {
    return undefined;
  }

  return {
    from: businessDateToUTC(input.from, false),
    to: businessDateToUTC(input.to, true),
  };
}
