import "server-only";

export const NATIVE_OKF_LIVE_DATA_BOUNDARY_RESPONSE =
  "This library does not provide live external market data. It can answer questions about the stored DSR and blockchain design knowledge.";

const LIVE_QUALIFIER =
  /\b(?:live|real[\s-]*time|right now|today(?:'s)?|currently|current|latest|up[\s-]*to[\s-]*date|next)\b/iu;
const EXTERNAL_DATA_SUBJECT =
  /\b(?:prices?|quotes?|quotations?|exchange rates?|market capitalization|market cap|profitability|investment returns?|trading signals?|weather|forecasts?|news|headlines?|sports?|scores?|fixtures?|game|match|schedules?|office holders?|presidents?|prime ministers?|chancellors?|chief executive officers?|ceos?|external statistics?|polls?|election results?)\b/iu;
const INHERENTLY_LIVE_REQUEST =
  /\b(?:weather forecast|stock quote|market quote|live score|sports score|news headline|exchange rate|real[\s-]*time status|outside (?:the )?(?:stored )?library)\b|\bwho\s+is\s+(?:the\s+)?(?:president|prime minister|chancellor|chief executive officer|ceo)\b/iu;

/**
 * Blocks requests that require a current external feed before retrieval or any
 * paid reservation. Stored-library uses of words such as "current paper",
 * "market design", and "price mechanism" do not match without a live subject.
 */
export function isNativeOkfLiveDataRequest(question: string): boolean {
  const normalized = question.replace(/\s+/gu, " ").trim();
  return INHERENTLY_LIVE_REQUEST.test(normalized) ||
    (LIVE_QUALIFIER.test(normalized) && EXTERNAL_DATA_SUBJECT.test(normalized));
}
