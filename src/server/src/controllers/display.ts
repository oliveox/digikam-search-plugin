import { Request, Response } from 'express'
import path from 'path'
import { config } from '../config/config'
import logger from '../config/winston'
import FileSystemService from '../services/fileSystem'
import GeneralUtilsService from '../services/generalUtils'

export default async function displayInFileExplorer (
	req: Request, res: Response): Promise<void> {
	const filePaths: Array<string> = JSON.parse(req.body)

	if (!(filePaths?.length > 0)) {
		throw new Error('No file paths recieved to open in file explorer')
	}

	logger.debug(
		`Received [${filePaths}] to create symlinks for 
		and open them in filesystem.`
	)

	try {
		const displayPath = config.displayFolderPath

		// wipe out everything in the display folder
		await FileSystemService.deleteDirectoryContents(displayPath)

		// iterate through all files and create symlinks for each one of them
		for (const filePath of filePaths) {
			const filename = path.basename(filePath)
			if (!filename) {
				throw new Error(
					`Could not determine filename for file path: [${filePath}]`
				)
			}

			const targetPath = path.join(displayPath, filename)
			await FileSystemService.createSymlink(filePath, targetPath)
		}

		// open the dispaly folder in desired file manager
		const openFileManagerCommand = `${config.fileManager} ${displayPath}`
		await GeneralUtilsService.executeProcess(openFileManagerCommand)

		res.send('ok')
	} catch (err) {
		logger.error(`${err}`)
		res.status(500).send(`Woops, there is an error: ${err}`)
	}
}
