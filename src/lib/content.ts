import fs from "fs";
import path from "path";
import { CONTENT_TYPES as CONFIG_CONTENT_TYPES } from "@/config/navigation";
import { routing, type Locale } from "@/i18n/routing";

// 从统一配置导入内容类型
export const CONTENT_TYPES = CONFIG_CONTENT_TYPES;

/**
 * 将文件名转换为 URL-safe slug
 * 所有非字母数字连字符下划线的字符（冒号、问号、井号、空格等）替换为 -
 * 合并连续的 -，去掉首尾 -
 */
export function fileNameToSlug(fileName: string): string {
  return fileName
    .replace(/\.mdx$/, "")
    .replace(/[^a-zA-Z0-9\-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * 根据 slug 在目录中反查真实文件名（不含 .mdx）
 * 例如 slug="gelum-boss" → 返回 "gelum:boss"
 */
export function findFileBySlug(dir: string, slug: string, basePath: string[] = []): string | null {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const result = findFileBySlug(fullPath, slug, [...basePath, entry.name]);
      if (result) return result;
    } else if (entry.name.endsWith(".mdx")) {
      const fileName = entry.name.replace(".mdx", "");
      const entrySlug = [...basePath, fileNameToSlug(fileName)].join("/");
      if (entrySlug === slug) {
        return [...basePath, fileName].join("/");
      }
    }
  }
  return null;
}

// 通用 Metadata 接口（与 MDX 文件 export const metadata 对应）
export interface ContentMetadata {
  title: string;
  description: string;
  category: string;
  date: string;
  lastModified?: string;
  badge?: string;
  keywords?: string[];
  [key: string]: any;
}

// 内容项接口
export interface ContentItem {
  slug: string[];
  metadata: ContentMetadata;
  content: string;
}

// 文章数据接口（含展示用字段）
export interface ArticleItem {
  title: string;
  description: string;
  slug: string;
  href: string;
  category: string;
  date: string;
  badge?: string;
  difficulty?: string;
}

// 导航链接接口
export interface NavGroup {
  title: string;
  count: number;
  slug: string;
  links: Array<{ label: string; href: string; badge?: string }>;
}

// 内容根目录
const CONTENT_ROOT = path.join(process.cwd(), "content");

/**
 * 从目录递归获取所有 MDX 文件的 slug 数组
 * 例如 content/en/codes/fast-cash.mdx → ["fast-cash"]
 */
function getSlugsFromDirectory(dir: string, basePath: string[] = []): string[][] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const slugs: string[][] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const nested = getSlugsFromDirectory(path.join(dir, entry.name), [...basePath, entry.name]);
      slugs.push(...nested);
    } else if (entry.name.endsWith(".mdx")) {
      const slugName = fileNameToSlug(entry.name);
      slugs.push([...basePath, slugName]);
    }
  }

  return slugs;
}

/**
 * 获取指定内容类型和 slug 的完整内容
 */
