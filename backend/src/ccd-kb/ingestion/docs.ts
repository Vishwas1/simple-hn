import fs from 'fs';
import path from 'path';
import { Chunk, insertDocument } from './supabaseIngestion';
import { ingestChunksWithConcurrency } from './worker';

function getAllRstFiles(dir: string): string[] {
  let results: string[] = [];

  const list = fs.readdirSync(dir);

  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      results = results.concat(getAllRstFiles(fullPath));
    } else if (file.endsWith('.rst')) {
      results.push(fullPath);
    }
  }

  return results;
}

function rstPathToUrl(filePath: string, rootDir: string, subDir?: string): string {
  if (subDir && subDir.startsWith('/')) {
    subDir = subDir.slice(1);
  }
  const relative = filePath.replace(rootDir, `https://docs.concordium.com/en/mainnet`);

  // remove leading slash if present
  //   if (relative.startsWith('/')) {
  //     relative = relative.slice(1);
  //   }

  //   if (relative.endsWith('index.rst')) {
  //     relative = relative.replace('index.rst', '');
  //   } else {
  //     relative = relative.replace('.rst', '.html');
  //   }

  // relative = relative.replace('.rst', '.html');

  return relative.replace('.rst', '.html');
}

type Section = {
  title: string;
  content: string;
};

function parseRst(content: string): Section[] {
  const lines = content.split('\n');

  const sections: Section[] = [];

  let currentTitle = '';
  let buffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1];

    // Detect heading
    if (next && (/^=+$/.test(next) || /^-+$/.test(next))) {
      // push previous section
      if (buffer.length > 0) {
        sections.push({
          title: currentTitle,
          content: buffer.join('\n').trim(),
        });
        buffer = [];
      }

      currentTitle = line.trim();
      i++; // skip underline
    } else {
      buffer.push(line);
    }
  }

  // last section
  if (buffer.length > 0) {
    sections.push({
      title: currentTitle,
      content: buffer.join('\n').trim(),
    });
  }

  return sections;
}

function extractPathParts(filePath: string, rootDir: string) {
  let relative = filePath.replace(rootDir, '');

  if (relative.startsWith('/')) {
    relative = relative.slice(1);
  }

  const parts = relative.split('/');

  // remove filename
  parts.pop();

  return parts;
}

function cleanSegment(segment: string) {
  return segment.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function splitIntoChunks(text: string, size = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let i = 0;

  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size - overlap;
  }

  return chunks;
}

function buildChunks(
  sections: Section[],
  filePath: string,
  pageTitle: string,
  rootDir: string,
  subDir?: string,
): Chunk[] {
  const url = rstPathToUrl(filePath, rootDir, subDir);

  const chunks: Chunk[] = [];

  for (const section of sections) {
    const pieces = splitIntoChunks(section.content);

    for (const piece of pieces) {
      if (!piece.trim()) continue;

      chunks.push({
        title: pageTitle,
        content: piece,
        metadata: {
          url,
          pageTitle,
          sectionTitle: section.title,
        },
      });
    }
  }

  return chunks;
}

// function extractTitle(sections: Section[], filePath: string) {
//   if (sections.length > 0 && sections[0].title) {
//     return sections[0].title;
//   }

//   return path.basename(filePath, '.rst');
// }

function extractTitle(sections: Section[], filePath: string, rootDir: string) {
  const pathParts = extractPathParts(filePath, rootDir).map(cleanSegment).filter(Boolean);

  let pageTitle = sections[0]?.title?.trim();

  // fallback if useless title
  if (!pageTitle || pageTitle.toLowerCase() === 'index') {
    pageTitle = path.basename(filePath, '.rst');
  }

  pageTitle = cleanSegment(pageTitle);

  return ['Concordium Docs', ...pathParts, pageTitle].join(' | ');
}

export async function ingestRstDirectory(rootDir: string, subDir: string) {
  //   if (subDir && subDir.startsWith('/')) {
  //     subDir = subDir.slice(1);
  //   }

  const files = getAllRstFiles(rootDir + subDir);

  console.log(`Found ${files.length} .rst files`);

  const canonical_urls: unknown[] = [];

  for (const file of files) {
    try {
      console.log(`\n📄 Processing ${file}`);

      const raw = fs.readFileSync(file, 'utf-8');

      const sections = parseRst(raw);

      const title = extractTitle(sections, file, rootDir);

      const canonical_url = rstPathToUrl(file, rootDir, subDir);

      // 🔹 1. Create document
      const doc = await insertDocument(title, {
        source_type: 'docs',
        canonical_url,
      });

      const document_id = doc.document_id;

      // 🔹 2. Build chunks
      const chunks = buildChunks(sections, file, title, rootDir);

      console.log(`Generated ${chunks.length} chunks`);

      // 🔹 3. Attach document_id
      const chunksWithDoc = chunks.map((c) => ({
        ...c,
        document_id,
      }));

      // 🔹 4. Ingest with concurrency
      await ingestChunksWithConcurrency(chunksWithDoc, document_id, 5);

      canonical_urls.push({
        url: canonical_url,
        title,
        chunkSize: chunks.length,
        document_id,
      });
    } catch (err) {
      console.error(`❌ Failed file ${file}`, err);
    }
  }

  console.log('✅ Ingestion complete');
  return canonical_urls;
}
