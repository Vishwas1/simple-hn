import { Router } from 'express';
import { db } from '../services/db';

export const brandRouter = Router();

/**
 * GET /brands
 * Pulls a list of all available brands with basic details
 */
brandRouter.get('/', async (req, res) => {
  try {
    // 1. Get all brand IDs (filenames) from the database service
    const brandIds = await db.list('brands');

    // 2. Fetch basic details for each brand
    const brandList = await Promise.all(
      brandIds.map(async (id) => {
        const fullProfile = await db.get('brands', id);

        // Return only the basic UI-friendly details
        return {
          id: id,
          name: fullProfile.name,
          industry: fullProfile.profile.industry,
          vision: fullProfile.profile.vision.substring(0, 100) + '...', // Short snippet
          logo: fullProfile.logo || null, // If you have logo URLs
        };
      }),
    );

    res.json(brandList);
  } catch (error) {
    console.error('Failed to fetch brands list:', error);
    res.status(500).json({ error: 'Could not retrieve brands' });
  }
});

/**
 * GET /brands/:id
 * Pulls the full profile for a specific brand (for the "Settings" page)
 */
brandRouter.get('/:id', async (req, res) => {
  const brand = await db.get('brands', req.params.id);
  if (!brand) return res.status(404).json({ error: 'Brand not found' });
  res.json(brand);
});
