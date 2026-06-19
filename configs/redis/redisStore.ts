import { RedisStore } from 'connect-redis';
import redisClient from './redis';
import dotenv from 'dotenv';
import session from 'express-session';

dotenv.config();
redisClient.connect().catch((err) => console.log(err instanceof Error ? err.message : err));

export const store =
  process.env.NODE_ENV === 'test'
    ? new session.MemoryStore()
    : new RedisStore({ client: redisClient, ttl: 60 * 60 });

export const sessionOptions = {
  name: 'customer_session',
  store: new RedisStore({ client: redisClient, prefix: 'customer:', ttl: 60 * 60 }),
  resave: false,
  saveUninitialized: false,
  secret: process.env.SESSION_SECRET as string,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production',
    httpOnly: true
  }
};

export default session(sessionOptions);
