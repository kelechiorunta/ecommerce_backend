import { Router } from 'express';
import { fetchAllCategories } from '../controllers/categoryController';

const categoryRouter = Router();

categoryRouter.get('/', fetchAllCategories);

export default categoryRouter;
