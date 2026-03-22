const SENSITIVE_PHONE_PATTERN = /(?<!\d)(?:\+?\d[\d\s().-]{7,}\d)(?!\d)/g;
const SENSITIVE_CARD_PATTERN = /(?<!\d)(?:\d[ -]*?){13,19}(?!\d)/g;

function sanitizeText(value, options = {}) {
  const { maxLength = 5000, allowNewlines = true } = options;
  const normalized = String(value ?? "")
    .replace(/\0/g, "")
    .replace(/\r/g, "")
    .replace(/<[^>]*>/g, "")
    .trim();

  const whitespaceSafe = allowNewlines
    ? normalized.replace(/[^\S\n]+/g, " ")
    : normalized.replace(/\s+/g, " ");

  return whitespaceSafe.slice(0, maxLength);
}

function stripSensitivePatterns(value) {
  return String(value ?? "")
    .replace(SENSITIVE_CARD_PATTERN, "[redacted-card]")
    .replace(SENSITIVE_PHONE_PATTERN, "[redacted-phone]");
}

function containsSensitivePatterns(value) {
  const text = String(value ?? "");
  return SENSITIVE_CARD_PATTERN.test(text) || SENSITIVE_PHONE_PATTERN.test(text);
}

function sanitizeFreeText(value, options = {}) {
  return stripSensitivePatterns(sanitizeText(value, options));
}

module.exports = {
  containsSensitivePatterns,
  sanitizeFreeText,
  sanitizeText,
  stripSensitivePatterns,
};
