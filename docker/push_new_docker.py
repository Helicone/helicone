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

def main(test_mode):
    subprocess.run("echo y | docker system prune -a", shell=True, check=True)
    date = datetime.datetime.now().strftime("%Y.%m.%d")
    version_tag = f"v{date}"

    docker_image_context = [
        # {"image": "helicone/worker", "context": "../worker"},
        {"image": "helicone/web", "context": "../web"},
        {"image": "helicone/supabase-migration-runner", "context": "../supabase"},
        {"image": "helicone/clickhouse-migration-runner", "context": "../clickhouse"}
        # {"image": "helicone/jawn", "context": "../valhalla"}
    ]

    for dic in docker_image_context:
        image = dic["image"]
        context = dic["context"]
        
        response = requests.get(f"https://hub.docker.com/v2/repositories/{image}/tags/?page_size=100")
        tags = [tag['name'] for tag in response.json()['results']]

        tag = version_tag
        counter = 1
        while tag in tags:
            tag = f"{version_tag}-{counter}"
            counter += 1

        dockerfile_name = os.path.basename(image).replace('-', '_')
        
        # Adjust the Dockerfile path according to the special case for "jawn"
        if dockerfile_name == "jawn":
            dockerfile_path = "../valhalla/dockerfile"  # Assuming the Dockerfile is directly in the context directory for "jawn"
        else:
            dockerfile_path = f"dockerfiles/dockerfile_{dockerfile_name}"

        build_command = ["docker", "build", "--platform", "linux/amd64", "-t", f"{image}:{tag}", "-f", dockerfile_path, context]

        run_or_echo(test_mode, build_command)
        run_or_echo(test_mode, ["docker", "push", f"{image}:{tag}"])
        run_or_echo(test_mode, ["docker", "tag", f"{image}:{tag}", f"{image}:latest"])
        run_or_echo(test_mode, ["docker", "push", f"{image}:latest"])

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build and push Docker images with custom contexts.")
    parser.add_argument("-t", "--test", action="store_true", help="Enable test mode (commands will only be printed)")
    args = parser.parse_args()

    main(test_mode=args.test)
