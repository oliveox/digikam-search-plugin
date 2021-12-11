import React from 'react';

type MediaUnit = {
    type: string,
    thumbnailPath: string,
    filePath: string
}

type MediaUnits = {
    mediaUnits: Array<MediaUnit>
}

export default function Gallery (props: MediaUnits) {
    const gallery = (
            <div className="row text-center text-lg-left">
            {
                props.mediaUnits.map(mediaUnit =>
                    {
                        let mediaType = mediaUnit.type;
                        let thumbnailPath = mediaUnit.thumbnailPath;
                        
                        switch(mediaUnit.type) {
                            case "AUDIO":
                                thumbnailPath = "audio_thumbnail.png";                                
                                break;
                            case "IMAGE":
                            case "VIDEO":
                                break;
                            default:
                                thumbnailPath = "not_supported.png";
                                break;
                        }

                        if (thumbnailPath) {
                            thumbnailPath = `${process.env.PUBLIC_URL}${thumbnailPath}`
                        }

                        return (
                            <div className="col-lg-3 col-md-4 col-6">
                                <a href="#" className="d-block mb-4 h-100">
                                    <img 
                                        className="img-fluid img-thumbnail" 
                                        src={encodeURI(thumbnailPath)} 
                                        alt={mediaType}
                                    />
                                </a>
                            </div>
                        );
                    }
                )
            }
            </div>
    );

    return gallery;                
}