export async function getContentItem(
  contentType: string,
  slugSegments: string[],
  language: Locale = "en"
): Promise<ContentItem | null> {
  const contentDir = path.join(CONTENT_ROOT, language, contentType);
  const slug = slugSegments.join("/");
  const mdxRelativePath = findFileBySlug(contentDir, slug);

  if (!mdxRelativePath) return null;

  const fullPath = path.join(contentDir, `${mdxRelativePath}.mdx`);
  if (!fs.existsSync(fullPath)) return null;

  try {
    const rawContent = fs.readFileSync(fullPath, "utf-8");

    // 提取 export const metadata = { ... }
    const metadataMatch = rawContent.match(/export\s+const\s+metadata\s*=\s*({[\s\S]*?});/);
    let metadata: ContentMetadata = {
      title: slugSegments[slugSegments.length - 1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      description: "",
      category: contentType,
      date: new Date().toISOString().split("T")[0],
    };

    if (metadataMatch) {
      try {
        const metadataStr = metadataMatch[1]
          .replace(/(\w+):/g, '"$1":')
          .replace(/'/g, '"')
          .replace(/,\s*}/g, "}");
        metadata = { ...metadata, ...JSON.parse(metadataStr) };
      } catch {
        // 解析失败时回退到正则提取关键字段
        const titleMatch = rawContent.match(/title:\s*["'](.+?)["']/);
        const descMatch = rawContent.match(/description:\s*["'](.+?)["']/);
        if (titleMatch) metadata.title = titleMatch[1];
        if (descMatch) metadata.description = descMatch[1];
      }
    }

    // 移除 metadata 声明以获取正文
    const contentWithoutMetadata = rawContent.replace(/export\s+const\s+metadata\s*=\s*{[\s\S]*?};/, "").trim();

    return {
      slug: slugSegments,
      metadata,
      content: contentWithoutMetadata,
    };
  } catch {
    return null;
  }
}

/**
 * 获取指定内容类型的全部文章列表
 */
export async function getContentList(
  contentType: string,
  language: Locale = "en"
): Promise<ArticleItem[]> {
  const contentDir = path.join(CONTENT_ROOT, language, contentType);
  const slugPaths = getSlugsFromDirectory(contentDir);

  const items: ArticleItem[] = [];

  for (const segments of slugPaths) {
    const item = await getContentItem(contentType, segments, language);
    if (!item) continue;

    const slugStr = segments.join("/");
    items.push({
      title: item.metadata.title,
      description: item.metadata.description,
      slug: slugStr,
      href: `/${contentType}/${slugStr}`,
      category: item.metadata.category || contentType,
      date: item.metadata.date,
      badge: item.metadata.badge,
      difficulty: item.metadata.difficulty,
    });
  }

  // 按日期降序
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return items;
}

/**
 * 获取全站最近更新的文章（跨分类）
 */
export async function getRecentArticles(language: Locale = "en", limit = 6): Promise<ArticleItem[]> {
  const allArticles: ArticleItem[] = [];

  for (const type of CONTENT_TYPES) {
    const list = await getContentList(type, language);
    allArticles.push(...list);
  }

  allArticles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return allArticles.slice(0, limit);
}

// 分组标题映射：slug → 人类可读标题（默认英文）
export const GROUP_TITLES: Record<string, string> = {
  codes: "Codes",
  guide: "Getting Started",
  progression: "Progression",
  mechanics: "Mechanics",
  tips: "Tips & Strategies",
  updates: "Updates",
  discord: "Discord",
  community: "Community",
};

// 西语分组标题映射
const GROUP_TITLES_ES: Record<string, string> = {
  codes: "Códigos",
  guide: "Guía de Inicio",
  progression: "Progresión",
  mechanics: "Mecánicas",
  tips: "Consejos y Trucos",
  updates: "Actualizaciones",
  discord: "Discord",
  community: "Comunidad",
};

// 葡语分组标题映射
const GROUP_TITLES_PT: Record<string, string> = {
  codes: "Códigos",
  guide: "Guia para Iniciantes",
  progression: "Progressão",
  mechanics: "Mecânicas",
  tips: "Dicas e Estratégias",
  updates: "Atualizações",
  discord: "Discord",
  community: "Comunidade",
};

// 法语分组标题映射
const GROUP_TITLES_FR: Record<string, string> = {
  codes: "Codes",
  guide: "Guide de Démarrage",
  progression: "Progression",
  mechanics: "Mécaniques",
  tips: "Conseils et Astuces",
  updates: "Mises à jour",
  discord: "Discord",
  community: "Communauté",
};

// locale → 分组标题映射
export const GROUP_TITLES_BY_LOCALE: Record<string, Record<string, string>> = {
  es: GROUP_TITLES_ES,
  pt: GROUP_TITLES_PT,
  fr: GROUP_TITLES_FR,
};

// locale → "Overview" 翻译
export const OVERVIEW_LABEL_BY_LOCALE: Record<string, string> = {
  es: "Visión General",
  pt: "Visão Geral",
  fr: "Vue d'ensemble",
};

// 分组排序顺序
export const GROUP_ORDER: string[] = [
  "codes",
  "guide",
  "progression",
  "mechanics",
  "tips",
  "updates",
  "discord",
  "community",
];

/**
 * 动态生成 Wiki Navigation 分组
 * 扫描 content/<locale>/ 下的所有 MDX 文件，按子目录分组
 * 同时为列表页添加 Overview 入口
 */
export function getDynamicNavigation(language: Locale = "en"): NavGroup[] {
  const localeDir = path.join(CONTENT_ROOT, language);
  if (!fs.existsSync(localeDir)) return [];

  const entries = fs.readdirSync(localeDir, { withFileTypes: true });
  const groups: NavGroup[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const groupSlug = entry.name;
    // 跳过不在 CONTENT_TYPES 中的目录，避免显示会 404 的导航链接
    if (!CONTENT_TYPES.includes(groupSlug as typeof CONTENT_TYPES[number])) continue;
    const groupDir = path.join(localeDir, groupSlug);
    const slugPaths = getSlugsFromDirectory(groupDir);

    if (slugPaths.length === 0) continue;

    const links: NavGroup["links"] = [];
    // 添加 Overview 入口（按 locale 翻译）
    const overviewLabel = OVERVIEW_LABEL_BY_LOCALE[language] || "Overview";
    links.push({ label: overviewLabel, href: `/${groupSlug}` });

    for (const segments of slugPaths) {
      const articleSlug = segments.join("/");
      const mdxFilePath = findFileBySlug(groupDir, articleSlug);
      if (!mdxFilePath) continue;

      const fullPath = path.join(groupDir, `${mdxFilePath}.mdx`);
      let title = segments[segments.length - 1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      let badge: string | undefined;

      try {
        const source = fs.readFileSync(fullPath, "utf-8");
        // 提取 metadata.title
        const titleMatch = source.match(/title:\s*["'](.+?)["']/);
        if (titleMatch) title = titleMatch[1];
        // 提取 metadata.badge
        const badgeMatch = source.match(/badge:\s*["'](.+?)["']/);
        if (badgeMatch) badge = badgeMatch[1];
      } catch {
        // 读取失败用默认标题
      }

      links.push({ label: title, href: `/${groupSlug}/${articleSlug}`, badge });
    }

    // 优先使用 locale 特定标题，否则回退到英文默认
    const localTitles = GROUP_TITLES_BY_LOCALE[language] || {};
    const groupTitle = localTitles[groupSlug] || GROUP_TITLES[groupSlug] || groupSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    groups.push({
      title: groupTitle,
      count: links.length - 1, // 减去 Overview
      slug: groupSlug,
      links,
    });
  }

  // 按 GROUP_ORDER 排序
  groups.sort((a, b) => {
    const ai = GROUP_ORDER.indexOf(a.slug);
    const bi = GROUP_ORDER.indexOf(b.slug);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return groups;
}

/**
 * 获取所有内容路径（用于 generateStaticParams）
 */
export async function getAllContentPaths(language: Locale = "en"): Promise<Array<{ contentType: string; slug: string[] }>> {
  const paths: Array<{ contentType: string; slug: string[] }> = [];

  for (const type of CONTENT_TYPES) {
    const typeDir = path.join(CONTENT_ROOT, language, type);
    const slugs = getSlugsFromDirectory(typeDir);
    for (const slug of slugs) {
      paths.push({ contentType: type, slug });
    }
  }

  return paths;
}
