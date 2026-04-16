/* eslint-disable @typescript-eslint/no-explicit-any */
import { chromium } from 'playwright';
import { JSDOM } from 'jsdom';
import Defuddle from 'defuddle';
import { Chunk, insertDocument } from './supabaseIngestion';
import { ingestChunksWithConcurrency } from './worker';

type Section = {
  level: string;
  title: string;
  content: string;
};

type PageData = {
  title: string;
  sections: Section[];
  fullContent: string;
};

// -----------------------------
// CONFIG
// -----------------------------
const MAX_DEPTH = 2;
const DELAY_MS = 200;

function groupChunksByUrl(chunks: Chunk[]) {
  const map = new Map<string, Chunk[]>();

  for (const chunk of chunks) {
    const url = normalizeUrl(chunk.metadata.url); // IMPORTANT

    if (!map.has(url)) {
      map.set(url, []);
    }

    map.get(url)!.push(chunk);
  }

  return map;
}

// -----------------------------
// MAIN FUNCTION
// -----------------------------
// default allowed paths to crawl
export async function crawlWebsite(startUrl: string, allowedPaths: string[]): Promise<Chunk[]> {
  const browser = await chromium.launch();
  const visited = new Set<string>();
  const seenContent = new Set<string>();

  const results: Chunk[] = [];
  async function crawl(url: string, depth: number) {
    if (depth > MAX_DEPTH || visited.has(url)) return;

    const normalized = normalizeUrl(url);
    if (visited.has(normalized)) return;

    visited.add(normalized);

    const page = await browser.newPage();

    try {
      await page.goto(normalized, { waitUntil: 'networkidle' });

      const pageData = await extractPageData(page);

      const chunks = await processPageData(pageData, normalized, seenContent);

      results.push(...chunks);

      const links = await page.$$eval('a[href]', (anchors) =>
        anchors.map((a) => (a as HTMLAnchorElement).href),
      );

      for (const link of links) {
        try {
          const nextUrl = normalizeUrl(new URL(link, normalized).href);

          if (isSameDomain(nextUrl, startUrl) && shouldCrawl(nextUrl, allowedPaths)) {
            await delay(DELAY_MS);
            console.log(`Crawling ${nextUrl} (depth: ${depth + 1})`);
            await crawl(nextUrl, depth + 1);
          }
        } catch {
          console.warn(`Skipping invalid URL: ${link}`);
          // ignore bad urls
        }
      }
    } catch (err) {
      console.error(`Error crawling ${url}`, err);
    } finally {
      await page.close();
    }
  }

  await crawl(startUrl, 0);
  await browser.close();

  return results;
}

// -----------------------------
// PAGE EXTRACTION
// -----------------------------
async function extractPageData(page: any): Promise<PageData> {
  // Get fully rendered HTML from Playwright
  const html = await page.content();
  const url = page.url();

  // Create DOM
  const dom = new JSDOM(html, { url });

  // Run Defuddle
  const result = await new Defuddle(dom.window.document, url).parse();

  const title = result.title || page.title();

  // Defuddle gives cleaned HTML/text
  const cleanedHtml = result.content || '';
  const sectionDom = new JSDOM(cleanedHtml);
  const textContent = sectionDom.window.document.body.textContent?.trim() || '';

  // Optional: basic section reconstruction from cleaned HTML
  const document = sectionDom.window.document;

  const sections: Section[] = [];

  const headers = document.querySelectorAll('h1, h2, h3');

  headers.forEach((header: any) => {
    const level = header.tagName.toLowerCase();
    const sectionTitle = header.textContent?.trim() || '';

    let content = '';
    let next = header.nextElementSibling;

    while (next && !next.matches('h1, h2, h3')) {
      if (['P', 'UL', 'OL', 'LI', 'PRE', 'CODE'].includes(next.tagName) && next.textContent) {
        content += next.textContent.trim() + '\n';
      }
      next = next.nextElementSibling;
    }

    if (content.trim()) {
      sections.push({
        level,
        title: sectionTitle,
        content: content.trim(),
      });
    }
  });

  return {
    title,
    sections,
    fullContent: textContent,
  };
}

// -----------------------------
// PROCESS INTO CHUNKS
// -----------------------------
async function processPageData(
  pageData: PageData,
  url: string,
  seenContent: Set<string>,
): Promise<Chunk[]> {
  const chunks: Chunk[] = [];

  for (const section of pageData.sections) {
    const split = simpleSplit(section.content);

    for (const piece of split) {
      const cleaned = piece.trim();

      if (!cleaned || seenContent.has(cleaned)) continue;
      //if (!cleaned) continue;

      seenContent.add(cleaned);
      const eachChunk = {
        title: section.title || pageData.title,
        content: cleaned,
        metadata: {
          url,
          pageTitle: pageData.title,
          sectionTitle: section.title,
        },
      };

      // add delay before calling API to avoid rate limits
      await delay(DELAY_MS);
      // await inge(
      //   eachChunk.title,
      //   sanitizeTextToBase64(eachChunk.content),
      //   eachChunk.metadata,
      // );

      chunks.push(eachChunk);
    }
  }

  // fallback if no sections
  if (chunks.length === 0 && pageData.fullContent) {
    const split = simpleSplit(pageData.fullContent);

    for (const piece of split) {
      const cleaned = piece.trim();

      if (!cleaned || seenContent.has(cleaned)) continue;

      seenContent.add(cleaned);

      chunks.push({
        title: pageData.title,
        content: cleaned,
        metadata: {
          url,
          pageTitle: pageData.title,
          sectionTitle: '',
        },
      });
    }
  }

  return chunks;
}

