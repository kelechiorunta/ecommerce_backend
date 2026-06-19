import { Router } from 'express';
import { signin, signup } from '../controllers/customerController';

const customerRouter = Router();

customerRouter.post('/signup', signup);
customerRouter.post('/signin', signin);

export default customerRouter;
