'use client';

export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

type AnalyticsWindow = typeof window & {
  dataLayer?: Array<Record<string, unknown>>;
};

function cleanParams(params: AnalyticsParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

export function trackEvent(event: string, params: AnalyticsParams = {}) {
  if (typeof window === 'undefined') return;

  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
  analyticsWindow.dataLayer.push({
    event,
    ...cleanParams(params),
  });
}

export function trackCtaClick(name: string, params: AnalyticsParams = {}) {
  trackEvent('cta_click', {
    cta_name: name,
    ...params,
  });
}

export function trackPartnerClickEvent(params: {
  partnerId: string;
  partnerName: string;
  partnerCategory: string;
  action: 'phone' | 'whatsapp' | 'offer' | 'waze';
  placement: string;
  partnerLocationId?: string;
  partnerLocationName?: string;
  isPremium?: boolean;
}) {
  trackEvent('partner_click', {
    partner_id: params.partnerId,
    partner_name: params.partnerName,
    partner_category: params.partnerCategory,
    partner_action: params.action,
    partner_placement: params.placement,
    partner_location_id: params.partnerLocationId,
    partner_location_name: params.partnerLocationName,
    partner_is_premium: params.isPremium,
  });
}
