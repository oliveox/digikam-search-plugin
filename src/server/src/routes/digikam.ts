import express from 'express'
import { exportObjectsToDigiKam, importDigiKamFiles } from '../controllers/digikam'

const router = express.Router()

router.get('/import', importDigiKamFiles)
router.get('/exportObjects', exportObjectsToDigiKam)

export default router
