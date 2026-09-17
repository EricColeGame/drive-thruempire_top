interface NavigationItem {
  key: string;
  path: `/${string}`;
  isContentType: boolean;
}

export const NAVIGATION_CONFIG = [
  { key: "codes", path: "/codes", isContentType: true },
  { key: "guide", path: "/guide", isContentType: true },
  { key: "progression", path: "/progression", isContentType: true },
  { key: "mechanics", path: "/mechanics", isContentType: true },
  { key: "tips", path: "/tips", isContentType: true },
  { key: "updates", path: "/updates", isContentType: true },
  { key: "discord", path: "/discord", isContentType: true },
  { key: "community", path: "/community", isContentType: true },
] satisfies readonly NavigationItem[];

export const CONTENT_TYPES = NAVIGATION_CONFIG.filter((item) => item.isContentType).map((item) => item.path.replace(/^\//, ""));
