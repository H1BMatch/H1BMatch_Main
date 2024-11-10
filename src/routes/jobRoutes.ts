// src/routes/jobRoutes.ts

import express, { Request, Response } from 'express';
import { getJobsBySimilarity } from '../services/jobService';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

const jobRoutes = express.Router();

jobRoutes.get(
  '/match',
  ClerkExpressRequireAuth(),
  async (req: Request, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    try {
      // Extract filters from query parameters
      const filters = {
        title: req.query.title as string,
        company: req.query.company as string,
        city: req.query.city as string,
        state: req.query.state as string,
        country: req.query.country as string,
        job_type: req.query.job_type as string,
        is_remote: req.query.is_remote === 'true',
        date_posted: req.query.date_posted as string, // days ago
        min_salary: req.query.min_salary as string,
        max_salary: req.query.max_salary as string,
        job_level: req.query.job_level as string,
        company_industry: req.query.company_industry as string,
        is_sponsor: req.query.is_sponsor === 'true',
      };

      const jobs = await getJobsBySimilarity(userId, filters);
      res.status(200).json(jobs);
    } catch (error: any) {
      console.error('Error fetching matched jobs:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export default jobRoutes;


// import express, { Request, Response } from 'express';
// import { getJobsBySimilarity } from '../services/jobService';
// // import { authenticateToken } from '../middleware/auth';  Incase the user uses email instead of Clerk
// import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node'


// const jobRoutes = express.Router();

// jobRoutes.get('/match', ClerkExpressRequireAuth(), async (req: Request, res: Response) => {
//     const userId = req.auth?.userId; 
//     if (!userId) {
//       return res.status(403).json({ error: 'Unauthorized' });
//     }
//     try {
//       // Parse filters from query parameters
//       const filters = req.query.filters ? JSON.parse(req.query.filters as string) : [];

//       // Ensure filters is an array of objects with column and value properties
//       const parsedFilters = Array.isArray(filters) ? filters.map(filter => ({
//         column: filter.column,
//         value: filter.value
//       })) : [];

//       const jobs = await getJobsBySimilarity(userId, parsedFilters);
//       res.status(200).json(jobs);
//     } catch (error: any) {
//       console.error('Error fetching matched jobs:', error);
//       res.status(500).json({ error: error.message });
//     }
//   }

// );

// // Get Jobs by Title
// // jobRoutes.get('/title/:title', async (req: Request, res: Response) => {
// //   const { title } = req.params;
// //   try {
// //     const jobs = await getJobsByTitle(title);
// //     res.status(200).json(jobs);
// //   } catch (error: any) {
// //     console.error('Error fetching job data:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// export default jobRoutes;
