import { expect } from 'chai'
import { describe, it } from 'mocha'
import FileUtilsService from '../src/services/fileUtils'
import { FManager } from '../src/types/fManagerTypes'

describe('getFileTypeByExtension', () => {
	it('returns the file type by extension', () => {
		expect(FileUtilsService.getFileTypeByExtension('jpg'))
			.to.equal(FManager.FileType.IMAGE)
		expect(FileUtilsService.getFileTypeByExtension('abc'))
			.to.equal(FManager.FileType.NOT_SUPPORTED)
		expect(FileUtilsService.getFileTypeByExtension('mp4'))
			.to.equal(FManager.FileType.VIDEO)
		expect(FileUtilsService.getFileTypeByExtension('mp3'))
			.to.equal(FManager.FileType.AUDIO)
	})
})
