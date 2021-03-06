import ExifReader from 'exifreader'
import FileType from 'file-type'
import path from 'path'
import { getObjectsInMediaFile } from '../../adapters/machineLearning'
import { config } from '../../config/config'
import logger from '../../config/winston'
import { AnyFileMetadata, FManager, FormatedFile, ImageData } from '../../types/fManagerTypes'
import GeneralUtilsService from '../generalUtils'
const sharp = require('sharp')
const fs = require('fs').promises

class ImageUtils {

    static getData = async (file: FormatedFile): Promise<ImageData> => {
    	const filePath = file.filePath
    	const hash = file.hash

    	// exif
    	let exif
    	try {
    		exif = await ImageUtils.getExif(filePath)
    	} catch (err) {
    		logger.warn(`Can't get exif with for image [${filePath}]. ${err}`)
    	}

    	// extension
    	let extension
    	try {
    		const type = await FileType.fromFile(filePath)

    		if (!type) {
    			throw new Error(`Can't get any file type data about ${filePath}`)
    		}

    		extension = type.ext
    	} catch (err) {
    		logger.warn(`Can't get extension for file categorized as 
            [${GeneralUtilsService.fileTypeEnumToString(FManager.FileType.IMAGE)}]. ${err}`)
    	}

    	// general image metadata using 'sharp' library
    	let sharpResult
    	try {
    		sharpResult = await sharp(filePath).metadata()
    	} catch (err) {
    		logger.warn(`Can't get image metadata with 'sharp' library 
            for [${filePath}]. ${err}`)
    	}
        
    	// thumbnail
    	let thumbnailExists = true
    	const thumbnailFilename = `${hash}.${path.extname(filePath)}`
    	const thumbnailFilePath = path.join(config.configFolderPath, thumbnailFilename)

    	// check if thumbnail exists already
    	try {
    		await fs.promises.access(thumbnailFilePath)
    		logger.warn(`Image already has GIF thumbnail. 
            Image: [${filePath}]. Thumbnail: [${thumbnailFilePath}]`)
    	} catch (err) {
    		thumbnailExists = false
    	}

    	if (!thumbnailExists) {
    		try {
    			await sharp(filePath).resize({ width: 500 }).toFile(thumbnailFilePath)
    		} catch (err) {
    			logger.error(`Could not create thumbnail [${thumbnailFilePath}] 
                                        for image file [${filePath}]. ${err}`)
    		}
    	}

    	let objects = []
    	try {
    		objects = await getObjectsInMediaFile(filePath, FManager.FileType.IMAGE)
    	} catch (err) {
    		logger.error(`Could not fetch objects for file [${filePath}]`)
    	}

    	// get file metadata
    	const metadata: AnyFileMetadata = {
    		extension: extension,
    		exif: exif,
    		sharp: sharpResult
    	}

    	return {
    		metadata: metadata,
    		objects: objects
    	}
    }

    static getExif = async (imagePath: string) => {
    	const fileContent = await fs.readFile(imagePath)
    	const exif = ExifReader.load(fileContent, { expanded: true })
    	return exif
    }
}

export default ImageUtils
