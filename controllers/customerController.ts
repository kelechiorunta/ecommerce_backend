import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import db from '../db/db';
import redisClient from '../configs/redis/redis';
import passport from 'passport';

export type CustomerType = {
  customer_id?: number;
  username?: string;
  password?: string;
  email?: string;
  phone?: string;
  address?: string;
};

export const signup = async (req: any, res: Response) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(404).json({ error: 'Incomplete entries' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.transaction(async (trx) => {
      // Second create edit_history (2nd timeline/savePoint)
      const [history] = await trx('auth_history')
        .insert({
          status: 'PENDING',
          report: 'Signup in progress'
        })
        .returning('*');

      try {
        await trx.transaction(async (sp) => {
          // First Create Customer (1st Timeline/SavePoint)
          const [customer] = await sp('customer')
            .insert({ username: username, password: hashedPassword, email: email })
            .returning('*');

          const cachedKey = `customer:${email}`;

          const newCustomer = {
            customer_id: customer.customer_id,
            username: username,
            email: email
          };
          await redisClient.setEx(cachedKey, 60 * 60, JSON.stringify(newCustomer));

          // Close the Pending Transaction
          await sp('auth_history')
            .where({ auth_history_id: history.auth_history_id })
            .update({
              customer_id: customer.customer_id,
              status: 'COMPLETED',
              report: `${customer.username} has signed up successfully`
            });

          req.login(newCustomer, async (err: any) => {
            if (err) {
              return res.status(500).json({
                error: err instanceof Error ? err.message : err || 'Auto-login failed after signup'
              });
            }

            req.session.user = newCustomer;
            req.session.authenticated = true;

            return res.status(201).json({
              data: newCustomer,
              message: `${customer.username} has been registered successfully`
            });
          });
        });
      } catch (error) {
        await trx('auth_history')
          .where({ auth_history_id: history.auth_history_id })
          .update({
            status: 'FAILED',
            report: `${username} failed to sign up successfully. ${error instanceof Error ? error.message : error}`
          });
        res.status(400).json({ error: error instanceof Error ? error.message : error });
      }
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
      failureRedirect: 'http://localhost:5174/login',
      failureMessage: true
    },
    async (err: any, user: any, info: any) => {
      if (err || !user) {
        return res.status(401).json({
          error:
            err instanceof Error
              ? (err.message ?? err.cause ?? err.name)
              : info?.message || 'Unauthorized'
        });
      }

      req.logIn(user, async (err: any) => {
        if (err) {
          return res
            .status(500)
            .json({ error: err instanceof Error ? err.message : err || 'Login error' });
        }
        try {
          // Store minimal safe user data
          const sessionCustomer = {
            customer_id: user.customer_id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            address: user.address
          };

          req.session.user = sessionCustomer;
          req.session.authenticated = true;
          req.user = sessionCustomer;

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

export const grantAccess = (req: Request, res: Response) => {
  try {
    res.json({ user: req.user });
    // res.sendStatus(200, 'application/json', { user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'No authenticated user!' });
  }
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
      if (process.env.NODE_ENV === 'development') {
        res.redirect('/login');
        return next(err);
      }
      res.redirect('/login');
    }
    // await req.session.destroy();
    // res.clearCookie('remember_me');
    console.log('Logged out successfully');
    res.redirect('/login');
  });
};

export const editCustomer = async (req: any, res: any) => {
  try {
    const customerId = req.params._id;
    const { username, email, password, confirmPassword, phone, address } = req.body;
    if (!customerId) {
      return res.status(400).json({ error: 'Missing customer id!' });
    }
    if (!username || !email || !password || !confirmPassword || !phone || !address) {
      return res.status(400).json({ error: 'Incomplete entries' });
    }

    const customer = await db('customer').where({ customer_id: customerId }).first();
    if (!customer) {
      return res.status(404).json({ error: 'Customer does not exist' });
    }
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ error: 'Passwords are not correct. Please confirm passwords.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.transaction(async (trx) => {
      const [history] = await trx('edit_history')
        .insert({
          customer_id: customerId,
          status: 'PENDING',
          report: 'History Update in Progress'
        })
        .returning('*');

      try {
        // Use Transaction SavePoint to track the update timeline of the customer's update
        await trx.transaction(async (sp) => {
          const [updatedCustomer] = await sp('customer').where({ customer_id: customerId }).update(
            {
              username,
              password: hashedPassword,
              email,
              phone,
              address
            },
            '*'
          );

          // At this stage, the customer's update timeline has moved to an update of the edit_history table
          await sp('edit_history')
            .where({ edit_history_id: history.edit_history_id })
            .update({
              status: 'SUCCESS',
              report: `${updatedCustomer.username} just updated profile in history`
            });

          // Redis cache key
          const cacheKey = `customer:${updatedCustomer.email}`;
          const cachedUser = await redisClient.get(cacheKey);
          if (cachedUser) {
            await redisClient.setEx(
              cacheKey,
              60 * 60,
              JSON.stringify({ customer_id: customerId, username, email, phone, address })
            );
          }

          return res.status(200).json(updatedCustomer);
        });
      } catch (error) {
        await trx('edit_history')
          .where({ edit_history_id: history.edit_history_id })
          .update({
            customer_id: customerId,
            status: 'FAILED',
            report: `${username} failed to update profile in history`
          });
        res.status(400).json({
          error:
            'Failed command. SavePoint failed at history update. Implemented Rollback to user update only.'
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : error });
  }
};

export const fetchUserDetails = async (req: any, res: any) => {
  try {
    const id = req.params.id;
    const limit = req.query.limit ?? 9;
    const cursor = req.query.cursor ?? undefined;

    console.table({ id, limit, cursor });

    await db.transaction(async (trx) => {
      // Create auth_history of fetching user's order details (2nd timeline/savePoint)
      const [history] = await trx('auth_history')
        .insert({
          status: 'PENDING',
          report: `Authorized Fetching of Order Details for Customer with id: ${id} in progress`
        })
        .returning('*');

      try {
        await trx.transaction(async (sp) => {
          // Confirm customer
          const customer = await sp('customer').where({ customer_id: id }).first();
          if (!customer) {
            return res.status(404).json({ error: 'Customer does not exist' });
          }

          // Proceed to join tables based on valid customer's id
          // Without cursor

          // const details_rows = sp
          //   .select(
          //     'customer.username AS name',
          //     'details_history.customer_id AS userId',
          //     'details_history.details_history_id AS id',
          //     'details_history.email AS email',
          //     'details_history.status AS status',
          //     'details_history.report AS report'
          //   )
          //   .from('details_history')
          //   .where('details_history.customer_id', customer.customer_id)
          //   .join('customer', 'details_history.customer_id', '=', 'customer.customer_id')
          //   .orderBy('details_history.details_history_id', 'asc')
          //   .limit(10);

          const details_rows = sp
            .select(
              'customer.username AS name',
              'details_history.customer_id AS userId',
              'details_history.details_history_id AS id',
              'details_history.email AS email',
              'details_history.status AS status',
              'details_history.report AS report'
            )
            .from('details_history')
            .join('customer', 'details_history.customer_id', '=', 'customer.customer_id')
            .where('details_history.customer_id', customer.customer_id)
            .orderBy('details_history.details_history_id', 'asc')
            .limit(limit + 1);

          // With cursor
          if (cursor !== 'undefined' || !isNaN(cursor)) {
            details_rows
              .where('details_history.details_history_id', '>', cursor)
              .orderBy('details_history.created_at', 'asc')
              .orderBy('details_history.details_history_id', 'asc');
          }

          const details = await details_rows;

          const data = details.slice(0, limit);
          const hasNextPage = details.length > limit;
          const nextCursor = hasNextPage ? data[data.length - 1].id : null;
          const dataCount = details.length;

          // Close the Pending Transaction
          await sp('auth_history')
            .where({ auth_history_id: history.auth_history_id })
            .update({
              customer_id: customer.customer_id,
              status: 'SUCCESS',
              report: `Order details for ${customer.username} has been successfully fetched.`
            });

          console.table(details);
          res.status(200).json({ paginatedData: data, hasNextPage, nextCursor, dataCount });
        });
      } catch (error) {
        await trx('auth_history')
          .where({ auth_history_id: history.auth_history_id })
          .update({
            status: 'FAILED',
            report: `There was a failed attempt to fetch the order details of customer with id: ${id}. ${error instanceof Error ? error.message : error}`
          });
        res.status(400).json({ error: error instanceof Error ? error.message : error });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : error });
  }
};

export const createDeliveryDetails = async (req: any, res: any) => {
  try {
    const { id, fullName, email, firstAddress, secondAddress, city, postalCode, country } =
      req.body;

    if (!id) {
      return res.status(401).json({ error: 'Missing authenticated customer id. Unauthorized' });
    }

    if (
      !fullName ||
      !email ||
      !firstAddress ||
      !secondAddress ||
      !city ||
      !postalCode ||
      !country
    ) {
      return res.status(400).json({ error: 'Incomplete details credentials. Incomplete payload.' });
    }

    const customer = await db('customer').where({ customer_id: id }).first();
    if (!customer) {
      return res.status(404).json({ error: 'Customer does not exist' });
    }
    if (customer.email !== email) {
      return res
        .status(403)
        .json({ error: 'Email address must belong to customer. Not Permitted to use email' });
    }

    await db.transaction(async (trx) => {
      const [detail_history] = await trx('details_history')
        .insert({
          customer_id: id,
          email: email,
          status: 'PENDING',
          report: 'Detail History Update in Progress'
        })
        .returning('*');

      try {
        await trx.transaction(async (sp) => {
          const [delivery_details] = await sp('customer_delivery_details')
            .insert({
              full_name: fullName,
              email,
              first_address: firstAddress,
              second_address: secondAddress,
              city,
              postal_code: postalCode,
              country
            })
            .returning('*');

          if (!delivery_details) {
            return res.status(403).json({ error: 'No delivery details allowed to save.' });
          }

          // Close the Pending Transaction
          await sp('details_history')
            .where({ details_history_id: detail_history.details_history_id })
            .update({
              customer_id: customer.customer_id,
              status: 'SUCCESS',
              report: `${delivery_details.full_name} has sent details of delivery successfully using valid email ${delivery_details.email}`
            });

          return res.status(201).json({
            message: 'Details delivery saved successfully',
            details: delivery_details
          });
        });
      } catch (error) {
        // Close the Pending Transaction
        const cause = error instanceof Error ? error.cause : error;
        await trx('details_history')
          .where({ details_history_id: detail_history.details_history_id })
          .update({
            customer_id: customer.customer_id,
            status: 'FAILED',
            report: `${fullName} failed to send details of delivery successfully due to ${cause}.`
          });
        res.status(400).json({
          error:
            error instanceof Error
              ? `Transaction SavePoint Command failed at detail_history creation. Error: ${error.message}`
              : error
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : error });
  }
};
