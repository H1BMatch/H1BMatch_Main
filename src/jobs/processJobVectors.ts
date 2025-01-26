import dotenv from 'dotenv';
dotenv.config();
import pool from '../utils/RDSConnection'; 
import { generateEmbedding } from '../services/vectorService'; 
import { IJob } from '../models/job'; 
import cron from 'node-cron';
import pgvector from 'pgvector'; 

async function processJobsWithoutEmbeddings() {
  const client = await pool.connect();
  try {
    console.log('Starting to process jobs without embeddings...');
   
    await client.query('BEGIN');

    const res = await client.query<IJob>(
      'SELECT * FROM jobs WHERE job_vector IS NULL LIMIT 1' 
    );

    if (res.rows.length === 0) {
      console.log('No jobs without embeddings found.');
      await client.query('COMMIT');
      return;
    }

    console.log(`Found ${res.rows.length} jobs without embeddings.`);

    for (const job of res.rows) {
      try {
        if (!job.description) {
          console.warn(`Job with ID ${job.id} has no description. Skipping.`);
          continue;
        }
        
        const embedding = await generateEmbedding(job.description);

      
        const serializedEmbedding = pgvector.toSql(embedding);

        await client.query(
          'UPDATE jobs SET job_vector = $1 WHERE id = $2',
          [serializedEmbedding, job.id]
        );

        console.log(`Updated job ID ${job.id} with new embedding.`);
      } catch (err) {
        console.error(`Error processing job ID ${job.id}:`, err);
      }
    }

    await client.query('COMMIT');
    console.log('Finished processing jobs without embeddings.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during processing:', error);
  } finally {
    client.release();
  }
}

cron.schedule('* * * * *', () => {
  processJobsWithoutEmbeddings().catch((err) => {
    console.error('Scheduled job failed:', err);
  });
});
console.log('Job vector processing scheduled. The task will run every minute.');
