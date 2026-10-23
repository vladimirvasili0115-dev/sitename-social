// Default avatar for accounts without a photo: the first letter of the name on the accent colour.
export function initialsAvatar(name: string) {
  const letter = (Array.from(name.trim())[0] ?? "?").toUpperCase().replace(/[<>&"']/g, "?");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#14B8A6"/><text x="40" y="53" font-family="Arial,sans-serif" font-size="36" font-weight="700" fill="#0B1215" text-anchor="middle">${letter}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
