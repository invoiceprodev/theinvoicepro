import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

export function renderEmailHtml(template: ReactElement) {
  return `<!DOCTYPE html>${renderToStaticMarkup(template)}`;
}

export function renderEmailText(template: ReactElement) {
  const html = renderEmailHtml(template);
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(p|div|h1|h2|h3|li|tr|table|br|ul|ol)>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
