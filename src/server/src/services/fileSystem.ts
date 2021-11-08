import FileType from 'file-type';
import path from 'path';
import logger from '../config/winston';
import { FManager } from '../types/fManagerTypes';
import GeneralUtilsService from './generalUtils';

const fs = require('fs').promises;

class FileSystemService {

    static async getFilesByExtension(dirPath: string, writeToFile: boolean) {

        try {

            logger.info(`Getting all files under [${dirPath}] structured by extension.`);

            let filesByExtension: any = {};
            const filePaths = await FileSystemService.getFilesList(dirPath);

            logger.debug(`Found [${filePaths.length}] files under path [${dirPath}]`);

            for (let filePath of filePaths) {
                let extension = null;
                try {
                    const extAndMime = await FileType.fromFile(filePath);
                    extension = extAndMime ? 
                                extAndMime.ext :
                                GeneralUtilsService.fileTypeEnumToString(
                                    FManager.FileType.NOT_SUPPORTED
                                );
                } catch (err) {
                    extension = GeneralUtilsService.fileTypeEnumToString(
                        FManager.FileType.NOT_SUPPORTED
                    );
                }
                
                if (extension in filesByExtension) {
                    filesByExtension[extension].push(filePath);
                } else {
                    filesByExtension[extension] = [filePath];
                }
            }

            if (writeToFile) {
                const fileName = 'filesByExtension.json';
                fs.writeFile(fileName, JSON.stringify(filesByExtension), 
                            (err: Error) => {
                    if (err) throw err;
                    logger.info(`Files structured by extension where written 
                                to file [${fileName}]!`);
                });
            } else {
                return filesByExtension;
            }

        } catch (err) {
            throw err;
        }
    }

    static getFilesList = async (dirPath: string) => {
        try {
            logger.debug(`Getting files tree under [${dirPath}]`);
            const filesTree = await FileSystemService.getFilesTree(dirPath);

            logger.debug(`Transforming the tree in a list for [${dirPath}]`);
            const filesList = FileSystemService.getTreeAsList(filesTree);

            return filesList;
        } catch (err) {
            throw err;
        }
    }

    static getFilesTree = async (dirPath: string) => {
        try {
            let files = await fs.readdir(dirPath);
            files = await Promise.all(
                files.map(async (file: string) => {
                        const filePath = path.join(dirPath, file);
                        try {
                            const stats = await fs.stat(filePath);
                            if (stats.isDirectory()) return FileSystemService.
                                                        getFilesTree(filePath);
                            else if (stats.isFile()) 
                                return filePath;
                        } catch (err) {
                            logger.warn(`Error reading filysystem stat 
                                        for [${filePath}]`)
                            return;
                        }
                }));
            return files;
        } catch (err) {
            throw err;
        }
    }

    static getTreeAsList(tree: Array<any>) {
        let list: Array<any> = [];
        for (let element of tree) {
            if (typeof(element) === 'object') {
                list = list.concat(FileSystemService.getTreeAsList(element));
            } else {
                list.push(element);
            }
        }

        return list;
    }

    static readFile(filePath: string) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err: Error, data: string) => {
                if (err) reject(err);
                else resolve(data);
            })
        }) 
    }

    static createSymlink = async (source: string, symlinkPath: string) => {
        try {
            await fs.symlink(source, symlinkPath, "file");
        } catch (err) {
            if ((<any>err).code ===  'EEXIST') {
                logger.warn(`File [${source}] already has symlink created`);
            } else {
                throw err;
            }
        }
    }

    static deleteDirectoryContents = async (directory: string) => {
        try {
            const files = await fs.readdir(directory);
            for (const file of files) {
                await fs.unlink(path.join(directory, file));
            }
        } catch (err) {
            throw err;
        }
    }
}   

export default FileSystemService;