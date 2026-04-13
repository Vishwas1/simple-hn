/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from 'node-fetch';

const INGEST_API_URL = 'https://zohybozkprtltzsijyyi.supabase.co/functions/v1/ingest'; // Update with your actual API URL
const INSERT_DOCUMENT_API_URL =
  'https://zohybozkprtltzsijyyi.supabase.co/functions/v1/create-document'; // Update with your actual API URL
const API_KEY = 'sb_publishable_D1uyhi2guDMbcg0tPDJs-A_8dim5jk7';
const ACCESS_TOKEN = 'sb_publishable_D1uyhi2guDMbcg0tPDJs-A_8dim5jk7';

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
