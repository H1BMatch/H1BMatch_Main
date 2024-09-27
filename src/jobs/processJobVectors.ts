// src/jobs/processJobVectors.ts

import dotenv from 'dotenv';
dotenv.config();
import pool from '../utils/RDSConnection'; // Ensure this path is correct
import { generateEmbedding } from '../services/vectorService'; // Ensure this path is correct
import { IJob } from '../models/Job'; // Ensure correct case
import cron from 'node-cron';
import pgvector from 'pgvector'; // Import pgvector for serialization

// Function to process jobs without embeddings
async function processJobsWithoutEmbeddings() {
  const client = await pool.connect();
  try {
    console.log('Starting to process jobs without embeddings...');
    // Begin transaction
    await client.query('BEGIN');

    // Fetch jobs where job_vector is NULL
    const res = await client.query<IJob>(
      'SELECT * FROM jobs WHERE job_vector IS NULL LIMIT 1' // Adjust LIMIT as needed
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
        

        // Generate embedding
        const embedding = await generateEmbedding(job.description);

        // Serialize the embedding using pgvector
        const serializedEmbedding = pgvector.toSql(embedding);

        // Update the job_vector column
        await client.query(
          'UPDATE jobs SET job_vector = $1 WHERE id = $2',
          [serializedEmbedding, job.id]
        );

        console.log(`Updated job ID ${job.id} with new embedding.`);
      } catch (err) {
        console.error(`Error processing job ID ${job.id}:`, err);
        // Optionally, implement retry logic or mark the job as failed
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log('Finished processing jobs without embeddings.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during processing:', error);
  } finally {
    client.release();
  }
}

// Schedule the job to run every hour
cron.schedule('* * * * *', () => {
  processJobsWithoutEmbeddings().catch((err) => {
    console.error('Scheduled job failed:', err);
  });
});
console.log('Job vector processing scheduled. The task will run every minute.');
