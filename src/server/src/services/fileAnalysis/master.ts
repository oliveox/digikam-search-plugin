import path from 'path';
import Piscina from 'piscina';
import logger from '../../config/winston';
import { FileData } from '../../types/fManagerTypes';

const workerFilename = "worker.js";
const forks = require('os').cpus().length

const piscina = new Piscina({
    filename: path.resolve(__dirname, workerFilename),
    minThreads: 1,
    maxThreads: 12,
    // idleTimeout: 1000,
});

const parallelExtractFileData = async (filePaths: Array<string>) => {
    let filesData: Array<FileData> = [];

    // let fileType: string;   
    let tasks: Array<any> = [];

    try {
        // populate tasks
        for (let filePath of filePaths) {
            tasks.push(piscina.runTask({filePath}));
        }

        // wait for tasks to be finished
        filesData = await Promise.all(tasks);
    } catch (err) {
        logger.error(`Error during parallel file data extarction: ${err}`);
    }
    
    return filesData;
}   

export default parallelExtractFileData;