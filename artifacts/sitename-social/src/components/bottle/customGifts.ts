// Gift pictures from public/custom/gifts. Known names get a price and a place on the photo;
// any other picture put into that folder is added to the gift list automatically (price 2).
export type Place = "head" | "ears" | "face" | "body";
const prices: [RegExp, number][] = [
  [/^(bugatti|hammer|motorcycle|aircraft|helicopter|gwatch|manygifts\d*|retrocar|tank|rolex\w*|vip\w+|sphinx|weddingring\d|tsarscup|suitcase)$/, 5],
  [/^(ring\w+|watch\w+|pocketclock|revolver|unicorn|prankcake_\w+)$/, 3],
  [/^(sweet\d|strawberry\d|tomato\d|wholeegg|smoothie|slug_\d)$/, 1],
  [/^(crown\d|blackcrown|icecrown|gem\d|goldenmic|dollar|djmixer\d*|drumkit\d*|makarov|bed|eiffeltower|clutch|knight|labubu\d*|monomachhat|blackring|kingcap)$/, 3],
  [/^(ruby\w+|oscar|iwatch|goldenapple|honeybarrel|kokoshnik|manekineko|sheriffstar|londonphone|mobile)$/, 3],
  [/^(ges_\w+|heart\d|notes\d|hamburger|tea|poop|heineken)$/, 1],
  [/^(air_kiss\d|candy\d+|egg\d|flower\d+|orchid|colander|maracas\d|nipple\d|pepper\d|cocoscocktail|bear\d)$/, 1],
];
// From the original game's settings: price and where the gift sits (d = beside the photo, h = on the head, a = on the photo).
const originalData = "3september:1d air_kiss1:1a air_kiss2:1a air_kiss3:1a air_kiss4:1a air_kiss5:1a aircraft:1d alarmclock:1d amurchik:2d ananas:1d astronaut:1a astronaut_ch:1a astronaut_eu:1a astronaut_ru:1a astronaut_us:1a b52:2d babecap:2h babycocktail:2d baloon1:1d baloon2:1d baloon3:1d banana:1d baseballam:2h baseballaz:2h bbq:1d bear1:1a bear4:1a bear6:1a bear7:1a bed:3d beer:1d bezkoz:2h birds:1d birthdaycake:1d birthdaycake2:1d birthdaycake3:1d blackcrown:3h blackoverlordcap:2h blackring:1d blackrose:1a bloodymary:1d bluelagoon:1d bosscap:2h bouquet:1d bouquet2:1d bow_1:2h bow_2:2h bow_4:2h bowidle:3h boybyecap:2h brokenheart:1a bugatti:3d cactus:1d cake:1d cakeforher:1d cakeforhim:1d camera:1d candle:1d candy1:1a candy10:1a candy2:1a candy3:1a candy4:1a candy5:1a candy6:1a candy7:1a candy8:1a candy9:1a candybox:1d candyheartcup:1d cappy:2h carnivalmask1:2h carnivalmask2:2h castetmug:1d champagne:1d chemistry:1d chertovka:1d chess:1d chinese:1d christmasball:1d classycap:2h clown:2h clutch:1d cocoscocktail:1d coffee:1d cognacglass:1d colamentos:2d colander:2h compass:1d cooler:1d corgidog:1d cowboy:2h crown1:3h crown2:3h crown3:3h crown4:3h cuckooclock:1d cufflinks:1d cylinder:2h cylinderw:2h daiquiri:1d diamond:1d dinosaur:2d djmixer1:2d dollar:1a doshirak:1d drinkam:1d drinkaz:1d drinkby:1d drinkge:1d drinkkg:1d drinkkz:1d drinkru:1d drinkua:1d drinkus:1d drinkuz:1d drumkit1:2d dynamite:3d ears1_2:2h ears2_2:2h ears3_2:2h ears4_2:2h ears5_2:2h ears6_2:2h ears7_2:2h ears8:2h ears9a:2h easterrabbit:1d egg1:1a egg2:1a egg3:1a eggplant:1d eggskiss:2d eiffeltower:1d elephant:1d faberge:1d fan:1d fern:1d fire:1d firehorse:3d flagaz:1d flamingo:1d flower1:1a flower10:1a flower11:1a flower2:1a flower3:1a flower4:1a flower5:1a flower6:1a flower7:1a flower8:1a flower9:1a flowerspink:1d flowersviolet:1d flowerswhitered:1d flowersyellow:1d football:1a friedpotatoes:1d frog:2a fruitbasket1:2d funnyanimal:1d gascan_1:3d gascan_2:3d gascan_3:3d gem1:1a gem2:1a gem3:1a gem4:1a gem5:1a genielamp:1d glassshoe:3d glintwein:1d globe:1d goldenapple:3d goldenmic:3d goldpot:1d goodenuffcap:2h goodvibescap:2h gramophone:3d grandpiano:3d grog:1d groundhog:1d gwatch:1d hamburger:1d hammer:2d handcuffs:1a harp:3d healthdrink:1d heart1:5d heart2:5d heart3:5d heartangel:1a heartdevil:1a heartlock:1d heineken:1d helicopter:2d hockeycup:1d honeybarrel:1d hookah:1d horseheadhat2:2h icecream:1d icecrown:2h iloveyou:1a indianhat:2h iwatch:1d jam:1d japanesefan:1d joystick:1d juice:1d kick:2a kickshoe:2a kinder2:1d kinder3:1d kinder4:1d kinder5:1d kingcap:2h knight:2h kokoshnik:2h labubu1:1a labubu2:1a labubu3:1a latte:1d leathershoes:5d ledglasses:3h liberty:1d lifestyle:1d lighter:1d lionet:2d lipstick:1d londonphone:1d love:2d lovecompote:3d loveis1:1a loveis2:1a loveis3:1a loveis4:1a lovepotion:1d magichat:1d makarov:1d mandarin:1d manekineko:1d manygifts1:2d maracas1:1a maracas2:1a maracas3:1a maroccantea:1d martini:1d matreshka:1d meldonium:1d menorah:1d microphone:1d migalka:2h milk:1d milkcoctail:1d mineralka:1d minerhat:2h mobile:2d mojito:1d monomachhat:3h motorcycle:1d mrcoolcap:2h musketeer:2h napoleon:2h nipple1:1d nipple2:1d nipple3:1d nokia:2d notes1:1a notes2:1a notes3:1a notes4:1a noteshatb:2h noteshatw:2h nurse:2h ololosh:2h omgcap:2h orangutan:1d orchid:1d oscar:1d owl:1d panda:1d partycap:2h partyhat1:2h partyhat2:2h partyhat3:2h peach:1d pearl:1d pepper1:1a pepper2:1a pepper3:1a perfume:1d petcat:3d petdog:3d pharaoh2:3h pig:1d pilotka:2h pinacolada:1d pinguin:1d pipe:1d pirat:2h pirateparrot:1d pirateswords:1d pisatower:1d plunger:5d pocketclock:1d poison:1d polaroid1:1a polaroid2:1a polaroid3:1a polaroid4:1a polaroid5:1a poop:2d prankcake_blue1:3a prankcake_blue2:3a prankcake_choko1:3a prankcake_choko2:3a prankcake_yellow1:3a prankcake_yellow2:3a queencap:2h rabbitcap:2h rassol:1d rasta:2h reindeer:1d retrocar:2d revolver:2d ringblack:1d ringflower:1d ringiy:1d ringwhite:1d rocket:1d rolexblack:2d rolexwhite:2d romanticcandle:1d romcola:1d rose:1d roseinglass:1d rubyearrings:3d rubyglasses2:3h rubyheart:3d rubyrose:3d rubyshoes:3d rzdtea:1d salute2:1a salute3:1a salute4:1a samovar:1d savagecap:2h sexonthebeach:2d sheriffstar:1a shitcap:2h sigara:1d skull:3d slug_1:2h slug_2:2h slug_3:2h smilecup:1d smoothie:1d snakepot:3d snowdrops:1d sombrero:2h spacecocktail:1d spaghetti:2h sparta:2h sphinx:1d sponge_green:1a sponge_violet:1a sponge_yellow:1a springcocktail:1d springwreath:2h squirrel:1d starbucks:1d strawberry1:1a strawberry2:1a strawberry3:1a strawberry4:1a strawhat:2h submarine:1d suitcase:2d sultan:2h sunflower:2d supermecap:2h surprizebox:1d sweet1:1a sweet2:1a sweet3:1a sweet4:1a tank:1d tarantula:1d tarhun:1d taxi:2h tea:1d teapot:1d tearssnake:1d teddybear:1d tequilashot:1d tomato1:1a tomato2:1a tomato3:1a trash:2d trashcan1:2d trumpet:2d tsarscup:3d tub:2d turkishcoffee:1d ufo:1d unicorn:1d universal:1d ushanka:2h valenok:1a valenok2:1a valenok3:1a valentine2:1a valentine3:1a valentine4:1a valentine5:1a vanilla:1d venus:1d viking:2h vipchampagne:1d vipcock:2a vipcrown:3h vipgold:3d viphorseshoe:1d vipkalash2:1d viplegbox:1d vipring:1d viproses:1d vodka:3d voodoo:1a watchman:1d watchwoman:1d weddingring1:1d weddingring2:1d weddingring3:1d weddingring4:1d whiskey:1d wholeegg:1a wine:1d zucchini:1d";
const original = new Map(originalData.split(" ").map((entry) => { const [name, value] = entry.split(":"); return [name, { price: Number(value.slice(0, -1)), point: value.slice(-1) }] as const; }));
export const customPrice = (name: string) => (drinkNames.test(name) ? 2 : prices.find(([test]) => test.test(name))?.[1] ?? original.get(name)?.price ?? 2);
export const customPlace = (name: string): Place =>
  /^(ears|horns)/.test(name) ? "ears"
    : /^(prankcake_\w+2|tomato[23])$/.test(name) ? "face"
    : /(cap|crown|hat|cylinder|cowboy|napoleon|musketeer|nurse|clown|bezkoz|indianhat|carnivalmask|horsehead|knight|bow|pharaoh|pilotka|pirat|rasta|sombrero|sparta|sultan|ushanka|viking|glasses)/.test(name) || original.get(name)?.point === "h" ? "head"
    : "body";
