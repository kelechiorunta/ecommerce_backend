import { Request, Response } from 'express';
import db from '../db/db';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import redisClient from '../configs/redis/redis';

dotenv.config();

cloudinary.config({
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_SECRET as string,
  cloud_name: process.env.CLOUDINARY_CLOUDNAME as string
});

redisClient.connect().catch((err) => console.error(err instanceof Error ? err.message : err));

const fetchAllProducts = async (_req: Request, res: Response) => {
  try {
    const products = await db
      .select(
        'product_id',
        'products.name AS product_name',
        'category.name AS category_name',
        'producer.name AS producer_name',
        'description',
        'price',
        'rating',
        'image_url'
      )
      .from('products')
      .join('category', 'products.category_id', '=', 'category.category_id')
      .join('producer', 'products.producer_id', '=', 'producer.producer_id');
    console.table(products);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : error });
  }
};

const uploadImagesFromCloudinary = async (_req: Request, res: Response) => {
  try {
    const cachedImagesKey = 'images';

    const cachedImages = await redisClient.get(cachedImagesKey);

    if (cachedImages) {
      console.log('Fetch from cache');
      const images = JSON.parse(cachedImages);
      console.table(images.map((image: any) => image.secure_url));
      return res.json(images);
    }

    const product_images = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      max_results: 10
    });
    const transformed = product_images.resources.map((resource: any) => ({
      ...resource,
      transformedUrl: cloudinary.url(resource.public_id, {
        transformation: [
          {
            crop: 'thumb',
            width: 600,
            height: 600
          },
          {
            effect: 'gen_background_replace:prompt_Wallpaper with flowers on it'
          },
          {
            effect: 'enhance'
          },
          {
            quality: 'auto:best'
          },
          {
            fetch_format: 'auto'
          }
        ]
      })
    }));

    await redisClient.setEx(cachedImagesKey, 60 * 60, JSON.stringify(transformed));
    console.log('Saved to redis');
    console.table(transformed);
    res.json(transformed);
    // res.json(products);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    res.status(500).json({ error: error instanceof Error ? error.message : error });
  }
};

export { fetchAllProducts, uploadImagesFromCloudinary };
