import { Chunk, ChunkWithDocumentId, ingestChunk } from './supabaseIngestion';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function runWithConcurrency<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function workerLoop() {
    while (index < items.length) {
      const currentIndex = index++;
      const item = items[currentIndex];

      try {
        const result = await worker(item, currentIndex);
        results[currentIndex] = result;
      } catch (err) {
        console.error(`Error processing item ${currentIndex}`, err);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => workerLoop());
  await Promise.all(workers);

  return results;
}

// async function withRetry(fn: () => Promise<any>, retries = 3) {
//   let attempt = 0;

//   while (attempt < retries) {
//     try {
//       return await fn();
//     } catch (err) {
//       attempt++;
//       console.warn(`Retry ${attempt}...`);

//       if (attempt === retries) throw err;

//       await new Promise(r => setTimeout(r, 500 * attempt));
//     }
//   }
// }

export async function ingestChunksWithConcurrency(
  chunks: Chunk[],
  document_id: string,
  concurrency = 5,
) {
  if (!document_id) {
    throw new Error('Document ID is required for ingestion');
  }
  let successCount = 0;
  let failureCount = 0;

  console.log(`Starting ingestion of ${chunks.length} chunks...`);

  const startTime = Date.now();

  await runWithConcurrency(
    chunks,
    async (chunk, index) => {
      const payload: ChunkWithDocumentId = {
        ...chunk,
        document_id,
      };

      try {
        const res = await ingestChunk(payload);

        successCount += res.chunks_stored;

        // console.log(`✅ [${index + 1}/${chunks.length}] Stored: ${res.chunks_stored}`);
        if ((index + 1) % 10 === 0) {
          console.log(`Progress: ${index + 1}/${chunks.length}`);
        }
      } catch (err) {
        failureCount++;
        console.error(`❌ [${index + 1}] Failed`, err);
      }
    },
    concurrency,
  );

  const duration = (Date.now() - startTime) / 1000;

  console.log('------ INGEST SUMMARY ------');
  console.log(`Total: ${chunks.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failureCount}`);
  console.log(`Time: ${duration}s`);
}
