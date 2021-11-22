import path from 'path';
import { QueryTypes } from 'sequelize';
import url from 'url';
import logger from '../../config/winston';
import { FilesByLabelType } from '../../types/fManagerTypes';
import { digiKamDB } from '../dbConnections';

const fs = require('fs').promises;
const si = require('systeminformation');

class DigiKamAdapter {
    static getCategoriesTree = async (parentID?: number): Promise<Object> => {
        if (parentID !== undefined) {
            let tagIDs: Array<string> = await DigiKamUtils.getOneTagTreeLevel(parentID);
            let tree: {[key: string]: any} = {};
            if (tagIDs.length > 0) {
                for (let tagID of tagIDs) {
                    let tagLabel: string = await DigiKamUtils.getTagLabelByID(tagID);
                    let subTree = await DigiKamAdapter.getCategoriesTree(parseInt(tagID));
                    tree[tagLabel] = subTree;
                }
            }
            return tree;
        } else {
            // root categories have parentId = 0
            let result = await DigiKamAdapter.getCategoriesTree(0); 
            return result;
        }
    }

    static async getFilesByLabels(labels: Array<string>): 
                                            Promise<Array<FilesByLabelType>> {

        // get files by labels
        logger.debug(`Fetching files with labels [${labels}]`);

        // label -> TagID -> ImageID -> filename, folderID -> filename, folder
        const filenamesAndDirs: Array<FilesByLabelType> = 
                        await DigiKamUtils.getFilesAndFoldersByLabels(labels);
        const albumRootIdentifierPathMap = 
                            await DigiKamUtils.getAlbumRootIdentifierPathMap();

        let validPaths: Array<FilesByLabelType> = [];

        // filter for only files    
        let e: any;
        for (e of filenamesAndDirs) {
            let fileName = e.name;
            let deviceUUID = e.identifier.split("uuid=")[1];
            let devicePath = albumRootIdentifierPathMap[deviceUUID.toLowerCase()];
            
            let dirPath = path.join(devicePath, e.dirPath);

            // workaround white-space escaping for fs.stat
            let filePath = `file://${path.join(dirPath, fileName)}`;
            filePath = url.fileURLToPath(filePath);

            try {
                const stats = await fs.stat(filePath);
                if (!stats.isDirectory()) validPaths.push(
                    { 
                        fileName: e.name,
                        dirPath: e.dirPath,
                        uuid: deviceUUID
                    }
                );
            } catch (err) {
                logger.error((<any>err).message);
            }

        }

        return validPaths;
    }

    static getDigiKamFiles = async () => {
        const results = await digiKamDB.query(
                    getAllDigiKamFilesQuery, {type: QueryTypes.SELECT});
        return results;
    }
}


class DigiKamUtils {
    
    static getAlbumRootIdentifierPathMap = async () => {
        
        let albumRootIdentifierPathMap: any = {};
        let albumRootIdenfitiers;
        try {
            albumRootIdenfitiers = await DigiKamUtils.getAlbumRootIdentifiers();

            if (!albumRootIdenfitiers || albumRootIdenfitiers.length == 0) 
                throw `No album root identifiers found.`
        } catch (err) {
            logger.error(`Could not fetch DigiKam album root identifiers: ${err}`);
            throw err;
        }

        let albumRootBlockDevicesUUIDs: Array<string> = 
                                <Array<string>> albumRootIdenfitiers?.map(
                                    i => i.split("uuid=")[1].toLowerCase()
                                )

        // get device root path
        try {
            let blockdevides = await si.blockDevices();
            for (let device of blockdevides) {
                let deviceUUID: string = device.uuid.toLowerCase();
                let deviceIdentifier: string = device.identifier;
                if (albumRootBlockDevicesUUIDs.includes(deviceUUID)) {
                    albumRootIdentifierPathMap[deviceUUID] = deviceIdentifier;
                }
            }

            return albumRootIdentifierPathMap;
        } catch (err) {
            logger.error(`Could not fetch block devices UUIDs`);
            throw err;
        }
    }

    static getAlbumRootIdentifiers = async (): Promise<Array<any>> => {
        const result = await digiKamDB.query(
            getAlbumRootsIdentifiersQuery, {type: QueryTypes.SELECT}
        );
        return result.map(label => Object.values(label)[0]);
    }
    
    static getOneTagTreeLevel = async (parentID: number): 
                                                Promise<Array<string>> => {

        const results: any = 
            await digiKamDB.query(getOneTagTreeLevelQuery, {
                replacements: [parentID],
                type: QueryTypes.SELECT
            })

        return results.map((label: any) => Object.values(label)[0])
    }

    static getTagLabelByID = async (tagID: string): Promise<string> => {

        const results = await digiKamDB.query(getTagLabelByIDQuery,
            {
                replacements: [tagID],
                type: QueryTypes.SELECT
            });

        return results.map(label => Object.values(label)[0])[0];
    }

    static getFilesAndFoldersByLabels = async (labels: Array<string>): 
                                        Promise<Array<any>> => {
        const placeholder: string = labels.map(() => "?").join(",");
        const query = DigiKamUtils.getFilesByLabels(placeholder);
        const result = await digiKamDB.query(query, 
            {replacements: [labels], type: QueryTypes.SELECT}
        );
        return result;
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
        `;

        return query;
    }

}

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
`;

const getTagLabelByIDQuery =
    `
select name from Tags
where id = ?
`;

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

export default DigiKamAdapter;
