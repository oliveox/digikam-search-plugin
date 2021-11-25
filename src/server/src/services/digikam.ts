import path from 'path'
import { File, VisualObject } from '../adapters/dbConnections'
import DigiKamAdapter from '../adapters/digikam/digikam'
import FileUtilsService from './fileUtils'
import GeneralUtilsService from './generalUtils'
import { config } from '../config/config'
import logger from '../config/winston'

export async function importDigiKamFilesService () {
	const digiKamfiles: Array<any> = await DigiKamAdapter.getDigiKamFiles()
	const promises: Array<any> = digiKamfiles.map(async (f) => {
		const filePath = path.join(f.dirPath, f.fileName)
		const fullFilePath = await GeneralUtilsService.getFullPathByPathAndUUID(
			filePath, f.deviceUUID
		)
		const type = await FileUtilsService.getFileType(fullFilePath)

		return {
			digikam_id: f.id,
			hash: f.hash,
			fileName: f.fileName,
			dirPath: f.dirPath,
			deviceUUID: f.deviceUUID,
			type: type
		}
	})
	const internalFormatFiles = await Promise.all(promises)
	await File.bulkCreate(internalFormatFiles)
}

export async function exportObjectsToDigiKamService () {
	const digiKamIdObjectIdsMap: Array<object> = await DigiKamAdapter.getDigiKamIdObjectsIdsMap()

	const digiKamObjectsTagRootPid = await DigiKamAdapter.insertTag(
		config.digiKamRootTagPid, config.digiKamObjectRootTagName
	)

	const visualObjectIdNameMap: Array<any> = await VisualObject.findAll({ attributes: ['id', 'name'], raw: true })

	for (const entry of digiKamIdObjectIdsMap) {
		try {
			const digiKamId: number = (<any> entry).digikam_id
			const objectIds: string = (<any> entry).objectids
			const visualObjectIds = objectIds.includes(config.queriesArraySeparator)
				? objectIds.split(config.queriesArraySeparator).map(Number)
				: [Number(objectIds)]

			for (const visualObjectId of visualObjectIds) {
				const visualObject = visualObjectIdNameMap.filter(e => e.id === visualObjectId)[0]
				const visualObjectName = visualObject.name

				// insert visual object in digikam one by one
				const tagId = await DigiKamAdapter.insertTag(digiKamObjectsTagRootPid, visualObjectName)

				// create media file - visual object association in digikam
				await DigiKamAdapter.insertImageTag(Number(digiKamId), tagId)
			}
		} catch (err) {
			logger.error(`Failed persisting image tags for digiKamIdObjectIdsMap:[${JSON.stringify(entry)}]`)
		}
	}
}
