import crypto from 'crypto'
import FileType from 'file-type'
import path from 'path'
import { getExtensionForFile } from '../adapters/internal/entities'
import { config } from '../config/config'
import logger from '../config/winston'
import { FileByType, fileTypesList, FManager } from '../types/fManagerTypes'
import GeneralUtilsService from './generalUtils'
const fs = require('fs').promises

class FileUtilsService {
	static getFileTypeByExtension (fileExtension: string) {
		const supportedFileExtensions = config.supportedFileTypeExtensions
		for (const fileType of Object.keys(supportedFileExtensions)) {
			if (supportedFileExtensions[fileType].includes(fileExtension)) { return fileType }
		}

		return FManager.FileType.NOT_SUPPORTED
	}

    /*
        get a nested json in format of
        'the.whole.json.path.to.the.last.key.level' : last_key_level_value

        useful for file metadata formating before persisting in DB
    */
    static formatAndFilterMetadataJSON = (jsonObject: any, fileType: string,
    	keyPrefix?: string, filter?: any) => {
    	const formatedJSON: {[key: string]: any} = {}
    	// RAM eater ?
    	const displayedMetadataKeys = Object.keys(config.displayedMetadata[fileType])
    	// logger.debug(`Metadata: [${config.displayedMetadata[fileType]}]`);

    	if (jsonObject) {
    		for (const key of Object.keys(jsonObject)) {
    			const keyString = keyPrefix
    				? `${keyPrefix}.${key.toString()}`
    			: key.toString()
    			const value = jsonObject[key]

    			if (typeof (value) === 'object') {
    				const result = FileUtilsService.formatAndFilterMetadataJSON(
    					value, fileType, keyString, filter)
    				Object.assign(formatedJSON, result)
    			} else if (displayedMetadataKeys.includes(keyString) &&
                          !FileUtilsService.isInvalidForPersist(keyString)) {
    				if (filter) {
    					// check filter exists and keyString is valid according to filter
    					if (filter(keyString)) formatedJSON[keyString] = value
    				} else {
    					formatedJSON[keyString] = value
    				}
    			}
    		}
    	}

    	return formatedJSON
    }

    static getFileChecksum = async (filePath: string) => {
    	const checksum = (str: string) => crypto
    		.createHash(config.algorithm)
    		.update(str)
    		.digest(config.encoding)

    	const fileContent = await fs.readFile(filePath)
    	const fileChecksum = checksum(fileContent)
    	return fileChecksum
    }

    static getFileType = async (filePath: string): Promise<FManager.FileType> => {
    	const fileType = await FileType.fromFile(filePath)
    	const mimeSplit: string| undefined = fileType
    		? fileType.mime.split('/')[0].toUpperCase()
    		: undefined

    	if (mimeSplit) {
    		let fileType: FManager.FileType
    		switch (mimeSplit) {
    		case 'AUDIO':
    			fileType = FManager.FileType.AUDIO
    			break
    		case 'VIDEO':
    			fileType = FManager.FileType.VIDEO
    			break
    		case 'IMAGE':
    			fileType = FManager.FileType.IMAGE
    			break
    		default:
    			fileType = FManager.FileType.NOT_SUPPORTED
    			break
    		}

    		logger.debug(`File [${filePath}] has type: [${fileType}]`)
    		return fileType
    	}

    	logger.warn(`Can't get type for file [${filePath}]`)
    	return FManager.FileType.NOT_SUPPORTED
    }

    static getUISupportedFiles = async (files: any) => {
    	const supportedFilePaths: Array<any> = []
    	let fileUnit: {[key: string]: any}
    	for (const file of files) {
    		const filePath =
                await GeneralUtilsService.getFullPathForFileModelObject(file)
    		const fileType = file.type
    		const extension = await getExtensionForFile(file.id)

    		if (extension && config.UiSupportedExtensions.includes(
    			extension.toLowerCase())
    		) {
    			let thumbnailPath
    			switch (fileType) {
    			case FManager.FileType.VIDEO:
    				thumbnailPath = path.join(
    					config.configFolderName, `${file.hash}.gif`)
    				break
    			case FManager.FileType.IMAGE:
    				thumbnailPath = path.join(
    					config.configFolderName,
    					`${file.hash}.${path.extname(filePath)}`
    				)
    				break
    			case FManager.FileType.AUDIO:
    				thumbnailPath = path.join(
    					config.configFolderName,
    					'audio_thumbnail.png'
    				)
    				break
    			case FManager.FileType.NOT_SUPPORTED:
    				thumbnailPath = path.join(
    					config.configFolderName,
    					'not_supported.png'
    				)
    				break
    			default:
    				logger.error(`Unrecognized file type [${fileType}]`)
    			}

    			// get formated response
    			fileUnit = {
    				type: fileType,
    				filePath: filePath,
    				thumbnailPath: thumbnailPath
    			}
    			supportedFilePaths.push(fileUnit)
    		}
    	}

    	return supportedFilePaths
    }

    static filterToBeAggregatedMetadata (metadata: any, fileType: FManager.FileType) {
    	const fileTypeDisplayedMetadata = config.displayedMetadata[fileType]
    	if (fileTypeDisplayedMetadata) {
    		const toBeDisplayedMetadata = Object.keys(fileTypeDisplayedMetadata)
    		const filteredMetadata: {[key: string]: any} = {}

    		for (const key in metadata) {
    			if (toBeDisplayedMetadata.includes(key)) {
    				filteredMetadata[key] = metadata[key]
    			}
    		}

    		return filteredMetadata
    	}

    	return metadata
    }

    static getFileExtensionFromFilename (filePath: string): string | undefined {
    	const fileName = path.basename(filePath)
    	const ext: string = path.extname(fileName)

    	if (ext.length < 0) {
    		return undefined
    	}

    	return ext
    }

    static async getFileExtensionFromType (filePath: string): Promise<string | undefined> {
    	// extension
    	let extension: string | undefined
    	const type = await FileType.fromFile(filePath)

    	if (!type) {
    		logger.warn(`Can't get any file type data about ${filePath}`)
    	} else {
    		extension = type.ext
    	}

    	return extension
    }

    static async getFileExtension (filePath: string): Promise<string | undefined> {
    	let extension

    	// get extension using file type
    	extension = await FileUtilsService.getFileExtensionFromType(filePath)

    	// get extension using filename
    	if (!extension) {
    		extension = FileUtilsService.getFileExtensionFromFilename(filePath)
    	}

    	return extension
    }

    static isInvalidForPersist (value: string) {
    	// detect weird unicode characters that break persistance in postgres (C in regex means -- Other)
    	return value.match(/\p{C}/gu) !== null
    }

    static mapFilesByFileType = async (filePaths: Array<string>): Promise<FileByType> => {
    	// create empty object based on supported media types
    	const filePathsByType: FileByType = {}

    	fileTypesList.forEach(fileType => {
    		filePathsByType[fileType] = []
    	})

    	// categorize files based on media type
    	logger.info('Categorizing each file with a certain media type')
    	for (const filePath of filePaths) {
    		const fileType = await FileUtilsService.getFileType(filePath)
    		filePathsByType[fileType].push(filePath)
    	}

    	return filePathsByType
    }
}

export default FileUtilsService
