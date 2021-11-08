import { Request, Response } from 'express';
import { File } from '../adapters/dbConnections';
import FileAdapter from '../adapters/internal/file';
import logger from '../config/winston';
import FileUtilsService from '../services/fileUtils';


const gallery_index = async (req: Request, res: Response) => {

    try {
        let files = await File.findAll();

        // filter media paths and format response
        files = await FileUtilsService.getUISupportedFiles(files);
        
        res.json(files);
    } catch (err) {
        logger.error(`${err}`);
        res.status(500).send(`Woops, there is an error!`)
    }
}

const gallery_search =  async (req: Request, res: Response) => {

    try {
        const searchData = JSON.parse(req.body);
        let filePaths = await FileAdapter.getFilesBySearch(searchData);
        filePaths = await FileUtilsService.getUISupportedFiles(filePaths);
        res.json(filePaths);
    } catch (err) {
        logger.error(`${err}`)
        res.status(500).send(`Woops, there is an error: ${err}`)
    }
}

export = {
    gallery_index, 
    gallery_search
}