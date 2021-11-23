import { Model, Op } from 'sequelize'
import { any } from 'sequelize/types/lib/operators'
import logger from '../../config/winston'
import { MetadataUtilsService } from '../../services/metadataUtils'
import { FilesByLabelType, FManager } from '../../types/fManagerTypes'
import { Audio, File, Image, NotSupported, Video, VisualObject, InternalDB } from '../dbConnections'
import DigiKamAdapter from '../digikam/digikam'

export default async function getFilesBySearch (
	searchData: {[key: string]: any}): Promise<Array<Model<any, any>>> {
	try {
		logger.debug(`Search input: ${searchData}`)

		const fileQueryConditionsList = []
		let fileIds: Array<number> = []

		const tagsChain: Array<string> = searchData.categories
		const fileName: string = searchData.textField
		const metadata = searchData.metadata
		const visualObjects = searchData.visualObjects?.map((o: any) => o.split('_')[1])

		// tags
		const tagsConditions = await getTagsSearchConditions(tagsChain)
		if (tagsConditions) {
			fileQueryConditionsList.push({ [Op.and]: tagsConditions })
		}

		// filename
		if (fileName) {
			fileQueryConditionsList.push(
				// % means 'contains' in sqlite syntax
				{ fileName: { [Op.like]: `%${fileName}%` } }
			)
		}

		// metadata
		const metadataFileIds: Array<number> | null = await getMetadataSearchConditions(metadata)
		if (metadataFileIds?.length ?? -1 > 0) fileIds = fileIds.concat(metadataFileIds!)

		// visual objects
		const objectsFileIds: Array<number> = await getVisualObjectsSearchConditions(visualObjects)
		if (objectsFileIds?.length > 0) fileIds = fileIds.concat(objectsFileIds)

		if (fileIds.length > 0) fileQueryConditionsList.push({ id: fileIds })
		const fileItems = await File.findAll({
			where: {
				[Op.and]: fileQueryConditionsList
				// fileQueryConditionsList
			}
		})

		return fileItems
	} catch (err) {
		throw new Error(<any> err)
	}
}

async function getTagsSearchConditions (categoriesChain: Array<string>) {
	if (!(categoriesChain?.length > 0)) return null

	const categories: Array<string> = []

	// check categories for nested structures
	categoriesChain.forEach(c => {
		// TODO - configurable separator
		// take the last element from the chain (separated by '_')
		const categorySteps = c.split('_')
		const category = categorySteps[categorySteps.length - 1]
		categories.push(category)
	})

	const fileObject: Array<any> = await DigiKamAdapter.getFilesByLabels(categories)

	// create condition for the DB query
	// (Filename is A AND Pathname is B)
	// OR (Filename is C AND Pathname is D)
	const allCategoryConditions: Array<any> = []
	fileObject.forEach((f: FilesByLabelType) => {
		const fileName: string = f.fileName
		const dirPath: string = f.dirPath
		const uuid: string = f.uuid

		// check if last character is '/' and remove it
		// if (dirPath.substr(-1) === "/" || dirPath.endsWith("\\")) {
		//     dirPath = dirPath.slice(0, dirPath.length-1);
		// }

		const fileNameCondition = { fileName: { [Op.eq]: fileName } }
		const dirPathCondition = { dirPath: { [Op.eq]: dirPath } }
		const UUIDCondition = { deviceUUID: { [Op.eq]: uuid } }
		const fullPathCondition = {
			[Op.and]: [
				fileNameCondition, dirPathCondition, UUIDCondition
			]
		}
		allCategoryConditions.push(fullPathCondition)
	})

	return allCategoryConditions
}

async function getMetadataSearchConditions (metadata: Array<any>): Promise<Array<number> | null> {
	if (!(metadata?.length > 0)) return null

	let fileIds: Array<number> = []
	const metadataQueryConditionsList = []
	for (const m of metadata) {
		// TODO - transform and split metadata path
		// from a_b to a.b -> [a,b]

		// /g = replace globally regex
		const pathSteps = m.split('_') // TODO - configurable separator
		const stepsLength = pathSteps.length
		const fileType = pathSteps[0]

		// retranslate the UI friendly part path in raw format
		const UIFriendlyPartPath =
						pathSteps.slice(1, stepsLength - 1).join('.')
		const rawPartPath = MetadataUtilsService.UIFriendlyToRaw(
			UIFriendlyPartPath, fileType
		)

		let value: string | number = pathSteps[stepsLength - 1]

		// check if string value is number
		if (typeof value === 'string' && !Number.isNaN(Number(value))) {
			value = Number(value)
		}

		const searchCondition: {[key: string]: any} = {}
		searchCondition[rawPartPath] = { [Op.eq]: value }
		metadataQueryConditionsList.push({ metadata: searchCondition })

		let fileTypeModel
		switch (fileType) {
		case FManager.FileType.IMAGE:
			fileTypeModel = Image
			break
		case FManager.FileType.VIDEO:
			fileTypeModel = Video
			break
		case FManager.FileType.AUDIO:
			fileTypeModel = Audio
			break
		case FManager.FileType.NOT_SUPPORTED:
			fileTypeModel = NotSupported
			break
		default:
			throw new Error(`Unknown file type specified [${fileType}]`)
		}

		const result: Array<any> =
			await fileTypeModel.findAll({
				attributes: ['fileId'],
				where: {
					[Op.or]: metadataQueryConditionsList
				}
			})
		fileIds = fileIds.concat(result.map(r => r.fileId))
	}

	return fileIds
}

export async function getVisualObjectsSearchConditions (visualObjects: Array<string>): Promise<Array<number>> {
	if (!visualObjects || visualObjects.length === 0) return []

	let result: Array<any>

	result = await VisualObject.findAll({
		attributes: ['id'], where: { name: { [Op.in]: visualObjects } }, raw: true
	})

	if (result?.length === 0) return []
	const visualObjectIds = result.map(r => r.id)

	result = await Image.findAll({
		attributes: ['fileId'], where: { objects: { [Op.contained]: visualObjectIds } }, raw: true
	})
	const imageFileIds = result.map(r => r.fileId)

	const videoFilesIdsQuery =
		`select "fileId" from videos where objects ?| array[${[...visualObjectIds.map(id => `'${String(id)}'`)]}]`
	result = await InternalDB.query(videoFilesIdsQuery)
	const videoFileIds = result[0].map((e: any) => e.fileId)

	return [...imageFileIds, ...videoFileIds]
}
