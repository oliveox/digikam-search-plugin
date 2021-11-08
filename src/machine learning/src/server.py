from flask import Flask, request
import json

import config
import services.machine_learning_utils as ml

app = Flask(__name__)
ml_instance = None

@app.route("/", methods=["POST"])
def analyse():

    file_path: str
    file_type: config.SUPPORTED_FILE_TYPES
    try:
        file_path = request.form["file_path"]
        file_type = request.form["file_type"]

        # TODO - check file_path validity
        # TODO check file_type validity
    except Exception as e:
        message: str = "Error while parsing request parameters."
        print(f"{message} Error: {e}")
        return message, 404

    try:
        if (file_type == config.SUPPORTED_FILE_TYPES.IMAGE.value):
            objects: "list[str]" = ml_instance.get_objects_in_image(file_path)    
            return json.dumps(objects), 200
        if (file_type == config.SUPPORTED_FILE_TYPES.VIDEO.value):
            objects: dict = ml_instance.get_objects_in_video(file_path)
            return json.dumps(objects), 200
    except Exception as e:
        message: str = "Error while analysing file [{file_path}]" \
                                        "of type [{file_type}]"
        print(f"{message}. Error: {e}")
        return message, 404

    return "All good baby!", 200


if __name__ == "__main__":
    ml_instance = ml.MachineLearningUtils()
    app.run()