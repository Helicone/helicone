import json
import os
import lockfile


class HeliconeLockManager:
    LOCKFILE_PATH = os.path.expanduser(
        "~/.helicone/custom_properties.json.lock")
    JSON_PATH = os.path.expanduser("~/.helicone/custom_properties.json")

    @staticmethod
    def write_custom_property(property_name, value):
        with lockfile.LockFile(HeliconeLockManager.LOCKFILE_PATH):
            if os.path.exists(HeliconeLockManager.JSON_PATH):
                with open(HeliconeLockManager.JSON_PATH, "r") as json_file:
                    properties = json.load(json_file)
            else:
                properties = {}

            properties[property_name] = value

            with open(HeliconeLockManager.JSON_PATH, "w") as json_file:
                json.dump(properties, json_file)

    @staticmethod
    def clear_all_properties():
        with lockfile.LockFile(HeliconeLockManager.LOCKFILE_PATH):
            with open(HeliconeLockManager.JSON_PATH, "w") as json_file:
                json.dump({}, json_file)

    @staticmethod
    def remove_custom_property(property_name):
        with lockfile.LockFile(HeliconeLockManager.LOCKFILE_PATH):
            if os.path.exists(HeliconeLockManager.JSON_PATH):
                with open(HeliconeLockManager.JSON_PATH, "r") as json_file:
                    properties = json.load(json_file)

                if property_name in properties:
                    del properties[property_name]

                    with open(HeliconeLockManager.JSON_PATH, "w") as json_file:
                        json.dump(properties, json_file)