// The order the pictures appear in the gift list (the rest follow in name order).
export const customOrder = [
  "air_kiss1", "air_kiss2", "air_kiss3", "air_kiss4", "air_kiss5", "crown1", "crown2", "crown3", "crown4", "blackcrown", "icecrown", "gem1", "gem2", "gem3", "gem4",
  "flower1", "flower2", "flower3", "flower4", "flower5", "flower6", "flower7", "flower8", "flower9", "flower10", "flower11", "orchid", "cactus",
  "bear1", "bear4", "bear6", "bear7", "labubu1", "flamingo", "cake", "cakeforher", "cakeforhim", "candybox", "candyheartcup", "icecream", "fruitbasket1", "cocoscocktail", "pepper1",
  "candy1", "candy2", "candy3", "candy4", "candy5", "candy6", "candy7", "candy8", "candy9", "candy10", "wholeegg",
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
  return unique.filter(isListed).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}
// Pictures that are only shown after landing (a thrown cake or tomato splats on the face), not sold on their own.
const hidden = /^(prankcake_\w+2|tomato[23]|slug_[23])$/;
// What lands on the photo when this gift arrives.
// One tile in the list stands for a whole family; on landing one of them is picked (a rose or jasmine more often).
export const giftGroups: Record<string, string[]> = {
  air_kiss1: ["air_kiss1", "air_kiss2", "air_kiss3", "air_kiss4", "air_kiss5"],
  gem1: ["gem1", "gem2", "gem3", "gem4"],
  flower1: ["flower1", "flower2", "flower3", "flower4", "flower5", "flower6", "flower7", "flower8", "flower9", "flower10", "flower11"],
  loveis1: ["loveis1", "loveis2", "loveis3", "loveis4"],
  wholeegg: ["egg1", "egg2", "egg3"],
};
const grouped = new Set(Object.entries(giftGroups).flatMap(([tile, list]) => list.filter((name) => name !== tile)));
export function landedName(name: string) {
  const group = giftGroups[name];
  if (group) {
    if (name === "flower1") { const bag = [...group, "flower1", "flower1", "flower1", "flower5", "flower5", "flower5"]; return bag[Math.floor(Math.random() * bag.length)]; }
    return group[Math.floor(Math.random() * group.length)];
  }
  if (/^prankcake_\w+1$/.test(name)) return name.replace(/1$/, "2");
  if (name === "tomato1") return Math.random() < 0.5 ? "tomato2" : "tomato3";
  return name;
}
export const isListed = (name: string) => !hidden.test(name) && !grouped.has(name);
// The cocktails ("love" — pink glass — and "cherry") cost 2 hearts and gives the receiver 1 heart (the server pays it, see bottle_is_drink).
const drinkNames = /^(cherry|love)$/;
export const isDrink = (gift: string) => gift === "c:cherry" || gift === "c:love";
