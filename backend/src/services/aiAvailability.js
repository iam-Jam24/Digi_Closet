/**
 * In-process circuit breaker for AI models and providers.
 *
 * When a model reports that it has no quota at all (e.g. a Gemini image model
 * on a free-tier key), retrying is pointless until billing or the quota
 * changes. Such a model is marked unavailable for AI_QUOTA_COOLDOWN_MS and
 * skipped without a network call until then. State lives in memory, so a
 * server restart clears it.
 */

const env = require('../config/env');

const blocked = new Map(); // key -> { until, reason }

function markUnavailable(key, reason = '', ms = env.AI_QUOTA_COOLDOWN_MS) {
  blocked.set(key, { until: Date.now() + ms, reason });
}

function isAvailable(key) {
  const entry = blocked.get(key);
  if (!entry) return true;
  if (Date.now() >= entry.until) {
    blocked.delete(key);
    return true;
  }
  return false;
}

// When `key` becomes usable again (ms timestamp), or null if it is usable now.
function unavailableUntil(key) {
  return isAvailable(key) ? null : blocked.get(key).until;
}

function reset() {
  blocked.clear();
}

module.exports = { markUnavailable, isAvailable, unavailableUntil, reset };
