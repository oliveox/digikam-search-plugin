import { InternalDB } from './adapters/dbConnections'
import { getVisualObjectsSearchConditions } from './adapters/internal/file'
import { exportObjectsToDigiKam, importDigiKamFilesService } from './services/digikam'

const test_postgresInit = async () => {
	try {
		await InternalDB.authenticate()
		console.log('DB connection ON')

		await InternalDB.sync()
		console.log('Synchronized model with DB')
	} catch (err) {
		console.error(`Can't conenct to DB: ${err}`)
	}
}

async function test_importDigiKam() {
    const results = await importDigiKamFilesService()
    console.log(results)
}

const play = () => {
	return
}

(async() => {
	try {
		await exportObjectsToDigiKam()
        // const fileIds = await getVisualObjectsSearchConditions(['kite', 'bird'])
		// console.log(typeof play)
		// await test_postgresInit();
		// await test_importDigiKam();
		// await analyseInternalDBFiles();

        console.log()
	} catch (err) {
		console.error(err)
	}
})()