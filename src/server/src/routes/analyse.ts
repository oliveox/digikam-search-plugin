import express from 'express';
import { analyseFiles } from '../controllers/analyse';

const router = express.Router();

router.get('/', analyseFiles);

export default router;