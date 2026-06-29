import { Router } from 'express';
import {
  createProduct,
  fetchAllProducts,
  uploadImagesFromCloudinary
} from '../controllers/productsController';

const productRouter = Router();

productRouter.get('/', fetchAllProducts);
productRouter.post('/create', createProduct);
productRouter.get('/images', uploadImagesFromCloudinary);

export default productRouter;
