DOCKER_DEFAULT_PLATFORM=linux/amd64 docker compose build --no-cache
docker tag connector-brief devhanif/brief:v0.1.5
docker push devhanif/brief:v0.1.5   

# docker buildx build --platform linux/amd64 --no-cache  -t devhanif/brief:v0.1.5 --push .