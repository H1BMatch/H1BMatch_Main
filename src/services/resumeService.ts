import dotenv from "dotenv";
dotenv.config();
import pool from "../utils/RDSConnection";

export const getResumeByClerkId = async (id: string) => {
  try {
    const query = `SELECT resume_text, resume_vector 
                    FROM users
                    WHERE clerk_user_id = $1`;
    const result = await pool.query(query, [id]);
    const resume = result.rows[0];
    return resume;
  } catch (error) {
      throw new Error(`Error fetching resume with ID ${id}: ${error}`);
  }
};

export const updateResume = async (id: string, resumeData: any) => {
  try {
    const { resume, vectorizedText } = resumeData;
    const formattedVector = `[${vectorizedText.join(', ')}]`;

    const query = `UPDATE users 
                    SET resume_text = COALESCE($1::text, resume_text), 
                        resume_vector = COALESCE($2::vector, resume_vector), 
                        updated_at = NOW() 
                    WHERE clerk_user_id = $3 
                    RETURNING *`;
    const result = await pool.query(query, [resume, formattedVector, id]);
    const updatedResume = result.rows[0];
    return updatedResume;
  } catch (error) {
    throw new Error(`Error updating resume with ID ${id}: ${error}`);
  }
};
