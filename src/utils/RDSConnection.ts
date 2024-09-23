import dotenv from 'dotenv';
dotenv.config();
import { QueryResult } from 'pg';
import { Pool, PoolClient } from 'pg';
import { registerType } from 'pgvector/pg';
import * as pg from 'pg';

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false // For development only; in production, provide the CA cert
    }
});

console.log("Attempting to connect to the database...");

pool.on('connect', async (client) => {
    try {
      await registerType(client);
      console.log('Registered vector type with client');
    } catch (err) {
      console.error('Error registering vector type:', err);
    }
  });

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.connect((err: Error | undefined, client: PoolClient | undefined, done: () => void) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    if (client) {
        console.log('Database connection successful');
        client.query('SELECT NOW()', (err: Error | undefined, result: QueryResult) => {
            done();
            if (err) {
                return console.error('Error executing query', err.stack);
            }
            console.log(result.rows);
        });
    }
});

export default pool;
 

