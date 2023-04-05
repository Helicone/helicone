build-base:
	docker build --no-cache -t helicone/base .

images:
	build-base
	build-web
	build-worker

build-web:
	docker build --no-cache -t helicone/web -f ./web/Dockerfile .

build-worker:
	docker build --no-cache -t helicone/worker -f ./worker/Dockerfile .