# AnimeThreads Helm chart

Deploys the Next.js frontend, 8 Node microservices, Postgres and Redis into the
`animethreads` namespace. The chart refuses to install into `default`.

## 1. Cluster prerequisites (once per cluster)
- ingress-nginx (for the Ingress)
- metrics-server (for the HPAs)
- A default StorageClass (Postgres uses a PersistentVolumeClaim). On kind, `standard` exists already.

Check: `kubectl get storageclass`

## 2. Build and push images (manual, before install)
Each DB-backed service needs two images: the runtime image and a `-migrator` image
(used by the init container that runs the prisma migration).

    cd ~/DevOps-Entire-project-A_Z
    REG=docker.io/hamzamalik1

    # runtime images
    for s in api-gateway auth-service product-service order-service payment-service inventory-service; do
      docker build --target runtime -t $REG/animethreads-$s:latest -f backend/$s/Dockerfile backend
      docker push $REG/animethreads-$s:latest
    done
    for s in cart-service notification-service; do
      docker build -t $REG/animethreads-$s:latest -f backend/$s/Dockerfile backend
      docker push $REG/animethreads-$s:latest
    done
    docker build --target runtime -t $REG/animethreads-web:latest -f frontend/Dockerfile frontend
    docker push $REG/animethreads-web:latest

    # migrator images
    for s in auth-service product-service order-service payment-service inventory-service; do
      docker build --target migrator -t $REG/animethreads-$s-migrator:latest -f backend/$s/Dockerfile backend
      docker push $REG/animethreads-$s-migrator:latest
    done

The registry and tag are set in `animethreads/values.yaml` (`global.imageRegistry`, `global.imageTag`).

## 3. Install / upgrade
    helm upgrade --install animethreads ./animethreads -n animethreads --create-namespace \
      --timeout 15m \
      --set secrets.jwtSecret="<same value every time>"

The first install takes a few minutes because Helm waits for the seed Job. Do not press Ctrl+C.
Watch progress in another terminal:  `kubectl -n animethreads get pods -w`

## What is automated
- Migrations: each DB-backed service has a `migrate` init container (waits for Postgres, then
  runs prisma). No hook Jobs.
- Catalog seeding: the `seed-catalog` hook Job (templates/seed-catalog.yaml) runs
  scripts/reseed-catalog.js after install/upgrade. It skips if the real artwork is already loaded.
  If you edit the script, re-copy it into the chart:

      cp ../scripts/reseed-catalog.js animethreads/files/reseed-catalog.js

- Postgres data: stored on a PersistentVolumeClaim (`postgres.persistence.enabled: true`),
  so it survives pod restarts.

## Open the app
    kubectl -n animethreads port-forward --address 0.0.0.0 svc/web 3000:3000

Stop all forwards: `pkill -f "kubectl port-forward"`
(On EC2, allow inbound TCP 3000 in the security group.)

## Troubleshooting
- Pods in `Init:ImagePullBackOff`: a `-migrator` image is missing from the registry (step 2).
- Seed Job logs `waiting for product-service` forever: the database was wiped after the
  services migrated. Restart them so the init containers migrate again:

      kubectl -n animethreads rollout restart deploy auth-service product-service order-service payment-service inventory-service

- Seed Job logs: `kubectl -n animethreads logs job/seed-catalog`
- `helm upgrade` says STATUS failed: just run the upgrade again. If it says another operation is
  in progress, run `helm rollback animethreads -n animethreads`.
- Changing Postgres volume settings requires deleting the StatefulSet first
  (`kubectl -n animethreads delete statefulset postgres`), which wipes the data.
