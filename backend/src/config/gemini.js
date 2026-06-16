/**
 * Gemini API helper with automatic model fallback on quota exhaustion.
 * Cycles through free-tier eligible models when one hits its rate limit,
 * so the app keeps working without a paid API key.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Free-tier eligible Gemini models, ordered by preference (best first)
const FREE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
];

// HTTP status codes that indicate quota / rate-limit exhaustion
const QUOTA_STATUS_CODES = [429, 403];

// Keywords in error messages that signal a quota issue
const QUOTA_KEYWORDS = [
  'quota',
  'rate_limit',
  'rate limit',
  'resource_exhausted',
  'resource has been exhausted',
  'too many requests',
  'overloaded',
  'capacity',
  'insufficient tokens',
  'daily limit',
  'limit exceeded',
];

/**
 * Check whether an error from the Gemini SDK is a quota / rate-limit error
 * that should trigger a model fallback rather than being surfaced to the user.
 */
function isQuotaError(error) {
  // Check HTTP status code on the error object or its response
  const status = error.status || error.response?.status;
  if (status && QUOTA_STATUS_CODES.includes(status)) return true;

  // Check the error message text for well-known quota phrases
  const message = (error.message || '').toLowerCase();
  return QUOTA_KEYWORDS.some(keyword => message.includes(keyword));
}

// Module-level index for round-robin distribution across requests
let modelIndex = 0;

function getNextModelIndex() {
  const idx = modelIndex;
  modelIndex = (modelIndex + 1) % FREE_MODELS.length;
  return idx;
}

/**
 * Make a Gemini API call with automatic model fallback on quota errors.
 *
 * Iterates through FREE_MODELS starting from a rotating offset so
 * successive requests don't all hit the same model first.  If every
 * model has been exhausted the promise rejects with `code ===
 * 'ALL_MODELS_EXHAUSTED'` and a user-facing message.
 *
 * @param {Function} callFn - Async function(genAI, modelName) => result
 * @param {Object}   [options]
 * @param {number}   [options.timeoutMs=30000]    Per-attempt timeout
 * @param {number}   [options.retryDelayMs=300]   Delay between fallback attempts
 * @returns {Promise<any>} The resolved value from the first successful callFn
 */
async function withModelFallback(callFn, options = {}) {
  const { timeoutMs = 30000, retryDelayMs = 300 } = options;
  const errors = [];

  const startIdx = getNextModelIndex();

  for (let i = 0; i < FREE_MODELS.length; i++) {
    const modelName = FREE_MODELS[(startIdx + i) % FREE_MODELS.length];
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    try {
      // Per-model timeout — race the call against a timer
      const result = await Promise.race([
        callFn(genAI, modelName),
        new Promise((_, reject) =>
          setTimeout(() => reject(Object.assign(new Error('Request timed out'), { code: 'TIMEOUT' })), timeoutMs)
        ),
      ]);
      return result;
    } catch (error) {
      // Timeout is not a quota error; rethrow immediately
      if (error.code === 'TIMEOUT') throw error;

      if (isQuotaError(error)) {
        errors.push({ model: modelName, message: error.message });
        console.warn(
          `⚠️  Gemini model "${modelName}" quota exceeded: ${error.message.slice(0, 80)}. ` +
          `Trying next free model...`
        );
        // Brief pause before retrying so the next model's request doesn't
        // arrive back-to-back with the failed one
        if (i < FREE_MODELS.length - 1) {
          await new Promise(r => setTimeout(r, retryDelayMs));
        }
        continue;
      }

      // Non-quota error — rethrow immediately (auth failure, bad request, etc.)
      throw error;
    }
  }

  // Every free model is exhausted right now
  const overloaded = new Error('The server is overloaded');
  overloaded.code = 'ALL_MODELS_EXHAUSTED';
  overloaded.details = errors;
  throw overloaded;
}

module.exports = {
  withModelFallback,
  FREE_MODELS,
};
