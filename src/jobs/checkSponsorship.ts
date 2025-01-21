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
    await client.query('BEGIN');

    
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


cron.schedule('* * * * *', () => {
  checkSponsorship().catch((err) => {
    console.error('Scheduled job failed:', err);
  });
});
console.log('Job vector processing scheduled. The task will run every minute.');
