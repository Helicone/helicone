const STORAGE_KEY = "helicone_attribution";

export interface AttributionParams {
  gclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  captured_at?: string;
  landing_page?: string;
}

/**
 * Captures attribution parameters (gclid, UTM) from URL and stores in localStorage.
 * Only captures if no existing attribution is stored (first-touch model).
 * Call this on app mount.
 */
export function captureAttributionParams(search: string): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }

  // Check if we already have attribution stored (first-touch - don't overwrite)
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return;
  }

  const params = new URLSearchParams(search);
  const attribution: AttributionParams = {};

  // Google Click ID
  const gclid = params.get("gclid");
  if (gclid) {
    attribution.gclid = gclid;
  }

  // UTM parameters
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");
  const utmTerm = params.get("utm_term");
  const utmContent = params.get("utm_content");

  if (utmSource) attribution.utm_source = utmSource;
  if (utmMedium) attribution.utm_medium = utmMedium;
  if (utmCampaign) attribution.utm_campaign = utmCampaign;
  if (utmTerm) attribution.utm_term = utmTerm;
  if (utmContent) attribution.utm_content = utmContent;

  // Only store if we captured something
  if (Object.keys(attribution).length > 0) {
    attribution.captured_at = new Date().toISOString();
    attribution.landing_page = window.location.pathname;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  }
}

/**
 * Retrieves stored attribution parameters.
 */
export function getAttributionParams(): AttributionParams | null {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return null;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as AttributionParams;
  } catch {
    return null;
  }
}

interface GetAttributionOptions {
  omitUndefined?: boolean;
}

/**
 * Returns attribution params formatted for PostHog events/identify.
 * Uses $set_once prefix for first-touch attribution tracking.
 */
export function getAttributionForPostHog(
  options: GetAttributionOptions = {}
): Record<string, string | undefined> {
  const attribution = getAttributionParams();
  if (!attribution) {
    return {};
  }

  const result: Record<string, string | undefined> = {
    $initial_gclid: attribution.gclid,
    $initial_utm_source: attribution.utm_source,
    $initial_utm_medium: attribution.utm_medium,
    $initial_utm_campaign: attribution.utm_campaign,
    $initial_utm_term: attribution.utm_term,
    $initial_utm_content: attribution.utm_content,
    $initial_landing_page: attribution.landing_page,
  };

  if (options.omitUndefined) {
    return Object.fromEntries(
      Object.entries(result).filter(([, v]) => v !== undefined)
    );
  }

  return result;
}

/**
 * Clears stored attribution (useful for testing or reset scenarios).
 */
export function clearAttribution(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
