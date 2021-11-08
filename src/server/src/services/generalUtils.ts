import { exec } from 'child_process';
import path from 'path';
import logger from '../config/winston';
import { FilesByType, FManager } from '../types/fManagerTypes';
const si = require('systeminformation');

class GeneralUtilsService {

    /*
    Formats 
    from a json structure to a format suitable for CheckboxTree React component
    */
   
    static jsonToCheckboxTreeStructure = (
        initialStructure: {[key: string]: any}, prefix?: string) => {
        let result = Object.keys(initialStructure).map(key => {
            const nestedStructure = initialStructure[key];
            let formatedStructure: any = [];
            const uniqueID = prefix ? `${prefix}_${key}` : key;

            if (nestedStructure.constructor == Array) {
                nestedStructure.forEach(item => {
                    formatedStructure.push(
                        {
                            value: `${uniqueID}_${item}`,
                            label: item
                        }
                    );
                });

                formatedStructure = {
                    value: uniqueID, // compose unique ID key
                    label: key,
                    children: formatedStructure
                }   

                return formatedStructure;
            }

            if (nestedStructure.constructor == Object) {
                formatedStructure = {
                    value: uniqueID,
                    label: key,
                };    

                let nestedStructureChildren = GeneralUtilsService.
                                                    jsonToCheckboxTreeStructure
                (
                    nestedStructure,
                    uniqueID
                );

                if (Object.keys(nestedStructureChildren).length > 0) {
                    formatedStructure["children"] = nestedStructureChildren;
                }

                return formatedStructure;
            }
        })

        return result;
    }

    static executeProcess = async (command: string) => {
        return new Promise((resolve, reject) => {
            logger.debug(`Executhing shell command: [${command}]`);
            exec(command, (err) => {
                if (err) reject(err);
                else resolve("done");
            })
        })
    }

    static splitFilesByType = (filesByType: FilesByType, splitNr: number): Array<any> => {
        let allFilesByTypeSplitted: Array<any> = [];
        for (let i = 0; i < splitNr; i++) {
            let filesByTypeFraction: FilesByType = {};
            Object.keys(FManager.FileType).forEach((type: string) => {
                let typeFiles: Array<string> = [];
                typeFiles = filesByType[type].filter((_, index) => index % splitNr === i);
                filesByTypeFraction[type] = typeFiles;
            });
            allFilesByTypeSplitted.push(filesByTypeFraction);
        }

        return allFilesByTypeSplitted;
    }

    static fileTypeEnumToString = (fileTypeEnum: FManager.FileType) => {
        return FManager.FileType[fileTypeEnum];
    }

    static fileTypeStringToEnum = (fileTypeString: string) => {
        return (<any>FManager.FileType)[fileTypeString];
    }

    static getFullPathForFileModelObjects = async (files: Array<any>) => {
        const deviceUUIIDMap: Map<string, string> = 
                                await GeneralUtilsService.getDeviceUUIDMap();

        // TODO - reuse getFullPathForFileModelObject
        const fullFilePaths = files.map(f => {
            let filePath = f.filePath;
            let UUID = f.deviceUUID.toLowerCase();
            let identifier = deviceUUIIDMap.get(UUID);

            if (!identifier) 
                throw `Could not find device identifer for UUID [${UUID}]`;

            return path.join(identifier, filePath);	
        })

        return fullFilePaths;
    }

    static getFullPathForFileModelObject = async (file: any) => {
        const deviceUUIIDMap: Map<string, string> = 
                                await GeneralUtilsService.getDeviceUUIDMap();

        let filePath = path.join(file.dirPath, file.fileName);
        let UUID = file.deviceUUID.toLowerCase();
        let identifier = deviceUUIIDMap.get(UUID);

        if (!identifier) 
            throw `Could not find device identifer for UUID [${UUID}]`;

        return path.join(identifier, filePath);	
    }

    static getFullPathByPathAndUUID = async (filePath: string, UUID: string) => {
        const deviceUUIIDMap: Map<string, string> = 
                                await GeneralUtilsService.getDeviceUUIDMap();

        let identifier = deviceUUIIDMap.get(UUID);

        if (!identifier) 
            throw `Could not find device identifer for UUID [${UUID}]`;

        return path.join(identifier, filePath);
    }

    static getDeviceUUIDMap = async () => {
        let albumRootBlockDevicesUUIDs = new Map<string, string>();
        // get device root path
        try {
            
            let blockdevides = await si.blockDevices();
            for (let device of blockdevides) {
                let deviceUUID: string = device.uuid.toLowerCase();
                let deviceIdentifier: string = device.identifier;
                albumRootBlockDevicesUUIDs.set(deviceUUID, deviceIdentifier);
            }
    
            return albumRootBlockDevicesUUIDs;
        } catch (err) {
            logger.error(`Could not fetch block devices UUIDs`);
            throw err;
        }
    }
}

export default GeneralUtilsService;