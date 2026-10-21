// Name changes: the first two are free, the third after 15 days, then one every 3 months (the server enforces the same).
export function nextNameChange(changes = 0, changedAt?: string): Date | null {
  if (changes < 2 || !changedAt) return null;
  const at = new Date(changedAt).getTime() + (changes === 2 ? 15 : 90) * 86_400_000;
  return at > Date.now() ? new Date(at) : null;
}
