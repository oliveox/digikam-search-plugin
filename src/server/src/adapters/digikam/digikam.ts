import path from 'path'
import { QueryTypes, UniqueConstraintError } from 'sequelize'
import url from 'url'
import logger from '../../config/winston'
import { FilesByLabelType, UuidType, UuidTypeReturn } from '../../types/fManagerTypes'
import { DigiKamDB, InternalDB } from '../dbConnections'
import { config } from '../../config/config'

const fs = require('fs').promises
const si = require('systeminformation')

class DigiKamAdapter {
    static getCategoriesTree = async (parentID?: number): Promise<Object> => {
    	if (parentID !== undefined) {
    		const tagIDs: Array<string> = await DigiKamUtils.getOneTagTreeLevel(parentID)
    		const tree: {[key: string]: any} = {}
    		if (tagIDs.length > 0) {
    			for (const tagID of tagIDs) {
    				const tagLabel: string = await DigiKamUtils.getTagLabelByID(tagID)
    				const subTree = await DigiKamAdapter.getCategoriesTree(parseInt(tagID))
    				tree[tagLabel] = subTree
    			}
    		}
    		return tree
    	} else {
    		// root categories have parentId = 0
    		const result = await DigiKamAdapter.getCategoriesTree(0)
    		return result
    	}
    }

    static async getFilesByLabels (labels: Array<string>): Promise<Array<FilesByLabelType>> {
    	// get files by labels
    	logger.debug(`Fetching files with labels [${labels}]`)

    	// label -> TagID -> ImageID -> filename, folderID -> filename, folder
    	const filenamesAndDirs: Array<FilesByLabelType> =
                        await DigiKamUtils.getFilesAndFoldersByLabels(labels)
    	const albumRootIdentifierPathMap =
                            await DigiKamUtils.getAlbumRootIdentifierPathMap()

    	const validPaths: Array<FilesByLabelType> = []

    	// filter for only files
    	let e: any
    	for (e of filenamesAndDirs) {
    		const fileName = e.name
    		const deviceUUID = e.identifier.split('uuid=')[1]
    		const devicePath = albumRootIdentifierPathMap[deviceUUID.toLowerCase()]

    		const dirPath = path.join(devicePath, e.dirPath)

    		// workaround white-space escaping for fs.stat
    		let filePath = `file://${path.join(dirPath, fileName)}`
    		filePath = url.fileURLToPath(filePath)

    		try {
    			const stats = await fs.stat(filePath)
    			if (!stats.isDirectory()) validPaths.push(
    				{
    					fileName: e.name,
    					dirPath: e.dirPath,
    					uuid: deviceUUID
    				}
    			)
    		} catch (err) {
    			logger.error((<any>err).message)
    		}

    	}

    	return validPaths
    }

    static getDigiKamFiles = async () => {
    	const results = await DigiKamDB.query(
    		getAllDigiKamFilesQuery, {type: QueryTypes.SELECT})
    	return results
    }

    static async insertTag (tagRootPid: number, tagName: string): Promise<number> {
    	let result: number
    	try {
    		const [id, pid] = await DigiKamDB.query(
    			insertTagQuery,
    			{ type: QueryTypes.INSERT, replacements: [tagRootPid, tagName], raw: true }
    		)
    		result = id;
    	} catch (e) {
    		if (e instanceof UniqueConstraintError) {
    			const res = await DigiKamDB.query(
    				getTagQuery,
    				{ type: QueryTypes.SELECT, replacements: [tagRootPid, tagName], raw: true }
    			)
    			result = (<any> res[0]).id
    		} else {
    			throw e
    		}
    	}

    	return result
    }

    static async insertImageTag (imageId: number, tagId: number) {
    	try {
    		const result = await DigiKamDB.query(
    			insertImageTagQuery,
    			{ type: QueryTypes.INSERT, replacements: [imageId, tagId], raw: true }
    		)
    		return result
    	} catch (e) {
    		if (e instanceof UniqueConstraintError) {
    			logger.warn(`ImageTag entry with imageId:[${imageId}] and tagId:[${tagId}] already exists`)
    		} else {
    			throw e
    		}
    	}
    }

    static async getDigiKamIdObjectsIdsMap () {
    	const result = await InternalDB.query(
    		getDigiKamIdObjectsIdsQuery,
    		{ type: QueryTypes.SELECT, raw: true }
    	)
    	return result
    }

    static getUuidType (uuid: string): UuidTypeReturn {
    	return uuid.startsWith('path=')
    		? {
    			type: UuidType.folderPath,
    			path: uuid.split('path=')[1]
    		  }
    		: {
    			type: UuidType.device,
    			path: null
    		  }
    }
}

class DigiKamUtils {

