import { Router } from 'express';
import { fetchAllProducers } from '../controllers/producerController';

const producerRouter = Router();

producerRouter.get('/', fetchAllProducers);

export default producerRouter;
