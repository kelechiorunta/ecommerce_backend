import type { Request, Response, NextFunction } from 'express';

export const checkAuthenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Authenticated?', req.isAuthenticated());
    console.log('Session:', req.session);
    console.log('User:', req.user);

    // Check if user is authenticated with Passport
    if (!req.isAuthenticated() || !req.user) {
      console.log('FAILED MIDDLEWARE AUTHENTICATION');
      // This is the login route in the frontend
      return res.redirect('/login');
    }
    next();
  } catch (error) {
    next(error);
  }
};
