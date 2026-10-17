// Song search helpers: forgiving matching (typos, Latin ↔ Cyrillic, Azerbaijani letters) and ordering by how well
// a title fits the query, so "nuray meherov", "Nuray Məhərov" and "нурай" all find the same song.

const AZ: Record<string, string> = { ə: "e", ı: "i", ö: "o", ü: "u", ş: "s", ç: "c", ğ: "g", x: "x" };
const RU2LAT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
  п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

// Lower case, Latin letters only where possible, no accents or punctuation.
export function normalizeSong(text: string) {
  let out = "";
  for (const char of text.toLowerCase()) out += RU2LAT[char] ?? AZ[char] ?? char;
  return out.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

// Letters that sound alike in different spellings ("sh"/"s", "ch"/"c", "kh"/"h") are treated as the same.
const loose = (word: string) => word.replace(/sh/g, "s").replace(/ch/g, "c").replace(/kh/g, "h").replace(/zh/g, "j").replace(/y/g, "i");

// Number of single-letter edits (insert, delete, change, swap) between two words.
function edits(a: string, b: string) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d = Array.from({ length: rows }, (_, i) => Array.from({ length: cols }, (__, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}
const allowed = (word: string) => (word.length <= 3 ? 0 : word.length <= 6 ? 1 : 2);

// 0 when nothing matches; up to 1 when every word of the query is in the title (typos cost a little).
export function songScore(query: string, title: string) {
  const words = normalizeSong(query).split(" ").filter(Boolean).map(loose);
  const titleWords = normalizeSong(title).split(" ").filter(Boolean).map(loose);
  if (!words.length || !titleWords.length) return 0;
  let hits = 0;
  let penalty = 0;
  let first = Infinity;
  for (const word of words) {
    let at = titleWords.findIndex((part) => part === word || part.startsWith(word));
    if (at < 0) {
      let best = Infinity;
      titleWords.forEach((part, index) => { const d = edits(word, part); if (d < best) { best = d; at = index; } });
      if (best > allowed(word)) at = -1;
      else penalty += 0.15;
    }
    if (at >= 0) { hits++; first = Math.min(first, at); }
  }
  if (!hits) return 0;
  return 0.5 + 0.5 * (hits / words.length) - penalty + (first === Infinity ? 0 : 0.05 / (1 + first));
}

// Best matches first; items that do not match at all are dropped.
export function rankSongs<T extends { title: string }>(query: string, items: T[]) {
  return items.map((item, order) => ({ item, order, score: songScore(query, item.title) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map((entry) => entry.item);
}

// "3:45" or "1:02:10" → seconds.
export function durationSeconds(text?: string) {
  if (!text) return 0;
  return text.split(":").reduce((sum, part) => sum * 60 + Number(part || 0), 0);
}
