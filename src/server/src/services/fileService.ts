import { config } from '../config/config'
import logger from '../config/winston'
import { AnyFileMetadata, FileData, FormatedFile, getFileTypeDataFetcher } from '../types/fManagerTypes'
import FileUtilsService from './fileUtils'
import GeneralUtilsService from './generalUtils'

class FileService {
    // static extractFileData = async (filePath: string, fileType: string) => {
    static extractFileData = async (file: FormatedFile) : Promise<FileData> => {
    	const fileType = file.type
    	const filePath = file.filePath
    	const fileTypeEnum = GeneralUtilsService.fileTypeStringToEnum(fileType)
        logger.info(`Extracting data from [${fileType}] file.`)
        logger.debug(`Extracting data from from [${fileType}] 
                                            file [${filePath}]`)

        const fileTypeDataFetcher = getFileTypeDataFetcher(fileTypeEnum)
        const fileData = await fileTypeDataFetcher(file)

        // filter metadata for each file type
        if (fileData.metadata) {
            let filter
            const metadataToRemove: Array<string> =
                                config.metadataToBeRemoved[fileTypeEnum]

            if (metadataToRemove && metadataToRemove.length > 0) {
                // removal filter
                filter = (key: string) => {
                    for (const m of metadataToRemove) {
                        if (key.startsWith(m)) return false
                    }
                    return true
                }
            }

            fileData.metadata = FileUtilsService.formatAndFilterMetadataJSON
            (
                fileData.metadata,
                fileType,
                undefined,
                filter
            ) as AnyFileMetadata
        }

        return {
            type: fileType,
            data: fileData
        }
    }
}

export default FileService
