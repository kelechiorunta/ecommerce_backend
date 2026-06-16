import { Router } from 'express';
import { fetchAllProducts, uploadImagesFromCloudinary } from '../controllers/productsController';

const productRouter = Router();

productRouter.get('/', fetchAllProducts);
productRouter.get('/images', uploadImagesFromCloudinary);

export default productRouter;
