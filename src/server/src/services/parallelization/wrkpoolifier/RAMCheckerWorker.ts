import { ThreadWorker } from "poolifier";
import os from 'os';

export interface MyData {
  ok: number;
}

export interface MyResponse {
  message: string;
}

class RAMCheckerWorker extends ThreadWorker<any, Promise<MyResponse>> {
  constructor() {
    super(() => this.process(), {
      maxInactiveTime: 60_000,
      async: true,
    });
  }

  private async process(): Promise<MyResponse> {
    return new Promise((resolve) => {

        setInterval(() => {
            let freeRAM = os.freemem();
            let prevState = process.env.enoughRAM;
            let currentState = 
            freeRAM > 1073741824 || freeRAM > 0.8 * os.totalmem() ? "1" : "0";

            process.env.enoughRAM = currentState;

            if (prevState != currentState) {
                console.log(`Memory status changed. Prev: [${prevState}].
                           Current: [${currentState}]`);    
            }
        }, 500);
    });
  }
}

export default new RAMCheckerWorker();