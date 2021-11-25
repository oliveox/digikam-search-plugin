import { FormatedFile } from '../../../types/fManagerTypes'
import FileService from '../../fileService'

const fileAnalysisWorker = async (file: FormatedFile) => {
    const fileData: any = await FileService.extractFileData(file)
    return fileData
}

export default fileAnalysisWorker
