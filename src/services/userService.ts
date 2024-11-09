// src/services/userService.ts
import dotenv from "dotenv";
dotenv.config();
import pool from "../utils/RDSConnection";
import { IUser } from "../models/User";
import { generateEmbedding } from "./vectorService";
import { QueryResult } from "pg";
import pgvector from "pgvector";
import { createClerkClient } from "@clerk/clerk-sdk-node";
// incase user users email instead of clerk use the below imports
// import { IUserRegistration } from '../models/UserRegistration';
// import bcrypt from 'bcrypt';

const clerkAPIKey = process.env.CLERK_API_KEY;
const clerkClient = createClerkClient({ secretKey: clerkAPIKey });

export async function getUserProfile(userId: string): Promise<IUser | null> {
  const query = "SELECT * FROM users WHERE clerk_user_id = $1";
  const values = [userId];

  const result: QueryResult<IUser> = await pool.query(query, values);
  return result.rows[0] || null;
}

// Function to fetch user data directly from Clerk's user management system
export async function getClerkUser(clerkUserId: string) {
  try {
    const user = await clerkClient.users.getUser(clerkUserId);
    return user;
  } catch (error) {
    console.error("Error fetching Clerk user:", error);
    throw new Error("Failed to fetch user from Clerk");
  }
}
// export async function createUser(userData: IUser): Promise<IUser> {
//   const { email, password_hash, name, resume_text, resume_vector } = userData;

//   const query = `
//     INSERT INTO users (email, password_hash, name, resume_text, resume_vector)
//     VALUES ($1, $2, $3, $4, $5)
//     RETURNING *;
//   `;
//   const values = [email, password_hash, name, resume_text, resume_vector];

//   const result: QueryResult<IUser> = await pool.query(query, values);
//   return result.rows[0];
// }

// export async function registerUser(userData: IUserRegistration): Promise<IUser> {
//   const { email, password, name, resume_text } = userData;

//   // Hash the password
//   const saltRounds = 10;
//   const password_hash = await bcrypt.hash(password, saltRounds);

//   // Generate resume vector
//   let resume_vector: string | undefined;
//   if (resume_text) {
//     try {
//       const embedding = await generateEmbedding(resume_text);
//       // Use pgvector.toSql to serialize the embedding
//       resume_vector = pgvector.toSql(embedding);
//     } catch (error) {
//       console.error('Error generating resume embedding:', error);
//       throw new Error('Failed to generate resume embedding.');
//     }
//   }

//   // Create user
//   const newUser = await createUser({
//     email,
//     password_hash,
//     name,
//     resume_text,
//     resume_vector,
//   });

//   return newUser;
// }

// export async function authenticateUser(email: string, password: string): Promise<IUser | null> {
//   const user = await getUserByEmail(email);
//   if (user && await bcrypt.compare(password, user.password_hash)) {
//     return user;
//   }
//   return null;
// }

// // Additional methods can be added as needed

// export async function getUserByEmail(email: string): Promise<IUser | null> {
//   const query = 'SELECT * FROM users WHERE email = $1';
//   const values = [email];

//   const result: QueryResult<IUser> = await pool.query(query, values);
//   return result.rows[0] || null;
// }

// export async function createUserWithResume(userId: string, resume_text: string): Promise<IUser> {

//   // Generate resume vector
//   let resume_vector: string | undefined;
//   if (resume_text) {
//     try {
//       const embedding = await generateEmbedding(resume_text);
//       resume_vector = pgvector.toSql(embedding);
//     } catch (error) {
//       console.error('Error generating resume embedding:', error);
//       throw new Error('Failed to generate resume embedding.');
//     }
//   }

//   const query = `
//     INSERT INTO users (clerk_user_id, resume_text, resume_vector)
//     VALUES ($1, $2, $3)
//     RETURNING *;
//   `;
//   const values = [userId, resume_text, resume_vector];

//   const result: QueryResult<IUser> = await pool.query(query, values);
//   return result.rows[0];
// }

// export async function updateUserResume(userId: string, newResume: string): Promise<void> {
//   try {
//     // Generate the embedding for the new resume
//     const newEmbedding = await generateEmbedding(newResume);
//     const serializedEmbedding = pgvector.toSql(newEmbedding);

//     // Update the user's resume vector in the database
//     const query = `
//       UPDATE users
//       SET resume_vector = $1
//       WHERE clerk_user_id = $2;
//     `;
//     const values = [serializedEmbedding, userId];

//     const result = await pool.query(query, values);

//     if (result.rowCount === 0) {
//       throw new Error(`User with ID ${userId} not found.`);
//     }

//     console.log(`User ${userId}'s resume vector updated successfully.`);
//   } catch (error: any) {
//     console.error('Error updating user resume:', error);
//     throw error;
//   }
// }
