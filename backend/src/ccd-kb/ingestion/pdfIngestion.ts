/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs';
import path from 'path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { console } from 'inspector';
import { ingestChunk } from './supabaseIngestion';

// 🔹 Config
const PENDING_FOLDER = './pending';
const DONE_FOLDER = './done';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

async function processFile(filePath: string) {
  const stats = fs.statSync(filePath);
  console.log(`File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

  if (stats.size > MAX_FILE_SIZE) {
    console.log(`Skipping ${filePath}, size exceeds ${MAX_FILE_SIZE} bytes`);
    return;
  }

  const fileName = path.basename(filePath);
  console.log(`Processing file: ${fileName}`);
  const fileTitle = path.parse(fileName).name;

  // print file stats; size, filename, filepath, created time, modified time, extension, etc
  // in nice format
  console.log(`File stats - 
    Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB, 
    Created: ${stats.birthtime},
    Modified: ${stats.mtime},
    FileName: ${fileName},
    Extension: ${path.extname(fileName)}`);

  // 1. Load the PDF document
  console.log(`Loading PDF document: ${filePath}`);
  const loadingTask = pdfjs.getDocument(filePath);
  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;

  const metadata = {
    size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
    created: stats.birthtime.toUTCString(),
    filename: fileName,
    pageNumber: 0,
    totalPages: numPages,
  };
  console.log(`PDF loaded: ${fileTitle}, total pages: ${numPages}`);

  // 2. Iterate over each page
  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const textContent = await page.getTextContent();

    // Join text items into a single string for the page
    const pageText = textContent.items.map((item: any) => item.str || '').join(' ');

    console.log(`Processing page ${i}...`);
    metadata.pageNumber = i;
    // 3. Call the API with the page content
    console.log('Adding delay before API call to avoid rate limits...');
    // setTimeout(async () => {
    //   console.log(`Ingesting page ${i} for file ${fileTitle} at time: ${new Date().toISOString()}`);
    //   await ingestChunk(fileTitle, sanitizeText(pageText), metadata);
    // }, 10000);
    await ingestChunk({
      title: fileTitle,
      content: pageText,
      metadata: {
        ...metadata,
        url: '',
        pageTitle: '',
        sectionTitle: '',
      },
      document_id: '', // will be filled in worker
    });
    console.log(`Page ${i} ingested for file ${fileTitle}`);
  }

  if (!fs.existsSync(DONE_FOLDER)) fs.mkdirSync(DONE_FOLDER);
  fs.renameSync(filePath, path.join(DONE_FOLDER, fileName));
  console.log(`File moved to done: ${path.join(DONE_FOLDER, fileName)}`);
}

// 🔹 Main: process all files in pending folder
export async function runPdfIngestion() {
  console.log('Starting ingestion process...');
  if (!fs.existsSync(DONE_FOLDER)) {
    fs.mkdirSync(DONE_FOLDER);
  }

  console.log(`Checking for files in pending folder: ${PENDING_FOLDER}`);
  const files = fs
    .readdirSync(PENDING_FOLDER)
    .filter((f) => f.endsWith('.txt') || f.endsWith('.md') || f.endsWith('.pdf'));

  if (files.length === 0) {
    console.log('No files to process in pending folder.');
    return;
  }

  console.log(`Found ${files.length} file(s) to process.`);
  for (const file of files) {
    console.log(`Processing file: ${file}`);
    const fullPath = path.join(PENDING_FOLDER, file);
    try {
      console.log(`Reading file: ${fullPath}`);
      await processFile(fullPath);
      console.log(`Finished processing file: ${file}`);
    } catch (err) {
      console.error(`Error processing file ${file}:`, err);
    }
  }

  console.log('All files processed.');
}
