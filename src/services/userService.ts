// src/services/userService.ts
import dotenv from "dotenv";
dotenv.config();
import pool from "../utils/RDSConnection";
import { IUser } from "../models/User";
import { QueryResult } from "pg";
import { createClerkClient } from "@clerk/clerk-sdk-node";
import { createHash } from 'crypto';
// incase user users email instead of clerk use the below imports
// import { IUserRegistration } from '../models/UserRegistration';
// import bcrypt from 'bcrypt';

const clerkAPIKey = process.env.CLERK_API_KEY;
const clerkClient = createClerkClient({ secretKey: clerkAPIKey });

// Fetch user by ID from Clerk
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

// Create a new user in the database
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

// Create a new user in the database
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

function generateHash(data: string): string {
  return createHash('sha256').update(data).digest('hex');
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