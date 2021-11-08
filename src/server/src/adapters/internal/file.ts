import { Op } from 'sequelize';
import logger from '../../config/winston';
import { MetadataUtilsService } from '../../services/metadataUtils';
import { FilesByLabelType, FManager } from '../../types/fManagerTypes';
import { Audio, File, Image, NotSupported, Video } from '../dbConnections';
import DigiKamAdapter from '../digikam/digikam';

class FileAdapter {
    static getFilesBySearch = async (searchData: {[key: string]: any}) => {
        try {
            logger.debug(`Search input: ${searchData}`);

            let fileQueryConditionsList = [];
            const categoriesChain: Array<string> = searchData["categories"];
            const textField = searchData["textField"];
            const metadata = searchData["metadata"];

            let fileObject: Array<any>; 
            if (categoriesChain && categoriesChain.length > 0) {

                let categories: Array<string> = [];

                // check categories for nested structures
                categoriesChain.forEach(c => {
                    // take the last element from the chain (separated by '_') 
                    let categorySteps = c.split("_"); // TODO - configurable separator
                    let category = categorySteps[categorySteps.length-1]; 
                    categories.push(category);
                });


                fileObject = await DigiKamAdapter.getFilesByLabels(categories);

                // create condition for the DB query
                // (Filename is A AND Pathname is B) OR (Filename is C AND Pathname is D)
                let allCategoryConditions: Array<any> = [];
                fileObject.forEach((f: FilesByLabelType) => {
                    let fileName: string = f.fileName;
                    let dirPath: string = f.dirPath;
                    let uuid: string = f.uuid;

                    // check if last character is '/' and remove it
                    // if (dirPath.substr(-1) === "/" || dirPath.endsWith("\\")) {
                    //     dirPath = dirPath.slice(0, dirPath.length-1);
                    // }

                    let fileNameCondition = { fileName: { [Op.eq]: fileName }};
                    let dirPathCondition = { dirPath: { [Op.eq]: dirPath }};
                    let UUIDCondition = { deviceUUID: { [Op.eq]: uuid }};
                    let fullPathCondition = { [Op.and]: [
                        fileNameCondition, dirPathCondition, UUIDCondition
                    ]}
                    allCategoryConditions.push(fullPathCondition);
                });

                fileQueryConditionsList.push( { [Op.or]: allCategoryConditions } );
            }

            if (textField && textField !== "") {
                fileQueryConditionsList.push(
                    {fileName: { [Op.like]: `%${textField}%` }}
                );
            }
    
            let fileIds: Array<any> = [];
            if (metadata && metadata.length > 0) {
                let metadataQueryConditionsList = [];
                for (let m of metadata) {
                    // TODO - transform and split metadata path from a_b to a.b -> [a,b]
                    // /g = replace globally regex
                    let pathSteps = m.split("_"); // TODO - configurable separator
                    let stepsLength = pathSteps.length;
                    let fileType = pathSteps[0];
                    
                    // retranslate the UI friendly part path in raw format
                    let UIFriendlyPartPath = pathSteps.slice(1, stepsLength - 1).join(".");
                    let rawPartPath = MetadataUtilsService.UIFriendlyToRaw(UIFriendlyPartPath, fileType);

                    let fullPath = `metadata.${rawPartPath}`;
                    let value: string | number = pathSteps[stepsLength-1];
                    
                    // check if string value is number
                    if (typeof value === "string" && !Number.isNaN(Number(value))) {
                        value = Number(value);
                    }

                    let searchCondition: {[key: string]: any} = {};
                    searchCondition[rawPartPath] = {[Op.eq]: value};
                    metadataQueryConditionsList.push(
                        {metadata: searchCondition}
                    );

                    let result: Array<any>;
                    let fileTypeModel;
                    switch(fileType) {
                        case FManager.FileType.IMAGE:
                            fileTypeModel = Image;
                            break;
                        case FManager.FileType.VIDEO:
                            fileTypeModel = Video;
                            break;
                        case FManager.FileType.AUDIO:
                            fileTypeModel = Audio;
                            break;
                        case FManager.FileType.NOT_SUPPORTED:
                            fileTypeModel = NotSupported;
                            break;
                        default:
                            throw `Unknown file type specified [${fileType}]`;
                    }

                    result = await fileTypeModel.findAll({
                        attributes: ["fileId"],
                        where: {
                            [Op.or]: metadataQueryConditionsList
                        }
                    });
                    fileIds = fileIds.concat(result.map(r => r.fileId));
                }
            }

            if (fileIds.length > 0) fileQueryConditionsList.push({id: fileIds});
            const fileItems = await File.findAll({
                where: {    
                    [Op.and]: fileQueryConditionsList
                    // fileQueryConditionsList
                }
            });

            return fileItems;
        } catch (err) {
            throw new Error(<any> err);
        }
    }
}

export default FileAdapter;