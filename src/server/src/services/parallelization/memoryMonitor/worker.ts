import os from 'os';
import logger from '../../../config/winston';

const updateRAMmemoryStatus = () => {
    /*
        Enough memory condition

        freeRAM > 1GB OR freeRam > 80% * TotalRam
    */

    const freeRAM = os.freemem();
    process.env.enoughRAM = freeRAM > 1073741824 || freeRAM > 0.8 * os.totalmem() ? "1" : "0";
    logger.debug(`Enough memory: [${process.env.enoughRAM}]`);
}

export default updateRAMmemoryStatus;