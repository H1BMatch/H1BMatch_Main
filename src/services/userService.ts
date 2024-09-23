// src/services/userService.ts

import pool from '../utils/RDSConnection';
import { IUser } from '../models/User';
import { IUserRegistration } from '../models/UserRegistration';
import bcrypt from 'bcrypt';
import { generateEmbedding } from './vectorService';
import { QueryResult } from 'pg';
import pgvector from 'pgvector';

export async function createUser(userData: IUser): Promise<IUser> {
  const { email, password_hash, name, resume_text, resume_vector } = userData;

  const query = `
    INSERT INTO users (email, password_hash, name, resume_text, resume_vector)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [email, password_hash, name, resume_text, resume_vector];

  const result: QueryResult<IUser> = await pool.query(query, values);
  return result.rows[0];
}

export async function registerUser(userData: IUserRegistration): Promise<IUser> {
  const { email, password, name, resume_text } = userData;

  // Hash the password
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // Generate resume vector
  let resume_vector: string | undefined;
  if (resume_text) {
    try {
      const embedding = await generateEmbedding(resume_text);
      // Use pgvector.toSql to serialize the embedding
      resume_vector = pgvector.toSql(embedding);
    } catch (error) {
      console.error('Error generating resume embedding:', error);
      throw new Error('Failed to generate resume embedding.');
    }
  }

  // Create user
  const newUser = await createUser({
    email,
    password_hash,
    name,
    resume_text,
    resume_vector,
  });

  return newUser;
}

export async function authenticateUser(email: string, password: string): Promise<IUser | null> {
  const user = await getUserByEmail(email);
  if (user && await bcrypt.compare(password, user.password_hash)) {
    return user;
  }
  return null;
}

// Additional methods can be added as needed


export async function getUserByEmail(email: string): Promise<IUser | null> {
  const query = 'SELECT * FROM users WHERE email = $1';
  const values = [email];

  const result: QueryResult<IUser> = await pool.query(query, values);
  return result.rows[0] || null;
}
