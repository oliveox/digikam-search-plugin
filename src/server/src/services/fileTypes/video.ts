import FileType from 'file-type'
import fs from 'fs'
import path from 'path'
import { getObjectsInMediaFile } from '../../adapters/machineLearning'
import { config } from '../../config/config'
import logger from '../../config/winston'
import { AnyFileMetadata, FManager, FormatedFile, VideoData } from '../../types/fManagerTypes'
import GeneralUtilsService from '../generalUtils'
const ffprobe = require('ffprobe-client')
const shell = require('any-shell-escape')

class VideoUtils {
    static getData = async (file: FormatedFile): Promise<VideoData> => {
    	const filePath = file.filePath
    	const hash = file.hash

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
            [${GeneralUtilsService.fileTypeStringToEnum(
    			FManager.FileType.VIDEO)}]. ${err}`)
    	}

    	// general video metadata using 'ffprobe'
    	let probe
    	try {
    		probe = await ffprobe(filePath)
    	} catch (err) {
    		logger.warn(`Can't get video metadata with 'ffprobe' library 
                        for file [${filePath}]. ${err}`)
    	}

    	// thumbnail
    	let gifExists = true
    	const gifFilename = `${hash}.gif`
    	const gifFilePath = path.join(config.configFolderPath, gifFilename)

    	// check if thumbnail exists already
    	try {
    		await fs.promises.access(gifFilePath)
    		logger.warn(`Video already has GIF thumbnail. Video: [${filePath}].
                         Gif: [${gifFilePath}]`)
    	} catch (err) {
    		gifExists = false
    	}

    	if (!gifExists) {
    		try {
    			await VideoUtils.convertVideoToGIF(filePath, gifFilePath)
    		} catch (err) {
    			logger.error(`Could not create thumbnail for video 
                                file [${filePath}]. ${err}`)
    		}
    	}

    	let objects = []
    	try {
    		objects = await getObjectsInMediaFile(filePath, FManager.FileType.VIDEO)
    	} catch (err) {
    		logger.error(`Could not fetch objects for file [${filePath}]: ${err}`)
    	}

    	// get file metadata
    	const metadata: AnyFileMetadata = {
    		extension: extension,
    		probe: probe
    	}

    	return {
    		metadata: metadata,
    		objects: objects
    	}
    }

    static convertVideoToGIF = async (videoPath: string, gifPath: string) => {
    	logger.debug(`Converting video to GIF. Src [${videoPath}]. Dest [${gifPath}]`)

    	const convertVidToGif = shell([
    		'ffmpeg',
    		'-ss', config.videoStartPosition,
    		'-t', config.videoAnalyseLength,
    		'-i', videoPath,

    		'-filter_complex',
    		'[0:v] fps=12,scale=480:-1,split [a][b];[a] palettegen [p];[b][p] paletteuse',

    		gifPath
    	])

    	await GeneralUtilsService.executeProcess(convertVidToGif)
    }
}

export default VideoUtils
