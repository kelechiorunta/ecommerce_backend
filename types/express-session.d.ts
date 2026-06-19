import 'express-session';

declare module 'express-session' {
  // interface Session {
  //   user?: any;
  //   authenticated?: boolean;
  // }
  interface SessionData {
    user?: any;
    authenticated?: boolean;
  }
}
