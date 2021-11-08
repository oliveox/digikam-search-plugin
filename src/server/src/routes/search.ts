import express from 'express';
import search_getmenu from '../controllers/search';

const router = express.Router();

router.get('/menu', search_getmenu);

export default router;