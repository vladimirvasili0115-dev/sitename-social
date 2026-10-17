import type { Video, VideoCategory } from "@/types";

const video = (id: string, title: string, author: string, duration: number, views: number, category: VideoCategory): Video => ({
  id, title, author, duration, views, category, thumb: `https://picsum.photos/seed/video-${id}/640/360`,
});

export const videos: Video[] = [
  video("v1", "Bakı gecələri: bulvarda gəzinti", "Leyla Hasanli", 312, 48200, "travel"),
  video("v2", "Evdə 15 dəqiqəyə paxlava", "Evdə Mətbəx", 934, 126500, "food"),
  video("v3", "Gitara ilə retro mahnılar", "Retro Musiqi", 487, 23100, "music"),
  video("v4", "Həftənin ən gülməli anları", "Kamran Safarov", 204, 1240000, "humor"),
  video("v5", "Şahdağda bir gün", "Dağ Yürüşləri", 655, 17800, "travel"),
  video("v6", "Derbi: ən yaxşı qollar", "Futbol Azarkeşləri", 398, 302000, "sport"),
  video("v7", "Səhər qaçışı üçün 5 məsləhət", "Qaçış Klubu", 276, 9400, "sport"),
  video("v8", "Küçə musiqiçiləri, İçərişəhər", "Rashad Aliyev", 541, 65300, "music"),
  video("v9", "Plov bişirməyin sirləri", "Evdə Mətbəx", 1120, 88700, "food"),
];

const reel = (id: string, title: string, author: string, likes: number, comments: number): Video => ({
  id, title, author, likes, comments, duration: 0, views: 0, thumb: `https://picsum.photos/seed/reel-${id}/540/960`,
});

export const reels: Video[] = [
  reel("r1", "Gün batımı, Dənizkənarı Bulvar 🌅", "leyla.h", 2480, 64),
  reel("r2", "Səhər çayı olmadan gün başlamır ☕", "nigar.k", 1312, 41),
  reel("r3", "İçərişəhərin dar küçələri", "rashad.a", 5630, 128),
  reel("r4", "Dağlarda ilk qar ❄️", "samir.h", 9870, 203),
  reel("r5", "Bu rəqsi sən də sına!", "mina.j", 15400, 512),
  reel("r6", "Küçə pişikləri ilə 30 saniyə 🐈", "kamran.s", 7245, 97),
];
