import { Router } from 'express';
import { insertDocument } from '../ingestion/supabaseIngestion';

export const documentRouter = Router();

documentRouter.post('/insert', async (_req, res) => {
  try {
    const { title, metadata } = _req.body;
    //implement validation for these params
    if (!title) {
      res.status(400).json({
        ok: false,
        error: 'Missing required parameter: title',
      });
      return;
    }
    const result = await insertDocument(title, metadata);
    res.status(200).json(result);
  } catch (error: unknown) {
    console.error('Error occurred while inserting document:', error);
    res.status(500).json({
      ok: false,
      error: (error as Error).message || 'An error occurred while inserting document',
    });
  }
});
