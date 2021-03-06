import { File, VisualObject } from '../adapters/dbConnections'
import { saveAudio, saveImage, saveNotSupported, saveVideo, updateFileType } from '../adapters/internal/entities'
import logger from '../config/winston'
import { FileData, FManager, FormatedFile } from '../types/fManagerTypes'
import FileService from './fileService'
import GeneralUtilsService from './generalUtils'

const { Op } = require('sequelize')

export const analyseInternalDBFiles = async () => {
	const files: Array<any> = await File.findAll({ raw: true })
	const promises = files.map(async (f): Promise<FormatedFile> => {
		return {
			id: f.id,
			filePath: await GeneralUtilsService.getFullPathForFileModelObject(f),
			hash: f.hash,
			type: f.type
		}
	})
	const formatedFiles: Array<FormatedFile> = await Promise.all(promises)
	let fileData: FileData
	for (const formatedFile of formatedFiles) {
		const filePath = formatedFile.filePath
		const fileId = formatedFile.id
		try {
			fileData = await FileService.extractFileData(formatedFile)
			switch (fileData.type) {
			case FManager.FileType.IMAGE:
				await saveImage(fileId, fileData)
				break
			case FManager.FileType.VIDEO:
				await saveVideo(fileId, fileData)
				break
			case FManager.FileType.AUDIO:
				await saveAudio(fileId, fileData)
				break
			case FManager.FileType.NOT_SUPPORTED:
				await saveNotSupported(fileId, fileData)
				break
			default:
				logger.error(`[${filePath}] did not fit 
												any of the file types`)
			}
			updateFileType(fileId, fileData.type)
		} catch (err) {
			logger.error(`Error while extracting and 
							persisting file [${filePath}]: ${err}`)
		}
	}
}

export async function saveObjectsAndFetchIds (visualObjects: Array<string>): Promise<Map<string, number>> {
	const objectsNameIdMap = new Map<string, number>()
	if (visualObjects.length > 0) {
		const formatedVisualObjects = visualObjects.map(o => { return { name: o } })
		await VisualObject.bulkCreate(
			formatedVisualObjects,
			{ ignoreDuplicates: true }
		)
		const result = await VisualObject.findAll(
			{
				attributes: ['id', 'name'],
				where: {
					name: {
						[Op.or]: visualObjects
					}
				}
			}
		)

		result.map(r => objectsNameIdMap.set(String(r.get('name')), Number(r.get('id'))))
	}

	return objectsNameIdMap
}
