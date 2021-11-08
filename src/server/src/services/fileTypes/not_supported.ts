import FileType from 'file-type';
import path from 'path';
import logger from '../../config/winston';
import { AnyFileMetadata, FManager, FormatedFile, NotSupportedFileData } from '../../types/fManagerTypes';
import FileUtilsService from '../fileUtils';
import GeneralUtilsService from '../generalUtils';


class NotSupportedUtils {

    static getData = async (file: FormatedFile): Promise<NotSupportedFileData> => {

        const filePath = file.filePath;

        // get file metadata
        let metadata: AnyFileMetadata;

        // extension
        let extension;
        try {
            const type = await FileType.fromFile(filePath);

            if (!type) {
                logger.warn(`Can't get file extension from its type for 
                [${GeneralUtilsService.fileTypeStringToEnum(
                    FManager.FileType.NOT_SUPPORTED)}] file: [${filePath}]`)

                // get extension from filename
                extension = FileUtilsService.getFileExtensionFromFilename(filePath);

                if (!extension) {
                    throw Error(`Can't get file extension from filename for 
                    [${GeneralUtilsService.fileTypeStringToEnum(
                        FManager.FileType.NOT_SUPPORTED)}] file: [${filePath}]`)
                }

                logger.warn(`Got [${extension}] from filename string for 
                [${GeneralUtilsService.fileTypeStringToEnum(
                    FManager.FileType.NOT_SUPPORTED)}] file: [${filePath}]`);
            } else {
                extension = type.ext;
            }
            
        } catch (err) {
            logger.warn(`Can't get extension for file categorized as 
            [${GeneralUtilsService.fileTypeStringToEnum(
                FManager.FileType.NOT_SUPPORTED)}]. ${err}`);
            extension = "unknown";
        }

        metadata = {
            extension: extension
        }

        const fileName = path.basename(filePath);
        const dirPath = path.dirname(filePath);

        return {
            metadata: metadata
        }
    }
}

export default NotSupportedUtils;