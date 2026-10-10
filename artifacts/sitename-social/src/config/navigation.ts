import {
  Activity, Bookmark, CircleUserRound, Clapperboard, Compass, Gamepad2, Gift, Images,
  Mail, Music2, Settings2, EyeOff, Users, UsersRound, Video,
} from "lucide-react";
import type { NavItem } from "@/types";

export const navigation: NavItem[] = [
  { key: "nav.feed", href: "/feed", icon: Activity },
  { key: "nav.profile", href: "/profile", icon: CircleUserRound },
  { key: "nav.friends", href: "/friends", icon: UsersRound },
  { key: "nav.messages", href: "/messages", icon: Mail },
  { key: "nav.groups", href: "/groups", icon: Users },
  { key: "nav.photos", href: "/photos", icon: Images },
  { key: "nav.videos", href: "/videos", icon: Video },
  { key: "nav.games", href: "/games", icon: Gamepad2 },
  { key: "nav.music", href: "/music", icon: Music2 },
  { key: "nav.guests", href: "/guests", icon: Compass },
  { key: "nav.saved", href: "/saved", icon: Bookmark },
  { key: "nav.invisible", href: "/invisible", icon: EyeOff },
  { key: "nav.settings", href: "/settings", icon: Settings2 },
  { key: "nav.online", href: "/online", icon: Activity },
  { key: "nav.gifts", href: "/gifts", icon: Gift },
];
