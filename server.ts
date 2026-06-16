import app from "./app";
import { createServer } from "http";
import { createConnection } from "./db/db";

const server = createServer(app);

createConnection()

server.listen(3980, () => {console.log('Server is listening on PORT 3980')})

