const absolute = (url, canonical) => new URL(url, canonical).href;

function inlineMarkdown(html, canonical) {
  return html
    .replace(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
      (_, href, text) => `[${text.replace(/<[^>]+>/g, "")}](${absolute(href, canonical)})`)
    .replace(/<kbd>([\s\S]*?)<\/kbd>/gi, "`$1`")
    .replace(/<(?:strong|b)>([\s\S]*?)<\/(?:strong|b)>/gi, "**$1**")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

/** A source-derived, shell-free representation for readers that consume Markdown. */
export function guideMarkdown(source, { canonical, language, title }) {
  let body = source
    .replace(/<p\b[^>]*class="guide-breadcrumb"[^>]*>[\s\S]*?<\/p>/gi, "")
    .replace(/<figure\b[^>]*>([\s\S]*?)<\/figure>/gi, (_, figure) => {
      const image = /<img\b([^>]+)>/i.exec(figure)?.[1] || "";
      const src = /\bsrc="([^"]+)"/.exec(image)?.[1];
      const alt = /\balt="([^"]*)"/.exec(image)?.[1] || "";
      const caption = /<figcaption>([\s\S]*?)<\/figcaption>/i.exec(figure)?.[1] || "";
      return (src ? `![${alt}](${absolute(src, canonical)})\n\n` : "") + inlineMarkdown(caption, canonical);
    })
    .replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (_, text) => inlineMarkdown(text, canonical) + "\n\n")
    .replace(/<kbd>([\s\S]*?)<\/kbd>/gi, "`$1`")
    .replace(/\]\((\/(?!\/)[^\s)]+)\)/g, (_, href) => `](${absolute(href, canonical)})`)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!body.startsWith("# ")) body = `# ${title}\n\n${body}`;
  return body.replace(/^(# [^\n]+)\n?/, `$1\n\n> Canonical: ${canonical}\n> Language: ${language}\n`) + "\n";
}

/** llms.txt is a discovery aid, not a crawler policy or a guarantee of indexing. */
export function llmIndex(entries, origin) {
  const lines = [
    "# Mirror",
    "",
    "> Mirror is an independent desktop companion and web toolset for Path of Exile 1 and Path of Exile 2.",
    "",
    "Guides are served as static HTML, with source-derived Markdown alternatives. Each guide includes its canonical URL and language. Feature availability can differ by game; trade search requires the Mirror client to be running.",
    "",
    "## Website",
    "",
    `- [English website](${origin}/en/)`,
    `- [简体中文网站](${origin}/)`,
    `- [繁體中文網站](${origin}/tw/)`,
    "",
    "Japanese is currently available for individual guides only; there is no Japanese homepage or guide index.",
    "",
    "## Guides",
    "",
  ];
  for (const entry of [...entries].sort((a, b) => a.canonical.localeCompare(b.canonical))) {
    lines.push(`- [${entry.title} (${entry.language})](${entry.markdown}): ${entry.description} HTML: ${entry.canonical}`);
  }
  lines.push("", "## Discovery", "", `- [Sitemap](${origin}/sitemap.xml)`, "");
  return lines.join("\n");
}
