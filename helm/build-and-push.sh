```bash
#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${REGISTRY:?Set REGISTRY, e.g. export REGISTRY=docker.io/hamzamalik1}"
TAG="${TAG:-1.0.0}"

cd "$(dirname "$0")/.."

build_push() {
  local name="$1"
  local dockerfile="$2"
  local target="${3:-}"
  local context="${4:-backend}"

  echo "========================================"
  echo "Building: $REGISTRY/animethreads-$name:$TAG"
  echo "========================================"

  if [[ -n "$target" ]]; then
    docker build \
      --target "$target" \
      -t "$REGISTRY/animethreads-$name:$TAG" \
      -f "$dockerfile" \
      "$context"
  else
    docker build \
      -t "$REGISTRY/animethreads-$name:$TAG" \
      -f "$dockerfile" \
      "$context"
  fi

  docker push "$REGISTRY/animethreads-$name:$TAG"
}

# Application services
for s in \
  api-gateway \
  auth-service \
  product-service \
  order-service \
  payment-service \
  inventory-service
do
  build_push "$s" "backend/$s/Dockerfile" "runtime"
done

# Services whose Dockerfiles don't have an explicit runtime target
for s in cart-service notification-service; do
  build_push "$s" "backend/$s/Dockerfile"
done

# Prisma migration images
for s in \
  auth-service \
  product-service \
  order-service \
  payment-service \
  inventory-service
do
  build_push "$s-migrator" "backend/$s/Dockerfile" "migrator"
done

# Frontend
build_push "web" "frontend/Dockerfile" "runtime" "frontend"

echo
echo "========================================"
echo "All AnimeThreads images pushed successfully."
echo "Registry: $REGISTRY"
echo "Tag:      $TAG"
echo "========================================"
```

