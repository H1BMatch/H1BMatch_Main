import axios from 'axios';
import { getCompanyData } from './companyService';

export async function getJobsByTitle(title: string) {
    let i= 0;
  const TOTAL_JOBS = 10; 
  const JOBS_PER_PAGE = 20;
  const encodedTitle = encodeURIComponent(title);
  const baseUrl = "https://www.indeed.com/rss?q=" + encodedTitle;
  let allJobs = [];

  try {
    while (allJobs.length < TOTAL_JOBS) {
     
      const fullUrl = `${baseUrl}&start=${i}`;
      console.log(`Fetching jobs from URL: ${fullUrl}`);
      i += JOBS_PER_PAGE;
      const scraperResponse = await axios.get(`http://localhost:3002/parseRss?fullUrl=${encodeURIComponent(fullUrl)}`);
      const jobs = scraperResponse.data;

      for (const job of jobs) {
        console.log('Fetching company data for:', job.company);
        const companyData = await getCompanyData(job.company);

        if (companyData !== null) {
          job.companyData = companyData;
          allJobs.push(job);
        }
      }
    }
    console.log(`Total number of jobs reached: ${TOTAL_JOBS}`);
    console.log(JSON.stringify(allJobs, null, 2));
    return allJobs;
  } catch (error) {
    console.error('Error fetching job data:', error);
    return null;
  }
}
