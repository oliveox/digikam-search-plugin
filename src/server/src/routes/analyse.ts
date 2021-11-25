import express from 'express'
import { analyseInternalDBFiles } from '../services/analyse'

const router = express.Router()

router.get('/', analyseInternalDBFiles)

export default router
