import dotenv from "dotenv";
dotenv.config();
import pool from "../utils/RDSConnection";
import { IUser } from "../models/User";
import { generateEmbedding } from "./vectorService";
import { QueryResult } from "pg";
import { createClerkClient } from "@clerk/clerk-sdk-node";
import { createHash } from 'crypto';

// Fetch resume by ID
export const getResumeByClerkId = async (clerkUserId: string) => {
  try {
    const query = `SELECT resume_text, resume_vector 
                    FROM users
                    WHERE clerk_user_id = $1`;
    const result = await pool.query(query, [clerkUserId]);
    const resume = result.rows[0];
    return resume;
  } catch (error) {
      throw new Error(`Error fetching resume with ID ${clerkUserId}: ${error}`);
  }
};

// Update an existing resume in the database
export const updateResume = async (clerkUserId: string, resumeData: any) => {
  try {
    const { resume, vectorizedText } = resumeData;
    const formattedVector = `[${vectorizedText.join(', ')}]`;

    const query = `UPDATE users 
                    SET resume_text = COALESCE($1::text, resume_text), 
                        resume_vector = COALESCE($2::vector, resume_vector), 
                        updated_at = NOW() 
                    WHERE clerk_user_id = $3 
                    RETURNING *`;
    const result = await pool.query(query, [resume, formattedVector, clerkUserId]);
    const updatedResume = result.rows[0];
    return updatedResume;
  } catch (error) {
    throw new Error(`Error updating resume with ID ${clerkUserId}: ${error}`);
  }
};
