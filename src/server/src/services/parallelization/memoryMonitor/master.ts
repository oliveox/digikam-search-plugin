import path from 'path';
import Piscina from 'piscina';
import { SHARE_ENV } from 'worker_threads';
import logger from '../../../config/winston';
const EventEmitter = require('events');

const workerFilename = "worker.js";

const piscina = new Piscina({
    filename: path.resolve(__dirname, workerFilename),
    minThreads: 1,
    maxThreads: 1,
    env: SHARE_ENV 
});

const spawnRAMmemoryChecker = async () => {

    logger.debug(`Monitoring RAM memory ... `);
    try {
        const ee = new EventEmitter();
        for (let i = 0; i <= 10; i++) {
            await piscina.runTask("", ee);
            logger.debug(`Has enough RAM: [${process.env.enoughRAM}]`);
        }

        logger.debug('Aborting RAM analysis ... ');6
        ee.emit('abort');

    } catch (err) {
        logger.error(`Spawn RAM checker error: [${err}]`);
    }
}

export default spawnRAMmemoryChecker;