    static getAlbumRootIdentifierPathMap = async () => {

    	const albumRootIdentifierPathMap: any = {}
    	let albumRootIdenfitiers
    	try {
    		albumRootIdenfitiers = await DigiKamUtils.getAlbumRootIdentifiers()

    		if (!(albumRootIdenfitiers?.length)) {
    			throw new Error('No album root identifiers found')
    		}
    			
    	} catch (err) {
    		logger.error(`Could not fetch DigiKam album root identifiers: ${err}`)
    		throw err
    	}

    	const albumRootBlockDevicesUUIDs: Array<string> =
                                <Array<string>> albumRootIdenfitiers?.map(
                                	i => i.split('uuid=')[1].toLowerCase()
                                )

    	// get device root path
    	try {
    		const blockdevides = await si.blockDevices()
    		for (const device of blockdevides) {
    			const deviceUUID: string = device.uuid.toLowerCase()
    			const deviceIdentifier: string = device.identifier
    			if (albumRootBlockDevicesUUIDs.includes(deviceUUID)) {
    				albumRootIdentifierPathMap[deviceUUID] = deviceIdentifier
    			}
    		}

    		return albumRootIdentifierPathMap
    	} catch (err) {
    		logger.error('Could not fetch block devices UUIDs')
    		throw err
    	}
    }

    static getAlbumRootIdentifiers = async (): Promise<Array<any>> => {
    	const result = await DigiKamDB.query(
    		getAlbumRootsIdentifiersQuery, {type: QueryTypes.SELECT}
    	)
    	return result.map(label => Object.values(label)[0])
    }

    static getOneTagTreeLevel = async (parentID: number):
                                                Promise<Array<string>> => {

    	const results: any =
            await DigiKamDB.query(getOneTagTreeLevelQuery, {
            	replacements: [parentID],
            	type: QueryTypes.SELECT
            })

    	return results.map((label: any) => Object.values(label)[0])
    }

    static getTagLabelByID = async (tagID: string): Promise<string> => {

    	const results = await DigiKamDB.query(getTagLabelByIDQuery,
    		{
    			replacements: [tagID],
    			type: QueryTypes.SELECT
    		})

    	return results.map(label => Object.values(label)[0])[0]
    }

    static getFilesAndFoldersByLabels = async (labels: Array<string>):
                                        Promise<Array<any>> => {
    	const placeholder: string = labels.map(() => '?').join(',')
    	const query = DigiKamUtils.getFilesByLabels(placeholder)
    	const result = await DigiKamDB.query(query,
    		{replacements: [labels], type: QueryTypes.SELECT}
    	)
    	return result
    }

    static getFilesByLabels = (placeholder: string) => {
    	const query = `
            select t3.name, t4.specificPath || t3.relativePath as dirPath, t4.identifier from
            (select t1.name, t2.relativePath, t2.albumRoot from
            (select album, name from Images
            where id in
            (select imageid from ImageTags
            where tagid IN
            (select id from tags
            where name in (${placeholder})
            ))) as t1
            JOIN 
            Albums as t2
            ON t1.album = t2.id
            ) as t3 
            JOIN
            AlbumRoots as t4
            ON t3.albumRoot = t4.id
        `

    	return query
    }
}

const getDigiKamIdObjectsIdsQuery = `
select t2.digikam_id, t1.objectIds
from
(select "fileId", objectIds from 
(select "fileId", array_to_string(objects, '${config.queriesArraySeparator}') as objectIds from images
UNION
select "fileId", string_agg(objectId, '${config.queriesArraySeparator}') as objectIds
from
(select "fileId", json_object_keys(to_json(objects)) as objectId from videos) as t
group by "fileId"
) as t1
where objectids <> '' 
) as t1
join
files t2
on t1."fileId" = t2.id
`

const insertImageTagQuery = `
insert into ImageTags (imageid, tagid)
values (?, ?)
`

const insertTagQuery = `
insert into Tags (pid, name)
values (?, ?)
`

const getTagQuery = `
select id from Tags
where pid like ? and name like ?
`

const getFileLabelsQuery = `
select name from Tags
where id like
(select tagid from ImageTags
where imageid like
(select id from Images 
where album like
(select id from Albums where relativePath LIKE ?)
and
name like ?))
`

const getOneTagTreeLevelQuery =
    `
select id from Tags
where pid = ?
`

const getTagLabelByIDQuery =
    `
select name from Tags
where id = ?
`

const getAlbumRootsIdentifiersQuery =
`
select identifier from AlbumRoots
`

const getAllDigiKamFilesQuery =
`
select t3.id, t4.specificPath || t3.relativePath as dirPath, t3.name as fileName, ltrim(t4.identifier, "volumeid:?uuid=") as deviceUUID, t3.uniqueHash as hash from
(select t1.id, t1.uniqueHash, t1.name, t2.relativePath, t2.albumRoot from
(select id, uniqueHash, album, name from Images) as t1
JOIN 
Albums as t2
ON t1.album = t2.id
) as t3 
JOIN
AlbumRoots as t4
ON t3.albumRoot = t4.id
`

export default DigiKamAdapter
