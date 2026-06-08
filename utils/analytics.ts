"use client";

import { getReplayProperties, getReplayUrl, trackMixpanelEvent, trackMixpanelPageView } from "@/lib/mixpanel";

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  trackMixpanelEvent(eventName, properties);
}

export function trackPageView(path?: string) {
  trackMixpanelPageView(path);
}

export function trackSurveyStarted() {
  trackEvent("survey_started", { route: "/desrist-evaluation" });
}

export function trackSurveyCompleted(properties: {
  role: string;
  dsr_experience: string;
  dlt_experience: string;
}) {
  trackEvent("survey_completed", properties);
}

export function trackChatOpened() {
  trackEvent("chat_opened");
}

export function trackChatQuestionSubmitted(properties?: { latency_ms?: number; retrieved_source_count?: number }) {
  trackEvent("chat_question_submitted", properties);
}

export function trackGeneratedFlowViewed(properties?: { route?: string; paper_id?: string; node_count?: number; edge_count?: number }) {
  trackEvent("generated_flow_viewed", properties);
}

export function trackPaperOpened(paperId: string, paperTitle?: string) {
  trackEvent("paper_opened", { paper_id: paperId, paper_title: paperTitle });
}

export function trackFlowInteraction(action: string, paperId?: string) {
  trackEvent("flow_interaction", { action, paper_id: paperId });
}

export function getReplayMetadata() {
  return {
    replayProperties: getReplayProperties(),
    replayUrl: getReplayUrl()
  };
}
