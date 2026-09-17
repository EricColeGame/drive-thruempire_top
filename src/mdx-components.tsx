import Link from "next/link";
import type { MDXComponents } from "mdx/types";

function toHeadingId(children: React.ReactNode): string {
  const text = String(children).replace(/<[^>]*>/g, "").trim();
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...defaultComponents,
    ...components,
  };
}

const defaultComponents: MDXComponents = {
  h2: ({ children, id }) => {
    const headingId = id || toHeadingId(children);
    return (
      <h2 id={headingId} className="mt-10 scroll-m-20 border-b border-border pb-3 text-2xl font-bold tracking-tight text-foreground first:mt-0">
        {children}
      </h2>
    );
  },
  h3: ({ children, id }) => {
    const headingId = id || toHeadingId(children);
    return <h3 id={headingId} className="mt-8 text-xl font-semibold text-foreground">{children}</h3>;
  },
  p: ({ children }) => <p className="my-5 leading-8 text-muted-foreground">{children}</p>,
  ul: ({ children }) => <ul className="my-5 ml-5 list-disc space-y-2 text-muted-foreground marker:text-[hsl(var(--nav-theme))]">{children}</ul>,
  li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  a: ({ href = "", children }) => (
    <Link className="font-medium text-[hsl(var(--nav-theme))] underline-offset-4 hover:underline" href={href}>
      {children}
    </Link>
  ),
  table: ({ children }) => (
    <div className="my-7 overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/70 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">{children}</thead>,
  th: ({ children }) => <th className="px-4 py-3 font-semibold">{children}</th>,
  td: ({ children }) => <td className="border-t border-border px-4 py-3 text-muted-foreground">{children}</td>,
  blockquote: ({ children }) => (
    <blockquote className="my-7 rounded-xl border border-[hsl(var(--nav-theme-light))] bg-[hsl(var(--nav-theme))]/10 p-5 text-sm text-foreground">
      {children}
    </blockquote>
  ),
};
