import express from 'express'
import { InternalDB } from './adapters/dbConnections.js'
import { config } from './config/config'
import logger from './config/winston.js'
import { getAlldGalleryFiles, getSearchedGalleryFiles, getSearchMenu } from './controllers/home.js'
import bodyParser from 'body-parser'
import { analyseInternalDBFiles } from './services/analyse.js'
import displayInFileExplorer from './controllers/display.js'
import { exportObjectsToDigiKam, importDigiKamFiles } from './controllers/digikam.js'
const cors = require('cors')

const port = config.port || 3001

const app = express()
app.use(cors())

app.use((req, res, next) => {
	logger.debug('\n#####################')
	logger.debug('new request made')
	logger.debug(`host: ${req.hostname}`)
	logger.debug(`path: ${req.path}`)
	logger.debug(`method: ${req.method}`)
	logger.debug('#####################\n')

	next()
})

app.get('/gallery', getAlldGalleryFiles)
app.post('/gallery', bodyParser.text({ type: '*/*' }), getSearchedGalleryFiles)

app.get('/menu', getSearchMenu)

app.get('/analyse', analyseInternalDBFiles)
app.post('/display', bodyParser.text({ type: '*/*' }), displayInFileExplorer)

app.get('/digikam/import', importDigiKamFiles)
app.get('/digikam/exportObjects', exportObjectsToDigiKam)

// app.use('/', indexRouter)
// app.use('/analyse', analyseRouter)
// app.use('/display', displayRouter)
// app.use('/digikam', digikamRouter)

app.use((req, res) => {
	res.status(404).send('Woops, no such page here')
});

(async () => {
	try {
		await InternalDB.authenticate()
		logger.debug('Internal DB connection ON')

		await InternalDB.sync()
		logger.debug('Synchronized model with Internal DB')

		app.listen(port, () => {
			logger.info(`Server is up at: ${port}`)
		})
	} catch (err) {
		logger.info(`Can't conenct to Internal DB: ${err}`)
	}
})()
