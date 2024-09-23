// src/services/jobService.ts

import pool from '../utils/RDSConnection';
import { IJob } from '../models/Job';
import { QueryResult } from 'pg';

export async function getJobsByTitle(title: string): Promise<IJob[]> {
  const query = 'SELECT * FROM jobs WHERE title ILIKE $1';
  const values = [`%${title}%`];

  const result: QueryResult<IJob> = await pool.query(query, values);
  return result.rows;
}

export async function getJobsBySimilarity(userId: string): Promise<IJob[]> {
  // Perform the similarity computation within the database
  const query = `
    SELECT *, job_vector <-> (SELECT resume_vector FROM users WHERE user_id = $1) AS distance
    FROM jobs
    WHERE job_vector IS NOT NULL
    ORDER BY distance
    LIMIT 10;
  `;
  const values = [userId];

  const result: QueryResult<IJob & { distance: number }> = await pool.query(query, values);
  return result.rows;
}
