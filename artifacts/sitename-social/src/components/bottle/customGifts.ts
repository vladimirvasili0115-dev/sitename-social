// Gift pictures from public/custom/gifts. Known names get a price and a place on the photo;
// any other picture put into that folder is added to the gift list automatically (price 2).
export type Place = "head" | "ears" | "body";
const prices: [RegExp, number][] = [
  [/^(bugatti|hammer|motorcycle|aircraft|helicopter|gwatch|manygifts\d*)$/, 5],
  [/^(crown\d|blackcrown|icecrown|gem\d|goldenmic|dollar|djmixer\d*|drumkit\d*|makarov|bed|eiffeltower|clutch|knight|labubu\d*|monomachhat|blackring|kingcap)$/, 3],
  [/^(air_kiss\d|candy\d+|egg\d|flower\d+|orchid|colander|maracas\d|nipple\d|pepper\d|cocoscocktail|bear\d)$/, 1],
];
export const customPrice = (name: string) => prices.find(([test]) => test.test(name))?.[1] ?? 2;
export const customPlace = (name: string): Place =>
  /^(ears|horns)/.test(name) ? "ears"
    : /(cap|crown|hat|cylinder|cowboy|napoleon|musketeer|nurse|clown|bezkoz|indianhat|carnivalmask|horsehead|knight|bow)/.test(name) ? "head"
    : "body";
// The order the pictures appear in the gift list (the rest follow in name order).
export const customOrder = [
  "air_kiss1", "air_kiss2", "air_kiss3", "air_kiss4", "air_kiss5", "crown1", "crown2", "crown3", "crown4", "blackcrown", "icecrown", "gem1", "gem2", "gem3", "gem4",
  "flower1", "flower2", "flower3", "flower4", "flower5", "flower6", "flower7", "flower8", "flower9", "flower10", "flower11", "orchid", "cactus",
  "bear1", "bear4", "bear6", "bear7", "flamingo", "labubu1", "cake", "cakeforher", "cakeforhim", "candybox", "candyheartcup", "icecream", "fruitbasket1", "cocoscocktail", "pepper1",
  "candy1", "candy2", "candy3", "candy4", "candy5", "candy6", "candy7", "candy8", "candy9", "candy10", "egg1", "egg2", "egg3",
  "bow_1", "bow_2", "bow_4", "bow_red", "bow_white", "ears1_2", "ears2_2", "ears3_2", "ears4_2", "ears5_2", "ears6_2", "ears7_2", "ears8", "ears9a",
  "babecap", "bosscap", "boybyecap", "classycap", "goodenuffcap", "goodvibescap", "kingcap", "mrcoolcap", "omgcap", "partycap", "baseballaz", "baseballam", "blackoverlordcap", "cappy",
  "cowboy", "cylinder", "cylinderw", "indianhat", "napoleon", "musketeer", "nurse", "bezkoz", "monomachhat", "noteshatb", "noteshatw", "partyhat1", "partyhat2", "partyhat3", "clown", "carnivalmask1", "carnivalmask2", "horseheadhat2", "knight",
  "iloveyou", "loveis1", "loveis2", "loveis3", "loveis4", "flagaz", "eiffeltower", "nipple1", "nipple2", "nipple3", "maracas1", "maracas2", "maracas3", "microphone", "goldenmic", "djmixer1", "drumkit1", "joystick",
  "clutch", "blackring", "gwatch", "dollar", "castetmug", "colander", "kick", "kickshoe", "leathershoes", "makarov", "bed", "manygifts1", "hammer", "bugatti", "motorcycle", "aircraft", "helicopter",
];
// Names of all gift pictures in the folder, in list order (from the build-time file list).
export function customGiftNames(files: Set<string>) {
  const names = [...files].filter((file) => file.startsWith("gifts/") && !file.includes("README")).map((file) => file.slice(6).replace(/\.[^.]+$/, ""));
  const unique = [...new Set(names)];
  const rank = (name: string) => { const at = customOrder.indexOf(name); return at < 0 ? 10000 : at; };
  return unique.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}
