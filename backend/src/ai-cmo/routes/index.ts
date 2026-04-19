import { Router } from 'express';
import { brandRouter } from './brands';
import { campaignRouter } from './campaign';

export const aiCMORouter = Router();

aiCMORouter.use('/brands', brandRouter);
aiCMORouter.use('/campaign', campaignRouter);
