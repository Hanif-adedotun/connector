DOCKER_DEFAULT_PLATFORM=linux/amd64 docker compose build
docker tag connector-brief devhanif/brief:v0.1.6
docker push devhanif/brief:v0.1.6  

# docker buildx build --platform linux/amd64 --no-cache  -t devhanif/brief:v0.1.5 --push .

#  ssh -L 6379:localhost:6379 hanif@155.133.23.94