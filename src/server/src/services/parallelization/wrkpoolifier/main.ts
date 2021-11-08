import { FixedThreadPool, DynamicThreadPool } from 'poolifier';
import path from 'path';
import os from 'os';

// a fixed thread pool
const analyser = new FixedThreadPool(4,
  path.join(__dirname, 'fileAnalyserWorker.js'),
  { errorHandler: (e) => console.error(e),
    onlineHandler: () => console.log('file analser worker is online') }
);

const RAMupdater = new FixedThreadPool(1,
    path.join(__dirname, 'RAMCheckerWorker.js'),
    { errorHandler: (e) => console.error(e),
      onlineHandler: () => console.log('RAM checker worker is online') }
  );

// analyser.emitter.on('FullPool', () => console.log('File analyser Pool is full'));
// RAMupdater.emitter.on('FullPool', () => console.log('RAM checker Pool is full'));
let analysedFileData: Array<any> = [];

RAMupdater.execute({});

analyser.execute({filePath: "a/b/c"})
.then(res => {
    console.log(`Recieved result from file analyzer: ${JSON.stringify(res)}`);
    analysedFileData.push(res);
})

setInterval(() => {
    let freeRAM = os.freemem();
    let prevState = process.env.enoughRAM;
    let currentState = freeRAM > 1073741824 || freeRAM > 0.8 * os.totalmem() ? "1" : "0";

    process.env.enoughRAM = currentState;

    if (prevState != currentState) {
        console.log(`Memory status changed. Prev: [${prevState}]. Current: [${currentState}]`);    
    }

    if (currentState === "1" && process.env.persistingData === "0") {
        
        // set persisting flag
        process.env.persistingData = "1";

        // persist analyse file data
        

        // reset analysed file data array
        process.env.persistingData = "0";
        analysedFileData = [];
    }
}, 500);


setTimeout(() => {
    analyser.destroy();
    RAMupdater.destroy();
}, 3000);

