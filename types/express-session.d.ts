// import 'express-session';

// declare module 'express-session' {
//   // interface Session {
//   //   user?: any;
//   //   authenticated?: boolean;
//   // }
//   interface SessionData {
//     user?: any;
//     authenticated?: boolean;
//   }
// }

import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user: {
      customer_id: number;
      username: string;
      email: string;
    };

    authenticated: boolean;
  }
}
