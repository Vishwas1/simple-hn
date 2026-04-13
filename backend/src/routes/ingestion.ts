import { Router } from 'express';
import { runPdfIngestion } from '../ingestion/pdfIngestion';
import { runWebsiteIngestion } from '../ingestion/websiteIngestion';
import { crawlUrlsAndTitles } from '../ingestion/map';
import { ingestRstDirectory } from '../ingestion/docs';

export const ingestionRouter = Router();

ingestionRouter.post('/website', async (_req, res) => {
  try {
    const { websiteUrl, allowedPaths } = _req.body;
    // implement validation for these params
    if (!websiteUrl) {
      res.status(400).json({
        ok: false,
        error: 'Missing required parameters: websiteUrl',
      });
      return;
    }
    const result = await runWebsiteIngestion(websiteUrl, allowedPaths);
    res.status(200).json(result);
  } catch (error: unknown) {
    console.error('Error occurred while running ingestion:', error);
    res.status(500).json({
      ok: false,
      error: (error as Error).message || 'An error occurred while running ingestion',
    });
  }
});

ingestionRouter.post('/pdf', async (_req, res) => {
  try {
    // const { document_id, websiteUrl, allowedPaths } = _req.body;
    // implement validation for these params
    // if (!document_id || !websiteUrl) {
    //   res.status(400).json({
    //     ok: false,
    //     error: 'Missing required parameters: document_id and websiteUrl',
    //   });
    //   return;
    // }
    const result = await runPdfIngestion();
    res.status(200).json(result);
  } catch (error: unknown) {
    console.error('Error occurred while running ingestion:', error);
    res.status(500).json({
      ok: false,
      error: (error as Error).message || 'An error occurred while running ingestion',
    });
  }
});

ingestionRouter.post('/map', async (_req, res) => {
  try {
    const { startUrl } = _req.body;
    // implement validation for these params
    if (!startUrl) {
      res.status(400).json({
        ok: false,
        error: 'Missing required parameters: startUrl',
      });
      return;
    }
    const result = await crawlUrlsAndTitles(startUrl);
    res.status(200).json(result);
  } catch (error: unknown) {
    console.error('Error occurred while crawling website:', error);
    res.status(500).json({
      ok: false,
      error: (error as Error).message || 'An error occurred while crawling website',
    });
  }
});

ingestionRouter.post('/official-docs', async (_req, res) => {
  try {
    const result = await ingestRstDirectory(_req.body.rootDir, _req.body.subDir);
    res.status(200).json(result);
  } catch (error: unknown) {
    console.error('Error occurred while crawling website:', error);
    res.status(500).json({
      ok: false,
      error: (error as Error).message || 'An error occurred while crawling website',
    });
  }
});
