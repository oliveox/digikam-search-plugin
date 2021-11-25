import { ExpandedTags } from 'exifreader'
import { IAudioMetadata } from 'music-metadata'
import ImageUtils from '../services/fileTypes/image'
import VideoUtils from '../services/fileTypes/video'
import AudioUtils from '../services/fileTypes/audio'
import NotSupportedUtils from '../services/fileTypes/not_supported'

export type FileByType = {
    [key: string]: Array<string>
}

export namespace FManager {
    export enum FileType {
        IMAGE='IMAGE',
        VIDEO='VIDEO',
        AUDIO='AUDIO',
        NOT_SUPPORTED='NOT_SUPPORTED'
    }
}

export type AnalysedFileType = {
    filename: string,
    dirpath: string,
    metadata: JSON,
    fileType: FManager.FileType
}

export type AggregatedMetadataType = {
    fileType: FManager.FileType,
    metadata: JSON
}

export type AnyFileMetadata = {
    extension: string | undefined,

    // audio
    mm?: IAudioMetadata,

    // image
    exif?: ExpandedTags,
    sharp?: JSON,

    // video
    probe?: JSON,
}

export type FileData = {
    data: any,
    type: FManager.FileType
}

export type VideoData = {
    metadata: AnyFileMetadata,
    objects: any // TODO
}

export type ImageData = {
    metadata: AnyFileMetadata,
    objects: Array<string>
}

export type AudioData = {
    metadata: AnyFileMetadata,
    text: string
}

export type NotSupportedFileData = {
    metadata: AnyFileMetadata,
    // text: string
}

export type FilesByType = {
    [key: string]: Array<string>
}

export type FormatedFile = {
    id: number,
    filePath: string,
    hash: string,
    type: FManager.FileType
}

export type FilesByLabelType = {
    fileName: string
    dirPath: string
    uuid: string
}

export const fileTypesList: Array<string> = Object.keys(FManager.FileType)

export const getFileTypeDataFetcher = (fileType: FManager.FileType) => {
	switch (fileType) {
	case FManager.FileType.IMAGE:
		return ImageUtils.getData
	case FManager.FileType.VIDEO:
		return VideoUtils.getData
	case FManager.FileType.AUDIO:
		return AudioUtils.getData
	case FManager.FileType.NOT_SUPPORTED:
		return NotSupportedUtils.getData
	default:
		return NotSupportedUtils.getData
	}
}

// export const mediaTypesList: Array<string> = Object.keys(MediaType).filter(
// k => typeof MediaType[k as any] === "number");
