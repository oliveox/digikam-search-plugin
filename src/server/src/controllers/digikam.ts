import { Request, Response } from 'express'
import logger from '../config/winston'
import { exportObjectsToDigiKamService, importDigiKamDatabaseService } from '../services/digikam'

export async function importDigiKamFiles (req: Request, res: Response):Promise<void> {
	try {
		logger.info('Importing digiKam files ... ')

		await importDigiKamDatabaseService()

		const message = 'DigiKam files successfully imported'
		logger.info(message)
		res.send(message)
	} catch (err) {
		logger.error(`${err}`)
		res.status(500).send('Woops, there is an error')
	}
}

export async function exportObjectsToDigiKam (req: Request, res: Response): Promise<void> {
	try {
		logger.info('Exporting detected objects to digiKam .., ')

		await exportObjectsToDigiKamService()

		const message = 'Successfully exported detected objects to digiKam'
		logger.info(message)
		res.send(message)
	} catch (err) {
		logger.error(`${err}`)
		res.status(500).send('Woops, there is an error')
	}
}
