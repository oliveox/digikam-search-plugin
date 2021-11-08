import bodyParser from 'body-parser';
import express from 'express';
import display_filesystem from '../controllers/display';

const router = express.Router();

router.post('/', bodyParser.text({type: '*/*'}), display_filesystem);

export default router;