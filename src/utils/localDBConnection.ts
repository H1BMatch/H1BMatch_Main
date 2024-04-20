import dotenv from 'dotenv';
dotenv.config();
import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    // Add SSL configuration here if needed
});

console.log("Attempting to connect to the database...");

pool.on('connect', () => {
    console.log('Connected to the database');
});

pool.on('error', (err: Error) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Test the connection and run a simple query
pool.connect((err, client, done) => {
    if (err) {
        console.error('Error acquiring client', err.stack);
        return; // Early return to avoid using an undefined client
    }

    if (client) {
        console.log('Database connection successful');
        client.query('SELECT NOW()', (queryErr, result) => {
            done(); // Always release the client back to the pool

            if (queryErr) {
                console.error('Error executing query', queryErr.stack);
            } else {
                console.log(result.rows);
            }
        });
    }
});
export default pool;