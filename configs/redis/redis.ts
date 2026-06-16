// import Redis from 'ioredis';
import dotenv from 'dotenv';
import { createClient } from 'redis';

dotenv.config();

if (!process.env.REDIS_URL) {
  throw Error('No environmental key provided for Redis connection');
}
// const redisClient = new Redis(process.env.REDIS_URL);
const redisClient = createClient({ url: process.env.REDIS_URL });
// redisClient.connect();

// Check Redis connection
redisClient.on('connect', () => {
  console.log('Redis client connected successfully');
});
// Handle Error in connection
redisClient.on('error', (err) => console.error(err instanceof Error ? err.message : err));

export default redisClient;
