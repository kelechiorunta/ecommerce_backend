import type { Request, Response, NextFunction } from 'express';

import redisClient from '../configs/redis/redis';

const validateRedisSession = async (req: any, res: Response, next: NextFunction) => {
  try {
    // Ensure session exists
    if (!req.session?.user?.email) {
      return res.status(401).json({
        error: 'No active session'
      });
    }

    const cacheKey = `customer:${req.session.user.email}`;

    console.log('CACHE KEY:', cacheKey);

    // Fetch from Redis
    const cachedUser = await redisClient.get(cacheKey);

    if (!cachedUser) {
      return res.status(404).json({
        error: 'No redis cache available'
      });
    }

    const parsedUser = JSON.parse(cachedUser);

    // Populate request
    // req.session.user = parsedUser;
    req.user = parsedUser;
    // console.log("req.user", req.user)
    next();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: 'Redis session validation failed'
    });
  }
};

export default validateRedisSession;
