import express from 'express';
import productRouter from './routes/productRoutes';
import categoryRouter from './routes/categoryRoutes';
import producerRouter from './routes/producerRoutes';

const app = express();

app.use('/api/products', productRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/producers', producerRouter);

export default app;
