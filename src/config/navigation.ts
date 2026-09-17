export const NAVIGATION_CONFIG = [] as const;

export const CONTENT_TYPES = NAVIGATION_CONFIG.filter((item: any) => item.isContentType).map((item: any) => item.path.replace(/^\//, ""));
