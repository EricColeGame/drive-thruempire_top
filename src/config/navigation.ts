import { BookOpen, Code2, Flame, Map, Swords, Trophy, Users, Zap } from "lucide-react";

export const NAVIGATION_CONFIG = [
  { key: "races", path: "/races", icon: Users, isContentType: true },
  { key: "bosses", path: "/bosses", icon: Swords, isContentType: true },
  { key: "guides", path: "/guide", icon: BookOpen, isContentType: true },
  { key: "codes", path: "/codes", icon: Code2, isContentType: true },
  { key: "tierList", path: "/tier-list", icon: Trophy, isContentType: true },
  { key: "maps", path: "/maps", icon: Map, isContentType: true },
  { key: "skills", path: "/skills", icon: Flame, isContentType: true },
  { key: "updates", path: "/updates", icon: Zap, isContentType: false },
] as const;

export const CONTENT_TYPES = NAVIGATION_CONFIG.filter((item) => item.isContentType).map((item) => item.path.replace(/^\//, ""));
