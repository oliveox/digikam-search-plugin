import express from 'express'
import { importAndAnalyseFiles } from '../controllers/analyse'

const router = express.Router()

router.get('/', importAndAnalyseFiles)

export default router
