import type { Track } from "@/types";

const track = (id: string, title: string, artist: string, duration: number): Track => ({ id, title, artist, duration, cover: `https://picsum.photos/seed/track-${id}/200/200` });

export const tracks: Track[] = [
  track("t1", "Gecə Bakı", "Xəzər Səsləri", 214),
  track("t2", "Uzaq Sahillər", "Ayla", 187),
  track("t3", "Payız Yağışı", "Retro Qrup", 243),
  track("t4", "Yol Mahnısı", "Elvin Q.", 198),
  track("t5", "Sənsiz", "Nərmin", 226),
  track("t6", "Dağların Səsi", "Qobustan", 271),
  track("t7", "Köhnə Şəhər", "İçərişəhər Band", 205),
  track("t8", "Sübh Çağı", "Lalə", 192),
  track("t9", "Rəqs Et", "DJ Tural", 176),
  track("t10", "Dənizin Rəngi", "Xəzər Səsləri", 233),
];
