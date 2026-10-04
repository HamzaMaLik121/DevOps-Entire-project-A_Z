# AnimeThreads on Kubernetes (Helm + ArgoCD + Prometheus/Grafana)

Next.js frontend, 8 Node microservices, Postgres and Redis, deployed with one Helm chart.
ArgoCD deploys it from git, and kube-prometheus-stack monitors it.

## Repo layout
    helm/animethreads/          Helm chart (values.yaml drives all 9 workloads)
    helm/build-and-push.sh      builds and pushes runtime and migrator images
    argocd/values.yaml          ArgoCD install settings
    argocd/application.yaml     ArgoCD Application for the shop (path: helm/animethreads)
    argocd/metrics-server.yaml  ArgoCD Application for metrics-server (needed by HPAs)
    argocd/kube-prometheus-stack.yaml  ArgoCD Application for Prometheus + Grafana
    monitoring/values.yaml      Prometheus/Grafana settings

## 0. Host prerequisite (kind on EC2)
Raise inotify limits, or pods crash with "too many open files":
    printf "fs.inotify.max_user_instances=1024\nfs.inotify.max_user_watches=524288\n" | sudo tee /etc/sysctl.d/99-kind.conf
    sudo sysctl --system

## 1. Build and push images (before the first deploy)
Each DB-backed service needs a runtime image AND a `-migrator` image (used by the init container).
    REGISTRY=docker.io/hamzamalik1 TAG=latest ./helm/build-and-push.sh
Migrator images only:
    for s in auth-service product-service order-service payment-service inventory-service; do
      docker build --target migrator -t docker.io/hamzamalik1/animethreads-$s-migrator:latest -f backend/$s/Dockerfile backend
      docker push docker.io/hamzamalik1/animethreads-$s-migrator:latest
    done
Without the migrator images pods stay in `Init:ImagePullBackOff`.

## 2. Install ArgoCD (once per cluster)
    helm repo add argo https://argoproj.github.io/argo-helm
    helm repo update
    helm upgrade --install argocd argo/argo-cd -n argocd --create-namespace -f argocd/values.yaml
    kubectl -n argocd rollout status deploy argocd-server

## 3. Deploy everything through ArgoCD
Push to GitHub first (ArgoCD reads from git, not from disk), then:
    kubectl apply -f argocd/metrics-server.yaml
    kubectl apply -f argocd/application.yaml
    kubectl apply -f argocd/kube-prometheus-stack.yaml
    kubectl -n argocd get applications
All three should become Synced / Healthy. From now on, deploys happen by `git push`.
Do not run `helm upgrade` on the animethreads release by hand.

Manual Helm install (without ArgoCD):
    helm upgrade --install animethreads ./helm/animethreads -n animethreads --create-namespace --timeout 15m

## What is automated (do NOT do these by hand)
- Prisma migrations: init container `migrate` in each DB service pod
  (order: wait-postgres, wait-redis, migrate, then the app starts).
- Product catalog seed: hook Job `seed-catalog` (templates/seed-catalog.yaml, runs after sync).
  It skips if the real catalog is already loaded. If you edit scripts/reseed-catalog.js, re-copy it:
      cp scripts/reseed-catalog.js helm/animethreads/files/reseed-catalog.js
- Postgres data lives on a PersistentVolumeClaim, so pod restarts keep the data.
- Autoscaling: HPAs on all 9 apps; they need metrics-server (argocd/metrics-server.yaml).

If the database volume was ever deleted (empty DB), re-sync the app and restart the DB services:
    kubectl -n animethreads rollout restart deploy auth-service product-service order-service payment-service inventory-service

## Access (port-forwards, run on the EC2 box)
    pkill -f "kubectl.*port-forward"
    nohup kubectl -n animethreads port-forward --address 0.0.0.0 svc/web 3000:3000 >/tmp/pf-web.log 2>&1 &
    nohup kubectl -n argocd port-forward --address 0.0.0.0 svc/argocd-server 8080:80 >/tmp/pf-argocd.log 2>&1 &
    nohup kubectl -n monitoring port-forward --address 0.0.0.0 svc/kube-prometheus-stack-prometheus 9090:9090 >/tmp/pf-prom.log 2>&1 &
    nohup kubectl -n monitoring port-forward --address 0.0.0.0 svc/kube-prometheus-stack-grafana 3030:80 >/tmp/pf-grafana.log 2>&1 &

| App | URL | Login |
|---|---|---|
| Shop | http://<EC2_PUBLIC_IP>:3000 | none |
| ArgoCD | http://<EC2_PUBLIC_IP>:8080 | admin |
| Grafana | http://<EC2_PUBLIC_IP>:3030 | admin |
| Prometheus | http://<EC2_PUBLIC_IP>:9090 | none |

The EC2 public IP changes on stop/start. Open ports 3000, 8080, 9090, 3030 in the security group,
or tunnel over SSH instead and use localhost:
    ssh -i <key>.pem -L 3000:localhost:3000 -L 8080:localhost:8080 -L 9090:localhost:9090 -L 3030:localhost:3030 ubuntu@<EC2_PUBLIC_IP>
Forwards die when a pod behind them is replaced or the machine reboots: rerun the commands above.

## Passwords (never commit them)
ArgoCD initial password:
    kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
Reset the ArgoCD admin password if login fails:
    sudo apt-get install -y apache2-utils
    HASH=$(htpasswd -nbBC 10 "" '<NEW_PASSWORD>' | tr -d ':\n' | sed 's/$2y/$2a/')
    kubectl -n argocd patch secret argocd-secret -p "{\"stringData\": {\"admin.password\": \"$HASH\", \"admin.passwordMtime\": \"$(date +%FT%T%Z)\"}}"
    kubectl -n argocd rollout restart deploy argocd-server
Grafana password:
    kubectl -n monitoring get secret kube-prometheus-stack-grafana -o jsonpath="{.data.admin-password}" | base64 -d; echo

## Monitoring
Grafana built-in dashboards: "Kubernetes / Compute Resources / Namespace (Pods)" (pick namespace animethreads)
and "Node Exporter / Nodes". Imported by hand (Dashboards, New, Import): 15760 (Pods), 15757 (Global),
1860 (Node Exporter Full). Hand-imported dashboards are not stored in git.

## Troubleshooting
| Symptom | Cause | Fix |
|---|---|---|
| Init:ImagePullBackOff | migrator images not pushed | step 1 |
| HPA shows <unknown>, app Degraded | metrics-server missing | kubectl apply -f argocd/metrics-server.yaml |
| "too many open files", flaky pods | inotify limits | step 0 |
| Placeholder product images | catalog not seeded | re-sync app, restart DB services |
| Grafana restarts | memory limit too low | raise limits in monitoring/values.yaml |
| ArgoCD "Too long" CRD error | missing ServerSideApply | keep ServerSideApply=true in the Application |
