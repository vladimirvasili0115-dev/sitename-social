// Drawn sample portraits for the demo players (no photos of real people).
const skins = ["#F6D3B3", "#EBC09A", "#D9A679", "#F2C7A5"];
const hairs = ["#2B1D14", "#4A2E1B", "#111111", "#7A4A23", "#C98A3A", "#5B3A29"];
const shirts = ["#2F6FE0", "#E0457B", "#1FA37A", "#8B5CF6", "#F08A24", "#22313F", "#D43D3D", "#0EA5B7"];
const backs = ["#DCE8EE", "#F3E3D3", "#E3E9D8", "#E9DDF0", "#F5D9DF", "#D8E6F3"];

export function cartoonAvatar(seed: number, female: boolean) {
  const pick = <T,>(list: T[], shift: number) => list[(seed * 7 + shift * 3) % list.length];
  const skin = pick(skins, 1);
  const hair = pick(hairs, 2);
  const shirt = pick(shirts, 3);
  const back = pick(backs, 4);
  const glasses = seed % 4 === 1;
  const beard = !female && seed % 3 === 0;
  const hairShape = female
    ? `<path d="M26 60c0-26 12-40 34-40s34 14 34 40v38c0 6-6 8-10 4V62H36v40c-4 4-10 2-10-4z" fill="${hair}"/>`
    : `<path d="M32 50c-2-20 10-32 28-32 16 0 30 8 28 32-4-10-12-14-28-14s-24 4-28 14z" fill="${hair}"/>`;
  const fringe = female ? `<path d="M36 52c4-14 14-20 26-20 10 0 18 6 22 18-10-6-18-8-26-8s-14 2-22 10z" fill="${hair}"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
<rect width="120" height="120" fill="${back}"/>
<path d="M14 120c0-22 20-32 46-32s46 10 46 32z" fill="${shirt}"/>
<path d="M48 84h24v12c0 6-5 10-12 10s-12-4-12-10z" fill="${skin}"/>
${female ? hairShape : ""}
<ellipse cx="60" cy="58" rx="24" ry="28" fill="${skin}"/>
${female ? fringe : hairShape}
${beard ? `<path d="M38 64c2 20 12 26 22 26s20-6 22-26c-6 8-14 10-22 10s-16-2-22-10z" fill="${hair}"/>` : ""}
<circle cx="50" cy="58" r="3" fill="#2A1A12"/><circle cx="70" cy="58" r="3" fill="#2A1A12"/>
<circle cx="45" cy="68" r="4.500" fill="#F28B82" opacity="${female ? 0.55 : 0.3}"/><circle cx="75" cy="68" r="4.500" fill="#F28B82" opacity="${female ? 0.55 : 0.3}"/>
<path d="M52 72c4 5 12 5 16 0" stroke="${female ? "#C2334D" : "#7A3B2A"}" stroke-width="${female ? 3.2 : 2.4}" stroke-linecap="round" fill="none"/>
${glasses ? `<g fill="none" stroke="#C0392B" stroke-width="2.4"><circle cx="50" cy="58" r="8"/><circle cx="70" cy="58" r="8"/><path d="M58 58h4"/></g>` : ""}
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
