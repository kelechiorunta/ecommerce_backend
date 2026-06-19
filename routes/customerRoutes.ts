import { Router } from 'express';
import passport from 'passport';

import { grantAccess, passportLogin, signin, signup } from '../controllers/customerController';
import { passportLocalStrategy } from '../configs/passport/passport';
import validateRedisSession from '../middleware/redisCacheMiddleware';

const customerRouter = Router();

passportLocalStrategy(passport);

customerRouter.post('/signup', signup);
customerRouter.post('/signin', passportLogin);
customerRouter.get('/isAuthenticated', validateRedisSession, grantAccess);

export default customerRouter;
