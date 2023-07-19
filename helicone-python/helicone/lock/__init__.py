import json
import os
import lockfile


class HeliconeLockManager:
    DIR_PATH = os.path.expanduser("~/.helicone")
    LOCKFILE_PATH = os.path.join(DIR_PATH, "custom_properties.json.lock")
    JSON_PATH = os.path.join(DIR_PATH, "custom_properties.json")

    @staticmethod
    def check_files():
        os.makedirs(HeliconeLockManager.DIR_PATH, exist_ok=True)
        with lockfile.LockFile(HeliconeLockManager.LOCKFILE_PATH):
            if not os.path.exists(HeliconeLockManager.JSON_PATH):
                with open(HeliconeLockManager.JSON_PATH, 'w') as json_file:
                    json.dump({}, json_file)

    @staticmethod
    def write_custom_property(property_name, value):
        HeliconeLockManager.check_files()
        with lockfile.LockFile(HeliconeLockManager.LOCKFILE_PATH):
            with open(HeliconeLockManager.JSON_PATH, "r") as json_file:
                properties = json.load(json_file)

            properties[property_name] = value

            with open(HeliconeLockManager.JSON_PATH, "w") as json_file:
                json.dump(properties, json_file)

    @staticmethod
    def clear_all_properties():
        HeliconeLockManager.check_files()
        with lockfile.LockFile(HeliconeLockManager.LOCKFILE_PATH):
            with open(HeliconeLockManager.JSON_PATH, "w") as json_file:
                json.dump({}, json_file)

    @staticmethod
    def remove_custom_property(property_name):
        HeliconeLockManager.check_files()
        with lockfile.LockFile(HeliconeLockManager.LOCKFILE_PATH):
            with open(HeliconeLockManager.JSON_PATH, "r") as json_file:
                properties = json.load(json_file)

            if property_name in properties:
                del properties[property_name]

                with open(HeliconeLockManager.JSON_PATH, "w") as json_file:
                    json.dump(properties, json_file)


HeliconeLockManager.check_files()
