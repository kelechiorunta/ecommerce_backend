import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import db from '../db/db';
import redisClient from '../configs/redis/redis';
import passport from 'passport';

export type CustomerType = {
  username?: string;
  password?: string;
  email?: string;
};

export const signup = async (req: any, res: Response) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(404).json({ error: 'Incomplete entries' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const customers = await db('customer')
      .insert({ username: username, password: hashedPassword, email: email })
      .returning('*');
    const cachedKey = `customer:${email}`;

    const newCustomer = { _id: customers[0].customer_id, username: username, email: email };
    await redisClient.setEx(cachedKey, 60 * 60, JSON.stringify(newCustomer));

    req.login(newCustomer, async (err: any) => {
      if (err) {
        return res.status(500).json({
          error: err instanceof Error ? err.message : err || 'Auto-login failed after signup'
        });
      }

      req.session.user = newCustomer;
      req.session.authenticated = true;

      return res.status(201).json({ data: newCustomer, message: 'Customer saved successfully' });
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
};

export const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(404).json({ error: 'Incomplete entries' });
    }

    const customer = (await db('customer').where('email', email).first()) as CustomerType;

    if (!customer) {
      return res.status(400).json({ error: 'Customer does not exist' });
    }

    const isCorrectPassword = await bcrypt.compare(password as string, customer?.password as any);
    if (!isCorrectPassword) {
      return res.status(400).json({ error: 'Wrong password' });
    }

    return res.status(200).json({ data: customer, message: 'Customer signed in successfully' });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
};

export const passportLogin = async (req: any, res: Response, next: NextFunction) => {
  passport.authenticate(
    'local',
    {
      failureRedirect: '/login',
      failureMessage: true
    },
    async (err: any, user: any, info: any) => {
      if (err || !user) {
        return res.status(401).json({ error: info?.message || 'Unauthorized' });
      }

      req.logIn(user, async (err: any) => {
        if (err) {
          return res.status(500).json({ error: err || 'Login error' });
        }
        try {
          // Store minimal safe user data
          const sessionCustomer = {
            _id: user.customer_id,
            username: user.username,
            email: user.email
          };

          req.session.user = sessionCustomer;
          req.session.authenticated = true;

          // Redis cache key
          const cacheKey = `customer:${user.email}`;
          const cachedUser = await redisClient.get(cacheKey);
          if (!cachedUser) {
            await redisClient.setEx(cacheKey, 60 * 60, JSON.stringify(sessionCustomer));
          }

          return res.status(200).json({
            message: 'Login successful',
            user
          });
        } catch (error) {
          return res.status(500).json({
            error: error instanceof Error ? error.message : error
          });
        }
      });
    }
  )(req, res, next);
};

export const logout = async (req: any, res: Response, next: NextFunction) => {
  // console.log('user', req.user);
  // console.log('session', req.session.user);
  if (req.user) {
    console.log('del redis key', req.user.email);
    await redisClient.delEx(`customer:${req.user.email}`);
  }
  req.logout(async function (err: any) {
    if (err) {
      return next(err);
    }
    // await req.session.destroy();
    // res.clearCookie('remember_me');
    console.log('Logged out successfully');
    res.redirect('/login');
  });
};

export const grantAccess = (req: Request, res: Response) => {
  try {
    res.json({ user: req.user });
    // res.sendStatus(200, 'application/json', { user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'No authenticated user!' });
  }
};
