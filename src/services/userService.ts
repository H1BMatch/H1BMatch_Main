
import dotenv from "dotenv";
dotenv.config();
import pool from "../utils/RDSConnection";
import { IUser } from "../models/user";
import { QueryResult } from "pg";
import { createClerkClient } from "@clerk/clerk-sdk-node";
import { createHash } from 'crypto';


const clerkAPIKey = process.env.CLERK_API_KEY;
const clerkClient = createClerkClient({ secretKey: clerkAPIKey });


export const getClerkId = async (id: string) => {
  try {
    const clerkUser = await clerkClient.users.getUser(id);
    if (!clerkUser) {
      throw new Error(`User with ID ${id} not found in Clerk`);
    }

    const name = clerkUser.firstName + " " + (clerkUser.lastName || "");
    const email = clerkUser.emailAddresses[0]?.emailAddress || "";

    const userExists  = await doesUserExist(id);
    let user;
    if (!userExists ) {
      user = await createUser(id, name, email);
    }
    
    return {
      name,
      email,
      resume_text: user?.resume_text || null,
      resume_vector: user?.resume_vector || null
    };
  } catch (error) {
    throw new Error(`Error fetching user with ID ${id}: ${error}`);
  }
};


async function doesUserExist (id: string) {
  try {
    const query = `SELECT EXISTS(SELECT 1 FROM users WHERE clerk_user_id = $1) AS user_exists`;
    const result = await pool.query(query, [id]);
    const user = result.rows[0];
    return user.user_exists;
  } catch (error) {
    throw new Error(`Error check for user: ${error}`);
  }
};

async function createUser (id: string, name: string, email: string) {
  try {
    const query = `INSERT INTO users (user_id, clerk_user_id, email, name, password_hash, created_at) 
                    VALUES ($1, $2, $3, $4, $5, NOW()) 
                    RETURNING *`;
    const result: QueryResult<IUser> = await pool.query(query, [
      await newId(),
      id,
      email,
      name,
      generateHash(id),
    ]);
    const newUser = result.rows[0];
    return newUser;
  } catch (error) {
    throw new Error(`Error creating user: ${error}`);
  }
};

// This function fetches a user's profile from the database using their Clerk user ID
export async function getUserProfile(userId: string): Promise<IUser | null> {
  // Fetch user information by Clerk user ID from the database
  const query = 'SELECT * FROM users WHERE clerk_user_id = $1';
  const values = [userId];

  const result: QueryResult<IUser> = await pool.query(query, values);
  return result.rows[0] || null;
}

function generateHash(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

// update the profile picture URL for a user in the database
export async function updateUserProfilePictureUrl(userId: string, profilePictureUrl: string): Promise<void> {
  // Update the user's profile picture URL in the database. This query 
  // updates the profile_picture_url field for the user with the given Clerk user ID.
  const query = `
    UPDATE users
    SET profile_picture_link = $1
    WHERE clerk_user_id = $2;
  `;
  const values = [profilePictureUrl, userId]; 
  const result = await pool.query(query, values);
  if (result.rowCount === 0) {
    throw new Error(`User with ID ${userId} not found.`);
  }
  console.log(`User ${userId}'s profile picture URL updated successfully.`);
}


async function newId() {
  try {
    const query = "SELECT COUNT(*) AS total_entries FROM users;";
    const res = await pool.query(query)
    return Number(res.rows[0].total_entries) + 1
  } catch (error) {
    throw new Error(`Error getting next id from database: ${error}`);
  }
}