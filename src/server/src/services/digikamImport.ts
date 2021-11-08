import path from "path";
import { File } from "../adapters/dbConnections";
import DigiKamAdapter from "../adapters/digikam/digikam";
import FileUtilsService from "./fileUtils";
import GeneralUtilsService from "./generalUtils";


export const  importDigiKamFileData = async () => {
    const digiKamfiles: Array<any> = await DigiKamAdapter.getDigiKamFiles();
    const promises: Array<any> = digiKamfiles.map(async (f) => {

        let filePath = path.join(f.dirPath, f.fileName);
        const fullFilePath = await GeneralUtilsService.getFullPathByPathAndUUID(
            filePath, f.deviceUUID
        );
        const type = await FileUtilsService.getFileType(fullFilePath);

        return {
            digikam_id: f.id,
            hash: f.hash,
            fileName: f.fileName,
            dirPath: f.dirPath,
            deviceUUID: f.deviceUUID,
            type: type
        }
    });
    const internalFormatFiles = await Promise.all(promises);
    await File.bulkCreate(internalFormatFiles);
}
