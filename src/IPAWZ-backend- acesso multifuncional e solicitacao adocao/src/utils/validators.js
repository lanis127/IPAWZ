function validId(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}
function validEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
function cleanText(value, maxLength) {
  if (value == null) return null;
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  if (text.length > maxLength) return undefined;
  return text || null;
}
module.exports = { validId, validEmail, cleanText };
