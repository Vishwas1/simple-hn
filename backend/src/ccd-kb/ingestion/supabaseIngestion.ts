/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'node-fetch';
import { env } from '../../config/env.js';

const INGEST_API_URL = env.SUPABASE_INGEST_URL;
const INSERT_DOCUMENT_API_URL = env.SUPABASE_INSERT_DOCUMENT_URL;
const API_KEY = env.SUPABASE_API_KEY;
const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;

export type Chunk = {
  title: string;
  content: string;
  metadata: {
    url: string;
    pageTitle: string;
    sectionTitle: string;
  };
};

// extend Chunk with document_id for ingestion
export type ChunkWithDocumentId = {
  title: string;
  content: string;
  metadata: {
    url: string;
    pageTitle: string;
    sectionTitle: string;
  };
  document_id: string;
};

export type IngestChunkResponse = {
  status: string;
  document_id: string;
  chunks_total: number;
  chunks_stored: number;
};

export type CreateDocumentResponse = {
  document_id: string;
};

export type WebsiteDocumentMetadata = {
  source_type: string; // website, pdf, etc
  canonical_url: string;
};

// 🔹 Sanitize text by encoding it in base64 to ensure safe transmission
export function sanitizeTextToBase64(text: string) {
  return Buffer.from(text, 'utf-8').toString('base64');
}

// 🔹 Helper: call /ingest API
export async function ingestChunk(chunk: ChunkWithDocumentId): Promise<IngestChunkResponse> {
  // console.log(`Ingesting chunk for title: ${title}, page: ${metadata.pageNumber || 'N/A'}`);
  // console.log(
  //   `Ingesting chunk for title: ${chunk.title}, metadata: ${JSON.stringify(chunk.metadata)}`,
  // );
  if (!INGEST_API_URL) {
    throw new Error('SUPABASE_INGEST_URL is not defined in environment variables');
  }
  const res = await fetch(INGEST_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      apikey: API_KEY || '',
    },
    body: JSON.stringify({
      title: chunk.title,
      content: sanitizeTextToBase64(chunk.content),
      metadata: chunk.metadata,
      document_id: chunk.document_id,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ingest API error: ${errText}`);
  }

  const data: IngestChunkResponse = (await res.json()) as IngestChunkResponse;
  return data;
}

// 🔹 Helper: call /create-document API
export async function insertDocument(
  title: string,
  metadata: WebsiteDocumentMetadata,
): Promise<CreateDocumentResponse> {
  // console.log(`Ingesting chunk for title: ${title}, page: ${metadata.pageNumber || 'N/A'}`);
  console.log(`Ingesting chunk for title: ${title}`);
  if (!INSERT_DOCUMENT_API_URL) {
    throw new Error('SUPABASE_INSERT_DOCUMENT_URL is not defined in environment variables');
  }
  const res = await fetch(INSERT_DOCUMENT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      apikey: API_KEY || '',
    },
    body: JSON.stringify({ title, metadata }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Insert Document API error: ${errText}`);
  }

  const data: CreateDocumentResponse = (await res.json()) as CreateDocumentResponse;
  return data;
}
