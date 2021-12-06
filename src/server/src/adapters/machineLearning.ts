import { FManager } from '../types/fManagerTypes'
import { config } from '../config/config'
const FormData = require('form-data')
const axios = require('axios').default

export async function getObjectsInMediaFile (filePath: string, fileType: FManager.FileType) {
	const form = new FormData()
	form.append('file_path', filePath)
	form.append('file_type', fileType.toLowerCase()) // TODO - make lower case both in python and nodejs
	const response = await axios.post(
		getMachineLearningServerURL()
		, form
		, { headers: form.getHeaders() }
	)

	if (response.status !== 200) {
		throw new Error(`Failed to fetch objects for [${fileType}] file: [${filePath}]. 
                         Response: ${JSON.stringify(response)}`)
	}

	return response.data
}

function getMachineLearningServerURL () {
	return `http://${config.mlServerIP}:${config.mlServerPort}`
}
