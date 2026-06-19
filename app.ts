import express from 'express';
import bodyParser from 'body-parser';

import productRouter from './routes/productRoutes';
import categoryRouter from './routes/categoryRoutes';
import producerRouter from './routes/producerRoutes';
import customerRouter from './routes/customerRoutes';

const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/products', productRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/producers', producerRouter);
app.use('/api/customers', customerRouter);

export default app;
