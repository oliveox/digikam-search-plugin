import { Request, Response } from 'express'
import { File, VisualObject } from '../adapters/dbConnections'
import getFilesBySearch from '../adapters/internal/file'
import logger from '../config/winston'
import FileUtilsService from '../services/fileUtils'
import { Model } from 'sequelize/types'
import MetadataAdapter from '../adapters/internal/metadata'
import { MetadataUtilsService } from '../services/metadataUtils'
import GeneralUtilsService from '../services/generalUtils'
import DigiKamAdapter from '../adapters/digikam/digikam'

export async function getAlldGalleryFiles (req: Request, res: Response): Promise<void> {
	try {
		let files = await File.findAll()

		// filter media paths and format response
		files = await FileUtilsService.getUISupportedFiles(files)

		res.json(files)
	} catch (err) {
		logger.error(`${err}`)
		res.status(500).send('Woops, there is an error!')
	}
}

export async function getSearchedGalleryFiles (req: Request, res: Response): Promise<void> {
	try {
		const searchData: {[key: string]: any} = JSON.parse(req.body)

		if (!searchData) {
			logger.warn('No search data received in request body')
			res.json([])
		}

		let filePaths: Array<Model<any, any>> =
											await getFilesBySearch(searchData)
		filePaths = await FileUtilsService.getUISupportedFiles(filePaths)
		res.json(filePaths)
	} catch (err) {
		logger.error(`${err}`)
		res.status(500).send(`Woops, there is an error: ${err}`)
	}
}

export async function getSearchMenu (
	req: Request, res: Response): Promise<void> {
	try {
		// get aggregated metadata json
		let metadata =
		await MetadataAdapter.getAllFileTypeMetadata() as {[key: string]: any}

		// make metadata keys user friendly
		metadata = MetadataUtilsService.makeMetadataUserFriendly(metadata)

		// get DigiKam categories tree
		const digiKamCategories = await DigiKamAdapter.getCategoriesTree()

		// get detected objects
		const visualObjectsQueryResult: Array<any> = await VisualObject.findAll({
			attributes: ['id', 'name'], raw: true
		})
		const visualObjects = GeneralUtilsService.jsonToCheckboxTreeStructure({
			objects: visualObjectsQueryResult.map(v => v.name)
		})

		// format response
		const response = {
			metadata: GeneralUtilsService.jsonToCheckboxTreeStructure(metadata),
			categories: GeneralUtilsService.jsonToCheckboxTreeStructure(
				digiKamCategories
			),
			visualObjects: visualObjects
		}

		// return response
		res.json(response)
	} catch (err) {
		logger.error(`${err}`)
		res.status(500).send('Woops, there is an error')
	}
}
