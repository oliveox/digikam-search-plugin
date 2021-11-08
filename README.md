# Media Files Search (digiKam extension)
Complex searches on digiKam imported media files by:
- digiKam tags
- files metadata (e.g. ISO, FNumber, Exposure time, size, etc.)
- file type (audio, video, image)
- filename
- object detection (coming soon)
- video / audio speech to text (coming soon)

### ! Work in progress !

![Alt Text](resources/demo.gif)

# How to use it
Only `SELECT` queries are made between this project and the DigiKam SQLite database. Thus no modifications are made to the original DigiKam DB.

## Prerequisites
- postgreSQL server >= 14
- ffmpeg
- node >= 12.18
- python >= 3.7

## Install steps
There are 3 servers which have to work simultaneously:
- frontend
- backend
- machine learning server

Run them in background or have 3 active dedicated terminals, your call.

- clone the repo
1. **Frontend**:
	- `cd $REPO_PATH/src/ui/public`
		- create symlink to config folder required to be named `config` (*CONFIG_FOLDER_NAME* in *backend server* `.env`). E.g. for windows: `mklink /D config /path/set/in/backend/env/config`
		- directory symlink creation commands (would probably need priviledges)
			- linux (bash): `ln -s Target Link`
			- windows (CMD): `mklink /D Link Target`
	- `cd $REPO_PATH/src/ui`
	- `npm install typescript`
	- `tsc`
	- `npm install`
	- `npm start`
2. **Backend**
	- `cd $REPO_PATH/src/server`
	- `cp .env.example .env`
	- start a PostgreSQL server and enter the connection data in *.env*
	- enter the other parameters required in *.env*
	- `npm install typescript`
	- `tsc`
	- `npm install`
	- the *sqlite3* npm project (a *sequelize* dependency) comes with high risk vulenrabilities and doesn't get the updates pushed on its github repo. Solution:
		- `git clone https://github.com/mapbox/node-sqlite3.git`
		- `npm install node-sqlite3`
	- `npm start`
3. **Machine learning server**
	- `cd $REPO_PATH/src/machine learning`
	- optional: create a virtualenv 
	- `pip install -r requirements.txt`
	- `pip install -r https://raw.githubusercontent.com/ultralytics/yolov5/master/requirements.txt`
	- `python server.py`
4. **Initialisation**
	- make a *GET* request to *localhost:3001/analyse* to trigger the digiKam DB data import and file analysis. Wait for it to end ...
	- open *localhost:3000*, have fun!

## Functionalities
- search by:
    - media files metadata
    - digikam categories
    - filename
    - media file type
- get search result (as symbolik links) in a path available file manager (e.g.nautilis, explorer etc.)
- upload files from another (non-digikam) path
    - won't have the categories available on it

# Support
- DigiKam tags (also called *categories*) functionality doesn't work if tags contain '`_`' (underscores)
- `Show in file manager` button doesn't normally work on Windows. The default security policy allows only administrators to create symbolic links.

## Operating systems
- Linux (tested on Ubuntu 20.04)
- Windows (tested on Windows 10)

## Why does this repo exist?
- learn / practice nodejs, reactjs and typescript
- trying to integrate some of the DigiKam functionalities in a new platform with extra features

# Contribute
Drop an issue if you have any questions, suggestions or observations. Other not yet implemented cool features I've been thinking about can be found in the TODO file or in code marked with // TODO.

## More about the project
### Architecture
The project works as a combination of 3 servers:
- front-end (UI) - ReactJS
- backend - NodeJS, express
- machine learning server - Python, flask

### More info
- project doesn't modify the DigiKam SQLite database at all
- aggregated metadata per media file type (image, video, audio)
- creates preview gifs from videos using ffmpeg

### Story and ambitions
This project is a merge between 2 other projects of mine:
- [digikam-object-detection-plugin](https://github.com/oliveox/digikam-object-detection-plugin)
- [media-files-search](https://github.com/oliveox/media-files-search)

It aims to introduce (along the already available awesome digiKam features):
- more metadata to search by
- object detection and speech to text powered search abilities

# Credits
- [Digikam](https://www.digikam.org)


