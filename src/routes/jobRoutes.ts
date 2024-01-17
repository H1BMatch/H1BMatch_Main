import express from 'express';
import {getJobsByTitle} from '../services/jobService';

const jobRoutes = express.Router();

jobRoutes.get('/:title', async (req, res) => {
    const { title } = req.params;
    try{
    const jobs = await getJobsByTitle(title);
    res.status(200).json(jobs);
    }
    catch(error){
        console.error('Error fetching job data:', error);
        res.status(500).json({ error: (error as Error).message });
    }
    });
export default jobRoutes;