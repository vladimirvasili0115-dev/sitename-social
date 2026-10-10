import type { Game, GameCategory } from "@/types";

const game = (id: string, name: string, category: GameCategory, players: number): Game => ({ id, name, category, players, cover: `https://picsum.photos/seed/game-${id}/480/320` });

export const gameCategories: GameCategory[] = ["party", "board", "cards", "puzzle"];
export const featuredGame: Game = game("butulka", "Butulka", "party", 1840);
export const games: Game[] = [
  game("nard", "Nərd", "board", 920),
  game("domino", "Domino", "board", 640),
  game("durak", "Durak", "cards", 1310),
  game("chess", "Şahmat", "board", 480),
  game("loto", "Loto", "party", 350),
  game("words", "Söz Oyunu", "puzzle", 270),
  game("quiz", "Viktorina", "puzzle", 415),
  game("poker", "Poker", "cards", 760),
];
