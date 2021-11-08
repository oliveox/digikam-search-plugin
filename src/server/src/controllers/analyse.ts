import { Request, Response } from 'express';
import logger from '../config/winston';
import { analyseInternalDBFiles } from '../services/analyse';
import { importDigiKamFileData } from '../services/digikamImport';

export const analyseFiles = async (req: Request, res: Response) => {
    try {
        logger.info("Importing digiKam files");
        await importDigiKamFileData();

        logger.info("Analysing imported files");
        await analyseInternalDBFiles();
        
        logger.info("Files successfully imported and analysed");
        res.send("Files successfully imported and analysed");
    } catch (err) {
        logger.error(`${err}`);
        res.status(500).send(`Woops, there is an error`)
    }
}