import bodyParser from 'body-parser'
import express from 'express'
import { getAlldGalleryFiles, getSearchedGalleryFiles, getSearchMenu }
	from '../controllers/home'

const router = express.Router()

router.get('/gallery', getAlldGalleryFiles)
router.get('/menu', getSearchMenu)
router.post(
	'/gallery',
	bodyParser.text({ type: '*/*' }),
	getSearchedGalleryFiles
)

export default router
