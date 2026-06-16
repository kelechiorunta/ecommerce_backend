import { Request, Response } from 'express';
import db from '../db/db';

const fetchAllProducers = async (_req: Request, res: Response) => {
  try {
    const producers = await db.select('*').from('producer');
    console.table(producers);
    res.status(200).json(producers);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : error });
  }
};

export { fetchAllProducers };
