import { Router } from 'express';
import passport from 'passport';

import {
  grantAccess,
  logout,
  passportLogin,
  signin,
  signup
} from '../controllers/customerController';
import { passportLocalStrategy } from '../configs/passport/passport';
import validateRedisSession from '../middleware/redisCacheMiddleware';
import { checkAuthenticate } from '../middleware/isAuthenticatedMiddleware';

const customerRouter = Router();

passportLocalStrategy(passport);

customerRouter.post('/signup', signup);
customerRouter.post('/signin', passportLogin);
customerRouter.get('/logout', logout);
customerRouter.get('/isAuthenticated', checkAuthenticate, validateRedisSession, grantAccess);

export default customerRouter;
