// src/routes/jobRoutes.ts

import express, { Request, Response } from 'express';
import { getJobsByTitle, getJobsBySimilarity } from '../services/jobService';
import { authenticateToken } from '../middleware/auth';

const jobRoutes = express.Router();

// Get Jobs by Title
jobRoutes.get('/title/:title', async (req: Request, res: Response) => {
  const { title } = req.params;
  try {
    const jobs = await getJobsByTitle(title);
    res.status(200).json(jobs);
  } catch (error: any) {
    console.error('Error fetching job data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Jobs by Similarity
jobRoutes.get('/match', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user.id; // From authentication middleware
  try {
    const jobs = await getJobsBySimilarity(userId);
    res.status(200).json(jobs);
  } catch (error: any) {
    console.error('Error fetching matched jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

export default jobRoutes;
