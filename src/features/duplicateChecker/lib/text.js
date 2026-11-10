const STOP_WORDS = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'should', 'must', 'shall', 'will', 'can', 'from', 'into', 'are', 'was', 'were', 'have', 'has', 'their', 'they', 'them', 'each', 'every', 'all', 'any', 'not', 'but', 'when', 'user', 'users', 'able', 'does', 'such']);
export function tokenize(text) {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 2 && !STOP_WORDS.has(word));
}
export function topWords(words, limit) {
  const counts = new Map();
  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([word]) => word);
}
