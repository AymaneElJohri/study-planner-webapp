function sanitizeString(str) {
  if (typeof str !== 'string') return str
  // Basic neutralization: strip control chars and trim; avoid breaking valid text
  return str.replace(/[\u0000-\u001F\u007F]/g, '').trim()
}

function sanitizeValue(val) {
  if (val == null) return val
  if (typeof val === 'string') return sanitizeString(val)
  if (Array.isArray(val)) return val.map(sanitizeValue)
  if (typeof val === 'object') return sanitizeObject(val)
  return val
}

function sanitizeObject(obj) {
  const out = Array.isArray(obj) ? [] : {}
  for (const [k, v] of Object.entries(obj)) {
    out[k] = sanitizeValue(v)
  }
  return out
}

module.exports = { sanitizeObject }
