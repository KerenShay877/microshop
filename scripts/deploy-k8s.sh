#!/bin/bash
set -euo pipefail

NAMESPACE="microshop"
INGRESS_NAMESPACE="ingress-nginx"

echo "=== Phase 10: Deploying microshop to Kubernetes ==="

# 1. Check prerequisites
echo ">>> Checking prerequisites..."
command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required"; exit 1; }
kubectl cluster-info >/dev/null 2>&1 || { echo "Kubernetes cluster is not reachable. Start minikube first."; exit 1; }

# 2. Enable ingress addon if on minikube
if command -v minikube >/dev/null 2>&1; then
  echo ">>> Enabling minikube ingress addon..."
  minikube addons enable ingress 2>/dev/null || true
fi

# 3. Build images (point Docker to minikube if available)
if command -v minikube >/dev/null 2>&1; then
  echo ">>> Pointing Docker to minikube daemon..."
  eval $(minikube docker-env)
fi

echo ">>> Building Docker images..."
docker build -t microshop/api-gateway:latest -f api-gateway/Dockerfile api-gateway/
docker build -t microshop/auth-service:latest -f services/auth-service/Dockerfile.k8s services/auth-service/
docker build -t microshop/product-service:latest -f services/product-service/Dockerfile.k8s services/product-service/
docker build -t microshop/order-service:latest -f services/order-service/Dockerfile.k8s services/order-service/
docker build -t microshop/inventory-service:latest -f services/inventory-service/Dockerfile.k8s services/inventory-service/
docker build -t microshop/payment-service:latest -f services/payment-service/Dockerfile.k8s services/payment-service/
docker build -t microshop/notification-service:latest -f services/notification-service/Dockerfile services/notification-service/
docker build -t microshop/frontend:latest -f frontend/Dockerfile .

# 4. Deploy everything with kustomize
echo ">>> Deploying Kubernetes manifests..."
kubectl apply -k kubernetes/

# 5. Wait for infrastructure pods
echo ">>> Waiting for infrastructure pods..."
kubectl wait --for=condition=ready pod -l app=postgres -n "$NAMESPACE" --timeout=120s
kubectl wait --for=condition=ready pod -l app=rabbitmq -n "$NAMESPACE" --timeout=120s

# 6. Wait for all pods
echo ">>> Waiting for all pods to be ready..."
kubectl wait --for=condition=ready pod --all -n "$NAMESPACE" --timeout=180s

# 7. Show status
echo ""
echo "=== Deployment Complete ==="
kubectl get pods -n "$NAMESPACE"
echo ""
kubectl get svc -n "$NAMESPACE"

# 8. Print access info
echo ""
echo "=== Access Information ==="
INGRESS_IP=$(kubectl get svc -n "$INGRESS_NAMESPACE" ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
if [ -n "$INGRESS_IP" ]; then
  echo "Add to /etc/hosts: $INGRESS_IP microshop.local"
  echo "Frontend:  http://microshop.local"
  echo "API:       http://microshop.local/api"
  echo "Jaeger UI: kubectl port-forward -n $NAMESPACE svc/jaeger-query 16686:16686"
else
  if command -v minikube >/dev/null 2>&1; then
    echo "Run: minikube tunnel"
    echo "Then add to /etc/hosts: 127.0.0.1 microshop.local"
  fi
  echo "Or use port-forward:"
  echo "  kubectl port-forward -n $NAMESPACE svc/frontend 4000:4000"
  echo "  kubectl port-forward -n $NAMESPACE svc/api-gateway 3000:3000"
fi
