import type { Group, GroupCategory } from "@/types";

export const groupCategories: GroupCategory[] = ["music", "sport", "tech", "travel", "food", "games"];
const group = (id: string, name: string, category: GroupCategory, members: number, description: string, joined = false): Group => ({
  id, name, category, members, description, joined, cover: `https://picsum.photos/seed/group-${id}/640/280`,
});

export const initialGroups: Group[] = [
  group("gr1", "Bakı Fotoqrafları", "travel", 12480, "Şəhərin ən gözəl kadrları və foto gəzintilər.", true),
  group("gr2", "Retro Musiqi", "music", 8320, "70-90-cı illərin unudulmaz mahnıları.", true),
  group("gr3", "Proqramçılar Klubu", "tech", 5610, "Kod, karyera və texnologiya xəbərləri.", true),
  group("gr4", "Dağ Yürüşləri", "travel", 3275, "Həftəsonu yürüşləri və marşrutlar."),
  group("gr5", "Evdə Mətbəx", "food", 21940, "Sadə və dadlı reseptlər."),
  group("gr6", "Futbol Azarkeşləri", "sport", 17630, "Oyunlar, nəticələr və müzakirələr."),
  group("gr7", "Butulka Oyunçuları", "games", 9450, "Oyun otaqları, turnirlər və yeni tanışlıqlar."),
  group("gr8", "Gitara Dərsləri", "music", 2140, "Yeni başlayanlar üçün akkordlar və dərslər."),
  group("gr9", "Qaçış Klubu", "sport", 4380, "Birgə səhər qaçışları və marafonlar."),
];
