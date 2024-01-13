import express from 'express';
import cors from 'cors';
import { Job } from './models/job';
const { DynamoDBClient, PutItemCommand  } = require("@aws-sdk/client-dynamodb");
import { marshall } from '@aws-sdk/util-dynamodb';
import axios from 'axios';
const ddb = new DynamoDBClient({ region: 'us-east-2' });
console.log('AWS connection setup complete.');
console.log("started");

const app = express();
app.use(express.json());
app.use(cors());

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


// Endpoint to get job title and location from the user
app.get('/jobs/:title', async (req, res) => {
  const { title } = req.params;

  try {
    // Call the IndeedScraper API to get job data
    const scraperResponse = await axios.get(`http://localhost:3002/parseRss?job=${title}`);
    const jobs = scraperResponse.data;

    // Iterate through the job data and fetch company data from the database
    for (const job of jobs) {
      const companyData = await fetchCompanyData(job.company);

      // Append company data to the job object
      job.companyData = companyData;
    }

    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching job data:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Function to fetch company data from the database
async function fetchCompanyData(company: string) {
  try {
    // Call the database to get company data based on the company name
    const companyDataResponse = await axios.get(`http://localhost:3000/${company}`);
    const companyData = companyDataResponse.data;

    return companyData;
  } catch (error) {
    console.error('Error fetching company data:', error);
    return null;
  }
}
