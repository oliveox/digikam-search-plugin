import logger from '../../config/winston';
import { MetadataUtilsService } from '../../services/metadataUtils';
import { AggregatedMetadataType, FileData, FManager } from '../../types/fManagerTypes';
import { Metadata } from '../dbConnections';

class MetadataAdapter {
    static getAllFileTypeMetadata = () => {
        return new Promise((resolve, reject) => {
            let response: {[key: string]: object} = {};
    
            Metadata.findAll()
            .then(rows => {
                rows.forEach(row => {
                    const metadataObject = row.toJSON() as AggregatedMetadataType;
                    const fileType = metadataObject.fileType;
                    response[fileType] = row;
                })
                resolve(response)
            })
            .catch(reject);
        });
    }

    static persistMetadata = async (metadata: object, fileType: FManager.FileType) => {
        const fileTypeMetadata = await Metadata.findOne({where: {fileType: fileType}});
        if (fileTypeMetadata) {
            fileTypeMetadata.update({metadata: metadata});
            logger.debug(`Updated [${fileType}] file type metadata collection`);
        } else {
            Metadata.create({fileType: fileType, metadata: metadata});
            logger.debug(`Created [${fileType}] file type metadata collection`);
        }
    }

    static getFileTypeMetadata = async (fileType: FManager.FileType) => {
        return await Metadata.findOne(
            {attributes: ["metadata"],
            where: { fileType: fileType }
        });
    }

    static updateFileTypeMetadata = async (fileData: FileData) => {
        let fileMetadata = fileData.data.metadata;
        const fileType = fileData.type;

        if (!fileMetadata || !fileType) 
            throw `Missing [metadata] or [fileType] while updating 
                                                            file type metadata`;
        const result: any = await MetadataAdapter
                                            .getFileTypeMetadata(fileType);

        let fileTypeMetadata;
        if (!result) {
            fileTypeMetadata = {};
        } else {
            if (!result.metadata)
                throw `Could not find [metadata] column on metadata query result`;
            fileTypeMetadata = result.metadata;                   
        }
        
        fileMetadata = MetadataUtilsService.getUpdatedMetadataCollection(
            fileMetadata, fileTypeMetadata
        );
        await MetadataAdapter.persistMetadata(fileTypeMetadata, fileType);
    }
}

export default MetadataAdapter;