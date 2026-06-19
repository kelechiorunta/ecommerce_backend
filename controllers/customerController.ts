import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import db from '../db/db';

export type CustomerType = {
  username?: string;
  password?: string;
  email?: string;
};

export const signup = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(404).json({ error: 'Incomplete entries' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const customers = await db('customer')
      .insert({ username: username, password: hashedPassword, email: email })
      .returning('*');

    return res.status(201).json({ data: customers, message: 'Customer saved successfully' });
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
