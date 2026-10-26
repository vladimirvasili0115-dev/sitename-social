// Measures how long the server takes to answer the gift calls (shown in the PerfMeter: open the game as /bottle/?perf=1).
type Sample = { at: number; ms: number; ok: boolean };
const samples: Sample[] = [];
let pending = 0;

export const rpcStart = () => { pending++; return performance.now(); };
export function rpcEnd(started: number, ok: boolean) {
  pending = Math.max(0, pending - 1);
  const now = performance.now();
  samples.push({ at: now, ms: now - started, ok });
  while (samples.length && now - samples[0].at > 10000) samples.shift();
}

// The last 10 seconds: calls, average and slowest answer, failed calls, calls still waiting for the server.
export function giftRpcStats() {
  const now = performance.now();
  const list = samples.filter((item) => now - item.at <= 10000);
  const total = list.reduce((sum, item) => sum + item.ms, 0);
  return { n: list.length, avg: list.length ? Math.round(total / list.length) : 0, max: list.length ? Math.round(Math.max(...list.map((item) => item.ms))) : 0, fail: list.filter((item) => !item.ok).length, pending };
}
