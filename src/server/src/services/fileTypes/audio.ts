import FileType from 'file-type'
import logger from '../../config/winston'
import { AnyFileMetadata, AudioData, FManager, FormatedFile }
	from '../../types/fManagerTypes'

const MusicMetadata = require('music-metadata')

class AudioUtils {
    static getData = async (file: FormatedFile): Promise<AudioData> => {
    	const filePath = file.filePath

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
            [${FManager.FileType[FManager.FileType.AUDIO]}]. ${err}`) // refactor
    	}

    	// general image metadata using 'ffprobe'
    	let mm
    	try {
    		mm = await MusicMetadata.parseFile(filePath)
    	} catch (err) {
    		logger.warn(`Can't get audio metadata with 'MusicMetadata' library. ${err}`)
    	}

    	// TODO - speech to text feature here
    	const text = ''

    	// get file metadata
    	const metadata: AnyFileMetadata = {
    		extension: extension,
    		mm: mm,
    	}

    	return {
    		metadata: metadata,
    		text: text
    	}
    }
}

export default AudioUtils
