import { DataTypes, Sequelize } from 'sequelize'
import { config } from '../config/config'

export const DigiKamDB = new Sequelize({
	dialect: 'sqlite',
	storage: config.digiKamSQLitePath,
	// logging: console.log
	logging: false
})

export const InternalDB = new Sequelize(
	config.databaseName,
	config.databaseUser,
	config.databasePassword,
	{
		host: config.databaseUri,
		dialect: 'postgres',
		logging: false
	}
)

export const File = InternalDB.define('files', {
	digikam_id: { type: DataTypes.INTEGER, unique: true, allowNull: false },
	hash: { type: DataTypes.STRING, unique: true, allowNull: false },
	dirPath: { type: DataTypes.STRING, unique: false, allowNull: false },
	fileName: { type: DataTypes.STRING, unique: false, allowNull: false },
	deviceUUID: { type: DataTypes.STRING, unique: false, allowNull: false },
	type: DataTypes.ENUM('IMAGE', 'AUDIO', 'VIDEO', 'NOT_SUPPORTED')
})

export const VisualObject = InternalDB.define('objects', {
	name: { type: DataTypes.TEXT, unique: true, allowNull: false }
})

export const Image = InternalDB.define('images', {
	objects: {
		type: DataTypes.ARRAY(DataTypes.INTEGER),
		unique: false,
		allowNull: true
	},
	metadata: { type: DataTypes.JSONB, allowNull: true }
})

export const Video = InternalDB.define('videos', {
	objects: { type: DataTypes.JSONB, unique: false, allowNull: true },
	metadata: { type: DataTypes.JSONB, allowNull: true }
})

export const Audio = InternalDB.define('audios', {
	text: { type: DataTypes.TEXT, unique: false, allowNull: true },
	metadata: { type: DataTypes.JSONB, allowNull: true }
})

export const NotSupported = InternalDB.define('unknowns', {
	metadata: { type: DataTypes.JSONB, allowNull: true }
})

export const Metadata = InternalDB.define('metadata_by_file_type', {
	fileType: {
		// TODO - get media file types from config
		type: DataTypes.ENUM('IMAGE', 'AUDIO', 'VIDEO', 'NOT_SUPPORTED'),
		unique: true,
		allowNull: false,
		validate: { notEmpty: true },
	},
	metadata: {
		type: DataTypes.JSONB,
		allowNull: false,
		validate: { notEmpty: true },
	}
})

export const entities = [Image, Video, Audio, NotSupported]

Image.belongsTo(File)
Video.belongsTo(File)
Audio.belongsTo(File)
NotSupported.belongsTo(File)
