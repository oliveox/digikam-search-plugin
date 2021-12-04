import express from 'express'
import { InternalDB } from './adapters/dbConnections.js'
import { config } from './config/config'
import logger from './config/winston.js'
import analyseRouter from './routes/analyse'
import displayRouter from './routes/display'
import indexRouter from './routes/index'
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

app.use('/', indexRouter)
app.use('/analyse', analyseRouter)
app.use('/display', displayRouter)

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
