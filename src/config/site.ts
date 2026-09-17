export interface SiteConfig {
  name: string;
  shortName: string;
  logoText: string;
  tagline: string;
  description: string;
  url: string;
  supportEmail: string;
  gameUrl?: string;
  heroVideoId?: string;
  social?: {
    discord?: string;
    youtube?: string;
    twitter?: string;
    tiktok?: string;
  };
  locales: readonly string[];
  defaultLocale: string;
}

export const siteConfig: SiteConfig = {
  name: "Drive-Thru Empire Wiki",
  shortName: "Drive-Thru Empire",
  logoText: "DE",
  tagline: "Roblox Codes, Cars, Upgrades & Complete Guides",
  description: "Explore the Drive-Thru Empire Wiki for Roblox codes, cars, upgrades, earning tips, beginner guides, gameplay mechanics, and the latest game information.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://drive-thruempire.top",
  supportEmail: "support@drive-thruempire.top",
  gameUrl: "https://www.roblox.com/games/88271351034688/Drive-Thru-Empire",
  heroVideoId: "-pWg6hLqsao",
  social: {
    discord: "https://discord.gg/roblox",
    youtube: "https://www.youtube.com/@roblox",
  },
  locales: ["en", "es", "pt", "de", "fr"],
  defaultLocale: "en",
};
