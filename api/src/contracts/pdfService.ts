import puppeteer from "puppeteer";
import { getContractDisclaimer } from "./prompt.js";

function buildPdfHtml(content: string) {
  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Contract</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #111827;
          margin: 0;
          padding: 40px;
          line-height: 1.6;
          font-size: 14px;
        }
        article {
          max-width: 820px;
          margin: 0 auto;
        }
        h1, h2, h3 {
          color: #0f172a;
        }
        footer {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 1px solid #d1d5db;
          color: #4b5563;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <article>
        ${content}
        <footer>${getContractDisclaimer()}</footer>
      </article>
    </body>
  </html>`;
}

export async function renderContractPdfBuffer(content: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(buildPdfHtml(content), { waitUntil: "load" });
    return Buffer.from(
      await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "24px",
          right: "24px",
          bottom: "24px",
          left: "24px",
        },
      }),
    );
  } finally {
    await browser.close();
  }
}
