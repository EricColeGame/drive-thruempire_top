import type { MetadataRoute } from "next";
import { getAllContentPaths } from "@/lib/content";
import { routing } from "@/i18n/routing";
import { NAVIGATION_CONFIG } from "@/config/navigation";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://drive-thruempire.top";

  // Static paths that always exist
  const legalAndInfoPaths = ["/privacy-policy", "/terms-of-service", "/copyright", "/about"];
  const contentCategoryPaths = NAVIGATION_CONFIG.map((item) => item.path);
  const staticPaths = ["/", ...contentCategoryPaths, ...legalAndInfoPaths];

  // Dynamic paths: scan actual MDX content files
  const contentPaths = await getAllContentPaths("en");
  const dynamicPaths = contentPaths.map((item) => `/${[item.contentType, ...item.slug].join("/")}`);

  const paths = [...staticPaths, ...dynamicPaths];

  return routing.locales.flatMap((locale) =>
    paths.map((path) => ({
      url: `${siteUrl}/${locale}${path === "/" ? "" : path}`,
      lastModified: new Date(),
      changeFrequency: path === "/" ? ("daily" as const) : ("weekly" as const),
      priority: path === "/" ? 1 : contentCategoryPaths.includes(path as `/${string}`) ? 0.8 : 0.6,
    })),
  );
}
