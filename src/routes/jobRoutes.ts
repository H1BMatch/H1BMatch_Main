import express, { Request, Response } from 'express';
import { getJobsBySimilarity } from '../services/jobService';
// import { authenticateToken } from '../middleware/auth';  Incase the user uses email instead of Clerk
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node'


const jobRoutes = express.Router();

jobRoutes.get('/match', ClerkExpressRequireAuth(), async (req: Request, res: Response) => {
    const userId = req.auth?.userId; 
    if (!userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
      // Parse filters from query parameters
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : [];

      // Ensure filters is an array of objects with column and value properties
      const parsedFilters = Array.isArray(filters) ? filters.map(filter => ({
        column: filter.column,
        value: filter.value
      })) : [];

      const jobs = await getJobsBySimilarity(userId, parsedFilters);
      res.status(200).json(jobs);
    } catch (error: any) {
      console.error('Error fetching matched jobs:', error);
      res.status(500).json({ error: error.message });
    }
  }

);

// Get Jobs by Title
// jobRoutes.get('/title/:title', async (req: Request, res: Response) => {
//   const { title } = req.params;
//   try {
//     const jobs = await getJobsByTitle(title);
//     res.status(200).json(jobs);
//   } catch (error: any) {
//     console.error('Error fetching job data:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

export default jobRoutes;
