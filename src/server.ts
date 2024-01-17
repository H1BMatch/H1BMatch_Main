import express from 'express';
import cors from 'cors';
import axios from 'axios';
import {getCompanyData} from '../src/services/companyService';
import jobRoutes from './routes/jobRoutes';

// import { Job } from './models/job';
// const { DynamoDBClient, PutItemCommand  } = require("@aws-sdk/client-dynamodb");
// import { marshall } from '@aws-sdk/util-dynamodb';

// const ddb = new DynamoDBClient({ region: 'us-east-2' });
// console.log('AWS connection setup complete.');


console.log("started");

const app = express();
app.set('json spaces', 2); 
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.use('/jobs', jobRoutes);

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