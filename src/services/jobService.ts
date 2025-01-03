// src/services/jobService.ts

import pool from '../utils/RDSConnection';
import { IJob } from '../models/job';
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
  const appliedJobs = await getAppliedJobs(userId); // Get applied jobs
  const appliedJobIds = appliedJobs.map((job) => job.id); // Extract job IDs
  const values: any[] = [userId];
  let filterIndex = 2; // $1 is userId

  let query = `
    SELECT *, job_vector <-> (SELECT resume_vector FROM users WHERE clerk_user_id = $1) AS distance
    FROM jobs
    WHERE job_vector IS NOT NULL
  `;

  // Exclude applied jobs
  if (appliedJobIds.length > 0) {
    query += ` AND id NOT IN (${appliedJobIds.map((_, index) => `$${filterIndex + index}`).join(", ")})`;
    values.push(...appliedJobIds);
    filterIndex += appliedJobIds.length;
  }

  // Build query based on filters
  if (filters.title) {
    query += ` AND title ILIKE $${filterIndex}`;
    values.push(`%${filters.title}%`);
    filterIndex++;
  }
  // if (filters.company) {
  //   query += ` AND company ILIKE $${filterIndex}`;
  //   values.push(`%${filters.company}%`);
  //   filterIndex++;
  // }
  // if (filters.city) {
  //   query += ` AND city = $${filterIndex}`;
  //   values.push(filters.city);
  //   filterIndex++;
  // }
  // if (filters.state) {
  //   query += ` AND state = $${filterIndex}`;
  //   values.push(filters.state);
  //   filterIndex++;
  // }
  // if (filters.country) {
  //   query += ` AND country = $${filterIndex}`;
  //   values.push(filters.country);
  //   filterIndex++;
  // }
  if (filters.job_type) {
    query += ` AND job_type = $${filterIndex}`;
    values.push(filters.job_type);
    filterIndex++;
  }
  if (filters.is_remote !== undefined && filters.is_remote !== false) {
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
  // if (filters.is_sponsor !== undefined) {
  //   query += ` AND is_sponsor = $${filterIndex}`;
  //   values.push(filters.is_sponsor);
  //   filterIndex++;
  // }

  query += `
    ORDER BY distance
    LIMIT 50
  `;

  console.log("Query is ", query);
  const result: QueryResult<IJob & { distance: number }> = await pool.query(
    query,
    values
  );
  return result.rows;
}


export async function getAppliedJobs(userIds: string): Promise<IJob[]> {
  const userId: string = userIds;
  console.log("Indsie get applied jobs", userId);
  const query = `
    SELECT
      j.id,
      j.title,
      j.company,
      j.job_url,
      j.state,
      j.description,
      j.job_type,
      j.salary_interval,
      j.min_amount,
      j.max_amount,
      j.currency,
      j.salary_source,
      j.is_sponsor,
      j.date_posted,
      j.emails,
      j.is_remote,
      j.job_level,
      j.company_description,
      j.state,
      j.logo_photo_url,
      ja.applieddate as applieddate
    FROM users u
    JOIN LATERAL (
      SELECT
        job_application->>'jobId' AS jobId,
        job_application->>'appliedDate' AS appliedDate
      FROM jsonb_array_elements(u.jobs_applied) AS job_application
    ) ja ON true
    JOIN jobs j ON j.id = ja.jobId
    WHERE u.clerk_user_id = $1;  -- Filter by the userId
  `;

  const result = await pool.query(query, [userId]);
  // if (result.rowCount === 0) {
  //   return [];
  // }
  return result.rows.map(row => ({
    id: row.id,
    job_id: row.id,
    title: row.title,
    company: row.company,
    job_url: row.job_url,
    state: row.state,
    description: row.description,
    job_type: row.job_type,
    salary_interval: row.salary_interval,
    min_amount: row.min_amount,
    max_amount: row.max_amount,
    currency: row.currency,
    salary_source: row.salary_source,
    is_sponsor: row.is_sponsor,
    date_posted: row.date_posted,
    emails: row.emails,
    is_remote: row.is_remote,
    job_level: row.job_level,
    company_description: row.company_description,
    logo_photo_url: row.logo_photo_url,
    applieddate: row.applieddate,
  }));
}