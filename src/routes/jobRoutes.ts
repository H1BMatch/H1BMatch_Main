
import express, { Request, Response } from 'express';
import { getJobsBySimilarity,getAppliedJobs } from '../services/jobService';
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
      const filters ={}
      // Extract filters from query parameters
      // const filters = {
      //   title: req.query.title as string,
      //   company: req.query.company as string,
      //   city: req.query.city as string,
      //   state: req.query.state as string,
      //   country: req.query.country as string,
      //   job_type: req.query.job_type as string,
      //   is_remote: req.query.is_remote === 'true',
      //   date_posted: req.query.date_posted as string, // days ago
      //   min_salary: req.query.min_salary as string,
      //   max_salary: req.query.max_salary as string,
      //   job_level: req.query.job_level as string,
      //   company_industry: req.query.company_industry as string,
      //   is_sponsor: req.query.is_sponsor === 'true',
      // };

      const jobs = await getJobsBySimilarity(userId, filters);
      console.log('jobs:', jobs);
      res.status(200).json(jobs);
    } catch (error: any) {
      console.error('Error fetching matched jobs:', error);
      res.status(500).json({ error: error.message });
    }
  }
);
jobRoutes.get('/applied-jobs', ClerkExpressRequireAuth(), async (req: Request, res: Response) => {
  try {
    // user id form the auth object is the clerk id
    const user: string = req.auth.userId ?? '';
    const appliedDate: string = req.body.appliedDate;
    const getAppliedJobsForTheUser = await getAppliedJobs(user);
    if (!getAppliedJobsForTheUser) {
      return res.status(500).json({ message: "Error updating applied jobs" });
    }
    res.status(200).json(getAppliedJobsForTheUser);
  } catch (error) {
    res.status(500).json({ message: "Error updating applied jobs", error });
  }  
});

export default jobRoutes;


