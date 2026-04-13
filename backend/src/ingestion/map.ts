import { chromium } from 'playwright';

type PageInfo = {
  url: string;
  title: string;
};

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

// function shouldCrawl(url: string): boolean {
//   return url.includes("/en/mainnet/docs/");
// }

function isSameDomain(url1: string, url2: string): boolean {
  try {
    const host1 = new URL(url1).hostname.replace(/^www\./, '');
    const host2 = new URL(url2).hostname.replace(/^www\./, '');

    return host1 === host2 || host1.endsWith('.' + host2);
  } catch {
    return false;
  }
}

export async function crawlUrlsAndTitles(startUrl: string, maxPages = 100) {
  const browser = await chromium.launch();
  const visited = new Set<string>();
  const queue: string[] = [startUrl];

  const results: PageInfo[] = [];

  while (queue.length > 0 && results.length < maxPages) {
    const url = queue.shift()!;
    const normalized = normalizeUrl(url);

    if (visited.has(normalized)) continue;
    visited.add(normalized);

    const page = await browser.newPage();

    try {
      await page.goto(normalized, { waitUntil: 'networkidle' });

      const title = await page.title();

      console.log(`✔ ${normalized}`);

      results.push({
        url: normalized,
        title,
      });

      // 🔹 Extract links
      const links = await page.$$eval('a[href]', (anchors) =>
        anchors.map((a) => (a as HTMLAnchorElement).href),
      );

      for (const link of links) {
        try {
          const nextUrl = normalizeUrl(new URL(link, normalized).href);

          if (isSameDomain(nextUrl, startUrl) && !visited.has(nextUrl)) {
            queue.push(nextUrl);
          }
        } catch {
          // ignore bad URLs
        }
      }
    } catch (err) {
      console.error(`Failed: ${url}`, err);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  return results;
}
