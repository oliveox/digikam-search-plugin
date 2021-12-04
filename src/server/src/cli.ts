import { Command } from 'commander'
import { ValidationError } from 'sequelize'
import { InternalDB } from './adapters/dbConnections'
import logger from './config/winston'
import { analyseInternalDBFiles } from './services/analyse'
import { exportObjectsToDigiKamService, importDigiKamDatabaseService } from './services/digikam'

async function main () {
	const program = new Command()

	program
		.option('-i, --import', 'import digikam database')
		.option('-a, --analyse', 'analyse digikam files')
		.option('-e, --export', 'export detected objects to digikam')

	program.parse(process.argv)

	const options = program.opts()

	try {
		await InternalDB.authenticate()
		logger.debug('Internal DB connection ON')

		await InternalDB.sync()
		logger.debug('Synchronized model with Internal DB')
	} catch (e) {
		logger.error(`Error while initialising internal database: [${e}]`)
		return
	}

	try {
		// import digikam files
		if (options.import) {
			logger.info('Importing digikam database ...')
			try {
				await importDigiKamDatabaseService()
			} catch (e) {
				if (!(e instanceof ValidationError)) return
			}
		}

		// analyse digikam files
		if (options.analyse) {
			logger.info('Analysing internal db files ...')
			await analyseInternalDBFiles()
		}

		// export objects to digikam
		if (options.export) {
			logger.info('Exporting objects to digikam ...')
			await exportObjectsToDigiKamService()
		}
	} catch (e) {
		logger.error(`Error: ${e}`)
	}
}

(async () => {
	await main()
})()