// -----------------------------
// HELPERS
// -----------------------------
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    u.search = '';
    return u.href.replace(/\/$/, '');
  } catch {
    return url;
  }
}

function buildTitle(chunk: Chunk) {
  const siteName = new URL(chunk.metadata.url).hostname.replace('www.', '');
  return `${siteName} | ${chunk.metadata.pageTitle}`;
}

function isSameDomain(url1: string, url2: string): boolean {
  try {
    const host1 = new URL(url1).hostname.replace(/^www\./, '');
    const host2 = new URL(url2).hostname.replace(/^www\./, '');

    return host1 === host2 || host1.endsWith('.' + host2);
  } catch {
    return false;
  }
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

function simpleSplit(text: string, size = 800, overlap = 150): string[] {
  const chunks: string[] = [];
  let i = 0;

  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size - overlap;
  }

  return chunks;
}

function normalizePath(path: string): string {
  if (!path) return '/';

  // Remove trailing slash (except root)
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }

  return path;
}

// allowedPaths = ['/', '/solution', '/about-us', '/ccd-token', '/wallet'] etc
// allow only urls that start with these paths to be crawled. If allowedPaths is empty, then allow all urls by default
// for example, if allowedPaths = ['/', '/solution'], then https://concordium.com/solution and https://concordium.com/solution/xyz will be allowed, but https://concordium.com/about-us will not be allowed
// also, if allowedPaths is empty, then all urls will be allowed by default
// this is to ensure we only crawl relevant sections of the website and avoid crawling unnecessary pages that may contain noise or irrelevant content
// Implement this in shouldCrawl function and use it in crawl function to check if a url should be crawled before crawling it
function shouldCrawl(url: string, allowedPaths: string[]): boolean {
  try {
    const u = new URL(url);
    const path = normalizePath(u.pathname);

    // If no restrictions → allow all
    if (!allowedPaths || allowedPaths.length === 0) {
      return true;
    }

    return allowedPaths.some((allowed) => {
      const normalizedAllowed = normalizePath(allowed);

      // Special case: root "/"
      if (normalizedAllowed === '/') {
        return path === '/';
      }

      // Exact match OR nested path
      return path === normalizedAllowed || path.startsWith(normalizedAllowed + '/');
    });
  } catch {
    return false;
  }
}

// call main function to crawl concordium.com with these allowed paths const DEFAULT_ALLOWED_PATHS = ['/', '/solution', '/about-us', '/ccd-token', '/wallet'];
export async function runWebsiteIngestion(
  startUrl: string,
  allowedPaths: string[] = ['/'],
  // document_id: string,
) {
  try {
    // const allowedPaths = [
    //   '/',
    //   // '/solution',
    //   // '/about-us',
    //   // '/ccd-token',
    //   // '/wallet',
    //   // '/build',
    //   // '/article',
    //   // '/news',
    // ];

    const chunks = await crawlWebsite(startUrl, allowedPaths);
    console.log(`Crawled ${chunks.length} chunks`);

    const grouped = groupChunksByUrl(chunks);

    console.log(`Found ${grouped.size} unique pages`);

    for (const [url, pageChunks] of grouped.entries()) {
      try {
        console.log(`\n📄 Processing page: ${url}`);

        // 🔹 1. Create (or reuse) document
        const doc = await insertDocument(buildTitle(pageChunks[0]), {
          source_type: 'official_documentation',
          canonical_url: url,
        });
        console.log(`Document created with ID: ${doc.document_id}`);

        const document_id = doc.document_id;

        // 🔹 2. Attach document_id to chunks
        const chunksWithDoc = pageChunks.map((chunk) => ({
          ...chunk,
          document_id,
        }));

        // 🔹 3. Ingest chunks (with concurrency)
        await ingestChunksWithConcurrency(chunksWithDoc, document_id, 3);
      } catch (err) {
        console.error(`❌ Failed page ${url}`, err);
      }
    }

    return {
      status: 'success',
      chunks_total: chunks.length,
      websiteUrl: startUrl,
      message: `Crawled ${chunks.length} chunks from ${startUrl} and ingested into Supabase`,
    };

    // const chunks: Array<Chunk> = await crawlWebsite(canonicalUrl, allowedPaths);
    // console.log(`Crawled ${chunks.length} chunks from ${canonicalUrl}`);
    // ingestChunksWithConcurrency(chunks, document_id, 3);

    // return {
    //   status: 'success',
    //   document_id,
    //   chunks_total: chunks.length,
    //   websiteUrl: canonicalUrl,
    //   message: `Crawled ${chunks.length} chunks from ${canonicalUrl} and started ingestion`,
    // };
  } catch (err: any) {
    console.error('Error in runWebsiteIngestion', err);
    return {
      status: 'error',
      message: err.message,
      chunks_total: 0,
      websiteUrl: startUrl,
    };
  }
}
