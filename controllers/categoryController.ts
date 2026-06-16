import { Request, Response } from 'express';
import db from '../db/db';

const fetchAllCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await db.select('*').from('category');
    console.table(categories);
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : error });
  }
};

export { fetchAllCategories };
