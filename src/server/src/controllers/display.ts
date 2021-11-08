import { Request, Response } from 'express';
import path from 'path';
import { config } from '../config/config';
import logger from '../config/winston';
import FileSystemService from '../services/fileSystem';
import GeneralUtilsService from '../services/generalUtils';


const display_filesystem = async (req: Request, res: Response) => {

    if (req.body.constructor === Array && req.body.length === 0) 
        res.status(500).send(`No file paths recieved to open in file system`);
    
    const filePaths = JSON.parse(req.body);
    logger.debug(`Received [${filePaths}] to create symlinks for and open them in filesystem.`);

    try {
        const displayPath = config.displayFolderPath;

        // wipe out everything in the display folder
        await FileSystemService.deleteDirectoryContents(displayPath);

        // iterate through all files and create symlinks for each one of them
        for (let filePath of filePaths) {
            let filename = path.basename(filePath);
            let targetPath = path.join(displayPath, filename);
            await FileSystemService.createSymlink(filePath, targetPath);
        }

        // open the dispaly folder in desired file manager
        const openFileManagerCommand = `${config.fileManager} ${displayPath}`;
        await GeneralUtilsService.executeProcess(openFileManagerCommand);

        res.send("ok");
    } catch (err) {
        logger.error(`${err}`);
        res.status(500).send(`Woops, there is an error: ${err}`)
    }
}

export default display_filesystem;