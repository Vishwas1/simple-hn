/* eslint-disable @typescript-eslint/no-explicit-any */

type Audience = 'business' | 'developer' | 'support' | undefined;

export function formatEvidence(result: any, audience: Audience): string {
  const results = Array.isArray(result?.results) ? result.results.slice(0, 5) : [];

  if (results.length === 0) {
    return 'No relevant context found.';
  }

  const header =
    audience === 'business'
      ? 'Use this evidence to answer in a high-level, benefits-focused way.'
      : audience === 'developer'
        ? 'Use this evidence to answer in a technical, implementation-focused way.'
        : audience === 'support'
          ? 'Use this evidence to answer in a troubleshooting-oriented way.'
          : 'Use this evidence to answer accurately and cite sources.';

  const blocks = results.map((r: any, i: number) => {
    const s = r.source ?? {};
    const title = s.pageTitle ?? s.filename ?? 'Unknown';
    const section = s.sectionTitle ?? '';
    const url = s.canonical_url ?? s.url ?? '';
    const page = s.pageNumber ? `Page: ${s.pageNumber}` : '';

    return [
      `[Source ${i + 1}]`,
      `Title: ${title}`,
      section ? `Section: ${section}` : '',
      page,
      url ? `URL: ${url}` : '',
      '',
      'Content:',
      r.content ?? r.chunk_text ?? '',
    ]
      .filter(Boolean)
      .join('\n');
  });

  return [header, '', ...blocks].join('\n\n---\n\n');
}
