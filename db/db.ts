import knex from "knex";
import { Knex } from "knex";
import dotenv from 'dotenv';
import KnexConfig from '../knexfile'

dotenv.config();

// Create a postgres db instance with the knexfile configuration
const db = knex(KnexConfig as Knex.Config);

// Create connection asynchronously
const createConnection = async (): Promise<boolean> => {
    try {
        await db.raw('SELECT 1')
        console.log("Database connection to docker connected successfully")
        return true
    } catch (error) {
        console.error(error instanceof Error? error.message: error)
        return false
    }
}

export { createConnection }

export default db;