"use client";

import mixpanel from "mixpanel-browser";

type MixpanelRuntime = typeof mixpanel & {
  start_session_recording?: () => void;
  stop_session_recording?: () => void;
  get_session_recording_properties?: () => Record<string, unknown>;
  get_session_replay_url?: () => string | null;
};

let initialized = false;
let sessionRecordingActive = false;

export function isMixpanelEnabled() {
  return process.env.NEXT_PUBLIC_ENABLE_MIXPANEL === "true" && Boolean(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN);
}

export function getMixpanel() {
  return mixpanel as MixpanelRuntime;
}

export function initMixpanel() {
  if (typeof window === "undefined") return false;
  if (initialized) return true;
  if (!isMixpanelEnabled()) {
    if (process.env.NODE_ENV === "development") console.log("Mixpanel disabled or missing NEXT_PUBLIC_MIXPANEL_TOKEN.");
    return false;
  }

  const recordingPercent = Number.parseFloat(process.env.NEXT_PUBLIC_MIXPANEL_RECORDING_PERCENT ?? "0");

  mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!, {
    track_pageview: "url-with-path",
    autocapture: false,
    record_sessions_percent: Number.isFinite(recordingPercent) ? recordingPercent : 0,
    record_mask_all_text: true,
    record_mask_all_inputs: true,
    record_block_selector: "img, video, [data-mp-block]",
    record_network: false,
    record_heatmap_data: false,
    ignore_dnt: false,
    persistence: "localStorage"
  });

  initialized = true;
  if (process.env.NODE_ENV === "development") {
    console.log("Mixpanel initialized. Change NEXT_PUBLIC_MIXPANEL_RECORDING_PERCENT to adjust replay sampling.");
  }
  return true;
}

export function isPublicReplayRoute(pathname: string) {
  return !isBlockedReplayRoute(pathname);
}

export function isBlockedReplayRoute(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/workbench/admin") ||
    pathname.startsWith("/desrist-evaluation/admin")
  );
}

export function updateSessionRecordingForRoute(pathname: string) {
  if (typeof window === "undefined") return;
  if (!initMixpanel()) return;

  const client = getMixpanel();
  if (!isPublicReplayRoute(pathname)) {
    client.stop_session_recording?.();
    sessionRecordingActive = false;
    return;
  }

  if (!sessionRecordingActive) {
    client.start_session_recording?.();
    sessionRecordingActive = true;
  }
}

export function trackMixpanelEvent(eventName: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!initMixpanel()) return;
  getMixpanel().track(eventName, sanitizeProperties(properties));
}

export function trackMixpanelPageView(path?: string) {
  if (typeof window === "undefined") return;
  if (!initMixpanel()) return;
  getMixpanel().track_pageview({ page: path ?? window.location.pathname });
}

export function getReplayProperties() {
  if (typeof window === "undefined" || !initialized) return {};
  return getMixpanel().get_session_recording_properties?.() ?? {};
}

export function getReplayUrl() {
  if (typeof window === "undefined" || !initialized) return null;
  return getMixpanel().get_session_replay_url?.() ?? null;
}

function sanitizeProperties(properties?: Record<string, unknown>) {
  if (!properties) return undefined;
  const blockedKeys = new Set(["name", "email", "question", "prompt", "message", "text", "raw_text", "feedback", "notes", "token", "password"]);
  return Object.fromEntries(Object.entries(properties).filter(([key]) => !blockedKeys.has(key.toLowerCase())));
}
