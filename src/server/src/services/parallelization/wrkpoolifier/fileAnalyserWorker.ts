import { ThreadWorker } from "poolifier";

export interface FileData {
    filePath: string
}

export interface AnalysedFileData {
  metadata: string;
}

export interface MyResponse {
  data: AnalysedFileData
}

class FileAnalyserWorker extends ThreadWorker<FileData, Promise<MyResponse>> {
  constructor() {
    super((data) => this.process(data), {
      maxInactiveTime: 60_000,
      async: true,
    });
  }

  private async process(recievedData: FileData): Promise<MyResponse> {
    return new Promise((resolve) => {

      console.log(`File analyser checking RAM status: ${process.env.enoughRAM}`);

      // wait until RAM is free
      while (process.env.enoughRAM === "0") {
        console.log("Not enough RAM!");
      }

      // process file
      console.log(`Recieved file path: ${recievedData.filePath}`);
      let analysisData: AnalysedFileData = {metadata: recievedData.filePath};

      // return processed data
      resolve({ data: analysisData});
    });
  }
}

export default new FileAnalyserWorker();