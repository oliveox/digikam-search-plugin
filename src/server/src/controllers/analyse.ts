import { Request, Response } from 'express'
import logger from '../config/winston'
import { analyseInternalDBFiles } from '../services/analyse'

export async function analyseFiles (
	req: Request, res: Response):Promise<void> {
	try {
		logger.info('Analysing imported files')
		await analyseInternalDBFiles()

		logger.info('Files successfully analysed')
		res.send('Files successfully analysed')
	} catch (err) {
		logger.error(`${err}`)
		res.status(500).send('Woops, there is an error')
	}
}
