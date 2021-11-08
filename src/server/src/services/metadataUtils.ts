import { config } from '../config/config';
// import MetadataAdapter from '../adapters/internal/metadata';

export class MetadataUtilsService {

    static makeMetadataUserFriendly(metadata: {[key: string]: any}) {

        let renamedMetadata: {[key: string]: any} = {};
        for (let fileType in metadata) {
            let fileTypeMetadata = metadata[fileType].metadata;
            let renamedFileTypeMetadata: {[key: string]: any} = {};
            let UIFriendlyKey;

            for (let key in fileTypeMetadata) {
                UIFriendlyKey = config.displayedMetadata[fileType][key];
                renamedFileTypeMetadata[UIFriendlyKey] = fileTypeMetadata[key];
            }

            renamedMetadata[fileType] = renamedFileTypeMetadata;
        }

        return renamedMetadata;
    }


    static UIFriendlyToRaw(UIFriendlyName: string, fileType: string) {
        const displayedMetadata = config.displayedMetadata[fileType];
        const rawPaths = Object.keys(displayedMetadata);
        for (let rawPath of rawPaths) {
            if (displayedMetadata[rawPath] === UIFriendlyName) {
                return rawPath;
            }
        }
        
        // no raw path found
        throw new Error(`No raw path was found for UI friendly [${fileType}]
                             metadata [${UIFriendlyName}]`);
    }

     // merge new exif with an exif collection
    static getUpdatedMetadataCollection = (
        newMeta: {[key: string] : any}, existingMeta: {[key: string] : any}
    ) => {
        for (let exifKey of Object.keys(newMeta)) {
            const exifValue = newMeta[exifKey];
            if (!Object.keys(existingMeta).includes(exifKey)) {
                // add exif key to DB 
                existingMeta[exifKey] = [ exifValue ]; 
            } else if (!existingMeta[exifKey].includes(exifValue)) {
                // add value to persisted exif key
                existingMeta[exifKey].push(exifValue); 
            }
        }

        return existingMeta;
    }
}