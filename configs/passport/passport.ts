import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import db from '../../db/db';

import redisClient from '../redis/redis';
import { CustomerType } from '../../controllers/customerController';

const passportLocalStrategy = (passport: any) => {
  passport.use(
    new LocalStrategy(
      { usernameField: 'email', passwordField: 'password' },
      async (email, password, done) => {
        try {
          if (!email || !password) {
            return done(null, false, { message: 'Invalid entries' });
          }
          const cachedCustomer = await redisClient.get(`customer:${email}`);
          if (cachedCustomer) {
            console.log('Customer is still active');
            return done(null, JSON.parse(cachedCustomer));
          } else {
            const customer = (await db('customer').where('email', email).first()) as CustomerType;
            if (!customer) {
              return done(null, false, { message: 'Customer does not exist' });
            }
            const isCorrectPassword = await bcrypt.compare(password, customer.password as any);
            if (!isCorrectPassword) {
              return done(null, false, { message: 'Wrong password' });
            }
            return done(null, customer);
          }
        } catch (err) {
          console.error(err instanceof Error ? err.message : err);
          return done(err, false);
        }
      }
    )
  );
  passport.serializeUser((customer: any, done: any) => {
    done(null, customer);
  });

  passport.deserializeUser(async (customer: any, done: any) => {
    try {
      done(null, customer);
    } catch (err) {
      console.log('LOGIN ERROR', err);
      done(err);
    }
  });
};

export { passportLocalStrategy };
