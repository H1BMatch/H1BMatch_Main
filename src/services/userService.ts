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

    return {
      id: clerkUser.id,
      name: clerkUser.firstName + " " + (clerkUser.lastName || ""),
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      createdAt: clerkUser.createdAt,
    };
  } catch (error) {
    throw new Error(`Error fetching user with ID ${id}: ${error}`);
  }
};

// Create a new user in the database
export const createUser = async (id: string) => {
  try {
    const query = `INSERT INTO users (user_id, clerk_user_id, email, name, password_hash, created_at) 
                    VALUES ($1, $2, $3, $4, $5, NOW()) 
                    RETURNING *`;
    const clerkInfo = await getClerkId(id)
    const result: QueryResult<IUser> = await pool.query(query, [
      await newId(),
      id,
      clerkInfo.email,
      clerkInfo.name,
      generateHash(clerkInfo.name),
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