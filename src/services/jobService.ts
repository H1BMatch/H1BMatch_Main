// src/services/jobService.ts

import pool from '../utils/RDSConnection';
import { IJob } from '../models/Job';
import { QueryResult } from 'pg';
import { IUser } from '../models/User';

interface Filter {
  column: string;
  value: string | number | boolean;
}

export async function getJobsBySimilarity(userId: string, filters: Filter[]): Promise<IJob[]> {
  // Perform the similarity computation within the database
  console.log("userId", userId);
  let query_vector = ` (SELECT resume_vector FROM users WHERE clerk_user_id = $1) `;
  const resultOne : QueryResult<IUser> = await pool.query(query_vector, [userId]);
  console.log("query_vector", resultOne.rows[0].resume_vector);

  let query = `
    SELECT *, job_vector <-> (SELECT resume_vector FROM users WHERE user_id = $1) AS distance
    FROM jobs
    WHERE job_vector IS NOT NULL
  `;
  const values: any[] = [userId];
  let filterIndex = 2; // Start from 2 because $1 is used for userId

  filters.forEach(filter => {
    if (filter.column === 'date_posted') {
      // Convert relative date to actual date
      const daysAgo = parseInt(filter.value as string, 10);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      query += ` AND ${filter.column} >= $${filterIndex}`;
      values.push(date);
    } 
    else if (filter.column === 'title') {
      query += ` AND ${filter.column} ILIKE $${filterIndex}`;
      values.push(`%${filter.value}%`);
    }
    else if (filter.column === 'company') {
      query += ` AND ${filter.column} ILIKE $${filterIndex}`;
      values.push(`%${filter.value}%`);
    }
    else {
      query += ` AND ${filter.column} = $${filterIndex}`;
      console.log("filter.value", filter.value);
      console.log("filterIndex", filterIndex);
      console.log("filter.column", filter.column);
      values.push(filter.value);
    }
    filterIndex++;
  });

  query += `
    ORDER BY distance
    LIMIT 10
  `;
  console.log("query", query);

  const result: QueryResult<IJob & { distance: number }> = await pool.query(query, values);
  console.log("result", result.rows); 
  return result.rows;
}

// export async function getJobsByTitle(title: string): Promise<IJob[]> {
//   const query = 'SELECT * FROM jobs WHERE title ILIKE $1';
//   const values = [`%${title}%`];

//   const result: QueryResult<IJob> = await pool.query(query, values);
//   return result.rows;
// }
