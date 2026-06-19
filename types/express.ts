import 'express';

declare module 'express' {
  interface Request {
    user?: any;
    accountId?: any;
    email?: any;
    session?: any;
  }
}
