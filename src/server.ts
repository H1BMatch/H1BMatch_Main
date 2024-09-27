import dotenv from 'dotenv';
dotenv.config();
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import {getCompanyData} from '../src/services/companyService';
import jobRoutes from './routes/jobRoutes';
import userRoutes from './routes/userRoutes';
import { ClerkExpressWithAuth, LooseAuthProp, WithAuthProp } from '@clerk/clerk-sdk-node'
import { ClerkExpressRequireAuth, RequireAuthProp, StrictAuthProp } from '@clerk/clerk-sdk-node'

const app: Application = express()

declare global {
  namespace Express {
    interface Request extends LooseAuthProp {}
  }
}
const corsOptions = {
  origin: 'http://localhost:5173', // Replace with your frontend's origin
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
};


console.log('JWT_SECRET:', process.env.JWT_SECRET);

// const app = express();
app.use(ClerkExpressWithAuth());
app.set('json spaces', 2); 
app.use(express.json());
app.use(cors(corsOptions));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
app.use('/api/users', userRoutes);
app.use('/api/auth', userRoutes);
app.use('/api/jobs', jobRoutes);

app.get('/api/user-profile', (req: WithAuthProp<Request>, res: Response) => {
  const userId = req.auth?.userId ?? 'defaultUserId'; // Use userId from `req.auth`
  if (userId) {
    // Assuming you'll fetch and return user profile from the database here
    res.json({ userId });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Error Handling Middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: err.message });
});

app.get('/api/company', async (req, res) => {
  const companyName = req.query.company;
  if (!companyName) {
    console.log('Company name is required');
    return res.status(400).send('Company name is required');
  }

  try {
    const companyData = await getCompanyData(companyName.toString());
    res.json(companyData);
  } catch (err: any) {
    console.error('Error executing query', err.stack);
    res.status(500).send('Server error');
  }
});

// Routes
// app.post('/jobs', async (req, res) => {
//   const jobData: Job = req.body;
//   const item = marshall(jobData);

//   const params = {
//     TableName: 'jobs',
//     Item: item,
//   };
//   const command = new PutItemCommand(params );

//   try {
//     console.log('Attempting to store job data:', jobData);
//     const response = await ddb.send(command);
//     console.log(response);
//     console.log('Job data stored successfully:', jobData);
//     res.status(201).send('Job data stored successfully');
//   } catch (error) {
//     console.error('Error storing job data:', error);
//     res.status(500).json({ error: (error as Error).message });
//   }
// });