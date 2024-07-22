import argparse
import subprocess
import datetime
import requests
import os


def run_or_echo(test_mode, command):
    if test_mode:
        print(' '.join(command))
    else:
        subprocess.run(command, check=True)


def get_new_tag(image, version_tag):
    response = requests.get(
        f"https://hub.docker.com/v2/repositories/{image}/tags/?page_size=100")
    tags = [tag['name'] for tag in response.json()['results']]

    tag = version_tag
    counter = 1
    while tag in tags:
        tag = f"{version_tag}-{counter}"
        counter += 1

    return tag


def get_latest_tag(image):
    response = requests.get(
        f"https://hub.docker.com/v2/repositories/{image}/tags/?page_size=1")
    latest_tag = response.json()['results'][0]['name']
    return latest_tag


def build_and_push_image(image, context, tag, test_mode):
    dockerfile_name = os.path.basename(image).replace('-', '_')
    dockerfile_path = f"dockerfiles/dockerfile_{dockerfile_name}"

    if dockerfile_name == "jawn":
        dockerfile_path = "../valhalla/dockerfile"

    build_command = ["docker", "build", "--platform", "linux/amd64",
                     "-t", f"{image}:{tag}", "-f", dockerfile_path, context]

    run_or_echo(test_mode, build_command)
    run_or_echo(test_mode, ["docker", "push", f"{image}:{tag}"])
    run_or_echo(test_mode, ["docker", "tag",
                f"{image}:{tag}", f"{image}:latest"])
    run_or_echo(test_mode, ["docker", "push", f"{image}:latest"])


def preview_tags(docker_image_context, version_tag):
    for dic in docker_image_context:
        image = dic["image"]
        tag = get_new_tag(image, version_tag)
        print(f"Image: {image}, New Tag: {tag}, Latest Tag: latest")


def print_latest_tags(docker_image_context):
    for dic in docker_image_context:
        image = dic["image"]
        latest_tag = get_latest_tag(image)
        print(f"Image: {image}, Latest Tag: {latest_tag}")


def main(test_mode, dont_prune, preview, latest, custom_tag):
    date = datetime.datetime.now().strftime("%Y.%m.%d")
    version_tag = f"v{date}{f'-{custom_tag}' if custom_tag else ''}"

    docker_image_context = [
        {"image": "helicone/worker", "context": "../worker"},
        {"image": "helicone/web", "context": "../web"},
        {"image": "helicone/web-dev", "context": "../web"},
        {"image": "helicone/supabase-migration-runner", "context": "../supabase"},
        {"image": "helicone/clickhouse-migration-runner", "context": "../clickhouse"},
        {"image": "helicone/jawn", "context": ".."}
    ]

    if preview:
        preview_tags(docker_image_context, version_tag)
        return

    if latest:
        print_latest_tags(docker_image_context)
        return

    if not dont_prune:
        subprocess.run("echo y | docker system prune -a",
                       shell=True, check=True)

    for dic in docker_image_context:
        image = dic["image"]
        context = dic["context"]
        tag = get_new_tag(image, version_tag)
        build_and_push_image(image, context, tag, test_mode)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Build and push Docker images with custom contexts.")
    parser.add_argument("-t", "--test", action="store_true",
                        help="Enable test mode (commands will only be printed)")
    parser.add_argument("--dont-prune", action="store_true",
                        help="Do not prune all images before building and pushing")
    parser.add_argument("-p", "--preview", action="store_true",
                        help="Preview the new tags that would be created")
    parser.add_argument("-l", "--latest", action="store_true",
                        help="Print the latest tag for each image")

    parser.add_argument("-c", "--custom-tag", type=str,
                        help="Custom tag to add to the image")

    args = parser.parse_args()

    main(test_mode=args.test, dont_prune=args.dont_prune,
         preview=args.preview, latest=args.latest, custom_tag=args.custom_tag)
