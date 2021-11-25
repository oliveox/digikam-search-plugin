import { saveObjectsAndFetchIds } from '../../services/analyse'
import { FileData, FManager } from '../../types/fManagerTypes'
import { Audio, File, Image, NotSupported, Video } from '../dbConnections'
import MetadataAdapter from './metadata'

export const saveImage = async (fileId: number, fileData: FileData) => {
	await MetadataAdapter.updateFileTypeMetadata(fileData)
	const objectsNameIdMap = await saveObjectsAndFetchIds(fileData.data.objects)

	Image.create({
		fileId: fileId,
		objects: [...objectsNameIdMap.values()],
		metadata: fileData.data.metadata
	})
}

export const saveVideo = async (fileId: number, fileData: FileData) => {
	MetadataAdapter.updateFileTypeMetadata(fileData)

	const objectsNameFrameMap = fileData.data.objects
	const objectsNameIdMap: Map<string, number> = await saveObjectsAndFetchIds(
		Object.keys(objectsNameFrameMap)
	)

	const objectsIdFrameMap = new Map<number, any>()
	Object.keys(objectsNameFrameMap).forEach((k, i) => {
		if (!objectsNameIdMap.get(k)) {
			throw new Error(`Object [${k}] has not been successfully saved`)
		} else {
			objectsIdFrameMap.set(
				<number> objectsNameIdMap.get(k),
				objectsNameFrameMap[k]
			)
		}
	})

	Video.create({
		fileId: fileId,
		objects: Object.fromEntries(objectsIdFrameMap),
		metadata: fileData.data.metadata
	})
}

export const saveAudio = async (fileId: number, fileData: FileData) => {
	MetadataAdapter.updateFileTypeMetadata(fileData)

	await Audio.create({ fileId: fileId, metadata: fileData.data.metadata })
}

export const saveNotSupported = async (fileId: number, fileData: FileData) => {
	MetadataAdapter.updateFileTypeMetadata(fileData)

	await NotSupported.create({ fileId: fileId, metadata: fileData.data.metadata })
}

export const updateFileType = async (fileId: number, fileType: FManager.FileType) => {
	await File.update({ type: fileType }, { where: { id: fileId } })
}

export const getExtensionForFile = async (fileId: number) => {
	const file: any = await File.findOne({
		attributes: ['type'],
		where: { 'id': fileId }
	})

	if (!file) throw new Error(`No file available with file id [${fileId}]`)

	let model: any
	switch (file.type) {
	case FManager.FileType.AUDIO:
		model = await Audio.findOne(
			{ attributes: ['metadata'], where: { fileId: fileId } }
		)
		return model.metadata.extension
	case FManager.FileType.IMAGE:
		model = await Image.findOne(
			{ attributes: ['metadata'], where: { fileId: fileId } }
		)
		return model.metadata.extension
	case FManager.FileType.VIDEO:
		model = await Video.findOne(
			{ attributes: ['metadata'], where: { fileId: fileId } }
		)
		return model.metadata.extension
	case FManager.FileType.NOT_SUPPORTED:
		model = await NotSupported.findOne(
			{ attributes: ['metadata'], where: { fileId: fileId } }
		)
		return model.metadata.extension
	}
}
