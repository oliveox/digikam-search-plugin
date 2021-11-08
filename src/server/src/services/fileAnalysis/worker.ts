import { FormatedFile } from '../../types/fManagerTypes';
import FileService from '../fileService';

const fileAnalysisWorker = async (file: FormatedFile) => {
    try {
        const fileData: any = await FileService.extractFileData(file);
        return fileData;
    } catch (err) {
        throw err;
    }
}

export default fileAnalysisWorker;