let sequence = 0;

export function createId(prefix = "id") {
  sequence += 1;
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${sequence}_${random}`;
}

export function stableHash(value) {
  const source = String(value || "");
  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `h_${(hash >>> 0).toString(16)}`;
}
