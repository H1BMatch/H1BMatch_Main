import dotenv from 'dotenv';
dotenv.config();
import pool from '../utils/RDSConnection'; 
import cron from 'node-cron';

let isRunning = false;

async function checkSponsorship() {
  if (isRunning) {
    console.log('Job is already running. Skipping this execution.');
    return;
  }

  isRunning = true;
  const client = await pool.connect();
  try {
    console.log('Starting to process jobs without sponsorship information...');
    // Begin transaction
    await client.query('BEGIN');

    // Update jobs with sponsorship information based on the most likely company name
    const updateQuery = `
      WITH company_matches AS (
        SELECT 
          j.id AS job_id,
          a.employer_name,
          a.total_applications,
          ROW_NUMBER() OVER (PARTITION BY j.id ORDER BY a.total_applications DESC) AS rn
        FROM jobs j
        LEFT JOIN (
          SELECT 
            employer_name, 
            sum(applications) AS total_applications
          FROM agg_company_23_24_data
          GROUP BY employer_name
        ) a ON j.company ILIKE a.employer_name || '%'
        WHERE j.is_sponsor IS NULL
      )
      UPDATE jobs
      SET 
        is_sponsor = CASE WHEN cm.rn = 1 THEN true ELSE false END,
        lca_company_name = CASE WHEN cm.rn = 1 THEN cm.employer_name ELSE NULL END
      FROM company_matches cm
      WHERE jobs.id = cm.job_id;
    `;

    const res = await client.query(updateQuery);

    console.log(`Updated ${res.rowCount} jobs with sponsorship information.`);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error processing jobs:', err);
  } finally {
    client.release();
    isRunning = false;
  }
}

export default checkSponsorship;

// Schedule the job to run every minute
cron.schedule('* * * * *', () => {
  checkSponsorship().catch((err) => {
    console.error('Scheduled job failed:', err);
  });
});
console.log('Job vector processing scheduled. The task will run every minute.');
// import dotenv from 'dotenv';
// dotenv.config();
// import pool from '../utils/RDSConnection'; 
// import { IJob } from '../models/Job';
// import cron from 'node-cron';

// async function checkSponsorship() {
//   const client = await pool.connect();
//   try {
//     console.log('Starting to process jobs without sponsorship information...');
//     // Begin transaction
//     await client.query('BEGIN');

//     // Fetch jobs where is_sponsor is NULL
//     const res = await client.query<IJob>(
//       'SELECT * FROM jobs WHERE is_sponsor IS NULL LIMIT 50' // Adjust LIMIT as needed
//     );

//     if (res.rows.length === 0) {
//       console.log('No jobs without sponsorship information found.');
//       await client.query('COMMIT');
//       return;
//     }

//     console.log(`Found ${res.rows.length} jobs without sponsorship information.`);

//     for (const job of res.rows) {
//       try {
//         const companyName = job.company.toLowerCase();

//         // Query to find the most likely company name from agg_company_23_24_data
//         const companyRes = await client.query(
//           `
//           SELECT employer_name, sum(applications) as total_applications
//           FROM agg_company_23_24_data
//           WHERE employer_name ILIKE $1
//           GROUP BY employer_name
//           ORDER BY total_applications DESC
//           LIMIT 1;
//           `,
//           [`${companyName}%`]
//         );

//         if (companyRes.rows.length > 0) {
//           const matchedCompany = companyRes.rows[0].employer_name;
//           await client.query(
//             `
//             UPDATE jobs
//             SET is_sponsor = true, lca_company_name = $1
//             WHERE id = $2;
//             `,
//             [matchedCompany, job.id]
//           );
//           console.log(`Updated job ID ${job.id} with sponsor information and company name ${matchedCompany}.`);
//         } else {
//           await client.query(
//             `
//             UPDATE jobs
//             SET is_sponsor = false
//             WHERE id = $1;
//             `,
//             [job.id]
//           );
//           console.log(`Updated job ID ${job.id} with no sponsor information.`);
//         }
//       } catch (err) {
//         console.error(`Error processing job ID ${job.id}:`, err);
//       }
//     }

//     await client.query('COMMIT');
//   } catch (err) {
//     await client.query('ROLLBACK');
//     console.error('Error processing jobs:', err);
//   } finally {
//     client.release();
//   }
// }

// export default checkSponsorship;
// // Schedule the job to run every hour
// cron.schedule('* * * * *', () => {
//     checkSponsorship().catch((err) => {
//     console.error('Scheduled job failed:', err);
//   });
// });
// console.log('Job vector processing scheduled. The task will run every minute.');
