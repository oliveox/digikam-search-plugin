import { exec } from 'child_process'
import path from 'path'
import logger from '../config/winston'
import { FilesByType, FManager } from '../types/fManagerTypes'
const si = require('systeminformation')

class GeneralUtilsService {
	/*
    Formats
    from a json structure to a format suitable for CheckboxTree React component
    */
    static jsonToCheckboxTreeStructure = (initialStructure: {[key: string]: any}, prefix?: string) => {
    	const result = Object.keys(initialStructure).map(key => {
    		const nestedStructure = initialStructure[key]
    		let formatedStructure: any = []
    		const uniqueID = prefix ? `${prefix}_${key}` : key

    		if (nestedStructure.constructor === Array) {
    			nestedStructure.forEach((item: any) => {
    				formatedStructure.push(
    					{
    						value: `${uniqueID}_${item}`,
    						label: item
    					}
    				)
    			})

    			formatedStructure = {
    				value: uniqueID, // compose unique ID key
    				label: key,
    				children: formatedStructure
    			}
    		} else if (nestedStructure.constructor === Object) {
    			formatedStructure = {
    				value: uniqueID,
    				label: key,
    			}

    			const nestedStructureChildren = GeneralUtilsService.jsonToCheckboxTreeStructure(
    					nestedStructure,
    					uniqueID
    			)

    			if (Object.keys(nestedStructureChildren).length > 0) {
    				formatedStructure.children = nestedStructureChildren
    			}
    		} else {
    			logger.error('Wrong structure type while converting json to checkbox structure')
    		}

    		return formatedStructure
    	})

    	return result
    }

    static executeProcess = async (command: string) => {
    	return new Promise((resolve, reject) => {
    		logger.debug(`Executhing shell command: [${command}]`)
    		exec(command, (err) => {
    			if (err) reject(err)
    			else resolve('done')
    		})
    	})
    }

    static splitFilesByType = (filesByType: FilesByType, splitNr: number): Array<any> => {
    	const allFilesByTypeSplitted: Array<any> = []
    	for (let i = 0; i < splitNr; i++) {
    		const filesByTypeFraction: FilesByType = {}
    		Object.keys(FManager.FileType).forEach((type: string) => {
    			let typeFiles: Array<string> = []
    			typeFiles = filesByType[type].filter((_, index) => index % splitNr === i)
    			filesByTypeFraction[type] = typeFiles
    		})
    		allFilesByTypeSplitted.push(filesByTypeFraction)
    	}

    	return allFilesByTypeSplitted
    }

    static fileTypeEnumToString = (fileTypeEnum: FManager.FileType) => {
    	return FManager.FileType[fileTypeEnum]
    }

    static fileTypeStringToEnum = (fileTypeString: string) => {
    	return (<any>FManager.FileType)[fileTypeString]
    }

    static getFullPathForFileModelObjects = async (files: Array<any>) => {
    	const deviceUUIIDMap: Map<string, string> =
                                await GeneralUtilsService.getDeviceUUIDMap()

    	// TODO - reuse getFullPathForFileModelObject
    	const fullFilePaths = files.map(f => {
    		const filePath = f.filePath
    		const UUID = f.deviceUUID.toLowerCase()
    		const identifier = deviceUUIIDMap.get(UUID)

    		if (!identifier) {
    			throw new Error(`Could not find device identifer for UUID [${UUID}]`)
    		}

    		return path.join(identifier, filePath)
    	})

    	return fullFilePaths
    }

    static getFullPathForFileModelObject = async (file: any) => {
		if (file.deviceUUID.startsWith('path=')) {
			const filePath = path.join(file.dirPath, file.fileName)
			return path.join(file.deviceUUID.split('path=')[1], filePath)
		} else {
			const deviceUUIIDMap: Map<string, string> =
				await GeneralUtilsService.getDeviceUUIDMap() // TODO - cache result

			const filePath = path.join(file.dirPath, file.fileName)
			const UUID = file.deviceUUID.toLowerCase()
			const identifier = deviceUUIIDMap.get(UUID)

			if (!identifier) {
				throw new Error(`Could not find device identifer for UUID [${UUID}]`)
			}

			return path.join(identifier, filePath)
		}
    }

    static getFullPathByPathAndUUID = async (filePath: string, UUID: string) => {
    	const deviceUUIIDMap: Map<string, string> =
                                await GeneralUtilsService.getDeviceUUIDMap()

    	const identifier = deviceUUIIDMap.get(UUID)

    	if (!identifier) {
    		throw new Error(`Could not find device identifer for UUID [${UUID}]`)
    	}

    	return path.join(identifier, filePath)
    }

    static getDeviceUUIDMap = async () => {
    	const albumRootBlockDevicesUUIDs = new Map<string, string>()
    	// get device root path
    	try {
    		const blockdevides = await si.blockDevices()
    		for (const device of blockdevides) {
    			const deviceUUID: string = device.uuid.toLowerCase()
    			const deviceIdentifier: string = device.identifier

				if (!deviceUUID || !deviceIdentifier) {
					throw new Error(`Could not determine UUID or identifier for device: [${JSON.stringify(device)}]`)
				}

    			albumRootBlockDevicesUUIDs.set(deviceUUID, deviceIdentifier)
    		}

    		return albumRootBlockDevicesUUIDs
    	} catch (err) {
    		logger.error(`Could not fetch block devices UUIDs: ${err}`)
    		throw err
    	}
    }
}

export default GeneralUtilsService
