import bodyParser from 'body-parser';
import express from "express";
import gallery_controller from '../controllers/gallery';

const router = express.Router();

router.get('/', gallery_controller.gallery_index);
router.post('/search', bodyParser.text({type: '*/*'}), 
					   gallery_controller.gallery_search);

export default router;