"use client";

import { useReportWebVitals } from "next/web-vitals";

type GtagFn = (
  command: "event",
  eventName: string,
  params: Record<string, unknown>,
) => void;

function sendToAnalytics(metric: {
  id: string;
  name: string;
  label: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  navigationType: string;
}) {
  const gtag = (globalThis as unknown as { gtag?: GtagFn }).gtag;
  if (!gtag) return;

  // GA4 expects integers. Web-vitals recommends scaling CLS by 1000.
  const value = metric.name === "CLS" ? Math.round(metric.value * 1000) : Math.round(metric.value);

  gtag("event", "web_vitals", {
    event_category: "Web Vitals",
    event_label: metric.name,
    value,
    metric_id: metric.id,
    metric_value: metric.value,
    metric_delta: metric.delta,
    metric_rating: metric.rating,
    navigation_type: metric.navigationType,
  });
}

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Always log in dev; send to GA when configured.
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.debug("[web-vitals]", metric);
    }
    sendToAnalytics(metric as unknown as Parameters<typeof sendToAnalytics>[0]);
  });

  return null;
}

