# AnimeThreads Helm chart

## Install
    helm upgrade --install animethreads ./animethreads -n animethreads --create-namespace \
      --set global.imageRegistry=docker.io/YOUR_USER \
      --set secrets.jwtSecret="$(openssl rand -hex 32)"

## Manual step after install: seed the product catalog
The database starts with placeholder images (placehold.co). Run this once after install,
and again any time the postgres pod restarts (it uses emptyDir, so data is lost):

    pkill -f "kubectl port-forward"
    kubectl -n animethreads port-forward svc/api-gateway 8000:8000 >/tmp/pf-api.log 2>&1 &
    sleep 3
    cd ~/DevOps-Entire-project-A_Z && node scripts/reseed-catalog.js
    pkill -f "kubectl port-forward"

Expected output: `Seeded 22/22 products with generated merch art`

## Open the app
    kubectl -n animethreads port-forward --address 0.0.0.0 svc/web 3000:3000
