import { Request, Response, Router } from 'express';
import {
  GetBrandProfileResponse,
  ListBrandProfilesResponse,
  supabaseService,
} from '../services/supabase';

export const brandRouter = Router();

type ErrorResponse = {
  error: string;
};

type ListBrandsQuery = {
  workspace_id?: string;
};

type BrandProfileQuery = {
  workspace_id?: string;
  brand_name?: string;
};

/**
 * GET /brands
 * Returns the list of brands
 */
brandRouter.get(
  '/',
  async (
    req: Request<
      Record<string, never>,
      ListBrandProfilesResponse | ErrorResponse,
      never,
      ListBrandsQuery
    >,
    res: Response<ListBrandProfilesResponse | ErrorResponse>,
  ) => {
    try {
      const workspace_id =
        typeof req.query.workspace_id === 'string' ? req.query.workspace_id.trim() : '';
      const brandList = await supabaseService.listBrandProfiles(
        workspace_id ? { workspace_id } : {},
      );
      return res.json(brandList);
    } catch (error) {
      console.error('Failed to fetch brands:', error);
      return res.status(500).json({ error: 'Could not retrieve brands' });
    }
  },
);

/**
 * GET /brands/profile
 * Fetches a specific brand using workspace_id and brand_name query params
 */
brandRouter.get(
  '/profile',
  async (
    req: Request<
      Record<string, never>,
      GetBrandProfileResponse | ErrorResponse,
      never,
      BrandProfileQuery
    >,
    res: Response<GetBrandProfileResponse | ErrorResponse>,
  ) => {
    try {
      const workspace_id =
        typeof req.query.workspace_id === 'string' ? req.query.workspace_id.trim() : '';
      const brand_name =
        typeof req.query.brand_name === 'string' ? req.query.brand_name.trim() : '';

      if (!workspace_id || !brand_name) {
        return res.status(400).json({
          error: 'workspace_id and brand_name query params are required',
        });
      }

      const brand = await supabaseService.getBrandProfile({
        workspace_id,
        brand_name,
      });

      return res.json(brand);
    } catch (error) {
      console.error('Failed to fetch brand profile:', error);
      return res.status(500).json({ error: 'Could not retrieve brand profile' });
    }
  },
);
