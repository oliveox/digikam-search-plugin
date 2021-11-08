import { Request, Response } from 'express';
import DigiKamAdapter from '../adapters/digikam/digikam';
import MetadataAdapter from '../adapters/internal/metadata';
import logger from '../config/winston';
import GeneralUtilsService from '../services/generalUtils';
import { MetadataUtilsService } from '../services/metadataUtils';


const search_getmenu = async (req: Request, res: Response) => {
    
    try {
        // get aggregated metadata json
        let metadata = await MetadataAdapter.getAllFileTypeMetadata() as {[key: string]: any};

        // make metadata keys user friendly
        metadata = MetadataUtilsService.makeMetadataUserFriendly(metadata);

        // get DigiKam categories tree
        const DigiKamCategories = await DigiKamAdapter.getCategoriesTree();

        // format response 
        const response = {
            metadata: GeneralUtilsService.jsonToCheckboxTreeStructure(metadata),
            categories: GeneralUtilsService.jsonToCheckboxTreeStructure(DigiKamCategories)
        }

        // return response
        res.json(response);
    } catch (err) {
        logger.error(`${err}`);
        res.status(500).send(`Woops, there is an error`)
    }
}

export default search_getmenu;