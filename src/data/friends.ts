import type { FriendsState, Person } from "@/types";
import { users } from "./users";

const person = (id: string, name: string, handle: string, city: string, mutual: number, online = false): Person => ({
  user: { id, name, handle, avatar: `https://picsum.photos/seed/${handle}-avatar/160/160`, online },
  city,
  mutual,
});

const cities = ["Bakı", "Gəncə", "Sumqayıt", "Bakı", "Şəki", "Lənkəran"];
export const people: Person[] = [
  ...users.slice(1).map((user, index) => ({ user, city: cities[index], mutual: 3 + index * 2 })),
  person("u7", "Elvin Quliyev", "elvin.q", "Bakı", 12, true),
  person("u8", "Aysel Rzayeva", "aysel.r", "İstanbul", 5),
  person("u9", "Tural Məmmədli", "tural.m", "Bakı", 8, true),
  person("u10", "Günel İsmayılova", "gunel.i", "Tbilisi", 2),
  person("u11", "Orxan Nəbiyev", "orxan.n", "Mingəçevir", 4),
  person("u12", "Səbinə Əhmədova", "sabina.a", "Bakı", 9, true),
  person("u13", "Murad Həsənov", "murad.h", "Moskva", 1),
  person("u14", "Lalə Abbasova", "lala.a", "Naxçıvan", 6),
  person("u15", "Fərid Kazımov", "farid.k", "Bakı", 7, true),
  person("u16", "Zəhra Novruzova", "zahra.n", "Quba", 3),
  person("u17", "Emil Bağırov", "emil.b", "Ankara", 2),
  person("u18", "Nərmin Vəliyeva", "narmin.v", "Bakı", 11),
  person("u19", "Rəşad Qasımov", "rashad.q", "Gəncə", 0, true),
  person("u20", "Aytən Məlikova", "ayten.m", "Bakı", 4, true),
  person("u21", "Kənan Əsgərov", "kanan.a", "Sumqayıt", 1, true),
  person("u22", "Nino Beridze", "nino.b", "Tbilisi", 0, true),
  person("u23", "Ülviyyə Hacıyeva", "ulviyya.h", "Şəki", 2, true),
  person("u24", "Emre Yıldız", "emre.y", "İstanbul", 0, true),
  person("u25", "Cavid Rüstəmov", "javid.r", "Bakı", 6, true),
  person("u26", "Anna Sokolova", "anna.s", "Moskva", 0, true),
  person("u27", "Fidan Salmanova", "fidan.s", "Lənkəran", 3, true),
  person("u28", "Toğrul Nəsirov", "togrul.n", "Bakı", 5, true),
];

export const initialFriendsState: FriendsState = {
  friends: ["u1", "u2", "u3", "u4", "u5", "u6", "u7", "u8", "u9"],
  incoming: ["u10", "u11", "u12"],
  outgoing: ["u13"],
  hidden: [],
};
