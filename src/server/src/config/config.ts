import { BinaryToTextEncoding } from 'crypto'

require('dotenv').config()

// find .env when run from other place than project root
const envPath = process.env.ENV_PATH
if (envPath) {
	require('dotenv').config({ path: envPath })
}

type ServerConfigurationType = {
    port: string,
    // mediaRootPath: string
    databaseUri: string
    databaseName: string
    databaseUser: string
    databasePassword: string
    digiKamSQLitePath: string,

    displayedMetadata: {[key: string]: any}

    supportedFileTypeExtensions: {[key: string]: Array<string>}

    metadataToBeRemoved: {[key: string]: Array<string>}

    UiSupportedExtensions: Array<string>

    fileTypes: Array<string>

    encoding: BinaryToTextEncoding
    algorithm: string
    str: string

    videoStartPosition: number
    videoAnalyseLength: number,

    configFolderPath: string,
    displayFolderPath: string,

    fileManager: string,
    configFolderName: string,

    digiKamObjectRootTagName: string,
    digiKamRootTagPid: number,

	queriesArraySeparator: string
}

export const config: ServerConfigurationType = {
	// env vars
	port: process.env.SERVER_PORT ? process.env.SERVER_PORT : '',
	// mediaRootPath: process.env.MEDIA_ROOT_PATH ? process.env.MEDIA_ROOT_PATH : "",
	databaseUri: process.env.DATABASE_URI ? process.env.DATABASE_URI : '',
	databaseName: process.env.DATABASE_NAME ? process.env.DATABASE_NAME : '',
	databaseUser: process.env.DATABASE_USER ? process.env.DATABASE_USER : '',
	databasePassword: process.env.DATABASE_PASSWORD ? process.env.DATABASE_PASSWORD : '',
	digiKamSQLitePath: process.env.DIGIKAM_SQLITE_DB_PATH ? process.env.DIGIKAM_SQLITE_DB_PATH : '',

	// config folder path
	configFolderPath: process.env.CONFIG_FOLDER_PATH ? process.env.CONFIG_FOLDER_PATH : '/tmp',

	displayFolderPath: process.env.DISPLAY_FOLDER_PATH ? process.env.DISPLAY_FOLDER_PATH : '/tmp/display',

	fileManager: process.env.FILE_MANAGER ? process.env.FILE_MANAGER : 'explorer',

	configFolderName: process.env.CONFIG_FOLDER_NAME ? process.env.CONFIG_FOLDER_NAME : 'config',

	// non-env vars
	displayedMetadata: {
		/*
            Dict elements format
            < "json.path.in.jpg.exif" : "property associated name that will appear in UI" >
        */

		IMAGE: {
			extension: 'extension',
			'sharp.width': 'width',
			'sharp.height': 'height',
			'exif.image.Make.description': 'camera brand',
			'exif.image.Model.description': 'camera model',
			'exif.exif.ExposureTime.description': 'exposure time',
			'exif.exif.FNumber.description': 'focal ratio',
			'exif.exif.ISOSpeedRatings.description': 'ISO',
			// "exif.exif.DateTime.description" : "creation date",
			'exif.exif.FocalLength.description': 'focal length'
		},
		VIDEO: {
			extension: 'extension',
			'probe.format.duration': 'duration',
			'probe.format.size': 'size',
			'probe.tags.creation_time': 'creation date'
		},
		AUDIO: {
			extension: 'extension',
			'mm.common.genre.0': 'genre',
			'mm.common.bitrate.0': 'bitrate',
			'mm.common.duration.0': 'duration',
			'mm.common.sampleRate.0': 'sample rate'
		},
		NOT_SUPPORTED: {
			extension: 'extension'
		}
	},

	// metadata to be remove from files before persisting
	metadataToBeRemoved: {
		IMAGE: [
			'exif.exif.PrintIM',
			'exif.exif.PanasonicTitle',
			'exif.exif.PanasonicTitle2',
			'exif.exif.MakerNote',
			'sharp.exif',
			'sharp.delay',
			'exif.exif.undefined',
			'exif.exif.UserComment',
			'sharp.xmp',
			'exif.icc.Profile Creator',
			'exif.icc.ICC Description',
			'exif.icc.Preferred CMM type',
			'exif.icc.Primary Platform',
			'exif.icc.Device Manufacturer'
		],
		VIDEO: [

		],
		AUDIO: [
			'mm.native.ID3v2.4.4'
		]
	},

	// file extensions that can be displayed on the UI
	UiSupportedExtensions: [

		// images
		'apng', 'bmp',
		'gif', 'ico',
		'cur', 'jpg',
		'jpeg', 'jfif',
		'pjpeg', 'pjp',
		'png', 'svg',
		'tif', 'tiff',
		'webp',

		// video
		'mp4', 'mts', 'm4v', 'avi',
		'mov', 'mpeg', '3gp', 'mkv',
		'flv', 'wmv',

		// audio
		'mp3', 'wav', 'm4a', 'aac', 'wma', 'opus', 'amr'
	],

	// TODO - useless at the moment
	supportedFileTypeExtensions: {
		IMAGE: ['jpg', 'png', 'gif', 'rw2', 'bmp', 'webp'],
		VIDEO: [
			'mp4', 'mts', 'm4v', 'avi',
			'mov', 'mpeg', '3gp', 'mkv',
			'flv'
		],
		AUDIO: ['mp3', 'wav', 'm4a', 'aac', 'wma', 'opus', 'amr']
	},

	fileTypes: ['image', 'video', 'audio', 'not_supported'],

	// checksum config
	encoding: 'hex',
	algorithm: 'sha256',
	str: 'utf8',

	// video time (seconds) gif thumbnail configs
	videoStartPosition: 0,
	videoAnalyseLength: 2,

    digiKamRootTagPid: 0,
	digiKamObjectRootTagName: 'objects',
	
	// query
	queriesArraySeparator: ', '
}
