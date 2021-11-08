import json
import cv2
import torch

import config


class MachineLearningUtils:

    object_detect_model = None
    audio_analyzer = None

    def __init__(self):
        self.object_detect_model = torch.hub.load(
            'ultralytics/yolov5', 'yolov5x', pretrained=True
        )

    def get_objects_in_image(cls, image) -> "list[str]":
        # image can be filepath or a frame

        results = cls.object_detect_model(image)            

        if results is None:
            print(f'Could not fetch objects for {image}')
            return []
        
        json_data = json.loads(results.pandas().xyxy[0].to_json(orient="records"))
        return list(set(map(lambda x: x["name"], json_data)))

    def get_objects_in_video(cls, video_path) -> dict:
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        video_objects_frame_map: dict = {}
        for fno in range(0, total_frames, config.VIDEO_FRAME_STEP):
            cap.set(cv2.CAP_PROP_POS_FRAMES, fno)
            _, image = cap.read()

            image_objects = cls.get_objects_in_image(image)

            if len(image_objects) > 0:
                for object in image_objects:
                    if object in video_objects_frame_map:
                # TODO - create structure type for video_object_frame_map
                        video_objects_frame_map[object].append(fno)
                    else:
                        video_objects_frame_map[object] = [fno]

        return video_objects_frame_map
