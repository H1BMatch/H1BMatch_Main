// src/services/jobService.ts

import pool from '../utils/RDSConnection';
import { IJob } from '../models/Job';
import { QueryResult } from 'pg';

interface Filters {
  title?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  job_type?: string;
  is_remote?: boolean;
  date_posted?: string; // days ago
  min_salary?: string;
  max_salary?: string;
  job_level?: string;
  company_industry?: string;
  is_sponsor?: boolean;
}

export async function getJobsBySimilarity(
  userId: string,
  filters: Filters
): Promise<IJob[]> {
  const values: any[] = [userId];
  let filterIndex = 2; // $1 is userId
  let query = `
    SELECT *, job_vector <-> (SELECT resume_vector FROM users WHERE clerk_user_id = $1) AS distance
    FROM jobs
    WHERE job_vector IS NOT NULL
  `;

  // Build query based on filters
  if (filters.title) {
    query += ` AND title ILIKE $${filterIndex}`;
    values.push(`%${filters.title}%`);
    filterIndex++;
  }
  if (filters.company) {
    query += ` AND company ILIKE $${filterIndex}`;
    values.push(`%${filters.company}%`);
    filterIndex++;
  }
  if (filters.city) {
    query += ` AND city = $${filterIndex}`;
    values.push(filters.city);
    filterIndex++;
  }
  if (filters.state) {
    query += ` AND state = $${filterIndex}`;
    values.push(filters.state);
    filterIndex++;
  }
  if (filters.country) {
    query += ` AND country = $${filterIndex}`;
    values.push(filters.country);
    filterIndex++;
  }
  if (filters.job_type) {
    query += ` AND job_type = $${filterIndex}`;
    values.push(filters.job_type);
    filterIndex++;
  }
  if (filters.is_remote !== undefined) {
    query += ` AND is_remote = $${filterIndex}`;
    values.push(filters.is_remote);
    filterIndex++;
  }
  if (filters.date_posted) {
    const daysAgo = parseInt(filters.date_posted, 10);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    query += ` AND date_posted >= $${filterIndex}`;
    values.push(date);
    filterIndex++;
  }
  if (filters.min_salary) {
    query += ` AND min_amount >= $${filterIndex}`;
    values.push(parseFloat(filters.min_salary));
    filterIndex++;
  }
  if (filters.max_salary) {
    query += ` AND max_amount <= $${filterIndex}`;
    values.push(parseFloat(filters.max_salary));
    filterIndex++;
  }
  if (filters.job_level) {
    query += ` AND job_level = $${filterIndex}`;
    values.push(filters.job_level);
    filterIndex++;
  }
  if (filters.company_industry) {
    query += ` AND company_industry = $${filterIndex}`;
    values.push(filters.company_industry);
    filterIndex++;
  }
  if (filters.is_sponsor !== undefined) {
    query += ` AND is_sponsor = $${filterIndex}`;
    values.push(filters.is_sponsor);
    filterIndex++;
  }

  query += `
    ORDER BY distance
    LIMIT 50
  `;

  const result: QueryResult<IJob & { distance: number }> = await pool.query(
    query,
    values
  );
  return result.rows;
}

