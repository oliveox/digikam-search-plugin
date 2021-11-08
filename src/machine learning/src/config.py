import os
from enum import Enum

from dotenv import load_dotenv

load_dotenv()

try:
    VIDEO_FRAME_STEP = int(os.getenv("VIDEO_FRAME_STEP"))
except Exception as ve:
    print(f"Error while reading [VIDEO_FRAME_STEP] parameter. Error: {ve}")

class SUPPORTED_FILE_TYPES(Enum):
    IMAGE = "image"
    VIDEO = "video" 