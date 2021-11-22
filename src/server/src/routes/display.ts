import bodyParser from 'body-parser'
import express from 'express'
import displayInFileExplorer from '../controllers/display'

const router = express.Router()

router.post('/', bodyParser.text({ type: '*/*' }), displayInFileExplorer)

export default router
